import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: {
    command: 'node scripts/serve-static.mjs public-site',
    url: 'http://127.0.0.1:4173/biblia/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
