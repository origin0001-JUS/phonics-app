import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'test_phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_ID = 'eleven_multilingual_v2';

const TESTS = [
    { name: 'ih_lower', text: 'ih.' },
    { name: 'ihh_lower', text: 'ihh.' },
    { name: 'ihhhh', text: 'ihhhh.' },
    { name: 'ih_comma', text: 'ih, ih.' },
    { name: 'e_short', text: 'e.' },
    { name: 'short_i_word', text: 'it, ih.' }
];

async function main() {
    if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

    for (const test of TESTS) {
        console.log(`Generating ${test.name}.mp3 with text: "${test.text}"`);
        const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
            model_id: MODEL_ID,
            text: test.text,
            voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
        });

        const chunks: Buffer[] = [];
        for await (const chunk of responseStream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        fs.writeFileSync(path.join(TEST_DIR, `${test.name}.mp3`), Buffer.concat(chunks));
    }
    console.log('✅ Tests generated in public/assets/audio/test_phonemes/');
}

main().catch(console.error);
