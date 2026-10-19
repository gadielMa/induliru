import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  retries: process.env.CI ? 1 : 0,
  use: { ...devices['Desktop Chrome'], baseURL, headless: true },
  webServer: {
    command: 'node scripts/serve-static.mjs public-site',
    url: `${baseURL}/biblia/`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
