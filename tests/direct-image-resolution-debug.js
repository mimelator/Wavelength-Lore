/**
 * Direct Image Resolution Debug Test
 * 
 * Checks the image resolution API directly and validates
 * the catalog page JavaScript without browser automation
 */

const axios = require('axios');

async function testImageResolutionDirectly() {
    console.log('🔍 DIRECT IMAGE RESOLUTION DEBUG TEST');
    console.log('======================================');
    
    try {
        // Test 1: Check API endpoint directly
        console.log('\n🔌 TESTING IMAGE RESOLUTION API DIRECTLY');
        console.log('=========================================');
        
        const testImages = ['ice-fortress.webp', 'daphne.webp', 'goblin-king.webp'];
        
        for (const imageId of testImages) {
            try {
                console.log(`\n📸 Testing: ${imageId}`);
                const response = await axios.get(`http://localhost:3001/api/product-image/resolve/${imageId}`, {
                    timeout: 5000
                });
                
                console.log(`   Status: ${response.status}`);
                console.log(`   Success: ${response.data.success}`);
                console.log(`   Type: ${response.data.type}`);
                console.log(`   URL: ${response.data.url}`);
                
                if (response.data.success && response.data.type !== 'fallback') {
                    console.log(`   ✅ API Resolution: SUCCESS`);
                } else {
                    console.log(`   ❌ API Resolution: FAILED (${response.data.type})`);
                }
                
            } catch (apiError) {
                console.log(`   ❌ API Error: ${apiError.message}`);
            }
        }
        
        // Test 2: Check catalog page HTML structure
        console.log('\n📖 CHECKING CATALOG PAGE HTML STRUCTURE');
        console.log('========================================');
        
        const catalogResponse = await axios.get('http://localhost:3001/admin/vendor-research/catalog');
        const html = catalogResponse.data;
        
        // Check for key elements
        const hasImageElements = html.includes('data-source-image');
        const hasJavaScriptClient = html.includes('ProductImageUrlClient');
        const hasResolveFunction = html.includes('resolveProductImages');
        const hasJQueryCall = html.includes('$(document).ready');
        
        console.log(`   📸 Image elements with data-source-image: ${hasImageElements ? '✅' : '❌'}`);
        console.log(`   📚 ProductImageUrlClient included: ${hasJavaScriptClient ? '✅' : '❌'}`);
        console.log(`   ⚙️  Resolve function present: ${hasResolveFunction ? '✅' : '❌'}`);
        console.log(`   📦 jQuery initialization: ${hasJQueryCall ? '✅' : '❌'}`);
        
        // Extract image elements
        const imageMatches = html.match(/data-source-image="[^"]+"/g);
        if (imageMatches) {
            console.log(`\n📊 Found ${imageMatches.length} images to resolve:`);
            imageMatches.forEach((match, i) => {
                const sourceImage = match.match(/data-source-image="([^"]+)"/)[1];
                console.log(`   ${i + 1}. ${sourceImage}`);
            });
        }
        
        // Test 3: Check JavaScript file accessibility
        console.log('\n📚 CHECKING JAVASCRIPT FILE ACCESSIBILITY');
        console.log('==========================================');
        
        try {
            const jsResponse = await axios.get('http://localhost:3001/static/js/product-image-url-client.js');
            console.log(`   ✅ JavaScript file accessible: ${jsResponse.status}`);
            console.log(`   📏 File size: ${jsResponse.data.length} characters`);
            
            // Check for key functions in the JS file
            const jsContent = jsResponse.data;
            const hasClientClass = jsContent.includes('class ProductImageUrlClient');
            const hasResolveMethod = jsContent.includes('resolveAllImages');
            const hasApiCall = jsContent.includes('/api/product-image/resolve/');
            
            console.log(`   🏗️  ProductImageUrlClient class: ${hasClientClass ? '✅' : '❌'}`);
            console.log(`   🔄 resolveAllImages method: ${hasResolveMethod ? '✅' : '❌'}`);
            console.log(`   🔌 API call endpoint: ${hasApiCall ? '✅' : '❌'}`);
            
        } catch (jsError) {
            console.log(`   ❌ JavaScript file error: ${jsError.message}`);
        }
        
        // Test 4: Manual simulation of what the browser should do
        console.log('\n🎭 SIMULATING BROWSER BEHAVIOR');
        console.log('===============================');
        
        // Extract source images from catalog HTML
        if (imageMatches) {
            console.log('\nSimulating image resolution for each image...');
            
            for (const match of imageMatches) {
                const sourceImage = match.match(/data-source-image="([^"]+)"/)[1];
                console.log(`\n🔄 Resolving: ${sourceImage}`);
                
                try {
                    const resolveResponse = await axios.get(`http://localhost:3001/api/product-image/resolve/${sourceImage}`);
                    
                    if (resolveResponse.data.success && resolveResponse.data.type !== 'fallback') {
                        console.log(`   ✅ Should update to: ${resolveResponse.data.url}`);
                    } else {
                        console.log(`   ❌ Would remain placeholder (${resolveResponse.data.type})`);
                    }
                    
                } catch (resolveError) {
                    console.log(`   ❌ Resolution failed: ${resolveError.message}`);
                }
            }
        }
        
        console.log('\n🎯 DIAGNOSIS SUMMARY');
        console.log('====================');
        
        if (hasImageElements && hasJavaScriptClient && hasResolveFunction) {
            console.log('✅ All required components are present');
            console.log('🔍 Issue likely in JavaScript execution or timing');
            console.log('💡 Recommendations:');
            console.log('   1. Check browser console for JavaScript errors');
            console.log('   2. Verify network requests are being made');
            console.log('   3. Check if resolution happens after page load');
            console.log('   4. Validate jQuery is loaded before our script');
        } else {
            console.log('❌ Missing required components:');
            if (!hasImageElements) console.log('   - Image elements with data-source-image');
            if (!hasJavaScriptClient) console.log('   - ProductImageUrlClient class');
            if (!hasResolveFunction) console.log('   - resolveProductImages function');
        }
        
    } catch (error) {
        console.error('❌ Direct test failed:', error.message);
    }
}

testImageResolutionDirectly();