# Merchandise Product Customization Tests

Comprehensive test suite for the product customization modal feature, covering frontend UI, backend APIs, and integration flows.

## Test Files

### 1. `product-customization-unit.test.js`
**Type:** Unit Tests (Pure JavaScript)  
**Runtime:** ~1 second  
**Dependencies:** None (standalone)

Tests pure JavaScript functions without browser or server:
- `findProductConfig()` - Product lookup by ID
- `extractImageContext()` - Image metadata extraction
- `generateProductName()` - Context-aware name generation
- `getBorderConfig()` - Border configuration mapping
- Template substitution logic
- Edge cases and error handling

**Run:**
```bash
node tests/merchandise/product-customization-unit.test.js
```

**Expected Output:**
```
✅ PASSED: 6/6 (100%)
- findProductConfig()
- extractImageContext()
- generateProductName()
- getBorderConfig()
- Template substitution edge cases
- Border config structure validation
```

---

### 2. `border-preview-api.test.js`
**Type:** API Integration Tests  
**Runtime:** ~30-60 seconds  
**Dependencies:** Server must be running on localhost:3001

Tests the border preview generation API:
- Solid border generation
- Gradient border generation
- Wavelength-theme border generation
- Invalid configuration handling
- Missing parameter validation
- Border width variations
- Response performance measurement

**Prerequisites:**
```bash
# Start the development server
npm run dev
```

**Run:**
```bash
node tests/merchandise/border-preview-api.test.js
```

**Expected Output:**
```
✅ PASSED: 7/7 (100%)
- Generate solid border preview
- Generate gradient border preview
- Generate wavelength-theme border preview
- Handle invalid border configuration
- Handle missing image URL
- Generate borders with different widths
- Measure border preview generation performance
```

**Notes:**
- Requires at least one image in the user gallery
- Tests actual image processing via Sharp
- Measures real response times
- Validates error handling

---

### 3. `product-customization-modal.test.js`
**Type:** End-to-End UI Tests (Puppeteer)  
**Runtime:** ~2-3 minutes  
**Dependencies:** Server running, Puppeteer, Chrome/Chromium

Tests the complete user experience:
- Navigate to merchandise store
- Select image from gallery
- Open customization modal
- Verify modal initial state
- Change border styles (with live preview)
- Edit product name
- Add product description
- Change size/color options
- Close modal without creating
- Create product with full customization

**Prerequisites:**
```bash
# Install Puppeteer if not already installed
npm install puppeteer

# Start the development server
npm run dev

# Ensure you're logged in or have auth bypass enabled
```

**Run:**
```bash
# With visible browser (for debugging)
node tests/merchandise/product-customization-modal.test.js

# Headless mode (for CI/CD)
HEADLESS=true node tests/merchandise/product-customization-modal.test.js
```

**Expected Output:**
```
✅ PASSED: 9/9 (100%)
- Navigate to merchandise store
- Select image from gallery
- Open customization modal
- Verify modal initial state
- Change border style
- Change border to wavelength-theme
- Edit product name
- Add product description
- Change size and color options
- Close modal without creating
- Create product with customization
```

**Configuration:**
```javascript
// Environment variables
BASE_URL=http://localhost:3001  // Server URL
HEADLESS=false                   // Show browser for debugging
```

---

## Running All Tests

### Sequential (Recommended)
```bash
# 1. Unit tests (fast, no dependencies)
node tests/merchandise/product-customization-unit.test.js

# 2. API tests (requires server)
node tests/merchandise/border-preview-api.test.js

# 3. E2E tests (requires server + browser)
node tests/merchandise/product-customization-modal.test.js
```

