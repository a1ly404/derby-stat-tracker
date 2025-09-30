/**
 * Local Lighthouse RC configuration for testing localhost
 * This file can be used for local testing with: npm run lighthouse:local
 * Make sure to run 'npm run build && npm run preview' first to start the local server
 */

// Use local Chromium installation for testing
const chromePath = 'C:\\Users\\17783\\AppData\\Local\\Chromium\\Application\\chrome.exe';

module.exports = {
  ci: {
    collect: {
      // URL patterns to audit - Local development URLs
      url: [
        'http://localhost:4173' // Vite preview server default port
      ],
      // Use local Chromium installation
      chromePath: chromePath,
      // No authentication needed for localhost testing
      // puppeteerScript: './lighthouse-auth.cjs',
      // Puppeteer launch options
      puppeteerLaunchOptions: {
        headless: 'new', // Use new headless mode to avoid deprecation warnings
        args: ['--no-sandbox', '--disable-dev-shm-usage'] // Chrome flags
      },
      // Number of runs per URL to get reliable results
      numberOfRuns: 1, // Reduced for local testing
      settings: {
        // Use local Chromium installation
        chromePath: chromePath,
        // Chrome flags for local environment
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
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
      // Define performance budgets and assertions - More lenient for local testing
      assertions: {
        // Core Web Vitals and Performance
        'categories:performance': ['warn', { minScore: 0.65 }], // More lenient for testing
        'categories:accessibility': ['error', { minScore: 0.9 }], // High accessibility standard
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.7 }],
        
        // Core Web Vitals - adjusted for SPA
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.2 }], // Slightly more lenient for local testing
        'speed-index': ['warn', { maxNumericValue: 4500 }],
        
        // Other important metrics
        'total-blocking-time': ['warn', { maxNumericValue: 400 }],
        'interactive': ['warn', { maxNumericValue: 6000 }],
        
        // Security and best practices  
        'errors-in-console': 'warn', // Monitor console errors
        // Skip HTTPS check for localhost testing
        // 'is-on-https': ['error', { minScore: 1 }], // Not needed for localhost
      }
    },
    upload: {
      // For local testing, just save results locally
      target: 'filesystem',
      outputDir: './.lighthouseci-local'
    }
  }
};