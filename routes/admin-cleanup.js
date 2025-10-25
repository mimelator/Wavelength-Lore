const express = require('express');
const router = express.Router();
const { getUserProducts, deleteUserProduct } = require('../services/merchandise-database');

// Admin cleanup endpoint
router.post('/cleanup-corrupted-products', async (req, res) => {
  try {
    console.log('🔍 Admin cleanup: Scanning for corrupted products...');
    
    // Get all user products (using admin user ID)
    const products = await getUserProducts('admin-cleanup');
    console.log(`📊 Found ${products.length} total products`);
    
    // Find corrupted products
    const corruptedProducts = products.filter(product => 
      !product.variants || product.variants.length === 0 || 
      !product.images || product.images.length === 0
    );
    
    console.log(`🚨 Found ${corruptedProducts.length} corrupted products`);
    
    if (corruptedProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No corrupted products found',
        deleted: 0
      });
    }
    
    // Delete corrupted products
    const deletedIds = [];
    for (const product of corruptedProducts) {
      console.log(`🗑️  Deleting corrupted product: ${product.id}`);
      await deleteUserProduct('admin-cleanup', product.id);
      deletedIds.push(product.id);
    }
    
    console.log(`✅ Successfully deleted ${corruptedProducts.length} corrupted products`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${corruptedProducts.length} corrupted products`,
      deleted: corruptedProducts.length,
      deletedIds: deletedIds
    });
    
  } catch (error) {
    console.error('❌ Error in admin cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;