#!/usr/bin/env node
/**
 * Run Tiered Product Flow Test
 * Executes the complete user flow test for the tiered product system
 */

const { spawn } = require('child_process');
const path = require('path');

async function runFlowTest() {
  console.log('🧪 Starting Tiered Product System Flow Test...\n');

  try {
    await runCommand('npx', ['jest', 'tests/browser/tiered-product-flow.test.js', '--verbose', '--testTimeout=60000']);
    console.log('\n✅ Flow test completed successfully!');
  } catch (error) {
    console.error('\n❌ Flow test failed:', error.message);
    process.exit(1);
  }
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
  runFlowTest().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runFlowTest };