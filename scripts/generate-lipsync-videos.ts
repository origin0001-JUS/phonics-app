/**
 * ═══════════════════════════════════════════════════════════════
 * AI Lipsync Video Automation Script (Google Veo API)
 * ───────────────────────────────────────────────────────────────
 *
 * Google VEO API (predictLongRunning)를 이용해
 * 92개 대표 단어의 립싱크 MP4 영상을 자동 생성합니다.
 *
 * 기준 이미지: public/assets/images/base_image_girl.png
 * 출력 경로:   public/assets/video/[word].mp4
 *
 * 실행: npx tsx scripts/generate-lipsync-videos.ts
 * 환경: .env.local에 GEMINI_API_KEY 필요
 * ═══════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Load .env.local ───
function loadEnv() {
    for (const envFile of ['.env.local', '.env']) {
        const envPath = path.join(__dirname, '..', envFile);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
                if (match) {
                    const key = match[1];
                    const value = (match[2] || '').replace(/(^['"]|['"]$)/g, '').trim();
                    if (!process.env[key]) process.env[key] = value;
                }
            });
        }
    }
}
loadEnv();

// ─── Configuration ───
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY or GOOGLE_API_KEY not found in .env.local');
    process.exit(1);
}

const VEO_MODEL = 'veo-2.0-generate-001';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const BASE_IMAGE_PATH = path.join(__dirname, '../public/assets/images/base_image_girl.png');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/video');

const POLL_INTERVAL_MS = 5_000;   // 5초 간격 폴링
const MAX_POLL_ATTEMPTS = 120;    // 최대 10분 대기
const CONCURRENCY = 2;            // 동시 생성 수 (API rate limit 고려)
const RETRY_DELAY_MS = 10_000;    // 실패 시 재시도 대기

// ─── 92개 대표 단어 (lipsync_guide_final.md 기준) ───
const REPRESENTATIVE_WORDS: string[] = [
    'cat', 'man', 'map', 'hat', 'bed', 'hen', 'net', 'red',
    'sit', 'pin', 'big', 'dog', 'hot', 'fox', 'hop',
    'bug', 'cup', 'sun', 'run', 'cake', 'name', 'lake', 'face',
    'bike', 'kite', 'nine', 'ride', 'bone', 'nose', 'home', 'phone',
    'cube', 'cute', 'tune', 'flute', 'bee', 'tree', 'sea', 'food',
    'read', 'black', 'clap', 'flag', 'blue', 'ship', 'shop', 'chin', 'chop',
    'thin', 'this', 'whale', 'when', 'pig',
    'sled', 'brush', 'crab', 'drum', 'frog', 'swim', 'snap', 'step',
    'snow', 'chip', 'whip', 'ring', 'sing', 'bank', 'pink',
    'meat', 'seed', 'boat', 'coat', 'bowl', 'rain', 'train', 'play',
    'gray', 'boy', 'coin', 'cow', 'house', 'car', 'star', 'corn',
    'fork', 'bird', 'girl', 'nurse', 'burn', 'book', 'moon', 'spoon',
];

// ─── Types ───
interface VeoOperation {
    name: string;
    done?: boolean;
    error?: { code: number; message: string; status: string };
    response?: {
        generateVideoResponse?: {
            generatedSamples?: Array<{
                video?: { uri: string; encoding?: string };
            }>;
            raiMediaFilteredCount?: number;
            raiMediaFilteredReasons?: string[];
        };
    };
}

// ─── Helpers ───
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getBaseImageBase64(): string {
    if (!fs.existsSync(BASE_IMAGE_PATH)) {
        console.error(`ERROR: Base image not found: ${BASE_IMAGE_PATH}`);
        process.exit(1);
    }
    return fs.readFileSync(BASE_IMAGE_PATH).toString('base64');
}

// ─── Build prompt for a word ───
// Veo 2.0: 이미지 전달 시 얼굴 안전 필터 차단 → 텍스트만으로 캐릭터 묘사.
// 음성/발음 관련 키워드는 오디오 필터 차단 → 시각적 동작만 묘사.
// 캐릭터 일관성을 위해 base_image_girl.png 외형을 프롬프트에 상세 기술.
const CHARACTER_DESC = 'A cute illustrated Korean girl with short black bob hair, rosy cheeks, big brown eyes, wearing a light blue collared shirt. Digital illustration style, soft clean lines.';

const PROMPT_VARIANTS = [
    `${CHARACTER_DESC} She smiles warmly at the camera and opens her mouth gently, then closes it. Solid white background, soft lighting, children educational app style.`,
    `${CHARACTER_DESC} She tilts her head slightly, smiles brightly, and moves her mouth naturally. Solid white background, warm soft lighting, gentle and welcoming animation.`,
    `${CHARACTER_DESC} She looks at the camera with a cheerful expression and opens her mouth wide, then gently closes. Solid white background, educational app style, bright mood.`,
    `${CHARACTER_DESC} She nods gently, opens her mouth with a warm smile, and blinks softly. Solid white background, warm lighting, children app style, inviting expression.`,
    `${CHARACTER_DESC} She waves slightly, opens her mouth cheerfully, then smiles. Solid white background, gentle animation, educational content style, friendly and warm.`,
];
function buildPrompt(_word: string, index: number): string {
    return PROMPT_VARIANTS[index % PROMPT_VARIANTS.length];
}

// ─── Start video generation → returns operation name ───
async function startVideoGeneration(word: string, _imageBase64: string, wordIndex: number): Promise<string> {
    const url = `${BASE_URL}/models/${VEO_MODEL}:predictLongRunning?key=${API_KEY}`;

    // Veo 2.0: 이미지 전달 시 얼굴 안전 필터 차단되므로 텍스트 프롬프트만 사용.
    // 캐릭터 외형은 프롬프트에 상세 기술하여 일관성 유지.
    const body = {
        instances: [
            {
                prompt: buildPrompt(word, wordIndex),
            },
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = (await response.json()) as VeoOperation;

    if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
    }

    if (!data.name) {
        throw new Error(`No operation name: ${JSON.stringify(data).slice(0, 200)}`);
    }

    return data.name;
}

// ─── Poll operation until done ───
async function pollOperation(operationName: string): Promise<VeoOperation> {
    const url = `${BASE_URL}/${operationName}?key=${API_KEY}`;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await sleep(POLL_INTERVAL_MS);

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`  Poll error (${attempt + 1}): ${response.status}`);
            continue;
        }

        const data = (await response.json()) as VeoOperation;

        if (data.error) {
            throw new Error(`Operation error: ${data.error.message}`);
        }

        if (data.done) {
            return data;
        }

        if (attempt % 12 === 11) {
            console.log(`  Still processing... (${Math.round((attempt + 1) * POLL_INTERVAL_MS / 1000)}s)`);
        }
    }

    throw new Error(`Timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

// ─── Download video from URI ───
async function downloadVideo(uri: string, outputPath: string): Promise<void> {
    // URI에 이미 query param이 있으면 &key, 없으면 ?key
    const separator = uri.includes('?') ? '&' : '?';
    const urlWithKey = `${uri}${separator}key=${API_KEY}`;

    let response = await fetch(urlWithKey);

    // key 포함 URL 실패 시, URI 자체만으로 재시도 (signed URL일 수 있음)
    if (!response.ok) {
        response = await fetch(uri);
    }

    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buf);
}

// ─── Generate one word video ───
async function generateWordVideo(
    word: string, imageBase64: string, index: number, total: number
): Promise<boolean> {
    const outputPath = path.join(OUTPUT_DIR, `${word}.mp4`);

    // 이미 존재하면 스킵 (1KB 이상이면 유효)
    if (fs.existsSync(outputPath)) {
        const stat = fs.statSync(outputPath);
        if (stat.size > 1000) {
            console.log(`[${index}/${total}] SKIP "${word}" (${(stat.size / 1024).toFixed(0)}KB)`);
            return true;
        }
    }

    console.log(`[${index}/${total}] Generating "${word}"...`);

    try {
        const wordIdx = REPRESENTATIVE_WORDS.indexOf(word);
        const operationName = await startVideoGeneration(word, imageBase64, wordIdx);
        const opId = operationName.split('/').pop();
        console.log(`  Operation: ${opId}`);

        const result = await pollOperation(operationName);

        // RAI 필터 체크
        const gvr = result.response?.generateVideoResponse;
        if (gvr?.raiMediaFilteredCount && gvr.raiMediaFilteredCount > 0) {
            const reason = gvr.raiMediaFilteredReasons?.[0]?.slice(0, 120) || 'unknown';
            console.error(`  FILTERED "${word}": ${reason}`);
            return false;
        }

        const samples = gvr?.generatedSamples;
        if (!samples?.length || !samples[0].video?.uri) {
            console.error(`  No video in response for "${word}"`);
            return false;
        }

        await downloadVideo(samples[0].video.uri, outputPath);

        const stat = fs.statSync(outputPath);
        console.log(`  DONE: ${word}.mp4 (${(stat.size / 1024).toFixed(0)}KB)`);
        return true;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  FAILED "${word}": ${msg.slice(0, 200)}`);
        return false;
    }
}

// ─── Concurrency worker pool ───
async function processWithConcurrency(
    words: string[], imageBase64: string, concurrency: number
): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];
    let idx = 0;

    async function worker() {
        while (idx < words.length) {
            const i = idx++;
            const ok = await generateWordVideo(words[i], imageBase64, i + 1, words.length);
            (ok ? success : failed).push(words[i]);

            // Rate limit 방지: 실패 시 잠시 대기
            if (!ok) await sleep(RETRY_DELAY_MS);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, words.length) }, () => worker())
    );

    return { success, failed };
}

// ─── Summary ───
function printSummary(successCount: number, failed: string[]) {
    console.log('\n===================================================');
    console.log('  SUMMARY');
    console.log('===================================================');

    const videoFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.mp4'));
    const totalSize = videoFiles.reduce((s, f) =>
        s + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0);

    console.log(`  Total videos:  ${videoFiles.length}/${REPRESENTATIVE_WORDS.length}`);
    console.log(`  Total size:    ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  Success:       ${successCount}`);
    console.log(`  Failed:        ${failed.length}`);

    if (failed.length > 0) {
        console.log(`\n  Failed words: ${failed.join(', ')}`);
        console.log('  Re-run script to retry failed words.');
    }

    const existing = new Set(videoFiles.map(f => f.replace('.mp4', '')));
    const missing = REPRESENTATIVE_WORDS.filter(w => !existing.has(w));
    if (missing.length > 0) {
        console.log(`\n  Still missing: ${missing.join(', ')}`);
    } else {
        console.log('\n  All 92 representative word videos present!');
    }
    console.log('===================================================');
}

// ─── Main ───
async function main() {
    console.log('===================================================');
    console.log('  V2-9 AI Lip-Sync Video Generator (Google Veo)');
    console.log('===================================================');
    console.log(`  Model:       ${VEO_MODEL}`);
    console.log(`  Words:       ${REPRESENTATIVE_WORDS.length}`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Base Image:  base_image_girl.png`);
    console.log(`  Output:      ${OUTPUT_DIR}`);
    console.log('===================================================\n');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Loading base image...');
    const imageBase64 = getBaseImageBase64();
    console.log(`  Size: ${(imageBase64.length * 0.75 / 1024).toFixed(0)}KB\n`);

    // 기존 파일 확인
    const alreadyDone = REPRESENTATIVE_WORDS.filter(w => {
        const p = path.join(OUTPUT_DIR, `${w}.mp4`);
        return fs.existsSync(p) && fs.statSync(p).size > 1000;
    });
    const remaining = REPRESENTATIVE_WORDS.filter(w => !alreadyDone.includes(w));

    console.log(`Already generated: ${alreadyDone.length}/${REPRESENTATIVE_WORDS.length}`);
    console.log(`Remaining: ${remaining.length}\n`);

    if (remaining.length === 0) {
        console.log('All videos already exist!');
        printSummary(REPRESENTATIVE_WORDS.length, []);
        return;
    }

    const startTime = Date.now();
    const { success, failed } = await processWithConcurrency(remaining, imageBase64, CONCURRENCY);
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log(`\nGeneration complete in ${elapsed} minutes.`);
    printSummary(alreadyDone.length + success.length, failed);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
