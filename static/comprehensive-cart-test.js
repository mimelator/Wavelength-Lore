// COMPREHENSIVE CART FUNCTIONALITY TEST
// Run this in browser console to test the complete cart system

(function() {
  console.log('🌊 COMPREHENSIVE CART FUNCTIONALITY TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Verify all systems are working
  console.log('📊 STEP 1: System Status Check');
  if (typeof window.wavelengthFullDiagnostics === 'function') {
    const fullDiag = window.wavelengthFullDiagnostics();
    
    const storeReady = fullDiag.store && !fullDiag.store.error && fullDiag.store.store.isInitialized;
    const cartReady = fullDiag.cart && !fullDiag.cart.error;
    
    console.log('- Store Ready:', storeReady ? '✅' : '❌');
    console.log('- Cart Ready:', cartReady ? '✅' : '❌');
    
    if (!storeReady || !cartReady) {
      console.log('⚠️ Systems not ready - check diagnostics above');
      return;
    }
  } else {
    console.log('❌ Diagnostic functions not available');
    return;
  }

  // Step 2: Check UI elements for cart interaction
  console.log('\n🔍 STEP 2: UI Elements Scan');
  const uiElements = {
    galleryImages: document.querySelectorAll('.gallery-image-card'),
    selectButtons: document.querySelectorAll('.gallery-image-select'),
    addToCartButtons: document.querySelectorAll('.add-to-cart-btn'),
    cartContainer: document.querySelector('.cart-container'),
    productCards: document.querySelectorAll('.product-card'),
    variantSelectors: document.querySelectorAll('.variant-selector, .size-selector, .color-selector')
  };

  Object.entries(uiElements).forEach(([key, elements]) => {
    if (key === 'cartContainer') {
      console.log(`- ${key}: ${elements ? 'Found' : 'Not found'}`);
    } else {
      console.log(`- ${key}: ${elements.length} found`);
    }
  });

  // Step 3: Test cart operations
  console.log('\n🛒 STEP 3: Cart Operations Test');
  if (window.merchandiseStore && window.merchandiseStore.cartService) {
    const cartService = window.merchandiseStore.cartService;
    
    // Test cart methods
    console.log('Testing cart service methods:');
    console.log('- getSummary():', typeof cartService.getSummary === 'function' ? '✅' : '❌');
    console.log('- addItem():', typeof cartService.addItem === 'function' ? '✅' : '❌');
    console.log('- removeItem():', typeof cartService.removeItem === 'function' ? '✅' : '❌');
    console.log('- clearCart():', typeof cartService.clearCart === 'function' ? '✅' : '❌');
    
    // Check current cart state
    const cartSummary = cartService.getSummary();
    console.log('Current cart state:');
    console.log('- Items:', cartSummary.itemCount);
    console.log('- Total quantity:', cartSummary.totalQuantity);
    console.log('- Is empty:', cartSummary.isEmpty);
    console.log('- Total price:', cartSummary.totalPrice);
  } else {
    console.log('❌ Cart service not available');
  }

  // Step 4: Manual cart test
  console.log('\n🧪 STEP 4: Manual Cart Test');
  console.log('To test cart functionality manually:');
  console.log('1. Select a gallery image by clicking a "Select" button');
  console.log('2. Wait for product categories to appear');
  console.log('3. Click on a product category to see products');
  console.log('4. Look for "Add to Cart" buttons');
  console.log('5. Click "Add to Cart" to test cart functionality');

  // Step 5: Provide helper functions
  console.log('\n🔧 STEP 5: Helper Functions Available');
  console.log('Run these commands in console:');
  console.log('- wavelengthStoreDiagnostics() - Store status');
  console.log('- wavelengthCartDiagnostics() - Cart status');
  console.log('- wavelengthFullDiagnostics() - Complete system');

  // Step 6: Check for gallery images to select
  const galleryImages = document.querySelectorAll('.gallery-image-card');
  if (galleryImages.length > 0) {
    console.log(`\n🖼️ Found ${galleryImages.length} gallery images ready for selection`);
    console.log('Try clicking "Select" on one of them to start the product flow');
  } else {
    console.log('\n⚠️ No gallery images found - this may prevent product selection');
  }

  console.log('\n🌊 COMPREHENSIVE TEST COMPLETE');
  console.log('Cart functionality is ready for testing!');
})(); // End of IIFE