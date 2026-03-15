import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Sync load env
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            process.env[match[1]] = (match[2] || '').replace(/(^['"]|['"]$)/g, '').trim();
        }
    });
}

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const MISSING_IMAGES = [
    'bet', 'bid', 'pit', 'nit', 'bog', 'put', 'dug', 'hate', 'hid', 'rode', 'cope', 'cheap', 'sink', 'sick', 'sin'
];

async function generateImageForWord(wordId: string, prompt: string, retries = 5, backoffMs = 15000) {
    const outputPath = path.join(ROOT, `public/assets/images/${wordId}.png`);
    if (fs.existsSync(outputPath)) return 'skipped';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
        });
        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                await new Promise(r => setTimeout(r, backoffMs));
                return generateImageForWord(wordId, prompt, retries - 1, backoffMs * 1.5);
            }
            throw new Error(`API Error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        const base64Image = data?.candidates?.[0]?.content?.parts?.[0]?.blob?.data || data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Image) return 'failed';
        fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
        console.log(`✅ Generated ${wordId}.png`);
        return 'generated';
    } catch (err: any) {
        console.error(`❌ Failed ${wordId}: ${err.message}`);
        return 'failed';
    }
}

async function main() {
    console.log(`🚀 Generating ${MISSING_IMAGES.length} missing minimal pair images...`);
    for (const w of MISSING_IMAGES) {
        const prompt = `A cute and high-quality 3D render of ${w}. Soft studio lighting, Pixar or Disney style, vibrant colors. Extremely friendly and appealing to young children. Clean pastel background. IMPORTANT: No text, no letters, no words, no speech bubbles.`;
        await generateImageForWord(w, prompt);
        await new Promise(r => setTimeout(r, 4000));
    }
}
main();

