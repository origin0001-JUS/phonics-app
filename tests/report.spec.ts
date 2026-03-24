import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, seedUnit01Completed, seedDueCards } from './fixtures/db-seed';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Report Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('RP-1: No data shows empty or loading state', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/report');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    // Should show either "데이터가 아직 없습니다" or report content with 0%
    const noDataMsg = page.getByText(/데이터.*없|no data|리포트/i).first();
    const percentText = page.getByText(/%/).first();
    const hasNoData = await noDataMsg.isVisible().catch(() => false);
    const hasPercent = await percentText.isVisible().catch(() => false);
    // One of these should be visible
    expect(hasNoData || hasPercent).toBe(true);
  });

  test('RP-2: With completion data shows stats', async ({ page }) => {
    await page.goto('/');
    await seedUnit01Completed(page);
    await seedDueCards(page, ['cat', 'bat']);
    await page.goto('/report');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    // Should show percentage in progress ring
    const percentText = page.getByText(/%/).first();
    await expect(percentText).toBeVisible({ timeout: 10_000 });
  });

  test('RP-3: Export buttons visible', async ({ page }) => {
    await page.goto('/');
    await seedUnit01Completed(page);
    await page.goto('/report');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    // Look for CSV and PDF export buttons
    const csvBtn = page.getByText(/CSV/i).first();
    const pdfBtn = page.getByText(/PDF/i).first();
    const hasCsv = await csvBtn.isVisible().catch(() => false);
    const hasPdf = await pdfBtn.isVisible().catch(() => false);
    // At least one export option should be available
    expect(hasCsv || hasPdf).toBe(true);
  });
});
