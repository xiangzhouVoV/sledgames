import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4321', browserName: 'chromium', headless: true, ...(process.env.PLAYWRIGHT_CHROME ? { channel: 'chrome' } : {}) },
  webServer: { command: 'npm run preview -- --port 4321 --ignore-lock', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI },
  reporter: 'list',
});
