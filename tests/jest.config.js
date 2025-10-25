/**
 * Jest Configuration for Tiered Product System Tests
 */

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'routes/api-product-catalog.js',
    'static/js/components/product-navigator.js',
    'config/product-catalog-categorized.json'
  ],
  coverageDirectory: 'tests/coverage',
  verbose: true
};