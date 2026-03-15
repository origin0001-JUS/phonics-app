/**
 * Generate SVG placeholder panels for Decodable Stories (V2-2)
 * Units 03-07 - will be replaced with real AI illustrations later
 * Run: npx tsx scripts/generate-story-placeholders.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const STORIES: Record<string, { title: string; color: string; panels: { text: string; emoji: string }[] }> = {
    unit_03: {
        title: 'The Big Pig', color: '#FFB3E6',
        panels: [
            { text: 'A big pig sat.', emoji: '🐷' },
            { text: 'The pig had a wig.', emoji: '💇' },
            { text: 'It did a big dig.', emoji: '⛏️' },
            { text: 'A kid saw the pig.', emoji: '🧒' },
            { text: 'The kid did a six flip!', emoji: '6️⃣' },
            { text: 'The pig and the kid sat.', emoji: '🐷🧒' },
        ]
    },
    unit_04: {
        title: 'The Hot Dog', color: '#FFD9A0',
        panels: [
            { text: 'A dog sat on a log.', emoji: '🐶' },
            { text: 'It was hot!', emoji: '🌡️' },
            { text: 'The dog got a mop.', emoji: '🧹' },
            { text: 'The fox saw the dog.', emoji: '🦊' },
            { text: 'The fox hopped on top.', emoji: '🔝' },
            { text: 'The dog and fox had a pot.', emoji: '🍲' },
        ]
    },
    unit_05: {
        title: 'The Fun Bug', color: '#B3FFD9',
        panels: [
            { text: 'A bug sat in the sun.', emoji: '🐛' },
            { text: 'It had fun in a cup.', emoji: '☕' },
            { text: 'The bug ran and ran.', emoji: '🏃' },
            { text: 'A pup got the bug!', emoji: '🐶' },
            { text: 'The bug hid in a tub.', emoji: '🛁' },
            { text: 'The bug and pup had a hug.', emoji: '🤗' },
        ]
    },
    unit_07: {
        title: 'The Magic Cake', color: '#FFE5B3',
        panels: [
            { text: 'Bake a big cake!', emoji: '🎂' },
            { text: 'Put it by the lake.', emoji: '🏞️' },
            { text: 'A wave came in!', emoji: '🌊' },
            { text: 'The cake was late.', emoji: '⏰' },
            { text: 'We made a new name.', emoji: '📛' },
            { text: 'We had cake at the gate!', emoji: '🚪' },
        ]
    },
};

function createPanel(unitId: string, panelIndex: number, text: string, emoji: string, bgColor: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" rx="16" fill="${bgColor}" stroke="#E0E0E0" stroke-width="2"/>
  <text x="200" y="100" font-size="80" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <rect x="20" y="200" width="360" height="80" rx="12" fill="white" fill-opacity="0.8"/>
  <text x="200" y="245" font-family="'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-size="22" 
        font-weight="700" fill="#333" text-anchor="middle" dominant-baseline="central">${text}</text>
  <text x="380" y="20" font-family="Arial" font-size="14" fill="#999" text-anchor="end">${panelIndex + 1}</text>
</svg>`;
}

async function main() {
    const storiesDir = path.join(__dirname, '../public/assets/stories');

    for (const [unitId, story] of Object.entries(STORIES)) {
        const unitDir = path.join(storiesDir, unitId);
        if (!fs.existsSync(unitDir)) fs.mkdirSync(unitDir, { recursive: true });

        story.panels.forEach((panel, i) => {
            const svg = createPanel(unitId, i, panel.text, panel.emoji, story.color);
            const outPath = path.join(unitDir, `panel_${i + 1}.svg`);
            if (!fs.existsSync(outPath.replace('.svg', '.png'))) {
                fs.writeFileSync(outPath, svg);
                console.log(`✅ ${unitId}/panel_${i + 1}.svg`);
            } else {
                console.log(`⏩ ${unitId}/panel_${i + 1}.png (PNG exists, skipping)`);
            }
        });
    }
    console.log('\n🎉 Story placeholder panels generated!');
    console.log('📁 Output: public/assets/stories/');
    console.log('💡 Replace .svg files with real AI illustrations when ready.');
}

main().catch(console.error);
