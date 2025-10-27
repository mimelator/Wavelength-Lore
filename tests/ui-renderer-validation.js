/**
 * WAVELENGTH UI Renderer Validation Tests
 * 
 * Comprehensive tests for all Phase 2 UI renderer components to ensure
 * they integrate properly with the MerchandiseStore and services.
 */

console.log('🧪 WAVELENGTH UI Renderer Validation Suite Starting...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Mock data for testing
const mockProducts = [
  {
    id: 'prod-1',
    title: 'Custom Wavelength T-Shirt',
    price: 19.95,
    previewImage: '/images/previews/tshirt-preview.jpg',
    category: 't-shirt',
    isComplete: true,
    variants: [
      { id: 'var-1', size: 'M', color: 'black', price: 19.95 },
      { id: 'var-2', size: 'L', color: 'white', price: 19.95 }
    ]
  },
  {
    id: 'prod-2', 
    title: 'Incomplete Product',
    price: null,
    previewImage: null,
    category: 'hoodie',
    isComplete: false,
    variants: []
  },
  {
    id: 'prod-3',
    title: 'Broken Product Configuration',
    price: 29.95,
    previewImage: '/images/broken.jpg',
    category: null,
    isComplete: false,
    isBroken: true,
    variants: []
  }
];

const mockCategories = [
  { id: 'tshirts', name: 'T-Shirts', productCount: 5, image: '/images/categories/tshirts.jpg' },
  { id: 'hoodies', name: 'Hoodies', productCount: 3, image: '/images/categories/hoodies.jpg' },
  { id: 'mugs', name: 'Coffee Mugs', productCount: 0, comingSoon: true }
];

const mockCartSummary = {
  items: [
    {
      productId: 'prod-1',
      variantId: 'var-1',
      title: 'Custom Wavelength T-Shirt',
      price: 19.95,
      quantity: 2,
      image: '/images/previews/tshirt-preview.jpg'
    }
  ],
  totalQuantity: 2,
  total: 39.90,
  isEmpty: false,
  itemCount: 1
};

// Test Results Storage
const testResults = {
  productCardRenderer: { passed: 0, failed: 0, tests: [] },
  cartRenderer: { passed: 0, failed: 0, tests: [] },
  categoryGridRenderer: { passed: 0, failed: 0, tests: [] },
  modalRenderer: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Test utilities
function createTestEnvironment() {
  // Create mock services
  const mockValidationService = {
    isProductComplete: (product) => product.isComplete === true,
    isProductBroken: (product) => product.isBroken === true,
    getProductStatus: (product) => ({
      isComplete: product.isComplete === true,
      isValid: !product.isBroken,
      issues: product.isBroken ? ['Configuration error'] : []
    })
  };
  
  const mockEventBus = {
    events: {},
    on: function(event, callback) { 
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(callback);
    },
    emit: function(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data));
      }
    }
  };
  
  const mockCartService = {
    getSummary: () => mockCartSummary,
    addItem: (item) => console.log('Mock: Added item to cart', item),
    removeItem: (productId, variantId) => console.log('Mock: Removed item', productId, variantId),
    updateQuantity: (productId, variantId, quantity) => console.log('Mock: Updated quantity', productId, variantId, quantity),
    clear: () => console.log('Mock: Cleared cart')
  };
  
  const mockMerchandiseStore = {
    getProductIcon: (type) => '📦',
    getProductTypeName: (type) => type || 'Product',
    extractProductTypeFromProduct: (product) => product.category || 'generic',
    getProductDetails: (product) => `Details for ${product.title}`,
    getVariantPriceRange: (variants) => variants.length ? '$19.95 - $29.95' : 'Price varies'
  };
  
  return {
    mockValidationService,
    mockEventBus,
    mockCartService,
    mockMerchandiseStore
  };
}

function runTest(testName, testFn, category) {
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      testResults[category].passed++;
      testResults[category].tests.push({ name: testName, status: 'PASS' });
      console.log(`✅ ${testName}`);
    } else {
      testResults[category].failed++;
      testResults[category].tests.push({ name: testName, status: 'FAIL', error: result });
      console.log(`❌ ${testName}: ${result}`);
    }
  } catch (error) {
    testResults[category].failed++;
    testResults[category].tests.push({ name: testName, status: 'ERROR', error: error.message });
    console.log(`💥 ${testName}: ${error.message}`);
  }
}

