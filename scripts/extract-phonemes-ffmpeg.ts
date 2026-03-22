import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
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
const FINAL_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_extract');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function generateRawWord(word: string, filename: string) {
    console.log(`Generating base word [${word}]...`);
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: `${word}.`,
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const fp = path.join(TEMP_DIR, filename);
    fs.writeFileSync(fp, Buffer.concat(chunks));
    return fp;
}

// ─── 추출기 파라미터 (어떤 단어의 몇 초를 잘라낼 것인가) ───
const EXTRACTIONS = [
    // ig 라임: "igloo" 단어에서 앞부분(ig)만 잘라냄
    { 
        id: 'rime_ig', word: 'igloo', 
        trimStart: 0.0, trimDuration: 0.35, fadeOut: 0.05 
    },
    // 단모음 i: "it" 단어에서 앞 모음만 (0.28초)
    { 
        id: 'core_ih', word: 'it', 
        trimStart: 0.0, trimDuration: 0.28, fadeOut: 0.05 
    },
    // a: "at" 단어에서 앞 모음만
    { 
        id: 'core_ae', word: 'at', 
        trimStart: 0.0, trimDuration: 0.35, fadeOut: 0.05 
    },
    // e: "edge" 단어에서 앞 모음만
    { 
        id: 'core_eh', word: 'edge', 
        trimStart: 0.0, trimDuration: 0.35, fadeOut: 0.05 
    },
    // o: "ox" 단어에서 앞 모음만
    { 
        id: 'core_aw', word: 'ox', 
        trimStart: 0.0, trimDuration: 0.35, fadeOut: 0.05 
    },
    // u: "up" 단어에서 앞 모음만
    { 
        id: 'core_uh', word: 'up', 
        trimStart: 0.0, trimDuration: 0.35, fadeOut: 0.05 
    }
];

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    for (const ex of EXTRACTIONS) {
        try {
            const rawPath = await generateRawWord(ex.word, `${ex.word}_raw.mp3`);
            const finalPath = path.join(FINAL_DIR, `${ex.id}.mp3`);
            
            console.log(`Extracting [${ex.id}] from [${ex.word}]...`);
            // ffmpeg로 자르기: ss(시작), t(길이), afade(페이드아웃)
            const fadeStart = ex.trimDuration - ex.fadeOut;
            const cmd = `ffmpeg -y -i "${rawPath}" -ss ${ex.trimStart} -t ${ex.trimDuration} -af "afade=t=out:st=${fadeStart}:d=${ex.fadeOut}" "${finalPath}"`;
            await execAsync(cmd);
            console.log(`✅ Extracted successfully: ${finalPath}`);
        } catch(e) {
            console.error(`❌ Failed to extract ${ex.id}:`, e);
        }
    }
    console.log('--- DONE ---');
}

main().catch(console.error);
