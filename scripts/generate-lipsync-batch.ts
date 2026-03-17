/**
 * 립싱크 배치 워밍업 방식 생성 스크립트
 *
 * 전략: 더미 워밍업(~5초) + 단어 연속 나열 → 1개 긴 영상 → ffmpeg split
 * 립싱크 AI 초반 부정확 구간을 더미가 흡수, 실제 단어는 안정 구간에 배치
 *
 * 배치: 9단어 × 3배치 (각 ~28초)
 *
 * 실행:
 *   npx tsx scripts/generate-lipsync-batch.ts
 *   npx tsx scripts/generate-lipsync-batch.ts --dry-run
 *   npx tsx scripts/generate-lipsync-batch.ts --audio-only
 *   npx tsx scripts/generate-lipsync-batch.ts --batch 1    (특정 배치만)
 */

import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── .env.local 로드 ───
function loadEnvLocal() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
    }
}
loadEnvLocal();

const FAL_KEY = process.env.FAL_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!FAL_KEY) { console.error('❌ FAL_KEY 필요'); process.exit(1); }
if (!ELEVENLABS_API_KEY) { console.error('❌ ELEVENLABS_API_KEY 필요'); process.exit(1); }

fal.config({ credentials: FAL_KEY });

// ─── 설정 ───
const VOICE_ID = 'tapn1QwocNXk3viVSowa'; // Sparkles for Kids
const SPEED = 0.6;
const WARMUP_TEXT = "Hello! Let's practice some words together. Are you ready? Here we go!";
const PRE_SILENCE = 0.5;   // 단어 앞 무음 (초)
const POST_SILENCE = 0.3;  // 단어 뒤 무음 (초)
const GAP_SILENCE = 1.0;   // 단어 간 무음 (초)
const TRANSITION_SILENCE = 0.5; // 워밍업→단어 전환 무음

const ASSET_DIR = path.join(process.cwd(), 'flow_asset', 'phonics_split');
const WORK_DIR = path.join(ASSET_DIR, '_batch_work');
const SEED_IMAGE = path.join(ASSET_DIR, 'seed_final.jpeg');

// ─── 누락 단어 24개 (기존 MP4 제외, bee/boat/bowl 이미 존재, bed 추가) ───
const ALL_MISSING = [
    'bed', 'cake', 'cat', 'chip', 'chop', 'clap', 'crab', 'food',
    'hat', 'hen', 'man', 'map', 'meat', 'net', 'red', 'sea',
    'seed', 'sing', 'sled', 'thin', 'this', 'whale', 'when', 'whip',
];

// 3배치 (8개씩)
const BATCHES = [
    ALL_MISSING.slice(0, 8),
    ALL_MISSING.slice(8, 16),
    ALL_MISSING.slice(16, 24),
];

// ─── 타임스탬프 기록 ───
interface WordTimestamp {
    word: string;
    start: number;  // 초
    end: number;    // 초
}

