import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-results/html' }], ['list']],
  outputDir: 'test-results/artifacts',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    ignoreHTTPSErrors: true, // Allow self-signed certs in E2E
    launchOptions: {
      slowMo: 500, // 500ms delay between actions
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Use this project in UI mode for visible browser debugging
    {
      name: 'chromium-headed',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: { slowMo: 300 },
      },
    },
  ],

  // Wait for web service to be ready
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm --filter @pkg/web dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        cwd: path.resolve(__dirname, '../..'),
      },
});
