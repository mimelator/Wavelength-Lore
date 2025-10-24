#!/usr/bin/env node
/**
 * GALLERY IMAGE RESOLVER TEST
 * 
 * Test that the image resolver correctly finds gallery images by their original names,
 * not just looking for exact filename matches.
 */

const ProductImageUrlResolver = require('../utils/product-image-url-resolver');

console.log('🧪 GALLERY IMAGE RESOLVER TEST');
console.log('===============================\n');

async function testGalleryImageResolution() {
    try {
        console.log('1️⃣ Initializing resolver...');
        const resolver = new ProductImageUrlResolver();
        
        console.log('\n2️⃣ Testing ice-fortress.webp resolution...');
        console.log('Expected: Should find the actual gallery image');
        console.log('Expected URL pattern: images/gallery/4fdbYxJHjEP4xksk9sgFE3lgYUs2/image-*-*.webp');
        
        const result = await resolver.resolveImageUrl('ice-fortress.webp');
        
        console.log('\n📊 Resolution Result:');
        console.log(`   Success: ${result.success}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Type: ${result.type}`);
        console.log(`   Source ID: ${result.sourceId}`);
        if (result.message) {
            console.log(`   Message: ${result.message}`);
        }
        
        // Test assertions
        const assertions = {
            shouldBeSuccessful: result.success === true,
            shouldNotBeFallback: result.type !== 'fallback',
            shouldContainGalleryPath: result.url && result.url.includes('images/gallery/'),
            shouldContainUserId: result.url && result.url.includes('4fdbYxJHjEP4xksk9sgFE3lgYUs2'),
            shouldBeWebpOrUpscaled: result.url && (result.url.includes('.webp') || result.url.includes('enhanced'))
        };
        
        console.log('\n🔍 Test Assertions:');
        console.log(`   ✅ Should be successful: ${assertions.shouldBeSuccessful ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Should not be fallback: ${assertions.shouldNotBeFallback ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Should contain gallery path: ${assertions.shouldContainGalleryPath ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Should contain user ID: ${assertions.shouldContainUserId ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Should be webp or upscaled: ${assertions.shouldBeWebpOrUpscaled ? 'PASS' : 'FAIL'}`);
        
        const allPassed = Object.values(assertions).every(assertion => assertion === true);
        
        if (allPassed) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ Resolver correctly finds gallery images');
            
            // Verify the URL is actually accessible
            console.log('\n3️⃣ Verifying URL accessibility...');
            const http = require('http');
            const https = require('https');
            
            const urlToTest = result.url.replace('https://d3ohg9sf8htmwk.cloudfront.net/', 'https://d3ohg9sf8htmwk.cloudfront.net/');
            
            const client = urlToTest.startsWith('https:') ? https : http;
            
            try {
                await new Promise((resolve, reject) => {
                    const req = client.request(urlToTest, { method: 'HEAD' }, (res) => {
                        if (res.statusCode === 200) {
                            console.log(`✅ URL is accessible: ${res.statusCode}`);
                            console.log(`   Content-Type: ${res.headers['content-type']}`);
                            console.log(`   Content-Length: ${res.headers['content-length']}`);
                            resolve();
                        } else {
                            console.log(`❌ URL not accessible: ${res.statusCode}`);
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    });
                    req.on('error', reject);
                    req.setTimeout(5000, () => reject(new Error('Timeout')));
                    req.end();
                });
                
                console.log('\n🏆 COMPLETE SUCCESS: Resolver works and URL is accessible!');
                
            } catch (urlError) {
                console.log(`⚠️  URL accessibility test failed: ${urlError.message}`);
                console.log('   (Resolver logic is correct but URL might have network issues)');
            }
            
        } else {
            console.log('\n❌ TESTS FAILED!');
            console.log('🔧 The resolver needs to be fixed to properly search gallery images');
            
            // Show what we expected vs what we got
            console.log('\n📋 Expected Behavior:');
            console.log('   1. Search in upscaled/ folder first for enhanced version');
            console.log('   2. Search in images/gallery/ folders for original by metadata');
            console.log('   3. Match images by original-name metadata, not filename');
            console.log('   4. Return actual gallery URL, not fallback CDN URL');
            
            console.log('\n🔍 Current Behavior:');
            console.log(`   - Type: ${result.type} (should be 'gallery' or 'upscaled')`);
            console.log(`   - URL: ${result.url}`);
            console.log(`   - Success: ${result.success}`);
            
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ TEST ERROR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

async function testMultipleImages() {
    try {
        console.log('\n4️⃣ Testing multiple images...');
        const resolver = new ProductImageUrlResolver();
        
        const testImages = [
            'ice-fortress.webp',
            'daphne.webp', 
            'goblin-king.webp'
        ];
        
        console.log(`Testing resolution for: ${testImages.join(', ')}`);
        
        const results = await resolver.resolveMultipleImageUrls(testImages);
        
        console.log('\n📊 Batch Resolution Results:');
        results.forEach((result, index) => {
            const image = testImages[index];
            console.log(`   ${index + 1}. ${image}:`);
            console.log(`      Success: ${result.success}`);
            console.log(`      Type: ${result.type}`);
            console.log(`      URL: ${result.url?.substring(0, 80)}...`);
        });
        
        const successCount = results.filter(r => r.success && r.type !== 'fallback').length;
        console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
        
        if (successCount === results.length) {
            console.log('🎉 All images resolved successfully!');
        } else {
            console.log('⚠️  Some images are using fallback URLs');
        }
        
    } catch (error) {
        console.error('Batch test error:', error.message);
    }
}

// Run the tests
async function runAllTests() {
    await testGalleryImageResolution();
    await testMultipleImages();
    
    console.log('\n🎯 RESOLVER TEST COMPLETE');
    console.log('Next step: Fix resolver code if tests failed');
    console.log('Then: Re-run this test to validate fixes');
}

runAllTests();