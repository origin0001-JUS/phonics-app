/**
 * 립싱크 파일럿 테스트 스크립트
 *
 * Hedra API와 Kling LipSync(fal.ai) 두 가지를 테스트합니다.
 * 동일한 이미지 + 오디오로 각각 영상을 생성하여 품질 비교.
 *
 * 사전 준비:
 *   .env.local에 아래 키 중 하나 이상 설정:
 *     HEDRA_API_KEY=...     (hedra.com에서 발급)
 *     FAL_KEY=...           (fal.ai에서 발급, Kling LipSync용)
 *
 * 실행:
 *   npx tsx scripts/pilot-lipsync.ts
 *   npx tsx scripts/pilot-lipsync.ts --hedra-only
 *   npx tsx scripts/pilot-lipsync.ts --kling-only
 */

import * as fs from 'fs';
import * as path from 'path';

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

// ─── 설정 ───
const SEED_IMAGE = path.join(process.cwd(), 'photo_AQADkQ5rG6J6QVZ9.jpg');
const OUTPUT_DIR = path.join(process.cwd(), 'pilot_lipsync_output');
const TEST_WORDS = ['cat', 'cake', 'sun']; // 3개만 테스트

const HEDRA_API_KEY = process.env.HEDRA_API_KEY;
const FAL_KEY = process.env.FAL_KEY;

const args = process.argv.slice(2);
const hedraOnly = args.includes('--hedra-only');
const klingOnly = args.includes('--kling-only');

// ─── 출력 디렉토리 생성 ───
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── 유틸: 파일을 Base64로 변환 ───
function fileToBase64(filePath: string): string {
    return fs.readFileSync(filePath).toString('base64');
}

// ─── 유틸: URL에서 파일 다운로드 ───
async function downloadFile(url: string, outPath: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
}

