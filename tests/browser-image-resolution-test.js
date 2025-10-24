/**
 * Browser Image Resolution Test
 * 
 * Tests the actual JavaScript image resolution functionality
 * by checking if images change from placeholders to real URLs
 */

const puppeteer = require('puppeteer');

async function testBrowserImageResolution() {
    console.log('🌐 BROWSER IMAGE RESOLUTION TEST');
    console.log('=================================');
    
    let browser;
    try {
        // Launch browser
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({ 
            headless: false,
            devtools: true,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                console.log(`❌ Browser Error: ${text}`);
            } else if (text.includes('ProductImageUrlClient') || text.includes('Resolver') || text.includes('image')) {
                console.log(`🔍 Browser Log: ${text}`);
            }
        });
        
        // Navigate to catalog page
        console.log('\n📖 Loading catalog page...');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        // Wait for initial page load
        await page.waitForTimeout(2000);
        
        // Check initial image state
        console.log('\n🔍 CHECKING INITIAL IMAGE STATE');
        console.log('================================');
        
        const initialImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                src: img.src,
                sourceImage: img.getAttribute('data-source-image'),
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                dimensions: { width: img.width, height: img.height }
            }));
        });
        
        console.log(`📊 Found ${initialImages.length} images with data-source-image attributes`);
        initialImages.forEach((img, i) => {
            console.log(`   ${i + 1}. Source: ${img.sourceImage}`);
            console.log(`      Current URL: ${img.src.substring(0, 100)}...`);
            console.log(`      Is Placeholder: ${img.isPlaceholder}`);
            console.log(`      Dimensions: ${img.dimensions.width}x${img.dimensions.height}`);
        });
        
        // Check if ProductImageUrlClient is initialized
        console.log('\n🔧 CHECKING JAVASCRIPT INITIALIZATION');
        console.log('======================================');
        
        const jsState = await page.evaluate(() => {
            return {
                clientExists: typeof window.ProductImageUrlClient !== 'undefined',
                clientInitialized: window.productImageClient ? true : false,
                resolverFunctionExists: typeof window.resolveProductImages === 'function',
                jqueryLoaded: typeof $ !== 'undefined'
            };
        });
        
        console.log(`📚 ProductImageUrlClient class exists: ${jsState.clientExists}`);
        console.log(`🔗 Client instance initialized: ${jsState.clientInitialized}`);
        console.log(`⚙️  Resolver function exists: ${jsState.resolverFunctionExists}`);
        console.log(`📦 jQuery loaded: ${jsState.jqueryLoaded}`);
        
        // Wait for potential async resolution
        console.log('\n⏳ WAITING FOR IMAGE RESOLUTION (10 seconds)');
        console.log('==============================================');
        
        await page.waitForTimeout(10000);
        
        // Check final image state
        console.log('\n🎯 CHECKING FINAL IMAGE STATE');
        console.log('==============================');
        
        const finalImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                src: img.src,
                sourceImage: img.getAttribute('data-source-image'),
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                isGalleryUrl: img.src.includes('gallery'),
                isCdnUrl: img.src.includes('cloudfront'),
                dimensions: { width: img.width, height: img.height }
            }));
        });
        
        console.log(`📊 Final state of ${finalImages.length} images:`);
        finalImages.forEach((img, i) => {
            console.log(`   ${i + 1}. Source: ${img.sourceImage}`);
            console.log(`      Final URL: ${img.src.substring(0, 100)}...`);
            console.log(`      Is Placeholder: ${img.isPlaceholder}`);
            console.log(`      Is Gallery URL: ${img.isGalleryUrl}`);
            console.log(`      Is CDN URL: ${img.isCdnUrl}`);
            console.log(`      Resolution Success: ${!img.isPlaceholder && (img.isGalleryUrl || img.isCdnUrl)}`);
        });
        
        // Test manual resolution trigger
        console.log('\n🔄 TESTING MANUAL RESOLUTION TRIGGER');
        console.log('=====================================');
        
        const manualResult = await page.evaluate(async () => {
            if (window.productImageClient && window.productImageClient.resolveAllImages) {
                try {
                    console.log('Triggering manual resolution...');
                    await window.productImageClient.resolveAllImages();
                    return { success: true, message: 'Manual resolution completed' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            } else {
                return { success: false, error: 'No resolution method available' };
            }
        });
        
        console.log(`🔧 Manual resolution result: ${JSON.stringify(manualResult, null, 2)}`);
        
        // Wait after manual trigger
        await page.waitForTimeout(3000);
        
        // Final check after manual trigger
        const postManualImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                src: img.src,
                sourceImage: img.getAttribute('data-source-image'),
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                isResolved: !img.src.includes('data:image/svg+xml')
            }));
        });
        
        console.log('\n📊 POST-MANUAL TRIGGER RESULTS');
        console.log('===============================');
        postManualImages.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.sourceImage}: ${img.isResolved ? '✅ RESOLVED' : '❌ STILL PLACEHOLDER'}`);
        });
        
        // Summary
        const resolvedCount = postManualImages.filter(img => img.isResolved).length;
        const totalCount = postManualImages.length;
        
        console.log('\n🎯 RESOLUTION TEST SUMMARY');
        console.log('===========================');
        console.log(`📊 Total Images: ${totalCount}`);
        console.log(`✅ Resolved Images: ${resolvedCount}`);
        console.log(`❌ Failed Images: ${totalCount - resolvedCount}`);
        console.log(`📈 Success Rate: ${((resolvedCount / totalCount) * 100).toFixed(1)}%`);
        
        if (resolvedCount === totalCount) {
            console.log('🎉 ALL IMAGES RESOLVED SUCCESSFULLY!');
        } else {
            console.log('🚨 IMAGE RESOLUTION FAILED - DEBUGGING NEEDED');
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('Press Ctrl+C to close when done inspecting.');
        
        // Wait indefinitely (user will close manually)
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    require('puppeteer');
    testBrowserImageResolution();
} catch (error) {
    console.log('⚠️  Puppeteer not available. Installing...');
    console.log('Run: npm install puppeteer');
    console.log('Then re-run this test.');
}