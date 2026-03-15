/**
 * V2-9 Asset Audit Script
 * Compares curriculum word IDs against existing image/audio files
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { curriculum } from '../src/data/curriculum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

interface WordInfo { id: string; word: string; meaning: string; onset?: string; rime?: string; }

const allWords: WordInfo[] = [];
const onsets = new Set<string>();
const rimes = new Set<string>();

for (const unit of curriculum) {
    for (const word of unit.words) {
        allWords.push({ id: word.id, word: word.word, meaning: word.meaning, onset: word.onset, rime: word.rime });
        if (word.onset) onsets.add(word.onset);
        if (word.rime) rimes.add(word.rime);
    }
}

const uniqueWords = [...new Map(allWords.map(w => [w.id, w])).values()];

// Image audit
const imgDir = path.join(ROOT, 'public/assets/images');
const existingFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
const existingIds = new Set(existingFiles.map(f => path.parse(f).name));
const missingWords = uniqueWords.filter(w => !existingIds.has(w.id));

console.log('=== IMAGE AUDIT ===');
console.log('Total unique words:', uniqueWords.length);
console.log('Existing image files:', existingFiles.length);
console.log('Missing images:', missingWords.length);
if (missingWords.length > 0) {
    console.log('\nMissing word IDs:');
    missingWords.forEach(w => console.log(`  ${w.id} (${w.meaning})`));
}

// Phoneme audit
console.log('\n=== PHONEME AUDIT ===');
console.log(`Unique onsets (${onsets.size}):`, [...onsets].sort().join(', '));
console.log(`Unique rimes (${rimes.size}):`, [...rimes].sort().join(', '));

const phonemeDir = path.join(ROOT, 'public/assets/audio/phonemes');
const existingPhonemes = fs.existsSync(phonemeDir) ? fs.readdirSync(phonemeDir) : [];
console.log('Existing phoneme audio:', existingPhonemes.length);

// Missing phoneme audio
const neededOnsetFiles = [...onsets].map(o => `onset_${o}.mp3`);
const neededRimeFiles = [...rimes].map(r => `rime_${r}.mp3`);
const existingPhonemeSet = new Set(existingPhonemes);

const missingOnsets = neededOnsetFiles.filter(f => !existingPhonemeSet.has(f));
const missingRimes = neededRimeFiles.filter(f => !existingPhonemeSet.has(f));

console.log(`Missing onset audio (${missingOnsets.length}):`, missingOnsets.join(', '));
console.log(`Missing rime audio (${missingRimes.length}):`, missingRimes.join(', '));

// Output JSON for downstream scripts
const audit = {
    missingImages: missingWords.map(w => ({ id: w.id, word: w.word, meaning: w.meaning })),
    missingOnsets: [...onsets].filter(o => !existingPhonemeSet.has(`onset_${o}.mp3`)),
    missingRimes: [...rimes].filter(r => !existingPhonemeSet.has(`rime_${r}.mp3`)),
    allOnsets: [...onsets].sort(),
    allRimes: [...rimes].sort(),
};
fs.writeFileSync(path.join(ROOT, 'scripts', 'audit-result.json'), JSON.stringify(audit, null, 2));
console.log('\n=> Saved audit-result.json');
