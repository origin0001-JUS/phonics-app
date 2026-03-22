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
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_ig_tests');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_MONO = 'eleven_monolingual_v1';

async function generateWithEleven(text: string, filename: string) {
    console.log(`Generating [${text}] -> ${filename}`);
    // 약간의 랜덤성을 위해 안정성을 살짝 낮춤으로써 '익' 발음이 나올 확률을 높임
    const responseStream = await elevenlabs.textToSpeech.stream(VOICE_CHARLOTTE, {
        model_id: MODEL_MONO,
        text: text,
        voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 0.7 }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const fp = path.join(TEMP_DIR, filename);
    fs.writeFileSync(fp, Buffer.concat(chunks));
}

async function main() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    // "ig." 이전에 사용자가 '익'으로 들었던 철자를 5번 연속 생성하여 랜덤 확률로 완벽한 '익'을 뽑아냅니다.
    // 추가로 ihg. 철자도 테스트합니다.
    const prompts = [
        { text: 'ig.', prefix: 'ig_dot' },
        { text: 'ihg.', prefix: 'ihg_dot' }
    ];

    for (const p of prompts) {
        for (let i = 1; i <= 5; i++) {
            await generateWithEleven(p.text, `${p.prefix}_v${i}.mp3`);
        }
    }
    console.log('--- ALL DONE ---');
    console.log(`Temp files saved in ${TEMP_DIR}`);
}

main().catch(console.error);