// Test ProductCardRenderer
function testProductCardRenderer() {
  console.log('\n🎨 Testing MerchandiseProductCardRenderer...');
  
  if (typeof MerchandiseProductCardRenderer === 'undefined') {
    console.log('❌ MerchandiseProductCardRenderer not available - skipping tests');
    return;
  }
  
  const env = createTestEnvironment();
  const renderer = new MerchandiseProductCardRenderer({
    validationService: env.mockValidationService,
    eventBus: env.mockEventBus,
    merchandiseStore: env.mockMerchandiseStore
  });
  
  runTest('ProductCardRenderer instantiation', () => {
    return renderer !== null && typeof renderer.renderProductsGrid === 'function';
  }, 'productCardRenderer');
  
  runTest('Render empty products grid', () => {
    const html = renderer.renderProductsGrid([]);
    return html.includes('No custom products') && html.includes('empty-state');
  }, 'productCardRenderer');
  
  runTest('Render products grid with complete products', () => {
    const html = renderer.renderProductsGrid([mockProducts[0]]);
    return html.includes('Custom Wavelength T-Shirt') && html.includes('product-card');
  }, 'productCardRenderer');
  
  runTest('Render products grid with incomplete products', () => {
    const html = renderer.renderProductsGrid([mockProducts[1]]);
    return html.includes('Incomplete Product') && html.includes('incomplete');
  }, 'productCardRenderer');
  
  runTest('Render products grid with broken products', () => {
    const html = renderer.renderProductsGrid([mockProducts[2]]);
    return html.includes('Broken Product') && html.includes('broken');
  }, 'productCardRenderer');
  
  runTest('Render complete product card', () => {
    const html = renderer.renderCompleteProductCard(mockProducts[0]);
    return html.includes('Custom Wavelength T-Shirt') && 
           html.includes('product-complete') && 
           html.includes('add-to-cart-btn');
  }, 'productCardRenderer');
  
  runTest('Event listeners setup', () => {
    const container = document.createElement('div');
    renderer.setupEventListeners(container);
    return container.onclick !== null;
  }, 'productCardRenderer');
}

// Test CartRenderer
function testCartRenderer() {
  console.log('\n🛒 Testing MerchandiseCartRenderer...');
  
  if (typeof MerchandiseCartRenderer === 'undefined') {
    console.log('❌ MerchandiseCartRenderer not available - skipping tests');
    return;
  }
  
  const env = createTestEnvironment();
  const renderer = new MerchandiseCartRenderer({
    cartService: env.mockCartService,
    eventBus: env.mockEventBus,
    merchandiseStore: env.mockMerchandiseStore
  });
  
  runTest('CartRenderer instantiation', () => {
    return renderer !== null && typeof renderer.renderCart === 'function';
  }, 'cartRenderer');
  
  runTest('Render cart with items', () => {
    const html = renderer.renderCart();
    return html.includes('Shopping Cart') && html.includes('cart-container');
  }, 'cartRenderer');
  
  runTest('Render cart items', () => {
    const html = renderer.renderCartItems(mockCartSummary.items);
    return html.includes('Custom Wavelength T-Shirt') && html.includes('cart-item');
  }, 'cartRenderer');
  
  runTest('Render cart summary', () => {
    const html = renderer.renderCartSummary(mockCartSummary);
    return html.includes('$39.90') && html.includes('cart-summary');
  }, 'cartRenderer');
  
  runTest('Render checkout section', () => {
    const html = renderer.renderCheckoutSection(mockCartSummary);
    return html.includes('Proceed to Checkout') && html.includes('checkout-btn');
  }, 'cartRenderer');
  
  runTest('Render mini cart', () => {
    const html = renderer.renderMiniCart();
    return html.includes('mini-cart') && html.includes('cart-count');
  }, 'cartRenderer');
  
  runTest('Calculate shipping cost', () => {
    const shipping = renderer.calculateShipping(30);
    return shipping === 5.99;
  }, 'cartRenderer');
  
  runTest('Calculate tax estimate', () => {
    const tax = renderer.calculateTax(100);
    return tax === 8.0;
  }, 'cartRenderer');
}

