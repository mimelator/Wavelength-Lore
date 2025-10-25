# Merchandise Issue Testing Suite

## 🎯 Overview

Comprehensive test suite designed to diagnose and validate fixes for two critical merchandise store issues:

1. **Progress Dialog Hangs**: When creating upscaled images, the progress dialog never triggers and the page hangs
2. **Product Auto-Removal**: Previously created products are being automatically removed unexpectedly

## 🧪 Test Components

### 1. Upscaling Progress Dialog Test
**File**: `tests/merchandise/upscaling-progress-dialog-test.js`

**Purpose**: Diagnose why progress dialogs don't appear during upscaling operations

**Key Features**:
- ✅ Monitors progress dialog visibility and updates
- ✅ Tracks network requests and response times
- ✅ Detects page hangs and timeout issues
- ✅ Captures console messages and error states
- ✅ Tests both image preview enhancement and product creation flows

**What It Tests**:
- Progress modal appearance timing
- Progress bar updates during operations
- Network request/response cycles
- Page hang detection (no updates for 10+ seconds)
- Loading state management
- API timeout handling

### 2. Product Persistence Test
**File**: `tests/merchandise/product-persistence-test.js`

**Purpose**: Identify why products are being auto-removed and validate persistence

**Key Features**:
- ✅ Creates test products and tracks their lifecycle
- ✅ Monitors product state changes across page refreshes
- ✅ Analyzes auto-removal criteria (0 variants, 0 images)
- ✅ Tests time-based removal for old incomplete products
- ✅ Validates product cleanup logic

**What It Tests**:
- Product creation success rates
- Persistence after page refresh
- Auto-removal criteria analysis
- Product age and timestamp tracking
- Broken vs incomplete product classification
- Cleanup function effectiveness

### 3. Comprehensive Test Runner
**File**: `tests/merchandise/comprehensive-merchandise-test.js`

**Purpose**: Orchestrates all tests and provides unified reporting

**Key Features**:
- ✅ Runs both test suites in sequence
- ✅ Aggregates results and identifies patterns
- ✅ Provides actionable recommendations
- ✅ Generates comprehensive reports

## 🚀 Running the Tests

### Quick Start
```bash
# Run comprehensive test suite (recommended)
./scripts/test-merchandise-issues.sh

# Run individual tests separately
./scripts/test-merchandise-issues.sh --individual

# Get help
./scripts/test-merchandise-issues.sh --help
```

### Manual Execution
```bash
# Run comprehensive suite
node tests/merchandise/comprehensive-merchandise-test.js

# Run individual tests
node tests/merchandise/upscaling-progress-dialog-test.js
node tests/merchandise/product-persistence-test.js
```

### Environment Configuration
```bash
# Test against different server
BASE_URL=http://localhost:3000 ./scripts/test-merchandise-issues.sh

# Set test environment
NODE_ENV=development ./scripts/test-merchandise-issues.sh
```

## 📊 Test Output Analysis

### Progress Dialog Issues
The tests will identify:
- ❌ **Modal Never Appears**: Loading modal doesn't show during operations
- ❌ **No Progress Updates**: Progress bar stays at 0% throughout operation
- ❌ **Hanging Requests**: Network requests that never complete
- ❌ **Missing Error Handling**: Operations that fail silently

### Product Persistence Issues
The tests will identify:
- ❌ **Aggressive Auto-Removal**: Valid products being removed incorrectly
- ❌ **Missing Timestamps**: Products without creation time tracking
- ❌ **Broken Validation**: Incorrect criteria for determining "broken" products
- ❌ **Grace Period Issues**: Incomplete products removed too quickly

## 🔍 Diagnostic Capabilities

### Real-Time Monitoring
- **Progress Updates**: Captures all progress dialog state changes
- **Network Traffic**: Monitors API requests and responses
- **Console Messages**: Tracks JavaScript errors and warnings
- **DOM Changes**: Observes product card additions/removals

### Issue Detection
- **Page Hangs**: Detects when operations stop progressing
- **Failed Requests**: Identifies network failures and timeouts
- **State Inconsistencies**: Finds mismatches between expected and actual states
- **Timing Issues**: Measures operation durations and identifies bottlenecks

## 🛠️ Expected Findings

### Progress Dialog Issues
Based on the reported symptoms, the tests may reveal:
1. **setLoading() Not Called**: Progress dialog setup missing from upscaling operations
2. **Modal HTML Missing**: Loading modal elements not present in DOM
3. **Network Timeouts**: API calls hanging without proper timeout handling
4. **Error Handling Gaps**: Failed operations not properly communicated to user

### Product Auto-Removal Issues
The tests may identify:
1. **Overly Aggressive Cleanup**: Products removed before processing completes
2. **Missing Grace Periods**: No time allowance for product setup
3. **Incorrect Validation**: Products marked as "broken" when they're just processing
4. **Timestamp Issues**: Product age calculation problems

## 📋 Recommendations Implementation

### For Progress Dialog Fixes
```javascript
// Ensure setLoading is called immediately
this.setLoading(true, 'Starting image enhancement...', 0);

// Add progress updates during operation
setTimeout(() => {
  if (this.isLoading) {
    this.setLoading(true, 'Analyzing image quality...', 25);
  }
}, 2000);

// Add timeout handling
const timeoutId = setTimeout(() => {
  this.setLoading(false);
  this.showError('Operation timed out');
}, 30000);
```

### For Product Persistence Fixes
```javascript
// Add grace period for incomplete products
const GRACE_PERIOD = 15 * 60 * 1000; // 15 minutes

// Improve broken product detection
isProductBroken(product) {
  const hasNoContent = !product.variants?.length && !product.images?.length;
  const isOld = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) > GRACE_PERIOD;
  return hasNoContent && isOld;
}
```

## 🎯 Success Criteria

### Progress Dialog Tests Pass When:
- ✅ Loading modal appears within 2 seconds of operation start
- ✅ Progress bar updates at least 3 times during operation
- ✅ Network requests complete within reasonable timeouts
- ✅ Operations either succeed or fail with clear error messages

### Product Persistence Tests Pass When:
- ✅ Created products persist across page refreshes
- ✅ Only genuinely broken products are auto-removed
- ✅ Incomplete products have adequate processing time
- ✅ Product state changes are properly tracked and logged

## 🚨 Critical Issues to Watch For

1. **Silent Failures**: Operations that fail without user notification
2. **Infinite Loading**: Progress dialogs that never resolve
3. **Data Loss**: Valid products being incorrectly removed
4. **Race Conditions**: Timing issues between product creation and validation

## 📞 Support and Debugging

If tests reveal issues:

1. **Check Server Logs**: Look for API errors during test execution
2. **Browser DevTools**: Monitor network tab during manual testing
3. **Database State**: Verify product records match UI display
4. **Timing Analysis**: Review operation durations for bottlenecks

The test suite provides comprehensive diagnostics to identify root causes and validate fixes for both critical merchandise store issues.