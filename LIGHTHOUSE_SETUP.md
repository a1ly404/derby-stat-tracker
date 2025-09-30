# Lighthouse CI with Puppet### Files Created/Modified

- **`lighthouse-auth.cjs`** - Puppeteer authentication script
- **`lighthouserc.cjs`** - Production Lighthouse config with new headless mode
- **`lighthouserc.local.cjs`** - Local testing configuration  
- **`.github/workflows/lighthouse.yml`** - GitHub Actions workflow with Puppeteer
- **`package.json`** - Added Puppeteer dependency and scripts
- **`run-lighthouse-local.js`** - Cross-platform local testing script
- **`run-lighthouse-local.ps1`** - PowerShell local testing script
- **`.gitignore`** - Added Lighthouse output directories and debug fileshentication Setup

## 🚀 Quick Setup

### 1. Add GitHub Repository Secrets

Add these secrets to your GitHub repository settings:

- `LIGHTHOUSE_TEST_EMAIL` - Email for your test account
- `LIGHTHOUSE_TEST_PASSWORD` - Password for your test account  
- `LCHI_GITHUB_APP_TOKEN` - Your existing Lighthouse CI GitHub App token

### 2. Create Test Account

Create a test user account on your production site at:
https://derby.razzormail.com

### 3. Commit and Deploy

```bash
git add .
git commit -m "Add Lighthouse CI with Puppeteer authentication"
git push origin main
```

## 🔧 What Was Added

### Files Created/Modified:

- **`lighthouse-auth.js`** - Puppeteer authentication script
- **`lighthouserc.js`** - Updated to use production URLs and authentication
- **`lighthouserc.local.js`** - Local testing configuration
- **`.github/workflows/lighthouse.yml`** - Updated with Puppeteer support
- **`package.json`** - Added Puppeteer dependency and scripts

### New npm Scripts:

- `npm run lighthouse:prod` - Test production site with authentication

## 🧪 Testing Locally

```bash
# Set environment variables
export LIGHTHOUSE_TEST_EMAIL="your-test-email@example.com"
export LIGHTHOUSE_TEST_PASSWORD="your-test-password"

# Install dependencies
npm install

# Run production Lighthouse CI locally
npm run lighthouse:prod
```

## 📊 What Gets Audited

The CI now tests your production site at `https://derby.razzormail.com`:

- ✅ Dashboard/Home page
- ✅ Players management
- ✅ Teams management  
- ✅ Bouts management
- ✅ Live tracking (authenticated)

## 🔐 Security Notes

- Test credentials are stored securely in GitHub repository secrets
- The Puppeteer script only logs in and stores session data
- No credentials are logged or exposed in CI output
- Authentication state is isolated to the Lighthouse testing session

## 🚨 Next Steps

1. **Add the repository secrets** in GitHub Settings > Secrets and variables > Actions
2. **Commit these changes** to trigger your first authenticated Lighthouse run
3. **Monitor the Actions tab** to see the results
4. **Adjust performance budgets** in `lighthouserc.js` if needed based on your production performance

## 📈 Performance Budgets

Current production budgets (may need adjustment):
- Performance: ≥75%
- Accessibility: ≥90%  
- Best Practices: ≥90%
- SEO: ≥80%

You can adjust these in `lighthouserc.js` based on your actual site performance.