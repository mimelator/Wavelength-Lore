/**
 * Delete All User Merchandise Products
 * 
 * Safely removes all merchandise products for a specific user
 * from both Firebase and Printify (if needed)
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');

class UserProductCleaner {
  constructor() {
    this.db = null;
    this.deleted = {
      firebase: 0,
      printify: 0,
      errors: []
    };
  }

  async initialize() {
    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin...');
        initializeFirebaseAdmin();
      }
      
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      console.log('✅ Product cleaner initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize product cleaner:', error);
      return false;
    }
  }

  async deleteAllUserProducts(userId) {
    console.log('🗑️ DELETING ALL MERCHANDISE PRODUCTS FOR USER');
    console.log('═══════════════════════════════════════════════');
    console.log(`🎯 Target User ID: ${userId}`);
    
    try {
      // Step 1: Get all user products from Firebase
      console.log('\n📋 Step 1: Fetching user products from Firebase...');
      const userProductsRef = this.db.ref(`merchandise/userProducts/${userId}`);
      const snapshot = await userProductsRef.once('value');
      
      if (!snapshot.exists()) {
        console.log('✅ No products found for user - nothing to delete');
        return { success: true, deleted: this.deleted };
      }

      const products = [];
      snapshot.forEach(productSnapshot => {
        const product = productSnapshot.val();
        products.push({
          firebaseKey: productSnapshot.key,
          productId: product.productId || product.id,
          title: product.title,
          ...product
        });
      });

      console.log(`📦 Found ${products.length} products to delete`);

      // Step 2: Delete from Firebase user products
      console.log('\n🔥 Step 2: Deleting from Firebase user products...');
      for (const product of products) {
        try {
          console.log(`   🗑️ Deleting: ${product.title} (${product.productId})`);
          
          // Delete from user-specific products
          await this.db.ref(`merchandise/userProducts/${userId}/${product.firebaseKey}`).remove();
          
          // Delete from global products index if it exists
          const globalKey = `${userId}_${product.productId}`;
          await this.db.ref(`merchandise/products/${globalKey}`).remove();
          
          this.deleted.firebase++;
          console.log(`     ✅ Deleted from Firebase`);
          
        } catch (error) {
          console.error(`     ❌ Error deleting ${product.productId}:`, error.message);
          this.deleted.errors.push({
            productId: product.productId,
            title: product.title,
            error: error.message,
            step: 'firebase_deletion'
          });
        }
      }

      // Step 3: Optional Printify cleanup (commented out for safety)
      console.log('\n📝 Step 3: Printify cleanup (skipped for safety)');
      console.log('   ℹ️  Products remain in Printify - delete manually if needed');
      console.log('   ℹ️  This prevents accidental loss of Printify product designs');

      // Step 4: Verification
      console.log('\n✅ Step 4: Verification...');
      const verifySnapshot = await userProductsRef.once('value');
      const remainingProducts = verifySnapshot.exists() ? Object.keys(verifySnapshot.val()).length : 0;
      
      console.log(`   Remaining products in Firebase: ${remainingProducts}`);
      
      return {
        success: true,
        deleted: this.deleted,
        originalCount: products.length,
        remainingCount: remainingProducts
      };

    } catch (error) {
      console.error('❌ Error during product deletion:', error);
      this.deleted.errors.push({
        error: error.message,
        step: 'general_deletion'
      });
      
      return {
        success: false,
        deleted: this.deleted,
        error: error.message
      };
    }
  }

  printSummary(result) {
    console.log('\n📊 DELETION SUMMARY');
    console.log('═══════════════════');
    console.log(`🔥 Firebase deletions: ${result.deleted.firebase}`);
    console.log(`📦 Original count: ${result.originalCount || 0}`);
    console.log(`📋 Remaining count: ${result.remainingCount || 0}`);
    console.log(`❌ Errors: ${result.deleted.errors.length}`);
    
    if (result.deleted.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      result.deleted.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.productId || 'Unknown'}: ${error.error}`);
      });
    }
    
    if (result.success && result.remainingCount === 0) {
      console.log('\n✅ ALL PRODUCTS SUCCESSFULLY DELETED');
    } else if (result.success && result.remainingCount > 0) {
      console.log('\n⚠️ SOME PRODUCTS MAY REMAIN (check errors above)');
    } else {
      console.log('\n❌ DELETION FAILED - CHECK ERRORS ABOVE');
    }
  }
}

// Main execution function
async function deleteUserProducts() {
  const cleaner = new UserProductCleaner();
  
  if (!(await cleaner.initialize())) {
    console.error('❌ Failed to initialize cleaner');
    process.exit(1);
  }
  
  // Get user ID from command line or use default authenticated user
  const userId = process.argv[2] || '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
  
  console.log(`🎯 Deleting products for user: ${userId}`);
  console.log('⚠️  WARNING: This will permanently delete all merchandise products!');
  console.log('📋 Press Ctrl+C within 5 seconds to cancel...');
  
  // 5 second delay for safety
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await cleaner.deleteAllUserProducts(userId);
  cleaner.printSummary(result);
  
  if (result.success) {
    console.log('\n🎉 Product deletion completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Product deletion failed!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deleteUserProducts().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { UserProductCleaner };