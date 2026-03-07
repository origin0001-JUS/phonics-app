/**
 * ═══════════════════════════════════════════════════════════════════
 * TTS 음성 비교 스크립트 — Neural2 vs Journey vs Studio
 * ───────────────────────────────────────────────────────────────────
 *
 * 동일한 단어/문장을 3가지 Google Cloud TTS 음성으로 생성하여
 * 품질을 직접 비교할 수 있게 합니다.
 *
 * REST API + API Key 방식 사용 (서비스 계정 JSON 불필요)
 *
 * ─── 실행 방법 ───
 *    cd phonics-app
 *    npx tsx scripts/compare-tts-voices.ts
 *
 * ─── 결과물 ───
 *    public/assets/audio/_samples/ 폴더에 생성됨
 *    예: cat_neural2.mp3, cat_journey.mp3, cat_studio.mp3
 * ═══════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', '_samples');

// ─── API Key ───
const API_KEY = 'AIzaSyBtI-BDW5P3u8PzE928QLpERxEObf2XHa4';
const TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

// ─── 비교할 3가지 Journey 음성 ───
const VOICES = [
    {
        label: 'journey_f',
        displayName: '🟢 Journey-F (여성, 밝음)',
        config: {
            languageCode: 'en-US',
            name: 'en-US-Journey-F',
            ssmlGender: 'FEMALE',
        },
    },
    {
        label: 'journey_o',
        displayName: '🟢 Journey-O (여성, 차분함)',
        config: {
            languageCode: 'en-US',
            name: 'en-US-Journey-O',
            ssmlGender: 'FEMALE',
        },
    },
    {
        label: 'journey_d',
        displayName: '🟢 Journey-D (남성, 부드러움)',
        config: {
            languageCode: 'en-US',
            name: 'en-US-Journey-D',
            ssmlGender: 'MALE',
        },
    },
];

// ─── 비교할 샘플 텍스트 (빠른 테스트를 위해 2개만) ───
const SAMPLES = [
    { text: 'cat', type: 'word' as const, description: '단모음 단어' },
    { text: 'A fat cat sat on a mat.', type: 'sentence' as const, description: '디코더블 문장' },
];



// ─── REST API를 통한 TTS 합성 ───
async function synthesize(
    text: string,
    type: 'word' | 'sentence',
    voice: typeof VOICES[0],
    outputPath: string
): Promise<void> {
    // Each voice family has different feature support:
    //   Neural2: SSML prosody (rate, pitch), speakingRate, pitch, effectsProfileId ✅
    //   Studio:  SSML prosody (rate only), speakingRate ✅, pitch ❌, effectsProfileId ❌
    //   Journey: plain text only, minimal audioConfig (audioEncoding only)

    let input: Record<string, string>;
    const audioConfig: Record<string, unknown> = { audioEncoding: 'MP3' };

    if (voice.label === 'neural2') {
        // Neural2: full SSML + all audioConfig options
        const ssml = type === 'word'
            ? `<speak><prosody rate="slow" pitch="+1st">${text}</prosody></speak>`
            : `<speak><prosody rate="medium">${text}</prosody></speak>`;
        input = { ssml };
        audioConfig.speakingRate = 0.85;
        audioConfig.pitch = 2.0;
        audioConfig.effectsProfileId = ['headphone-class-device'];
    } else if (voice.label === 'studio') {
        // Studio: SSML with rate only, no pitch, no effectsProfileId
        const ssml = type === 'word'
            ? `<speak><prosody rate="slow">${text}</prosody></speak>`
            : `<speak><prosody rate="medium">${text}</prosody></speak>`;
        input = { ssml };
        audioConfig.speakingRate = 0.85;
    } else {
        // Journey: plain text only, no SSML, minimal audioConfig
        input = { text };
    }

    const requestBody = {
        input,
        voice: voice.config,
        audioConfig,
    };

    const response = await fetch(TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { audioContent?: string };

    if (data.audioContent) {
        const buffer = Buffer.from(data.audioContent, 'base64');
        fs.writeFileSync(outputPath, buffer);
    } else {
        throw new Error('No audioContent in response');
    }
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎧 TTS Voice Comparison — Neural2 vs Journey vs Studio');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // 1) 출력 디렉토리 생성
    if (!fs.existsSync(SAMPLES_DIR)) {
        fs.mkdirSync(SAMPLES_DIR, { recursive: true });
    }
    console.log(`📁 Output: ${SAMPLES_DIR}`);
    console.log('');

    // 2) 각 샘플 × 각 음성 생성
    let total = 0;
    const failed: string[] = [];

    for (const sample of SAMPLES) {
        console.log(`📝 "${sample.text}" (${sample.description})`);

        for (const voice of VOICES) {
            const safeName = sample.text
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .substring(0, 30);

            const filename = `${safeName}_${voice.label}.mp3`;
            const outputPath = path.join(SAMPLES_DIR, filename);

            try {
                await synthesize(sample.text, sample.type, voice, outputPath);
                console.log(`   ✅ ${voice.displayName} → ${filename}`);
                total++;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.log(`   ❌ ${voice.displayName} → FAILED: ${msg}`);
                failed.push(`${filename}: ${msg}`);
            }

            // Rate limit 방어 (200ms)
            await new Promise(r => setTimeout(r, 200));
        }
        console.log('');
    }

    // 3) 요약
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Generated: ${total} / ${SAMPLES.length * VOICES.length} files`);
    if (failed.length > 0) {
        console.log(`  ❌ Failed: ${failed.length}`);
        for (const f of failed) {
            console.log(`     - ${f}`);
        }
    }
    console.log(`  📁 Location: ${SAMPLES_DIR}`);
    console.log('');
    console.log('  🎧 비교 방법:');
    console.log('     1) 탐색기에서 폴더 열기:');
    console.log(`        ${SAMPLES_DIR}`);
    console.log('     2) 또는 브라우저에서 (dev 서버 실행 중이면):');
    console.log('        http://localhost:3000/assets/audio/_samples/cat_neural2.mp3');
    console.log('        http://localhost:3000/assets/audio/_samples/cat_journey.mp3');
    console.log('        http://localhost:3000/assets/audio/_samples/cat_studio.mp3');
    console.log('     3) 같은 단어의 _neural2 / _journey / _studio 파일을 비교하세요!');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
