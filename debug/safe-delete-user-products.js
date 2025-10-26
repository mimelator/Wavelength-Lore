/**
 * SAFE User Product Deletion - Firebase Only
 * 
 * Safely removes merchandise products from Firebase while leaving
 * Printify products intact (since no delete API method exists)
 * 
 * This approach prevents data integrity issues and matches current system behavior
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');

class SafeUserProductCleaner {
  constructor() {
    this.db = null;
    this.deleted = {
      firebase: 0,
      skippedPrintify: 0,
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
      
      console.log('✅ Safe product cleaner initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize product cleaner:', error);
      return false;
    }
  }

  async safeDeleteUserProducts(userId) {
    console.log('🛡️ SAFE FIREBASE-ONLY PRODUCT DELETION');
    console.log('═══════════════════════════════════════');
    console.log(`🎯 Target User ID: ${userId}`);
    console.log('');
    console.log('🔍 UNDERSTANDING THE API DEPENDENCIES:');
    console.log('   ✅ Firebase: Stores user associations + metadata');
    console.log('   ✅ Printify: Owns actual products + fulfillment');
    console.log('   ⚠️  Current system: No Printify delete API method exists');
    console.log('   🛡️ Safe approach: Delete Firebase only (matches current route behavior)');
    
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
          printifyProductId: product.productId, // This stays in Printify
          ...product
        });
      });

      console.log(`📦 Found ${products.length} products to delete from Firebase`);

      // Step 2: Display what will happen
      console.log('\n📋 Step 2: Understanding deletion impact...');
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. "${product.title}"`);
        console.log(`      Firebase: Will be deleted ✅`);
        console.log(`      Printify ID ${product.printifyProductId}: Will remain active ⚠️`);
      });

      console.log('\n⚠️  IMPORTANT: Printify products will remain active but untracked');
      console.log('   - Products can still be ordered through Printify directly'); 
      console.log('   - No billing/fulfillment impact');
      console.log('   - Manual Printify cleanup needed if desired');

      // Step 3: Delete from Firebase only (safe operation)
      console.log('\n🔥 Step 3: Deleting from Firebase (user associations)...');
      for (const product of products) {
        try {
          console.log(`   🗑️ Deleting: ${product.title} (${product.productId})`);
          
          // Delete from user-specific products
          await this.db.ref(`merchandise/userProducts/${userId}/${product.firebaseKey}`).remove();
          
          // Delete from global products index if it exists
          const globalKey = `${userId}_${product.productId}`;
          await this.db.ref(`merchandise/products/${globalKey}`).remove();
          
          this.deleted.firebase++;
          this.deleted.skippedPrintify++;
          console.log(`     ✅ Deleted from Firebase`);
          console.log(`     📋 Printify product ${product.printifyProductId} remains active`);
          
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

      // Step 4: Verification
      console.log('\n✅ Step 4: Verification...');
      const verifySnapshot = await userProductsRef.once('value');
      const remainingProducts = verifySnapshot.exists() ? Object.keys(verifySnapshot.val()).length : 0;
      
      console.log(`   Firebase products deleted: ${this.deleted.firebase}`);
      console.log(`   Firebase products remaining: ${remainingProducts}`);
      console.log(`   Printify products skipped: ${this.deleted.skippedPrintify}`);
      
      return {
        success: true,
        deleted: this.deleted,
        originalCount: products.length,
        remainingCount: remainingProducts,
        printifyProductsOrphaned: products.map(p => ({
          id: p.printifyProductId,
          title: p.title
        }))
      };

    } catch (error) {
      console.error('❌ Error during safe product deletion:', error);
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
    console.log('\n📊 SAFE DELETION SUMMARY');
    console.log('═══════════════════════════');
    console.log(`🔥 Firebase deletions: ${result.deleted.firebase}`);
    console.log(`📦 Original count: ${result.originalCount || 0}`);
    console.log(`📋 Remaining count: ${result.remainingCount || 0}`);
    console.log(`⚠️  Printify products orphaned: ${result.deleted.skippedPrintify}`);
    console.log(`❌ Errors: ${result.deleted.errors.length}`);
    
    if (result.printifyProductsOrphaned && result.printifyProductsOrphaned.length > 0) {
      console.log('\n📋 ORPHANED PRINTIFY PRODUCTS:');
      result.printifyProductsOrphaned.forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id} - "${product.title}"`);
      });
      console.log('   ℹ️  These products remain active in Printify but untracked in Firebase');
      console.log('   ℹ️  Manual cleanup via Printify dashboard if desired');
    }
    
    if (result.deleted.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      result.deleted.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.productId || 'Unknown'}: ${error.error}`);
      });
    }
    
    if (result.success && result.remainingCount === 0) {
      console.log('\n✅ ALL FIREBASE ASSOCIATIONS SUCCESSFULLY DELETED');
      console.log('🛡️ Safe deletion complete - no data integrity issues');
    } else if (result.success && result.remainingCount > 0) {
      console.log('\n⚠️ SOME FIREBASE RECORDS MAY REMAIN (check errors above)');
    } else {
      console.log('\n❌ DELETION FAILED - CHECK ERRORS ABOVE');
    }
  }
}

// Main execution function
async function safeDeleteUserProducts() {
  const cleaner = new SafeUserProductCleaner();
  
  if (!(await cleaner.initialize())) {
    console.error('❌ Failed to initialize cleaner');
    process.exit(1);
  }
  
  // Get user ID
  const userId = process.argv[2] || '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
  
  console.log(`🎯 Safe deletion for user: ${userId}`);
  console.log('🛡️ This will only delete Firebase associations (safe operation)');
  console.log('⚠️  Printify products will remain active but untracked');
  console.log('📋 Press Ctrl+C within 3 seconds to cancel...');
  
  // 3 second delay for safety (shorter since it's safer)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const result = await cleaner.safeDeleteUserProducts(userId);
  cleaner.printSummary(result);
  
  if (result.success) {
    console.log('\n🎉 Safe Firebase deletion completed successfully!');
    console.log('🔄 User can now create fresh products without conflicts');
    process.exit(0);
  } else {
    console.log('\n💥 Safe deletion failed!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  safeDeleteUserProducts().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { SafeUserProductCleaner };