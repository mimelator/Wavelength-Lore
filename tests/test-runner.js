#!/usr/bin/env node

/**
 * Test Runner for Wavelength Lore
 * Unified test runner for all test suites
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.testCategories = {
      security: [
        'test-firebase-security.js',
        'test-rate-limiting.js',
        'test-input-sanitization.js'
      ],
      features: [
        'test-character-system.js',
        'test-character-keywords.js',
        'test-episode-linking.js',
        'test-episode-keywords.js',
        'test-lore-system.js'
      ],
      integration: [
        'test-api-simple.js',
        'final-test.js',
        'real-test.js'
      ],
      firebase: [
        'test-firebase-lore.js',
        'test-firebase-videos.js'
      ],
      quick: [
        'quick-episode-test.js',
        'quick-rate-limit-test.js',
        'quick-sanitization-test.js'
      ]
    };
  }

  async runTest(testFile) {
    return new Promise((resolve) => {
      console.log(`🧪 Running: ${testFile}`);
      
      const testPath = path.join(__dirname, testFile);
      const child = spawn('node', [testPath], {
        stdio: 'inherit',
        cwd: path.dirname(testPath)
      });

      child.on('close', (code) => {
        const success = code === 0;
        console.log(success ? `✅ PASS: ${testFile}` : `❌ FAIL: ${testFile} (exit code: ${code})`);
        resolve({ file: testFile, success, code });
      });

      child.on('error', (error) => {
        console.error(`❌ ERROR: ${testFile} - ${error.message}`);
        resolve({ file: testFile, success: false, error: error.message });
      });
    });
  }

  async runCategory(category) {
    if (!this.testCategories[category]) {
      console.error(`❌ Unknown test category: ${category}`);
      console.log('Available categories:', Object.keys(this.testCategories).join(', '));
      return [];
    }

    console.log(`🚀 Running ${category} tests...`);
    console.log('='.repeat(50));

    const tests = this.testCategories[category];
    const results = [];

    for (const test of tests) {
      const result = await this.runTest(test);
      results.push(result);
      console.log(''); // Add spacing between tests
    }

    return results;
  }

  async runAll() {
    console.log('🧪 Running All Test Suites');
    console.log('='.repeat(50));

    const allResults = [];

    for (const [category, tests] of Object.entries(this.testCategories)) {
      console.log(`\n📂 Category: ${category.toUpperCase()}`);
      console.log('-'.repeat(30));
      
      const results = await this.runCategory(category);
      allResults.push(...results);
    }

    return allResults;
  }

  showSummary(results) {
    console.log('\n📊 Test Summary');
    console.log('='.repeat(50));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.file}: ${r.error || `exit code ${r.code}`}`));
    }

    console.log(`\n🏁 Completed ${total} tests`);
  }

  showHelp() {
    console.log('🧪 Wavelength Lore Test Runner');
    console.log('');
    console.log('Usage: node test-runner.js [category|test-file]');
    console.log('');
    console.log('Categories:');
    Object.entries(this.testCategories).forEach(([category, tests]) => {
      console.log(`  ${category.padEnd(12)} - ${tests.length} tests`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node test-runner.js                    # Run all tests');
    console.log('  node test-runner.js security           # Run security tests');
    console.log('  node test-runner.js features           # Run feature tests');
    console.log('  node test-runner.js test-rate-limiting.js  # Run specific test');
    console.log('');
    console.log('Available Tests:');
    Object.entries(this.testCategories).forEach(([category, tests]) => {
      console.log(`\n  ${category}:`);
      tests.forEach(test => console.log(`    - ${test}`));
    });
  }
}

async function main() {
  const runner = new TestRunner();
  const arg = process.argv[2];

  try {
    if (!arg || arg === '--help' || arg === '-h') {
      runner.showHelp();
      return;
    }

    let results = [];

    if (arg.endsWith('.js')) {
      // Run specific test file
      results = [await runner.runTest(arg)];
    } else if (runner.testCategories[arg]) {
      // Run test category
      results = await runner.runCategory(arg);
    } else if (arg === 'all') {
      // Run all tests
      results = await runner.runAll();
    } else {
      console.error(`❌ Unknown category or test file: ${arg}`);
      runner.showHelp();
      process.exit(1);
    }

    runner.showSummary(results);

    // Exit with error code if any tests failed
    const failed = results.filter(r => !r.success).length;
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;