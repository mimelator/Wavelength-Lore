const merchandiseDB = require('../../services/merchandise-database');

describe('Product Validation and Cleanup', () => {
    test('Validate and cleanup corrupted products for all users', async () => {
        console.log('🔍 Starting product validation and cleanup...');
        
        try {
            // Ensure database is initialized
            merchandiseDB.initializeDatabase();
            
            // Get all user products from all users by scanning the database
            const allProducts = [];
            
            // Get products from the global products reference
            const db = merchandiseDB.db;
            const productsSnapshot = await db.ref('merchandise/userProducts').once('value');
            
            productsSnapshot.forEach(userSnapshot => {
                const userId = userSnapshot.key;
                userSnapshot.forEach(productSnapshot => {
                    const product = productSnapshot.val();
                    allProducts.push({
                        ...product,
                        id: product.productId || productSnapshot.key,
                        userId: userId
                    });
                });
            });
            
            const products = allProducts;
            console.log(`📊 Found ${products.length} total products`);

            if (products.length === 0) {
                console.log('✅ No products found - nothing to validate');
                return;
            }

            // Identify corrupted products
            const corruptedProducts = products.filter(product => 
                !product.variants || product.variants.length === 0 || 
                !product.images || product.images.length === 0
            );

            console.log(`🚨 Found ${corruptedProducts.length} corrupted products`);

            if (corruptedProducts.length === 0) {
                console.log('✅ All products are valid');
                return;
            }

            // Log corrupted product details
            corruptedProducts.forEach((product, index) => {
                console.log(`   ${index + 1}. ID: ${product.id}`);
                console.log(`      Variants: ${product.variants?.length || 0}`);
                console.log(`      Images: ${product.images?.length || 0}`);
                console.log(`      Created: ${product.createdAt || 'unknown'}`);
            });

            // Cleanup corrupted products
            let cleanedCount = 0;
            for (const product of corruptedProducts) {
                try {
                    await merchandiseDB.deleteUserProduct(product.userId, product.id);
                    cleanedCount++;
                    console.log(`🗑️  Deleted corrupted product: ${product.id}`);
                } catch (error) {
                    console.log(`❌ Failed to delete product ${product.id}: ${error.message}`);
                }
            }

            console.log(`✅ Cleanup completed: ${cleanedCount}/${corruptedProducts.length} products deleted`);

            // Verify cleanup - scan again
            const remainingAllProducts = [];
            const verifySnapshot = await db.ref('merchandise/userProducts').once('value');
            
            verifySnapshot.forEach(userSnapshot => {
                userSnapshot.forEach(productSnapshot => {
                    const product = productSnapshot.val();
                    remainingAllProducts.push({
                        ...product,
                        id: product.productId || productSnapshot.key,
                        userId: userSnapshot.key
                    });
                });
            });
            
            const remainingProducts = remainingAllProducts;
            const stillCorrupted = remainingProducts.filter(product => 
                !product.variants || product.variants.length === 0 || 
                !product.images || product.images.length === 0
            );

            expect(stillCorrupted.length).toBe(0);
            console.log(`✅ Verification: ${remainingProducts.length} products remain, 0 corrupted`);

        } catch (error) {
            console.error('❌ Validation and cleanup failed:', error);
            throw error;
        }
    }, 60000);
});