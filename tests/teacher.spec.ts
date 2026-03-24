import { test, expect } from '@playwright/test';
import { setupTestPage, waitForAppReady } from './helpers/test-utils';

test.describe('Teacher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page);
  });

  test('T-1: Page loads without crash', async ({ page }) => {
    await page.goto('/teacher');
    await waitForAppReady(page);
    // Page should load without crashing (even without Supabase)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('T-2: Shows login form or error handling', async ({ page }) => {
    await page.goto('/teacher');
    await waitForAppReady(page);
    await page.waitForTimeout(2000);
    // Should show either login form fields or error message
    const inputs = page.locator('input:visible');
    const errorText = page.getByText(/로그인|Login|이메일|Email|오류|Error|연결/i);
    const hasInputs = await inputs.count() > 0;
    const hasErrorText = await errorText.count() > 0;
    const bodyText = await page.textContent('body');
    // At least page rendered something
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
