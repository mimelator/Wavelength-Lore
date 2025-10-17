/**
 * Standalone Input Sanitization Test Runner
 * Runs tests without starting the server - expects server to be running
 */

const InputSanitizationTester = require('./test-input-sanitization');

async function runStandaloneTests() {
  console.log('🧹 Running Input Sanitization Tests (Standalone Mode)');
  console.log('Expected: Server running on http://localhost:3001\n');

  const tester = new InputSanitizationTester();
  await tester.runAllTests();
}

// Run the tests
runStandaloneTests().catch(console.error);