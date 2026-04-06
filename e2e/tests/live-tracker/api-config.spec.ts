import { test, expect } from '@playwright/test'

/**
 * API Configuration panel tests for apps/live-tracker.
 *
 * Covers:
 *  - Entering a custom API endpoint URL
 *  - Enabling live polling hides the manual score-entry form
 *  - Disabling live polling brings the manual form back
 *
 * The live-tracker dev server is started automatically by the `live-tracker`
 * Playwright project (port 5175).  These specs must NOT be run under the
 * `chromium` project (port 5173 / apps/web).
 */

test.describe('API Configuration', () => {
  // ── URL input ─────────────────────────────────────────────────────────────

  test('can enter an API endpoint URL', async ({ page }) => {
    await page.goto('/')

    const urlInput = page.locator('#api-url')
    await expect(urlInput).toBeVisible()

    await urlInput.fill('http://localhost:9999/game')

    await expect(urlInput).toHaveValue('http://localhost:9999/game')
  })

  test('API endpoint input is empty on first load', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('#api-url')).toHaveValue('')
  })

  // ── Poll-enabled toggle ───────────────────────────────────────────────────

  test('polling toggle is off by default', async ({ page }) => {
    await page.goto('/')

    // The Radix Switch renders as a <button role="switch">
    const toggle = page.locator('#poll-enabled')
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  test('enabling polling hides the manual score-entry form', async ({
    page,
  }) => {
    await page.goto('/')

    // The "Add Jam Score" heading and its sibling inputs are only rendered
    // when pollEnabled is false — toggling the switch removes them from the DOM.
    const manualSection = page.getByRole('heading', { name: 'Add Jam Score' })
    await expect(manualSection).toBeVisible()

    await page.locator('#poll-enabled').click()

    await expect(page.locator('#poll-enabled')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(manualSection).not.toBeVisible()
  })

  test('enabling polling hides the Add Jam button', async ({ page }) => {
    await page.goto('/')

    const addJamButton = page.getByRole('button', { name: /add jam/i })
    await expect(addJamButton).toBeVisible()

    await page.locator('#poll-enabled').click()

    await expect(addJamButton).not.toBeVisible()
  })

  test('enabling polling hides the Add Intermission button', async ({
    page,
  }) => {
    await page.goto('/')

    const intermissionButton = page.getByRole('button', {
      name: /add intermission/i,
    })
    await expect(intermissionButton).toBeVisible()

    await page.locator('#poll-enabled').click()

    await expect(intermissionButton).not.toBeVisible()
  })

  test('enabling polling disables the team name inputs', async ({ page }) => {
    await page.goto('/')

    const team1NameInput = page.locator('input[placeholder="Team 1 Name"]')
    const team2NameInput = page.locator('input[placeholder="Team 2 Name"]')

    await expect(team1NameInput).toBeEnabled()
    await expect(team2NameInput).toBeEnabled()

    await page.locator('#poll-enabled').click()

    await expect(team1NameInput).toBeDisabled()
    await expect(team2NameInput).toBeDisabled()
  })

  // ── Re-disabling polling ──────────────────────────────────────────────────

  test('disabling polling shows the manual score-entry form again', async ({
    page,
  }) => {
    await page.goto('/')

    const toggle = page.locator('#poll-enabled')
    const manualSection = page.getByRole('heading', { name: 'Add Jam Score' })

    // Turn polling on …
    await toggle.click()
    await expect(manualSection).not.toBeVisible()

    // … then turn it off again
    await toggle.click()

    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(manualSection).toBeVisible()
  })

  test('disabling polling re-enables the team name inputs', async ({ page }) => {
    await page.goto('/')

    const toggle = page.locator('#poll-enabled')
    const team1NameInput = page.locator('input[placeholder="Team 1 Name"]')

    await toggle.click()
    await expect(team1NameInput).toBeDisabled()

    await toggle.click()
    await expect(team1NameInput).toBeEnabled()
  })

  test('disabling polling shows the Add Jam button again', async ({ page }) => {
    await page.goto('/')

    const toggle = page.locator('#poll-enabled')
    const addJamButton = page.getByRole('button', { name: /add jam/i })

    await toggle.click()
    await expect(addJamButton).not.toBeVisible()

    await toggle.click()
    await expect(addJamButton).toBeVisible()
  })

  // ── Label text ────────────────────────────────────────────────────────────

  test('polling label reflects enabled state', async ({ page }) => {
    await page.goto('/')

    // Before enabling — plain label text
    await expect(page.getByText('Enable Live Polling')).toBeVisible()

    // After enabling — the label appends the interval in parentheses
    await page.locator('#poll-enabled').click()
    await expect(
      page.getByText(/enable live polling \(every \d+s\)/i),
    ).toBeVisible()
  })
})
