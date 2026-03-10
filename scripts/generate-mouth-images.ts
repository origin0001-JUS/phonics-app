/**
 * ═══════════════════════════════════════════════════════════════
 * V2-11: Viseme Mouth Image Generator (30 images)
 * ───────────────────────────────────────────────────────────────
 * 
 * Generates 15 front view + 15 cross-section view mouth images
 * for the pronunciation visualization dual-view system.
 * 
 * Uses Gemini API (gemini-3-pro-image-preview) to generate
 * high-quality educational mouth position illustrations.
 * 
 * Run: npx tsx scripts/generate-mouth-images.ts
 * Output: public/assets/mouth/[viseme]-front.png & [viseme]-cross.png
 * ═══════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
            if (match) {
                const key = match[1];
                let value = (match[2] || '').replace(/(^['"]|['"]$)/g, '').trim();
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/assets/mouth');

// 15 Viseme definitions with phoneme examples and Korean tips
const VISEMES = [
    { id: 'sil', label: 'Silence / Rest', phonemes: '(silence)', korTip: '입을 자연스럽게 다물고 있는 상태' },
    { id: 'PP', label: 'P / B / M', phonemes: '/p/, /b/, /m/', korTip: '두 입술을 꽉 다문 상태 (ㅂ, ㅁ과 비슷)' },
    { id: 'FF', label: 'F / V', phonemes: '/f/, /v/', korTip: '윗니가 아랫입술을 가볍게 물기 (한국어에 없는 소리!)' },
    { id: 'TH', label: 'Th (θ / ð)', phonemes: '/θ/, /ð/', korTip: '혀끝이 윗니 사이에 살짝 나오기 (한국어에 없는 소리!)' },
    { id: 'DD', label: 'T / D / N / L', phonemes: '/t/, /d/, /n/, /l/', korTip: '혀끝이 윗잇몸에 닿기 (ㄴ, ㄷ, ㄹ과 비슷)' },
    { id: 'kk', label: 'K / G / NG', phonemes: '/k/, /g/, /ŋ/', korTip: '혀 뒤쪽이 입천장 뒤에 닿기 (ㄱ, ㅋ과 비슷)' },
    { id: 'CH', label: 'Ch / J / Sh', phonemes: '/tʃ/, /dʒ/, /ʃ/', korTip: '입술을 둥글게 모으고 혀를 올리기 (ㅈ, ㅊ과 비슷)' },
    { id: 'SS', label: 'S / Z', phonemes: '/s/, /z/', korTip: '이를 살짝 맞대고 공기를 내보내기 (ㅅ과 비슷)' },
    { id: 'RR', label: 'R', phonemes: '/r/, /ɹ/', korTip: '혀를 뒤로 말아 입천장에 닿지 않게 (한국어에 없는 소리!)' },
    { id: 'aa', label: 'Short a (æ)', phonemes: '/æ/', korTip: '입을 옆으로 넓게 벌리기 (\"애\"와 비슷하지만 더 넓게)' },
    { id: 'EE', label: 'Long e (iː)', phonemes: '/iː/, /ɪ/', korTip: '입꼬리를 양쪽으로 당기기 (\"이\"와 비슷)' },
    { id: 'IH', label: 'Short i (ɪ)', phonemes: '/ɪ/', korTip: '\"이\"보다 입을 조금 더 벌린 상태' },
    { id: 'OH', label: 'Long o / aw (ɔː)', phonemes: '/oʊ/, /ɔː/', korTip: '입을 둥글게 \"오\" 모양으로 만들기' },
    { id: 'OO', label: 'oo / u (uː)', phonemes: '/uː/, /ʊ/', korTip: '입술을 앞으로 내밀어 작은 원 만들기 (\"우\"와 비슷)' },
    { id: 'schwa', label: 'Schwa (ə)', phonemes: '/ə/, /ʌ/', korTip: '입을 자연스럽게 약간만 벌리기 (\"어\"와 비슷)' },
];

async function generateImage(visemeId: string, viewType: 'front' | 'cross', prompt: string, retries = 5, backoffMs = 15000): Promise<'skipped' | 'generated' | 'failed'> {
    const filename = `${visemeId}-${viewType}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(outputPath)) {
        console.log(`⏩ Skipping ${filename} (already exists)`);
        return 'skipped';
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
            })
        });

        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                console.log(`⏳ Rate limited for ${filename}. Retrying in ${backoffMs / 1000}s... (${retries} left)`);
                await new Promise(r => setTimeout(r, backoffMs));
                return generateImage(visemeId, viewType, prompt, retries - 1, backoffMs * 1.5);
            }
            throw new Error(`API Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as any;
        const parts = data?.candidates?.[0]?.content?.parts;
        if (!parts) throw new Error('No parts in response');

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                const buf = Buffer.from(part.inlineData.data, 'base64');
                fs.writeFileSync(outputPath, buf);
                console.log(`✅ Generated ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
                return 'generated';
            }
        }

        throw new Error('No image data in response');
    } catch (err: any) {
        if (retries > 0 && err.message?.includes('429')) {
            console.log(`⏳ Rate limited for ${filename}. Retrying in ${backoffMs / 1000}s...`);
            await new Promise(r => setTimeout(r, backoffMs));
            return generateImage(visemeId, viewType, prompt, retries - 1, backoffMs * 1.5);
        }
        console.error(`❌ Failed to generate ${filename}:`, err.message);
        return 'failed';
    }
}

async function main() {
    if (!API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local!");
        process.exit(1);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  👄 V2-11: Viseme Mouth Image Generator');
    console.log('  Generating 15 front views + 15 cross-sections');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Created: ${OUTPUT_DIR}`);
    }

    let generated = 0, skipped = 0, failed = 0;

    // ═══ UNIFIED STYLE ANCHOR (consistency key!) ═══
    const STYLE_ANCHOR_FRONT = `You are generating a series of 15 images for a children's phonics app. 
ALL images in this series MUST share the EXACT SAME style:
- Subject: A close-up of a single pair of human lips and lower face (nose tip to chin), front view.
- Skin tone: warm peachy-beige, consistent across all images.
- Lighting: soft, even studio lighting, no harsh shadows.
- Background: solid #F5F0EB (warm off-white), no gradients, no patterns.
- Rendering: semi-realistic 3D render, smooth skin texture, Pixar-quality.
- Camera: straight-on front view, identical framing and distance for every image.
- NO text, NO labels, NO arrows. Just the mouth.`;

    const STYLE_ANCHOR_CROSS = `You are generating a series of 15 cross-section diagrams for a children's phonics app.
ALL diagrams in this series MUST share the EXACT SAME style:
- Subject: A sagittal (side-cut) anatomical cross-section of the human head from nose to throat.
- Colors: soft pink (#F4C2C2) for oral tissue, white for teeth, coral-red (#E06060) for the tongue, light blue arrows for airflow.
- Background: solid white #FFFFFF.
- Line style: clean vector illustration with soft rounded edges, NO harsh outlines.
- Camera: exact same framing, same scale, same angle for every diagram.
- NO text, NO labels. Just the anatomy.`;

    for (const v of VISEMES) {
        // --- FRONT VIEW ---
        const frontPrompt = `${STYLE_ANCHOR_FRONT}

Now generate the mouth position for: "${v.label}" sound (${v.phonemes}).
The lips, teeth, and tongue should clearly show the correct articulation for this specific sound.`;

        const r1 = await generateImage(v.id, 'front', frontPrompt);
        if (r1 === 'generated') generated++;
        else if (r1 === 'skipped') skipped++;
        else failed++;

        // Small delay between front and cross
        if (r1 === 'generated') await new Promise(r => setTimeout(r, 3000));

        // --- CROSS-SECTION VIEW ---
        const crossPrompt = `${STYLE_ANCHOR_CROSS}

Now generate the cross-section for: "${v.label}" sound (${v.phonemes}).
Clearly show the tongue position (raised/lowered/front/back), lip shape, and airflow path for this specific sound.`;

        const r2 = await generateImage(v.id, 'cross', crossPrompt);
        if (r2 === 'generated') generated++;
        else if (r2 === 'skipped') skipped++;
        else failed++;

        // Delay between visemes
        if (r2 === 'generated') await new Promise(r => setTimeout(r, 5000));
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Generated: ${generated}`);
    console.log(`  ⏩ Skipped: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📁 Output: ${OUTPUT_DIR}`);
    console.log('═══════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
