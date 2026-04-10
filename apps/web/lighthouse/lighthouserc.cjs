module.exports = {
  ci: {
    collect: {
      // URL patterns to audit - customize based on your app's key routes
      url: [
        'https://derby.razzormail.com' // Dashboard/Home (SPA handles routing client-side)
      ],
      // Use Puppeteer for authentication before testing
      puppeteerScript: './lighthouse-auth.cjs',
      // Puppeteer launch options
      puppeteerLaunchOptions: {
        headless: 'new', // Use new headless mode to avoid deprecation warnings
        args: ['--no-sandbox', '--disable-dev-shm-usage'] // Chrome flags for CI
      },
      // Number of runs per URL to get reliable results
      numberOfRuns: 3,
      settings: {
        // Chrome flags for CI environment
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
        // Production site uses HTTPS - don't skip HTTPS audits
        // Throttling settings for consistent results
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      }
    },
    assert: {
      // Define performance budgets and assertions
      assertions: {
        // Core Web Vitals and Performance
        'categories:performance': ['warn', { minScore: 0.75 }], // Reasonable for React SPA
        'categories:accessibility': ['error', { minScore: 0.9 }], // High accessibility standard
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals - adjusted for SPA
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        
        // Other important metrics
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        
        // Security and best practices
        'errors-in-console': 'warn', // Monitor console errors in production
        'uses-https': ['error', { minScore: 1 }], // Ensure HTTPS is used
      }
    },
    upload: {
      // Upload results to Lighthouse CI server (GitHub App)
      target: 'lhci',
      token: process.env.LHCI_GITHUB_APP_TOKEN,
      ignoreDuplicateBuildFailure: true,
      // Additional GitHub integration settings
      githubStatusContextSuffix: '/derby-stat-tracker'
    }
  }
};