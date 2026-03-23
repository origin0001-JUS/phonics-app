import { chromium } from 'playwright';
import path from 'path';

const BASE_URL = 'http://localhost:4000';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/student-guide/screenshots');

// Unit 1 steps: sound_focus(0), blend_tap(1), decode_words(2), word_family(3),
//               say_check(4), micro_reader(5), exit_ticket(6), results(7)
const LESSON_STEPS = [
  { index: 0, name: 'sound_focus', label: 'Sound Focus' },
  { index: 1, name: 'blend_tap', label: 'Blend & Tap' },
  { index: 2, name: 'decode_words', label: 'Decode Words' },
  { index: 3, name: 'word_family', label: 'Word Family' },
  { index: 4, name: 'say_check', label: 'Say & Check' },
  { index: 5, name: 'micro_reader', label: 'Micro Reader' },
  { index: 6, name: 'exit_ticket', label: 'Exit Ticket' },
  { index: 7, name: 'results', label: 'Results' },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  for (const step of LESSON_STEPS) {
    const page = await context.newPage();

    // Set localStorage before navigating so the lesson restores at the right step
    await page.goto(`${BASE_URL}/units`, { waitUntil: 'networkidle' });
    await page.evaluate((stepIdx) => {
      const state = {
        stepIndex: stepIdx,
        subStepIndex: 0,
        score: 3,
        totalQuestions: 5,
        wordResults: {},
      };
      localStorage.setItem('lesson_state_unit_01', JSON.stringify(state));
    }, step.index);

    // Now navigate to the lesson - it should restore to the correct step
    await page.goto(`${BASE_URL}/lesson/unit_01`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const filename = `step_${String(step.index + 1).padStart(2, '0')}_${step.name}.png`;
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: false,
    });
    console.log(`✅ ${filename} (${step.label})`);

    // Clear state for next iteration
    await page.evaluate(() => {
      localStorage.removeItem('lesson_state_unit_01');
    });
    await page.close();
  }

  await browser.close();
  console.log('\n🎉 All lesson step screenshots captured!');
}

main().catch(console.error);
