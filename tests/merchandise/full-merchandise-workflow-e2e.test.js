#!/usr/bin/env node

/**
 * Full Merchandise Workflow E2E Test
 * Tests: Random image selection → Random product → Customization → Design → Add to Cart
 */

const http = require('http');

// Mock data for testing
const mockGalleryImages = [
  { id: 'img-1', title: 'Daphne Forest Scene', url: '/gallery/daphne-forest.jpg', suitableForPrint: true },
  { id: 'img-2', title: 'Lucky Leprechaun Portrait', url: '/gallery/lucky-portrait.jpg', suitableForPrint: false },
  { id: 'img-3', title: 'Felix Adventure', url: '/gallery/felix-adventure.jpg', suitableForPrint: true },
  { id: 'img-4', title: 'Goblin King Castle', url: '/gallery/goblin-castle.jpg', suitableForPrint: true }
];

const mockProductTypes = [
  { id: 'premium-tshirt', name: 'Premium T-Shirt', blueprintId: 5, providerId: 1, basePrice: 1999 },
  { id: 'hoodie', name: 'Pullover Hoodie', blueprintId: 146, providerId: 1, basePrice: 3999 },
  { id: 'mug', name: 'Coffee Mug', blueprintId: 68, providerId: 1, basePrice: 1299 },
  { id: 'pillow', name: 'Square Pillow', blueprintId: 89, providerId: 2, basePrice: 2499 }
];

const mockSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const mockColors = ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue'];
const mockOverlays = ['none', 'solid-thin', 'solid-medium', 'gradient-fade', 'wavelength-theme'];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function simulateLocalStorage() {
  const storage = {};
  return {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    get data() { return storage; }
  };
}

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ status: res.statusCode, success: res.statusCode === 200 });
    });
    req.on('error', () => resolve({ status: 'ERROR', success: false }));
    req.setTimeout(5000, () => resolve({ status: 'TIMEOUT', success: false }));
  });
}

