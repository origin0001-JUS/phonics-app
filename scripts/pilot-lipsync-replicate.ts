/**
 * 립싱크 파일럿 테스트 (Replicate)
 *
 * SadTalker + LatentSync 모델을 Replicate에서 테스트합니다.
 *
 * 실행: npx tsx scripts/pilot-lipsync-replicate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import Replicate from 'replicate';

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

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN 필요 (.env.local)');
    process.exit(1);
}

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

const SEED_IMAGE = path.join(process.cwd(), 'photo_AQADkQ5rG6J6QVZ9.jpg');
const OUTPUT_DIR = path.join(process.cwd(), 'pilot_lipsync_output');
const TEST_WORDS = ['cat', 'cake', 'sun'];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function fileToDataUri(filePath: string, mime: string): string {
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${b64}`;
}

async function downloadFile(url: string, outPath: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

// ═══════════════════════════════════════════════
// SadTalker (Replicate)
// ═══════════════════════════════════════════════
async function testSadTalker(word: string, audioPath: string): Promise<string | null> {
    try {
        console.log('  [SadTalker] 생성 요청...');
        const output = await replicate.run(
            'cjwbw/sadtalker:3aa3dac9353571e5cd29bb0f706ad5e28382e22094bb3d5b518217924b25e82b',
            {
                input: {
                    source_image: fileToDataUri(SEED_IMAGE, 'image/jpeg'),
                    driven_audio: fileToDataUri(audioPath, 'audio/mpeg'),
                    still: true,
                    preprocess: 'crop',
                },
            }
        );

        const videoUrl = typeof output === 'string' ? output : (output as any)?.output || (output as any)?.[0];
        if (!videoUrl) throw new Error('응답에 video URL 없음');

        const outPath = path.join(OUTPUT_DIR, `sadtalker_${word}.mp4`);
        await downloadFile(String(videoUrl), outPath);
        const size = fs.statSync(outPath).size;
        console.log(`  [SadTalker] ✅ 완료: ${outPath} (${(size / 1024).toFixed(0)}KB)`);
        return outPath;
    } catch (err) {
        console.error(`  [SadTalker] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// LatentSync (Replicate)
// ═══════════════════════════════════════════════
async function testLatentSync(word: string, audioPath: string): Promise<string | null> {
    try {
        console.log('  [LatentSync] 생성 요청...');
        const output = await replicate.run(
            'bytedance/latent-sync:59e7b182e298b1b23af8e33e71a571e4b43ca8fcf8adfc2ddd52b13f2e87b3cf',
            {
                input: {
                    face_image: fileToDataUri(SEED_IMAGE, 'image/jpeg'),
                    audio: fileToDataUri(audioPath, 'audio/mpeg'),
                    guidance_scale: 1.5,
                    inference_steps: 30,
                    seed: 42,
                },
            }
        );

        const videoUrl = typeof output === 'string' ? output : (output as any)?.output || (output as any)?.[0];
        if (!videoUrl) throw new Error('응답에 video URL 없음');

        const outPath = path.join(OUTPUT_DIR, `latentsync_${word}.mp4`);
        await downloadFile(String(videoUrl), outPath);
        const size = fs.statSync(outPath).size;
        console.log(`  [LatentSync] ✅ 완료: ${outPath} (${(size / 1024).toFixed(0)}KB)`);
        return outPath;
    } catch (err) {
        console.error(`  [LatentSync] ❌ 실패: ${err}`);
        return null;
    }
}

// ═══════════════════════════════════════════════
// 메인
// ═══════════════════════════════════════════════
async function main() {
    console.log('═══════════════════════════════════════════════');
    console.log(' 립싱크 파일럿 테스트 (Replicate)');
    console.log('═══════════════════════════════════════════════');
    console.log(`시드 이미지: ${SEED_IMAGE}`);
    console.log(`테스트 단어: ${TEST_WORDS.join(', ')}`);
    console.log('');

    const results: { word: string; sadtalker: string | null; latentsync: string | null }[] = [];

    for (const word of TEST_WORDS) {
        const audioPath = path.join(process.cwd(), 'public', 'assets', 'audio', `${word}.mp3`);
        if (!fs.existsSync(audioPath)) {
            console.log(`⚠️  ${word}.mp3 없음 — 건너뜀`);
            continue;
        }

        console.log(`\n─── "${word}" ───`);
        const sad = await testSadTalker(word, audioPath);
        const lat = await testLatentSync(word, audioPath);
        results.push({ word, sadtalker: sad, latentsync: lat });
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log(' 결과 요약');
    console.log('═══════════════════════════════════════════════');
    for (const r of results) {
        console.log(`\n"${r.word}":`);
        console.log(`  SadTalker:  ${r.sadtalker ? '✅ 성공' : '❌ 실패'}`);
        console.log(`  LatentSync: ${r.latentsync ? '✅ 성공' : '❌ 실패'}`);
    }
    const s1 = results.filter(r => r.sadtalker).length;
    const s2 = results.filter(r => r.latentsync).length;
    console.log(`\n성공률: SadTalker ${s1}/${results.length}, LatentSync ${s2}/${results.length}`);
    console.log(`\n영상 확인: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
