require('dotenv').config();
const axios = require('axios');

async function testDeleteRemovesFromBoth() {
    console.log('🧪 TEST: Delete Removes from BOTH Database AND Printify');
    console.log('=======================================================\n');
    
    const baseUrl = 'http://localhost:3001';
    const printifyBaseUrl = 'https://api.printify.com/v1';
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const token = process.env.PRINTIFY_API_TOKEN;
    
    // TEST 1: Check initial state
    console.log('TEST 1: Checking initial state...');
    const dbProducts = await axios.get(`${baseUrl}/api/merchandise/vendor-previews`);
    const printifyProducts = await axios.get(`${printifyBaseUrl}/shops/${shopId}/products.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const dbCount = dbProducts.data.previews?.length || 0;
    const printifyCount = printifyProducts.data.data?.length || 0;
    
    console.log(`Database: ${dbCount} products`);
    console.log(`Printify: ${printifyCount} products\n`);
    
    if (dbCount === 0 && printifyCount === 0) {
        console.log('✅ Both empty - test cannot run, need to create a product first');
        return;
    }
    
    if (dbCount === 0 && printifyCount > 0) {
        console.error('❌ ORPHANED PRODUCTS: Printify has products but database is empty');
        console.error('This means previous deletes did NOT remove from Printify!');
        process.exit(1);
    }
    
    // TEST 2: Delete via API and verify both are deleted
    if (dbCount > 0) {
        const productToDelete = dbProducts.data.previews[0];
        const productId = productToDelete.productId;
        
        console.log(`TEST 2: Deleting product ${productId} via API...`);
        console.log(`  Title: ${productToDelete.title}\n`);
        
        const deleteResponse = await axios.delete(`${baseUrl}/admin/vendor-research/delete-preview`, {
            data: { cacheKey: productId }
        });
        
        if (!deleteResponse.data.success) {
            throw new Error('Delete API failed: ' + deleteResponse.data.error);
        }
        
        console.log('✅ Delete API returned success\n');
        
        // TEST 3: Verify removed from database
        console.log('TEST 3: Verifying removed from database...');
        const dbAfter = await axios.get(`${baseUrl}/api/merchandise/vendor-previews`);
        const stillInDb = dbAfter.data.previews?.find(p => p.productId === productId);
        
        if (stillInDb) {
            console.error('❌ FAIL: Product still in database');
            process.exit(1);
        }
        console.log('✅ Product removed from database\n');
        
        // TEST 4: Verify removed from Printify
        console.log('TEST 4: Verifying removed from Printify...');
        const printifyAfter = await axios.get(`${printifyBaseUrl}/shops/${shopId}/products.json`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stillInPrintify = printifyAfter.data.data?.find(p => p.id === productId);
        
        if (stillInPrintify) {
            console.error('❌ FAIL: Product still in Printify shop');
            console.error('BUG: Delete API does NOT remove from Printify!');
            process.exit(1);
        }
        console.log('✅ Product removed from Printify\n');
        
        console.log('🎉 TEST PASSED: Delete removes from BOTH database AND Printify');
    }
}

testDeleteRemovesFromBoth()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });
