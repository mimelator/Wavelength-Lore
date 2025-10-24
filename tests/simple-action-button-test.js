require('dotenv').config();

console.log('🎯 SIMPLIFIED ACTION BUTTON TEST');
console.log('================================\n');

async function testActionButtons() {
    try {
        // 1. Test server
        console.log('1️⃣ Testing Server...');
        const serverResponse = await fetch('http://localhost:3001/health');
        if (!serverResponse.ok) {
            throw new Error('Server not responding');
        }
        console.log('✅ Server running\n');

        // 2. Get catalog page
        console.log('2️⃣ Testing Catalog Page...');
        const catalogResponse = await fetch('http://localhost:3001/admin/vendor-research/catalog');
        if (!catalogResponse.ok) {
            throw new Error(`Catalog failed: ${catalogResponse.status}`);
        }
        const catalogHtml = await catalogResponse.text();
        console.log('✅ Catalog page loads\n');

        // 3. Extract and test View Product links
        console.log('3️⃣ Testing View Product Links...');
        const viewLinkMatches = catalogHtml.match(/href="([^"]*\/merchandise\/preview\/[^"]+)"/g);
        if (!viewLinkMatches || viewLinkMatches.length === 0) {
            throw new Error('No View Product links found in catalog HTML');
        }
        
        console.log(`Found ${viewLinkMatches.length} View Product link(s)`);
        
        // Test each View Product link
        for (let i = 0; i < viewLinkMatches.length; i++) {
            const linkMatch = viewLinkMatches[i];
            const urlMatch = linkMatch.match(/href="([^"]+)"/);
            if (!urlMatch) continue;
            
            const viewProductUrl = urlMatch[1];
            const fullUrl = `http://localhost:3001${viewProductUrl}`;
            
            console.log(`🔗 Testing View Product link ${i + 1}: ${viewProductUrl}`);
            
            const viewResponse = await fetch(fullUrl);
            if (!viewResponse.ok) {
                throw new Error(`View Product link ${i + 1} failed: ${viewResponse.status} ${viewResponse.statusText}`);
            }
            
            const viewHtml = await viewResponse.text();
            if (!viewHtml.includes('preview') && !viewHtml.includes('Preview') && !viewHtml.includes('Product')) {
                throw new Error(`View Product link ${i + 1} leads to invalid page (no preview content)`);
            }
            
            console.log(`✅ View Product link ${i + 1} works - returns valid product page`);
        }
        console.log('');

        // 4. Test image resolution API
        console.log('4️⃣ Testing Image Resolution API...');
        
        // Extract image IDs from catalog
        const imageMatches = catalogHtml.match(/data-source-image="([^"]+)"/g);
        if (!imageMatches || imageMatches.length === 0) {
            throw new Error('No source images found in catalog');
        }
        
        console.log(`Found ${imageMatches.length} image(s) to resolve`);
        
        for (let i = 0; i < imageMatches.length; i++) {
            const imageMatch = imageMatches[i];
            const imageIdMatch = imageMatch.match(/data-source-image="([^"]+)"/);
            if (!imageIdMatch) continue;
            
            const imageId = imageIdMatch[1];
            console.log(`🖼️ Testing image resolution: ${imageId}`);
            
            const apiResponse = await fetch(`http://localhost:3001/api/product-image/resolve/${imageId}`);
            if (!apiResponse.ok) {
                throw new Error(`Image resolution API failed for ${imageId}: ${apiResponse.status}`);
            }
            
            const apiResult = await apiResponse.json();
            if (!apiResult.success || !apiResult.url) {
                throw new Error(`Image resolution failed for ${imageId}: ${JSON.stringify(apiResult)}`);
            }
            
            if (!apiResult.url.includes('cloudfront')) {
                throw new Error(`Image resolution for ${imageId} did not return CloudFront URL: ${apiResult.url}`);
            }
            
            console.log(`✅ ${imageId} resolves to: ${apiResult.url.substring(0, 80)}...`);
        }
        console.log('');

        // 5. Test batch resolution
        console.log('5️⃣ Testing Batch Image Resolution...');
        const allImageIds = imageMatches.map(match => {
            const idMatch = match.match(/data-source-image="([^"]+)"/);
            return idMatch ? idMatch[1] : null;
        }).filter(id => id);
        
        if (allImageIds.length > 0) {
            const batchResponse = await fetch('http://localhost:3001/api/product-image/resolve-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceImageIds: allImageIds })
            });
            
            if (!batchResponse.ok) {
                throw new Error(`Batch resolution failed: ${batchResponse.status}`);
            }
            
            const batchResult = await batchResponse.json();
            if (!batchResult.success || !batchResult.resolutions) {
                throw new Error(`Batch resolution returned invalid result: ${JSON.stringify(batchResult)}`);
            }
            
            console.log(`✅ Batch resolved ${batchResult.resolutions.length} images`);
        }
        console.log('');

        console.log('🎉 ACTION BUTTON & IMAGE RESOLVER VALIDATION PASSED!');
        console.log('===================================================');
        console.log('✅ Server responding');
        console.log('✅ Catalog page loads');
        console.log('✅ View Product links work and lead to valid pages');
        console.log('✅ Image resolution API works for all images');
        console.log('✅ Batch image resolution works');
        console.log('\n🚀 All core functionality is working!');

    } catch (error) {
        console.error('\n❌ ACTION BUTTON & IMAGE RESOLVER TEST FAILED:');
        console.error(error.message);
        process.exit(1);
    }
}

testActionButtons();