import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { curriculum } from '../src/data/curriculum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs', 'audio-qa', 'AUDIO_QA_REPORT.md');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY missing');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (American)
const MODEL_ID = 'eleven_multilingual_v2';

async function parseReport(): Promise<{ word: string, id: string }[]> {
    const report = fs.readFileSync(REPORT_PATH, 'utf-8');
    const lines = report.split('\n');
    const targetWords: { word: string, id: string }[] = [];

    // Skip header lines
    for (const line of lines) {
        if (line.startsWith('|') && !line.includes('단어 | 유닛')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4) {
                const wordText = parts[1];
                const unitId = parts[2];
                const status = parts[3];

                if (status === 'WRONG_PRONUNCIATION' || status === 'MISSING' || status === 'SKIP') {
                    // Find ID from curriculum
                    const unit = curriculum.find(u => u.id === unitId);
                    const wordObj = unit?.words.find(w => w.word === wordText);
                    if (wordObj) {
                        targetWords.push({ word: wordObj.word, id: wordObj.id });
                    }
                }
            }
        }
    }
    return targetWords;
}

async function main() {
    const targets = await parseReport();
    console.log(`🎯 Found ${targets.length} targets to fix/generate.`);

    for (const target of targets) {
        const outPath = path.join(AUDIO_DIR, `${target.id}.mp3`);
        console.log(`🎙️ Processing: ${target.word} (${target.id}.mp3)`);
        
        try {
            const responseStream = await elevenlabs.textToSpeech.stream(VOICE_ID, {
                modelId: MODEL_ID,
                text: target.word.charAt(0).toUpperCase() + target.word.slice(1) + '.',
                voiceSettings: { stability: 0.7, similarityBoost: 0.8, speed: 0.7 }
            });

            const buf = await streamToBuffer(responseStream);
            fs.writeFileSync(outPath, buf);
            console.log(`✅ Success: ${target.word}`);
            await new Promise(r => setTimeout(r, 500)); // Safety gap
        } catch (e) {
            console.error(`❌ Failed: ${target.word}`, e);
        }
    }
    console.log('\n✨ Patching complete!');
}

async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
}

main().catch(console.error);
