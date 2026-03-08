// 실행: npx tsx scripts/generate-vocab-csv.ts

import { getAllWords } from '../src/data/curriculum';
import * as fs from 'fs';

const words = getAllWords();

const header = 'word,phonemes,meaning,onset,rime,word_family,textbook_tags,sight_word,image_path,audio_path';

const rows = words.map(w => {
    const phonemes = w.phonemes.join('-');
    const textbookTags = w.textbookTags?.join(';') || '';
    const sight = w.isSightWord ? 'Y' : 'N';
    const onset = w.onset || '';
    const rime = w.rime || '';
    const wordFamily = w.wordFamily || '';

    return [
        w.word, phonemes, `"${w.meaning}"`, onset, rime, wordFamily,
        textbookTags, sight, w.imagePath, w.audioPath
    ].join(',');
});

const csv = [header, ...rows].join('\n');
fs.writeFileSync('vocab_master.csv', csv, 'utf-8');

console.log(`✅ vocab_master.csv 생성 완료 (${rows.length}개 단어)`);
