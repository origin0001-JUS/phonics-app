import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiTTS() {
    const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-pro-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    // We try to see if it responds to generateContent or a different endpoint
    const payload = {
        contents: [{ role: "user", parts: [{ text: "ig" }] }]
    };

    console.log("Sending request to Gemini TTS...");
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.log("API Error:", res.status, res.statusText);
        const text = await res.text();
        console.log("Error details:", text);
        return;
    }

    const data = await res.json();
    console.log("Response keys:", Object.keys(data));
    if (data.candidates && data.candidates[0].content) {
        console.log("Candidate content parts:", data.candidates[0].content.parts.length);
        const part = data.candidates[0].content.parts[0];
        if (part.inlineData) {
            console.log("Got inlineData with mimeType:", part.inlineData.mimeType);
        } else if (part.text) {
            console.log("Got text:", part.text);
            // Maybe we need a different request format?
        }
    } else {
        console.log("Unknown format:", JSON.stringify(data, null, 2));
    }
}

testGeminiTTS().catch(console.error);
