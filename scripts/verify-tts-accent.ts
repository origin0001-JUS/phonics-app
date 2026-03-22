/**
 * ═══════════════════════════════════════════════════════════════════
 * TTS 억양(Accent) 검증 스크립트
 * ───────────────────────────────────────────────────────────────────
 * 
 * 두 가지 모드:
 *   --voice-info    : ElevenLabs API로 Charlotte 음성의 억양 메타데이터 조회
 *   --listen-check  : 감별 단어 10개의 오디오 파일 크기/존재 확인 + 청취 URL 출력
 * 
 * 실행 방법:
 *   npx tsx scripts/verify-tts-accent.ts --voice-info
 *   npx tsx scripts/verify-tts-accent.ts --listen-check
 * ═══════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// ─── 현재 사용 중인 음성 IDs ───
const VOICE_IDS = {
    CHARLOTTE: 'XB0fDUnXU5powFXDhCwa',
    RACHEL:    '21m00Tcm4TlvDq8ikWAM',  // 과거 사용 (미국식)
    LILY:      'pFZP5JQG7iQjIQuC4Bku',  // 영국식 후보
};

// ─── 억양 감별 단어 (영국/미국 차이가 명확한 것들) ───
const ACCENT_TEST_WORDS: { word: string; key: string; note: string }[] = [
    { word: 'car',  key: 'car',  note: 'r 묵음 여부 (영국: kɑː, 미국: kɑːr)' },
    { word: 'hot',  key: 'hot',  note: '모음 차이 (영국: hɒt, 미국: hɑːt)' },
    { word: 'bat',  key: 'bat',  note: 'Short a (영국/미국 유사, 기준선)' },
    { word: 'van',  key: 'van',  note: 'v 발음 (기준선)' },
    { word: 'run',  key: 'run',  note: 'r 초성 (영국: 약한 r, 미국: 강한 r)' },
    { word: 'hop',  key: 'hop',  note: '단모음 o (영국: hɒp, 미국: hɑːp)' },
    { word: 'map',  key: 'map',  note: '짧은 a (기준선)' },
    { word: 'big',  key: 'big',  note: '단모음 i (기준선)' },
    { word: 'dog',  key: 'dog',  note: '단모음 o (영국: dɒg, 미국: dɑːg)' },
    { word: 'tune', key: 'tune', note: 'yod (영국: tjuːn, 미국: tuːn)' },
];

// ─── Track A: ElevenLabs API로 음성 메타데이터 확인 ───
async function checkVoiceInfo() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎙️  Track A: ElevenLabs 음성 메타데이터 확인');
    console.log('═══════════════════════════════════════════════════');

    if (!ELEVENLABS_API_KEY) {
        console.error('❌ ELEVENLABS_API_KEY 환경변수가 필요합니다.');
        console.error('   .env.local에 ELEVENLABS_API_KEY=xxx 추가 후 다시 실행하세요.');
        return;
    }

    for (const [name, voiceId] of Object.entries(VOICE_IDS)) {
        console.log(`\n📋 ${name} (${voiceId})`);
        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
                headers: { 'xi-api-key': ELEVENLABS_API_KEY },
            });

            if (!res.ok) {
                console.log(`  ❌ API 오류: ${res.status} ${res.statusText}`);
                continue;
            }

            const data = await res.json() as {
                name: string;
                labels: Record<string, string>;
                description?: string;
                preview_url?: string;
            };

            console.log(`  이름: ${data.name}`);
            console.log(`  설명: ${data.description ?? '없음'}`);
            console.log('  Labels:');
            for (const [k, v] of Object.entries(data.labels ?? {})) {
                const accentEmoji = k === 'accent'
                    ? (v.toLowerCase().includes('british') ? '🇬🇧' : v.toLowerCase().includes('american') ? '🇺🇸' : '❓')
                    : '';
                console.log(`    ${k}: ${v} ${accentEmoji}`);
            }
            if (data.preview_url) {
                console.log(`  미리듣기: ${data.preview_url}`);
            }
        } catch (err) {
            console.log(`  ❌ 오류: ${(err as Error).message}`);
        }
    }

    console.log('');
    console.log('───────────────────────────────────────────────────');
    console.log('  📌 결론 해석 가이드:');
    console.log('    labels.accent = "british"  → 영국식 ✅');
    console.log('    labels.accent = "american" → 미국식 ❌ (재생성 필요)');
    console.log('═══════════════════════════════════════════════════');
}

// ─── Track B: 감별 단어 오디오 파일 분석 ───
async function listenCheck() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎧  Track B: 감별 단어 오디오 파일 분석');
    console.log('═══════════════════════════════════════════════════');

    // ffprobe 사용 가능 여부 확인
    let hasFFprobe = false;
    try {
        execSync('ffprobe -version', { stdio: 'ignore' });
        hasFFprobe = true;
        console.log('  ✅ ffprobe 사용 가능 — 오디오 길이를 측정합니다.');
    } catch {
        console.log('  ⚠️  ffprobe 없음 — 파일 크기만 확인합니다.');
    }

    console.log('');
    console.log('  단어        | 존재 | 크기(KB) | 길이(초) | 청취 URL');
    console.log('  -----------|------|----------|----------|-----------------------------------');

    const results: { word: string; exists: boolean; sizeKB: number; durationSec: number | null; note: string }[] = [];

    for (const { word, key, note } of ACCENT_TEST_WORDS) {
        const filePath = path.join(AUDIO_DIR, `${key}.mp3`);
        const exists = fs.existsSync(filePath);
        let sizeKB = 0;
        let durationSec: number | null = null;

        if (exists) {
            const stat = fs.statSync(filePath);
            sizeKB = Math.round(stat.size / 1024);

            if (hasFFprobe) {
                try {
                    const out = execSync(
                        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "${filePath}"`,
                        { encoding: 'utf-8' }
                    ).trim();
                    // Output: "duration=1.234000"
                    const match = out.match(/duration=(\d+\.?\d*)/);
                    if (match) durationSec = parseFloat(parseFloat(match[1]).toFixed(2));
                } catch {
                    // ffprobe failed on this file
                }
            }
        }

        const existMark = exists ? '✅ ' : '❌ ';
        const sizeFmt = exists ? `${sizeKB}KB` : '-';
        const durFmt = durationSec !== null ? `${durationSec}s` : '-';
        const url = exists ? `http://localhost:4000/assets/audio/${key}.mp3` : '파일 없음';

        console.log(
            `  ${word.padEnd(11)} | ${existMark} | ${sizeFmt.padEnd(8)} | ${durFmt.padEnd(8)} | ${url}`
        );

        results.push({ word, exists, sizeKB, durationSec, note });
    }

    console.log('');
    console.log('───────────────────────────────────────────────────');
    console.log('  📌 억양 구분 포인트:');
    for (const { word, note } of ACCENT_TEST_WORDS) {
        console.log(`    ${word.padEnd(5)} → ${note}`);
    }
    console.log('');
    console.log('  🔊 브라우저에서 직접 청취:');
    console.log('    car  → http://localhost:4000/assets/audio/car.mp3');
    console.log('    hot  → http://localhost:4000/assets/audio/hot.mp3');
    console.log('    tune → http://localhost:4000/assets/audio/tune.mp3');
    console.log('    dog  → http://localhost:4000/assets/audio/dog.mp3');
    console.log('');
    console.log('  📋 판단 기준:');
    console.log('    car: "카" 로 끝나면 영국식, "카r"처럼 r 발음 들리면 미국식');
    console.log('    tune: "튠"이면 영국식, "툰"이면 미국식');
    console.log('    hot: 모음이 둥글면(hɒt) 영국식, 평평하면(hɑːt) 미국식');

    // 파일이 없는 항목 경고
    const missing = results.filter(r => !r.exists);
    if (missing.length > 0) {
        console.log('');
        console.log('  ⚠️  누락 파일:');
        for (const m of missing) {
            console.log(`    ${m.word}.mp3 → TTS 재생성 필요`);
        }
    }

    console.log('═══════════════════════════════════════════════════');
}

// ─── 메인 ───
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--voice-info')) {
        await checkVoiceInfo();
    } else if (args.includes('--listen-check')) {
        await listenCheck();
    } else {
        // 기본: 둘 다 실행
        await checkVoiceInfo();
        await listenCheck();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
