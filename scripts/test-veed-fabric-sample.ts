/**
 * VEED Fabric 1.0 샘플 테스트 스크립트
 *
 * 목적: 파닉스 교육에 적합한 립싱크 품질인지 3개 단어로 평가
 * 비용: 480p × 3개 × ~2초 = ~$0.48 (약 650원)
 *
 * 테스트 단어 (난이도별):
 *   1. "thin"  — /θ/ very hard: 혀가 치아 사이로 보여야 함
 *   2. "fish"  — /f/ very hard: 윗니가 아랫입술에 닿아야 함
 *   3. "cat"   — /æ/ hard: 입이 크게 벌어져야 함
 *
 * 실행:
 *   FAL_KEY=xxx ELEVENLABS_API_KEY=xxx npx tsx scripts/test-veed-fabric-sample.ts
 *
 * 또는 .env.local에 키 설정 후:
 *   npx tsx scripts/test-veed-fabric-sample.ts
 */

import { fal } from '@fal-ai/client';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── .env.local 로드 (dotenv 없이 간단 파싱) ───
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

// ─── 설정 ───
const FAL_KEY = process.env.FAL_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!FAL_KEY) {
    console.error('❌ FAL_KEY 환경변수가 필요합니다.');
    console.error('   FAL_KEY=xxx npx tsx scripts/test-veed-fabric-sample.ts');
    console.error('   또는 .env.local에 FAL_KEY=xxx 추가');
    process.exit(1);
}
if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY 환경변수가 필요합니다.');
    console.error('   ELEVENLABS_API_KEY=xxx npx tsx scripts/test-veed-fabric-sample.ts');
    console.error('   또는 .env.local에 ELEVENLABS_API_KEY=xxx 추가');
    process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

// ─── 테스트 단어 정의 ───
interface TestWord {
    word: string;
    /** 단어를 자연스럽게 발음하도록 하는 텍스트 */
    ttsText: string;
    /** 품질 체크 포인트 */
    checkpoints: string[];
}

const TEST_WORDS: TestWord[] = [
    {
        word: 'thin',
        ttsText: 'thin',
        checkpoints: [
            '혀끝이 윗니-아랫니 사이로 나오는가?',
            'th 소리 시 입 모양이 s/t와 구별되는가?',
            '전체적으로 자연스러운 입 움직임인가?',
        ],
    },
    {
        word: 'fish',
        ttsText: 'fish',
        checkpoints: [
            'f 소리 시 윗니가 아랫입술에 닿는가?',
            'sh 소리 시 입술이 둥글게 앞으로 나오는가?',
            'p 소리(두 입술 붙음)와 확실히 다르게 보이는가?',
        ],
    },
    {
        word: 'cat',
        ttsText: 'cat',
        checkpoints: [
            '/æ/ 모음 시 입이 크게 벌어지는가?',
            '"bet"(ɛ)의 입 벌림보다 확실히 더 큰가?',
            '전체 입 움직임 (c→æ→t) 타이밍이 자연스러운가?',
        ],
    },
];

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'video', 'samples');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const BASE_IMAGE = path.join(process.cwd(), 'public', 'assets', 'images', 'base_image_girl.png');

