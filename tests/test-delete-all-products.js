require('dotenv').config();
const axios = require('axios');

async function testDeleteAllProducts() {
    console.log('🧪 TEST: Delete All Products via API');
    console.log('====================================\n');
    
    const baseUrl = 'http://localhost:3001';
    
    // TEST 1: Get all products via API
    console.log('TEST 1: Fetching all products via API...');
    const response = await axios.get(`${baseUrl}/api/merchandise/products`);
    
    if (!response.data.success) {
        throw new Error('API returned error: ' + response.data.error);
    }
    
    const products = response.data.products || [];
    console.log(`Found ${products.length} products\n`);
    
    if (products.length === 0) {
        console.log('✅ TEST PASSED: No products exist');
        return;
    }
    
    console.log('Products to delete:');
    products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.productId || p.id} - ${p.title}`);
    });
    
    // TEST 2: Delete all products via API
    console.log('\nTEST 2: Deleting all products via API...');
    let deleteCount = 0;
    let failCount = 0;
    
    for (const product of products) {
        const productId = product.productId || product.id;
        try {
            console.log(`  Deleting: ${productId} - ${product.title}`);
            const deleteResponse = await axios.delete(`${baseUrl}/api/merchandise/product/${productId}`);
            
            if (deleteResponse.data.success) {
                deleteCount++;
                console.log(`    ✅ Deleted`);
            } else {
                failCount++;
                console.error(`    ❌ Failed: ${deleteResponse.data.error}`);
            }
        } catch (error) {
            failCount++;
            console.error(`    ❌ Failed: ${error.response?.data?.error || error.message}`);
        }
    }
    
    console.log(`\nDeleted: ${deleteCount}, Failed: ${failCount}`);
    
    // TEST 3: Verify all deleted via API
    console.log('\nTEST 3: Verifying all products deleted via API...');
    const verifyResponse = await axios.get(`${baseUrl}/api/merchandise/products`);
    const remainingProducts = verifyResponse.data.products || [];
    
    if (remainingProducts.length === 0) {
        console.log('✅ TEST PASSED: All products deleted');
    } else {
        console.error(`❌ TEST FAILED: ${remainingProducts.length} products still remain`);
        remainingProducts.forEach(p => {
            console.error(`  - ${p.productId || p.id}: ${p.title}`);
        });
        process.exit(1);
    }
}

testDeleteAllProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });
