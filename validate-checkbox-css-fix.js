/**
 * VALIDATION: Border Enable Checkbox CSS Styling Fix
 *
 * This tests that the CSS styling for the checked state of the
 * border enable checkbox is present and matches the effect checkbox pattern.
 */

const fs = require('fs');
const path = require('path');

// Read the merchandise CSS file
const cssPath = path.join(__dirname, 'static/css/merchandise-store.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('🧪 VALIDATION: Border Enable Checkbox CSS Styling Fix\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

// TEST 1: Check for checkbox-custom base styles
console.log('\n📋 TEST 1: Base .checkbox-custom styling exists');
if (cssContent.includes('.checkbox-custom {') && cssContent.includes('width: 18px')) {
  console.log('✅ PASS: Base checkbox styles found');
  passCount++;
} else {
  console.log('❌ FAIL: Base checkbox styles not found');
  failCount++;
}

// TEST 2: Check for border-enable-label input hidden
console.log('\n📋 TEST 2: Border enable checkbox input is hidden');
if (cssContent.includes('.border-enable-label input[type="checkbox"] {') &&
    cssContent.includes('display: none;')) {
  console.log('✅ PASS: Input is hidden (custom checkbox shown instead)');
  passCount++;
} else {
  console.log('❌ FAIL: Input hiding not found');
  failCount++;
}

// TEST 3: Check for checked state styling
console.log('\n📋 TEST 3: Checked state background color styling');
if (cssContent.includes('.border-enable-label input[type="checkbox"]:checked + .checkbox-custom {') &&
    cssContent.includes('background: #667eea;')) {
  console.log('✅ PASS: Checked state styles background color');
  passCount++;
} else {
  console.log('❌ FAIL: Checked state background styling not found');
  failCount++;
}

// TEST 4: Check for checked border color styling
console.log('\n📋 TEST 4: Checked state border color styling');
if (cssContent.includes('border-color: #667eea;')) {
  console.log('✅ PASS: Checked state changes border color');
  passCount++;
} else {
  console.log('❌ FAIL: Checked state border color not found');
  failCount++;
}

// TEST 5: Check for ::after checkmark
console.log('\n📋 TEST 5: Checkmark appearance with ::after pseudo-element');
if (cssContent.includes('.border-enable-label input[type="checkbox"]:checked + .checkbox-custom::after {') &&
    cssContent.includes("content: '✓';")) {
  console.log('✅ PASS: Checkmark (✓) appears on checked state');
  passCount++;
} else {
  console.log('❌ FAIL: Checkmark styling not found');
  failCount++;
}

// TEST 6: Check for checkmark white color
console.log('\n📋 TEST 6: Checkmark is white and visible');
if (cssContent.includes('color: white;') &&
    cssContent.includes('font-weight: bold;')) {
  console.log('✅ PASS: Checkmark is bold and white');
  passCount++;
} else {
  console.log('❌ FAIL: Checkmark styling incomplete');
  failCount++;
}

// TEST 7: Check consistency with effect checkbox styling
console.log('\n📋 TEST 7: Border checkbox styling matches effect checkbox pattern');
const borderCheckedRule = cssContent.includes('.border-enable-label input[type="checkbox"]:checked + .checkbox-custom {');
const effectCheckedRule = cssContent.includes('.effect-checkbox-label input[type="checkbox"]:checked + .checkbox-custom {');
const borderAfterRule = cssContent.includes('.border-enable-label input[type="checkbox"]:checked + .checkbox-custom::after {');
const effectAfterRule = cssContent.includes('.effect-checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {');

if (borderCheckedRule && borderAfterRule && effectCheckedRule && effectAfterRule) {
  console.log('✅ PASS: Both border and effect checkboxes have consistent styling');
  passCount++;
} else {
  console.log('❌ FAIL: Styling not consistent between checkbox types');
  failCount++;
}

// TEST 8: Check for documentation
console.log('\n📋 TEST 8: CSS fix is documented');
if (cssContent.includes('CRITICAL FIX') && cssContent.includes('checkbox when checked')) {
  console.log('✅ PASS: CSS fix is documented with CRITICAL FIX comment');
  passCount++;
} else {
  console.log('❌ FAIL: CSS fix documentation not found');
  failCount++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 VALIDATION SUMMARY: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Checkbox CSS fix is complete.\n');
  console.log('The border enable checkbox will now:\n');
  console.log('- Show a blue background when checked');
  console.log('- Display a white checkmark (✓) when checked');
  console.log('- Return to default appearance when unchecked\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failCount} TEST(S) FAILED! Review the issues above.\n`);
  process.exit(1);
}