// ─── ElevenLabs TTS ───
async function generateTTS(text: string, outPath: string, label: string): Promise<void> {
    if (fs.existsSync(outPath)) {
        console.log(`  ♻️  캐시: ${label}`);
        return;
    }
    console.log(`  🎙️  TTS: "${label}"`);

    const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY!,
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.1, use_speaker_boost: true },
                speed: SPEED,
            }),
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 200)}`);
    }

    fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
    const dur = getAudioDuration(outPath);
    console.log(`  ✅ ${label} (${dur.toFixed(2)}초)`);
}

// ─── ffmpeg 유틸 ───
function getAudioDuration(filePath: string): number {
    const out = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
        { encoding: 'utf-8', timeout: 10000 }
    ).trim();
    return parseFloat(out);
}

function generateSilence(outPath: string, durationSec: number): void {
    execSync(
        `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${durationSec} -c:a libmp3lame -b:a 128k "${outPath}"`,
        { stdio: 'pipe', timeout: 10000 }
    );
}

function concatAudioFiles(fileList: string[], outPath: string): void {
    const listFile = outPath + '.list.txt';
    const listContent = fileList.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listFile, listContent);

    execSync(
        `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -b:a 128k "${outPath}"`,
        { stdio: 'pipe', timeout: 60000 }
    );

    fs.unlinkSync(listFile);
}

// ─── Step 2: 배치 오디오 합성 ───
function buildBatchAudio(
    batchIdx: number,
    words: string[],
    warmupPath: string,
): { batchAudioPath: string; timestamps: WordTimestamp[] } {
    console.log(`\n━━━ Batch ${batchIdx + 1}: 오디오 합성 ━━━`);

    const timestamps: WordTimestamp[] = [];
    const segments: string[] = [];

    // 무음 파일 생성 (재사용)
    const silPre = path.join(WORK_DIR, `_sil_pre_${PRE_SILENCE}.mp3`);
    const silPost = path.join(WORK_DIR, `_sil_post_${POST_SILENCE}.mp3`);
    const silGap = path.join(WORK_DIR, `_sil_gap_${GAP_SILENCE}.mp3`);
    const silTransition = path.join(WORK_DIR, `_sil_transition.mp3`);

    if (!fs.existsSync(silPre)) generateSilence(silPre, PRE_SILENCE);
    if (!fs.existsSync(silPost)) generateSilence(silPost, POST_SILENCE);
    if (!fs.existsSync(silGap)) generateSilence(silGap, GAP_SILENCE);
    if (!fs.existsSync(silTransition)) generateSilence(silTransition, TRANSITION_SILENCE);

    // 워밍업 추가
    segments.push(warmupPath);
    segments.push(silTransition);

    let currentTime = getAudioDuration(warmupPath) + TRANSITION_SILENCE;

    // 각 단어 추가
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordAudio = path.join(WORK_DIR, `word_${word}.mp3`);

        if (!fs.existsSync(wordAudio)) {
            console.error(`  ❌ 오디오 없음: ${word}`);
            continue;
        }

        const wordDur = getAudioDuration(wordAudio);

        // [앞 무음]
        segments.push(silPre);
        currentTime += PRE_SILENCE;

        // [단어] — 타임스탬프 기록 (앞 무음 포함 시작점)
        const wordStart = currentTime - PRE_SILENCE;
        segments.push(wordAudio);
        currentTime += wordDur;

        // [뒤 무음]
        segments.push(silPost);
        currentTime += POST_SILENCE;

        const wordEnd = currentTime;
        timestamps.push({ word, start: wordStart, end: wordEnd });

        console.log(`  📍 ${word}: ${wordStart.toFixed(2)}s ~ ${wordEnd.toFixed(2)}s (발음 ${wordDur.toFixed(2)}s)`);

        // 간격 무음 (마지막 단어 제외)
        if (i < words.length - 1) {
            segments.push(silGap);
            currentTime += GAP_SILENCE;
        }
    }

    // 합성
    const batchAudioPath = path.join(WORK_DIR, `batch_${batchIdx + 1}.mp3`);
    console.log(`\n  🔗 합성 중 (${segments.length}개 세그먼트)...`);
    concatAudioFiles(segments, batchAudioPath);

    const totalDur = getAudioDuration(batchAudioPath);
    console.log(`  ✅ batch_${batchIdx + 1}.mp3 (${totalDur.toFixed(1)}초)`);

    return { batchAudioPath, timestamps };
}

// ─── fal.ai 업로드 ───
async function uploadToFal(filePath: string, maxRetries = 3): Promise<string> {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.jpeg' || ext === '.jpg' ? 'image/jpeg' : 'image/png';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const initRes = await fetch('https://rest.fal.ai/storage/upload/initiate', {
                method: 'POST',
                headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_name: fileName, content_type: mimeType }),
                signal: AbortSignal.timeout(30000),
            });
            if (!initRes.ok) throw new Error(`Init ${initRes.status}`);

            const { upload_url, file_url } = await initRes.json() as { upload_url: string; file_url: string };
            const uploadRes = await fetch(upload_url, {
                method: 'PUT',
                headers: { 'Content-Type': mimeType },
                body: fs.readFileSync(filePath),
                signal: AbortSignal.timeout(120000),
            });
            if (!uploadRes.ok) throw new Error(`Upload ${uploadRes.status}`);
            return file_url;
        } catch (err) {
            if (attempt === maxRetries) throw err;
            console.log(`  ⚠️  재시도 ${attempt}/${maxRetries}`);
            await new Promise(r => setTimeout(r, attempt * 3000));
        }
    }
    throw new Error('Upload failed');
}

// ─── VEED Fabric 영상 생성 ───
async function generateBatchVideo(imageUrl: string, audioUrl: string, batchIdx: number): Promise<string> {
    const outPath = path.join(WORK_DIR, `batch_${batchIdx + 1}_video.mp4`);

    if (fs.existsSync(outPath)) {
        console.log(`  ♻️  영상 캐시: batch_${batchIdx + 1}_video.mp4`);
        return outPath;
    }

    console.log(`  🎬 VEED Fabric 생성 중 (Batch ${batchIdx + 1})...`);
    const startTime = Date.now();

    const result = await fal.subscribe('veed/fabric-1.0', {
        input: { image_url: imageUrl, audio_url: audioUrl, resolution: '480p' as const },
        logs: true,
        onQueueUpdate: (update) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            if (update.status === 'IN_QUEUE') {
                console.log(`     ⏳ 큐 대기... (${elapsed}초)`);
            } else if (update.status === 'IN_PROGRESS' && Number(elapsed) % 60 === 0) {
                console.log(`     🔄 ${elapsed}초 경과...`);
            }
        },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const videoData = result.data as { video?: { url?: string } };
    const videoUrl = videoData?.video?.url;
    if (!videoUrl) throw new Error(`No video URL for batch ${batchIdx + 1}`);

    console.log(`  ⬇️  다운로드 중... (생성 ${elapsed}초)`);
    const response = await fetch(videoUrl, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    fs.writeFileSync(outPath, Buffer.from(await response.arrayBuffer()));
    const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ batch_${batchIdx + 1}_video.mp4 (${sizeMB}MB, ${elapsed}초)`);
    return outPath;
}

