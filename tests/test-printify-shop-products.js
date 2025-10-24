require('dotenv').config();
const axios = require('axios');

async function testPrintifyShopProducts() {
    console.log('🧪 TEST: Printify Shop Products via Direct API');
    console.log('==============================================\n');
    
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const token = process.env.PRINTIFY_API_TOKEN;
    const baseUrl = 'https://api.printify.com/v1';
    
    console.log(`Shop ID: ${shopId}`);
    console.log(`Token: ${token ? 'SET' : 'NOT SET'}\n`);
    
    // TEST 1: Get products directly from Printify API
    console.log('TEST 1: Fetching products from Printify shop...');
    
    try {
        const response = await axios.get(`${baseUrl}/shops/${shopId}/products.json`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const products = response.data.data || [];
        console.log(`Found ${products.length} products in Printify shop\n`);
        
        if (products.length === 0) {
            console.log('✅ TEST PASSED: No products in Printify shop');
            return;
        }
        
        console.log('Products in Printify shop:');
        products.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.id} - ${p.title}`);
        });
        
        // TEST 2: Delete all products from Printify
        console.log('\nTEST 2: Deleting all products from Printify...');
        let deleteCount = 0;
        let failCount = 0;
        
        for (const product of products) {
            try {
                console.log(`  Deleting: ${product.id} - ${product.title}`);
                await axios.delete(`${baseUrl}/shops/${shopId}/products/${product.id}.json`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                deleteCount++;
                console.log(`    ✅ Deleted from Printify`);
            } catch (error) {
                failCount++;
                console.error(`    ❌ Failed: ${error.response?.data?.error || error.message}`);
            }
        }
        
        console.log(`\nDeleted: ${deleteCount}, Failed: ${failCount}`);
        
        // TEST 3: Verify all deleted
        console.log('\nTEST 3: Verifying all products deleted from Printify...');
        const verifyResponse = await axios.get(`${baseUrl}/shops/${shopId}/products.json`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const remainingProducts = verifyResponse.data.data || [];
        
        if (remainingProducts.length === 0) {
            console.log('✅ TEST PASSED: All products deleted from Printify shop');
        } else {
            console.error(`❌ TEST FAILED: ${remainingProducts.length} products still remain in Printify`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testPrintifyShopProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });
