/**
 * 누락 립싱크 영상 27개 일괄 생성 스크립트
 *
 * 파이프라인:
 *   1. ElevenLabs TTS (0.7초 무음 + 단어 발음(speed 0.7) + 0.4초 무음)
 *   2. fal.ai 업로드 (오디오 + 시드 이미지)
 *   3. VEED Fabric 1.0 립싱크 영상 생성
 *   4. MP4 다운로드 → flow_asset/phonics_split/{word}.mp4
 *
 * 실행:
 *   npx tsx scripts/generate-missing-lipsync.ts
 *   npx tsx scripts/generate-missing-lipsync.ts --dry-run   (목록만 확인)
 *   npx tsx scripts/generate-missing-lipsync.ts --audio-only (오디오만 생성)
 */

import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';

// ─── .env.local 로드 ───
function loadEnvLocal() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
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
const PRE_SILENCE_SEC = 0.5;
const POST_SILENCE_SEC = 0.3;

const ASSET_DIR = path.join(process.cwd(), 'flow_asset', 'phonics_split');
const AUDIO_DIR = path.join(ASSET_DIR, 'audio_generated');
const SEED_IMAGE = path.join(ASSET_DIR, 'seed_final.jpeg');

// ─── 누락 단어 27개 ───
const MISSING_WORDS = [
    'bed', 'bee', 'boat', 'bowl', 'cake', 'cat', 'chip', 'chop', 'clap', 'crab',
    'food', 'hat', 'hen', 'man', 'map', 'meat', 'net', 'red', 'sea', 'seed',
    'sing', 'sled', 'thin', 'this', 'whale', 'when', 'whip',
];

// ─── WAV 무음 생성 유틸 ───
function createSilenceWavBuffer(durationSec: number, sampleRate = 44100): Buffer {
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataSize = numSamples * 2; // 16-bit mono
    const headerSize = 44;
    const buf = Buffer.alloc(headerSize + dataSize);

    // RIFF header
    buf.write('RIFF', 0);
    buf.writeUInt32LE(headerSize + dataSize - 8, 4);
    buf.write('WAVE', 8);
    // fmt chunk
    buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16); // chunk size
    buf.writeUInt16LE(1, 20);  // PCM
    buf.writeUInt16LE(1, 22);  // mono
    buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
    buf.writeUInt16LE(2, 32);  // block align
    buf.writeUInt16LE(16, 34); // bits per sample
    // data chunk
    buf.write('data', 36);
    buf.writeUInt32LE(dataSize, 40);
    // samples are all 0 (silence)

    return buf;
}

// ─── Step 1: ElevenLabs TTS + silence padding ───
async function generateAudioWithPadding(word: string): Promise<string> {
    const outPath = path.join(AUDIO_DIR, `${word}.mp3`);

    if (fs.existsSync(outPath)) {
        console.log(`  ♻️  오디오 캐시: ${word}.mp3`);
        return outPath;
    }

    console.log(`  🎙️  TTS 생성: "${word}" (voice: Sparkles for Kids, speed: ${SPEED})`);

    // ElevenLabs TTS via REST API
    const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY!,
            },
            body: JSON.stringify({
                text: word,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.85,
                    style: 0.1,
                    use_speaker_boost: true,
                },
                speed: SPEED,
            }),
            signal: AbortSignal.timeout(30000),
        }
    );

    if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        throw new Error(`ElevenLabs error ${ttsRes.status}: ${errText.slice(0, 200)}`);
    }

    const speechBuffer = Buffer.from(await ttsRes.arrayBuffer());

    // ffmpeg adelay 필터로 앞 무음 추가 + apad로 뒤 무음 추가
    const tempSpeech = path.join(AUDIO_DIR, `_temp_${word}_speech.mp3`);
    fs.writeFileSync(tempSpeech, speechBuffer);

    const { execSync } = await import('child_process');
    const delayMs = Math.round(PRE_SILENCE_SEC * 1000);
    const padDur = POST_SILENCE_SEC;
    try {
        execSync(
            `ffmpeg -y -i "${tempSpeech}" -af "adelay=${delayMs}|${delayMs},apad=pad_dur=${padDur}" -c:a libmp3lame -b:a 128k "${outPath}"`,
            { stdio: 'pipe', timeout: 30000 }
        );
    } catch {
        console.log(`  ⚠️  ffmpeg 실패 — 원본 저장`);
        fs.writeFileSync(outPath, speechBuffer);
    }

    try { fs.unlinkSync(tempSpeech); } catch { /* ignore */ }

    const sizeKB = (fs.readFileSync(outPath).length / 1024).toFixed(1);
    console.log(`  ✅ 저장: ${word}.mp3 (${sizeKB}KB)`);
    return outPath;
}

// ─── Step 2: fal.ai 업로드 (retry) ───
async function uploadToFal(filePath: string, maxRetries = 3): Promise<string> {
    const fileName = path.basename(filePath);
    const mimeType = filePath.endsWith('.mp3') ? 'audio/mpeg'
        : filePath.endsWith('.wav') ? 'audio/wav'
        : 'image/jpeg';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const initRes = await fetch('https://rest.fal.ai/storage/upload/initiate', {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_name: fileName, content_type: mimeType }),
                signal: AbortSignal.timeout(30000),
            });

            if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);

            const { upload_url, file_url } = await initRes.json() as { upload_url: string; file_url: string };

            const fileData = fs.readFileSync(filePath);
            const uploadRes = await fetch(upload_url, {
                method: 'PUT',
                headers: { 'Content-Type': mimeType },
                body: fileData,
                signal: AbortSignal.timeout(60000),
            });

            if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
            return file_url;
        } catch (err) {
            const error = err as Error;
            if (attempt === maxRetries) throw error;
            console.log(`  ⚠️  업로드 재시도 ${attempt}/${maxRetries}: ${error.message}`);
            await new Promise(r => setTimeout(r, attempt * 3000));
        }
    }
    throw new Error('Upload failed');
}

