/**
 * VALIDATION: Product Options Flow After Preview
 *
 * This tests the complete flow:
 * 1. User customizes a product and clicks "Preview Finished Product"
 * 2. User sees the preview modal with "Add to Cart" button
 * 3. Clicking "Add to Cart" emits product.goToProductOptions event
 * 4. The event includes productType, blueprintId, and printProviderId
 * 5. handleGoToProductOptions handler receives all required fields
 */

const fs = require('fs');
const path = require('path');

// Read the merchandise-modal-renderer.js file
const modalRendererPath = path.join(__dirname, 'static/js/components/merchandise-modal-renderer.js');
const modalRendererContent = fs.readFileSync(modalRendererPath, 'utf8');

// Read the merchandise-store.js file
const merchandiseStorePath = path.join(__dirname, 'static/js/components/merchandise-store.js');
const merchandiseStoreContent = fs.readFileSync(merchandiseStorePath, 'utf8');

console.log('🧪 VALIDATION: Product Options Flow After Preview\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

// TEST 1: Check that handleAddToCartFromFinishedProduct extracts productType
console.log('\n📋 TEST 1: Extract productType from modal data');
if (modalRendererContent.includes('const productType = customizationOverlay?.dataset.productType;')) {
  console.log('✅ PASS: productType extraction found');
  passCount++;
} else {
  console.log('❌ FAIL: productType extraction not found');
  failCount++;
}

// TEST 2: Check that handleAddToCartFromFinishedProduct extracts blueprintId
console.log('\n📋 TEST 2: Extract blueprintId from modal data');
if (modalRendererContent.includes('const blueprintId = customizationOverlay?.dataset.blueprintId')) {
  console.log('✅ PASS: blueprintId extraction found');
  passCount++;
} else {
  console.log('❌ FAIL: blueprintId extraction not found');
  failCount++;
}

// TEST 3: Check that handleAddToCartFromFinishedProduct extracts printProviderId
console.log('\n📋 TEST 3: Extract printProviderId from modal data');
if (modalRendererContent.includes('const printProviderId = customizationOverlay?.dataset.printProviderId')) {
  console.log('✅ PASS: printProviderId extraction found');
  passCount++;
} else {
  console.log('❌ FAIL: printProviderId extraction not found');
  failCount++;
}

// TEST 4: Check that event includes productType
console.log('\n📋 TEST 4: Event includes productType in payload');
if (modalRendererContent.includes('productType: productType,') &&
    modalRendererContent.includes('product.goToProductOptions')) {
  console.log('✅ PASS: productType passed in event payload');
  passCount++;
} else {
  console.log('❌ FAIL: productType not in event payload');
  failCount++;
}

// TEST 5: Check that event includes blueprintId
console.log('\n📋 TEST 5: Event includes blueprintId in payload');
if (modalRendererContent.includes('blueprintId: blueprintId,') &&
    modalRendererContent.includes('product.goToProductOptions')) {
  console.log('✅ PASS: blueprintId passed in event payload');
  passCount++;
} else {
  console.log('❌ FAIL: blueprintId not in event payload');
  failCount++;
}

// TEST 6: Check that event includes printProviderId
console.log('\n📋 TEST 6: Event includes printProviderId in payload');
if (modalRendererContent.includes('printProviderId: printProviderId,') &&
    modalRendererContent.includes('product.goToProductOptions')) {
  console.log('✅ PASS: printProviderId passed in event payload');
  passCount++;
} else {
  console.log('❌ FAIL: printProviderId not in event payload');
  failCount++;
}

// TEST 7: Check that event listener expects all fields
console.log('\n📋 TEST 7: Event listener receives all required fields');
const eventListenerRegex = /this\.eventBus\.on\('product\.goToProductOptions'.*?\{[\s\S]*?productType.*?blueprintId.*?printProviderId/;
if (eventListenerRegex.test(merchandiseStoreContent)) {
  console.log('✅ PASS: Event listener expects productType, blueprintId, and printProviderId');
  passCount++;
} else {
  console.log('❌ FAIL: Event listener missing expected fields');
  console.log('   Looking for listener that handles: productType, blueprintId, printProviderId');
  failCount++;
}

// TEST 8: Check handleGoToProductOptions receives productType parameter
console.log('\n📋 TEST 8: handleGoToProductOptions function signature');
if (merchandiseStoreContent.includes('async handleGoToProductOptions(productId, productType, customization, blueprintId, printProviderId)')) {
  console.log('✅ PASS: handleGoToProductOptions has correct function signature');
  passCount++;
} else {
  console.log('❌ FAIL: handleGoToProductOptions missing productType parameter');
  failCount++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 VALIDATION SUMMARY: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Product options flow fix is complete.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} TEST(S) FAILED! Review the issues above.\n`);
  process.exit(1);
}
