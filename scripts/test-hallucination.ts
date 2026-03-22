import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'test_hallucinations');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';

// 영문 전용 모델 사용 (다국어 모델의 엉뚱한 언어 해석을 완전 차단)
const MODEL_MONO = 'eleven_monolingual_v1';

const TESTS = [
    // 1. "ig" rime test
    { name: 'ig_mono_1', text: 'igg.' },
    { name: 'ig_mono_2', text: 'ig.' },
    { name: 'ig_mono_3', text: 'i g.' },
    
    // 2. "/ɪ/" phoneme test (short i)
    { name: 'ih_mono_1', text: 'ih.' },
    { name: 'ih_mono_2', text: 'ihh.' },
    { name: 'ih_mono_3', text: 'ihhhh.' },
    { name: 'i_mono_4', text: 'i.' },
    
    // 3. What if we use another phonetic spelling?
    { name: 'ih_mono_5', text: 'it, ih.' }
];

async function main() {
    if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

    console.log('Generating hallucination tests in Mono model...');
    for (const test of TESTS) {
        console.log(`Generating ${test.name}.mp3 with text: "${test.text}"`);
        try {
            const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
                model_id: MODEL_MONO,
                text: test.text,
                voice_settings: { stability: 0.7, similarity_boost: 0.8, speed: 0.7 }
            });

            const chunks: Buffer[] = [];
            for await (const chunk of responseStream) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            fs.writeFileSync(path.join(TEST_DIR, `${test.name}.mp3`), Buffer.concat(chunks));
            await new Promise(r => setTimeout(r, 200));
        } catch(e) {
            console.error(`Failed on ${test.name}:`, e);
        }
    }
    console.log('✅ Hallucination tests generated in public/assets/audio/test_hallucinations/');
    console.log('Please listen to them and tell me which ones sound like the correct English short i and ig sounds!');
}

main().catch(console.error);
