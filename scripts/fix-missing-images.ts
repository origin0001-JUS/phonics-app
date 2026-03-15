import * as fs from 'fs';
import * as path from 'path';

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

// Custom words that need regeneration
const CUSTOM_WORDS = [
    { id: 'bad', word: 'bad', meaning: '나쁜' },
    { id: 'het', word: 'het', meaning: '모자 변형(het)' },
    { id: 'pan', word: 'pan', meaning: '프라이팬' },
    { id: 'cane', word: 'cane', meaning: '지팡이' },
    { id: 'mate', word: 'mate', meaning: '친구/짝꿍' },
    { id: 'mat', word: 'mat', meaning: '바닥 매트' } // Will be force regenerated
];

async function generateImageForWord(wordId: string, subject: string, force: boolean = false) {
    const outputPath = path.join(__dirname, `../public/assets/images/${wordId}.png`);

    if (force && fs.existsSync(outputPath)) {
        console.log(`🗑️ Deleting existing ${wordId}.png for force regeneration`);
        fs.unlinkSync(outputPath);
    }

    if (!force && fs.existsSync(outputPath)) {
        console.log(`⏩ Skipping ${wordId} (already exists)`);
        return;
    }

    const prompt = `A cute and high-quality 3D render of ${subject}. Soft studio lighting, Pixar or Disney style, vibrant colors. Extremely friendly and appealing to young children. Clean pastel background.`;

    console.log(`Generating image for: ${wordId}...`);
    try {
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
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const base64Image = part?.blob?.data || part?.inlineData?.data;

        if (!base64Image) {
            console.error(`❌ Missing image blob for ${wordId}`);
            return;
        }

        fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'));
        console.log(`✅ Generated ${wordId}.png`);
        await new Promise(r => setTimeout(r, 4000)); // Delay to prevent rate limit
    } catch (err: any) {
        console.error(`❌ Failed ${wordId}: ${err.message}`);
    }
}

async function main() {
    if (!API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in .env.local!");
        process.exit(1);
    }

    const imageDir = path.join(__dirname, '../public/assets/images');
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // 1. Generate missing custom words (force 'mat')
    for (const w of CUSTOM_WORDS) {
        await generateImageForWord(w.id, `${w.word} (${w.meaning})`, w.id === 'mat');
    }

    console.log("🎉 Target image generation completed!");
}

main();
