/**
 * ═══════════════════════════════════════════════════════════════════
 * Google Cloud TTS 배치 생성 스크립트
 * ───────────────────────────────────────────────────────────────────
 * 
 * curriculum.ts의 모든 단어와 microReading 문장을 Google Cloud TTS로
 * 한 번에 .mp3 파일로 변환하여 public/assets/audio/ 에 저장합니다.
 * 
 * ─── 사전 준비 ───
 * 1. Google Cloud 프로젝트에서 Text-to-Speech API 활성화
 * 2. 서비스 계정 JSON 키 파일 다운로드
 * 3. 환경 변수 설정:
 *    set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-key.json
 *    (또는 .env 파일에 작성)
 * 
 * ─── 실행 방법 ───
 *    cd phonics-app
 *    npx tsx scripts/generate-tts.ts
 * 
 * ─── 비용 참고 ───
 * Neural2 보이스: 100만 문자 무료 → 이후 $16/100만 문자
 * 우리 프로젝트 300단어 + 문장 = 약 5,000자 → 사실상 무료
 * ═══════════════════════════════════════════════════════════════════
 */

import textToSpeech from '@google-cloud/text-to-speech';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ─── ES Module __dirname 대응 ───
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── curriculum.ts에서 데이터 추출 (직접 import 대신 읽기) ───
// ts 파일을 직접 읽어서 파싱하는 대신, 하드코딩된 리스트를 사용하지 않고
// curriculum.ts를 직접 동적 import합니다.

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

// ─── Google TTS 클라이언트 ───
const client = new textToSpeech.TextToSpeechClient();

// ─── TTS 설정 ───
const VOICE_CONFIG = {
    languageCode: 'en-US',
    // Neural2-F = 자연스러운 여성 보이스 (아동교육에 적합)
    name: 'en-US-Neural2-F',
    ssmlGender: 'FEMALE' as const,
};

const AUDIO_CONFIG = {
    audioEncoding: 'MP3' as const,
    speakingRate: 0.85,     // 아이들을 위해 살짝 느리게
    pitch: 2.0,             // 약간 높은 톤 (친근감)
    effectsProfileId: ['headphone-class-device'], // 고품질 프로파일
};

interface TtsJob {
    text: string;
    filename: string;
    type: 'word' | 'sentence';
}

// ─── curriculum.ts 에서 단어/문장 추출 ───
async function extractJobsFromCurriculum(): Promise<TtsJob[]> {
    // 동적 import로 curriculum 데이터 가져오기
    const curriculumModule = await import('../src/data/curriculum');
    const { curriculum } = curriculumModule;

    const jobs: TtsJob[] = [];
    const processedWords = new Set<string>();

    for (const unit of curriculum) {
        // 단어 처리
        for (const word of unit.words) {
            if (!processedWords.has(word.word)) {
                processedWords.add(word.word);
                jobs.push({
                    text: word.word,
                    filename: `${word.id}.mp3`,
                    type: 'word',
                });
            }
        }

        // MicroReading 문장 처리
        for (let i = 0; i < unit.microReading.length; i++) {
            const sentence = unit.microReading[i];
            const sentenceFilename = `${unit.id}_sentence_${i + 1}.mp3`;
            jobs.push({
                text: sentence,
                filename: sentenceFilename,
                type: 'sentence',
            });
        }
    }

    return jobs;
}

// ─── 단일 TTS 요청 ───
async function synthesize(job: TtsJob): Promise<void> {
    const outputPath = path.join(AUDIO_DIR, job.filename);

    // 이미 파일이 있으면 스킵 (재실행 시 중복 방지)
    if (fs.existsSync(outputPath)) {
        console.log(`  ⏭ SKIP (exists): ${job.filename}`);
        return;
    }

    // SSML로 감싸서 더 자연스럽게 (단어: 또렷하게, 문장: 자연스럽게)
    const ssml = job.type === 'word'
        ? `<speak><prosody rate="slow" pitch="+1st">${job.text}</prosody></speak>`
        : `<speak><prosody rate="medium">${job.text}</prosody></speak>`;

    const [response] = await client.synthesizeSpeech({
        input: { ssml },
        voice: VOICE_CONFIG,
        audioConfig: AUDIO_CONFIG,
    });

    if (response.audioContent) {
        fs.writeFileSync(outputPath, response.audioContent as Buffer);
        console.log(`  ✅ ${job.type === 'word' ? '📝' : '📖'} ${job.filename} (${job.text})`);
    } else {
        console.error(`  ❌ FAILED: ${job.filename}`);
    }
}

// ─── 메인 실행 ───
async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🔊 Phonics 300 — Google Cloud TTS Batch Generator');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // 1) 출력 디렉토리 생성
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
        console.log(`📁 Created output directory: ${AUDIO_DIR}`);
    }

    // 2) curriculum에서 Job 목록 추출
    console.log('📚 Extracting words & sentences from curriculum...');
    const jobs = await extractJobsFromCurriculum();

    const wordJobs = jobs.filter(j => j.type === 'word');
    const sentenceJobs = jobs.filter(j => j.type === 'sentence');
    console.log(`   → ${wordJobs.length} unique words`);
    console.log(`   → ${sentenceJobs.length} sentences`);
    console.log(`   → ${jobs.length} total audio files to generate`);
    console.log('');

    // 3) 배치 처리 (동시 5개씩, API rate limit 방지)
    const BATCH_SIZE = 5;
    let completed = 0;

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        const batch = jobs.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
            batch.map(job => synthesize(job))
        );

        for (const res of results) {
            if (res.status === 'fulfilled') {
                completed++;
            } else {
                console.error(`  ❌ Error:`, res.reason?.message || res.reason);
            }
        }

        // 진행률 표시
        const pct = Math.round(((i + batch.length) / jobs.length) * 100);
        process.stdout.write(`\r  Progress: ${pct}% (${i + batch.length}/${jobs.length})`);

        // Rate limit 방어 (100ms 대기)
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Done! Generated ${completed} audio files`);
    console.log(`  📁 Output: ${AUDIO_DIR}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
