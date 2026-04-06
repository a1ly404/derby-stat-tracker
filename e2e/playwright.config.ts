import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for Derby Stat Tracker.
 *
 * The test suite spins up the Vite dev servers automatically before running,
 * so you only need Node + browsers installed. Run `npm run install:browsers`
 * once to pull down the Chromium binary.
 *
 * Useful commands (from this directory):
 *   npm test                  – headless run
 *   npm run test:headed       – headed (watch the browser)
 *   npm run test:ui           – Playwright UI mode
 *   npm run test:debug        – step-through debugger
 *   npm run test:report       – open the last HTML report
 *
 * Projects:
 *   chromium      – tests for apps/web  (port 5173)
 *   live-tracker  – tests for apps/live-tracker (port 5175)
 */
export default defineConfig({
  // ── Discovery ────────────────────────────────────────────────────────────
  testDir: './tests',

  // ── Timeouts ─────────────────────────────────────────────────────────────
  /** Max time one test can run before it is considered failed */
  timeout: 30_000,
  expect: {
    /** Max time expect() auto-retries before failing */
    timeout: 5_000,
  },

  // ── Parallelism & retries ─────────────────────────────────────────────────
  fullyParallel: true,
  /** Fail fast in CI if a test is accidentally left with `.only` */
  forbidOnly: !!process.env.CI,
  /** Retry flaky tests twice in CI, never locally */
  retries: process.env.CI ? 2 : 0,
  /** Use fewer workers in CI to avoid resource contention */
  workers: process.env.CI ? 1 : undefined,

  // ── Reporting ─────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // 'list' reporter gives a clear per-test summary in the terminal
    ['list'],
  ],

  // ── Output directories ────────────────────────────────────────────────────
  outputDir: 'test-results/',

  // ── Shared settings applied to every project ──────────────────────────────
  use: {
    /**
     * Fallback baseURL — individual projects override this with their own
     * port so tests always hit the right app.
     */
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',

    /** Capture a screenshot automatically on test failure */
    screenshot: 'only-on-failure',

    /** Record video only when a test is retried (keeps storage reasonable) */
    video: 'on-first-retry',

    /** Collect a Playwright trace on first retry for easier debugging */
    trace: 'on-first-retry',
  },

  // ── Browser projects ──────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /** Explicitly pin this project to the web app so page.goto('/') works */
        baseURL: 'http://localhost:5173',
      },
      /**
       * Only run tests that are NOT inside the live-tracker sub-directory.
       * New web-app spec files placed directly under tests/ are picked up
       * automatically.
       */
      testMatch: /tests\/(?!live-tracker\/).*\.spec\.ts/,
    },

    {
      name: 'live-tracker',
      use: {
        ...devices['Desktop Chrome'],
        /** Point this project at the live-tracker dev server */
        baseURL: 'http://localhost:5175',
      },
      /** Only run specs that live under tests/live-tracker/ */
      testMatch: /tests\/live-tracker\/.*\.spec\.ts/,
    },

    // Uncomment to also run tests in Firefox and WebKit:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // ── Dev-server auto-start ─────────────────────────────────────────────────
  // Playwright starts both Vite dev servers before the suite runs and tears
  // them down afterwards. In CI the servers are always freshly started;
  // locally you can leave them running and Playwright will reuse them.
  webServer: [
    // ── apps/web ────────────────────────────────────────────────────────────
    {
      command: 'npm run dev',
      /** Path relative to this config file */
      cwd: '../apps/web',
      url: 'http://localhost:5173',
      /** Reuse an already-running dev server locally; always start fresh in CI */
      reuseExistingServer: !process.env.CI,
      /**
       * Provide dummy Supabase credentials so the app starts without showing
       * the <ConfigurationError> screen. Real network requests are intercepted
       * by page.route() inside individual tests, so these values are never
       * actually used to connect to Supabase.
       *
       * Override with real values via environment variables if you want to run
       * tests against a live Supabase project.
       */
      env: {
        VITE_SUPABASE_URL:
          process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY:
          process.env.VITE_SUPABASE_ANON_KEY ??
          'dummy-anon-key-for-e2e-testing',
      },
    },

    // ── apps/live-tracker ───────────────────────────────────────────────────
    {
      /**
       * Pass --port via the Vite CLI so the live-tracker server binds to 5175
       * instead of its default 5173, avoiding a conflict with apps/web.
       */
      command: 'npm run dev -- --port 5175',
      /** Path relative to this config file */
      cwd: '../apps/live-tracker',
      url: 'http://localhost:5175',
      /** Reuse an already-running dev server locally; always start fresh in CI */
      reuseExistingServer: !process.env.CI,
    },
  ],
})
