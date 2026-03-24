import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4000',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 4000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
