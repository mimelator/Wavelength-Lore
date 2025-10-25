/**
 * Simple Merchandise Store Diagnostic Test
 * 
 * This script tests the basic functionality of the merchandise store
 * to identify what's broken.
 */

console.log('🔧 Starting Merchandise Store Diagnostic Test');

// Test 1: Check if the container exists
const container = document.getElementById('merchandise-store');
console.log('📦 Container exists:', !!container);
if (container) {
  console.log('📦 Container innerHTML length:', container.innerHTML.length);
  console.log('📦 Container classes:', container.className);
}

// Test 2: Check if MerchandiseStore class is available
console.log('🏪 MerchandiseStore class available:', typeof MerchandiseStore);

// Test 3: Try to create an instance
try {
  console.log('🔧 Attempting to create MerchandiseStore instance...');
  const testStore = new MerchandiseStore();
  console.log('✅ MerchandiseStore instance created successfully');
  
  // Test 4: Check initial properties
  console.log('🔍 Initial properties:');
  console.log('  - selectedImage:', testStore.selectedImage);
  console.log('  - cart:', testStore.cart);
  console.log('  - products:', testStore.products);
  console.log('  - productTypes:', testStore.productTypes);
  console.log('  - galleryImages:', testStore.galleryImages);
  
  // Test 5: Try to call loadProductTypes directly
  console.log('🔧 Testing loadProductTypes...');
  testStore.loadProductTypes().then(() => {
    console.log('✅ loadProductTypes completed');
    console.log('📋 Product types loaded:', Object.keys(testStore.productTypes || {}).length);
    console.log('📋 Product types data:', testStore.productTypes);
  }).catch(error => {
    console.error('❌ loadProductTypes failed:', error);
  });
  
} catch (error) {
  console.error('❌ Failed to create MerchandiseStore instance:', error);
  console.error('❌ Error stack:', error.stack);
}

// Test 6: Check API endpoints directly
console.log('🌐 Testing API endpoints...');

// Test product types endpoint
fetch('/api/merchandise/product-types')
  .then(response => {
    console.log('🌐 Product types API response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🌐 Product types API data:', data);
  })
  .catch(error => {
    console.error('❌ Product types API failed:', error);
  });

// Test gallery images endpoint
fetch('/api/merchandise/gallery-images', {
  headers: {
    'Authorization': 'Bearer dev-bypass'
  }
})
  .then(response => {
    console.log('🌐 Gallery images API response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('🌐 Gallery images API data:', data);
  })
  .catch(error => {
    console.error('❌ Gallery images API failed:', error);
  });

console.log('🔧 Diagnostic test setup complete. Check console for results.');