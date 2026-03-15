import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    console.error('❌ Error: ELEVENLABS_API_KEY is not set.');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });
const MODEL_ID = 'eleven_turbo_v2_5'; // Supports multiple languages including Korean
// Using Rachel voice from the existing script for consistency
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

async function main() {
    const text = "안녕! 나는 파닉스 히어로 폭시야. 같이 영어 읽기를 배워볼까?";
    const filename = "foxy_hello_ko.mp3";
    const outputPath = path.join(AUDIO_DIR, filename);

    console.log(`Generating ${filename}...`);
    try {
        const responseStream = await elevenlabs.textToSpeech.stream(VOICE_ID, {
            model_id: MODEL_ID,
            text,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        });

        const chunks: Buffer[] = [];
        for await (const chunk of responseStream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }

        fs.writeFileSync(outputPath, Buffer.concat(chunks));
        console.log(`✅ Success: Generated ${filename} at ${outputPath}`);
    } catch (e) {
        console.error('❌ Generation Failed:', e);
    }
}

main().catch(console.error);
