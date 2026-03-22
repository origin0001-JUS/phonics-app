import { CORE_CURRICULUM } from '../src/data/curriculum';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(PROJECT_ROOT, 'public');

interface Issue {
    unit: string;
    word: string;
    type: 'MISSING_WORD_MP3' | 'MISSING_ONSET_MP3' | 'MISSING_RIME_MP3' | 'SUSPICIOUS_SIZE';
    file: string;
    size?: number;
}

const issues: Issue[] = [];
const ok: { unit: string; word: string; file: string; size: number }[] = [];

for (const unit of CORE_CURRICULUM) {
    for (const word of unit.words) {
        // 1. Check word mp3
        const wordPath = path.join(PUBLIC, 'assets', 'audio', `${word.id}.mp3`);
        const wordExists = fs.existsSync(wordPath);
        if (!wordExists) {
            issues.push({ unit: unit.id, word: word.word, type: 'MISSING_WORD_MP3', file: `${word.id}.mp3` });
        } else {
            const size = fs.statSync(wordPath).size;
            ok.push({ unit: unit.id, word: word.word, file: `${word.id}.mp3`, size });
            // Flag very small files (<5KB)
            if (size < 5000) {
                issues.push({ unit: unit.id, word: word.word, type: 'SUSPICIOUS_SIZE', file: `${word.id}.mp3`, size });
            }
        }

        // 2. Check onset mp3
        if (word.onset) {
            const onsetPath = path.join(PUBLIC, 'assets', 'audio', 'phonemes', `onset_${word.onset.toLowerCase()}.mp3`);
            if (!fs.existsSync(onsetPath)) {
                issues.push({ unit: unit.id, word: word.word, type: 'MISSING_ONSET_MP3', file: `onset_${word.onset.toLowerCase()}.mp3` });
            }
        }

        // 3. Check rime mp3
        if (word.rime) {
            const rimePath = path.join(PUBLIC, 'assets', 'audio', 'phonemes', `rime_${word.rime.toLowerCase()}.mp3`);
            if (!fs.existsSync(rimePath)) {
                issues.push({ unit: unit.id, word: word.word, type: 'MISSING_RIME_MP3', file: `rime_${word.rime.toLowerCase()}.mp3` });
            }
        }
    }
}

// Deduplicate onset/rime missing files
const missingOnsets = new Set<string>();
const missingRimes = new Set<string>();
const missingSizes = new Set<string>();
const missingWords: string[] = [];

for (const issue of issues) {
    if (issue.type === 'MISSING_ONSET_MP3') missingOnsets.add(issue.file);
    else if (issue.type === 'MISSING_RIME_MP3') missingRimes.add(issue.file);
    else if (issue.type === 'SUSPICIOUS_SIZE') missingSizes.add(issue.file);
    else if (issue.type === 'MISSING_WORD_MP3') missingWords.push(issue.file);
}

console.log('\n====== PHONICS APP: FULL AUDIO QA REPORT ======\n');
console.log(`✅ OK files: ${ok.length}`);
console.log(`❌ Missing word MP3s: ${missingWords.length}`);
console.log(`⚠️  Suspicious size (<5KB): ${missingSizes.size}`);
console.log(`🔊 Missing onset phoneme files: ${missingOnsets.size}`);
console.log(`🔊 Missing rime phoneme files: ${missingRimes.size}`);

if (missingWords.length > 0) {
    console.log('\n--- MISSING WORD AUDIO ---');
    for (const f of missingWords) console.log(`  ❌ ${f}`);
}

if (missingSizes.size > 0) {
    console.log('\n--- SUSPICIOUS SIZE (may be corrupt/empty) ---');
    for (const f of missingSizes) {
        const issue = issues.find(i => i.file === f && i.type === 'SUSPICIOUS_SIZE');
        console.log(`  ⚠️  ${f} — ${issue?.size} bytes`);
    }
}

if (missingOnsets.size > 0) {
    console.log('\n--- MISSING ONSET PHONEME FILES ---');
    const sorted = [...missingOnsets].sort();
    for (const f of sorted) console.log(`  🔊 ${f}`);
}

if (missingRimes.size > 0) {
    console.log('\n--- MISSING RIME PHONEME FILES ---');
    const sorted = [...missingRimes].sort();
    for (const f of sorted) console.log(`  🔊 ${f}`);
}

console.log('\n====== END OF REPORT ======\n');
