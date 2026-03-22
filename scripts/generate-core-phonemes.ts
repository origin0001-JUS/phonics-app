import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PHONEME_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'phonemes');

dotenv.config({ path: path.join(PROJECT_ROOT, 'env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '..', '.env.local') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY is not set');
    process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey });
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa';
const MODEL_ID = 'eleven_multilingual_v2';

// IPA -> [ safe filename part, prompt for ElevenLabs ]
const CORE_PHONEMES: Record<string, [string, string]> = {
    'æ': ['ae', 'ah.'], 
    'ɛ': ['eh', 'eh.'], 
    'ɪ': ['ih', 'ih.'], 
    'ɒ': ['aw', 'aw.'], 
    'ʌ': ['uh', 'uh.'],
    'eɪ': ['ay', 'ayy.'], 
    'aɪ': ['eye', 'eye.'], 
    'oʊ': ['oh', 'oh.'], 
    'juː': ['you', 'you.'], 
    'uː': ['oo', 'ooo.'],
    'iː': ['ee', 'eee.'], 
    'ɑːr': ['ar', 'ahr.'], 
    'ɔːr': ['or', 'or.'], 
    'ɜːr': ['er', 'err.'],
    'ɔɪ': ['oy', 'oy.'], 
    'aʊ': ['ow', 'oww.'],
    'ʃ': ['sh', 'shhhh.'], 
    'tʃ': ['ch', 'chuh.'], 
    'θ': ['th', 'thhhh.'], 
    'ð': ['th_v', 'thhhh.'],
    'dʒ': ['j', 'juh.'], 
    'ŋ': ['ng', 'ngggg.']
};

async function synthesizePhoneme(filename: string, text: string, outputPath: string): Promise<void> {
    const responseStream = await elevenlabs.textToSpeech.stream(
        VOICE_CHARLOTTE,
        {
            model_id: MODEL_ID,
            text,
            voice_settings: {
                stability: 0.7,
                similarity_boost: 0.8,
                speed: 0.7,
            },
        }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of responseStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, buffer);
}

async function main() {
    if (!fs.existsSync(PHONEME_DIR)) {
        fs.mkdirSync(PHONEME_DIR, { recursive: true });
    }

    console.log('Generating Core Phonemes...');
    let generated = 0;

    for (const [phoneme, [safeName, prompt]] of Object.entries(CORE_PHONEMES)) {
        const filename = `core_${safeName}.mp3`;
        const filePath = path.join(PHONEME_DIR, filename);

        if (!fs.existsSync(filePath) || process.argv.includes('--force')) {
            console.log(`Generating ${filename} for /${phoneme}/ using prompt: "${prompt}"`);
            try {
                await synthesizePhoneme(filename, prompt, filePath);
                generated++;
                await new Promise(r => setTimeout(r, 200));
            } catch (err) {
                console.error(`Failed to generate ${filename}:`, err);
            }
        } else {
            console.log(`Skipping ${filename} (already exists)`);
        }
    }

    console.log(`Done! Generated ${generated} core phoneme audio files.`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
