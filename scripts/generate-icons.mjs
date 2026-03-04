/**
 * Generate PWA icon PNGs from icon.svg using sharp.
 * Run: npx --yes sharp-cli && node scripts/generate-icons.mjs
 *   OR: npm exec -- node scripts/generate-icons.mjs  (if sharp is available)
 *
 * This script uses sharp programmatically via dynamic import.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");
const SVG_PATH = join(ICONS_DIR, "icon.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error(
      "sharp is not installed. Install it first:\n  npm install --save-dev sharp\nThen run this script again."
    );
    process.exit(1);
  }

  await mkdir(ICONS_DIR, { recursive: true });
  const svgBuffer = await readFile(SVG_PATH);

  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular (any) icon
    const anyBuf = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    await writeFile(join(ICONS_DIR, `icon-${size}.png`), anyBuf);
    console.log(`✓ icon-${size}.png`);

    // Maskable icon (20% safe-zone padding → content scaled to 60% of canvas)
    const innerSize = Math.round(size * 0.6);
    const offset = Math.round(size * 0.2);

    const innerBuf = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    const maskableBuf = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 143, g: 223, b: 255, alpha: 1 }, // #8fdfff
      },
    })
      .composite([{ input: innerBuf, left: offset, top: offset }])
      .png()
      .toBuffer();

    await writeFile(join(ICONS_DIR, `icon-maskable-${size}.png`), maskableBuf);
    console.log(`✓ icon-maskable-${size}.png`);
  }

  console.log("\nAll icons generated in public/icons/");
}

main();
