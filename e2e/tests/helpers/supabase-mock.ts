import { type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Supabase REST (PostgREST) mock
// ---------------------------------------------------------------------------
// The manual-tracking views (Dashboard, Players, Bouts, Teams) fetch data
// from Supabase via the PostgREST proxy at `/rest/v1/<table>`.  In E2E tests
// we don't have a real database, so we intercept every REST request and return
// empty arrays (or the appropriate empty-result shape when `count` is used).
//
// This helper is designed to work alongside `mockSupabaseAuth` from
// `./auth.ts` — install both before navigating so all network calls are
// handled before the first render.
// ---------------------------------------------------------------------------

/**
 * Tables the web app queries.  Each entry maps to an empty-array response
 * so the UI renders its "empty state" instead of crashing on a network error.
 */
const MOCKED_TABLES = [
  'bouts',
  'players',
  'teams',
  'jams',
  'player_teams',
  'player_stats',
] as const

/**
 * Intercept all Supabase PostgREST endpoints (`/rest/v1/*`) and return empty
 * results for every table the app queries.
 *
 * Handles:
 *  - Regular SELECT queries  → `[]`
 *  - HEAD / count-only queries (`Prefer: count=exact`) → empty body with
 *    `content-range: 0-0/0` header so the SDK reads `count` as 0
 *  - INSERT / UPDATE / DELETE → 200 with `[]` (no-op)
 *
 * Call this **before** navigating so intercepts are active from the first
 * request.
 *
 * @example
 * ```ts
 * import { mockSupabaseAuth, mockAuthAndNavigate } from './helpers/auth'
 * import { mockSupabaseData } from './helpers/supabase-mock'
 *
 * test.beforeEach(async ({ page }) => {
 *   await mockSupabaseData(page)
 *   await mockAuthAndNavigate(page)
 * })
 * ```
 */
export async function mockSupabaseData(page: Page): Promise<void> {
  // A single wildcard route covers all tables and query-string variants.
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const method = request.method().toUpperCase()

    // For HEAD requests (used by Supabase `select('id', { count: 'exact', head: true })`)
    // return an empty range so the SDK derives `count === 0`.
    if (method === 'HEAD') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'content-range': '*/0',
          'access-control-expose-headers': 'content-range',
        },
        body: '',
      })
      return
    }

    // Check whether the caller asked for a count via the Prefer header.
    const prefer = request.headers()['prefer'] ?? ''
    const wantsCount = prefer.includes('count=exact')

    const headers: Record<string, string> = {}
    if (wantsCount) {
      headers['content-range'] = '*/0'
      headers['access-control-expose-headers'] = 'content-range'
    }

    // GET, POST, PATCH, DELETE — always return an empty array.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers,
      body: JSON.stringify([]),
    })
  })
}
