import * as fs from 'fs';
import * as path from 'path';
import { getAllWords } from '../src/data/curriculum';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env.local!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(filePath: string, mimeType: string) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType,
        },
    };
}

const MAX_CONCURRENT = 10;
let mismatchCount = 0;

async function verifyImage(wordId: string, word: string, meaning: string): Promise<void> {
    const imagePath = path.join(__dirname, `../public/assets/images/${wordId}.png`);

    if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Missing image for ${wordId}`);
        return;
    }

    try {
        const imagePart = fileToGenerativePart(imagePath, "image/png");
        const prompt = `You are a strict QA tester for a children's English educational app.
Does this image clearly represent the word "${word}" (meaning: ${meaning})? 
Is the main subject obvious to a child? 
Additionally, does the image conform to a bright, colorful "3D Pixar/Disney" style with a clean pastel background?
Is the main subject framed well in the center without being awkwardly cropped off at the edges?
Respond strictly with "YES" or "NO" on the first line, followed by a 1-sentence reason outlining any issues.`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();
        const firstLine = responseText.split('\n')[0].toUpperCase();

        if (firstLine.includes("YES")) {
            console.log(`✅ [${wordId}]: YES - ${responseText.split('\n').slice(1).join(' ')}`);
        } else {
            console.log(`❌ [${wordId}]: NO  - ${responseText}`);
            mismatchCount++;
        }
    } catch (err: any) {
        console.error(`⚠️  Failed to verify ${wordId}: ${err.message}`);
    }
}

async function main() {
    const words = getAllWords();
    console.log(`🔍 Starting automated QA verification for ${words.length} images using Gemini 1.5 Flash...`);

    for (let i = 0; i < words.length; i += MAX_CONCURRENT) {
        const batch = words.slice(i, i + MAX_CONCURRENT);
        const promises = batch.map(w => verifyImage(w.id, w.word, w.meaning));
        await Promise.all(promises);

        // Brief pause to prevent rate limits
        if (i + MAX_CONCURRENT < words.length) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("\n--- Verification Complete ---");
    if (mismatchCount > 0) {
        console.log(`⚠️ Found ${mismatchCount} potentially mismatched images that need manual review.`);
    } else {
        console.log(`🎉 All generated images look good and match their words!`);
    }
}

main().catch(console.error);
