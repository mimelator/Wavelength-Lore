#!/usr/bin/env node

const firebaseAdminUtils = require('../helpers/firebase-admin-utils');

let adminDb;

async function cleanupCorruptedProducts() {
  console.log('🔍 Scanning for corrupted products...');
  
  if (!adminDb) {
    adminDb = firebaseAdminUtils.initializeFirebaseAdmin();
  }
  
  const db = adminDb;
  
  try {
    const snapshot = await db.collection('userProducts').get();
    const corruptedProducts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const isCorrupted = !data.variants || data.variants.length === 0 || 
                         !data.images || data.images.length === 0;
      
      if (isCorrupted) {
        corruptedProducts.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`📊 Found ${corruptedProducts.length} corrupted products`);
    
    if (corruptedProducts.length === 0) {
      console.log('✅ No corrupted products to clean up');
      return;
    }
    
    // Delete corrupted products
    const batch = db.batch();
    corruptedProducts.forEach(product => {
      console.log(`🗑️  Deleting product: ${product.id}`);
      batch.delete(db.collection('userProducts').doc(product.id));
    });
    
    await batch.commit();
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

module.exports = { cleanupCorruptedProducts };