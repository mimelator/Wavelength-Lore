/**
 * List all users with merchandise products
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');

async function listUsersWithMerchandise() {
  try {
    if (!isFirebaseAdminReady()) {
      console.log('🔥 Initializing Firebase Admin...');
      initializeFirebaseAdmin();
    }
    
    const db = getAdminDatabase();
    const userProductsRef = db.ref('merchandise/userProducts');
    const snapshot = await userProductsRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('❌ No merchandise data found in Firebase');
      return;
    }
    
    console.log('👥 Users with merchandise products:');
    console.log('═══════════════════════════════════');
    
    const users = [];
    snapshot.forEach(userSnapshot => {
      const userId = userSnapshot.key;
      const userProducts = [];
      
      userSnapshot.forEach(productSnapshot => {
        const product = productSnapshot.val();
        userProducts.push({
          productId: product.productId || product.id,
          title: product.title,
          productType: product.productType,
          blueprintId: product.blueprintId,
          hasVariants: !!(product.variants && product.variants.length > 0),
          variantCount: (product.variants || []).length
        });
      });
      
      users.push({ userId, products: userProducts });
    });
    
    users.forEach(user => {
      console.log(`\n🆔 User: ${user.userId}`);
      console.log(`📦 Products: ${user.products.length}`);
      
      user.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title || 'Untitled'}`);
        console.log(`      ID: ${product.productId}`);
        console.log(`      Type: ${product.productType || 'Not stored'}`);
        console.log(`      Blueprint: ${product.blueprintId || 'Not stored'}`);
        console.log(`      Variants: ${product.hasVariants ? product.variantCount : 'None'}`);
      });
    });
    
    if (users.length > 0) {
      console.log(`\n🎯 Found ${users.length} users with merchandise. Use:`);
      console.log(`node debug/merchandise-product-display-diagnostic.js ${users[0].userId}`);
    }
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

listUsersWithMerchandise();