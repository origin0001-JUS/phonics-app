/**
 * ═══════════════════════════════════════════════════════════════════
 * ElevenLabs TTS 배치 생성 스크립트 — Round 12 
 * ───────────────────────────────────────────────────────────────────
 * 
 * curriculum.ts의 모든 단어와 microReading 문장을 고품질의 ElevenLabs 
 * 음성으로 변환하여 public/assets/audio/ 에 저장합니다.
 * 
 * ─── 실행 방법 ───
 *    cd phonics-app
 *    npx tsx scripts/generate-tts.ts [--force] [--dry-run]
 * 
 * ─── Options ───
 *    --force   : 기존 파일이 존재해도 무시하고 강제로 재생성
 *    --dry-run : 실제 과금/생성 없이 생성될 파일 목록과 배정된 음성만 출력
 * 
 * ─── Voice Assignment (다중 음성 전략) ───
 *    - 단어 (Words)       : 또박또박 교육용 여성 (Charlotte) — speed 0.7
 *    - 문장 (Sentences)    : 동일한 Charlotte 음성으로 통일
 * ═══════════════════════════════════════════════════════════════════
 */

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

// ─── .env.local 로드 ───
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

// 상위 워크스페이스(phonics-hero)의 .env.local도 확인 (Fallback)
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey && !process.argv.includes('--dry-run')) {
    console.error('❌ Error: ELEVENLABS_API_KEY is not set in environment variables.');
    console.error('   Please add it to your .env.local file.');
    process.exit(1);
}

// ─── ElevenLabs 클라이언트 설정 ───
const elevenlabs = new ElevenLabsClient({ apiKey });

// ─── 음성 매핑 (Voice IDs) ───
// ⚠️ Charlotte (XB0fDUnXU5powFXDhCwa) = en-british 확인됨 → Rachel로 전환
// Rachel (21m00Tcm4TlvDq8ikWAM) = en-american 확인됨 ✅
const VOICES = {
    RACHEL: '21m00Tcm4TlvDq8ikWAM', // 미국식 여성 (전체 통일)
};

// ─── 보호 목록 (이미 미국식으로 확인된 파일 — --force에서도 절대 건너뜀) ───
// • Charlotte 이전에 Rachel로 생성된 것들 (구 Rachel = 미국식)
// • 수동으로 재생성/검수된 단어들
const SKIP_LIST = new Set<string>([
    // ── 수동 재생성 완료 (American) ──
    'van',        // 미국식으로 검수/재생성 쪽 (Fixing Pronunciation and Images 세션)
    // ── 추가 보호 필요시 여기에 추가 ──
    // 'cat', 'bat', ...
]);

// ─── TTS 설정 ───
// 고품질 모델 + 느린 속도로 또박또박 발음
const MODEL_ID = 'eleven_multilingual_v2';
const TTS_SPEED = 0.7;

interface TtsJob {
    text: string;           // 합성할 텍스트
    filename: string;       // 저장될 파일명 (ex: cat.mp3)
    type: 'word' | 'sentence';
    voiceId: string;        // 배정된 ElevenLabs 음성 ID
    voiceName: string;      // 로그용
}

async function extractJobsFromCurriculum(): Promise<TtsJob[]> {
    const jobs: TtsJob[] = [];
    const processedWords = new Set<string>();

    for (let u = 0; u < curriculum.length; u++) {
        const unit = curriculum[u];

        // 1. 단어 처리 (Rachel 미국식 음성으로 통일)
        for (const word of unit.words) {
            if (!processedWords.has(word.word)) {
                processedWords.add(word.word);

                // ─── 보호 목록에 있는 단어는 건너뜀 ───
                if (SKIP_LIST.has(word.word.toLowerCase())) {
                    console.log(`🔒 Protected (skip): ${word.id}.mp3 ("${word.word}")`);
                    continue;
                }

                let safeText = word.word.charAt(0).toUpperCase() + word.word.slice(1) + '.';

                // Fix weird pronunciations
                if (word.word.toLowerCase() === 'big') {
                    safeText = 'Big';
                } else if (word.word.toLowerCase() === 'ig') {
                    safeText = 'igg';
                }

                jobs.push({
                    text: safeText,
                    filename: `${word.id}.mp3`,
                    type: 'word',
                    voiceId: VOICES.RACHEL,
                    voiceName: 'Rachel (Word) [en-american]'
                });
            }
        }

        // 2. MicroReading 문장 처리 (Rachel 미국식 음성으로 통일)
        const sentenceVoice = VOICES.RACHEL;
        const sentenceVoiceName = 'Rachel (Sentence) [en-american]';

        // 문장 파일명 명명 규칙: "문장텍스트를_안전한_파일명으로.mp3"
        // (audit-audio.ts와 완전히 동일한 로직이어야 파일명을 일치시킬 수 있음)
        for (let i = 0; i < unit.microReading.length; i++) {
            const sentence = unit.microReading[i];
            const sentenceFilename = getSafeFilename(sentence);

            jobs.push({
                text: sentence,
                filename: sentenceFilename,
                type: 'sentence',
                voiceId: sentenceVoice,
                voiceName: sentenceVoiceName
            });
        }
    }

    return jobs;
}

