import { test, expect } from '@playwright/test'
import { mockAuthAndNavigate } from './helpers/auth'

/**
 * Mode Selector tests
 *
 * These tests cover the screen shown immediately after a successful login,
 * where the user chooses between Manual Stat Tracking and Live from Scoreboard.
 *
 * All tests in this file share a beforeEach that:
 *   1. Mocks the Supabase auth endpoint so no real network call is made
 *   2. Navigates to the app root
 *   3. Fills in dummy credentials and submits
 *   4. Waits until the mode selector is visible
 *
 * NOTE: These tests require the ModeSelector component to be wired into the
 * main App flow (shown immediately after login). They will be green once that
 * integration is complete as part of the live overlay UI phase.
 */

test.describe('Mode Selector', () => {
  // ── Shared setup ──────────────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    await mockAuthAndNavigate(page)
  })

  // ── Card visibility ───────────────────────────────────────────────────────

  test('shows two mode cards', async ({ page }) => {
    // Both mode card titles must be on screen simultaneously
    await expect(page.getByText('Manual Stat Tracking')).toBeVisible()
    await expect(page.getByText('Live from Scoreboard')).toBeVisible()
  })

  test('shows descriptive text for manual mode', async ({ page }) => {
    await expect(
      page.getByText('Track jams, lineups and scores manually during a bout')
    ).toBeVisible()
  })

  test('shows descriptive text for live mode', async ({ page }) => {
    await expect(
      page.getByText('Read live data directly from your CRG scoreboard')
    ).toBeVisible()
  })

  // ── Navigation: Manual mode ───────────────────────────────────────────────

  test('navigates to manual tracking mode', async ({ page }) => {
    // Click the CTA button on the manual card
    await page
      .getByRole('button', { name: /Start Manual Tracking/i })
      .click()

    // The main sidebar navigation should now be visible
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Players/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Bouts/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Teams/i })).toBeVisible()
  })

  test('manual mode card itself is clickable', async ({ page }) => {
    // Clicking anywhere on the card (not just the button) should also navigate
    await page.locator('.mode-card--manual').click()

    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible()
  })

  // ── Navigation: Live scoreboard mode ─────────────────────────────────────

  test('navigates to live scoreboard mode', async ({ page }) => {
    // Click the CTA button on the live card
    await page
      .getByRole('button', { name: /Connect to Scoreboard/i })
      .click()

    // The scoreboard connection UI should be rendered:
    // LiveScoreboardView shows a URL input labelled "Scoreboard API URL"
    await expect(page.locator('#scoreboard-url')).toBeVisible()
  })

  test('live scoreboard view shows disconnected status initially', async ({ page }) => {
    await page
      .getByRole('button', { name: /Connect to Scoreboard/i })
      .click()

    // On first render the bridge hasn't connected yet
    await expect(page.getByText(/Disconnected/i)).toBeVisible()
  })

  test('live scoreboard view has a back button', async ({ page }) => {
    await page
      .getByRole('button', { name: /Connect to Scoreboard/i })
      .click()

    // The "← Back to mode selection" button should be present
    await expect(
      page.getByRole('button', { name: /Back to mode selection/i })
    ).toBeVisible()
  })

  test('back button returns to mode selector from live view', async ({ page }) => {
    await page
      .getByRole('button', { name: /Connect to Scoreboard/i })
      .click()

    await page
      .getByRole('button', { name: /Back to mode selection/i })
      .click()

    // Mode selector cards should be visible again
    await expect(page.getByText('Manual Stat Tracking')).toBeVisible()
    await expect(page.getByText('Live from Scoreboard')).toBeVisible()
  })

  // ── Sign out ──────────────────────────────────────────────────────────────

  test('shows a sign out button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Sign Out/i })
    ).toBeVisible()
  })
})
