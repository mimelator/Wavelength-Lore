/**
 * Delete Remaining Products Script
 * Deletes all remaining vendor preview products before testing
 */

const axios = require('axios');

class RemainingProductsDeleter {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.deletedProducts = [];
        this.deletionErrors = [];
    }

    async deleteAllRemainingProducts() {
        console.log('🗑️ DELETING ALL REMAINING PRODUCTS\n');
        
        try {
            // Get all remaining products
            const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
            if (!response.data || !response.data.success) {
                throw new Error('Failed to fetch products');
            }
            
            const products = response.data.previews;
            console.log(`📦 Found ${products.length} products to delete\n`);
            
            if (products.length === 0) {
                console.log('✅ No products to delete - database is already clean');
                return true;
            }
            
            // Delete each product
            for (const product of products) {
                await this.deleteProduct(product);
            }
            
            // Verify cleanup
            await this.verifyCleanup();
            
            // Generate report
            this.generateReport();
            
            return this.deletionErrors.length === 0;
            
        } catch (error) {
            console.error('❌ Failed to delete remaining products:', error);
            return false;
        }
    }

    async deleteProduct(product) {
        try {
            console.log(`🗑️ Deleting: ${product.productId} (${product.title})`);
            
            const deleteResponse = await axios.delete(
                `${this.baseUrl}/admin/vendor-research/delete-preview`,
                {
                    data: { cacheKey: product.productId },
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (deleteResponse.status === 200 && deleteResponse.data.success) {
                this.deletedProducts.push(product);
                console.log(`   ✅ Successfully deleted: ${product.productId}`);
            } else {
                throw new Error(`HTTP ${deleteResponse.status}: ${JSON.stringify(deleteResponse.data)}`);
            }
            
            // Small delay between deletions
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.log(`   ❌ Failed to delete ${product.productId}: ${error.message}`);
            this.deletionErrors.push({
                product,
                error: error.message
            });
        }
    }

    async verifyCleanup() {
        console.log('\n🔍 Verifying cleanup...');
        
        const response = await axios.get(`${this.baseUrl}/api/merchandise/vendor-previews`);
        const remainingProducts = response.data.previews || [];
        
        console.log(`📦 Products remaining: ${remainingProducts.length}`);
        
        if (remainingProducts.length === 0) {
            console.log('✅ All products successfully deleted');
        } else {
            console.log('⚠️  Some products still remain:');
            remainingProducts.forEach(p => {
                console.log(`   - ${p.productId} (${p.title})`);
            });
        }
    }

    generateReport() {
        console.log('\n📋 DELETION REPORT');
        console.log('======================================================================');
        console.log(`📊 STATISTICS:`);
        console.log(`   Products deleted: ${this.deletedProducts.length}`);
        console.log(`   Deletion failures: ${this.deletionErrors.length}`);
        
        if (this.deletedProducts.length > 0) {
            console.log('\n✅ DELETED PRODUCTS:');
            this.deletedProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.productId} - ${product.title}`);
            });
        }
        
        if (this.deletionErrors.length > 0) {
            console.log('\n❌ DELETION ERRORS:');
            this.deletionErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.product.productId}: ${error.error}`);
            });
        }
        
        console.log('\n======================================================================');
        
        if (this.deletionErrors.length === 0) {
            console.log('🎯 RESULT: SUCCESS - All products deleted');
            console.log('✅ Database is now clean and ready for testing');
        } else {
            console.log('⚠️  RESULT: PARTIAL SUCCESS - Some deletions failed');
        }
    }
}

// Run the deletion
async function main() {
    const deleter = new RemainingProductsDeleter();
    const success = await deleter.deleteAllRemainingProducts();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = RemainingProductsDeleter;