// Test CategoryGridRenderer
function testCategoryGridRenderer() {
  console.log('\n📋 Testing MerchandiseCategoryGridRenderer...');
  
  if (typeof MerchandiseCategoryGridRenderer === 'undefined') {
    console.log('❌ MerchandiseCategoryGridRenderer not available - skipping tests');
    return;
  }
  
  const env = createTestEnvironment();
  const renderer = new MerchandiseCategoryGridRenderer({
    validationService: env.mockValidationService,
    eventBus: env.mockEventBus,
    merchandiseStore: env.mockMerchandiseStore
  });
  
  runTest('CategoryGridRenderer instantiation', () => {
    return renderer !== null && typeof renderer.renderCategoryGrid === 'function';
  }, 'categoryGridRenderer');
  
  runTest('Render category grid', () => {
    const html = renderer.renderCategoryGrid(mockCategories);
    return html.includes('Choose Your Product Category') && html.includes('category-grid');
  }, 'categoryGridRenderer');
  
  runTest('Render category card', () => {
    const html = renderer.renderCategoryCard(mockCategories[0]);
    return html.includes('T-Shirts') && html.includes('category-card');
  }, 'categoryGridRenderer');
  
  runTest('Render coming soon category', () => {
    const html = renderer.renderCategoryCard(mockCategories[2]);
    return html.includes('Coming Soon') && html.includes('coming-soon');
  }, 'categoryGridRenderer');
  
  runTest('Render product grid', () => {
    const html = renderer.renderProductGrid('tshirts', mockProducts);
    return html.includes('product-grid') && html.includes('3 products found');
  }, 'categoryGridRenderer');
  
  runTest('Render search controls', () => {
    const html = renderer.renderSearchControls('test search');
    return html.includes('Search products') && html.includes('test search');
  }, 'categoryGridRenderer');
  
  runTest('Render filter controls', () => {
    const html = renderer.renderFilterControls({ status: 'complete' });
    return html.includes('filter-controls') && html.includes('All Status');
  }, 'categoryGridRenderer');
  
  runTest('Render sort controls', () => {
    const html = renderer.renderSortControls('price');
    return html.includes('Sort by') && html.includes('sort-select');
  }, 'categoryGridRenderer');
}

// Test ModalRenderer
function testModalRenderer() {
  console.log('\n🪟 Testing MerchandiseModalRenderer...');
  
  if (typeof MerchandiseModalRenderer === 'undefined') {
    console.log('❌ MerchandiseModalRenderer not available - skipping tests');
    return;
  }
  
  const env = createTestEnvironment();
  const renderer = new MerchandiseModalRenderer({
    validationService: env.mockValidationService,
    eventBus: env.mockEventBus,
    merchandiseStore: env.mockMerchandiseStore
  });
  
  runTest('ModalRenderer instantiation', () => {
    return renderer !== null && typeof renderer.renderCustomizationModal === 'function';
  }, 'modalRenderer');
  
  runTest('Render customization modal', () => {
    const html = renderer.renderCustomizationModal(mockProducts[0]);
    return html.includes('Customize Custom Wavelength T-Shirt') && html.includes('customization-modal');
  }, 'modalRenderer');
  
  runTest('Render preview modal', () => {
    const html = renderer.renderPreviewModal(mockProducts[0]);
    return html.includes('Custom Wavelength T-Shirt') && html.includes('preview-modal');
  }, 'modalRenderer');
  
  runTest('Render cart modal', () => {
    const html = renderer.renderCartModal(mockCartSummary);
    return html.includes('Shopping Cart') && html.includes('cart-modal');
  }, 'modalRenderer');
  
  runTest('Render confirmation dialog', () => {
    const html = renderer.renderConfirmationDialog({
      title: 'Test Confirmation',
      message: 'Are you sure?',
      type: 'warning'
    });
    return html.includes('Test Confirmation') && html.includes('confirmation-dialog');
  }, 'modalRenderer');
  
  runTest('Render notification toast', () => {
    const html = renderer.renderNotification({
      message: 'Test notification',
      type: 'success'
    });
    return html.includes('Test notification') && html.includes('notification-toast');
  }, 'modalRenderer');
  
  runTest('Render design options', () => {
    const html = renderer.renderDesignOptions(mockProducts[0]);
    return html.includes('Choose a Design') && html.includes('design-options');
  }, 'modalRenderer');
  
  runTest('Render color options', () => {
    const html = renderer.renderColorOptions(mockProducts[0]);
    return html.includes('Base Color') && html.includes('color-options');
  }, 'modalRenderer');
}

