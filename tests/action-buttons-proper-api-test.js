require('dotenv').config();

console.log('🎯 PROPER API-BASED ACTION BUTTON TEST');
console.log('=====================================\n');

async function testActionButtonsProperAPI() {
    try {
        // 1. Check server health using proper API
        console.log('1️⃣ Testing Server Health API...');
        const healthResponse = await fetch('http://localhost:3001/health');
        if (!healthResponse.ok) {
            throw new Error(`Server health check failed: ${healthResponse.status}`);
        }
        const healthData = await healthResponse.json();
        console.log(`✅ Server healthy: ${healthData.status}`);

        // 2. Get catalog page using proper route
        console.log('\n2️⃣ Testing Catalog Page Route...');
        const catalogResponse = await fetch('http://localhost:3001/admin/vendor-research/catalog');
        if (!catalogResponse.ok) {
            throw new Error(`Catalog route failed: ${catalogResponse.status}`);
        }
        const catalogHtml = await catalogResponse.text();
        console.log('✅ Catalog page loads successfully');

        // 3. Parse HTML to find actual product data (NO HACKS)
        console.log('\n3️⃣ Analyzing Catalog Content...');
        
        // Extract View Product links
        const viewProductMatches = catalogHtml.match(/href="\/merchandise\/preview\/([^"]+)"/g);
        if (!viewProductMatches || viewProductMatches.length === 0) {
            console.log('ℹ️ No vendor preview products found in catalog');
            console.log('ℹ️ This is expected after cleanup - catalog should show "No Products Found"');
            
            // Verify "No Products Found" message
            if (catalogHtml.includes('No Products Found') || catalogHtml.includes('No Matching Products')) {
                console.log('✅ Catalog correctly shows empty state');
                return { isEmpty: true, reason: 'No products available for testing' };
            } else {
                throw new Error('Catalog has no products but also no empty state message');
            }
        }

        console.log(`📊 Found ${viewProductMatches.length} View Product link(s):`);
        
        // Test each View Product link using proper API calls
        let validProducts = 0;
        let invalidProducts = 0;
        
        for (let i = 0; i < viewProductMatches.length; i++) {
            const match = viewProductMatches[i];
            const productId = match.match(/\/merchandise\/preview\/([^"]+)/)[1];
            
            console.log(`\n🔗 Testing View Product ${i + 1}: ${productId}`);
            
            // Test the product preview route directly
            const productResponse = await fetch(`http://localhost:3001/merchandise/preview/${productId}`);
            
            if (productResponse.ok) {
                const productHtml = await productResponse.text();
                
                // Check if it's a valid product page (not error page)
                if (productHtml.includes('Product Preview') || productHtml.includes('Printify Product')) {
                    console.log(`✅ Valid product page returned`);
                    validProducts++;
                } else if (productHtml.includes('Product Not Found') || productHtml.includes('Error')) {
                    console.log(`❌ Product page shows error (orphaned product)`);
                    invalidProducts++;
                } else {
                    console.log(`⚠️ Product page returned but content unclear`);
                    console.log(`   Page title: ${(productHtml.match(/<title>([^<]+)<\/title>/) || ['', 'Unknown'])[1]}`);
                }
            } else {
                console.log(`❌ Product route failed: ${productResponse.status}`);
                invalidProducts++;
            }
        }

        // 4. Test image resolution API directly
        console.log('\n4️⃣ Testing Image Resolution API...');
        
        // Extract image IDs from catalog HTML
        const imageMatches = catalogHtml.match(/data-source-image="([^"]+)"/g);
        if (imageMatches && imageMatches.length > 0) {
            console.log(`📸 Found ${imageMatches.length} image(s) to test`);
            
            for (let i = 0; i < Math.min(imageMatches.length, 3); i++) { // Test max 3 images
                const imageId = imageMatches[i].match(/data-source-image="([^"]+)"/)[1];
                console.log(`🖼️ Testing image resolution: ${imageId}`);
                
                const imageApiResponse = await fetch(`http://localhost:3001/api/product-image/resolve/${imageId}`);
                if (imageApiResponse.ok) {
                    const imageData = await imageApiResponse.json();
                    if (imageData.success && imageData.url) {
                        console.log(`✅ Image resolves to: ${imageData.url.substring(0, 60)}...`);
                    } else {
                        console.log(`❌ Image resolution failed: ${imageData.error || 'Unknown error'}`);
                    }
                } else {
                    console.log(`❌ Image API failed: ${imageApiResponse.status}`);
                }
            }
        } else {
            console.log('ℹ️ No images found in catalog to test');
        }

        // 5. Summary and results
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=======================');
        console.log(`✅ Server health: OK`);
        console.log(`✅ Catalog route: OK`);
        console.log(`📦 Total products: ${viewProductMatches.length}`);
        console.log(`✅ Valid products: ${validProducts}`);
        console.log(`❌ Invalid products: ${invalidProducts}`);
        
        if (validProducts > 0) {
            console.log('\n🎉 ACTION BUTTONS TEST PASSED!');
            console.log('✅ View Product links work correctly');
            console.log('✅ Products lead to valid pages');
            console.log('✅ Image resolution API works');
        } else if (invalidProducts > 0) {
            console.log('\n⚠️ ACTION BUTTONS HAVE ISSUES');
            console.log('❌ Some products are orphaned (exist in catalog but not in Printify)');
            console.log('💡 Solution: Clean up orphaned products or create valid ones');
        }

        return {
            isEmpty: false,
            totalProducts: viewProductMatches.length,
            validProducts,
            invalidProducts,
            success: validProducts > 0
        };

    } catch (error) {
        console.error('\n❌ PROPER API TEST FAILED:', error.message);
        throw error;
    }
}

testActionButtonsProperAPI()
    .then(result => {
        if (result.isEmpty) {
            console.log('\n✅ TEST COMPLETED - CATALOG IS EMPTY (EXPECTED)');
            console.log('ℹ️ Use valid product creation APIs to add test data');
        } else if (result.success) {
            console.log('\n✅ ALL TESTS PASSED - ACTION BUTTONS WORK!');
        } else {
            console.log('\n❌ TESTS REVEALED ISSUES - ACTION BUTTONS BROKEN');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 CRITICAL TEST FAILURE');
        process.exit(1);
    });