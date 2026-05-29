import { defineConfig, devices } from '@playwright/test'

/**
 * I test E2E girano contro lo stack di test isolato:
 *  - BE Quarkus su http://localhost:8081 (docker compose -f docker-compose.test.yml)
 *  - DB Postgres su 127.0.0.1:5434
 *  - FE Vite avviato dal webServer qui sotto su http://localhost:5174
 */

const API_URL = process.env.E2E_API_URL || 'http://localhost:8081'
const FE_URL = process.env.E2E_BASE_URL || 'http://localhost:5174'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: FE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port 5174 --strictPort`,
    url: FE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { VITE_API_URL: API_URL },
  },
})