function getSafeFilename(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50) + '.mp3';
}

async function synthesizeToMp3(job: TtsJob, outputPath: string): Promise<void> {
    const responseStream = await elevenlabs.textToSpeech.stream(
        job.voiceId,
        {
            modelId: MODEL_ID,
            text: job.text,
            voiceSettings: {
                stability: 0.7,
                similarityBoost: 0.8,
                speed: TTS_SPEED,
            }
        }
    );

    // Read stream to buffer and write
    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        if (typeof chunk === 'string') {
            chunks.push(Buffer.from(chunk));
        } else if (chunk instanceof Buffer) {
            chunks.push(chunk);
        } else {
            chunks.push(Buffer.from(chunk as Uint8Array));
        }
    }
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, buffer);
}

async function main() {
    const args = process.argv.slice(2);
    const forceIndex = args.indexOf('--force');
    const dryRunIndex = args.indexOf('--dry-run');

    // --force에 단어/문장 부분만 지정할 수 있는 옵션 (개발 중 빠른 테스트용)
    const filterWord = args.includes('--words-only');
    const filterSentence = args.includes('--sentences-only');

    const force = forceIndex !== -1;
    const dryRun = dryRunIndex !== -1;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  🎙️ ElevenLabs TTS Generation ${dryRun ? '[DRY RUN]' : ''}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (!fs.existsSync(AUDIO_DIR)) {
        console.log(`📁 Creating audio directory: ${AUDIO_DIR}`);
        if (!dryRun) fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    const allJobs = await extractJobsFromCurriculum();

    // 필터링
    let jobs = allJobs;
    if (filterWord) jobs = jobs.filter(j => j.type === 'word');
    if (filterSentence) jobs = jobs.filter(j => j.type === 'sentence');

    console.log(`📋 Total jobs extracted: ${jobs.length} (Words: ${jobs.filter(j => j.type === 'word').length}, Sentences: ${jobs.filter(j => j.type === 'sentence').length})`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
        const filePath = path.join(AUDIO_DIR, job.filename);
        const fileExists = fs.existsSync(filePath);

        if (fileExists && !force) {
            console.log(`⏭️  Skipping (exists): ${job.filename}`);
            skipped++;
            continue;
        }

        if (dryRun) {
            console.log(`🧪 [Dry Run] Would generate: ${job.filename} | Voice: ${job.voiceName} | Text: "${job.text}"`);
            generated++;
            continue;
        }

        console.log(`🎙️  Generating: ${job.filename} | Voice: ${job.voiceName}`);
        try {
            await synthesizeToMp3(job, filePath);
            generated++;
            // Rate limit protection - free tiers often have limits like 2 concurrent or 100/min
            // Paid tiers are higher but adding a tiny delay is safer for stability
            await new Promise(r => setTimeout(r, 200));
        } catch (err: unknown) {
            console.error(`❌ Failed: ${job.filename}`);
            console.error(err);
            failed++;
        }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎯 SUMMARY');
    console.log(`     Total requested: ${jobs.length}`);
    console.log(`     ✅ Generated   : ${generated}`);
    console.log(`     ⏭️  Skipped     : ${skipped}`);
    console.log(`     ❌ Failed      : ${failed}`);
    console.log('═══════════════════════════════════════════════════');
    if (!dryRun) {
        console.log('🎉 Update Complete. Run "npm run dev" to test Audio.');
    }
}

main().catch(err => {
    console.error('Fatal error in TTS generation:', err);
    process.exit(1);
});
