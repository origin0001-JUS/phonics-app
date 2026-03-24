import { test, expect } from '@playwright/test';
import { clearDB, seedOnboardingComplete, seedDueCards } from './fixtures/db-seed';
import { setupTestPage, setActivationKey, waitForAppReady } from './helpers/test-utils';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('H-1: Fresh visit redirects to /onboarding', async ({ page }) => {
    await page.goto('/');
    await clearDB(page);
    await page.goto('/');
    await waitForAppReady(page);
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('H-2: Home renders after onboarding complete', async ({ page }) => {
    // Let Dexie create DB
    await page.goto('/');
    // Seed onboarding + set activation key (Supabase is configured)
    await seedOnboardingComplete(page);
    await setActivationKey(page);
    // Navigate to home
    await page.goto('/');
    await waitForAppReady(page);
    const learnLink = page.locator('a[href="/units"]');
    await expect(learnLink).toBeVisible({ timeout: 15_000 });
  });

  test('H-3: Due count badge shows with due cards', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await setActivationKey(page);
    await seedDueCards(page, ['cat', 'bat', 'hat']);
    await page.goto('/');
    await waitForAppReady(page);
    const reviewLink = page.locator('a[href="/review"]');
    await expect(reviewLink).toBeVisible({ timeout: 15_000 });
    // Verify due count badge shows a number (bg-red-500 circle)
    const badge = page.locator('.bg-red-500.rounded-full, [class*="bg-red"]');
    const badgeCount = await badge.count();
    expect(badgeCount).toBeGreaterThanOrEqual(1);
  });

  test('H-4: Learn/START click navigates to /units', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await setActivationKey(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.locator('a[href="/units"]').click({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/units/);
  });

  test('H-5: Review click navigates to /review', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await setActivationKey(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.locator('a[href="/review"]').click({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/review/);
  });
});
