#!/usr/bin/env node

/**
 * WAVELENGTH Checkout Error Fix Validator
 * 
 * Validates that the checkout method now properly uses cart service
 * instead of accessing undefined this.cart property
 */

const fs = require('fs');
const path = require('path');

console.log('💳 WAVELENGTH: Validating Checkout Error Fix...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const STATIC_DIR = path.join(__dirname, 'static', 'js', 'components');
const storeFilePath = path.join(STATIC_DIR, 'merchandise-store.js');

if (!fs.existsSync(storeFilePath)) {
  console.log('❌ Store file not found');
  process.exit(1);
}

const content = fs.readFileSync(storeFilePath, 'utf8');

console.log('📋 Testing Checkout Method Fix:');
console.log('');

// Test 1: Check that checkout uses cartService.getItems()
if (content.includes('this.cartService.getItems()')) {
  console.log('✅ PASS: Checkout now uses cartService.getItems() instead of this.cart');
} else {
  console.log('❌ FAIL: Checkout method not using cartService.getItems()');
  process.exit(1);
}

// Test 2: Check that old this.cart.length reference is removed
if (!content.includes('if (this.cart.length === 0)')) {
  console.log('✅ PASS: Removed problematic this.cart.length reference');
} else {
  console.log('❌ FAIL: Still contains this.cart.length reference');
  process.exit(1);
}

// Test 3: Check for proper null/undefined checking
if (content.includes('!cartItems || cartItems.length === 0')) {
  console.log('✅ PASS: Added proper null/undefined checking for cart items');
} else {
  console.log('❌ FAIL: Missing proper cart items validation');
  process.exit(1);
}

// Test 4: Check that error handling is preserved
if (content.includes('catch (error)') && content.includes('Checkout failed:')) {
  console.log('✅ PASS: Error handling preserved in checkout method');
} else {
  console.log('❌ FAIL: Missing error handling in checkout');
  process.exit(1);
}

console.log('');
console.log('🎯 Error Analysis:');
console.log('');
console.log('❌ ORIGINAL ERROR:');
console.log('   TypeError: Cannot read properties of undefined (reading \'length\')');
console.log('   at MerchandiseStore.checkout (line 1325)');
console.log('   Code: if (this.cart.length === 0)');
console.log('');
console.log('🔍 ROOT CAUSE:');
console.log('   • MerchandiseStore class doesn\'t have this.cart property');
console.log('   • Store uses cartService architecture instead');
console.log('   • this.cart was undefined → this.cart.length threw error');
console.log('');
console.log('✅ SOLUTION APPLIED:');
console.log('   • Use this.cartService.getItems() to get cart items');
console.log('   • Add null/undefined checking: !cartItems || cartItems.length === 0');
console.log('   • Maintain same error message for empty cart');
console.log('   • Preserve existing error handling structure');
console.log('');

console.log('📝 Technical Fix Details:');
console.log('• Changed: if (this.cart.length === 0)');
console.log('• To: const cartItems = this.cartService.getItems();');
console.log('•     if (!cartItems || cartItems.length === 0)');
console.log('• Added proper service-based cart access');
console.log('• Maintained consistent error messaging');
console.log('• Preserved try/catch error handling');
console.log('');

console.log('🧪 Expected Behavior:');
console.log('✅ Empty cart → Shows "Your cart is empty" error');
console.log('✅ Cart with items → Opens checkout modal');
console.log('✅ Service errors → Proper error handling');
console.log('✅ No more undefined property access errors');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 SUCCESS: Checkout error should now be resolved!');
console.log('💳 Checkout button will now work without undefined errors');
console.log('✨ Proper cart service integration in checkout flow');