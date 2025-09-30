# Lighthouse CI Setup

This project uses Lighthouse CI to automatically audit web performance, accessibility, and best practices on every pull request and main branch push. The setup includes **Puppeteer authentication** to test the production site behind login.

## Configuration

- **Config File**: `lighthouserc.js` (production), `lighthouserc.local.js` (local testing)
- **Workflow**: `.github/workflows/lighthouse.yml`
- **Authentication**: `lighthouse-auth.js` (Puppeteer script)
- **GitHub Secrets**: 
  - `LCHI_GITHUB_APP_TOKEN` - Lighthouse CI GitHub App token
  - `LIGHTHOUSE_TEST_EMAIL` - Test account email for authentication
  - `LIGHTHOUSE_TEST_PASSWORD` - Test account password

## What Gets Audited

The Lighthouse CI audits these key pages on **production** (https://derby.razzormail.com):
- `/` - Dashboard/Home page
- `/players` - Players management
- `/teams` - Teams management  
- `/bouts` - Bouts management
- `/live-track` - Live tracking (now accessible with authentication)

## Performance Budgets

Current performance thresholds:
- **Performance**: ≥75% (reasonable for React SPA)
- **Accessibility**: ≥90% (high standard)
- **Best Practices**: ≥90%
- **SEO**: ≥80%

### Core Web Vitals Budgets
- **First Contentful Paint**: ≤2.5s
- **Largest Contentful Paint**: ≤4.5s  
- **Cumulative Layout Shift**: ≤0.1
- **Total Blocking Time**: ≤300ms

## How It Works

1. **On PR/Push**: Lighthouse CI workflow runs automatically
2. **Build & Serve**: App is built and served locally via `npm run preview`
3. **Audit**: Each page is audited 3 times for reliable results
4. **Report**: Results are uploaded to GitHub with status checks
5. **Artifacts**: Detailed reports are saved as workflow artifacts

## Viewing Results

- **Status Checks**: See pass/fail status directly on PRs
- **Detailed Reports**: Download artifacts from workflow runs
- **GitHub Comments**: Lighthouse bot may comment on PRs with results

## Local Testing

### Testing Production Site with Authentication

To test the production site locally with authentication:

```bash
# Install dependencies (including Puppeteer)
npm install

# Set up environment variables
export LIGHTHOUSE_TEST_EMAIL="your-test-account@example.com"
export LIGHTHOUSE_TEST_PASSWORD="your-test-password"

# Run production Lighthouse CI
npm run lighthouse:prod
```

### Testing Local Build (Development)

To test a local build without authentication:

```bash
# Install Lighthouse CI globally
npm install -g @lhci/cli

# Build the app
npm run build

# Run local Lighthouse CI
npm run lighthouse:local
```

## Authentication Setup

The production Lighthouse CI uses Puppeteer to authenticate before running audits:

1. **Test Account**: Create a test user account on your production site
2. **GitHub Secrets**: Add credentials to your repository secrets
   - `LIGHTHOUSE_TEST_EMAIL`: Test account email
   - `LIGHTHOUSE_TEST_PASSWORD`: Test account password
3. **Auth Script**: `lighthouse-auth.js` handles the login process automatically

### Authentication Flow

1. Puppeteer opens the login page
2. Fills in email and password
3. Submits the form and waits for navigation
4. Stores cookies and localStorage for Lighthouse to use
5. Lighthouse runs audits with authenticated session

## Customization

Edit `lighthouserc.js` to:
- Add/remove URLs to audit
- Adjust performance budgets
- Modify assertion levels (warn vs error)
- Configure Chrome flags for different environments

## Troubleshooting

**Common Issues:**
- **Server startup timeout**: Increase `startServerReadyTimeout` in config
- **Flaky results**: Increase `numberOfRuns` for more stable averages
- **CI environment issues**: Adjust `chromeFlags` for different CI providers