// ═══════════════════════════════════════════════
// Hedra API
// ═══════════════════════════════════════════════
async function testHedra(word: string, audioPath: string): Promise<string | null> {
    if (!HEDRA_API_KEY) {
        console.log('  ⚠️  HEDRA_API_KEY 미설정 — Hedra 테스트 건너뜀');
        return null;
    }

    const baseUrl = 'https://mercury.dev.dream-ai.com/api';

    try {
        // Step 1: 이미지 업로드
        console.log('  [Hedra] 이미지 업로드 중...');
        const imgFormData = new FormData();
        const imgBlob = new Blob([fs.readFileSync(SEED_IMAGE)], { type: 'image/jpeg' });
        imgFormData.append('file', imgBlob, 'seed.jpg');

        const imgRes = await fetch(`${baseUrl}/v1/portrait`, {
            method: 'POST',
            headers: { 'X-API-Key': HEDRA_API_KEY },
            body: imgFormData,
        });
        if (!imgRes.ok) {
            const errText = await imgRes.text();
            throw new Error(`이미지 업로드 실패: ${imgRes.status} ${errText}`);
        }
        const imgData = await imgRes.json() as { url: string };
        const portraitUrl = imgData.url;
        console.log(`  [Hedra] 이미지 업로드 완료: ${portraitUrl.substring(0, 50)}...`);

        // Step 2: 오디오 업로드
        console.log('  [Hedra] 오디오 업로드 중...');
        const audFormData = new FormData();
        const audBlob = new Blob([fs.readFileSync(audioPath)], { type: 'audio/mpeg' });
        audFormData.append('file', audBlob, `${word}.mp3`);

        const audRes = await fetch(`${baseUrl}/v1/audio`, {
            method: 'POST',
            headers: { 'X-API-Key': HEDRA_API_KEY },
            body: audFormData,
        });
        if (!audRes.ok) {
            const errText = await audRes.text();
            throw new Error(`오디오 업로드 실패: ${audRes.status} ${errText}`);
        }
        const audData = await audRes.json() as { url: string };
        const audioUrl = audData.url;
        console.log(`  [Hedra] 오디오 업로드 완료`);

        // Step 3: 영상 생성 요청
        console.log('  [Hedra] 립싱크 영상 생성 요청...');
        const genRes = await fetch(`${baseUrl}/v1/characters`, {
            method: 'POST',
            headers: {
                'X-API-Key': HEDRA_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                avatarImage: portraitUrl,
                audioSource: 'audio',
                voiceUrl: audioUrl,
                aspectRatio: '16:9',
            }),
        });
        if (!genRes.ok) {
            const errText = await genRes.text();
            throw new Error(`생성 요청 실패: ${genRes.status} ${errText}`);
        }
        const genData = await genRes.json() as { jobId: string };
        const jobId = genData.jobId;
        console.log(`  [Hedra] Job 생성: ${jobId}`);

        // Step 4: 폴링
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch(`${baseUrl}/v1/characters/${jobId}`, {
                headers: { 'X-API-Key': HEDRA_API_KEY },
            });
            const statusData = await statusRes.json() as { status: string; videoUrl?: string; errorMessage?: string };

            if (statusData.status === 'Completed' && statusData.videoUrl) {
                const outPath = path.join(OUTPUT_DIR, `hedra_${word}.mp4`);
                await downloadFile(statusData.videoUrl, outPath);
                console.log(`  [Hedra] ✅ 완료: ${outPath}`);
                return outPath;
            } else if (statusData.status === 'Failed') {
                throw new Error(`생성 실패: ${statusData.errorMessage || 'unknown'}`);
            }
            process.stdout.write(`  [Hedra] 대기 중... (${(i + 1) * 5}초)\r`);
        }
        throw new Error('타임아웃 (5분)');
    } catch (err) {
        console.error(`  [Hedra] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// Kling LipSync (fal.ai)
// ═══════════════════════════════════════════════
async function testKling(word: string, audioPath: string): Promise<string | null> {
    if (!FAL_KEY) {
        console.log('  ⚠️  FAL_KEY 미설정 — Kling 테스트 건너뜀');
        return null;
    }

    try {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: FAL_KEY });

        console.log('  [Kling] 립싱크 영상 생성 요청...');

        const imageData = fileToBase64(SEED_IMAGE);
        const audioData = fileToBase64(audioPath);

        const result = await fal.subscribe('fal-ai/kling-video/lipsync/audio-to-video', {
            input: {
                face_image_url: `data:image/jpeg;base64,${imageData}`,
                audio_url: `data:audio/mpeg;base64,${audioData}`,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    process.stdout.write(`  [Kling] 처리 중...\r`);
                }
            },
        }) as { data: { video: { url: string } } };

        const videoUrl = result.data?.video?.url;
        if (!videoUrl) {
            throw new Error('응답에 video URL 없음');
        }

        const outPath = path.join(OUTPUT_DIR, `kling_${word}.mp4`);
        await downloadFile(videoUrl, outPath);
        console.log(`  [Kling] ✅ 완료: ${outPath}`);
        return outPath;
    } catch (err) {
        console.error(`  [Kling] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// SadTalker (fal.ai) — 이미지+오디오 → 립싱크 영상
// ═══════════════════════════════════════════════
async function testSadTalker(word: string, audioPath: string): Promise<string | null> {
    if (!FAL_KEY) {
        console.log('  ⚠️  FAL_KEY 미설정 — SadTalker 테스트 건너뜀');
        return null;
    }

    try {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: FAL_KEY });

        console.log('  [SadTalker] 립싱크 영상 생성 요청...');

        const imageData = fileToBase64(SEED_IMAGE);
        const audioData = fileToBase64(audioPath);

        const result = await fal.subscribe('fal-ai/sadtalker', {
            input: {
                source_image_url: `data:image/jpeg;base64,${imageData}`,
                driven_audio_url: `data:audio/mpeg;base64,${audioData}`,
                still_mode: true,
                preprocess: 'crop',
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    process.stdout.write(`  [SadTalker] 처리 중...\r`);
                }
            },
        }) as { data: { video: { url: string } } };

        const videoUrl = result.data?.video?.url;
        if (!videoUrl) {
            throw new Error('응답에 video URL 없음');
        }

        const outPath = path.join(OUTPUT_DIR, `sadtalker_${word}.mp4`);
        await downloadFile(videoUrl, outPath);
        console.log(`  [SadTalker] ✅ 완료: ${outPath}`);
        return outPath;
    } catch (err) {
        console.error(`  [SadTalker] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// LatentSync (fal.ai) — 이전 실패했지만 설정 조정하여 재시도
// ═══════════════════════════════════════════════
async function testLatentSync(word: string, audioPath: string): Promise<string | null> {
    if (!FAL_KEY) {
        console.log('  ⚠️  FAL_KEY 미설정 — LatentSync 테스트 건너뜀');
        return null;
    }

    try {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: FAL_KEY });

        console.log('  [LatentSync] 립싱크 영상 생성 요청...');

        const imageData = fileToBase64(SEED_IMAGE);
        const audioData = fileToBase64(audioPath);

        const result = await fal.subscribe('fal-ai/latent-sync', {
            input: {
                face_image_url: `data:image/jpeg;base64,${imageData}`,
                audio_url: `data:audio/mpeg;base64,${audioData}`,
                guidance_scale: 1.5,
                inference_steps: 30,
                seed: 42,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    process.stdout.write(`  [LatentSync] 처리 중...\r`);
                }
            },
        }) as { data: { video: { url: string } } };

        const videoUrl = result.data?.video?.url;
        if (!videoUrl) {
            throw new Error('응답에 video URL 없음');
        }

        const outPath = path.join(OUTPUT_DIR, `latentsync_${word}.mp4`);
        await downloadFile(videoUrl, outPath);
        console.log(`  [LatentSync] ✅ 완료: ${outPath}`);
        return outPath;
    } catch (err) {
        console.error(`  [LatentSync] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log(' 립싱크 파일럿 테스트');
    console.log('═══════════════════════════════════════════════');
    console.log(`시드 이미지: ${SEED_IMAGE}`);
    console.log(`테스트 단어: ${TEST_WORDS.join(', ')}`);
    console.log(`출력 디렉토리: ${OUTPUT_DIR}`);
    console.log(`Hedra API: ${HEDRA_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log(`FAL (Kling): ${FAL_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
    console.log('');

    if (!HEDRA_API_KEY && !FAL_KEY) {
        console.error('❌ HEDRA_API_KEY 또는 FAL_KEY 중 하나 이상 필요합니다.');
        console.error('   .env.local에 설정해주세요.');
        process.exit(1);
    }

    const results: { word: string; sadtalker: string | null; latentsync: string | null }[] = [];

    for (const word of TEST_WORDS) {
        const audioPath = path.join(process.cwd(), 'public', 'assets', 'audio', `${word}.mp3`);
        if (!fs.existsSync(audioPath)) {
            console.log(`⚠️  ${word}.mp3 없음 — 건너뜀`);
            continue;
        }

        console.log(`\n─── "${word}" 테스트 ───`);

        const sadtalkerResult = await testSadTalker(word, audioPath);
        const latentsyncResult = await testLatentSync(word, audioPath);

        results.push({ word, sadtalker: sadtalkerResult, latentsync: latentsyncResult });
    }

    // ─── 결과 요약 ───
    console.log('\n═══════════════════════════════════════════════');
    console.log(' 파일럿 결과 요약');
    console.log('═══════════════════════════════════════════════');
    for (const r of results) {
        console.log(`\n"${r.word}":`);
        console.log(`  SadTalker:  ${r.sadtalker ? `✅ ${r.sadtalker}` : '❌ 실패'}`);
        console.log(`  LatentSync: ${r.latentsync ? `✅ ${r.latentsync}` : '❌ 실패'}`);
    }

    const sadSuccess = results.filter(r => r.sadtalker).length;
    const latentSuccess = results.filter(r => r.latentsync).length;
    console.log(`\n성공률: SadTalker ${sadSuccess}/${results.length}, LatentSync ${latentSuccess}/${results.length}`);
    console.log(`\n생성된 영상을 확인하세요: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
