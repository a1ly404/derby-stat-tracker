#!/usr/bin/env node

/**
 * Script to run Lighthouse CI against localhost
 * This script:
 * 1. Builds the app
 * 2. Starts vite preview server
 * 3. Runs lighthouse against localhost
 * 4. Cleans up the server
 */

import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

console.log('🏗️  Building the application...');

// Step 1: Build the app
const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
});

buildProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Build failed');
        process.exit(1);
    }
    
    console.log('✅ Build completed successfully');
    console.log('🚀 Starting preview server...');
    
    // Step 2: Start preview server
    const previewProcess = spawn('npm', ['run', 'preview', '--', '--host', '0.0.0.0', '--port', '4173'], {
        stdio: 'pipe',
        shell: true,
        detached: !isWindows
    });
    
    let serverReady = false;
    let lighthouseProcess = null;
    let detectedPort = '4173'; // Default port
    
    // Set a timeout to ensure we don't hang forever
    const serverTimeout = setTimeout(() => {
        if (!serverReady) {
            console.log('⏰ Server startup timeout, trying to run Lighthouse anyway...');
            runLighthouse();
        }
    }, 10000); // 10 second timeout
    
    function runLighthouse() {
        if (serverReady) return; // Already running
        serverReady = true;
        clearTimeout(serverTimeout);
        
        console.log(`🔍 Running Lighthouse CI against localhost:${detectedPort}...`);
        
        // Step 3: Run Lighthouse with dynamic port
        lighthouseProcess = spawn('npx', ['lhci', 'autorun', '--config=lighthouse/lighthouserc.local.cjs', `--url=http://localhost:${detectedPort}`], {
            stdio: 'inherit',
            shell: true
        });
        
        lighthouseProcess.on('close', (lhCode) => {
            cleanup();
            
            if (lhCode === 0) {
                console.log('✅ Lighthouse CI completed successfully!');
                process.exit(0);
            } else {
                console.log('❌ Lighthouse CI failed');
                process.exit(1);
            }
        });
    }
    
    function cleanup() {
        console.log('🧹 Cleaning up...');
        
        if (previewProcess && !previewProcess.killed) {
            if (isWindows) {
                // Kill the process tree on Windows
                spawn('taskkill', ['/pid', previewProcess.pid.toString(), '/f', '/t'], { 
                    shell: true,
                    stdio: 'ignore'
                });
            } else {
                previewProcess.kill('SIGTERM');
            }
        }
    }
    
    previewProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        // Extract port number from output
        const portMatch = output.match(/localhost:(\d+)/);
        if (portMatch && portMatch[1]) {
            detectedPort = portMatch[1];
        }
        
        // Check if server is ready - look for the port in the output
        if (output.includes('localhost:') && output.includes('Local:')) {
            if (!serverReady) {
                // Wait a moment for server to fully start
                setTimeout(runLighthouse, 2000);
            }
        }
    });
    
    previewProcess.stderr.on('data', (data) => {
        console.error(data.toString());
    });
    
    previewProcess.on('close', (previewCode) => {
        if (previewCode !== 0 && !serverReady) {
            console.error('❌ Preview server failed to start');
            process.exit(1);
        }
    });
    
    // Handle cleanup on process exit
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
});

buildProcess.on('error', (err) => {
    console.error('❌ Failed to start build process:', err);
    process.exit(1);
});