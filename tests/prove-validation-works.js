require('dotenv').config();

async function proveValidationWorks() {
    console.log('🧪 PROOF: Validation Enforces imageUrl');
    console.log('=======================================\n');
    
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const helper = new VendorPreviewHelper();
    
    // TEST 1: Try to store WITHOUT imageUrl - should FAIL
    console.log('TEST 1: Attempting to store preview WITHOUT imageUrl...');
    try {
        const result = await helper.storeVendorPreview(
            { product: { productId: '507f1f77bcf86cd799439011', title: 'Test Product' } },
            { sourceImage: 'test.jpg', blueprintId: 5, providerId: 3 }
        );
        
        if (result.success) {
            console.error('❌ VALIDATION FAILED: Allowed product without imageUrl!');
            process.exit(1);
        } else if (result.error && result.error.includes('imageUrl is required')) {
            console.log('✅ VALIDATION WORKS: Rejected product without imageUrl');
            console.log(`   Error: ${result.error}\n`);
        } else {
            console.error('❌ WRONG ERROR:', result.error);
            process.exit(1);
        }
    } catch (error) {
        if (error.message && error.message.includes('imageUrl is required')) {
            console.log('✅ VALIDATION WORKS: Rejected product without imageUrl (thrown)');
            console.log(`   Error: ${error.message}\n`);
        } else {
            throw error;
        }
    }
    
    // TEST 2: Try to store WITH imageUrl - should SUCCEED
    console.log('TEST 2: Attempting to store preview WITH imageUrl...');
    try {
        const result = await helper.storeVendorPreview(
            { product: { productId: '507f1f77bcf86cd799439012', title: 'Valid Product' } },
            { 
                sourceImage: 'test.jpg',
                imageUrl: 'https://d3ohg9sf8htmwk.cloudfront.net/test.jpg',
                blueprintId: 5,
                providerId: 3
            }
        );
        
        if (result.success) {
            console.log('✅ VALIDATION WORKS: Accepted product with imageUrl');
            console.log(`   Product ID: ${result.productId}\n`);
            
            // Clean up
            const MerchandiseDatabase = require('../services/merchandise-database');
            await MerchandiseDatabase.deleteCachedPreview('507f1f77bcf86cd799439012');
            console.log('✅ Test product cleaned up\n');
        } else {
            throw new Error('Store failed: ' + result.error);
        }
    } catch (error) {
        console.error('❌ UNEXPECTED ERROR:', error.message);
        process.exit(1);
    }
    
    console.log('🎉 PROOF COMPLETE: Validation enforces imageUrl requirement');
}

proveValidationWorks()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Proof failed:', err.message);
        process.exit(1);
    });
