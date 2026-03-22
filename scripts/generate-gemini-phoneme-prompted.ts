import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const FINAL_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_gemini_prompted');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 대상 프롬프트 매핑. 
// Gemini 2.5 Pro는 단순 TTS가 아닌 LLM이므로 자연어로 상황을 구체적으로 설명합니다.
const PROMPTS = [
    { 
        id: 'rime_ig', 
        instruction: "You are an English phonics voice actor recording educational audio for a children's app. When asked for a sound, you must utter *only* the requested pure phoneme or rime. Do not hallucinate alphabet letters (for example, do not say 'eye-gee'). Do not speak any other words. Just the pure sound.",
        text: "Please clearly pronounce the short rime sound 'ig', exactly as it sounds at the end of the word 'pig' or 'big' (phonetically /ɪɡ/). Just the sound, nothing else."
    }
];

async function generatePromptedAudio(target: { id: string, instruction: string, text: string }) {
    console.log(`Generating [${target.id}] with system prompts via Gemini LLM TTS...`);
    const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-pro-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        systemInstruction: {
            parts: [{ text: target.instruction }]
        },
        contents: [
            { role: "user", parts: [{ text: target.text }] }
        ],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede"
                    }
                }
            }
        }
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} - ${await res.text()}`);
    }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    
    if (!part?.inlineData) {
        console.error("Full response:", JSON.stringify(data, null, 2));
        throw new Error("No inlineData (AUDIO) found in response.");
    }

    const pcmPath = path.join(TEMP_DIR, `${target.id}_raw.pcm`);
    const mp3Path = path.join(FINAL_DIR, `${target.id}.mp3`);

    fs.writeFileSync(pcmPath, Buffer.from(part.inlineData.data, 'base64'));

    console.log(`Converting [${target.id}] PCM to MP3...`);
    const cmd = `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB,silenceremove=stop_periods=-1:stop_duration=0:stop_threshold=-40dB" -q:a 2 "${mp3Path}"`;
    await execAsync(cmd);
    
    console.log(`✅ Successfully generated and saved to ${mp3Path}`);
    fs.unlinkSync(pcmPath);
}

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    for (const p of PROMPTS) {
        try {
            await generatePromptedAudio(p);
        } catch (e) {
            console.error(`❌ Failed on ${p.id}:`, e);
        }
    }
    console.log('--- DONE ---');
}

main().catch(console.error);
