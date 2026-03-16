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
Style: Flat 2D cartoon, bold outlines, bright cheerful colors, completely textless.
CRITICAL RULE: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO ALPHABETS, NO SPEECH BUBBLES ANYWHERE IN THE IMAGE.
Background is simple and uncluttered.
Square format (400x400). White border around the panel.`;

// Cohesive stories with consistent subjects per unit
const STORIES: Record<string, { panels: string[] }> = {
    unit_01: {
        panels: [
            `${STYLE} Scene: A single cute, fat orange cartoon cat sitting happily on a colorful mat. No text.`,
            `${STYLE} Scene: The EXACT SAME fat orange cat sleeping peacefully (taking a nap) on the mat. No text.`,
            `${STYLE} Scene: A small brown cartoon rat running toward the mat where the orange cat is. No text.`,
            `${STYLE} Scene: The EXACT SAME fat orange cat and the brown rat sitting together as friends on the mat. No text.`,
            `${STYLE} Scene: The EXACT SAME fat orange cat wearing a blue cap and holding a small bag. No text.`,
            `${STYLE} Scene: The fat orange cat and the brown rat running happily toward a human dad figure. No text.`,
        ]
    },
    unit_02: {
        panels: [
            `${STYLE} Scene: A single cute cartoon red hen sitting inside a small pen enclosure. No text.`,
            `${STYLE} Scene: The EXACT SAME red hen looking at a large comfortable bed. No text.`,
            `${STYLE} Scene: A fishing net resting on top of the bed. The red hen looks at it. No text.`,
            `${STYLE} Scene: The EXACT SAME red hen standing outside in the rain, getting completely wet. No text.`,
            `${STYLE} Scene: Ten cartoon men gathering around the wet red hen to help her. No text.`,
            `${STYLE} Scene: The EXACT SAME red hen resting comfortably in the bed with blankets. No text.`,
        ]
    },
    unit_03: {
        panels: [
            `${STYLE} Scene: A single huge, cute pink cartoon pig sitting down happily. No text.`,
            `${STYLE} Scene: The EXACT SAME pink pig doing a funny jig dance. No text.`,
            `${STYLE} Scene: The pink pig hiding inside a large dirt pit. No text.`,
            `${STYLE} Scene: A cartoon kid suddenly biting into a sweet fig fruit. No text.`,
            `${STYLE} Scene: The EXACT SAME pink pig and the kid sitting together side-by-side. No text.`,
            `${STYLE} Scene: A close-up of The EXACT SAME pink pig smiling broadly. No text.`,
        ]
    },
    unit_04: {
        panels: [
            `${STYLE} Scene: A single cartoon dog looking at a hot dog on a plate. No text.`,
            `${STYLE} Scene: A cartoon orange fox hiding inside a cardboard box. No text.`,
            `${STYLE} Scene: The EXACT SAME cartoon dog running to the top of a small hill. No text.`,
            `${STYLE} Scene: A cartoon mom holding a hot cooking pot with steam rising. No text.`,
            `${STYLE} Scene: The EXACT SAME cartoon dog and the orange fox hopping joyfully together. No text.`,
            `${STYLE} Scene: The dog and fox resting comfortably after hopping. No text.`,
        ]
    },
    unit_05: {
        panels: [
            `${STYLE} Scene: A cartoon hen sitting inside a small wooden pen. No text.`,
            `${STYLE} Scene: The EXACT SAME hen is bright red acting silly. No text.`,
            `${STYLE} Scene: A fishing net resting on a bed. No text.`,
            `${STYLE} Scene: The EXACT SAME hen standing outside in the rain, getting wet. No text.`,
            `${STYLE} Scene: Ten happy cartoon men greeting the hen. No text.`,
            `${STYLE} Scene: The red hen sleeping peacefully in the bed. No text.`,
        ]
    },
    unit_07: {
        panels: [
            `${STYLE} Scene: A cartoon girl named Kate cheerfully baking a large cake in a kitchen. No text.`,
            `${STYLE} Scene: The EXACT SAME girl, Kate, carrying the cake toward a beautiful blue lake. No text.`,
            `${STYLE} Scene: The sun setting (late) as Kate arrives at a wooden gate near the lake. No text.`,
            `${STYLE} Scene: A cartoon boy named Dave giving a superhero cape to Kate. No text.`,
            `${STYLE} Scene: Kate wearing the cape and Dave having a fun running race together. No text.`,
            `${STYLE} Scene: Kate and Dave celebrating their great game by the lake. No text.`,
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
