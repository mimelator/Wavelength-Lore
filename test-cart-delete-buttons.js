#!/usr/bin/env node

/**
 * WAVELENGTH Cart Delete Button Test
 * 
 * Tests if cart delete/trash buttons are working properly
 */

console.log('🧪 WAVELENGTH: Testing cart delete button functionality...');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: []
};

function addTest(name, passed, details) {
  testResults.tests.push({ name, passed, details });
  console.log(passed ? '✅' : '❌', name);
  if (details) console.log('   ', details);
}

// Test 1: Check if cart renderer has delete button in HTML
console.log('\n📋 Test 1: Cart HTML Contains Delete Buttons');
const fs = require('fs');
const path = require('path');

try {
  const cartRendererPath = path.join(__dirname, 'static/js/components/merchandise-cart-renderer.js');
  const cartRendererContent = fs.readFileSync(cartRendererPath, 'utf8');
  
  const hasRemoveButton = cartRendererContent.includes('remove-item-btn');
  const hasTrashIcon = cartRendererContent.includes('🗑️');
  const hasDeleteHandler = cartRendererContent.includes('handleRemoveItem');
  
  addTest('Cart renderer includes remove-item-btn class', hasRemoveButton);
  addTest('Cart renderer includes trash icon', hasTrashIcon);
  addTest('Cart renderer has handleRemoveItem method', hasDeleteHandler);
  
} catch (error) {
  addTest('Read cart renderer file', false, error.message);
}

// Test 2: Check if event listeners are set up properly
console.log('\n📋 Test 2: Event Listener Setup');
try {
  const cartRendererContent = fs.readFileSync(path.join(__dirname, 'static/js/components/merchandise-cart-renderer.js'), 'utf8');
  
  const hasEventDelegation = cartRendererContent.includes('container.addEventListener');
  const hasRemoveItemCheck = cartRendererContent.includes("e.target.classList.contains('remove-item-btn')");
  const hasHandlerCall = cartRendererContent.includes('this.handleRemoveItem(e.target)');
  
  addTest('Uses event delegation on container', hasEventDelegation);
  addTest('Checks for remove-item-btn class in click handler', hasRemoveItemCheck);
  addTest('Calls handleRemoveItem in event handler', hasHandlerCall);
  
} catch (error) {
  addTest('Analyze event listener setup', false, error.message);
}

// Test 3: Check if main store calls setupEventListeners
console.log('\n📋 Test 3: Main Store Integration');
try {
  const storeContent = fs.readFileSync(path.join(__dirname, 'static/js/components/merchandise-store.js'), 'utf8');
  
  const hasUpdateCartUI = storeContent.includes('updateCartUI()');
  const callsSetupEventListeners = storeContent.includes('this.cartRenderer.setupEventListeners');
  const updatesAfterCartChange = storeContent.includes("this.eventBus.on('cart.updated'");
  
  addTest('Has updateCartUI method', hasUpdateCartUI);
  addTest('Calls cartRenderer.setupEventListeners', callsSetupEventListeners);  
  addTest('Listens for cart.updated events', updatesAfterCartChange);
  
} catch (error) {
  addTest('Analyze main store integration', false, error.message);
}

// Test 4: Verify handleRemoveItem implementation
console.log('\n📋 Test 4: Remove Item Handler Implementation');
try {
  const cartRendererContent = fs.readFileSync(path.join(__dirname, 'static/js/components/merchandise-cart-renderer.js'), 'utf8');
  
  // Check if handleRemoveItem method exists and does the right things
  const hasHandleRemoveItemMethod = /handleRemoveItem\s*\([^)]*\)\s*{/.test(cartRendererContent);
  const getsProductId = cartRendererContent.includes('button.dataset.productId');
  const getsVariantId = cartRendererContent.includes('button.dataset.variantId');
  const callsCartService = cartRendererContent.includes('this.cartService.removeItem');
  const emitsEvent = cartRendererContent.includes("this.eventBus.emit('cart.itemRemoved'");
  
  addTest('handleRemoveItem method exists', hasHandleRemoveItemMethod);
  addTest('Gets productId from button dataset', getsProductId);
  addTest('Gets variantId from button dataset', getsVariantId);
  addTest('Calls cartService.removeItem', callsCartService);
  addTest('Emits cart.itemRemoved event', emitsEvent);
  
} catch (error) {
  addTest('Analyze handleRemoveItem implementation', false, error.message);
}

// Summary
console.log('\n📊 SUMMARY:');
const passedTests = testResults.tests.filter(t => t.passed).length;
const totalTests = testResults.tests.length;
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Delete buttons should be working.');
  console.log('💡 If delete buttons still not working, the issue is likely:');
  console.log('   1. Event listeners not being set up after DOM updates');
  console.log('   2. Missing cart service or event bus connections');
  console.log('   3. Cart items not being rendered with proper data attributes');
} else {
  console.log('⚠️  Some tests failed. Issues found:');
  testResults.tests.filter(t => !t.passed).forEach(test => {
    console.log(`   - ${test.name}: ${test.details || 'Failed'}`);
  });
}

console.log('\n🔍 Next steps:');
console.log('1. Check browser console for errors when clicking delete buttons');
console.log('2. Inspect cart HTML to verify data attributes are present');
console.log('3. Test event listener attachment with: document.querySelector(".cart-container")._cartRendererInstance');
console.log('4. Check if cart service is connected with: window.merchandiseStore.cartService');

console.log('\n🌊 WAVELENGTH cart delete button test complete!');