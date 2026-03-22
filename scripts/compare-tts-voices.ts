/**
 * ═══════════════════════════════════════════════════════════════════
 * TTS 음성 비교 샘플 생성 스크립트
 * ───────────────────────────────────────────────────────────────────
 * 
 * 5개 ElevenLabs 후보 음성 × 5개 단어 = 25개 MP3 샘플을 생성합니다.
 * 사용자가 직접 재생하여 음질/속도/전달력을 비교한 뒤 1개를 선택합니다.
 * 
 * ─── 실행 방법 ───
 *    ELEVENLABS_API_KEY=xxx npx tsx scripts/compare-tts-voices.ts
 *    (또는 .env.local에 ELEVENLABS_API_KEY 설정 후 실행)
 * ═══════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'samples');

// ─── .env.local 로드 ───
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY 환경변수가 필요합니다.');
    console.error('   .env.local에 ELEVENLABS_API_KEY=xxx 추가 후 다시 실행하세요.');
    process.exit(1);
}

// ─── 후보 음성 5개 ───
const VOICES = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'rachel',    label: 'Rachel — 현재 사용 중, 밝고 명확' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'charlotte', label: 'Charlotte — 또박또박 교육용' },
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'lily',      label: 'Lily — 따뜻하고 밝은 영국식' },
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'alice',     label: 'Alice — 자연스럽고 부드러운' },
    { id: '9BWtsMINqrJLrRacOk9x', name: 'aria',      label: 'Aria — 프로페셔널, 전달력 강한' },
];

// ─── 테스트 단어 5개 (다양한 발음 패턴) ───
const TEST_WORDS = ['cat', 'bike', 'train', 'moon', 'church'];

// ─── TTS 설정 ───
const MODEL_ID = 'eleven_multilingual_v2';
const SPEED = 0.7;

async function generateSample(voiceId: string, voiceName: string, word: string): Promise<void> {
    const filename = `${voiceName}_${word}.mp3`;
    const outputPath = path.join(SAMPLES_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
        console.log(`  ⏩ 이미 존재: ${filename}`);
        return;
    }

    const safeText = word.charAt(0).toUpperCase() + word.slice(1) + '.';

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY!,
            },
            body: JSON.stringify({
                text: safeText,
                model_id: MODEL_ID,
                voice_settings: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    speed: SPEED,
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errText.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`  ✅ 생성 완료: ${filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎙️  TTS 음성 비교 샘플 생성기');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  모델: ${MODEL_ID}`);
    console.log(`  속도: ${SPEED}`);
    console.log(`  단어: ${TEST_WORDS.join(', ')}`);
    console.log(`  음성: ${VOICES.length}개`);
    console.log(`  총 샘플: ${VOICES.length * TEST_WORDS.length}개`);
    console.log('───────────────────────────────────────────────────');

    // Ensure output directory exists
    fs.mkdirSync(SAMPLES_DIR, { recursive: true });

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const voice of VOICES) {
        console.log(`\n🎤 ${voice.label}`);
        for (const word of TEST_WORDS) {
            try {
                const existed = fs.existsSync(path.join(SAMPLES_DIR, `${voice.name}_${word}.mp3`));
                await generateSample(voice.id, voice.name, word);
                if (existed) skipped++;
                else generated++;
            } catch (err) {
                console.error(`  ❌ 실패: ${voice.name}_${word} — ${(err as Error).message}`);
                failed++;
            }
            // Rate limit: ~200ms between requests
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  📊 결과: 생성 ${generated} / 건너뜀 ${skipped} / 실패 ${failed}`);
    console.log(`  📁 샘플 위치: public/assets/audio/samples/`);
    console.log('───────────────────────────────────────────────────');
    console.log('  🎧 브라우저에서 다음 URL로 직접 재생하세요:');
    for (const voice of VOICES) {
        console.log(`     ${voice.name}: http://localhost:4000/assets/audio/samples/${voice.name}_cat.mp3`);
    }
    console.log('═══════════════════════════════════════════════════');
}

main().catch(console.error);