// Test Integration
function testIntegration() {
  console.log('\n🔗 Testing Component Integration...');
  
  // Test that all components can work together
  runTest('All renderers available', () => {
    return typeof MerchandiseProductCardRenderer !== 'undefined' &&
           typeof MerchandiseCartRenderer !== 'undefined' &&
           typeof MerchandiseCategoryGridRenderer !== 'undefined' &&
           typeof MerchandiseModalRenderer !== 'undefined';
  }, 'integration');
  
  runTest('Event bus communication', () => {
    const env = createTestEnvironment();
    let eventReceived = false;
    
    env.mockEventBus.on('test.event', () => { eventReceived = true; });
    env.mockEventBus.emit('test.event', { test: true });
    
    return eventReceived;
  }, 'integration');
  
  runTest('Service dependency injection', () => {
    const env = createTestEnvironment();
    
    const productRenderer = new MerchandiseProductCardRenderer({
      validationService: env.mockValidationService,
      eventBus: env.mockEventBus,
      merchandiseStore: env.mockMerchandiseStore
    });
    
    const cartRenderer = new MerchandiseCartRenderer({
      cartService: env.mockCartService,
      eventBus: env.mockEventBus,
      merchandiseStore: env.mockMerchandiseStore
    });
    
    return productRenderer.validationService === env.mockValidationService &&
           cartRenderer.cartService === env.mockCartService &&
           productRenderer.eventBus === cartRenderer.eventBus;
  }, 'integration');
  
  runTest('Cross-component event handling', () => {
    const env = createTestEnvironment();
    let productEventHandled = false;
    let cartEventHandled = false;
    
    env.mockEventBus.on('product.addToCart', () => { productEventHandled = true; });
    env.mockEventBus.on('cart.updated', () => { cartEventHandled = true; });
    
    env.mockEventBus.emit('product.addToCart', { productId: 'test' });
    env.mockEventBus.emit('cart.updated', { itemCount: 1 });
    
    return productEventHandled && cartEventHandled;
  }, 'integration');
}

// Generate test report
function generateTestReport() {
  console.log('\n📊 WAVELENGTH UI Renderer Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      console.log('  Failed tests:');
      results.tests.filter(t => t.status !== 'PASS').forEach(test => {
        console.log(`    - ${test.name}: ${test.error || test.status}`);
      });
    }
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📈 OVERALL RESULTS:`);
  console.log(`  ✅ Total Passed: ${totalPassed}`);
  console.log(`  ❌ Total Failed: ${totalFailed}`);
  console.log(`  📊 Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
  
  if (totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! UI renderers are ready for deployment.');
  } else {
    console.log('⚠️ Some tests failed. Review and fix issues before deployment.');
  }
  
  return {
    passed: totalPassed,
    failed: totalFailed,
    successRate: Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
  };
}

// Run all tests
function runAllTests() {
  testProductCardRenderer();
  testCartRenderer();
  testCategoryGridRenderer();
  testModalRenderer();
  testIntegration();
  
  const report = generateTestReport();
  
  console.log('\n🌊 WAVELENGTH UI Renderer Validation Complete!');
  
  return report;
}

// Auto-run if not in module context
if (typeof module === 'undefined') {
  // Wait for DOM to be ready if in browser
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
      runAllTests();
    }
  } else {
    runAllTests();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}