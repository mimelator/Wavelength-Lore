#!/usr/bin/env node
/**
 * ACTION BUTTON VALIDATION TEST
 * 
 * This test validates that all action buttons in the catalog work properly
 */

const http = require('http');

console.log('🔗 ACTION BUTTON VALIDATION TEST');
console.log('=================================\n');

function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 10000);

        const req = http.request(url, { method }, (res) => {
            clearTimeout(timeout);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        
        req.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
        
        req.end();
    });
}

async function testActionButtons() {
    try {
        console.log('1️⃣ Getting product data...');
        const apiResponse = await makeRequest('http://localhost:3001/api/merchandise/vendor-previews');
        
        if (apiResponse.statusCode !== 200) {
            throw new Error(`API failed: ${apiResponse.statusCode}`);
        }
        
        const apiData = JSON.parse(apiResponse.data);
        console.log(`✅ Found ${apiData.count} products`);
        
        if (apiData.count === 0) {
            console.log('⚠️  No products to test action buttons');
            return;
        }
        
        const product = apiData.previews[0];
        console.log(`🧪 Testing product: ${product.title}`);
        console.log(`   Product ID: ${product.productId}`);
        console.log(`   Source Image: ${product.sourceImage}`);
        
        console.log('\n2️⃣ Testing View Button...');
        const viewUrl = `http://localhost:3001${product.viewUrl}`;
        console.log(`📋 View URL: ${viewUrl}`);
        
        const viewResponse = await makeRequest(viewUrl);
        if (viewResponse.statusCode === 200) {
            console.log(`✅ View button works: ${viewResponse.statusCode}`);
            
            // Check if the page contains product images
            const hasProductImages = viewResponse.data.includes('main-image') || 
                                   viewResponse.data.includes('image-gallery');
            console.log(`📸 Product page has images: ${hasProductImages ? 'Yes' : 'No'}`);
            
            // Check if it has Printify mockup URLs
            const hasPrintifyUrls = viewResponse.data.includes('images-api.printify.com');
            console.log(`🖼️  Has Printify mockup URLs: ${hasPrintifyUrls ? 'Yes' : 'No'}`);
            
        } else {
            console.log(`❌ View button failed: ${viewResponse.statusCode}`);
        }
        
        console.log('\n3️⃣ Testing API View Button...');
        const apiViewUrl = `http://localhost:3001/api/merchandise/vendor-preview/${product.productId}`;
        console.log(`📋 API View URL: ${apiViewUrl}`);
        
        const apiViewResponse = await makeRequest(apiViewUrl);
        if (apiViewResponse.statusCode === 200) {
            console.log(`✅ API view works: ${apiViewResponse.statusCode}`);
            
            try {
                const apiViewData = JSON.parse(apiViewResponse.data);
                console.log(`   Success: ${apiViewData.success}`);
                console.log(`   Has product data: ${!!apiViewData.product}`);
                console.log(`   Has mockup images: ${!!apiViewData.product?.mockupImages}`);
            } catch (e) {
                console.log(`   Response is HTML (redirect or webpage)`);
            }
        } else {
            console.log(`❌ API view failed: ${apiViewResponse.statusCode}`);
        }
        
        console.log('\n4️⃣ Testing Image Resolution Button Data...');
        
        // Test the image resolver with the product's source image
        const resolveUrl = `http://localhost:3001/api/product-image/resolve/${encodeURIComponent(product.sourceImage)}`;
        console.log(`🔍 Resolve URL: ${resolveUrl}`);
        
        const resolveResponse = await makeRequest(resolveUrl);
        if (resolveResponse.statusCode === 200) {
            const resolveData = JSON.parse(resolveResponse.data);
            console.log(`✅ Image resolver works: ${resolveResponse.statusCode}`);
            console.log(`   Success: ${resolveData.success}`);
            console.log(`   Resolution success: ${resolveData.resolution?.success}`);
            console.log(`   Resolved URL: ${resolveData.resolution?.url}`);
            console.log(`   Resolution type: ${resolveData.resolution?.type}`);
        } else {
            console.log(`❌ Image resolver failed: ${resolveResponse.statusCode}`);
        }
        
        console.log('\n📊 ACTION BUTTON TEST RESULTS');
        console.log('==============================');
        console.log(`🎯 Product View Page: ${viewResponse.statusCode === 200 ? 'Working ✅' : 'Failed ❌'}`);
        console.log(`🎯 API View Endpoint: ${apiViewResponse.statusCode === 200 ? 'Working ✅' : 'Failed ❌'}`);
        console.log(`🎯 Image Resolver: ${resolveResponse.statusCode === 200 ? 'Working ✅' : 'Failed ❌'}`);
        
        console.log('\n🌐 MANUAL TESTING URLS:');
        console.log(`📖 Catalog Page: http://localhost:3001/admin/vendor-research/catalog`);
        console.log(`👁️  Product View: ${viewUrl}`);
        console.log(`📊 API View: ${apiViewUrl}`);
        console.log(`🔍 Image Resolve: ${resolveUrl}`);
        
        console.log('\n🎯 TO VALIDATE RESOLVER IN BROWSER:');
        console.log('1. Open catalog page in browser');
        console.log('2. Open Developer Tools (F12)');
        console.log('3. Check Console tab for image resolver messages');
        console.log('4. Watch for images changing from "Loading..." to resolved URLs');
        console.log('5. Click the action buttons to test functionality');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

testActionButtons();