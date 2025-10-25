/**
 * Validate Clean Products Script
 * Checks that no products remain in the merchandise store
 */

const firebaseAdminUtils = require('../helpers/firebase-admin-utils');

async function validateCleanProducts() {
  try {
    console.log('🔍 Validating merchandise store is clean...');
    
    // Initialize Firebase Admin
    const db = firebaseAdminUtils.getAdminDatabase();
    if (!db) {
      throw new Error('Failed to initialize Firebase Admin');
    }
    
    // Check for any remaining products
    const products = await firebaseAdminUtils.fetchDataAsAdmin('merchandise/products');
    
    if (!products) {
      console.log('✅ VALIDATION PASSED: No products found in database');
      console.log('🎉 Merchandise store is completely clean');
      return true;
    } else {
      const productCount = Object.keys(products).length;
      console.log(`❌ VALIDATION FAILED: Found ${productCount} remaining products`);
      console.log('🔍 Remaining products:');
      Object.entries(products).forEach(([id, product], index) => {
        console.log(`  ${index + 1}. ${product.title || 'Untitled'} (ID: ${id})`);
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error validating products:', error);
    return false;
  }
}

// Run the validation
if (require.main === module) {
  require('dotenv').config();
  
  validateCleanProducts()
    .then((isClean) => {
      if (isClean) {
        console.log('🎯 Validation completed: Store is clean for manual testing!');
        process.exit(0);
      } else {
        console.log('⚠️ Validation completed: Store still has products');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateCleanProducts };