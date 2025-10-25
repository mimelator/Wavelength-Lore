# Anonymous User Testing Suite

## Overview

Comprehensive test suite that validates the anonymous (non-authenticated) user experience on the Wavelength Lore site. Ensures public content is accessible while authenticated-only features remain properly hidden and restricted.

## Purpose

- **Validate public access**: Ensure anonymous users can browse public pages
- **Verify access controls**: Confirm restricted routes require authentication
- **Check UI visibility**: Ensure edit buttons, admin controls are hidden
- **Test navigation**: Validate site navigation works for anonymous users
- **Prevent security issues**: Catch accidentally exposed authenticated features

## Test Coverage

### Public Pages (9 tests)
- ✅ Home page
- ✅ Characters gallery
- ✅ Individual character pages
- ✅ Lore gallery
- ✅ Individual lore pages
- ✅ Episode pages
- ✅ About page
- ✅ Map page
- ✅ Search page

### Hidden Elements (2 tests)
- 🔴 Edit buttons should be hidden
- 🔴 Admin controls should be hidden

### Restricted Routes (3 tests)
- ✅ Admin routes require authentication
- ✅ User gallery requires authentication
- 🔴 Merchandise store requires authentication

### Functionality (2 tests)
- ⚠️ Navigation works
- ✅ Search API works

## Running the Tests

```bash
# Run the anonymous user test suite
node tests/anonymous-user-suite.test.js

# Run with custom URL (for production testing)
TEST_URL=https://wavelengthlore.com node tests/anonymous-user-suite.test.js
```

## Test Configuration

### Environment Variables

- `TEST_URL` - Base URL to test (default: `http://localhost:3001`)
- `TIMEOUT` - Test timeout in milliseconds (default: `30000`)

### Browser Settings

- **Headless**: `false` (visible browser for debugging)
- **Viewport**: 1920x1080
- **Slow Motion**: None (tests run at normal speed)

## Current Status

**Pass Rate: 75.0% (12/16 tests passing)**

### Known Issues

1. **Merchandise store accessible without auth** - Critical security issue
2. **Edit buttons visible to anonymous users** - UI visibility issue
3. **Admin links visible to anonymous users** - UI visibility issue (dev bypass)
4. **Navigation test timeout** - Test configuration issue

See [ANONYMOUS_USER_TEST_RESULTS.md](./ANONYMOUS_USER_TEST_RESULTS.md) for detailed findings.

## Development Bypass

⚠️ **Important**: Tests running on `localhost:3001` trigger the development authentication bypass in `middleware/auth.js`, which auto-authenticates requests with a test admin user.

This means:
- Some tests may pass that would fail in production
- Admin links may be visible due to authenticated session
- True anonymous testing requires production URL

### Testing True Anonymous Behavior

```bash
# Option 1: Test against production
TEST_URL=https://wavelengthlore.com node tests/anonymous-user-suite.test.js

# Option 2: Temporarily disable dev bypass
# Edit middleware/auth.js and comment out isDevelopmentBypass check

# Option 3: Use different IP/hostname
# (Not currently supported due to CORS restrictions)
```

## Test Architecture

### Class-Based Structure

```javascript
class AnonymousUserTester {
  constructor()      // Initialize test state
  async setup()      // Launch browser, configure page
  async testXXX()    // Individual test methods
  async cleanup()    // Close browser
  printResults()     // Display test summary
}
```

### Test Pattern

Each test method:
1. Navigates to a page
2. Validates expected behavior
3. Records pass/fail in results
4. Returns boolean success status

### Error Handling

- Tests catch errors and record failures
- Browser console errors are logged
- Page errors are captured
- Tests continue even if one fails

## Adding New Tests

```javascript
async testNewFeature() {
  console.log('\n🎯 TEST: New feature description');
  
  try {
    await this.page.goto(`${BASE_URL}/new-page`, { 
      waitUntil: 'networkidle0', 
      timeout: TIMEOUT 
    });
    
    // Validate behavior
    const element = await this.page.$('.expected-element');
    if (!element) {
      throw new Error('Expected element not found');
    }
    
    console.log('✅ New feature test passed');
    this.results.passed.push('New feature description');
    return true;
  } catch (error) {
    console.error('❌ New feature test failed:', error.message);
    this.results.failed.push({
      test: 'New feature description',
      error: error.message
    });
    return false;
  }
}
```

Then add to `runTests()`:
```javascript
await tester.testNewFeature();
await wait(1000); // Rate limit delay
```

## Debugging Tests

### View Browser Actions

Tests run with `headless: false` so you can watch the browser navigate and interact with pages.

### Console Logging

- Browser console errors are logged with ❌
- Page errors are logged with 💥
- Test progress is logged with emoji indicators

### Screenshots

Add screenshot capture for debugging:
```javascript
await this.page.screenshot({ 
  path: `temp/test-screenshot-${Date.now()}.png` 
});
```

## Integration with CI/CD

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed or fatal error

### Automated Testing

```bash
# In CI/CD pipeline
node tests/anonymous-user-suite.test.js
if [ $? -eq 0 ]; then
  echo "Anonymous user tests passed"
else
  echo "Anonymous user tests failed"
  exit 1
fi
```

## Related Documentation

- [Test Results](./ANONYMOUS_USER_TEST_RESULTS.md) - Detailed test findings
- [Security Guide](../docs/SECURITY_ENHANCEMENT_GUIDE.md) - Authentication and access control
- [Middleware Documentation](../middleware/README.md) - Authentication middleware

## Future Enhancements

### Planned Tests

- [ ] Forum browsing (read-only for anonymous users)
- [ ] Games page access (VIP required)
- [ ] Hidden content visibility (content marked as hidden)
- [ ] Mobile responsive behavior
- [ ] Performance metrics (page load times)

### Test Improvements

- [ ] Add authenticated user test suite
- [ ] Add role-based access control tests
- [ ] Add API endpoint security tests
- [ ] Add form submission validation
- [ ] Add XSS/injection prevention tests

### Infrastructure

- [ ] Add test reporting (HTML/JSON output)
- [ ] Add screenshot capture on failures
- [ ] Add video recording of test runs
- [ ] Add parallel test execution
- [ ] Add test data fixtures

## Maintenance

### When to Run

- Before deploying to production
- After authentication changes
- After route changes
- After UI template changes
- Weekly as part of regression suite

### Updating Tests

When adding new public pages:
1. Add test method for the page
2. Add to `runTests()` sequence
3. Update test count in documentation
4. Run full suite to verify

When changing authentication:
1. Review all restricted route tests
2. Update expected behaviors
3. Test both localhost and production
4. Verify dev bypass still works correctly

## Support

For issues or questions about the anonymous user test suite:
1. Check [ANONYMOUS_USER_TEST_RESULTS.md](./ANONYMOUS_USER_TEST_RESULTS.md) for known issues
2. Review test output for specific error messages
3. Check browser console for JavaScript errors
4. Verify server is running on expected port
5. Confirm authentication middleware is configured correctly
