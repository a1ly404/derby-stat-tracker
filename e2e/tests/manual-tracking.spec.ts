import { test, expect } from '@playwright/test'
import { mockAuthAndNavigate } from './helpers/auth'
import { mockSupabaseData } from './helpers/supabase-mock'

/**
 * Manual Stat Tracking mode tests for apps/web.
 *
 * These tests cover the main app shell that appears after a user logs in and
 * selects "Start Manual Tracking" from the Mode Selector. The manual tracking
 * flow renders a sidebar navigation (Dashboard, Players, Bouts, Teams, etc.),
 * a header with user info, and the corresponding content view for each section.
 *
 * All tests share a beforeEach that:
 *   1. Mocks Supabase auth endpoints (no real network traffic)
 *   2. Mocks Supabase REST endpoints so data-fetching components don't error
 *   3. Navigates to the app root and signs in
 *   4. Clicks "Start Manual Tracking" to enter the manual tracking shell
 *
 * The `chromium` Playwright project (port 5173) runs these tests.
 */

test.describe('Manual Stat Tracking', () => {
  // ── Shared setup ──────────────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    // Mock Supabase data endpoints BEFORE auth (which triggers navigation and
    // component mounts that immediately fetch from the REST API).
    await mockSupabaseData(page)
    await mockAuthAndNavigate(page)

    // Enter manual tracking mode
    await page
      .getByRole('button', { name: /Start Manual Tracking/i })
      .click()

    // Wait for the sidebar navigation to be visible before each test
    await expect(
      page.getByRole('button', { name: /Dashboard/i }),
    ).toBeVisible()
  })

  // ── Dashboard page renders ────────────────────────────────────────────────

  test('dashboard page renders with navigation sidebar', async ({ page }) => {
    // The sidebar should contain all four primary nav items
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Players/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Bouts/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Teams/i })).toBeVisible()

    // Dashboard content heading should be visible by default
    await expect(
      page.getByRole('heading', { name: /Derby Stat Tracker Dashboard/i }),
    ).toBeVisible()

    await page.screenshot({
      path: 'test-results/screenshots/manual-dashboard.png',
    })
  })

  // ── Navigation between sections ───────────────────────────────────────────

  test('navigates to Players section', async ({ page }) => {
    await page.getByRole('button', { name: /Players/i }).click()

    // Players view should render — look for a heading or distinctive element
    await expect(page.getByText(/Players/i).first()).toBeVisible()

    await page.screenshot({
      path: 'test-results/screenshots/manual-players.png',
    })
  })

  test('navigates to Bouts section', async ({ page }) => {
    await page.getByRole('button', { name: /Bouts/i }).click()

    await expect(page.getByText(/Bouts/i).first()).toBeVisible()

    await page.screenshot({
      path: 'test-results/screenshots/manual-bouts.png',
    })
  })

  test('navigates to Teams section', async ({ page }) => {
    await page.getByRole('button', { name: /Teams/i }).click()

    await expect(page.getByText(/Teams/i).first()).toBeVisible()

    await page.screenshot({
      path: 'test-results/screenshots/manual-teams.png',
    })
  })

  test('can navigate between all sections sequentially', async ({ page }) => {
    // Dashboard → Players
    await page.getByRole('button', { name: /Players/i }).click()
    await expect(page.getByText(/Players/i).first()).toBeVisible()

    // Players → Bouts
    await page.getByRole('button', { name: /Bouts/i }).click()
    await expect(page.getByText(/Bouts/i).first()).toBeVisible()

    // Bouts → Teams
    await page.getByRole('button', { name: /Teams/i }).click()
    await expect(page.getByText(/Teams/i).first()).toBeVisible()

    // Teams → Dashboard
    await page.getByRole('button', { name: /Dashboard/i }).click()
    await expect(
      page.getByRole('heading', { name: /Derby Stat Tracker Dashboard/i }),
    ).toBeVisible()
  })

  // ── Header component ─────────────────────────────────────────────────────

  test('header is visible with user info', async ({ page }) => {
    // The Header component renders the app title
    await expect(
      page.getByRole('heading', { name: /Derby Stat Tracker/i, level: 1 }),
    ).toBeVisible()

    // The logged-in user's email should be displayed in the header
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  // ── Sign out ──────────────────────────────────────────────────────────────

  test('sign out button is accessible from manual mode', async ({ page }) => {
    // The Header component renders a sign-out button when a user is logged in
    const signOutButton = page.getByRole('button', { name: /Sign Out/i })
    await expect(signOutButton).toBeVisible()
  })

  test('sign out button is clickable', async ({ page }) => {
    const signOutButton = page.getByRole('button', { name: /Sign Out/i })
    await expect(signOutButton).toBeEnabled()

    // Mock the sign-out endpoint so the click doesn't fail
    await page.route('**/auth/v1/logout**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    await signOutButton.click()

    // After sign-out, the login form should reappear
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
