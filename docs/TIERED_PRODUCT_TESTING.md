# Tiered Product System Testing Guide

Comprehensive test suite for the tiered product categorization system covering both API endpoints and browser interactions.

## Test Structure

```
tests/
├── tiered-product-system.test.js     # API tests
├── browser/
│   └── tiered-product-browser.test.js # Browser/UI tests
├── run-tiered-tests.js               # Test runner
├── jest.config.js                    # Jest configuration
└── setup.js                          # Global test setup
```

## Installation

Install test dependencies:

```bash
# Copy test dependencies to main package.json or install separately
npm install --save-dev jest supertest puppeteer @types/jest
```

## Running Tests

### All Tests
```bash
npm run test:tiered
# or
node tests/run-tiered-tests.js
```

### API Tests Only
```bash
npm run test:api
# or
npx jest tests/tiered-product-system.test.js
```

### Browser Tests Only
```bash
npm run test:browser
# or
npx jest tests/browser/tiered-product-browser.test.js
```

## Test Coverage

### API Tests (`tiered-product-system.test.js`)
- ✅ **Product Catalog API**: Tests `/api/product-catalog` endpoint
- ✅ **Category Navigation**: Tests `/api/product-catalog/:categoryId`
- ✅ **Search Functionality**: Tests `/api/product-catalog/search`
- ✅ **Error Handling**: Tests 404 responses and invalid requests
- ✅ **Performance**: Validates response times under 2 seconds
- ✅ **Data Validation**: Ensures proper JSON structure and required fields

### Browser Tests (`tiered-product-browser.test.js`)
- ✅ **Page Loading**: Verifies product selection page loads correctly
- ✅ **Navigation Flow**: Tests 3-tier navigation (categories → subcategories → products)
- ✅ **Search Interface**: Tests search input, results display, and clear functionality
- ✅ **Responsive Design**: Tests mobile and tablet viewports
- ✅ **Loading States**: Validates loading indicators during navigation
- ✅ **Error Handling**: Tests offline mode and network failure scenarios
- ✅ **Accessibility**: Tests keyboard navigation and ARIA labels

## Test Features

### API Testing
- **Supertest Integration**: HTTP endpoint testing
- **Response Validation**: JSON structure and data type checking
- **Performance Monitoring**: Response time validation
- **Error Scenario Testing**: Invalid requests and edge cases

### Browser Testing
- **Puppeteer Integration**: Real browser automation
- **Multi-Viewport Testing**: Desktop, tablet, and mobile responsive testing
- **User Interaction Simulation**: Clicks, typing, keyboard navigation
- **Accessibility Testing**: ARIA labels and keyboard accessibility
- **Network Condition Testing**: Offline mode simulation

### Test Utilities
- **Custom Timeouts**: 30-second timeout for complex browser operations
- **Wait Conditions**: Helper functions for waiting on dynamic content
- **Clean Console Output**: Suppressed logs during testing for cleaner output
- **Environment Isolation**: Test-specific environment variables

## Configuration

### Jest Configuration (`jest.config.js`)
```javascript
{
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js']
}
```

### Test Setup (`setup.js`)
- Global timeout configuration
- Test environment variables
- Utility functions for async operations
- Console output management

## Expected Test Results

### Successful Run Output
```
🧪 Starting Tiered Product System Test Suite...

📡 Running API Tests...
✓ Product Catalog API tests (5 tests)
✓ Performance tests (2 tests)
✓ Data validation tests (1 test)

🌐 Running Browser Tests...
✓ Page loading tests (2 tests)
✓ Navigation functionality (4 tests)
✓ Search functionality (3 tests)
✓ Responsive design (2 tests)
✓ Accessibility tests (2 tests)

✅ All tests completed!
```

## Troubleshooting

### Common Issues

**Puppeteer Installation Issues**
```bash
# Install Puppeteer with specific Chromium
npm install puppeteer --save-dev
```

**Port Conflicts**
- Tests use port 3002 by default
- Ensure port is available or modify `PORT` in test files

**Timeout Issues**
- Browser tests may need longer timeouts on slower systems
- Increase timeout in `jest.config.js` if needed

**Missing Dependencies**
```bash
# Install all required test dependencies
npm install --save-dev jest supertest puppeteer @types/jest
```

## Integration with CI/CD

The test suite is designed for CI/CD integration:

- **Exit Codes**: Proper exit codes for automated pipelines
- **Headless Mode**: Puppeteer runs in headless mode for CI environments
- **Timeout Handling**: Reasonable timeouts prevent hanging builds
- **Environment Detection**: Automatic test environment configuration

## Extending Tests

### Adding New API Tests
```javascript
test('New API functionality', async () => {
  const response = await request(app)
    .get('/api/new-endpoint')
    .expect(200);
  
  expect(response.body).toHaveProperty('expectedField');
});
```

### Adding New Browser Tests
```javascript
test('New UI functionality', async () => {
  await page.click('.new-element');
  await page.waitForSelector('.expected-result');
  
  const element = await page.$('.expected-result');
  expect(element).toBeTruthy();
});
```

This comprehensive test suite ensures the tiered product system works correctly across all user interactions and API endpoints.