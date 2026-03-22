/**
 * Veo 3.1 & Gemini Auto-QA Video Generation Script
 * 
 * 1. Generate video using Google Cloud Vertex AI (veo-3.1-fast-generate-001).
 * 2. Auto-QA 1: Use FFmpeg to check if there is exact silence at the start (~0.5s) and end (~0.4s).
 * 3. Auto-QA 2: Send extracted frames to Gemini 1.5 Pro to verify constraints (no text, static camera, straight gaze).
 * 4. If fails, regenerate with stricter prompt additions up to MAX_RETRIES.
 * 
 * Prerequisites:
 *  - gcloud auth application-default login (Done)
 *  - ffmpeg installed on system
 *  - GEMINI_API_KEY in .env.local (for the Vision QA step)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

// Configuration
const PROJECT_ID = 'project-d91a769d-4625-421c-bfd'; 
const LOCATION = 'us-central1'; 
const VEO_MODEL_ID = 'veo-3.1-fast-generate-001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const TARGET_WORDS = ['thin', 'whale', 'chip', 'fork'];
const SEED_IMAGE_PATH = path.join(PROJECT_ROOT, 'out', 'assets', 'video', 'seed_final.jpeg');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'video_samples_veo');
const TEMP_DIR = path.join(PROJECT_ROOT, 'tmp', 'veo_qa');
const MAX_RETRIES = 3;

// Vertex AI auth
const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function callVeoAPI(prompt: string, seedImageBase64: string, retryWarnings: string = ''): Promise<string> {
    const finalPrompt = prompt + (retryWarnings ? `\n\nCRITICAL FIX FROM PREVIOUS ATTEMPT: ${retryWarnings}` : '');
    console.log(`\n  🤖 Sending prompt to Veo:\n     "${finalPrompt.substring(0, 100)}..."`);
    
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${VEO_MODEL_ID}:predictLongRunning`;

    const body = {
        instances: [
            {
                prompt: finalPrompt,
                image: {
                    mimeType: 'image/jpeg',
                    bytesBase64Encoded: seedImageBase64
                }
            }
        ],
        parameters: {
            sampleCount: 1, 
        }
    };

    console.log(`     [API] Submitting LongRunning task using generic REST...`);
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Veo API Submit Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const operationName = data.name;

    if (!operationName) {
        throw new Error(`Failed to start LongRunning operation. Response: ${JSON.stringify(data)}`);
    }
    
    console.log(`     [API] Operation started. Name: ${operationName}`);
    console.log(`     [API] Waiting for video generation (can take 2-5 minutes)...`);

    // Poll the operation
    let isDone = false;
    let base64Video = null;
    let pollCount = 0;

    while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 15000)); // Poll every 15s
        pollCount++;
        
        // Publisher LROs poll cleanly at v1/${operationName}
        const pollEndpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;
        
        const pollResponse = await fetch(pollEndpoint, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!pollResponse.ok) {
            const errText = await pollResponse.text();
            // Ignore 404 Not Found as propagation delay if it's recent
            if (pollResponse.status === 404 && pollCount < 10) {
                console.log(`     [API] Checking status (404 - still propagating)...`);
                continue;
            }
            throw new Error(`Veo API Polling Error (${pollResponse.status}): ${errText}`);
        }

        const pollData = await pollResponse.json();
        
        if (pollData.error) {
            throw new Error(`Veo Server Error: ${JSON.stringify(pollData.error)}`);
        }

        if (pollData.done) {
            isDone = true;
            console.log(`     [API] Generation complete! Extracting bytes...`);
            base64Video = pollData.response?.predictions?.[0]?.bytesBase64Encoded 
                          || pollData.response?.predictions?.[0];
        } else {
            process.stdout.write(`.`); // silent ticking
        }
    }


    if (!base64Video || typeof base64Video !== 'string') {
        throw new Error('No valid video Base64 returned from parsed Veo API response');
    }

    const tempPath = path.join(TEMP_DIR, `temp_${crypto.randomBytes(4).toString('hex')}.mp4`);
    fs.writeFileSync(tempPath, Buffer.from(base64Video, 'base64'));
    return tempPath;
}

// ----------------------------------------------------------------------------
// QA STEP 1: FFmpeg Audio Silence Detection
// ----------------------------------------------------------------------------
async function verifyAudioSilence(videoPath: string): Promise<{ passed: boolean, reason?: string }> {
    try {
        console.log(`  🔍 [QA 1] Analyzing audio silence durations via FFmpeg...`);
        // Use silencedetect filter. noise tolerance -30dB, minimum 0.1s
        const cmd = `ffmpeg -i "${videoPath}" -af silencedetect=noise=-30dB:d=0.1 -f null - 2>&1`;
        const { stderr } = await execAsync(cmd);
        
        // Parse ffmpeg output for silence start/end times
        // Format: [silencedetect @ 0x...] silence_start: 0
        // Format: [silencedetect @ 0x...] silence_end: 0.512 | silence_duration: 0.512
        const silenceEnds = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));
        const durations = [...stderr.matchAll(/silence_duration: ([\d.]+)/g)].map(m => parseFloat(m[1]));
        const totalDurationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):([\d.]+)/);
        
        if (durations.length === 0) {
            return { passed: false, reason: "No silence detected at all. Audio is continuous." };
        }

        const firstSilenceEnd = silenceEnds[0];
        const lastSilenceStart = silenceEnds[silenceEnds.length - 1] - durations[durations.length - 1];
        
        // Check front (0.5s approx tolerance: 0.4 - 0.7)
        if (firstSilenceEnd < 0.3 || firstSilenceEnd > 0.8) {
            return { passed: false, reason: `Initial silence expects ~0.5s but got ${firstSilenceEnd}s.` };
        }

        // We assume last silence is trailing silence. 
        if (totalDurationMatch) {
             const h = parseFloat(totalDurationMatch[1]);
             const m = parseFloat(totalDurationMatch[2]);
             const s = parseFloat(totalDurationMatch[3]);
             const videoEnd = h*3600 + m*60 + s;
             
             const trailingDuration = videoEnd - lastSilenceStart;
             if (trailingDuration < 0.2 || trailingDuration > 0.8) {
                 return { passed: false, reason: `Trailing silence expects ~0.4s but got ${trailingDuration}s.` };
             }
        }

        return { passed: true };
    } catch (err) {
        // If no audio stream or ffmpeg fails
        return { passed: false, reason: "FFmpeg silence detection failed. Does the video have audio?" };
    }
}

// ----------------------------------------------------------------------------
// QA STEP 2: Gemini Vision Visual Check
// ----------------------------------------------------------------------------
async function verifyVisualsWithGemini(videoPath: string): Promise<{ passed: boolean, reason?: string }> {
    try {
        console.log(`  🔍 [QA 2] Extracting frames for visual inspection by Gemini Vision...`);
        // Extract 3 frames (10%, 50%, 90% of video)
        const frameDir = path.join(TEMP_DIR, 'frames_' + crypto.randomBytes(4).toString('hex'));
        fs.mkdirSync(frameDir, { recursive: true });
        
        await execAsync(`ffmpeg -i "${videoPath}" -vf "select=not(mod(n\\,10))" -vframes 5 "${frameDir}/frame_%d.jpg"`);
        
        // Read the first frame and middle frame to compare
        const frames = fs.readdirSync(frameDir).filter(f => f.endsWith('.jpg')).map(f => path.join(frameDir, f));
        if (frames.length < 2) return { passed: false, reason: "Could not extract enough frames." };

        const inlineData = frames.map(fp => {
            return {
                inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(fp).toString('base64') }
            };
        });

        const prompt = `You are a strict QA inspector for a pronunciation video. I have extracted frames from the generated video. 
Please inspect these frames carefully. 
1. Is there ANY text, subtitle, or watermark overlay on the video? (Must be strictly NO)
2. Has the camera angle or framing moved/panned compared to the original composition, or does it look completely static? (Must be completely static)
3. Is the subject looking straight ahead and matching the appearance of an American female in her early 20s? (Must be YES)

Return your answer strictly in JSON format like this: 
{"passed": true_or_false, "failure_reason": "If failed, highly concrete instruction to give to the video AI generator next to fix the issue."}
Without any markdown formatting.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, ...inlineData] }]
            })
        });

        const data = await response.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanedText);

        return {
            passed: result.passed,
            reason: result.failure_reason
        };
    } catch (err: any) {
        return { passed: false, reason: `Vision QA failed or crashed: ${err.message}` };
    }
}

// ----------------------------------------------------------------------------
// Main Auto-QA Loop
// ----------------------------------------------------------------------------
async function generateAndVerifyWord(word: string) {
    console.log(`\n======================================================`);
    console.log(`🎬 Target Word: ${word}`);
    console.log(`======================================================`);

    const finalPath = path.join(OUTPUT_DIR, `${word}.mp4`);
    if (fs.existsSync(finalPath)) {
        console.log(`✅ ${word}.mp4 already exists. Skipping.`);
        return;
    }

    const seedImageBase64 = fs.readFileSync(SEED_IMAGE_PATH).toString('base64');
    let retryWarnings = '';
    
    // Base Prompt
    const basePrompt = `Generate a pronunciation video for the English word "${word}". 
CRITICAL CONSTRAINTS:
1. No text, no subtitles, no UI layers, no graphics over the video. Pure video ONLY.
2. Timing: Exactly 0.5 seconds of silence/stillness at the start, then slowly and clearly pronouncing the word "${word}", followed by exactly 0.4 seconds of silence/stillness at the end.
3. Static camera. The camera MUST NOT move, pan, or zoom under any circumstances.
4. The subject must look straight ahead at the camera naturally and pronounce the word extremely slowly and clearly.
5. The pronunciation, mouth movements, and lip-sync must PERFECTLY match a standard native American English speaker.
6. The subject is a female in her early 20s (matching the provided seed image exactly).`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`\n⏳ Attempt ${attempt}/${MAX_RETRIES} for "${word}"...`);
        let tempVideoPath: string | null = null;
        
        try {
            tempVideoPath = await callVeoAPI(basePrompt, seedImageBase64, retryWarnings);
            
            // Perform QA 1 (Audio)
            /* 
               Note: Veo models often return video without audio if prompt isn't perfect, 
               or audio might lack metadata. We wrapped it in try-catch.
            */
            const audioQa = await verifyAudioSilence(tempVideoPath);
            if (!audioQa.passed) {
                console.log(`   ❌ [QA 1 Failed]: ${audioQa.reason}`);
                retryWarnings = `Audio Timing Error: ${audioQa.reason}. You MUST include 0.5s initial silence and 0.4s trailing silence.`;
                continue; // Regenerate
            } else {
                console.log(`   ✅ [QA 1 Passed]: Audio timing ok.`);
            }

            // Perform QA 2 (Visuals)
            const visualQa = await verifyVisualsWithGemini(tempVideoPath);
            if (!visualQa.passed) {
                console.log(`   ❌ [QA 2 Failed]: ${visualQa.reason}`);
                retryWarnings = `Visual Error: ${visualQa.reason}. You MUST strictly follow the camera and text-less constraints.`;
                continue; // Regenerate
            } else {
                console.log(`   ✅ [QA 2 Passed]: Visual constraints ok.`);
            }

            // If we got here, all QA passed!
            fs.copyFileSync(tempVideoPath, finalPath);
            console.log(`\n🎉 [SUCCESS] Final video saved: ${finalPath}`);
            return; // Move to next word

        } catch (err: any) {
             console.error(`   ⚠️ Generation API Error: ${err.message}`);
             // If Vertex AI throws 500 or timeout, we just retry
             await new Promise(r => setTimeout(r, 5000));
        } finally {
            if (tempVideoPath && fs.existsSync(tempVideoPath)) {
                // fs.unlinkSync(tempVideoPath);
            }
        }
    }

    console.log(`\n❌ [FAILED] Exceeded ${MAX_RETRIES} attempts for "${word}".`);
}

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const word of TARGET_WORDS) {
        await generateAndVerifyWord(word);
    }
}

main().catch(console.error);
