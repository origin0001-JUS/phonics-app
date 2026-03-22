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
    const fp = path.join(TEMP_DIR, filename);
    if (fs.existsSync(fp)) {
        console.log(`[${filename}] already exists in temp.`);
        return fp;
    }
    console.log(`Generating base word [${word}] with ElevenLabs...`);
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: `${word}.`,
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(fp, Buffer.concat(chunks));
    return fp;
}

// "big" 발음 0.6초 중 앞의 "b"(약 0.1초~0.15초)를 날리고 나머지만 취한다.
const CUT_POINTS = [0.08, 0.10, 0.12, 0.15];

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    const rawPath = await generateRawWord('big', 'big_raw.mp3');

    // 1. Create tests for different cut points so we can pick the best
    for (const start of CUT_POINTS) {
        const testPath = path.join(TEMP_DIR, `rime_ig_test_${start}.mp3`);
        // We cut from 'start' to the end (duration roughly 0.4s)
        const cmd = `ffmpeg -y -i "${rawPath}" -ss ${start} -t 0.4 -af "afade=t=out:st=0.35:d=0.05" "${testPath}"`;
        await execAsync(cmd);
        console.log(`Test generated: rime_ig_test_${start}.mp3`);
    }

    // 2. To be safe, let's just make 0.12s the default rime_ig.mp3 for the app (usually the sweet spot for plosive b)
    const finalPath = path.join(FINAL_DIR, 'rime_ig.mp3');
    const finalCmd = `ffmpeg -y -i "${rawPath}" -ss 0.12 -t 0.4 -af "afade=t=out:st=0.35:d=0.05" "${finalPath}"`;
    await execAsync(finalCmd);
    console.log(`✅ Default rime_ig.mp3 applied to app using 0.12s cut from 'big'.`);

    console.log('--- DONE ---');
}

main().catch(console.error);
