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
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_gemini');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 문제가 되었던 발음들 (ig 라임, 주요 단모음들)
const GEMINI_TARGETS = [
    { id: 'rime_ig', text: 'ig' },
    { id: 'core_ih', text: 'ih' },
    { id: 'core_ae', text: 'a' },
    { id: 'core_eh', text: 'e' },
    { id: 'core_aw', text: 'o' },
    { id: 'core_uh', text: 'u' }
];

async function generateWithGemini(target: { id: string, text: string }) {
    console.log(`Generating [${target.id}] with text "${target.text}" via Gemini TTS...`);
    const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-pro-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: target.text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede" // Female voice, clear and professional
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
        throw new Error("No inlineData (AUDIO) found in response.");
    }

    const pcmPath = path.join(TEMP_DIR, `${target.id}.pcm`);
    const mp3Path = path.join(FINAL_DIR, `${target.id}.mp3`);

    // 1. Save raw PCM data
    const buffer = Buffer.from(part.inlineData.data, 'base64');
    fs.writeFileSync(pcmPath, buffer);

    // 2. Convert PCM (16-bit little-endian, 24kHz, Mono) to MP3 using ffmpeg
    // Gemini 2.5 Live/TTS outputs raw audio typically as 24kHz PCM
    console.log(`Converting [${target.id}] PCM to MP3...`);
    const cmd = `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -q:a 2 "${mp3Path}"`;
    await execAsync(cmd);
    
    console.log(`✅ Successfully generated and saved to ${mp3Path}`);
    fs.unlinkSync(pcmPath); // Cleanup temp file
}

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    for (const target of GEMINI_TARGETS) {
        try {
            await generateWithGemini(target);
            await new Promise(r => setTimeout(r, 1000)); // Respect rate limits
        } catch (e) {
            console.error(`❌ Failed on ${target.id}:`, e);
        }
    }
    console.log('--- All Gemini TTS Generatons Done ---');
}

main().catch(console.error);
