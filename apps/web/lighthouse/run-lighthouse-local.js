#!/usr/bin/env node

/**
 * Cross-platform script to load .env.local and run Lighthouse CI
 * Usage: node run-lighthouse-local.js
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Loading environment variables from .env.local...');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found! Please create it with your credentials.');
    console.error('💡 Use .env.example as a template.');
    process.exit(1);
}

// Load environment variables from .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let loadedCount = 0;
envLines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
        return;
    }
    
    // Parse KEY=VALUE format
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
        console.log(`✅ Set ${key.trim()}`);
        loadedCount++;
    }
});

console.log(`\n📊 Loaded ${loadedCount} environment variables`);
console.log('🚀 Running Lighthouse CI on production site...');
console.log('🔗 Testing: https://derby.razzormail.com');
console.log(`👤 Using: ${process.env.LIGHTHOUSE_TEST_EMAIL}`);
console.log('');

try {
    // Set Chrome path for LHCI
    process.env.CHROME_PATH = 'C:\\Users\\17783\\AppData\\Local\\Chromium\\Application\\chrome.exe';
    
    // Run Lighthouse CI with the local config
    execSync('npm run lighthouse:prod', { 
        stdio: 'inherit',
        env: process.env 
    });
    
    console.log('');
    console.log('✨ Lighthouse CI completed! Check the .lighthouseci-local folder for results.');
} catch (error) {
    console.error('❌ Lighthouse CI failed:', error.message);
    process.exit(1);
}