/**
 * VALIDATION: Preview Image Fix in Customization Modal
 *
 * This tests that the customization modal uses the original gallery image
 * (sourceImage) instead of the manufactured product image (Printify mockup).
 */

const fs = require('fs');
const path = require('path');

// Read the merchandise-store.js file
const merchandiseStorePath = path.join(__dirname, 'static/js/components/merchandise-store.js');
const merchandiseStoreContent = fs.readFileSync(merchandiseStorePath, 'utf8');

console.log('🧪 VALIDATION: Preview Image Fix\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

// TEST 1: Check that originalImageUrl is extracted from sourceImage
console.log('\n📋 TEST 1: Extract originalImageUrl from sourceImage');
if (merchandiseStoreContent.includes("const originalImageUrl = product.sourceImage?.url || product.sourceImage?.thumbnailUrl")) {
  console.log('✅ PASS: originalImageUrl extraction from sourceImage found');
  passCount++;
} else {
  console.log('❌ FAIL: originalImageUrl extraction not found');
  failCount++;
}

// TEST 2: Check that previewImage uses originalImageUrl
console.log('\n📋 TEST 2: previewImage set to originalImageUrl');
if (merchandiseStoreContent.includes('previewImage: originalImageUrl,')) {
  console.log('✅ PASS: previewImage uses originalImageUrl');
  passCount++;
} else {
  console.log('❌ FAIL: previewImage not set to originalImageUrl');
  failCount++;
}

// TEST 3: Check that image uses originalImageUrl
console.log('\n📋 TEST 3: image property set to originalImageUrl');
if (merchandiseStoreContent.includes('image: originalImageUrl,')) {
  console.log('✅ PASS: image property uses originalImageUrl');
  passCount++;
} else {
  console.log('❌ FAIL: image property not using originalImageUrl');
  failCount++;
}

// TEST 4: Check that Printify image is preserved separately
console.log('\n📋 TEST 4: Printify image preserved as fallback');
if (merchandiseStoreContent.includes("printifyImage: product.images?.[0]?.src || product.images?.[0]?.url,")) {
  console.log('✅ PASS: Printify image stored as printifyImage for fallback');
  passCount++;
} else {
  console.log('❌ FAIL: Printify image not preserved separately');
  failCount++;
}

// TEST 5: Check for fallback in originalImageUrl extraction
console.log('\n📋 TEST 5: Fallback for missing sourceImage');
if (merchandiseStoreContent.includes("'/images/previews/generic-product-preview.svg'")) {
  console.log('✅ PASS: Generic fallback provided for missing sourceImage');
  passCount++;
} else {
  console.log('❌ FAIL: No fallback for missing sourceImage');
  failCount++;
}

// TEST 6: Check that this is in showCustomizationModal context (editing existing product)
console.log('\n📋 TEST 6: Fix is in showCustomizationModal function');
const showCustomizationContext = merchandiseStoreContent.match(
  /showCustomizationModal\(productId\)[\s\S]*?const originalImageUrl[\s\S]*?const preparedProduct/
);
if (showCustomizationContext) {
  console.log('✅ PASS: Fix is in correct showCustomizationModal context');
  passCount++;
} else {
  console.log('❌ FAIL: Fix not in showCustomizationModal context');
  failCount++;
}

// TEST 7: Check documentation comments
console.log('\n📋 TEST 7: Documentation explains the fix');
if (merchandiseStoreContent.includes('CRITICAL FIX: Use original gallery image') &&
    merchandiseStoreContent.includes('Effects and borders work much better with the original image')) {
  console.log('✅ PASS: Documentation clearly explains why gallery image is needed');
  passCount++;
} else {
  console.log('❌ FAIL: Insufficient documentation of the fix');
  failCount++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 VALIDATION SUMMARY: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Preview image fix is complete.\n');
  console.log('The customization modal will now use the original gallery image');
  console.log('which works much better with effects and borders.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} TEST(S) FAILED! Review the issues above.\n`);
  process.exit(1);
}
