import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
if (existsSync('.env.integration')) process.loadEnvFile('.env.integration')
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  timeout: 60000, expect: { timeout: 15000 },
  use: { baseURL: process.env.APP_URL || 'http://127.0.0.1:3000', browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 30000 },
})
