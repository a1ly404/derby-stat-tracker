#!/usr/bin/env node

/**
 * Local test script to simulate GitHub Actions environment
 * This helps debug CI-specific issues locally
 */

console.log('🔧 Testing GitHub Actions workflow locally...\n');

// Set environment variables similar to GitHub Actions
process.env.NODE_OPTIONS = '--experimental-vm-modules';
process.env.FORCE_COLOR = '0';
process.env.CI = 'true';

const { spawn } = require('child_process');

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`➤ Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${command} failed with exit code ${code}\n`);
        reject(new Error(`Command failed: ${command}`));
      }
    });
  });
}

async function main() {
  try {
    console.log('Node.js version:', process.version);
    console.log('Environment variables:');
    console.log('  NODE_OPTIONS:', process.env.NODE_OPTIONS);
    console.log('  FORCE_COLOR:', process.env.FORCE_COLOR);
    console.log('  CI:', process.env.CI);
    console.log('');

    // Install dependencies
    await runCommand('npm', ['ci']);
    
    // Run linting
    await runCommand('npm', ['run', 'lint']);
    
    // Run tests
    await runCommand('npm', ['run', 'test']);
    
    // Build application
    await runCommand('npm', ['run', 'build']);
    
    console.log('🎉 All checks passed! Ready for deployment.');
    
  } catch (error) {
    console.error('💥 Quality gate failed:', error.message);
    process.exit(1);
  }
}

main();