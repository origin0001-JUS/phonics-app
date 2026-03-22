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
const PHONEME_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function generateAndTrimShortI() {
    console.log('Generating "it" for short i extraction...');
    const tempPath = path.join(PHONEME_DIR, 'temp_it.mp3');
    const finalPath = path.join(PHONEME_DIR, 'core_ih.mp3');

    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: 'it.',
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(tempPath, Buffer.concat(chunks));

    console.log('Trimming "it" to extract pure /ɪ/ sound...');
    // Extract first 0.25 seconds, add a 0.05s fade out
    await execAsync(`ffmpeg -y -i "${tempPath}" -af "afade=t=out:st=0.20:d=0.05" -t 0.25 "${finalPath}"`);
    fs.unlinkSync(tempPath);
    console.log('✅ core_ih.mp3 perfectly extracted!');
}

async function fixIgAndRimes() {
    // Regenerate ig just to be sure
    console.log('Regenerating rime_ig.mp3 using Mono model...');
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: 'igg.', // Or 'ig.', user said 2 ('ig.') works! 
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(path.join(PHONEME_DIR, 'rime_ig.mp3'), Buffer.concat(chunks));
    console.log('✅ rime_ig.mp3 fixed!');
}

async function main() {
    await generateAndTrimShortI();
    // We will use generate-phoneme-tts.ts to do a FULL run but I need to modify it first to use MONO model.
    await fixIgAndRimes();
}

main().catch(console.error);
