# Merch Store E2E Tests

Comprehensive browser-based end-to-end tests for the Merch Store customization → preview workflow using Puppeteer.

## Overview

These tests validate the complete user workflow:
1. Navigate to Merch Store
2. Select an image from gallery
3. Choose a product
4. Open customization dialog
5. Select effects
6. Update preview
7. Open finished product preview
8. Navigate back to customization
9. Close modals with Escape key

## Prerequisites

### Install Dependencies

```bash
npm install puppeteer
```

### Ensure Server is Running

Start your server before running tests:
```bash
npm start
```

The tests expect the Merch Store at `http://localhost:3000/merchandise-store`

## Running Tests

### Quick Start

```bash
node tests/merch-store-e2e.test.js
```

### With Options

```bash
# Custom URL
BASE_URL=http://localhost:5000 node tests/merch-store-e2e.test.js

# Show browser
HEADLESS=false node tests/merch-store-e2e.test.js

# Slow down (milliseconds)
SLOW_MO=500 node tests/merch-store-e2e.test.js

# Combine options
HEADLESS=false SLOW_MO=300 node tests/merch-store-e2e.test.js
```

### npm scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test:merch": "node tests/merch-store-e2e.test.js",
    "test:merch:debug": "HEADLESS=false SLOW_MO=500 node tests/merch-store-e2e.test.js"
  }
}
```

Then run:
```bash
npm run test:merch
npm run test:merch:debug
```

## Test Coverage

### 9 Test Categories with 45+ Steps:

1. **Navigate to Merch Store** (3 steps)
2. **Select Image** (4 steps)
3. **Select Product** (4 steps)
4. **Customization Dialog Opens** (5 steps)
5. **Select Effects and Update Preview** (5 steps)
6. **Preview Finished Product** (7 steps) ← CRITICAL TEST
7. **Back to Customize** (6 steps)
8. **Close with Escape Key** (5 steps)
9. **Complete Workflow Integration** (3 steps)

## Test Output

### Successful Run

```
════════════════════════════════════════════════════════════════════════════════
  🧪 MERCH STORE E2E TEST SUITE
════════════════════════════════════════════════════════════════════════════════

📝 Test 1: Navigate to Merch Store
  ✅ Navigate to merchandise store page
  ✅ Page contains merchandise store title
  ✅ Gallery images are loaded

[... more tests ...]

════════════════════════════════════════════════════════════════════════════════
  📊 TEST SUMMARY
════════════════════════════════════════════════════════════════════════════════

  Total Tests:    45
  ✅ Passed:       45
  ❌ Failed:       0
  Pass Rate:      100.0%

════════════════════════════════════════════════════════════════════════════════
  ✅ ALL TESTS PASSED! 🎉
════════════════════════════════════════════════════════════════════════════════
```

## Debugging

### See Browser in Action

```bash
HEADLESS=false node tests/merch-store-e2e.test.js
```

### Slow Down Execution

```bash
SLOW_MO=1000 HEADLESS=false node tests/merch-store-e2e.test.js
```

### Common Issues

**Tests timeout:**
```bash
SLOW_MO=500 node tests/merch-store-e2e.test.js
```

**Server not found:**
```bash
npm start  # In another terminal
```

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

## What Gets Tested

✅ **Customization Dialog**
- Opens correctly
- All effects visible
- Update Preview button works

✅ **Preview Transition**
- NO ALERT shown (critical!)
- Preview modal opens smoothly
- Customization modal hidden

✅ **Back Navigation**
- Back button restores customization
- All selections intact
- Can preview multiple times

✅ **Modal Management**
- Only one modal active at a time
- Clean modal stacking
- No orphaned listeners

✅ **Keyboard Interaction**
- Escape key closes modals
- No console errors
- Smooth transitions

## Exit Codes

- `0` - All tests passed ✅
- `1` - Tests failed ❌

Use in scripts:
```bash
npm run test:merch && npm run deploy
```

## CI/CD Integration

### GitHub Actions

```yaml
- run: npm install
- run: npm start &
- run: sleep 5
- run: npm run test:merch
```

### GitLab CI

```yaml
script:
  - npm install
  - npm start &
  - sleep 5
  - npm run test:merch
```

## Advanced

### Custom Tester Instance

```javascript
const MerchStoreE2ETester = require('./merch-store-e2e.test.js');

const tester = new MerchStoreE2ETester({
  baseUrl: 'http://localhost:3000',
  headless: false,
  slowMo: 500
});

await tester.runAllTests();
```

### Run Individual Tests

```javascript
const tester = new MerchStoreE2ETester();
await tester.initialize();
await tester.testNavigateToMerchStore();
await tester.cleanup();
```

## Performance

- Full test suite: ~1-2 minutes
- Headless mode: Fastest
- SLOW_MO: Adds delays for debugging
- Tests run sequentially

## Support

1. Run with `HEADLESS=false` to see actions
2. Check console output for error messages
3. Review test code for expected selectors
4. Verify selectors match HTML structure

---

**Version:** 1.0  
**Status:** Production Ready  
**Coverage:** 45+ test steps  
**Estimated Time:** 1-2 minutes per run
