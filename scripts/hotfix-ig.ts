import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PHONEME_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function fixIg() {
    console.log('Regenerating rime_ig.mp3 using the EXACT text "ig." ...');
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: 'ig.', 
        voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(path.join(PHONEME_DIR, 'rime_ig.mp3'), Buffer.concat(chunks));
    console.log('✅ rime_ig.mp3 fixed specifically with "ig." prompt!');
}

fixIg().catch(console.error);
