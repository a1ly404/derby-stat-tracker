import { test, expect } from '@playwright/test'
import { mockAuthAndNavigate } from './helpers/auth'

/**
 * Live Scoreboard Mode tests for apps/web.
 *
 * These tests cover the live scoreboard view that is reached by clicking
 * "Connect to Scoreboard" on the Mode Selector screen. The view lets users
 * point the app at a CRG scoreboard API endpoint and displays live data.
 *
 * Every test begins by mocking Supabase auth and navigating through login
 * to the Mode Selector, then clicking "Connect to Scoreboard" to enter
 * the live scoreboard view.
 *
 * Covered scenarios:
 *   – URL input field is visible and editable
 *   – Disconnected status shown initially
 *   – Back to mode selection button works
 *   – Mock a successful API health-check and verify connected state
 *   – Handle API error gracefully (mock 500 response, verify no crash)
 *   – Screenshots of disconnected and connected states
 */

test.describe('Live Scoreboard Mode', () => {
  // ── Shared setup ──────────────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    // Intercept the health-check fetch so it doesn't hit a real server and
    // keeps the view in "Disconnected" state by default.
    await page.route('**/health', async (route) => {
      await route.abort()
    })

    await mockAuthAndNavigate(page)

    // Enter live scoreboard mode
    await page
      .getByRole('button', { name: /Connect to Scoreboard/i })
      .click()

    // Wait for the live scoreboard view to be visible
    await expect(page.locator('#scoreboard-url')).toBeVisible()
  })

  // ── URL input ─────────────────────────────────────────────────────────────

  test('URL input field is visible and has default value', async ({ page }) => {
    const urlInput = page.locator('#scoreboard-url')
    await expect(urlInput).toBeVisible()
    await expect(urlInput).toHaveValue('http://localhost:5001')
  })

  test('URL input field is editable', async ({ page }) => {
    const urlInput = page.locator('#scoreboard-url')

    await urlInput.clear()
    await urlInput.fill('http://192.168.1.100:8080')

    await expect(urlInput).toHaveValue('http://192.168.1.100:8080')
  })

  test('Apply button activates when URL is changed', async ({ page }) => {
    const urlInput = page.locator('#scoreboard-url')
    const applyButton = page.getByRole('button', { name: /Apply/i })

    // Apply should be disabled when the input matches the active URL
    await expect(applyButton).toBeDisabled()

    // Change the URL
    await urlInput.clear()
    await urlInput.fill('http://192.168.1.100:9999')

    // Apply should now be enabled
    await expect(applyButton).toBeEnabled()
  })

  // ── Disconnected status ───────────────────────────────────────────────────

  test('shows Disconnected status initially', async ({ page }) => {
    await expect(page.getByText(/Disconnected/i)).toBeVisible()
  })

  test('shows connecting placeholder message', async ({ page }) => {
    await expect(
      page.getByText(/Live scoreboard feed — connecting/i),
    ).toBeVisible()
  })

  test('screenshot – disconnected state', async ({ page }) => {
    // Give the view a moment to fully render
    await expect(page.getByText(/Disconnected/i)).toBeVisible()

    await page.screenshot({
      path: 'test-results/screenshots/live-mode-disconnected.png',
    })
  })

  // ── Back button ───────────────────────────────────────────────────────────

  test('back button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Back to mode selection/i }),
    ).toBeVisible()
  })

  test('back button returns to mode selector', async ({ page }) => {
    await page
      .getByRole('button', { name: /Back to mode selection/i })
      .click()

    // Mode selector cards should be visible again
    await expect(page.getByText('Manual Stat Tracking')).toBeVisible()
    await expect(page.getByText('Live from Scoreboard')).toBeVisible()
  })

  // ── Successful API connection ─────────────────────────────────────────────

  test('shows Connected status after successful health check', async ({
    page,
  }) => {
    // Unroute the default abort handler and mock a successful health response
    await page.unroute('**/health')
    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      })
    })

    // Change the URL and apply to trigger a fresh health check
    const urlInput = page.locator('#scoreboard-url')
    await urlInput.clear()
    await urlInput.fill('http://localhost:5001')
    // Type a trailing character to ensure the URL differs, then fix it
    await urlInput.clear()
    await urlInput.fill('http://localhost:5001/api')

    await page.getByRole('button', { name: /Apply/i }).click()

    // Wait for the connected status to appear
    await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10_000 })
  })

  test('screenshot – connected state', async ({ page }) => {
    // Mock a successful health response
    await page.unroute('**/health')
    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      })
    })

    // Trigger a fresh connection by changing the URL
    const urlInput = page.locator('#scoreboard-url')
    await urlInput.clear()
    await urlInput.fill('http://localhost:5001/api')
    await page.getByRole('button', { name: /Apply/i }).click()

    await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10_000 })

    await page.screenshot({
      path: 'test-results/screenshots/live-mode-connected.png',
    })
  })

  test('connected state shows Live Scoreboard placeholder', async ({
    page,
  }) => {
    // Mock a successful health response
    await page.unroute('**/health')
    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      })
    })

    // Trigger a fresh connection
    const urlInput = page.locator('#scoreboard-url')
    await urlInput.clear()
    await urlInput.fill('http://localhost:5001/api')
    await page.getByRole('button', { name: /Apply/i }).click()

    await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 10_000 })

    // The connected placeholder should display the "Live Scoreboard" heading
    await expect(
      page.getByRole('heading', { name: /Live Scoreboard/i }),
    ).toBeVisible()
  })

  // ── API error handling ────────────────────────────────────────────────────

  test('handles API 500 error gracefully without crashing', async ({
    page,
  }) => {
    // Mock a 500 response on the health endpoint
    await page.unroute('**/health')
    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    // Trigger a health check by changing the URL
    const urlInput = page.locator('#scoreboard-url')
    await urlInput.clear()
    await urlInput.fill('http://localhost:5001/api')
    await page.getByRole('button', { name: /Apply/i }).click()

    // The app should remain functional and show Disconnected status
    // (the health check treats non-ok responses as disconnected)
    await expect(page.getByText(/Disconnected/i)).toBeVisible()

    // The page should not have crashed — key elements are still present
    await expect(page.locator('#scoreboard-url')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Back to mode selection/i }),
    ).toBeVisible()
  })

  test('handles network failure gracefully', async ({ page }) => {
    // The default beforeEach already aborts health requests, simulating
    // a network failure. Verify the app stays in disconnected state
    // without crashing.
    await expect(page.getByText(/Disconnected/i)).toBeVisible()

    // Verify the retry message is shown
    await expect(page.getByText(/Retrying every/i)).toBeVisible()

    // Core UI elements remain functional
    await expect(page.locator('#scoreboard-url')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Back to mode selection/i }),
    ).toBeVisible()
  })

  // ── Scoreboard API URL label ──────────────────────────────────────────────

  test('shows Scoreboard API URL label', async ({ page }) => {
    await expect(page.getByText('📡 Scoreboard API URL')).toBeVisible()
  })
})
