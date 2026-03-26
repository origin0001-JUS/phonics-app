/**
 * PDF 페이지 확인용 — 각 페이지를 PNG로 렌더링
 */
import { chromium } from 'playwright';
import path from 'path';

const HTML_PATH = path.join(__dirname, '..', 'docs', 'teacher-guide', 'guide.html');
const OUT = path.join(__dirname, '..', 'docs', 'teacher-guide', 'verify');

(async () => {
  const fs = await import('fs');
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } }); // A4 @ 96dpi

  await page.goto(`file:///${HTML_PATH.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Capture each .page and .cover as separate screenshots
  const pages = await page.locator('.page, .cover').all();
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(OUT, `page_${String(i + 1).padStart(2, '0')}.png`) });
    console.log(`  ✅ page_${String(i + 1).padStart(2, '0')}.png`);
  }

  await browser.close();
  console.log(`\n✅ 검증 이미지 저장: ${OUT}`);
})();
