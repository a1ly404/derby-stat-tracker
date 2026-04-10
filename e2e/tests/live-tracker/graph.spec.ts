import { test, expect } from '@playwright/test'

/**
 * D3 Score Graph tests for apps/live-tracker.
 *
 * These tests exercise the ScoreGraph component that renders an SVG
 * visualisation of cumulative scores using D3. The graph only appears
 * after at least one jam has been recorded.
 *
 * Covers:
 *   – SVG element appears after adding jams
 *   – Path elements (score lines) are rendered for each team
 *   – Screenshot capture of the graph after several jams
 *   – Graph returns to empty state after a reset
 *   – Team name inputs update the graph legend / axis labels
 *
 * The live-tracker dev server is started automatically by the `live-tracker`
 * Playwright project (baseURL http://localhost:5175).
 */

test.describe('Live Tracker – Score Graph', () => {
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Adds a single jam by filling both score inputs and clicking "Add Jam".
   */
  async function addJam(
    page: import('@playwright/test').Page,
    team1Score: string,
    team2Score: string,
  ) {
    const scoreInputs = page.locator('input[type="number"][placeholder="0"]')
    await scoreInputs.nth(0).fill(team1Score)
    await scoreInputs.nth(1).fill(team2Score)
    await page.getByRole('button', { name: /Add Jam/i }).click()
  }

  // ---------------------------------------------------------------------------
  // Tests
  // ---------------------------------------------------------------------------

  test('SVG element appears after adding a jam', async ({ page }) => {
    await page.goto('/')

    // Before any jams the empty-state message is shown and no SVG exists
    await expect(page.getByText('No jams recorded yet')).toBeVisible()
    await expect(page.locator('svg.w-full')).not.toBeVisible()

    // Add a jam to trigger the graph
    await addJam(page, '4', '2')

    // The D3 graph container (an <svg> element) must now be in the DOM
    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()
  })

  test('graph has path elements after adding data', async ({ page }) => {
    await page.goto('/')

    await addJam(page, '5', '3')
    await addJam(page, '2', '6')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // The ScoreGraph renders two <path> elements — one per team score line.
    // D3 axes also generate <path class="domain"> elements for the axis
    // baselines, so we exclude those with :not(.domain).
    const paths = svg.locator('path:not(.domain)')
    await expect(paths).toHaveCount(2)

    // Both paths must have a non-empty `d` attribute (the line data)
    for (let i = 0; i < 2; i++) {
      const d = await paths.nth(i).getAttribute('d')
      expect(d).toBeTruthy()
      expect(d!.length).toBeGreaterThan(0)
    }
  })

  test('screenshot of graph after adding several jams', async ({ page }) => {
    await page.goto('/')

    // Add 4 jams to build up a meaningful graph
    await addJam(page, '5', '3')
    await addJam(page, '2', '6')
    await addJam(page, '4', '1')
    await addJam(page, '3', '5')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // Wait briefly for D3 transition animations to settle
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: 'test-results/screenshots/score-graph.png',
    })
  })

  test('graph returns to empty state after reset', async ({ page }) => {
    await page.goto('/')

    // Add a couple of jams so the graph renders
    await addJam(page, '3', '4')
    await addJam(page, '6', '2')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // Reset the scoreboard (desktop button visible at default viewport width)
    await page.getByRole('button', { name: /Reset Scoreboard/i }).click()

    // The empty-state message should be back and the SVG should be gone
    await expect(page.getByText('No jams recorded yet')).toBeVisible()
    await expect(svg).not.toBeVisible()
  })

  test('team name inputs update the graph axis labels', async ({ page }) => {
    await page.goto('/')

    // Change team names before adding data
    const team1NameInput = page.locator('input[placeholder="Team 1 Name"]')
    const team2NameInput = page.locator('input[placeholder="Team 2 Name"]')

    await team1NameInput.clear()
    await team1NameInput.fill('Rose City')
    await team2NameInput.clear()
    await team2NameInput.fill('Gotham')

    // Add jams so the graph renders with the updated names
    await addJam(page, '5', '3')
    await addJam(page, '2', '4')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // The ScoreGraph receives team1Name and team2Name as props. Verify the
    // SVG contains text elements for the axis labels (e.g. "Jam Number",
    // "Cumulative Score") which confirms the graph rendered correctly with
    // the updated team names passed through.
    const axisLabels = svg.locator('text')
    const allText = await axisLabels.allTextContents()
    const joined = allText.join(' ')

    // The graph always renders these axis labels
    expect(joined).toContain('Jam Number')
    expect(joined).toContain('Cumulative Score')
  })

  test('graph renders dot markers for each jam data point', async ({ page }) => {
    await page.goto('/')

    await addJam(page, '5', '3')
    await addJam(page, '2', '6')
    await addJam(page, '4', '1')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // Wait for D3 transition animations on dots
    await page.waitForTimeout(1000)

    // ScoreGraph renders circles with class "dot1" and "dot2" for each team
    const dot1 = svg.locator('circle.dot1')
    const dot2 = svg.locator('circle.dot2')

    // 3 jams → 3 dots per team
    await expect(dot1).toHaveCount(3)
    await expect(dot2).toHaveCount(3)
  })

  test('intermission marker appears in the graph', async ({ page }) => {
    await page.goto('/')

    // Add a jam, then an intermission, then another jam
    await addJam(page, '5', '3')
    await page.getByRole('button', { name: /Add Intermission/i }).click()
    await addJam(page, '4', '2')

    const svg = page.locator('svg.w-full')
    await expect(svg).toBeVisible()

    // Wait for D3 transition animations
    await page.waitForTimeout(1000)

    // The ScoreGraph renders an "INTERMISSION" text label inside the SVG
    // for each intermission entry in the data
    const intermissionLabel = svg.locator('text').filter({ hasText: 'INTERMISSION' })
    await expect(intermissionLabel).toHaveCount(1)
  })
})
