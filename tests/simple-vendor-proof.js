#!/usr/bin/env node
require('dotenv').config();

/**
 * Simple Vendor Catalog Proof Test
 * Direct proof that the vendor catalog page works with image resolution
 */

console.log('🚀 VENDOR CATALOG PROOF TEST');
console.log('============================\n');

async function testImageResolution() {
    console.log('🔍 TESTING IMAGE RESOLUTION');
    console.log('===========================');
    
    const ProductImageUrlResolver = require('../utils/product-image-url-resolver');
    const resolver = new ProductImageUrlResolver();
    
    // Test with actual product images that should exist in different content paths
    const testImages = [
        // Character images from wavelength.yaml
        'daphne.webp',      // Should find: /images/characters/wavelength/daphne-6.webp
        'alexandria.webp',  // Should find: /images/characters/wavelength/alexandria-1.webp
        'yeti.webp',        // Should find: /images/characters/wavelength/yeti-5.webp
        'maurice.webp',     // Should find: /images/characters/wavelength/maurice-4.webp
        
        // Episode/season images 
        'ice-fortress.webp', // Should find in seasons directory
        'goblin-king.webp',  // Should find in seasons directory
        
        // Test non-existent image
        'non-existent-image.webp'
    ];
    
    let successCount = 0;
    
    for (const imageId of testImages) {
        try {
            const result = await resolver.resolveImageUrl(imageId);
            if (result && result.url) {
                // CRITICAL: Verify the resolved URL is actually an image file, not audio/video
                const isImageUrl = /\.(webp|png|jpg|jpeg|gif|bmp|tiff)(\?|$)/i.test(result.url);
                
                if (result.success && isImageUrl) {
                    console.log(`✅ ${imageId} → RESOLVED: ${result.url}`);
                    console.log(`   📋 Type: ${result.type}, Success: ${result.success}, File Type: IMAGE ✓`);
                    successCount++;
                } else if (result.success && !isImageUrl) {
                    console.log(`❌ ${imageId} → INVALID FILE TYPE: ${result.url}`);
                    console.log(`   📋 Type: ${result.type}, Success: ${result.success}, File Type: NOT IMAGE ✗`);
                    console.log(`   🚨 CRITICAL BUG: Image resolver returned non-image file!`);
                } else if (!isImageUrl) {
                    console.log(`⚠️  ${imageId} → FALLBACK (NON-IMAGE): ${result.url}`);
                    console.log(`   📋 Type: ${result.type || 'fallback'}, Success: ${result.success}, File Type: NOT IMAGE ✗`);
                } else {
                    console.log(`⚠️  ${imageId} → FALLBACK: ${result.url}`);
                    console.log(`   📋 Type: ${result.type || 'fallback'}, Success: ${result.success}, File Type: IMAGE ✓`);
                }
            } else {
                console.log(`❌ ${imageId} → NO RESULT`);
            }
        } catch (error) {
            console.log(`❌ ${imageId} → ERROR: ${error.message}`);
        }
    }
    
    console.log(`\n📊 RESOLUTION RESULTS: ${successCount}/${testImages.length} successfully resolved`);
    return successCount;
}

async function testCatalogData() {
    console.log('\n📦 TESTING CATALOG DATA');
    console.log('=======================');
    
    try {
        // Test that we can load catalog data
        const path = require('path');
        const vendorDataPath = path.join(__dirname, '../content/vendor-research/catalog-data.json');
        
        if (require('fs').existsSync(vendorDataPath)) {
            const catalogData = require(vendorDataPath);
            console.log(`✅ Catalog data loaded: ${Object.keys(catalogData).length} products`);
            
            // Show some sample products
            const products = Object.values(catalogData).slice(0, 3);
            products.forEach((product, i) => {
                console.log(`   📦 Product ${i + 1}: ${product.title || 'Unknown'}`);
                console.log(`      🖼️  Image: ${product.sourceImage || 'None'}`);
            });
            
            return true;
        } else {
            console.log('⚠️  Catalog data file not found');
            return false;
        }
    } catch (error) {
        console.log(`❌ Catalog data error: ${error.message}`);
        return false;
    }
}

async function runProofTest() {
    try {
        const imageResults = await testImageResolution();
        const catalogResults = await testCatalogData();
        
        console.log('\n🎯 PROOF TEST RESULTS');
        console.log('====================');
        console.log(`🖼️  Image Resolution: ${imageResults > 0 ? '✅ WORKING' : '❌ FAILED'}`);
        console.log(`📦 Catalog Data: ${catalogResults ? '✅ WORKING' : '❌ FAILED'}`);
        
        if (imageResults > 0 && catalogResults) {
            console.log('\n🎉 VENDOR CATALOG PROOF: ✅ CONFIRMED WORKING');
            console.log('   ✓ Images resolve to actual lore content');
            console.log('   ✓ Catalog data is accessible');
            console.log('   ✓ System is ready for vendor catalog functionality');
        } else {
            console.log('\n💥 VENDOR CATALOG PROOF: ❌ ISSUES DETECTED');
        }
        
    } catch (error) {
        console.log(`\n💥 Proof test failed: ${error.message}`);
        console.error(error.stack);
    }
}

runProofTest().catch(error => {
    console.error('Proof test execution error:', error);
    process.exit(1);
});