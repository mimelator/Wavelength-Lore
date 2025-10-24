#!/usr/bin/env node
/**
 * MANUAL CATALOG RESOLVER VERIFICATION
 * 
 * This test manually checks the catalog page HTML and validates
 * that the resolver system is properly set up.
 */

const http = require('http');
const cheerio = require('cheerio');

console.log('🔍 MANUAL CATALOG RESOLVER VERIFICATION');
console.log('========================================\n');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 10000);

        http.get(url, (res) => {
            clearTimeout(timeout);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        }).on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function verifyCatalogResolver() {
    try {
        console.log('1️⃣ Loading catalog page...');
        const catalogResponse = await makeRequest('http://localhost:3001/admin/vendor-research/catalog');
        
        if (catalogResponse.statusCode !== 200) {
            throw new Error(`Catalog failed: ${catalogResponse.statusCode}`);
        }
        
        console.log('✅ Catalog page loaded successfully');
        
        const $ = cheerio.load(catalogResponse.data);
        
        // Check for product images with data-source-image
        const imageElements = $('.product-image-preview img[data-source-image]');
        console.log(`📸 Found ${imageElements.length} images with data-source-image`);
        
        imageElements.each((i, img) => {
            const $img = $(img);
            const src = $img.attr('src');
            const dataSourceImage = $img.attr('data-source-image');
            
            console.log(`   Image ${i + 1}:`);
            console.log(`      Source Image: ${dataSourceImage}`);
            console.log(`      Current src: ${src.includes('data:image/svg+xml') ? 'Placeholder SVG' : src}`);
        });
        
        // Check if product-image-url-client.js is included
        const hasClientScript = catalogResponse.data.includes('/js/product-image-url-client.js');
        console.log(`📜 Client script included: ${hasClientScript ? 'Yes' : 'No'}`);
        
        // Check if initialization code is present
        const hasInitCode = catalogResponse.data.includes('window.productImageUrlClient.fixProductImages');
        console.log(`🔧 Init code present: ${hasInitCode ? 'Yes' : 'No'}`);
        
        // Test the resolver API directly
        console.log('\n2️⃣ Testing resolver API...');
        
        if (imageElements.length > 0) {
            const firstImageSourceId = $(imageElements[0]).attr('data-source-image');
            console.log(`🧪 Testing resolver for: ${firstImageSourceId}`);
            
            const apiResponse = await makeRequest(`http://localhost:3001/api/product-image/resolve/${encodeURIComponent(firstImageSourceId)}`);
            
            if (apiResponse.statusCode === 200) {
                const apiData = JSON.parse(apiResponse.data);
                console.log(`✅ API Response: ${apiResponse.statusCode}`);
                console.log(`   Success: ${apiData.success}`);
                console.log(`   Resolution Success: ${apiData.resolution?.success}`);
                console.log(`   URL: ${apiData.resolution?.url}`);
                console.log(`   Type: ${apiData.resolution?.type}`);
            } else {
                console.log(`❌ API failed: ${apiResponse.statusCode}`);
            }
        }
        
        // Check action buttons
        console.log('\n3️⃣ Checking action buttons...');
        
        const viewButtons = $('a[href*="/api/merchandise/vendor-preview/"]');
        const borderButtons = $('button[onclick*="openBorderModalFromCard"]');
        const deleteButtons = $('button[onclick*="deleteProduct"]');
        
        console.log(`👁️  View buttons: ${viewButtons.length}`);
        console.log(`🎨 Border buttons: ${borderButtons.length}`);
        console.log(`🗑️  Delete buttons: ${deleteButtons.length}`);
        
        if (viewButtons.length > 0) {
            const firstViewUrl = $(viewButtons[0]).attr('href');
            console.log(`   First view URL: ${firstViewUrl}`);
            
            // Test the view URL
            const viewResponse = await makeRequest(`http://localhost:3001${firstViewUrl}`);
            console.log(`   View page status: ${viewResponse.statusCode}`);
        }
        
        if (borderButtons.length > 0) {
            const $firstBorderBtn = $(borderButtons[0]);
            console.log(`   Border button data:`);
            console.log(`      source-image: ${$firstBorderBtn.attr('data-source-image')}`);
            console.log(`      product-id: ${$firstBorderBtn.attr('data-product-id')}`);
            console.log(`      vendor-id: ${$firstBorderBtn.attr('data-vendor-id')}`);
        }
        
        console.log('\n📊 VERIFICATION SUMMARY');
        console.log('=======================');
        console.log(`✅ Catalog page loads: ${catalogResponse.statusCode}`);
        console.log(`✅ Product images found: ${imageElements.length}`);
        console.log(`✅ Client script included: ${hasClientScript}`);
        console.log(`✅ Initialization code: ${hasInitCode}`);
        console.log(`✅ Action buttons present: ${viewButtons.length + borderButtons.length + deleteButtons.length}`);
        
        console.log('\n🎯 NEXT STEPS TO VERIFY RESOLVER:');
        console.log('1. Open browser to: http://localhost:3001/admin/vendor-research/catalog');
        console.log('2. Open Developer Tools (F12)');
        console.log('3. Watch Console tab for resolver messages');
        console.log('4. Look for images changing from "Loading..." placeholders');
        console.log('5. Test clicking the action buttons');
        
        if (imageElements.length > 0) {
            const firstImageSourceId = $(imageElements[0]).attr('data-source-image');
            console.log(`\n🔬 Manual API Test:`);
            console.log(`curl "http://localhost:3001/api/product-image/resolve/${firstImageSourceId}"`);
        }
        
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

verifyCatalogResolver();