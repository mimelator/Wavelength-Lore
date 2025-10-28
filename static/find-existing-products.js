// Find existing products and their add-to-cart buttons
// Run this in browser console on http://localhost:3001/merchandise

console.log('🛍️ EXISTING PRODUCTS & CART WORKFLOW');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Find existing product cards
const productCards = document.querySelectorAll('.product-card, .product-item, .gallery-image-card');
console.log(`📦 Found ${productCards.length} product cards on page`);

if (productCards.length > 0) {
  console.log('\n🎯 EXISTING PRODUCTS:');
  
  productCards.forEach((card, i) => {
    // Extract product info from card
    const title = card.querySelector('h3, h4, .product-title, .title')?.textContent?.trim();
    const image = card.querySelector('img');
    const addToCartBtn = card.querySelector('.add-to-cart-btn, [data-action="add-to-cart"]');
    const variantSelectors = card.querySelectorAll('.variant-selector, .size-selector, .color-selector, select');
    const productId = card.getAttribute('data-product-id') || card.getAttribute('data-id');
    
    console.log(`\n${i + 1}. ${title || 'Untitled Product'}`);
    console.log(`   Product ID: ${productId || 'Not found'}`);
    console.log(`   Image: ${image ? '✅' : '❌'}`);
    console.log(`   Add to Cart button: ${addToCartBtn ? '✅' : '❌'}`);
    console.log(`   Variant selectors: ${variantSelectors.length}`);
    
    if (variantSelectors.length > 0) {
      variantSelectors.forEach((selector, j) => {
        console.log(`     - Selector ${j + 1}: ${selector.tagName} (${selector.options ? selector.options.length + ' options' : 'custom'})`);
      });
    }
    
    // Check if this is the Celestial Tote Bag
    if (title && title.toLowerCase().includes('celestial') && title.toLowerCase().includes('tote')) {
      console.log('   🎒 ⭐ THIS IS YOUR CELESTIAL TOTE BAG!');
      
      if (addToCartBtn) {
        console.log(`   🛒 To add to cart: Click the add-to-cart button on this product`);
        if (variantSelectors.length > 0) {
          console.log(`   🎯 First select variants, then click add-to-cart`);
        }
      } else {
        console.log(`   ⚠️ No add-to-cart button found - check product structure`);
      }
    }
  });
}

// Check for standalone add-to-cart buttons
const allAddToCartBtns = document.querySelectorAll('.add-to-cart-btn, [data-action="add-to-cart"]');
console.log(`\n🛒 Total add-to-cart buttons found: ${allAddToCartBtns.length}`);

if (allAddToCartBtns.length > 0) {
  console.log('\n🎯 ADD-TO-CART BUTTONS:');
  allAddToCartBtns.forEach((btn, i) => {
    const parentCard = btn.closest('.product-card, .product-item');
    const productId = btn.getAttribute('data-product-id') || 
                     btn.getAttribute('data-id') ||
                     (parentCard ? parentCard.getAttribute('data-product-id') : null);
    
    console.log(`${i + 1}. Button - Product ID: ${productId || 'unknown'}`);
    console.log(`   Text: "${btn.textContent?.trim()}"`);
    console.log(`   Enabled: ${!btn.disabled}`);
  });
}

// Look for variant selectors across the page
const allVariantSelectors = document.querySelectorAll('.variant-selector, .size-selector, .color-selector, select[name*="variant"], select[name*="size"], select[name*="color"]');
console.log(`\n🎨 Variant selectors found: ${allVariantSelectors.length}`);

if (allVariantSelectors.length > 0) {
  allVariantSelectors.forEach((selector, i) => {
    console.log(`${i + 1}. ${selector.tagName} - Name: ${selector.name || 'unnamed'}`);
    if (selector.options) {
      console.log(`   Options: ${Array.from(selector.options).map(opt => opt.textContent).join(', ')}`);
    }
  });
}

console.log('\n🎯 WORKFLOW TO ADD CELESTIAL TOTE BAG:');
console.log('1. Find the Celestial Tote Bag product card above');
console.log('2. Select any required variants (size, color, etc.)');
console.log('3. Click the "Add to Cart" button');
console.log('4. Check cart updates with: wavelengthCartDiagnostics()');

// Test if we can access the store's products directly
if (window.merchandiseStore && window.merchandiseStore.products) {
  console.log('\n📋 STORE PRODUCTS DATA:');
  window.merchandiseStore.products.forEach((product, i) => {
    console.log(`${i + 1}. ${product.title} (ID: ${product.id})`);
    if (product.title && product.title.toLowerCase().includes('celestial')) {
      console.log('   ⭐ CELESTIAL PRODUCT FOUND IN STORE DATA');
    }
  });
}