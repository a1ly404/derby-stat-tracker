import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for apps/live-tracker.
 *
 * Uses Playwright's built-in `toHaveScreenshot()` to capture baseline
 * screenshots and compare subsequent runs against them. On the first run
 * the baselines are created automatically; after that any visual diff beyond
 * the configured threshold will fail the test.
 *
 * Baselines are stored alongside the test file in a folder named
 * `visual-regression.spec.ts-snapshots/` (Playwright default).
 *
 * The `live-tracker` Playwright project (see playwright.config.ts) points
 * baseURL at http://localhost:5175, so page.goto('/') hits the live-tracker
 * Vite dev server.
 */

/** Shared threshold for all visual comparisons in this file. */
const SCREENSHOT_OPTIONS = { maxDiffPixelRatio: 0.01 } as const

test.describe('Live Tracker – Visual Regression', () => {
  // ── Empty state ───────────────────────────────────────────────────────────

  test('empty state matches baseline', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to fully render the empty state
    await expect(page.getByText('No jams recorded yet')).toBeVisible()

    await expect(page).toHaveScreenshot('empty-state.png', SCREENSHOT_OPTIONS)
  })

  // ── With 3 jams entered ───────────────────────────────────────────────────

  test('state with 3 jams matches baseline', async ({ page }) => {
    await page.goto('/')

    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    const addJamButton = page.getByRole('button', { name: /Add Jam/i })

    // Jam 1: 5–3
    await scoreInputs.nth(0).fill('5')
    await scoreInputs.nth(1).fill('3')
    await addJamButton.click()

    // Jam 2: 4–8
    await scoreInputs.nth(0).fill('4')
    await scoreInputs.nth(1).fill('8')
    await addJamButton.click()

    // Jam 3: 0–4
    await scoreInputs.nth(0).fill('0')
    await scoreInputs.nth(1).fill('4')
    await addJamButton.click()

    // The empty-state placeholder should be gone
    await expect(page.getByText('No jams recorded yet')).not.toBeVisible()

    // Wait for the D3 graph animation to settle (800ms line draw + dot delays)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1200)

    await expect(page).toHaveScreenshot('three-jams.png', SCREENSHOT_OPTIONS)
  })

  // ── With intermission marker ──────────────────────────────────────────────

  test('state with intermission matches baseline', async ({ page }) => {
    await page.goto('/')

    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    const addJamButton = page.getByRole('button', { name: /Add Jam/i })

    // Jam 1
    await scoreInputs.nth(0).fill('5')
    await scoreInputs.nth(1).fill('3')
    await addJamButton.click()

    // Jam 2
    await scoreInputs.nth(0).fill('4')
    await scoreInputs.nth(1).fill('8')
    await addJamButton.click()

    // Add intermission between Period 1 and Period 2
    await page.getByRole('button', { name: /Add Intermission/i }).click()
    await expect(page.getByText(/Period 2/)).toBeVisible()

    // Jam 3 (Period 2)
    await scoreInputs.nth(0).fill('7')
    await scoreInputs.nth(1).fill('2')
    await addJamButton.click()

    // Wait for graph animation to settle
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1200)

    await expect(page).toHaveScreenshot(
      'with-intermission.png',
      SCREENSHOT_OPTIONS,
    )
  })

  // ── With polling enabled (different UI) ───────────────────────────────────

  test('polling-enabled UI matches baseline', async ({ page }) => {
    await page.goto('/')

    // Enable live polling — this hides the manual score-entry form and shows
    // a different status indicator in the badge area.
    const toggle = page.locator('#poll-enabled')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    // The manual "Add Jam Score" section should be gone
    await expect(
      page.getByRole('heading', { name: 'Add Jam Score' }),
    ).not.toBeVisible()

    // The empty-state message changes to mention "Waiting for API data…"
    await expect(page.getByText('No jams recorded yet')).toBeVisible()

    await expect(page).toHaveScreenshot(
      'polling-enabled.png',
      SCREENSHOT_OPTIONS,
    )
  })
})
