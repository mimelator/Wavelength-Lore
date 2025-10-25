#!/usr/bin/env node
/**
 * Test Runner for Tiered Product System
 * Runs both API and browser tests with proper setup
 */

const { spawn } = require('child_process');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting Tiered Product System Test Suite...\n');

  // Run API tests
  console.log('📡 Running API Tests...');
  await runCommand('npx', ['jest', 'tests/tiered-product-system.test.js', '--verbose']);

  console.log('\n🌐 Running Browser Tests...');
  await runCommand('npx', ['jest', 'tests/browser/tiered-product-browser.test.js', '--verbose']);

  console.log('\n✅ All tests completed!');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', reject);
  });
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests };