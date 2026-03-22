import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_ig_tests');
const FINAL_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY not found");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

function getAudioPart(filePath: string) {
    const buf = fs.readFileSync(filePath);
    return {
        inlineData: {
            data: buf.toString("base64"),
            mimeType: "audio/mp3"
        },
    };
}

async function verifyAudio(filePath: string): Promise<{ isGood: boolean, transcript: string }> {
    const prompt = "You are a precise phonetic transcriber. Listen to this very short audio clip. It is supposed to be the short vowel rime 'ig' (pronounced /ɪɡ/, like the end of 'pig'). What exact sounds do you hear? Does it sound like spelling out the letters 'I G' (eye-gee) or does it sound like the pure phoneme 'ig' / 'ick' / 'eg'? Output exactly the word 'EYE_GEE' if it sounds like spelling, or 'PURE_IG' if it sounds like the single short syllable 'ig' / 'ick'.";

    try {
        const result = await model.generateContent([prompt, getAudioPart(filePath)]);
        const response = await result.response;
        const text = response.text().trim().toUpperCase();
        return {
            isGood: text.includes('PURE_IG'),
            transcript: text
        };
    } catch (e) {
        console.error(`Gemini verification failed for ${path.basename(filePath)}:`, e);
        return { isGood: false, transcript: 'ERROR' };
    }
}

async function main() {
    console.log("Listen to 10 generated variations of 'ig' autonomously using Gemini...");
    const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.mp3'));
    
    let bestFile: string | null = null;

    // We only need one good one
    for (const f of files) {
        const fullPath = path.join(TEMP_DIR, f);
        console.log(`Checking ${f}...`);
        const { isGood, transcript } = await verifyAudio(fullPath);
        console.log(` -> Transcript judgement: ${transcript}`);
        
        if (isGood) {
            console.log(`🏆 FOUND PERFECT AUDIO: ${f}`);
            bestFile = fullPath;
            break;
        }
        await new Promise(r => setTimeout(r, 1500)); // rate limit buffer
    }

    if (bestFile) {
        const targetPath = path.join(FINAL_DIR, 'rime_ig.mp3');
        // We add silenceremove to make sure it's completely tight without trailing noise
        const cmd = `ffmpeg -y -i "${bestFile}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB,silenceremove=stop_periods=-1:stop_duration=0:stop_threshold=-40dB" -q:a 2 "${targetPath}"`;
        await execAsync(cmd);
        console.log(`✅ Perfectly verified pure 'ig' saved to: ${targetPath}`);
    } else {
        console.log("❌ All variations failed the automated test or produced 'eye-gee'. Will need to try another strategy loop.");
    }
}

main().catch(console.error);
