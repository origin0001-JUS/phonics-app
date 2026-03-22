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
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_igloo_tests');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function generateRawIgloo() {
    const fp = path.join(TEMP_DIR, 'igloo_raw.mp3');
    if (fs.existsSync(fp)) return fp;

    console.log(`Generating base word [igloo] with ElevenLabs...`);
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: `igloo.`,
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(fp, Buffer.concat(chunks));
    return fp;
}

const CUT_DURATIONS = [0.20, 0.22, 0.25, 0.28, 0.30];

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    const rawPath = await generateRawIgloo();

    // 1. Create tests for different end cut points
    for (const duration of CUT_DURATIONS) {
        const testPath = path.join(TEMP_DIR, `rime_ig_igloo_${duration}.mp3`);
        // We cut from start (0.0) up to 'duration'. Fade out the last 0.05s to avoid clicks.
        const fadeStart = duration - 0.05;
        const cmd = `ffmpeg -y -i "${rawPath}" -ss 0.0 -t ${duration} -af "afade=t=out:st=${fadeStart}:d=0.05" "${testPath}"`;
        await execAsync(cmd);
        console.log(`Test generated: rime_ig_igloo_${duration}.mp3`);
    }

    // 2. 0.25초가 "이그"에서 "l"로 넘어가기 직전의 골든타임일 확률이 높으므로 이를 기본값으로 덮어씌웁니다.
    // 기존 0.35초는 "l" 소리가 들릴만큼 길었습니다.
    const finalPath = path.join(FINAL_DIR, 'rime_ig.mp3');
    const finalCmd = `ffmpeg -y -i "${rawPath}" -ss 0.0 -t 0.25 -af "afade=t=out:st=0.20:d=0.05" "${finalPath}"`;
    await execAsync(finalCmd);
    console.log(`✅ Default rime_ig.mp3 applied to app using 0.25s cut from 'igloo'.`);

    console.log('--- DONE ---');
}

main().catch(console.error);
