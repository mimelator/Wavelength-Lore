/**
 * 🔍 WAVELENGTH CART UI INVESTIGATION SCRIPT
 * 
 * Use this in browser console on http://localhost:3001/merchandise-store
 * to investigate the current cart UI and functionality
 */

console.log('🌊 WAVELENGTH CART UI INVESTIGATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 1. Check if diagnostic functions are available
console.log('🔍 STEP 1: Checking diagnostic function availability...');
console.log('- wavelengthStoreDiagnostics:', typeof window.wavelengthStoreDiagnostics);
console.log('- wavelengthCartDiagnostics:', typeof window.wavelengthCartDiagnostics);
console.log('- wavelengthFullDiagnostics:', typeof window.wavelengthFullDiagnostics);

// 2. Check if store instance exists
console.log('\n🔍 STEP 2: Checking store instance...');
console.log('- window.merchandiseStore:', typeof window.merchandiseStore);

if (window.merchandiseStore) {
  console.log('- Store initialized:', window.merchandiseStore.isInitialized);
  console.log('- Current view:', window.merchandiseStore.currentView);
  console.log('- Cart service available:', !!window.merchandiseStore.cartService);
  console.log('- Cart renderer available:', !!window.merchandiseStore.cartRenderer);
}

// 3. Look for cart UI elements
console.log('\n🔍 STEP 3: Scanning for cart UI elements...');
const cartElements = {
  cartContainer: document.querySelector('.cart-container'),
  cartSummary: document.querySelector('.cart-summary'),
  cartItems: document.querySelector('.cart-items'),
  addToCartButtons: document.querySelectorAll('.add-to-cart-btn, [data-action="add-to-cart"]'),
  checkoutButton: document.querySelector('.checkout-btn'),
  cartBadge: document.querySelector('.cart-badge')
};

Object.entries(cartElements).forEach(([key, element]) => {
  if (key === 'addToCartButtons') {
    console.log(`- ${key}: ${element.length} found`);
  } else {
    console.log(`- ${key}: ${element ? 'Found' : 'Not found'}`);
  }
});

// 4. Check for product UI elements
console.log('\n🔍 STEP 4: Scanning for product UI elements...');
const productElements = {
  productCards: document.querySelectorAll('.product-card, .gallery-image-card'),
  productGrid: document.querySelector('.product-grid, .products-grid'),
  variantSelectors: document.querySelectorAll('.variant-selector, .size-selector, .color-selector'),
  galleryImages: document.querySelectorAll('.gallery-image-card')
};

Object.entries(productElements).forEach(([key, element]) => {
  if (key === 'productCards' || key === 'variantSelectors' || key === 'galleryImages') {
    console.log(`- ${key}: ${element.length} found`);
  } else {
    console.log(`- ${key}: ${element ? 'Found' : 'Not found'}`);
  }
});

// 5. Test diagnostic functions if available
if (typeof window.wavelengthFullDiagnostics === 'function') {
  console.log('\n🔍 STEP 5: Running full diagnostics...');
  try {
    const diagnostics = window.wavelengthFullDiagnostics();
    console.log('✅ Full diagnostics completed successfully');
  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
  }
} else {
  console.log('\n❌ STEP 5: Diagnostic functions not available yet');
  console.log('💡 Try refreshing the page and running this script again');
}

// 6. Summary and recommendations
console.log('\n🎯 INVESTIGATION SUMMARY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const hasCartUI = !!cartElements.cartContainer;
const hasAddToCartButtons = cartElements.addToCartButtons.length > 0;
const hasProducts = productElements.productCards.length > 0;
const hasGalleryImages = productElements.galleryImages.length > 0;

console.log(`Cart UI Present: ${hasCartUI ? '✅' : '❌'}`);
console.log(`Add to Cart Buttons: ${hasAddToCartButtons ? '✅' : '❌'} (${cartElements.addToCartButtons.length} found)`);
console.log(`Product Cards: ${hasProducts ? '✅' : '❌'} (${productElements.productCards.length} found)`);
console.log(`Gallery Images: ${hasGalleryImages ? '✅' : '❌'} (${productElements.galleryImages.length} found)`);

console.log('\n📋 NEXT STEPS:');
if (!hasCartUI) {
  console.log('• Cart UI not visible - check if cart renderer is working');
}
if (!hasAddToCartButtons) {
  console.log('• No add-to-cart buttons found - check product rendering');
}
if (!hasProducts && !hasGalleryImages) {
  console.log('• No products or gallery images - check API data loading');
}
if (hasGalleryImages && !hasProducts) {
  console.log('• Gallery images found but no products - try selecting an image');
}

console.log('\n🌊 WAVELENGTH CART UI INVESTIGATION COMPLETE');