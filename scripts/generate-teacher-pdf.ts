/**
 * HTML → PDF 변환 스크립트 (Playwright)
 * 실행: npx tsx scripts/generate-teacher-pdf.ts
 */
import { chromium } from 'playwright';
import path from 'path';

const HTML_PATH = path.join(__dirname, '..', 'docs', 'teacher-guide', 'guide.html');
const PDF_PATH = path.join(__dirname, '..', 'docs', 'teacher-guide', 'Phonics300_교사용_가이드.pdf');

(async () => {
  console.log('🖨️  PDF 생성 시작...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // file:// 프로토콜로 로컬 HTML 열기
  await page.goto(`file:///${HTML_PATH.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });

  // 폰트 로딩 대기
  await page.waitForTimeout(3000);

  // PDF 생성
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`✅ PDF 생성 완료: ${PDF_PATH}`);
})();