// ─── Step 1: ElevenLabs TTS로 음성 생성 ───
async function generateAudio(word: string, text: string): Promise<string> {
    const outPath = path.join(AUDIO_DIR, `${word}.mp3`);

    if (fs.existsSync(outPath)) {
        console.log(`  ♻️  음성 캐시 사용: ${word}.mp3`);
        return outPath;
    }

    console.log(`  🎙️  ElevenLabs TTS 생성 중: "${text}"`);

    const audio = await elevenlabs.textToSpeech.convert(
        'cgSgspJ2msm6clMCkdW9',  // "Jessica" voice — clear American English
        {
            text,
            model_id: 'eleven_turbo_v2_5',
            output_format: 'mp3_44100_128',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.85,
                style: 0.1,
                use_speaker_boost: true,
            },
        }
    );

    // Stream → Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
        chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(outPath, buffer);
    console.log(`  ✅ 저장됨: ${outPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
    return outPath;
}

// ─── Step 2: fal.ai에 오디오 업로드 ───
async function uploadToFal(filePath: string): Promise<string> {
    console.log(`  📤 fal.ai 업로드 중: ${path.basename(filePath)}`);
    const file = new File(
        [fs.readFileSync(filePath)],
        path.basename(filePath),
        { type: filePath.endsWith('.mp3') ? 'audio/mpeg' : 'image/png' }
    );
    const url = await fal.storage.upload(file);
    console.log(`  ✅ 업로드 완료: ${url}`);
    return url;
}

// ─── Step 3: VEED Fabric 1.0 영상 생성 ───
async function generateVideo(
    imageUrl: string,
    audioUrl: string,
    word: string,
    resolution: '480p' | '720p' = '480p'
): Promise<string> {
    const outPath = path.join(OUTPUT_DIR, `${word}_fabric.mp4`);

    console.log(`  🎬 VEED Fabric 1.0 생성 중: "${word}" (${resolution})`);
    console.log(`     모델: veed/fabric-1.0`);

    const startTime = Date.now();

    const result = await fal.subscribe('veed/fabric-1.0', {
        input: {
            image_url: imageUrl,
            audio_url: audioUrl,
            resolution,
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === 'IN_QUEUE') {
                console.log(`     ⏳ 큐 대기 중... (position: ${(update as { queue_position?: number }).queue_position ?? '?'})`);
            } else if (update.status === 'IN_PROGRESS') {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`     🔄 생성 중... (${elapsed}초 경과)`);
            }
        },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const videoData = result.data as { video?: { url?: string } };
    const videoUrl = videoData?.video?.url;

    if (!videoUrl) {
        console.error(`  ❌ 영상 URL 없음! 응답:`, JSON.stringify(result.data, null, 2));
        throw new Error(`No video URL in response for ${word}`);
    }

    console.log(`  ⬇️  영상 다운로드 중... (생성 ${elapsed}초 소요)`);

    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const videoBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outPath, videoBuffer);

    const sizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ 저장됨: ${outPath} (${sizeMB}MB, ${elapsed}초)`);

    return outPath;
}

// ─── 메인 ───
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  VEED Fabric 1.0 샘플 품질 테스트');
    console.log('  480p × 3단어 ≈ $0.48 (~650원)');
    console.log('═══════════════════════════════════════════════════\n');

    // 디렉토리 생성
    fs.mkdirSync(AUDIO_DIR, { recursive: true });

    // 기준 이미지 확인
    if (!fs.existsSync(BASE_IMAGE)) {
        console.error(`❌ 기준 이미지 없음: ${BASE_IMAGE}`);
        process.exit(1);
    }

    // Step 1: 기준 이미지 업로드
    console.log('📸 기준 이미지 업로드');
    const imageUrl = await uploadToFal(BASE_IMAGE);

    // Step 2~4: 각 단어별 TTS → 업로드 → 영상 생성
    const results: { word: string; videoPath: string; checkpoints: string[] }[] = [];

    for (const testWord of TEST_WORDS) {
        console.log(`\n─── ${testWord.word.toUpperCase()} ───`);

        // TTS 생성
        const audioPath = await generateAudio(testWord.word, testWord.ttsText);

        // fal.ai 업로드
        const audioUrl = await uploadToFal(audioPath);

        // 영상 생성
        const videoPath = await generateVideo(imageUrl, audioUrl, testWord.word);

        results.push({
            word: testWord.word,
            videoPath,
            checkpoints: testWord.checkpoints,
        });
    }

    // 결과 요약
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📋 품질 평가 체크리스트');
    console.log('═══════════════════════════════════════════════════\n');

    for (const r of results) {
        console.log(`🎬 ${r.word.toUpperCase()} → ${r.videoPath}`);
        for (const cp of r.checkpoints) {
            console.log(`   □ ${cp}`);
        }
        console.log();
    }

    console.log('💡 위 영상을 재생하며 체크포인트를 확인하세요.');
    console.log('   특히 th/f의 혀/치아 위치와 æ의 입 벌림 정도가 핵심입니다.');
    console.log('\n📂 영상 위치:', OUTPUT_DIR);

    // 비용 기록
    const totalSeconds = TEST_WORDS.length * 2; // 약 2초씩
    const estimatedCost = totalSeconds * 0.08;
    console.log(`💰 예상 비용: ~$${estimatedCost.toFixed(2)} (${(estimatedCost * 1320).toFixed(0)}원)`);
}

main().catch((err) => {
    console.error('\n❌ 에러 발생:', err);
    process.exit(1);
});
