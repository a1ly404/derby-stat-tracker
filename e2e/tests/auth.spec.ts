import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fake Supabase session returned by the mocked auth endpoint.
// Matches the shape the supabase-js v2 SDK expects from POST /auth/v1/token.
// ---------------------------------------------------------------------------
const FAKE_SESSION = {
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
// Auth flow
// ---------------------------------------------------------------------------
test.describe('Auth flow', () => {
  // ── 1. Login form is visible on the root route ──────────────────────────

  test('shows login form', async ({ page }) => {
    await page.goto('/')

    // Email and password fields must be present
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Sign-in submit button must be present
    // The Auth component renders "Sign In" as the button text in sign-in mode
    await expect(
      page.getByRole('button', { name: /sign in/i }),
    ).toBeVisible()
  })

  // ── 2. Invalid credentials surface an error message ─────────────────────

  test('shows error with bad credentials', async ({ page }) => {
    // Intercept the Supabase token endpoint and simulate a rejected login
    // so the test is fast and deterministic regardless of network availability.
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      })
    })

    await page.goto('/')

    await page.fill('input[type="email"]', 'bad@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // The Auth component surfaces errors in an element with class .auth-message
    const errorMsg = page.locator('.auth-message')
    await expect(errorMsg).toBeVisible()
    // The SDK re-throws the error_description from Supabase
    await expect(errorMsg).toContainText(/invalid login credentials/i)
  })

  // ── 3. Successful login shows the mode selector ──────────────────────────

  test('shows mode selector after login', async ({ page }) => {
    // Mock the Supabase token endpoint to return a valid fake session.
    // This causes the supabase-js client to fire onAuthStateChange('SIGNED_IN')
    // which triggers useAuth → App re-renders with the authenticated view.
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      })
    })

    // Also mock the /user endpoint in case the SDK validates the token
    await page.route('**/auth/v1/user**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION.user),
      })
    })

    await page.goto('/')

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // After a successful (mocked) auth the app should render the ModeSelector.
    // Both mode card titles must be visible.
    await expect(page.getByText('Manual Stat Tracking')).toBeVisible()
    await expect(page.getByText('Live from Scoreboard')).toBeVisible()
  })
})
