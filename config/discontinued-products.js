/**
 * Discontinued Products Management
 * 
 * Since Printify has no API to detect discontinued products and only notifies via email,
 * this system provides manual management tools for handling discontinued products.
 */

// Manually maintained list of discontinued products
// Update this when you receive Printify email notifications
const discontinuedProducts = new Set([
  // Add product IDs as they become discontinued
  // Example format: 'validated-413', 'validated-238', etc.
  'validated-15', // Men's Very Important Tee - District DT6000 discontinued (Nov 1, 2025)
]);

// Products with known issues or manual disabling
const manuallyDisabledProducts = new Set([
  // Add product IDs to manually disable
  // Example: 'validated-1234'
]);

// 🔍 STARTUP DIAGNOSTICS: Log discontinued products when module loads
console.log('\n🚨 DISCONTINUED PRODUCTS MODULE LOADED:');
console.log('=' .repeat(50));
console.log(`📋 Discontinued products configured: ${discontinuedProducts.size}`);
console.log(`📋 Manually disabled products configured: ${manuallyDisabledProducts.size}`);
if (discontinuedProducts.size > 0) {
  console.log('❌ DISCONTINUED PRODUCTS:');
  Array.from(discontinuedProducts).forEach(id => {
    console.log(`   - ${id}`);
  });
}
if (manuallyDisabledProducts.size > 0) {
  console.log('🚫 MANUALLY DISABLED PRODUCTS:');
  Array.from(manuallyDisabledProducts).forEach(id => {
    console.log(`   - ${id}`);
  });
}
console.log('🎯 Module ready for filtering operations');
console.log('=' .repeat(50));

/**
 * Check if a product should be filtered out
 * @param {string} productId - Product ID to check
 * @returns {boolean} True if product should be hidden
 */
function isProductDisabled(productId) {
  return discontinuedProducts.has(productId) || 
         manuallyDisabledProducts.has(productId);
}

/**
 * Get the reason why a product is disabled
 * @param {string} productId - Product ID to check
 * @returns {string|null} Reason for disabling or null if not disabled
 */
function getDisabledReason(productId) {
  if (discontinuedProducts.has(productId)) {
    return 'Product discontinued by Printify';
  }
  if (manuallyDisabledProducts.has(productId)) {
    return 'Manually disabled by admin';
  }
  return null;
}

/**
 * Add a product to the discontinued list
 * @param {string} productId - Product ID to discontinue
 * @param {string} reason - Reason for discontinuation
 */
function markProductDiscontinued(productId, reason = 'Discontinued by Printify') {
  discontinuedProducts.add(productId);
  console.log(`📋 Product ${productId} marked as discontinued: ${reason}`);
}

/**
 * Manually disable a product
 * @param {string} productId - Product ID to disable
 * @param {string} reason - Reason for disabling
 */
function disableProduct(productId, reason = 'Manually disabled') {
  manuallyDisabledProducts.add(productId);
  console.log(`🚫 Product ${productId} manually disabled: ${reason}`);
}

/**
 * Re-enable a product
 * @param {string} productId - Product ID to re-enable
 */
function enableProduct(productId) {
  const wasDiscontinued = discontinuedProducts.has(productId);
  const wasDisabled = manuallyDisabledProducts.has(productId);
  
  discontinuedProducts.delete(productId);
  manuallyDisabledProducts.delete(productId);
  
  if (wasDiscontinued || wasDisabled) {
    console.log(`✅ Product ${productId} re-enabled`);
  }
}

/**
 * Filter products to remove discontinued/disabled ones
 * @param {Array} products - Array of product objects
 * @returns {Array} Filtered products array
 */
function filterAvailableProducts(products) {
  return products.filter(product => {
    if (isProductDisabled(product.id)) {
      console.log(`🚫 Filtering out disabled product: ${product.id} - ${getDisabledReason(product.id)}`);
      return false;
    }
    return true;
  });
}

/**
 * Get statistics about disabled products
 * @returns {Object} Statistics object
 */
function getDisabledProductStats() {
  return {
    discontinued: discontinuedProducts.size,
    manuallyDisabled: manuallyDisabledProducts.size,
    total: discontinuedProducts.size + manuallyDisabledProducts.size,
    discontinuedList: Array.from(discontinuedProducts),
    manuallyDisabledList: Array.from(manuallyDisabledProducts)
  };
}

/**
 * Test the filtering system with current product catalog
 * @param {Array} products - Array of product objects to test filtering on
 * @returns {Object} Detailed filtering results
 */
function testFiltering(products) {
  console.log('\n🧪 TESTING PRODUCT FILTERING:');
  console.log('=' .repeat(40));
  
  if (!products) {
    console.log('⚠️  No products provided - this function needs to be called with a product array');
    console.log('💡 Use this from the API route or provide product data');
    return { error: 'No products provided' };
  }
  
  const originalCount = products.length;
  const filteredProducts = filterAvailableProducts(products);
  const filteredCount = filteredProducts.length;
  const removedCount = originalCount - filteredCount;
  
  console.log(`📋 Original products: ${originalCount}`);
  console.log(`✅ After filtering: ${filteredCount}`);
  console.log(`❌ Filtered out: ${removedCount}`);
  
  if (removedCount > 0) {
    const removedProducts = products.filter(p => !filteredProducts.some(fp => fp.id === p.id));
    console.log('\n🚫 REMOVED PRODUCTS:');
    removedProducts.forEach(product => {
      const reason = getDisabledReason(product.id);
      console.log(`   - ${product.id}: ${product.name} (${reason})`);
    });
  }
  
  console.log('\n' + '='.repeat(40));
  return {
    original: originalCount,
    filtered: filteredCount,
    removed: removedCount,
    removedProducts: products.filter(p => !filteredProducts.some(fp => fp.id === p.id))
  };
}

module.exports = {
  isProductDisabled,
  getDisabledReason,
  markProductDiscontinued,
  disableProduct,
  enableProduct,
  filterAvailableProducts,
  getDisabledProductStats,
  testFiltering
};