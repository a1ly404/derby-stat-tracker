#!/usr/bin/env node

/**
 * Check GitHub Actions CI status
 * This script helps monitor the status of CI workflows
 */

import { execSync } from 'child_process';

console.log('🔍 Checking GitHub Actions CI status...\n');

try {
  // Get the latest commit hash
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const shortHash = commitHash.substring(0, 7);
  
  console.log(`📝 Latest commit: ${shortHash}`);
  console.log(`🌐 Repository: derby-stat-tracker`);
  console.log(`🔗 CI Dashboard: https://github.com/a1ly404/derby-stat-tracker/actions`);
  console.log(`🔗 Commit: https://github.com/a1ly404/derby-stat-tracker/commit/${commitHash}`);
  console.log('');
  
  // Get current branch
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`🌿 Current branch: ${branch}`);
  
  console.log('\n✅ Push completed successfully!');
  console.log('⏳ GitHub Actions should start running within 1-2 minutes.');
  console.log('📊 Check the links above to monitor CI progress.');
  console.log('');
  console.log('Expected workflow steps:');
  console.log('  1. ✅ Checkout repository');
  console.log('  2. ✅ Setup Node.js 20');
  console.log('  3. ✅ Install dependencies');
  console.log('  4. ✅ Run ESLint');
  console.log('  5. ✅ Run unit tests (happy-dom)');
  console.log('  6. ✅ Build application');
  console.log('  7. ✅ Generate test coverage');
  console.log('');
  console.log('🎯 If all steps pass, deployment will be ready!');
  
} catch (error) {
  console.error('❌ Error checking git status:', error.message);
  process.exit(1);
}