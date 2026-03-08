import * as fs from 'fs';
import * as path from 'path';
import { getAllWords } from '../src/data/curriculum';

// Manually load variables from .env.local to avoid missing module errors
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                    value = value.replace(/\\n/gm, '\n');
                }
                value = value.replace(/(^['"]|['"]$)/g, '').trim();
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MAX_CONCURRENT = 1; // Heavy constraint for free-tier limits

async function generateImageForWord(wordId: string, prompt: string, retries = 5, backoffMs = 15000): Promise<'skipped' | 'generated' | 'failed'> {
    const outputPath = path.join(__dirname, `../public/assets/images/${wordId}.png`);

    // Skip if image already exists
    if (fs.existsSync(outputPath)) {
        console.log(`⏩ Skipping ${wordId} (already exists)`);
        return 'skipped';
    }

    try {
        // Call Gemini 3 Pro Image Preview (Nano Banana Pro)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                console.log(`⏳ Rate limited for ${wordId}. Retrying in ${backoffMs / 1000}s... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, backoffMs));
                return generateImageForWord(wordId, prompt, retries - 1, backoffMs * 1.5);
            }
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const base64Image = part?.blob?.data || part?.inlineData?.data;

        if (!base64Image) {
            console.error(`❌ Missing image blob for ${wordId}. Response data:`, JSON.stringify(data).substring(0, 300));
            return 'failed';
        }

        // Save base64 string directly to PNG
        fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
        console.log(`✅ Generated ${wordId}.png`);
        return 'generated';
    } catch (err: any) {
        console.error(`❌ Failed ${wordId}: ${err.message}`);
        return 'failed';
    }
}

async function main() {
    if (!API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local!");
        process.exit(1);
    }

    const words = getAllWords();
    console.log(`🚀 Starting generation for ${words.length} words using Gemini API...`);

    const imageDir = path.join(__dirname, '../public/assets/images');
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // Process in batches (concurrency) to avoid hitting rate limits too quickly
    for (let i = 0; i < words.length; i += MAX_CONCURRENT) {
        const batch = words.slice(i, i + MAX_CONCURRENT);
        const promises = batch.map(w => {
            const subject = `${w.word} (${w.meaning})`;
            const prompt = `A cute and high-quality 3D render of ${subject}. Soft studio lighting, Pixar or Disney style, vibrant colors. Extremely friendly and appealing to young children. Clean pastel background.`;
            return generateImageForWord(w.id, prompt);
        });

        const results = await Promise.all(promises);

        // Sleep for 5 seconds between batches ONLY if we actually made API calls (didn't skip all)
        if (i + MAX_CONCURRENT < words.length && results.includes('generated')) {
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log("🎉 All image generations completed!");
    // Exit with success code
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Unexpected error in main:", err);
    process.exit(1);
});