### Create a Test Runner Script
```bash
# tests/merchandise/run-all-tests.sh
#!/bin/bash

echo "🧪 Running Product Customization Test Suite"
echo "==========================================="

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Server not running on localhost:3001"
    echo "   Please start the server: npm run dev"
    exit 1
fi

# Run unit tests
echo ""
echo "1️⃣  Running Unit Tests..."
node tests/merchandise/product-customization-unit.test.js
UNIT_EXIT=$?

# Run API tests
echo ""
echo "2️⃣  Running API Tests..."
node tests/merchandise/border-preview-api.test.js
API_EXIT=$?

# Run E2E tests
echo ""
echo "3️⃣  Running E2E Tests..."
node tests/merchandise/product-customization-modal.test.js
E2E_EXIT=$?

# Summary
echo ""
echo "==========================================="
echo "📊 TEST SUITE SUMMARY"
echo "==========================================="
echo "Unit Tests: $([ $UNIT_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "API Tests:  $([ $API_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "E2E Tests:  $([ $E2E_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "==========================================="

# Exit with failure if any test failed
if [ $UNIT_EXIT -ne 0 ] || [ $API_EXIT -ne 0 ] || [ $E2E_EXIT -ne 0 ]; then
    exit 1
fi
```

Make it executable:
```bash
chmod +x tests/merchandise/run-all-tests.sh
./tests/merchandise/run-all-tests.sh
```

---

## Test Coverage

### Frontend Coverage
- ✅ Modal opening/closing
- ✅ Border style selection
- ✅ Live preview updates
- ✅ Product name editing
- ✅ Description input
- ✅ Size/color selection
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

### Backend Coverage
- ✅ Border preview generation
- ✅ Multiple border types (solid, gradient, theme)
- ✅ Image processing with Sharp
- ✅ Invalid input handling
- ✅ Response format validation
- ✅ Performance measurement
- ✅ Error responses

### Data Flow Coverage
- ✅ Image context extraction
- ✅ Product name generation
- ✅ Border config mapping
- ✅ Template substitution
- ✅ API request/response cycle
- ✅ State management in modal

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Merchandise Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: node tests/merchandise/product-customization-unit.test.js
      
      - name: Start server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3001
      
      - name: Run API tests
        run: node tests/merchandise/border-preview-api.test.js
      
      - name: Run E2E tests
        run: node tests/merchandise/product-customization-modal.test.js
        env:
          HEADLESS: true
```

---

## Debugging Failed Tests

### Unit Tests
- Check function logic against implementation
- Verify mock data matches actual product types
- Review template substitution patterns

### API Tests
- Ensure server is running: `curl http://localhost:3001`
- Check authentication/authorization
- Verify image URLs are accessible
- Review server logs for errors

### E2E Tests
- Run with visible browser: `HEADLESS=false`
- Check browser console for JavaScript errors
- Verify network requests in DevTools
- Ensure proper authentication state
- Review screenshots if test framework supports it

### Common Issues

**"Server not running"**
```bash
# Start server
npm run dev

# Verify it's running
curl http://localhost:3001
```

**"Image not found"**
- Ensure at least one image exists in gallery
- Check S3/storage connectivity
- Verify image URL accessibility

**"Modal not opening"**
- Check if product types are loaded
- Verify JavaScript bundle is loaded
- Check for console errors

**"Border preview timeout"**
- Border processing can take time for large images
- Increase timeout values in tests
- Check Sharp library installation

---

## Performance Benchmarks

Expected performance (on typical hardware):

| Test Type | Duration | Notes |
|-----------|----------|-------|
| Unit Tests | < 1s | Pure JavaScript, no I/O |
| API Tests | 30-60s | Includes image processing |
| E2E Tests | 2-3min | Full browser automation |

Border generation performance:
- Solid borders: ~100-500ms
- Gradient borders: ~200-800ms
- Wavelength theme: ~300-1000ms

*Times vary based on image size and system resources*

---

## Contributing

When adding new features to product customization:

1. **Add unit tests** for new helper functions
2. **Add API tests** if creating new endpoints
3. **Add E2E tests** for new UI interactions
4. **Update this README** with new test cases
5. **Run all tests** before committing

### Test Structure
```javascript
async testYourFeature() {
  console.log('\n🎯 TEST: Your feature description');
  
  try {
    // Arrange - setup test data
    // Act - perform the action
    // Assert - verify the result
    
    console.log('✅ Test passed');
    this.results.passed.push('Test name');
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    this.results.failed.push({ test: 'Test name', error: error.message });
    return false;
  }
}
```

---

## Questions?

See main project documentation or contact the development team.
