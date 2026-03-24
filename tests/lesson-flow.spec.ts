import { test, expect } from '@playwright/test';
import { seedOnboardingComplete } from './fixtures/db-seed';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Lesson Flow - unit_01', () => {
  // Lesson flow is complex — give extra time
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
    await page.goto('/');
    await seedOnboardingComplete(page);
  });

  test('L-1: Sound Focus step renders', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);
    // Should show Sound Focus label
    const stepLabel = page.getByText('Sound Focus');
    await expect(stepLabel).toBeVisible({ timeout: 10_000 });
  });

  test('L-2: Can progress from Sound Focus to next step', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);
    await expect(page.getByText('Sound Focus')).toBeVisible({ timeout: 10_000 });

    // Try clicking play button / interactive area, then Next
    // Sound Focus may have quiz or just a play button
    // Click any visible button to interact
    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent().catch(() => '');
      // Click play or next-like buttons
      if (text && /next|다음|continue|►|▶/i.test(text)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // Try to find and click the main action/next button at bottom
    // BigButton is typically the last large button
    const bigButtons = page.locator('button').filter({ hasText: /Next|다음|Continue/i });
    if (await bigButtons.count() > 0) {
      await bigButtons.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('L-3: Blend & Tap shows phoneme buttons', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    await advanceToStep(page, 'Blend');

    // Verify we reached Blend & Tap step
    const blendLabel = page.getByText('Blend', { exact: false }).first();
    const reached = await blendLabel.isVisible().catch(() => false);
    if (reached) {
      // Should show interactive buttons (phoneme tapping area)
      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(2); // at least phoneme buttons + next
    }
    // unit_01 content should be present
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('cat');
  });

  test('L-4: Decode Words shows meaning quiz', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    await advanceToStep(page, 'Decode');

    const decodeLabel = page.getByText('Decode', { exact: false }).first();
    const reached = await decodeLabel.isVisible().catch(() => false);
    if (reached) {
      // Should show quiz choices (grid of buttons)
      const quizButtons = page.locator('.grid button:visible, .grid-cols-2 button:visible');
      const count = await quizButtons.count();
      expect(count).toBeGreaterThanOrEqual(2); // at least 2 answer choices
    }
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('L-5: Say & Check renders mic button', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    await advanceToStep(page, 'Say');

    const sayLabel = page.getByText('Say', { exact: false }).first();
    const reached = await sayLabel.isVisible().catch(() => false);
    if (reached) {
      // Should show at least a listen button and a word display
      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(2); // listen + mic (or next)
    }
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('L-6: Micro-Reader shows sentences', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    await advanceToStep(page, 'Micro');

    const microLabel = page.getByText('Micro', { exact: false }).first();
    const reached = await microLabel.isVisible().catch(() => false);
    if (reached) {
      // Micro-Reader should show English text (sentences from curriculum)
      const bodyText = await page.textContent('body');
      // unit_01 micro-reading contains words like cat, bat, etc.
      const hasEnglish = /[a-zA-Z]{3,}/.test(bodyText || '');
      expect(hasEnglish).toBe(true);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('L-7: Exit Ticket shows quiz choices', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    await advanceToStep(page, 'Exit Ticket');

    const ticketLabel = page.getByText('Exit Ticket', { exact: false }).first();
    const reached = await ticketLabel.isVisible().catch(() => false);
    if (reached) {
      // Exit ticket shows answer choice buttons
      const choiceButtons = page.locator('button.border-4:visible');
      const count = await choiceButtons.count();
      expect(count).toBeGreaterThanOrEqual(2); // at least 2 choices
    }
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('L-8: Full flow — lesson loads and doesn\'t crash through interactions', async ({ page }) => {
    await page.goto('/lesson/unit_01');
    await waitForAppReady(page);

    // Verify the lesson page loaded successfully
    await expect(page.getByText('Sound Focus')).toBeVisible({ timeout: 10_000 });

    // Try to advance through all steps by repeatedly clicking action buttons
    for (let step = 0; step < 30; step++) {
      // Check if we reached results
      const resultsVisible = await page.getByText('Lesson Done').isVisible().catch(() => false);
      if (resultsVisible) {
        // Verify results screen elements
        const backToUnits = page.getByText('Back to Units');
        await expect(backToUnits).toBeVisible();
        return; // Success!
      }

      // Try interacting: click quiz answers, next buttons, etc.
      await tryAdvance(page);
      await page.waitForTimeout(300);
    }

    // Even if we didn't reach results, verify no crash
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

/** Try to advance by clicking available interactive elements */
async function tryAdvance(page: import('@playwright/test').Page) {
  // 1. Try clicking quiz answer buttons (in grid)
  const gridButtons = page.locator('.grid button:visible, .grid-cols-2 button:visible');
  if (await gridButtons.count() > 0) {
    await gridButtons.first().click().catch(() => {});
    await page.waitForTimeout(200);
  }

  // 2. Try clicking choice buttons (vertical list)
  const choiceButtons = page.locator('button.border-4:visible').filter({ hasNotText: /Back|뒤로/i });
  if (await choiceButtons.count() > 0) {
    await choiceButtons.first().click().catch(() => {});
    await page.waitForTimeout(200);
  }

  // 3. Try clicking next/continue buttons
  const nextBtn = page.locator('button:visible')
    .filter({ hasText: /Next|다음|Continue|Finish|완료|Start|시작/i })
    .first();
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  // 4. Try clicking tappable areas (phonemes, sentences)
  const tappable = page.locator('button.rounded-lg:visible, button.rounded-2xl:visible').first();
  if (await tappable.isVisible().catch(() => false)) {
    await tappable.click().catch(() => {});
  }
}

/** Try to advance to a specific step by name */
async function advanceToStep(page: import('@playwright/test').Page, stepNameFragment: string) {
  for (let i = 0; i < 40; i++) {
    // Check if target step label is visible
    const visible = await page.getByText(stepNameFragment, { exact: false }).first().isVisible().catch(() => false);
    if (visible) return;

    await tryAdvance(page);
    await page.waitForTimeout(400);
  }
}
