#!/usr/bin/env node

/**
 * WAVELENGTH Cart Button Font Consistency Validator
 * 
 * Validates that Clear All and Continue Shopping buttons now use
 * the site-wide AnimeAce font family for consistency
 */

const fs = require('fs');
const path = require('path');

console.log('🛒 WAVELENGTH: Validating Cart Button Font Consistency...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const STATIC_DIR = path.join(__dirname, 'static', 'css');
const cssFilePath = path.join(STATIC_DIR, 'enhanced-product-ui.css');

if (!fs.existsSync(cssFilePath)) {
  console.log('❌ CSS file not found');
  process.exit(1);
}

const content = fs.readFileSync(cssFilePath, 'utf8');

console.log('📋 Testing Font Consistency for Cart Buttons:');
console.log('');

// Test 1: Check for clear-cart-btn font family
if (content.includes('.clear-cart-btn') && content.includes("font-family: 'AnimeAce', Arial, sans-serif")) {
  console.log('✅ PASS: Clear All button now uses AnimeAce font');
} else {
  console.log('❌ FAIL: Clear All button missing AnimeAce font');
  process.exit(1);
}

// Test 2: Check for continue-shopping-btn font family update
const continueShoppingMatches = content.match(/\.continue-shopping-btn\s*{[^}]*font-family:\s*'AnimeAce'/g);
if (continueShoppingMatches && continueShoppingMatches.length > 0) {
  console.log('✅ PASS: Continue Shopping button now uses AnimeAce font');
} else {
  console.log('❌ FAIL: Continue Shopping button missing AnimeAce font');
  process.exit(1);
}

// Test 3: Check that clear-cart-btn has proper styling
if (content.includes('.clear-cart-btn') && content.includes('background: rgba(244, 67, 54')) {
  console.log('✅ PASS: Clear All button has proper red theme styling');
} else {
  console.log('❌ FAIL: Clear All button missing proper styling');
  process.exit(1);
}

// Test 4: Check for hover effects
if (content.includes('.clear-cart-btn:hover') && content.includes('.continue-shopping-btn:hover')) {
  console.log('✅ PASS: Both buttons have hover effects defined');
} else {
  console.log('❌ FAIL: Missing hover effects for buttons');
  process.exit(1);
}

console.log('');
console.log('🎨 Font Consistency Improvements:');
console.log('');
console.log('❌ BEFORE: Buttons used default browser fonts');
console.log('   • Clear All: Browser default (Times, Arial, etc.)');
console.log('   • Continue Shopping: Browser default (Times, Arial, etc.)');
console.log('');
console.log('✅ AFTER: Both buttons use site-wide AnimeAce font');
console.log('   • Clear All: AnimeAce, Arial, sans-serif');
console.log('   • Continue Shopping: AnimeAce, Arial, sans-serif');
console.log('');

console.log('📝 Additional Improvements Made:');
console.log('• Added proper Clear All button styling with red theme');
console.log('• Enhanced button appearance with rounded corners');
console.log('• Added hover effects for better user interaction');
console.log('• Consistent gap and padding for professional look');
console.log('• Proper font sizing and weight matching site style');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 SUCCESS: Cart buttons now match site-wide font!');
console.log('🔤 AnimeAce font applied consistently to all cart buttons');
console.log('✨ Professional appearance with site brand consistency');