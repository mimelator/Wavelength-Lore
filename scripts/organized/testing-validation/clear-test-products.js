/**
 * Clear Test Products Script
 * Deletes all products from the merchandise store for clean testing
 */

const merchandiseDB = require('../services/merchandise-database');

async function clearAllProducts() {
  try {
    console.log('🧹 Starting to clear all test products...');
    
    const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2'; // Test user ID from API response
    
    // Get all user products using the existing service
    const products = await merchandiseDB.getUserProducts(userId);
    
    if (!products || products.length === 0) {
      console.log('✅ No products found - database is already clean');
      return;
    }
    
    console.log(`📦 Found ${products.length} products to delete from user ${userId}`);
    
    // Delete each product using the existing deleteUserProduct method
    let successCount = 0;
    let failCount = 0;
    
    for (const product of products) {
      const productId = product.productId || product.localId;
      console.log(`🗑️ Deleting product: ${product.title || productId}`);
      
      const result = await merchandiseDB.deleteUserProduct(userId, productId);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`❌ Failed to delete product ${productId}: ${result.error}`);
      }
    }
    
    console.log(`✅ Successfully deleted ${successCount} products`);
    if (failCount > 0) {
      console.log(`⚠️ Failed to delete ${failCount} products`);
    }
    console.log('🎉 Merchandise store cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  clearAllProducts()
    .then(() => {
      console.log('🎯 Product cleanup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Product cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAllProducts };