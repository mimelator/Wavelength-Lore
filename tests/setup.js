
// Jest setup file for group management tests

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  database: jest.fn(() => ({
    ref: jest.fn(() => ({
      once: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      push: jest.fn(),
      remove: jest.fn()
    }))
  }))
}));

// Global test timeout
jest.setTimeout(10000);

// Console cleanup for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: validateDOMNesting')) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
