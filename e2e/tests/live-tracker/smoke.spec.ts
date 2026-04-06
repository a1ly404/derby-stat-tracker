import { test, expect } from '@playwright/test'

/**
 * Smoke tests for apps/live-tracker.
 *
 * These tests verify that the page loads correctly, the initial empty state is
 * shown, and the key UI regions are present — without performing any
 * interactions.
 *
 * The `live-tracker` Playwright project (see playwright.config.ts) points
 * baseURL at http://localhost:5175, so page.goto('/') hits the live-tracker
 * Vite dev server.
 */

test.describe('Live Tracker – smoke', () => {
  // ── Page load & empty state ───────────────────────────────────────────────

  test('loads and shows empty state', async ({ page }) => {
    await page.goto('/')

    // The main h1 heading must be visible on first paint
    await expect(
      page.getByRole('heading', { name: 'Derby Scoreboard Live', level: 1 }),
    ).toBeVisible()

    // Before any jams are recorded the placeholder copy must be on-screen
    await expect(page.getByText('No jams recorded yet')).toBeVisible()
  })

  // ── API config panel ──────────────────────────────────────────────────────

  test('shows API config panel', async ({ page }) => {
    await page.goto('/')

    // Section heading
    await expect(
      page.getByRole('heading', { name: 'API Configuration' }),
    ).toBeVisible()

    // The URL field label — rendered via <Label htmlFor="api-url">
    await expect(page.getByText('API Endpoint URL')).toBeVisible()

    // The polling toggle label — rendered via <Label htmlFor="poll-enabled">
    // Use a regex so the "(every Xs)" suffix that appears when polling is
    // enabled doesn't prevent the match.
    await expect(page.getByText(/Enable Live Polling/)).toBeVisible()
  })
})
