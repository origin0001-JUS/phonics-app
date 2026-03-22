/**
 * Google Gemini API (Veo 3.1) - Pronunciation Video Sample Generator
 * 
 * Target Words: thin, whale, chip, fork
 * Model: veo-3.1 (or latest applicable Veo model via Gemini API)
 * Seed Image: out/assets/video/seed_final.jpeg
 * Constraints:
 *   - Absolute static camera
 *   - 0.5s initial silence, slow/clear pronunciation, 0.4s trailing silence
 *   - No text, no subtitles, no layers
 *   - American early 20s female protagonist
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load API Keys
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// User specified "veo3.1". The exact API name might vary depending on Vertex/AI Studio access.
const VEO_MODEL_ID = 'veo-3.1-generate'; // Placeholder for the actual Veo model endpoint

const TARGET_WORDS = ['thin', 'whale', 'chip', 'fork'];
const SEED_IMAGE_PATH = path.join(PROJECT_ROOT, 'out', 'assets', 'video', 'seed_final.jpeg');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'video_samples_veo');

async function generateVeoVideo(word: string): Promise<void> {
    const outputPath = path.join(OUTPUT_DIR, `${word}.mp4`);

    if (fs.existsSync(outputPath)) {
        console.log(`⏩ [${word}] Sample already exists. Skipping.`);
        return;
    }

    console.log(`🎬 Generating Veo video for: ${word}...`);
    
    // Read seed image as base64
    if (!fs.existsSync(SEED_IMAGE_PATH)) {
        throw new Error(`Seed image not found at ${SEED_IMAGE_PATH}`);
    }
    const seedImageBase64 = fs.readFileSync(SEED_IMAGE_PATH).toString('base64');

    // Strict prompt handling user constraints
    const prompt = `Generate a pronunciation video for the English word "${word}". 
CRITICAL CONSTRAINTS:
1. No text, no subtitles, no UI layers, no graphics over the video. Pure video ONLY.
2. Timing: Exactly 0.5 seconds of silence/stillness at the start, then slowly and clearly pronouncing the word "${word}", followed by exactly 0.4 seconds of silence/stillness at the end.
3. Static camera. The camera MUST NOT move, pan, or zoom under any circumstances.
4. The subject must look straight ahead at the camera naturally and pronounce the word extremely slowly and clearly.
5. The pronunciation, mouth movements, and lip-sync must PERFECTLY match a standard native American English speaker.
6. The subject is a female in her early 20s (matching the provided seed image exactly). Ensure the voice perfectly matches a clear, standard American young female voice.`;

    // Note: The structure below is a generic representation for Gemini Multimodal / Veo endpoints.
    // If you are using Vertex AI, the endpoint and payload structure (like model parameter) might be different.
    try {
        console.log(`   ⏳ Sending request to API...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL_ID}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: seedImageBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    // Specific Veo generation configs could go here (duration, aspect ratio, fps)
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        
        // Extract video blob from response
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const base64Video = part?.blob?.data || part?.inlineData?.data;

        if (!base64Video) {
            console.error(`❌ [${word}] Model returned invalid or no video blob. Data:`, JSON.stringify(data).substring(0, 300));
            return;
        }

        fs.writeFileSync(outputPath, Buffer.from(base64Video, 'base64'));
        console.log(`✅ [${word}] Successfully generated and saved to ${outputPath}`);
    } catch (err: any) {
        console.error(`❌ [${word}] Failed: ${err.message}`);
    }
}

async function main() {
    if (!API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local!");
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log("🚀 Starting Veo 3.1 Video Sample Generation...");
    console.log(`📍 Output Directory: ${OUTPUT_DIR}`);
    console.log(`📸 Seed Image: ${SEED_IMAGE_PATH}`);
    console.log("───────────────────────────────────────────────────");

    for (const word of TARGET_WORDS) {
        await generateVeoVideo(word);
        // Delay to respect potential rate limits
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log("───────────────────────────────────────────────────");
    console.log("🎉 Video sample generation script finished.");
}

main().catch(console.error);
