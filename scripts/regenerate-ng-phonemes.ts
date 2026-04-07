/**
 * Regenerate NG Phonemes using Gemini 2.5 Flash TTS
 *
 * Usage:
 *   npx tsx scripts/regenerate-ng-phonemes.ts                  # all 78
 *   npx tsx scripts/regenerate-ng-phonemes.ts core_th rime_ee  # specific IDs
 *   npx tsx scripts/regenerate-ng-phonemes.ts --dry-run        # show prompts only
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ngPhonemes, type NgPhonemeEntry } from './ng-phoneme-data.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PHONEMES_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes_backup');
const TEMP_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'temp_regen');
const RESULT_PATH = path.join(PROJECT_ROOT, 'scripts', 'regen-result.json');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 1000;

// ─── System Instruction ───────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are an American English phonics instructor recording isolated sound segments for a children's phonics learning app.
You are a native American English-speaking adult woman.
CRITICAL RULES:
1. You are recording PHONICS SOUNDS, not reading words or sentences.
2. Each sound is an isolated phoneme or syllable pattern used in phonics education.
3. Produce ONLY the requested sound — no extra words, letters, or explanations.
4. Use standard American English pronunciation (General American accent).
5. Speak clearly and at a moderate pace, as if demonstrating to a young student.
6. Do NOT interpret the text as a word to read. It is a phonics notation.
7. Hold continuous sounds (like vowels and fricatives) for about 0.5-0.8 seconds.
8. For stop consonants (p, b, t, d, k, g), produce a brief clean burst.`;

// ─── Prompt Builders ──────────────────────────────────────────────────

function buildCorePrompt(entry: NgPhonemeEntry): string {
  const examples = entry.exampleWords.map(w => `"${w}"`).join(', ');
  return `Produce the isolated phonics sound /${entry.ipa}/ (written as "${entry.phoneme}" in English phonics).
This is the ${entry.soundPosition.toLowerCase()}.
For reference, this is the sound you hear in words like ${examples}.
Produce ONLY this isolated sound. Do not say any words or letters.`;
}

function buildOnsetPrompt(entry: NgPhonemeEntry): string {
  const examples = entry.exampleWords.map(w => `"${w}"`).join(', ');
  return `Produce the isolated phonics onset sound /${entry.ipa}/ (written as "${entry.phoneme}" in English phonics).
This is the ${entry.soundPosition.toLowerCase()}.
For reference, this is the initial sound you hear at the beginning of words like ${examples}.
Produce ONLY this isolated consonant onset sound. Do not say any full words or letter names.`;
}

function buildRimePrompt(entry: NgPhonemeEntry): string {
  const examples = entry.exampleWords.map(w => `"${w}"`).join(', ');
  return `Produce the isolated phonics rime sound /${entry.ipa}/ (written as "${entry.phoneme}" in English phonics).
This is a rime pattern — the vowel-plus-ending part of a syllable. It is the ${entry.soundPosition.toLowerCase()}.
For reference, this is the ending sound you hear in words like ${examples}.
Produce ONLY this isolated rime syllable. Do not say any full words, spell any letters, or add explanations.`;
}

function buildPrompt(entry: NgPhonemeEntry): string {
  switch (entry.type) {
    case 'core': return buildCorePrompt(entry);
    case 'onset': return buildOnsetPrompt(entry);
    case 'rime': return buildRimePrompt(entry);
  }
}

// ─── API Call ─────────────────────────────────────────────────────────

async function callGeminiTTS(entry: NgPhonemeEntry): Promise<Buffer> {
  const prompt = buildPrompt(entry);

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      { role: 'user', parts: [{ text: prompt }] },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore',
          },
        },
      },
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

  if (!part?.inlineData) {
    throw new Error(`No audio in response: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return Buffer.from(part.inlineData.data, 'base64');
}

// ─── Post-processing ──────────────────────────────────────────────────

async function pcmToMp3(pcmPath: string, mp3Path: string): Promise<void> {
  const cmd = `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB,silenceremove=stop_periods=-1:stop_duration=0:stop_threshold=-40dB" -q:a 2 "${mp3Path}"`;
  await execAsync(cmd);
}

// ─── Backup ───────────────────────────────────────────────────────────

function backupExisting(id: string): void {
  const src = path.join(PHONEMES_DIR, `${id}.mp3`);
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const dest = path.join(BACKUP_DIR, `${id}.mp3`);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`  Backed up ${id}.mp3`);
  }
}

// ─── Sleep ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────

interface RegenResult {
  id: string;
  status: 'ok' | 'failed' | 'skipped';
  error?: string;
  prompt?: string;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificIds = args.filter(a => !a.startsWith('--'));

  // Filter targets
  let targets: NgPhonemeEntry[];
  if (specificIds.length > 0) {
    targets = ngPhonemes.filter(p => specificIds.includes(p.id));
    const found = targets.map(t => t.id);
    const notFound = specificIds.filter(id => !found.includes(id));
    if (notFound.length > 0) {
      console.error(`Unknown IDs: ${notFound.join(', ')}`);
      process.exit(1);
    }
  } else {
    targets = [...ngPhonemes];
  }

  console.log(`\n=== Regenerate NG Phonemes ===`);
  console.log(`Targets: ${targets.length} phonemes`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (prompts only)' : 'LIVE (API calls)'}\n`);

  if (!dryRun && !GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in .env.local');
    process.exit(1);
  }

  // Ensure dirs
  if (!dryRun) {
    for (const dir of [PHONEMES_DIR, TEMP_DIR]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  const results: RegenResult[] = [];

  for (let i = 0; i < targets.length; i++) {
    const entry = targets[i];
    const prompt = buildPrompt(entry);

    console.log(`[${i + 1}/${targets.length}] ${entry.id} (${entry.type}, /${entry.ipa}/)`);

    if (dryRun) {
      console.log(`  System: (${SYSTEM_INSTRUCTION.length} chars)`);
      console.log(`  Prompt: ${prompt}\n`);
      results.push({ id: entry.id, status: 'skipped', prompt });
      continue;
    }

    // Backup existing file
    backupExisting(entry.id);

    let success = false;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`  Retry ${attempt}/${MAX_RETRIES}...`);
          await sleep(RETRY_DELAY_MS);
        }

        const pcmBuffer = await callGeminiTTS(entry);
        const pcmPath = path.join(TEMP_DIR, `${entry.id}_raw.pcm`);
        const mp3Path = path.join(PHONEMES_DIR, `${entry.id}.mp3`);

        fs.writeFileSync(pcmPath, pcmBuffer);
        await pcmToMp3(pcmPath, mp3Path);

        // Clean up temp PCM
        if (fs.existsSync(pcmPath)) fs.unlinkSync(pcmPath);

        const stats = fs.statSync(mp3Path);
        console.log(`  OK (${(stats.size / 1024).toFixed(1)} KB)`);
        results.push({ id: entry.id, status: 'ok' });
        success = true;
        break;
      } catch (err: any) {
        lastError = err.message || String(err);
        console.log(`  Error: ${lastError}`);
      }
    }

    if (!success) {
      console.log(`  FAILED after ${MAX_RETRIES + 1} attempts`);
      results.push({ id: entry.id, status: 'failed', error: lastError });
    }

    // Rate limit delay between API calls (skip after last item)
    if (!dryRun && i < targets.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Save results
  const summary = {
    timestamp: new Date().toISOString(),
    dryRun,
    total: targets.length,
    ok: results.filter(r => r.status === 'ok').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    results,
  };

  fs.writeFileSync(RESULT_PATH, JSON.stringify(summary, null, 2));
  console.log(`\n=== Summary ===`);
  console.log(`OK: ${summary.ok} | Failed: ${summary.failed} | Skipped: ${summary.skipped}`);
  console.log(`Results saved to ${RESULT_PATH}`);

  if (summary.failed > 0) {
    console.log(`\nFailed IDs:`);
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  ${r.id}: ${r.error}`);
    });
  }

  // Clean up temp dir
  if (!dryRun && fs.existsSync(TEMP_DIR)) {
    const remaining = fs.readdirSync(TEMP_DIR);
    if (remaining.length === 0) {
      fs.rmdirSync(TEMP_DIR);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
