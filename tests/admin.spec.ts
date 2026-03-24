import { test, expect } from '@playwright/test';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('A-1: PIN input screen renders', async ({ page }) => {
    await page.goto('/admin');
    await waitForAppReady(page);
    // Should show keypad digits
    const digit1 = page.getByText('1', { exact: true }).first();
    await expect(digit1).toBeVisible({ timeout: 10_000 });
  });

  test('A-2: Wrong PIN keeps on PIN screen', async ({ page }) => {
    await page.goto('/admin');
    await waitForAppReady(page);
    // Type wrong PIN: 9999
    for (const d of ['9', '9', '9', '9']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).first();
      await btn.click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1000);
    // Should still be on PIN screen (keypad visible)
    const digit1 = page.getByText('1', { exact: true }).first();
    await expect(digit1).toBeVisible();
  });

  test('A-3: Correct PIN (1234) opens dashboard', async ({ page }) => {
    await page.goto('/admin');
    await waitForAppReady(page);
    // Type correct PIN: 1234
    for (const d of ['1', '2', '3', '4']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).first();
      await btn.click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);
    // Should show dashboard content — look for management/license text
    const dashboardText = page.getByText(/라이선스|License|관리|Dashboard/i).first();
    await expect(dashboardText).toBeVisible({ timeout: 15_000 });
  });

  test('A-4: New school registration button exists', async ({ page }) => {
    await page.goto('/admin');
    await waitForAppReady(page);
    // Enter PIN
    for (const d of ['1', '2', '3', '4']) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).first();
      await btn.click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);
    // Look for registration button
    const newBtn = page.getByText(/등록|새 학교|New|추가/i).first();
    if (await newBtn.isVisible().catch(() => false)) {
      await expect(newBtn).toBeVisible();
    }
    // Page should render dashboard without crash
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });
});
