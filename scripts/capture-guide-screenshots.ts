import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:4000';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/student-guide/screenshots');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Helper: screenshot with wait
  async function snap(name: string, url?: string) {
    if (url) {
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500); // let animations settle
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
    console.log(`✅ ${name}.png`);
  }

  // --- 1. Home Screen ---
  // First, set up onboarding as completed via localStorage/IndexedDB
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await snap('01_onboarding_welcome');

  // Click through onboarding
  try {
    // Look for a start/next button on onboarding
    const nextBtn = page.locator('button').filter({ hasText: /시작|다음|Start|Next|Let/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await snap('02_onboarding_grade');

      // Select a grade
      const gradeBtn = page.locator('button').filter({ hasText: /1학년|Grade 1|1st/i }).first();
      if (await gradeBtn.isVisible({ timeout: 2000 })) {
        await gradeBtn.click();
        await page.waitForTimeout(500);
      }

      const confirmBtn = page.locator('button').filter({ hasText: /다음|확인|Next|OK|선택/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
      await snap('03_onboarding_recommendation');

      // Complete onboarding
      const startBtn = page.locator('button').filter({ hasText: /시작|Start|완료|Go/i }).first();
      if (await startBtn.isVisible({ timeout: 2000 })) {
        await startBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  } catch (e) {
    console.log('Onboarding navigation partial:', (e as Error).message);
  }

  // --- 2. Home ---
  await snap('04_home', '/');

  // --- 3. Unit Selection ---
  await snap('05_units', '/units');

  // --- 4. Lesson Flow (Unit 1) ---
  await page.goto(`${BASE_URL}/lesson/unit_01`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await snap('06_lesson_sound_focus');

  // Try to advance through lesson steps by finding Next/다음 buttons
  const stepNames = [
    '07_lesson_blend_tap',
    '08_lesson_decode_words',
    '09_lesson_word_family',
    '10_lesson_say_check',
    '11_lesson_micro_reader',
    '12_lesson_story_reader',
    '13_lesson_exit_ticket',
    '14_lesson_results',
  ];

  for (const stepName of stepNames) {
    try {
      // Look for various next/skip/continue buttons
      const actionBtn = page.locator('button').filter({ hasText: /다음|Next|Skip|넘기기|Continue|계속|시작|Start|완료|Done|확인|Check|제출/i }).first();
      if (await actionBtn.isVisible({ timeout: 3000 })) {
        await actionBtn.click();
        await page.waitForTimeout(1500);
        await snap(stepName);
      } else {
        // Try clicking anywhere interactive to advance
        const anyBtn = page.locator('button').first();
        if (await anyBtn.isVisible({ timeout: 1000 })) {
          await anyBtn.click();
          await page.waitForTimeout(1500);
          await snap(stepName);
        }
      }
    } catch (e) {
      console.log(`Step ${stepName} skip:`, (e as Error).message);
    }
  }

  // --- 5. Review Page ---
  await snap('15_review', '/review');

  // --- 6. Rewards Page ---
  await snap('16_rewards', '/rewards');

  // --- 7. Report Page ---
  await snap('17_report', '/report');

  // --- 8. Settings Page ---
  await snap('18_settings', '/settings');

  await browser.close();
  console.log('\n🎉 All screenshots captured!');
}

main().catch(console.error);
