import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiTTS() {
    const url = `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-pro-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: "ig" }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede" // Example voice, or we can leave it empty for default
                    }
                }
            }
        }
    };

    console.log("Sending request to Gemini TTS...");
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const text = await res.text();
        console.log("API Error:", res.status, res.statusText, text);
        return;
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0].content) {
        const part = data.candidates[0].content.parts.find(p => p.inlineData);
        if (part && part.inlineData) {
            console.log("Got inlineData with mimeType:", part.inlineData.mimeType);
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            fs.writeFileSync("test_gemini_ig.mp3", buffer);
            console.log("Saved to test_gemini_ig.mp3");
        } else {
            console.log("No inlineData found in parts.");
        }
    } else {
        console.log("Unknown format:", JSON.stringify(data, null, 2));
    }
}

testGeminiTTS().catch(console.error);
