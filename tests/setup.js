/**
 * Test Setup Configuration
 * Global setup for all tests
 */

// Increase timeout for browser tests
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  waitForCondition: async (condition, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await global.testUtils.delay(100);
    }
    throw new Error('Condition not met within timeout');
  }
};

// Console override for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error // Keep errors visible
};