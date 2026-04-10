/**
 * Puppeteer script for Lighthouse CI authentication
 * This script logs in to the Derby Stat Tracker before Lighthouse runs
 * It checks if already authenticated and skips login if so
 */

const puppeteer = require('puppeteer');

module.exports = async (browser, context) => {
  // Get authentication credentials from environment variables
  const email = process.env.LIGHTHOUSE_TEST_EMAIL;
  const password = process.env.LIGHTHOUSE_TEST_PASSWORD;
  
  if (!email || !password) {
    throw new Error(
      'Authentication credentials not found. Please set LIGHTHOUSE_TEST_EMAIL and LIGHTHOUSE_TEST_PASSWORD environment variables.'
    );
  }

  console.log('🔐 Starting authentication process...');
  
  // Create a new page for authentication
  const page = await browser.newPage();
  
  try {
    // Navigate to the main site
    console.log('📱 Navigating to main site...');
    await page.goto('https://derby.razzormail.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`📍 Current URL: ${page.url()}`);

    // Check if we're already authenticated
    console.log('🔍 Checking authentication status...');
    const isAlreadyLoggedIn = await page.evaluate(() => {
      // Look for authenticated indicators (sign out button, nav items, etc.)
      return !!(
        document.querySelector('.sign-out-btn') || 
        document.querySelector('button[class*="sign-out"]') ||
        document.querySelector('.nav-item')
      );
    });

    if (isAlreadyLoggedIn) {
      console.log('✅ Already authenticated! Skipping login process.');
      
      // Store current authentication state for Lighthouse
      const cookies = await page.cookies();
      const localStorage = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      });

      context.cookies = cookies;
      context.localStorage = localStorage;
      
      console.log(`🍪 Stored ${cookies.length} cookies for Lighthouse`);
      console.log(`💾 Stored ${Object.keys(localStorage).length} localStorage items`);
      
      return; // Exit early - already authenticated
    }

    // Need to authenticate - look for Sign In button
    console.log('🔐 Not authenticated - proceeding with login...');
    
    // Wait for page to load completely
    await page.waitForTimeout(2000);
    
    // Look for and click the Sign In button
    console.log('🔍 Looking for Sign In button...');
    const signInClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('sign in') || text.includes('login')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    if (!signInClicked) {
      throw new Error('Could not find Sign In button');
    }

    console.log('✅ Clicked Sign In button');
    
    // Wait for login modal to appear
    await page.waitForTimeout(2000);

    // Wait for email input to be available
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('#email', { timeout: 10000 });

    // Fill in email
    console.log('📧 Filling email field...');
    await page.type('#email', email, { delay: 50 });

    // Fill in password
    console.log('🔑 Filling password field...');
    await page.type('#password', password, { delay: 50 });

    // Click submit button
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"].auth-button');

    // Wait for login to process
    console.log('⏳ Waiting for authentication to complete...');
    await page.waitForTimeout(5000);

    // Verify login success by checking for authenticated elements
    const loginSuccess = await page.evaluate(() => {
      return !!(
        document.querySelector('.sign-out-btn') || 
        document.querySelector('button[class*="sign-out"]') ||
        document.querySelector('.nav-item')
      );
    });

    if (!loginSuccess) {
      // Check for error messages
      const errorElement = await page.$('.error, .alert-error, [role="alert"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        throw new Error(`Login failed: ${errorText}`);
      } else {
        throw new Error('Login failed: Could not verify successful authentication');
      }
    }

    console.log('🎉 Authentication successful!');

    // Store authentication state for Lighthouse
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });

    context.cookies = cookies;
    context.localStorage = localStorage;

    console.log(`🍪 Stored ${cookies.length} cookies for Lighthouse`);
    console.log(`💾 Stored ${Object.keys(localStorage).length} localStorage items`);

  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  } finally {
    await page.close();
  }
};