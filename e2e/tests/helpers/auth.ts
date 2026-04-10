import { type Page, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fake session payload
// ---------------------------------------------------------------------------
// Returned by the mocked Supabase token endpoint so the supabase-js SDK
// processes a real-looking session without hitting the network.
// Shape matches the POST /auth/v1/token response from Supabase Auth v2.

export const FAKE_SESSION = {
  access_token: 'fake-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'fake-refresh',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
  },
}

// ---------------------------------------------------------------------------
// Route mocks
// ---------------------------------------------------------------------------

/**
 * Install page-level route intercepts for every Supabase Auth endpoint that
 * the app might call during startup or sign-in.
 *
 * - POST  /auth/v1/token?grant_type=password  → returns FAKE_SESSION (sign-in)
 * - GET   /auth/v1/user                       → returns the fake user object
 * - GET   /auth/v1/session                    → returns an empty session
 *   (so the initial getSession() call resolves to null and shows the login form)
 *
 * Call this BEFORE navigating so intercepts are in place from the first request.
 */
export async function mockSupabaseAuth(page: Page): Promise<void> {
  // Sign-in token endpoint — supabase.auth.signInWithPassword() calls this.
  // We return the full fake session so the SDK stores it and fires SIGNED_IN.
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION),
    })
  })

  // User endpoint — the SDK may call this to verify a stored token.
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_SESSION.user),
    })
  })

  // Session endpoint — called by getSession() on page load.
  // Returning an empty body causes the SDK to see no stored session,
  // which means the Auth form is shown (as expected before login).
  await page.route('**/auth/v1/session**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null, session: null }),
    })
  })
}

// ---------------------------------------------------------------------------
// High-level helper
// ---------------------------------------------------------------------------

/**
 * Full auth flow helper for use in test `beforeEach` hooks:
 *
 *   1. Mocks Supabase auth endpoints (no real network traffic)
 *   2. Navigates to the app root (`/`)
 *   3. Fills in dummy credentials and submits the sign-in form
 *   4. Waits until the Mode Selector screen is visible
 *
 * After this resolves, `page` is sitting on the Mode Selector and tests can
 * immediately interact with the "Manual Stat Tracking" / "Live from Scoreboard"
 * cards without any extra navigation.
 *
 * @example
 * test.beforeEach(async ({ page }) => {
 *   await mockAuthAndNavigate(page)
 * })
 */
export async function mockAuthAndNavigate(page: Page): Promise<void> {
  // 1. Install route intercepts before any navigation
  await mockSupabaseAuth(page)

  // 2. Load the app
  await page.goto('/')

  // 3. Fill in dummy credentials — the values themselves don't matter because
  //    the token endpoint is intercepted and always returns FAKE_SESSION.
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  // 4. Wait for the Mode Selector to appear.
  //    Both cards must be visible before we hand control back to the test.
  await expect(page.getByText('Manual Stat Tracking')).toBeVisible()
  await expect(page.getByText('Live from Scoreboard')).toBeVisible()
}
