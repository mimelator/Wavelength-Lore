#!/usr/bin/env node

/**
 * WAVELENGTH Cart Header Duplication Fix Validator
 * 
 * Validates that we removed the duplicate "Shopping Cart" heading
 * while keeping the detailed cart header with badge count.
 */

const fs = require('fs');
const path = require('path');

console.log('🛒 WAVELENGTH: Validating Cart Header Fix...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const STATIC_DIR = path.join(__dirname, 'static', 'js', 'components');

// Test files to check
const filesToCheck = [
  {
    file: 'merchandise-store.js',
    shouldNotContain: '<h2>🛒 Shopping Cart</h2>',
    shouldContain: 'cart-container',
    description: 'Main store should not have duplicate cart heading'
  },
  {
    file: 'merchandise-cart-renderer.js',
    shouldContain: 'Shopping Cart',
    shouldContain2: 'cart-badge',
    description: 'Cart renderer should keep detailed header with badge'
  }
];

let allTestsPassed = true;

console.log('📋 Running Cart Header Tests:');
console.log('');

filesToCheck.forEach((test, index) => {
  const filePath = path.join(STATIC_DIR, test.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Test ${index + 1}: File not found: ${test.file}`);
    allTestsPassed = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`🔍 Test ${index + 1}: ${test.description}`);
  
  // Check what should NOT be present
  if (test.shouldNotContain) {
    if (content.includes(test.shouldNotContain)) {
      console.log(`❌ FAIL: Found unwanted content: "${test.shouldNotContain}"`);
      allTestsPassed = false;
    } else {
      console.log(`✅ PASS: Unwanted content removed`);
    }
  }
  
  // Check what SHOULD be present
  if (test.shouldContain) {
    if (content.includes(test.shouldContain)) {
      console.log(`✅ PASS: Required content found: "${test.shouldContain}"`);
    } else {
      console.log(`❌ FAIL: Missing required content: "${test.shouldContain}"`);
      allTestsPassed = false;
    }
  }
  
  // Check secondary requirement
  if (test.shouldContain2) {
    if (content.includes(test.shouldContain2)) {
      console.log(`✅ PASS: Secondary content found: "${test.shouldContain2}"`);
    } else {
      console.log(`❌ FAIL: Missing secondary content: "${test.shouldContain2}"`);
      allTestsPassed = false;
    }
  }
  
  console.log('');
});

// Additional HTML structure validation
console.log('🏗️ HTML Structure Validation:');

const storeFile = path.join(STATIC_DIR, 'merchandise-store.js');
const storeContent = fs.readFileSync(storeFile, 'utf8');

// Check that store-section contains cart-container directly
const storeSectionMatch = storeContent.match(/<div class="store-section">\s*<div class="cart-container">/);
if (storeSectionMatch) {
  console.log('✅ PASS: Cart container properly nested in store section');
} else {
  console.log('❌ FAIL: Cart container structure issue');
  allTestsPassed = false;
}

// Check for any remaining duplicate headings patterns
const duplicateHeadingPattern = /Shopping Cart.*Shopping Cart/;
if (duplicateHeadingPattern.test(storeContent)) {
  console.log('❌ FAIL: Potential duplicate heading pattern still exists');
  allTestsPassed = false;
} else {
  console.log('✅ PASS: No duplicate heading patterns detected');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (allTestsPassed) {
  console.log('🎉 SUCCESS: All cart header tests passed!');
  console.log('✨ Cart now shows single clean header with badge count');
  console.log('🛒 No more duplicate "Shopping Cart" headings');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Some cart header tests failed');
  console.log('🔧 Please review the cart rendering structure');
  process.exit(1);
}