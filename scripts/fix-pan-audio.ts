import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY missing');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (American)
const MODEL_ID = 'eleven_multilingual_v2';

async function main() {
    const target = { word: 'pan', id: 'pan' };
    const outPath = path.join(AUDIO_DIR, `pan.mp3`);
    
    console.log(`🎙️  Regenerating: ${target.word} (pan.mp3)`);
    
    try {
        const responseStream = await elevenlabs.textToSpeech.stream(VOICE_ID, {
            modelId: MODEL_ID,
            text: 'Pan.', // 또박또박 발음 유도
            voiceSettings: { stability: 0.8, similarityBoost: 0.8, speed: 0.7 }
        });

        const buf = await streamToBuffer(responseStream);
        fs.writeFileSync(outPath, buf);
        console.log(`✅ Success: ${target.word} has been updated.`);
    } catch (e) {
        console.error(`❌ Failed: ${target.word}`, e);
    }
}

async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
}

main().catch(console.error);
