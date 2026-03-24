import { test, expect } from '@playwright/test';
import { seedOnboardingComplete } from './fixtures/db-seed';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('S-1: Page renders with key sections', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/settings');
    await waitForAppReady(page);
    // Should show version info
    const versionText = page.getByText(/v0\.\d+\.\d+|Phonics 300/i);
    await expect(versionText).toBeVisible({ timeout: 10_000 });
    // Should show grade/level section
    const gradeSection = page.getByText(/학년|Level|수준|레벨/i).first();
    await expect(gradeSection).toBeVisible();
    // Should show reset option
    const resetSection = page.getByText(/초기화|삭제|Reset|Delete/i).first();
    await expect(resetSection).toBeVisible();
  });

  test('S-2: Grade change section is expandable', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/settings');
    await waitForAppReady(page);
    // Click grade section to expand
    const gradeSection = page.getByText(/학년|Level|수준|레벨/i).first();
    await expect(gradeSection).toBeVisible();
    await gradeSection.click();
    await page.waitForTimeout(500);
    // After expanding, should show Level options or grade picker
    const levelOptions = page.getByText(/Level [1-4]/);
    const count = await levelOptions.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('S-3: Data reset requires confirmation', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/settings');
    await waitForAppReady(page);
    // Find and click reset button
    const resetBtn = page.getByText(/초기화|삭제|Reset|Delete/i).first();
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForTimeout(500);
    // Should show confirmation warning (step 1)
    const warning = page.getByText(/정말|확인|경고|Warning|sure|돌이킬|되돌릴/i).first();
    await expect(warning).toBeVisible({ timeout: 5_000 });
  });

  test('S-4: Version info displayed', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/settings');
    await waitForAppReady(page);
    const version = page.getByText('v0.1.0');
    await expect(version).toBeVisible({ timeout: 10_000 });
  });
});
