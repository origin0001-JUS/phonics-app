/**
 * Gemini API로 seed_final.jpeg 기반 15개 viseme 입모양 이미지 생성
 */
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve('C:/Users/origi/Antigravity-workspaces/Main_English/phonics-app/.env.local'), 'utf8');
const API_KEY = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1); }

const SEED_PATH = path.resolve('C:/Users/origi/Antigravity-workspaces/Main_English/phonics-app/out/assets/video/seed_final.jpeg');
const OUTPUT_DIR = path.resolve('C:/Users/origi/Antigravity-workspaces/Main_English/phonics-app/public/assets/images/mouth');

const seedBase64 = fs.readFileSync(SEED_PATH).toString('base64');

interface VisemePrompt { id: string; prompt: string; }

const visemes: VisemePrompt[] = [
    { id: 'dental', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "th" sound - the tip of the tongue should be clearly visible poking out between the upper and lower front teeth. The mouth is slightly open. Keep everything else (skin, nose, cheeks, hair, background, art style) exactly the same.' },
    { id: 'labiodental', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "f" sound - the upper front teeth are gently biting/resting on the lower lip. Keep everything else exactly the same.' },
    { id: 'open_front', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "ah" sound (as in "cat") - jaw dropped as wide as possible, mouth opened very wide, both upper and lower teeth visible. Keep everything else exactly the same.' },
    { id: 'close_front', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "ee" sound (as in "cheese") - lips stretched wide to the sides in a big grin, showing upper teeth. Keep everything else exactly the same.' },
    { id: 'close_back', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "oo" sound (as in "moon") - lips pursed into a small round circle, pushed forward like giving a kiss. Keep everything else exactly the same.' },
    { id: 'postalveolar', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "sh" sound - lips rounded and pushed slightly forward, mouth slightly open in a rounded shape. Keep everything else exactly the same.' },
    { id: 'open_back', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "oh" sound (as in "dog") - mouth open in a tall round O shape, lips rounded. Keep everything else exactly the same.' },
    { id: 'mid_front', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the short "e" sound (as in "bed") - mouth moderately open, less wide than "ah" but clearly open. Keep everything else exactly the same.' },
    { id: 'mid_central', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "uh" sound (as in "cup") - mouth relaxed and slightly open in a very natural position. Keep everything else exactly the same.' },
    { id: 'alveolar_fric', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "s" sound - teeth nearly closed with a narrow slit, lips slightly parted showing teeth close together. Keep everything else exactly the same.' },
    { id: 'alveolar_stop', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "t" or "l" sound - mouth slightly open. Keep everything else exactly the same.' },
    { id: 'bilabial', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "m" sound - both lips firmly pressed together, like humming. Keep everything else exactly the same.' },
    { id: 'velar', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "k" or "g" sound - mouth open moderately wide. Keep everything else exactly the same.' },
    { id: 'glottal', prompt: 'Edit this image: Change ONLY the mouth area. The character should be making the "h" sound - mouth wide open as if exhaling warmth, like saying "haa~". Keep everything else exactly the same.' },
];

async function generateImage(viseme: VisemePrompt): Promise<boolean> {
    const outputPath = path.join(OUTPUT_DIR, `${viseme.id}.jpeg`);
    if (fs.existsSync(outputPath)) {
        console.log(`  ⏭️  ${viseme.id} — already exists`);
        return true;
    }

    console.log(`  🎨 ${viseme.id} — generating...`);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: seedBase64 } },
                        { text: viseme.prompt }
                    ]}],
                    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error(`  ❌ ${viseme.id} — ${response.status}: ${err.slice(0, 150)}`);
            return false;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                const buf = Buffer.from(part.inlineData.data, 'base64');
                fs.writeFileSync(outputPath, buf);
                console.log(`  ✅ ${viseme.id} — saved (${(buf.length / 1024).toFixed(0)}KB)`);
                return true;
            }
        }

        const txt = parts.find((p: any) => p.text);
        console.error(`  ❌ ${viseme.id} — no image returned. Text: ${txt?.text?.slice(0, 80) || 'none'}`);
        return false;
    } catch (err) {
        console.error(`  ❌ ${viseme.id} — error: ${err}`);
        return false;
    }
}

async function main() {
    console.log('🖼️  Generating 14 mouth viseme images from seed_final.jpeg\n');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let ok = 0, fail = 0;
    for (const v of visemes) {
        const result = await generateImage(v);
        if (result) ok++; else fail++;
        await new Promise(r => setTimeout(r, 3000)); // rate limit
    }

    console.log(`\n📊 Done: ${ok} success, ${fail} failed`);
    fs.readdirSync(OUTPUT_DIR).forEach(f => console.log(`  - ${f}`));
}

main().catch(console.error);
