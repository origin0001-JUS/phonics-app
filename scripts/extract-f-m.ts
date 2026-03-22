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
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_consonants');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function generateRaw(word: string, filename: string) {
    const fp = path.join(TEMP_DIR, filename);
    if (fs.existsSync(fp)) return fp;

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

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

    // 1. Extract pure "f" from "fox"
    // Fricative sound usually lasts 0.15s - 0.20s before the vowel 'o' starts.
    const fRaw = await generateRaw('fox', 'fox_raw.mp3');
    const fTarget = path.join(FINAL_DIR, 'onset_f.mp3');
    // cut 0.0 to 0.16, fade out last 0.05s
    const fCmd = `ffmpeg -y -i "${fRaw}" -ss 0.0 -t 0.16 -af "afade=t=out:st=0.11:d=0.05" -q:a 2 "${fTarget}"`;
    await execAsync(fCmd);
    console.log(`✅ Extracted pure /f/ from fox to ${fTarget}`);

    // 2. Extract pure "m" from "mom"
    // Nasal sound lasts around 0.15s before the vowel.
    const mRaw = await generateRaw('mom', 'mom_raw.mp3');
    const mTarget = path.join(FINAL_DIR, 'onset_m.mp3');
    // cut 0.0 to 0.15, fade out last 0.05s
    const mCmd = `ffmpeg -y -i "${mRaw}" -ss 0.0 -t 0.15 -af "afade=t=out:st=0.10:d=0.05" -q:a 2 "${mTarget}"`;
    await execAsync(mCmd);
    console.log(`✅ Extracted pure /m/ from mom to ${mTarget}`);

    console.log('--- DONE ---');
}

main().catch(console.error);
