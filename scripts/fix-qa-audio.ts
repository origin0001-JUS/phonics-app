/**
 * QA Audio Fix Script
 * Generates missing/short audio files found during QA testing.
 *
 * Usage: npx tsx scripts/fix-qa-audio.ts [--dry-run]
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');
const PHONEME_DIR = path.join(AUDIO_DIR, 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const isDryRun = process.argv.includes('--dry-run');

if (!apiKey && !isDryRun) {
    console.error('❌ ELEVENLABS_API_KEY not set in .env.local');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });

const VOICE_RACHEL = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

interface FixJob {
    text: string;
    outputPath: string;
    reason: string;
    speed?: number;
}

const jobs: FixJob[] = [
    // ISSUE-001: tan.mp3 missing (Word Family Builder -an family bonus word)
    {
        text: 'Tan.',
        outputPath: path.join(AUDIO_DIR, 'tan.mp3'),
        reason: 'Missing audio file (404 in Word Family Builder)',
        speed: 0.7,
    },
    // ISSUE-002: core_ih.mp3 too short (0.28s vs 0.65-1.09s for other vowels)
    {
        text: 'ih... ih.',
        outputPath: path.join(PHONEME_DIR, 'core_ih.mp3'),
        reason: 'Too short (0.28s) — regenerating with longer sustained sound',
        speed: 0.5,
    },
];

async function generateAudio(job: FixJob): Promise<void> {
    console.log(`\n🔧 Fix: ${path.basename(job.outputPath)}`);
    console.log(`   Reason: ${job.reason}`);
    console.log(`   Text: "${job.text}"`);

    if (isDryRun) {
        console.log(`   [DRY RUN] Would generate: ${job.outputPath}`);
        return;
    }

    // Backup existing file if present
    if (fs.existsSync(job.outputPath)) {
        const backupPath = job.outputPath.replace('.mp3', '.bak.mp3');
        fs.copyFileSync(job.outputPath, backupPath);
        console.log(`   📦 Backed up existing file to ${path.basename(backupPath)}`);
    }

    try {
        const audioStream = await elevenlabs.textToSpeech.convert(VOICE_RACHEL, {
            text: job.text,
            model_id: MODEL_ID,
            output_format: 'mp3_44100_128',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true,
                speed: job.speed ?? 0.7,
            },
        });

        // Collect stream chunks
        const chunks: Buffer[] = [];
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        fs.writeFileSync(job.outputPath, buffer);
        const sizeKB = (buffer.length / 1024).toFixed(1);
        console.log(`   ✅ Generated: ${path.basename(job.outputPath)} (${sizeKB} KB)`);
    } catch (err) {
        console.error(`   ❌ Failed: ${err}`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  QA Audio Fix — Phonics 300');
    console.log('═══════════════════════════════════════');
    console.log(`  Jobs: ${jobs.length}`);
    console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'GENERATE'}`);

    for (const job of jobs) {
        await generateAudio(job);
        // Rate limiting
        if (!isDryRun) await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
