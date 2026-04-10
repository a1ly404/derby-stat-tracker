import { test, expect } from '@playwright/test'

/**
 * Score Entry tests for apps/live-tracker.
 *
 * These tests exercise the manual jam-score entry workflow:
 *   – adding jams and seeing totals update
 *   – rejection of negative scores
 *   – intermission / period change
 *   – full scoreboard reset
 *
 * The live-tracker dev server is started automatically by the `live-tracker`
 * Playwright project (baseURL http://localhost:5175).
 */

test.describe('Live Tracker – Score Entry', () => {
  // ── Add a jam ─────────────────────────────────────────────────────────────

  test('adds a jam and updates score totals', async ({ page }) => {
    await page.goto('/')

    // The two score number-inputs in the manual entry form both use
    // placeholder="0"; the first belongs to Team 1, the second to Team 2.
    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    await scoreInputs.nth(0).fill('5')
    await scoreInputs.nth(1).fill('3')

    await page.getByRole('button', { name: /Add Jam/i }).click()

    // Large cumulative score displays use the font-display + text-7xl classes.
    // First div is Team 1, second is Team 2.
    const totals = page.locator('div.font-display.text-7xl')
    await expect(totals.nth(0)).toHaveText('5')
    await expect(totals.nth(1)).toHaveText('3')

    // Empty-state message must have disappeared
    await expect(page.getByText('No jams recorded yet')).not.toBeVisible()
  })

  // ── Negative-score validation ─────────────────────────────────────────────

  test('rejects negative scores and leaves totals at zero', async ({ page }) => {
    await page.goto('/')

    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    await scoreInputs.nth(0).fill('-1')
    // Leave Team 2 input empty (defaults to 0 via `parseInt(team2Input) || 0`)

    await page.getByRole('button', { name: /Add Jam/i }).click()

    // handleAddJam returns early when score < 0, so totals stay at 0
    const totals = page.locator('div.font-display.text-7xl')
    await expect(totals.nth(0)).toHaveText('0')
    await expect(totals.nth(1)).toHaveText('0')

    // Empty-state must still be shown since no jam was recorded
    await expect(page.getByText('No jams recorded yet')).toBeVisible()
  })

  // ── Intermission ──────────────────────────────────────────────────────────

  test('can add intermission and advances to Period 2', async ({ page }) => {
    await page.goto('/')

    // First add a jam so the period badge becomes meaningful
    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    await scoreInputs.nth(0).fill('4')
    await scoreInputs.nth(1).fill('2')
    await page.getByRole('button', { name: /Add Jam/i }).click()

    // Trigger intermission – this increments currentPeriod to 2
    await page.getByRole('button', { name: /Add Intermission/i }).click()

    // The period/jam badge (Badge component near the h1) should now show Period 2
    await expect(page.getByText(/Period 2/)).toBeVisible()
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  test('can reset scoreboard and returns to empty state', async ({ page }) => {
    await page.goto('/')

    // Add a jam so there is something to reset
    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    await scoreInputs.nth(0).fill('7')
    await scoreInputs.nth(1).fill('1')
    await page.getByRole('button', { name: /Add Jam/i }).click()

    // Confirm the jam was recorded before resetting
    await expect(page.getByText('No jams recorded yet')).not.toBeVisible()

    // The desktop "Reset Scoreboard" button is inside `hidden md:block`.
    // Desktop Chrome viewport (1280 px) makes it visible; the mobile "Reset"
    // button with class `md:hidden` is hidden at this width.
    await page.getByRole('button', { name: /Reset Scoreboard/i }).click()

    // Scoreboard should be back to the empty state
    await expect(page.getByText('No jams recorded yet')).toBeVisible()

    // Totals should have returned to zero
    const totals = page.locator('div.font-display.text-7xl')
    await expect(totals.nth(0)).toHaveText('0')
    await expect(totals.nth(1)).toHaveText('0')
  })
})
