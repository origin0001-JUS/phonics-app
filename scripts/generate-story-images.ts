/**
 * V2-2: Decodable Stories Panel Image Generator
 * Generates cartoon-style story panels using Gemini API
 * Run: npx tsx scripts/generate-story-images.ts
 * Output: public/assets/stories/unit_XX/panel_N.png
 */

import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
            if (match) {
                const key = match[1];
                const value = (match[2] || '').replace(/(^['"]|['"]$)/g, '').trim();
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// Style anchor for consistency across all panels
const STYLE = `Children's educational comic panel illustration.
Style: Flat 2D cartoon, bold outlines, bright cheerful colors, Pixar-like character design.
Characters have big round eyes, simple friendly expressions.
Background is simple and uncluttered. No text or labels.
Square format (400x400). White border around the panel.`;

const STORIES: Record<string, { panels: string[] }> = {
    unit_01: {
        panels: [
            `${STYLE} Scene: A cute cartoon orange cat sitting happily on a colorful mat. Short-a phonics theme.`,
            `${STYLE} Scene: A cute cartoon bat flying above a fancy hat. Short-a phonics theme.`,
            `${STYLE} Scene: A cartoon man wearing a red cap looking at a treasure map. Short-a phonics theme.`,
            `${STYLE} Scene: A cartoon rat sitting sadly on a mat next to a tin can. Short-a phonics theme.`,
            `${STYLE} Scene: A cartoon cat tapping a bag with its paw playfully. Short-a phonics theme.`,
            `${STYLE} Scene: A cartoon cat and rat taking a nap together on a mat, both sleeping with ZZZs. Short-a phonics theme.`,
        ]
    },
    unit_02: {
        panels: [
            `${STYLE} Scene: A cute cartoon hen sitting cozy on a soft bed with pillows. Short-e phonics theme.`,
            `${STYLE} Scene: A cartoon dog wearing a red collar writing with a pen. Short-e phonics theme.`,
            `${STYLE} Scene: Ten cartoon men pulling a fishing net from the sea. Short-e phonics theme.`,
            `${STYLE} Scene: A cute cartoon jet plane flying through light rain, getting wet. Short-e phonics theme.`,
            `${STYLE} Scene: A cartoon kitten begging with big eyes at a food bowl, being fed. Short-e phonics theme.`,
            `${STYLE} Scene: A cartoon hen and dog sleeping together happily in a cozy den cave. Short-e phonics theme.`,
        ]
    },
    unit_03: {
        panels: [
            `${STYLE} Scene: A cute cartoon pink pig sitting down happily on a cushion. Short-i phonics theme.`,
            `${STYLE} Scene: A cartoon pig wearing a curly golden wig, looking silly and happy. Short-i phonics theme.`,
            `${STYLE} Scene: A cartoon pig digging in the dirt with a small shovel. Short-i phonics theme.`,
            `${STYLE} Scene: A cartoon child with wide eyes spotting the funny pig. Short-i phonics theme.`,
            `${STYLE} Scene: A cartoon child doing a Six backflip gymnastics move outdoors. Short-i phonics theme.`,
            `${STYLE} Scene: A cartoon pig and child sitting together side by side, smiling. Short-i phonics theme.`,
        ]
    },
    unit_04: {
        panels: [
            `${STYLE} Scene: A cartoon dog sitting on a log in a sunny park. Short-o phonics theme.`,
            `${STYLE} Scene: A cartoon dog looking hot and sweaty under a bright sun. Short-o phonics theme.`,
            `${STYLE} Scene: A cartoon dog carrying a mop to clean up. Short-o phonics theme.`,
            `${STYLE} Scene: A cartoon orange fox watching the dog with curiosity. Short-o phonics theme.`,
            `${STYLE} Scene: A cartoon fox jumping on top of a big box happily. Short-o phonics theme.`,
            `${STYLE} Scene: A cartoon dog and fox sharing food from a pot together. Short-o phonics theme.`,
        ]
    },
    unit_05: {
        panels: [
            `${STYLE} Scene: A cute cartoon bug sitting in warm sunlight looking happy. Short-u phonics theme.`,
            `${STYLE} Scene: A cartoon bug having fun inside a giant teacup. Short-u phonics theme.`,
            `${STYLE} Scene: A cartoon bug running very fast with motion lines. Short-u phonics theme.`,
            `${STYLE} Scene: A cartoon puppy dog chasing after the bug. Short-u phonics theme.`,
            `${STYLE} Scene: A cartoon bug hiding safely inside a yellow rubber bathtub. Short-u phonics theme.`,
            `${STYLE} Scene: A cartoon bug and puppy giving each other a big happy hug. Short-u phonics theme.`,
        ]
    },
    unit_07: {
        panels: [
            `${STYLE} Scene: A cartoon baker happily baking a big layered birthday cake. Long-a Magic-e phonics theme.`,
            `${STYLE} Scene: A cartoon child placing the cake carefully beside a sparkling lake. Long-a phonics theme.`,
            `${STYLE} Scene: A cartoon wave of water splashing toward the cake with a surprised expression. Long-a phonics theme.`,
            `${STYLE} Scene: A cartoon clock showing the cake arrived late, dripping with frosting. Long-a phonics theme.`,
            `${STYLE} Scene: A cartoon child and baker writing a creative new name for their cake. Long-a phonics theme.`,
            `${STYLE} Scene: A cartoon child and baker at a gate eating pieces of cake, celebrating. Long-a phonics theme.`,
        ]
    },
};

async function generatePanel(unitId: string, panelIndex: number, prompt: string, retries = 4, backoffMs = 15000): Promise<'skipped' | 'generated' | 'failed'> {
    const outDir = path.join(__dirname, `../public/assets/stories/${unitId}`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const pngPath = path.join(outDir, `panel_${panelIndex + 1}.png`);
    const svgPath = path.join(outDir, `panel_${panelIndex + 1}.svg`);

    if (fs.existsSync(pngPath)) {
        console.log(`⏩ Skipping ${unitId}/panel_${panelIndex + 1} (PNG exists)`);
        return 'skipped';
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                console.log(`⏳ Rate limited for ${unitId}/panel_${panelIndex + 1}. Retrying in ${backoffMs / 1000}s... (${retries} left)`);
                await new Promise(r => setTimeout(r, backoffMs));
                return generatePanel(unitId, panelIndex, prompt, retries - 1, backoffMs * 1.5);
            }
            throw new Error(`API Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as any;
        const parts = data?.candidates?.[0]?.content?.parts;
        if (!parts) throw new Error('No parts in response');

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                const buf = Buffer.from(part.inlineData.data, 'base64');
                fs.writeFileSync(pngPath, buf);
                // Remove SVG placeholder if it exists
                if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
                console.log(`✅ ${unitId}/panel_${panelIndex + 1}.png (${(buf.length / 1024).toFixed(0)}KB)`);
                return 'generated';
            }
        }
        throw new Error('No image data in response');
    } catch (err: any) {
        if (retries > 0 && (err.message?.includes('429') || err.message?.includes('rate'))) {
            console.log(`⏳ Retrying ${unitId}/panel_${panelIndex + 1} in ${backoffMs / 1000}s...`);
            await new Promise(r => setTimeout(r, backoffMs));
            return generatePanel(unitId, panelIndex, prompt, retries - 1, backoffMs * 1.5);
        }
        console.error(`❌ Failed ${unitId}/panel_${panelIndex + 1}: ${err.message}`);
        return 'failed';
    }
}

async function main() {
    if (!API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing in .env.local!');
        process.exit(1);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  📖 V2-2: Decodable Stories Panel Generator');
    console.log(`  Generating panels for ${Object.keys(STORIES).length} units`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    let generated = 0, skipped = 0, failed = 0;

    for (const [unitId, story] of Object.entries(STORIES)) {
        console.log(`\n📚 ${unitId} (${story.panels.length} panels):`);
        for (let i = 0; i < story.panels.length; i++) {
            const result = await generatePanel(unitId, i, story.panels[i]);
            if (result === 'generated') { generated++; await new Promise(r => setTimeout(r, 4000)); }
            else if (result === 'skipped') skipped++;
            else failed++;
        }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Generated: ${generated}`);
    console.log(`  ⏩ Skipped:   ${skipped}`);
    console.log(`  ❌ Failed:    ${failed}`);
    console.log('═══════════════════════════════════════════════════');
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });
