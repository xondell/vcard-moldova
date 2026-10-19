import { defineConfig } from '@playwright/test'

// Layout-only suite: isolated from real accounts, projects and integration credentials.
export default defineConfig({
  testDir: './tests/mobile', workers: 1, timeout: 90000,
  use: {
    baseURL: 'http://127.0.0.1:3100', browserName: 'chromium',
    launchOptions: process.env.MOBILE_CHROMIUM_PATH ? {
      executablePath: process.env.MOBILE_CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    } : undefined,
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 3100 --strictPort', url: 'http://127.0.0.1:3100',
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'layout-test-public-key', VITE_APP_URL: 'http://127.0.0.1:3100' },
  },
})
