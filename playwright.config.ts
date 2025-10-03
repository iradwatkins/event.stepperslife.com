import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT || 3004

/**
 * Playwright Configuration for Events SteppersLife E2E Tests
 *
 * Test Structure:
 * - All tests use REAL data (no mocks)
 * - Database: Real PostgreSQL database
 * - Payments: Real Square sandbox API
 * - Emails: Real Resend API (test mode)
 *
 * Test Suites (50 total tests):
 * - 01-user-auth.spec.ts (12 tests) - Registration, login, session
 * - 02-event-creation.spec.ts (9 tests) - Event CRUD, publishing
 * - 03-ticket-purchase.spec.ts (7 tests) - Purchase flow with Square
 * - 04-ticket-refund.spec.ts (6 tests) - Refund processing
 * - 05-ticket-transfer.spec.ts (6 tests) - Ticket transfers
 * - 06-event-cancellation.spec.ts (7 tests) - Event cancellation
 * - 08-full-user-journey.spec.ts (3 tests) - Complete end-to-end flows
 */

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120 * 1000, // 2 minutes per test (real API calls can be slow)
  expect: {
    timeout: 10000, // Increased for real database queries
  },
  fullyParallel: false, // Run tests sequentially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent database race conditions
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'], // Console output with test progress
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // Record video for failed tests
    actionTimeout: 15000, // 15 seconds for actions (form fills, clicks)
    navigationTimeout: 30000, // 30 seconds for page navigation
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chromium is the primary test target for real data tests
        // (Fastest and most reliable for complex payment flows)
      },
    },

    // Uncomment to test cross-browser compatibility
    // Note: Real payment tests are slower in Firefox/Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Uncomment to test mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})