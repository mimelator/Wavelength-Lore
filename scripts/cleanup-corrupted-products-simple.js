#!/usr/bin/env node

const { getUserProducts, deleteUserProduct } = require('../services/merchandise-database');

async function cleanupCorruptedProducts() {
  console.log('🔍 Scanning for corrupted products...');
  
  try {
    // Get all user products
    const products = await getUserProducts('cleanup-script');
    console.log(`📊 Found ${products.length} total products`);
    
    // Find corrupted products
    const corruptedProducts = products.filter(product => 
      !product.variants || product.variants.length === 0 || 
      !product.images || product.images.length === 0
    );
    
    console.log(`🚨 Found ${corruptedProducts.length} corrupted products`);
    
    if (corruptedProducts.length === 0) {
      console.log('✅ No corrupted products to clean up');
      return;
    }
    
    // Delete corrupted products
    for (const product of corruptedProducts) {
      console.log(`🗑️  Deleting corrupted product: ${product.id}`);
      await deleteUserProduct('cleanup-script', product.id);
    }
    
    console.log(`✅ Successfully deleted ${corruptedProducts.length} corrupted products`);
    
  } catch (error) {
    console.error('❌ Error cleaning up corrupted products:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupCorruptedProducts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}