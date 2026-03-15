/**
 * ═══════════════════════════════════════════════════════════════════
 * 한국어 TTS 생성 스크립트 — V2-8 Bilingual Home Screen
 * ───────────────────────────────────────────────────────────────────
 * 홈 화면 폭시 한국어 인사말 오디오를 ElevenLabs로 생성합니다.
 *
 * 실행: npx tsx scripts/generate-ko-tts.ts [--dry-run]
 * ═══════════════════════════════════════════════════════════════════
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

// .env.local 로드
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!apiKey && !dryRun) {
    console.error('❌ ELEVENLABS_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요.');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });

// 한국어 TTS 생성 목록
const KO_JOBS = [
    {
        filename: 'foxy_hello_ko.mp3',
        text: '안녕 나는 폭시야. 즐겁게 영어읽기 배워보자',
    },
];

// ElevenLabs 다국어 모델 (한국어 지원)
const MODEL_ID = 'eleven_multilingual_v2';

// Bella 보이스 — 밝고 활기찬 여성 음성 (영어 Rachel과 다른 톤)
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

async function synthesize(text: string, outputPath: string): Promise<void> {
    const responseStream = await elevenlabs.textToSpeech.stream(
        VOICE_ID,
        {
            model_id: MODEL_ID,
            text,
            voice_settings: {
                stability: 0.4,
                similarity_boost: 0.8,
                style: 0.4,
            },
        }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    fs.writeFileSync(outputPath, Buffer.concat(chunks));
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  🎙️ Korean TTS Generation (V2-8) ${dryRun ? '[DRY RUN]' : ''}`);
    console.log('═══════════════════════════════════════════════════');

    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    let generated = 0;
    let skipped = 0;

    for (const job of KO_JOBS) {
        const filePath = path.join(AUDIO_DIR, job.filename);

        if (fs.existsSync(filePath)) {
            console.log(`⏭️  이미 존재: ${job.filename}`);
            skipped++;
            continue;
        }

        if (dryRun) {
            console.log(`🧪 [Dry Run] 생성 예정: ${job.filename} | "${job.text}"`);
            generated++;
            continue;
        }

        console.log(`🎙️  생성 중: ${job.filename}`);
        console.log(`   텍스트: "${job.text}"`);

        try {
            await synthesize(job.text, filePath);
            const stats = fs.statSync(filePath);
            console.log(`   ✅ 완료 (${(stats.size / 1024).toFixed(1)} KB)`);
            generated++;
        } catch (err) {
            console.error(`   ❌ 실패:`, err);
            process.exit(1);
        }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ 생성: ${generated}  ⏭️ 스킵: ${skipped}`);
    console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
