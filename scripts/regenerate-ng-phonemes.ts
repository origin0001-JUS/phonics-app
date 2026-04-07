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
// Flash TTS: 무료 tier 분당 10회 가능 (Pro는 무료 tier 불가)
const API_URL = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;         // 500/429 에러 시 10초 대기
const RATE_LIMIT_DELAY_MS = 25000;    // 무료 tier: 분당 3회 → 요청 간 25초

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

// ─── Round 3: 개별 맞춤 프롬프트 (2번 연속 실패한 파일용) ─────────
// 전략: "단어 X를 말할 때의 Y 부분만 발음해" 방식
const CUSTOM_PROMPTS: Record<string, string> = {
  // Core - 미묘한 모음/자음
  'core_ih': 'Say the word "sit". Now say ONLY the short vowel in the middle — the "ih" sound /ɪ/. It rhymes with "bit", "fit", "kit". Just that short, quick vowel. Not "ee", not "eh" — the sound between them.',
  'core_ng': 'Say the word "ring". Now say ONLY the final nasal sound "ng" /ŋ/. It is the humming sound at the back of your throat, like the ending of "sing", "king", "long". Hold it for about 0.7 seconds. It is NOT "n" and NOT "m".',
  'core_th': 'Place your tongue between your teeth and blow air gently. This is the voiceless "th" sound /θ/ as in "thin", "think", "three". It is a continuous fricative — hold it for 0.6 seconds. Do NOT say "t" or "f" — it must be the dental fricative with tongue visible between teeth.',
  'core_th_v': 'Place your tongue between your teeth and vibrate your vocal cords while blowing air. This is the voiced "th" sound /ð/ as in "this", "that", "the". It is like the voiceless "th" but with voice added. Hold it for 0.6 seconds. Do NOT say "d" or "z".',
  'core_uh': 'Say the word "cup". Now say ONLY the short vowel in the middle — the "uh" sound /ʌ/. It is the same vowel in "bus", "sun", "mud". A short, relaxed, open vowel from the center of your mouth. Hold it for about 0.5 seconds.',

  // Onset - 자음/블렌드
  'onset_bl': 'Say ONLY the consonant blend "bl" /bl/ as heard at the start of "blue" or "black". Combine the "b" pop with an immediate "l". Do NOT add a vowel after it. Keep it very short — just the blend itself, like you started to say "blue" but stopped before the "oo".',
  'onset_dr': 'Say ONLY the consonant blend "dr" /dɹ/ as heard at the start of "drum" or "drop". The "d" pops and immediately flows into the "r". Do NOT add a vowel — just the blend. Like starting to say "drum" but stopping before "um".',
  'onset_f': 'Bite your lower lip gently with your upper teeth and blow air steadily. This is the "f" sound /f/ as in "fish", "fun". It is a continuous voiceless fricative. Hold the steady airflow for about 0.6 seconds. Do NOT say "sh" — teeth must touch lip.',
  'onset_fr': 'Say ONLY the consonant blend "fr" /fɹ/ as heard at the start of "frog" or "free". Start with the "f" (lip against teeth) and immediately glide into "r". No vowel after. Like starting "frog" but stopping before "og".',
  'onset_l': 'Touch the tip of your tongue to the ridge behind your upper teeth and let your voice flow around the sides. This is the "l" sound /l/ as in "leg", "lip". Hold the continuous voiced lateral sound for about 0.6 seconds. It should sound like "llllll", NOT "oo" or "uh".',
  'onset_n': 'Press your tongue against the ridge behind your upper teeth and hum through your nose. This is the "n" sound /n/ as in "net", "nap". Hold the nasal hum for about 0.6 seconds. It should sound like "nnnnnn", NOT "mmm" or "hmm" — your lips should be open.',
  'onset_r': 'Curl your tongue tip upward without touching the roof of your mouth and let your voice flow. This is the American "r" sound /ɹ/ as in "red", "run". Hold it for about 0.6 seconds. It should sound like a smooth "rrrr", NOT a rolling or trilling r.',
  'onset_sm': 'Say ONLY the consonant blend "sm" /sm/ as heard at the start of "small" or "smile". Start with the "s" hiss and flow into "m" nasal. Like starting "small" but stopping before "all". Keep it under 0.8 seconds.',
  'onset_w': 'Round your lips tightly into an "oo" shape, then quickly open them while voicing. This is the "w" sound /w/ as in "wet", "win". It is a very brief glide — about 0.3 seconds. Do NOT hold it long or it will sound like "woooo". Quick and short.',
  'onset_wh': 'Say the "w" sound /w/ as heard at the start of "whale" or "when". Round your lips briefly and release. Very short, about 0.3 seconds. In modern American English this sounds the same as "w".',

  // Rime
  'rime_eam': 'Say the word "team". Now say ONLY the ending "-eam" part /iːm/. It sounds like "eem" — a long "ee" vowel followed by "m". Same ending as "dream", "cream", "steam". About 0.6 seconds.',
  'rime_eef': 'Say the word "beef". Now say ONLY the ending "-eef" part /iːf/. It sounds like "eef" — a long "ee" vowel followed by "f". Same ending as "reef". About 0.5 seconds.',
  'rime_ep': 'Say the word "step". Now say ONLY the ending "-ep" part /ɛp/. It sounds like "ep" with a short "e" vowel followed by a "p" pop. Same ending as "pep", "rep". Very short, about 0.3 seconds.',
  'rime_ip': 'Say the word "tip". Now say ONLY the ending "-ip" part /ɪp/. It sounds like "ip" with a short "i" vowel followed by a "p" pop. Same ending as "lip", "ship", "dip". Very short, about 0.3 seconds.',
  'rime_irt': 'Say the word "dirt". Now say ONLY the ending "-irt" part /ɜːɹt/. It sounds like "ert" — the r-controlled vowel "er" followed by "t". Same ending as "shirt", "skirt". About 0.4 seconds.',
  'rime_oap': 'Say the word "soap". Now say ONLY the ending "-oap" part /oʊp/. It sounds like "ope" — a long "oh" gliding into "p". About 0.4 seconds.',
};

function buildPrompt(entry: NgPhonemeEntry): string {
  // Round 3: 개별 맞춤 프롬프트가 있으면 사용
  if (CUSTOM_PROMPTS[entry.id]) {
    return CUSTOM_PROMPTS[entry.id];
  }
  switch (entry.type) {
    case 'core': return buildCorePrompt(entry);
    case 'onset': return buildOnsetPrompt(entry);
    case 'rime': return buildRimePrompt(entry);
  }
}

// ─── API Call ─────────────────────────────────────────────────────────

async function callGeminiTTS(entry: NgPhonemeEntry): Promise<Buffer> {
  // Flash TTS는 systemInstruction을 지원하지 않음 → user 프롬프트에 합침
  const fullPrompt = SYSTEM_INSTRUCTION + '\n\n' + buildPrompt(entry);

  const payload = {
    contents: [
      { role: 'user', parts: [{ text: fullPrompt }] },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Aoede',  // Kore가 Flash TTS에서 불안정, Aoede 여성 보이스 사용
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
        console.log(`  Error: ${lastError.slice(0, 200)}`);

        // 429: parse "retry in Xs" and wait accordingly
        const retryMatch = lastError.match(/retry in (\d+(?:\.\d+)?)s/i);
        if (retryMatch) {
          const waitSec = Math.ceil(parseFloat(retryMatch[1])) + 5;
          console.log(`  Rate limited — waiting ${waitSec}s...`);
          await sleep(waitSec * 1000);
        }
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
