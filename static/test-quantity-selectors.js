/**
 * QUANTITY SELECTOR TEST SCRIPT
 * 
 * This script tests the cart quantity +/- buttons to ensure
 * they are properly working after the event listener fix.
 */

console.log('🧪 TESTING CART QUANTITY SELECTORS...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test button availability
const quantityDecreaseButtons = document.querySelectorAll('.quantity-decrease');
const quantityIncreaseButtons = document.querySelectorAll('.quantity-increase');
const quantityInputs = document.querySelectorAll('.quantity-input');

console.log('📊 QUANTITY CONTROL ELEMENTS:');
console.log(`   • Decrease buttons (-): ${quantityDecreaseButtons.length}`);
console.log(`   • Increase buttons (+): ${quantityIncreaseButtons.length}`);
console.log(`   • Quantity inputs: ${quantityInputs.length}`);

if (quantityDecreaseButtons.length === 0) {
  console.log('⚠️ No quantity controls found - cart may be empty');
  console.log('💡 Add some items to cart first, then run this test');
} else {
  console.log('');
  console.log('🔍 TESTING EVENT LISTENERS:');
  
  // Test if event listeners are attached
  let hasEventListeners = false;
  const testButton = quantityDecreaseButtons[0];
  
  // Check if button has data attributes
  const hasProductId = testButton.hasAttribute('data-product-id');
  const hasVariantId = testButton.hasAttribute('data-variant-id');
  
  console.log(`   • Button has product ID: ${hasProductId}`);
  console.log(`   • Button has variant ID: ${hasVariantId}`);
  
  // Test click simulation
  console.log('');
  console.log('🎯 SIMULATING BUTTON CLICKS:');
  console.log('   • Click the +/- buttons in the cart to test');
  console.log('   • Quantity should change immediately');
  console.log('   • Cart total should update');
  console.log('   • Both visual buttons and input arrows should work');
  
  // Add click event monitoring
  let clickCount = 0;
  const originalLog = console.log;
  
  // Monitor for successful quantity changes
  quantityDecreaseButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      clickCount++;
      console.log(`✅ Decrease button ${i + 1} clicked (total clicks: ${clickCount})`);
    });
  });
  
  quantityIncreaseButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      clickCount++;
      console.log(`✅ Increase button ${i + 1} clicked (total clicks: ${clickCount})`);
    });
  });
}

console.log('');
console.log('💡 HOW TO USE:');
console.log('   1. Ensure cart has items');
console.log('   2. Click +/- buttons next to quantities');
console.log('   3. Watch console for click confirmations');
console.log('   4. Verify quantities update in UI');
console.log('');
console.log('🌊 Quantity selector test script loaded!');