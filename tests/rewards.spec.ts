import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, seedReward } from './fixtures/db-seed';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Rewards Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('RW-1: Renders trophy cards', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/rewards');
    await waitForAppReady(page);
    const countText = page.getByText(/\d+\s*\/\s*\d+/).first();
    await expect(countText).toBeVisible({ timeout: 10_000 });
  });

  test('RW-2: Locked trophies show locked state', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/rewards');
    await waitForAppReady(page);
    const lockedText = page.getByText('???').first();
    await expect(lockedText).toBeVisible({ timeout: 10_000 });
  });

  test('RW-3: Unlocked trophy shows date', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await seedReward(page, 'first_lesson');
    await page.goto('/rewards');
    await waitForAppReady(page);
    const dateText = page.getByText(/획득/).first();
    await expect(dateText).toBeVisible({ timeout: 10_000 });
  });
});