// ─── Step 4: 영상 분할 ───
function splitBatchVideo(videoPath: string, timestamps: WordTimestamp[]): void {
    console.log(`\n  ✂️  영상 분할 (${timestamps.length}개)...`);

    for (const ts of timestamps) {
        const outPath = path.join(ASSET_DIR, `${ts.word}.mp4`);

        if (fs.existsSync(outPath)) {
            console.log(`  ♻️  ${ts.word}.mp4 이미 존재`);
            continue;
        }

        const duration = ts.end - ts.start;
        try {
            // 재인코딩 방식 (keyframe 정확도 보장)
            execSync(
                `ffmpeg -y -ss ${ts.start.toFixed(3)} -t ${duration.toFixed(3)} -i "${videoPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outPath}"`,
                { stdio: 'pipe', timeout: 30000 }
            );
            const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
            console.log(`  ✅ ${ts.word}.mp4 (${sizeKB}KB, ${ts.start.toFixed(2)}~${ts.end.toFixed(2)}s)`);
        } catch (err) {
            console.error(`  ❌ ${ts.word} 분할 실패: ${(err as Error).message.slice(0, 100)}`);
        }
    }
}

// ─── 메인 ───
async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const audioOnly = process.argv.includes('--audio-only');
    const batchArg = process.argv.find(a => a.startsWith('--batch'));
    const specificBatch = batchArg ? parseInt(process.argv[process.argv.indexOf(batchArg) + 1]) - 1 : null;

    console.log('═══════════════════════════════════════════════════');
    console.log('  립싱크 배치 워밍업 방식');
    console.log('  더미 워밍업 → 단어 연속 → ffmpeg split');
    console.log(`  Speed: ${SPEED} | Pre: ${PRE_SILENCE}s | Post: ${POST_SILENCE}s | Gap: ${GAP_SILENCE}s`);
    console.log('═══════════════════════════════════════════════════\n');

    // 실제 누락 재확인
    const existingMp4 = fs.readdirSync(ASSET_DIR).filter(f => f.endsWith('.mp4')).map(f => f.replace('.mp4', ''));
    const realMissing = ALL_MISSING.filter(w => !existingMp4.includes(w));
    console.log(`📋 누락: ${realMissing.length}개 / 기존: ${existingMp4.length}개`);

    if (realMissing.length === 0) {
        console.log('✅ 모든 영상이 이미 존재합니다!');
        return;
    }

    // 배치 재구성 (실제 누락만)
    const batchSize = 8;
    const batches: string[][] = [];
    for (let i = 0; i < realMissing.length; i += batchSize) {
        batches.push(realMissing.slice(i, i + batchSize));
    }

    console.log(`📦 배치: ${batches.length}개`);
    batches.forEach((b, i) => console.log(`   Batch ${i + 1}: ${b.join(', ')}`));

    if (dryRun) { console.log('\n(--dry-run 종료)'); return; }

    fs.mkdirSync(WORK_DIR, { recursive: true });

    // 이전 배치 캐시 삭제 (단어 구성 변경됨)
    for (let i = 1; i <= 5; i++) {
        const batchMp3 = path.join(WORK_DIR, `batch_${i}.mp3`);
        const batchTs = path.join(WORK_DIR, `batch_${i}_timestamps.json`);
        const batchVid = path.join(WORK_DIR, `batch_${i}_video.mp4`);
        for (const f of [batchMp3, batchTs, batchVid]) {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
                console.log(`  🗑️  삭제: ${path.basename(f)}`);
            }
        }
    }

    // ━━━ Phase 1: 모든 TTS 생성 ━━━
    console.log('\n━━━ Phase 1: TTS 생성 ━━━\n');

    const warmupPath = path.join(WORK_DIR, 'warmup.mp3');
    await generateTTS(WARMUP_TEXT, warmupPath, 'warmup');

    for (const word of realMissing) {
        const wordPath = path.join(WORK_DIR, `word_${word}.mp3`);
        await generateTTS(word, wordPath, word);
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n✅ TTS 완료: ${realMissing.length + 1}개\n`);

    if (audioOnly) { console.log('(--audio-only 종료)'); return; }

    // ━━━ Phase 2: 배치 오디오 합성 ━━━
    console.log('━━━ Phase 2: 배치 오디오 합성 ━━━');

    const batchData: { audioPath: string; timestamps: WordTimestamp[] }[] = [];
    const batchesToRun = specificBatch !== null ? [specificBatch] : batches.map((_, i) => i);

    for (const idx of batchesToRun) {
        const { batchAudioPath, timestamps } = buildBatchAudio(idx, batches[idx], warmupPath);
        batchData.push({ audioPath: batchAudioPath, timestamps });

        // 타임스탬프 저장
        const tsPath = path.join(WORK_DIR, `batch_${idx + 1}_timestamps.json`);
        fs.writeFileSync(tsPath, JSON.stringify(timestamps, null, 2));
    }

    // ━━━ Phase 3: 시드 이미지 + 영상 생성 ━━━
    console.log('\n━━━ Phase 3: 영상 생성 ━━━\n');

    if (!fs.existsSync(SEED_IMAGE)) {
        console.error(`❌ 시드 이미지 없음: ${SEED_IMAGE}`);
        process.exit(1);
    }

    console.log('  📤 시드 이미지 업로드...');
    const imageUrl = await uploadToFal(SEED_IMAGE);
    console.log(`  ✅ ${imageUrl}\n`);

    for (let i = 0; i < batchData.length; i++) {
        const realIdx = batchesToRun[i];
        const { audioPath, timestamps } = batchData[i];

        console.log(`\n─── Batch ${realIdx + 1} ───`);

        // 배치 오디오 업로드
        console.log('  📤 배치 오디오 업로드...');
        const audioUrl = await uploadToFal(audioPath);
        console.log(`  ✅ ${audioUrl}`);

        // 영상 생성
        const videoPath = await generateBatchVideo(imageUrl, audioUrl, realIdx);

        // ━━━ Phase 4: 영상 분할 ━━━
        splitBatchVideo(videoPath, timestamps);
    }

    // 결과 요약
    const finalCount = fs.readdirSync(ASSET_DIR).filter(f => f.endsWith('.mp4')).length;
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  완료! ${ASSET_DIR}`);
    console.log(`  총 MP4: ${finalCount}개`);
    console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('\n❌ 에러:', err);
    process.exit(1);
});