// ─── Step 3: VEED Fabric 영상 생성 ───
async function generateVideo(
    imageUrl: string,
    audioUrl: string,
    word: string,
): Promise<string> {
    const outPath = path.join(ASSET_DIR, `${word}.mp4`);

    if (fs.existsSync(outPath)) {
        console.log(`  ♻️  영상 캐시: ${word}.mp4`);
        return outPath;
    }

    console.log(`  🎬 Fabric 생성: "${word}"`);
    const startTime = Date.now();

    const result = await fal.subscribe('veed/fabric-1.0', {
        input: {
            image_url: imageUrl,
            audio_url: audioUrl,
            resolution: '480p' as const,
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === 'IN_QUEUE') {
                console.log(`     ⏳ 큐 대기...`);
            } else if (update.status === 'IN_PROGRESS') {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                if (Number(elapsed) % 30 === 0) {
                    console.log(`     🔄 ${elapsed}초 경과...`);
                }
            }
        },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const videoData = result.data as { video?: { url?: string } };
    const videoUrl = videoData?.video?.url;

    if (!videoUrl) {
        console.error(`  ❌ 영상 URL 없음:`, JSON.stringify(result.data, null, 2));
        throw new Error(`No video URL for ${word}`);
    }

    const response = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outPath, videoBuffer);

    const sizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ 저장: ${word}.mp4 (${sizeMB}MB, ${elapsed}초)`);
    return outPath;
}

// ─── 메인 ───
async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const audioOnly = process.argv.includes('--audio-only');

    console.log('═══════════════════════════════════════════════════');
    console.log('  누락 립싱크 영상 27개 일괄 생성');
    console.log('  Voice: Sparkles for Kids | Speed: 0.7');
    console.log(`  Pre-silence: ${PRE_SILENCE_SEC}s | Post-silence: ${POST_SILENCE_SEC}s`);
    console.log('═══════════════════════════════════════════════════\n');

    // 실제 누락 재확인 (이미 생성된 것 제외)
    const existingMp4 = fs.readdirSync(ASSET_DIR)
        .filter(f => f.endsWith('.mp4'))
        .map(f => f.replace('.mp4', ''));
    const toGenerate = MISSING_WORDS.filter(w => !existingMp4.includes(w));

    console.log(`📋 누락 단어: ${toGenerate.length}개`);
    console.log(`   ${toGenerate.join(', ')}\n`);

    if (dryRun) {
        console.log('(--dry-run 모드, 종료)');
        return;
    }

    // 디렉토리 생성
    fs.mkdirSync(AUDIO_DIR, { recursive: true });

    // 시드 이미지 확인 & 업로드
    if (!fs.existsSync(SEED_IMAGE)) {
        console.error(`❌ 시드 이미지 없음: ${SEED_IMAGE}`);
        process.exit(1);
    }

    // Step 1: 전체 오디오 먼저 생성
    console.log('━━━ Phase 1: 오디오 생성 ━━━\n');
    const audioFiles: Record<string, string> = {};

    for (let i = 0; i < toGenerate.length; i++) {
        const word = toGenerate[i];
        console.log(`[${i + 1}/${toGenerate.length}] ${word}`);
        try {
            audioFiles[word] = await generateAudioWithPadding(word);
        } catch (err) {
            console.error(`  ❌ 오디오 실패: ${(err as Error).message}`);
        }
        // rate limit
        if (i < toGenerate.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    const audioCount = Object.keys(audioFiles).length;
    console.log(`\n✅ 오디오: ${audioCount}/${toGenerate.length}개 완료\n`);

    if (audioOnly) {
        console.log('(--audio-only 모드, 종료)');
        return;
    }

    // Step 2: 시드 이미지 업로드 (1회)
    console.log('━━━ Phase 2: 시드 이미지 업로드 ━━━\n');
    console.log(`  📤 시드 이미지: seed_final.jpeg`);
    const imageUrl = await uploadToFal(SEED_IMAGE);
    console.log(`  ✅ ${imageUrl}\n`);

    // Step 3: 오디오 업로드 + 영상 생성
    console.log('━━━ Phase 3: 영상 생성 ━━━\n');
    let success = 0;
    let failed = 0;

    for (let i = 0; i < toGenerate.length; i++) {
        const word = toGenerate[i];
        if (!audioFiles[word]) {
            console.log(`[${i + 1}/${toGenerate.length}] ${word} — 오디오 없음, 스킵`);
            failed++;
            continue;
        }

        console.log(`[${i + 1}/${toGenerate.length}] ${word}`);
        try {
            // 오디오 업로드
            console.log(`  📤 오디오 업로드...`);
            const audioUrl = await uploadToFal(audioFiles[word]);

            // 영상 생성
            await generateVideo(imageUrl, audioUrl, word);
            success++;
        } catch (err) {
            console.error(`  ❌ 영상 실패: ${(err as Error).message}`);
            failed++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  결과: ✅ ${success}개 성공 / ❌ ${failed}개 실패`);
    console.log(`  저장: ${ASSET_DIR}`);
    console.log('═══════════════════════════════════════════════════');
}

main().catch((err) => {
    console.error('\n❌ 에러:', err);
    process.exit(1);
});
