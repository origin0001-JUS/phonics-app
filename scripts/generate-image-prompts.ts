import * as fs from 'fs';
import { getAllWords } from '../src/data/curriculum';

// This script generates a text file containing prompts for Nano Banana Pro
// to create 300 high-quality 3D Pixar-style word images.

function generateImagePrompts() {
    const words = getAllWords();
    const prompts: string[] = [];

    prompts.push("=== Nano Banana Pro Bulk Prompts: 3D Pixar Style ===");
    prompts.push("Instructions: Set aspect ratio to 1:1, use transparent or clean white/pastel backgrounds.");
    prompts.push("Base Prompt Style: A cute and high-quality 3D render of [SUBJECT]. Soft studio lighting, Pixar or Disney style, vibrant colors. Extremely friendly and appealing to young children. Clean pastel background.\n");

    const batchSize = 50;

    for (let i = 0; i < words.length; i++) {
        if (i % batchSize === 0) {
            prompts.push(`\n--- BATCH ${Math.floor(i / batchSize) + 1} (${i + 1}-${Math.min(i + batchSize, words.length)}) ---`);
        }

        const w = words[i];
        const subject = `${w.word} (${w.meaning})`;
        const prompt = `${w.id}.png: A cute and high-quality 3D render of ${subject}. Soft studio lighting, Pixar or Disney style, vibrant colors. Extremely friendly and appealing to young children. Clean pastel background.`;

        prompts.push(prompt);
    }

    const outputPath = 'docs/03-analysis/word-image-prompts-3d.txt';
    fs.writeFileSync(outputPath, prompts.join('\n'), 'utf-8');
    console.log(`✅ Generated ${words.length} prompts to ${outputPath}`);
}

generateImagePrompts();
