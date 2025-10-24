require('dotenv').config();
const ProductImageUrlResolver = require('../utils/product-image-url-resolver');

console.log('🎯 QUICK VENDOR CATALOG VALIDATION');
console.log('==================================\n');

async function validateVendorCatalog() {
    try {
        // Test server connection
        console.log('1️⃣ Testing Server Connection...');
        const serverResponse = await fetch('http://localhost:3001/health');
        if (!serverResponse.ok) {
            throw new Error('Server not responding');
        }
        console.log('✅ Server is running\n');

        // Test catalog page loads
        console.log('2️⃣ Testing Catalog Page...');
        const catalogResponse = await fetch('http://localhost:3001/admin/vendor-research/catalog');
        if (!catalogResponse.ok) {
            throw new Error('Catalog page not accessible');
        }
        const catalogHtml = await catalogResponse.text();
        
        // Check for critical elements
        const hasProductCard = catalogHtml.includes('product-card');
        const hasProductActions = catalogHtml.includes('product-actions');
        const hasSourceImage = catalogHtml.includes('data-source-image');
        const hasProductImage = catalogHtml.includes('product-image');
        
        console.log(`   Product cards: ${hasProductCard ? '✅' : '❌'}`);
        console.log(`   Product actions: ${hasProductActions ? '✅' : '❌'}`);
        console.log(`   data-source-image: ${hasSourceImage ? '✅' : '❌'}`);
        console.log(`   product-image class: ${hasProductImage ? '✅' : '❌'}`);
        
        if (!hasProductCard) {
            throw new Error('No product cards found in catalog');
        }
        if (!hasProductActions) {
            throw new Error('No product action sections found in catalog');
        }
        if (!hasSourceImage && !hasProductImage) {
            throw new Error('No product images found in catalog');
        }
        if (!catalogHtml.includes('View Product')) {
            throw new Error('No View Product buttons found in catalog');
        }
        console.log('✅ Catalog page loads with products, images, and action buttons\n');

        // Test API endpoints
        console.log('3️⃣ Testing Image Resolution APIs...');
        
        // Test single resolution
        const singleResponse = await fetch('http://localhost:3001/api/product-image/resolve/ice-fortress.webp');
        if (!singleResponse.ok) {
            throw new Error('Single image resolution API failed');
        }
        const singleResult = await singleResponse.json();
        if (!singleResult.url || !singleResult.url.includes('cloudfront')) {
            throw new Error('Single image resolution returned invalid URL');
        }
        console.log('✅ Single image resolution API working');

        // Test batch resolution
        const batchResponse = await fetch('http://localhost:3001/api/product-image/resolve-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceImageIds: ['ice-fortress.webp', 'daphne.webp'] })
        });
        if (!batchResponse.ok) {
            throw new Error('Batch image resolution API failed');
        }
        const batchResult = await batchResponse.json();
        if (!batchResult.resolutions || batchResult.resolutions.length !== 2) {
            throw new Error('Batch image resolution returned invalid results');
        }
        console.log('✅ Batch image resolution API working\n');

        // Test image resolver directly
        console.log('4️⃣ Testing Image Resolver...');
        const resolver = new ProductImageUrlResolver();
        
        const testImages = ['ice-fortress.webp', 'daphne.webp', 'goblin-king.webp'];
        for (const imageId of testImages) {
            const result = await resolver.resolveImageUrl(imageId);
            if (!result || !result.success || !result.url || !result.url.includes('cloudfront')) {
                throw new Error(`Failed to resolve ${imageId}`);
            }
            console.log(`✅ ${imageId} → ${result.url.substring(0, 80)}...`);
        }

        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('============================');
        console.log('✅ Server running');
        console.log('✅ Catalog page accessible');  
        console.log('✅ Products, images, and action buttons present');
        console.log('✅ Single image resolution API working');
        console.log('✅ Batch image resolution API working');
        console.log('✅ Image resolver working for all content types');
        console.log('\n🚀 Vendor catalog is fully functional!');

    } catch (error) {
        console.error('❌ VALIDATION FAILED:', error.message);
        process.exit(1);
    }
}

validateVendorCatalog();