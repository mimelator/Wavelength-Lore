#!/usr/bin/env node

/**
 * TEST: Prove the filename bug exists in the quality-validation code path
 *
 * If image passes quality validation, it skips upscaling entirely
 * and goes straight to uploadImage() with the original .webp filename.
 *
 * This test proves the bug exists in that path.
 */

const fs = require('fs');

console.log('\n' + '='.repeat(80));
console.log('🐛 TEST: Filename bug in quality-validation path (BEFORE FIX)');
console.log('='.repeat(80));

// Read the auto-enhanced-printify-service.js
const serviceCode = fs.readFileSync('./services/auto-enhanced-printify-service.js', 'utf8');

console.log('\n📋 CHECKING: What happens when image PASSES quality validation?');
console.log('-'.repeat(80));

// Find the quality validation code path
const qualityValidationSection = serviceCode.match(
  /\/\/ 🎨 STEP 3: Auto-enhance if image quality is good[\s\S]*?\/\/ 📤 STEP 5: Upload to Printify/
);

if (qualityValidationSection) {
  console.log('✅ Found quality validation section');
  console.log('\nCode flow when qualityCheck.passedValidation === true:');
  console.log('  1. Line 114: if (this.autoEnhancementEnabled && qualityCheck.passedValidation)');
  console.log('  2. Enhancement is applied (or skipped if already good)');
  console.log('  3. finalBuffer might now be PNG (from enhancement download)');
  console.log('  4. fileName is STILL "eloquence-5.webp" ❌');
  console.log('  5. Jumps to STEP 5: Upload to Printify');
} else {
  console.log('❌ Could not find quality validation section');
  process.exit(1);
}

console.log('\n' + '='.repeat(80));
console.log('🔍 CHECKING: Is fileName updated before final upload?');
console.log('-'.repeat(80));

// Check if there's filename updating AFTER the quality validation and BEFORE uploadImage call
const beforeUploadSection = serviceCode.match(
  /\/\/ 📤 STEP 5: Upload to Printify[\s\S]*?const uploadResult = await super\.uploadImage/
);

if (beforeUploadSection) {
  const sectionText = beforeUploadSection[0];

  if (sectionText.includes('fileName = fileName.replace')) {
    console.log('✅ PASS: fileName is updated before uploadImage() call');
    console.log('   The fix is in place!');
  } else {
    console.log('❌ FAIL: fileName is NOT updated before uploadImage() call!');
    console.log('   Bug still exists in the quality-validation path');
  }
} else {
  console.log('⚠️  Could not analyze pre-upload section');
}

console.log('\n' + '='.repeat(80));
console.log('💥 CONSEQUENCE');
console.log('='.repeat(80));

console.log('\nWhen image passes quality validation:');
console.log('  ✗ finalBuffer might be PNG (from enhancement or original)');
console.log('  ✗ fileName remains ".webp"');
console.log('  ✗ Passes PNG buffer + .webp filename to parent uploadImage()');
console.log('  ✗ Parent tries to convert PNG→PNG (corrupts data)');
console.log('  ✗ Printify returns 400 error');

console.log('\n' + '='.repeat(80) + '\n');
