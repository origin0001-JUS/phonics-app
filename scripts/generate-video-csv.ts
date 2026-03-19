import fs from 'fs';
import path from 'path';
import { representativeWords, soundFocusEntries } from '../src/data/representativeWords';

const OUTPUT_PATH = path.join(process.cwd(), 'flow_asset', 'phonics_video_list.csv');

function generateCSV() {
    // UTF-8 BOM for Excel to recognize Korean/special characters properly
    let csvContent = '\uFEFF';
    csvContent += 'Category,FileName,Word/Script,Phoneme,Unit(s)\n';

    // 1. Words
    const wordSet = new Set<string>();
    for (const [unit, words] of Object.entries(representativeWords)) {
        for (const word of words) {
            wordSet.add(word.toLowerCase());
        }
    }

    const sortedWords = Array.from(wordSet).sort();
    
    for (const word of sortedWords) {
        // Find which units this word belongs to
        const units = [];
        for (const [unit, words] of Object.entries(representativeWords)) {
            if (words.map(w => w.toLowerCase()).includes(word)) {
                units.push(unit);
            }
        }
        
        csvContent += `Word,${word}.mp4,${word},-,${units.join('; ')}\n`;
    }

    // 2. Sound Focus
    for (const entry of soundFocusEntries) {
        // Escape quotes if script has any, wrap in quotes
        const safeScript = `"${entry.script.replace(/"/g, '""')}"`;
        csvContent += `SoundFocus,${entry.id}.mp4,${safeScript},${entry.phoneme},${entry.unitIds.join('; ')}\n`;
    }

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, csvContent, 'utf-8');
    console.log(`✅ Excel compatible CSV generated at: ${OUTPUT_PATH}`);
}

generateCSV();