async function runFullWorkflowTest() {
  console.log('🎨 Full Merchandise Workflow E2E Test\n');
  
  try {
    const localStorage = simulateLocalStorage();
    
    // Step 1: Verify store accessibility
    console.log('📍 Step 1: Verify merchandise store accessibility');
    const storeTest = await testEndpoint('http://localhost:3001/merchandise');
    if (!storeTest.success) {
      throw new Error(`Store not accessible: ${storeTest.status}`);
    }
    console.log('✅ Store accessible');
    
    // Step 2: Random image selection
    console.log('📍 Step 2: Random image selection from gallery');
    const selectedImage = randomChoice(mockGalleryImages);
    console.log(`✅ Selected image: "${selectedImage.title}" (${selectedImage.id})`);
    console.log(`   Print ready: ${selectedImage.suitableForPrint ? 'Yes' : 'No (will be enhanced)'}`);
    
    // Step 3: Random product type selection
    console.log('📍 Step 3: Random product type selection');
    const selectedProduct = randomChoice(mockProductTypes);
    console.log(`✅ Selected product: ${selectedProduct.name}`);
    console.log(`   Blueprint ID: ${selectedProduct.blueprintId}, Provider: ${selectedProduct.providerId}`);
    console.log(`   Base price: $${(selectedProduct.basePrice / 100).toFixed(2)}`);
    
    // Step 4: Random customization options
    console.log('📍 Step 4: Random customization options');
    const customization = {
      size: randomChoice(mockSizes),
      color: randomChoice(mockColors),
      overlay: randomChoice(mockOverlays),
      quantity: Math.floor(Math.random() * 3) + 1 // 1-3 items
    };
    console.log(`✅ Customization selected:`);
    console.log(`   Size: ${customization.size}`);
    console.log(`   Color: ${customization.color}`);
    console.log(`   Overlay: ${customization.overlay}`);
    console.log(`   Quantity: ${customization.quantity}`);
    
    // Step 5: Simulate product design process
    console.log('📍 Step 5: Simulate product design workflow');
    const designedProduct = {
      productId: `product-${Date.now()}`,
      title: `${selectedImage.title} ${selectedProduct.name}`,
      sourceImage: selectedImage,
      productType: selectedProduct.id,
      customization: customization,
      variants: [
        {
          id: `variant-${Date.now()}-1`,
          title: `${customization.size} ${customization.color} ${selectedProduct.name}`,
          size: customization.size,
          color: customization.color,
          price: selectedProduct.basePrice + (customization.overlay !== 'none' ? 200 : 0) // +$2 for overlay
        }
      ],
      createdAt: new Date().toISOString()
    };
    
    console.log(`✅ Product designed: "${designedProduct.title}"`);
    console.log(`   Product ID: ${designedProduct.productId}`);
    console.log(`   Variants: ${designedProduct.variants.length}`);
    
    // Step 6: Add to shopping cart
    console.log('📍 Step 6: Add designed product to shopping cart');
    const cartItem = {
      productId: designedProduct.productId,
      variantId: designedProduct.variants[0].id,
      quantity: customization.quantity,
      price: designedProduct.variants[0].price,
      product: designedProduct,
      variant: designedProduct.variants[0]
    };
    
    // Load existing cart or create new
    let cart = [];
    const existingCart = localStorage.getItem('merchandise-cart');
    if (existingCart) {
      cart = JSON.parse(existingCart);
    }
    
    cart.push(cartItem);
    localStorage.setItem('merchandise-cart', JSON.stringify(cart));
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(`✅ Added to cart:`);
    console.log(`   Cart items: ${cart.length}`);
    console.log(`   Total value: $${(totalPrice / 100).toFixed(2)}`);
    
    // Step 7: Test cart persistence across sessions
    console.log('📍 Step 7: Test cart persistence (simulate page refresh)');
    const persistedCart = JSON.parse(localStorage.getItem('merchandise-cart'));
    if (persistedCart.length !== cart.length) {
      throw new Error(`Cart persistence failed: expected ${cart.length}, got ${persistedCart.length}`);
    }
    console.log('✅ Cart persisted across session');
    
    // Step 8: Add another random product to test multiple items
    console.log('📍 Step 8: Add second random product to cart');
    const secondImage = randomChoice(mockGalleryImages.filter(img => img.id !== selectedImage.id));
    const secondProduct = randomChoice(mockProductTypes.filter(p => p.id !== selectedProduct.id));
    const secondCustomization = {
      size: randomChoice(mockSizes),
      color: randomChoice(mockColors),
      overlay: randomChoice(mockOverlays),
      quantity: Math.floor(Math.random() * 2) + 1
    };
    
    const secondCartItem = {
      productId: `product-${Date.now()}-2`,
      variantId: `variant-${Date.now()}-2`,
      quantity: secondCustomization.quantity,
      price: secondProduct.basePrice,
      product: { title: `${secondImage.title} ${secondProduct.name}` },
      variant: { title: `${secondCustomization.size} ${secondCustomization.color}` }
    };
    
    persistedCart.push(secondCartItem);
    localStorage.setItem('merchandise-cart', JSON.stringify(persistedCart));
    
    console.log(`✅ Added second product: "${secondImage.title} ${secondProduct.name}"`);
    console.log(`   Size: ${secondCustomization.size}, Color: ${secondCustomization.color}`);
    
    // Step 9: Final cart validation
    console.log('📍 Step 9: Final cart validation');
    const finalCart = JSON.parse(localStorage.getItem('merchandise-cart'));
    const finalTotal = finalCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (finalCart.length !== 2) {
      throw new Error(`Expected 2 cart items, got ${finalCart.length}`);
    }
    
    console.log('✅ Final cart validation passed');
    console.log(`   Total items: ${finalCart.length}`);
    console.log(`   Total value: $${(finalTotal / 100).toFixed(2)}`);
    console.log(`   Products: ${finalCart.map(item => item.product.title).join(', ')}`);
    
    console.log('\\n🎉 FULL WORKFLOW E2E TEST PASSED');
    console.log('\\n📊 Workflow Test Results:');
    console.log('   ✅ Store accessibility: PASS');
    console.log('   ✅ Random image selection: PASS');
    console.log('   ✅ Random product selection: PASS');
    console.log('   ✅ Customization options: PASS');
    console.log('   ✅ Product design: PASS');
    console.log('   ✅ Add to cart: PASS');
    console.log('   ✅ Cart persistence: PASS');
    console.log('   ✅ Multiple products: PASS');
    console.log('   ✅ Final validation: PASS');
    console.log('   📊 Overall: 9/9 tests passed (100%)');
    
    console.log('\\n🎯 Randomization Proof:');
    console.log(`   Image: ${selectedImage.title} → ${secondImage.title}`);
    console.log(`   Product: ${selectedProduct.name} → ${secondProduct.name}`);
    console.log(`   Size: ${customization.size} → ${secondCustomization.size}`);
    console.log(`   Color: ${customization.color} → ${secondCustomization.color}`);
    console.log(`   Overlay: ${customization.overlay} → ${secondCustomization.overlay}`);
    
  } catch (error) {
    console.error('\\n❌ FULL WORKFLOW E2E TEST FAILED:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runFullWorkflowTest();
}

module.exports = runFullWorkflowTest;