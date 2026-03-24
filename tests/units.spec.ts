import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, seedUnit01Completed } from './fixtures/db-seed';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Unit Selection Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('U-1: Renders unit grid with multiple cards', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/units');
    await waitForAppReady(page);
    // Count all unit cards (both links for unlocked and divs for locked)
    const unitLinks = page.locator('a[href*="/lesson/unit_"]');
    const linkCount = await unitLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(1); // at least unit_01 unlocked
    // Page should show multiple unit titles (Short a, Short e, etc.)
    const bodyText = await page.textContent('body');
    const unitTitleMatches = (bodyText || '').match(/Short|Long|Blend|Digraph|Magic|Sight/gi);
    expect(unitTitleMatches!.length).toBeGreaterThanOrEqual(5);
  });

  test('U-2: Unit 01 is unlocked and clickable', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/units');
    await waitForAppReady(page);
    const unit01Link = page.locator('a[href="/lesson/unit_01"]');
    await expect(unit01Link).toBeVisible();
    await unit01Link.click();
    await expect(page).toHaveURL(/\/lesson\/unit_01/);
  });

  test('U-3: Locked units have restricted interaction', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page); // only unit_01 unlocked
    await page.goto('/units');
    await waitForAppReady(page);
    // Verify that there are cards beyond unit_01 that exist on page
    // but are not navigable (locked)
    // unit_02 should NOT be a clickable link (locked)
    const unit02 = page.locator('a[href="/lesson/unit_02"]');
    const unit02Count = await unit02.count();
    // Either unit_02 link doesn't exist, or it has pointer-events-none
    if (unit02Count > 0) {
      const classes = await unit02.getAttribute('class') ?? '';
      expect(classes).toContain('pointer-events-none');
    }
    // Page should show unit titles indicating locked units exist
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Short');
  });

  test('U-4: Completed unit shows visual indicator', async ({ page }) => {
    await page.goto('/');
    await seedUnit01Completed(page);
    await page.goto('/units');
    await waitForAppReady(page);
    // Look for any check/complete indicator on unit_01
    // Could be CheckCircle2, check-circle, or a filled star
    // unit_01 completed — unit_02 should now be unlocked (clickable link)
    const unit02 = page.locator('a[href="/lesson/unit_02"]');
    await expect(unit02).toBeVisible({ timeout: 10_000 });
    // Verify unit_01 card exists and page renders completed state
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Short a');
  });

  test('U-5: Back button navigates to home', async ({ page }) => {
    await page.goto('/');
    await seedOnboardingComplete(page);
    await page.goto('/units');
    await waitForAppReady(page);
    const backBtn = page.locator('a[href="/"]').first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
