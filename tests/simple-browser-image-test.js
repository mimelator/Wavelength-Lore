/**
 * Simple Browser Image Resolution Test
 * Tests actual browser functionality without complex puppeteer APIs
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
        
        // Capture console logs
        const logs = [];
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            logs.push(`[${type}] ${text}`);
            console.log(`🔍 Browser ${type}: ${text}`);
        });
        
        // Navigate to catalog page
        console.log('\n📖 Loading catalog page...');
        const response = await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        console.log(`📊 Page loaded with status: ${response.status()}`);
        
        // Wait for initial load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check initial image state
        console.log('\n🔍 INITIAL IMAGE STATE');
        console.log('======================');
        
        const initialImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                src: img.src.substring(0, 150),
                sourceImage: img.getAttribute('data-source-image'),
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                isResolved: img.src.includes('gallery') || img.src.includes('cloudfront')
            }));
        });
        
        console.log(`📊 Found ${initialImages.length} images with data-source-image:`);
        initialImages.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.sourceImage}`);
            console.log(`      URL: ${img.src}...`);
            console.log(`      Placeholder: ${img.isPlaceholder}`);
            console.log(`      Resolved: ${img.isResolved}`);
        });
        
        // Wait for JavaScript to potentially resolve images
        console.log('\n⏳ WAITING FOR IMAGE RESOLUTION (15 seconds)');
        console.log('==============================================');
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Check final image state
        console.log('\n🎯 FINAL IMAGE STATE');
        console.log('====================');
        
        const finalImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                src: img.src.substring(0, 150),
                sourceImage: img.getAttribute('data-source-image'),
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                isResolved: img.src.includes('gallery') || img.src.includes('cloudfront'),
                fullUrl: img.src
            }));
        });
        
        console.log(`📊 Final state of ${finalImages.length} images:`);
        let resolvedCount = 0;
        finalImages.forEach((img, i) => {
            const status = img.isResolved ? '✅ RESOLVED' : '❌ PLACEHOLDER';
            console.log(`   ${i + 1}. ${img.sourceImage}: ${status}`);
            console.log(`      URL: ${img.src}...`);
            if (img.isResolved) {
                resolvedCount++;
                console.log(`      ✅ Full URL: ${img.fullUrl}`);
            }
        });
        
        // Test manual resolution if needed
        if (resolvedCount === 0) {
            console.log('\n🔄 ATTEMPTING MANUAL RESOLUTION');
            console.log('================================');
            
            const manualResult = await page.evaluate(async () => {
                try {
                    if (window.productImageClient && typeof window.productImageClient.resolveAllImages === 'function') {
                        console.log('Found productImageClient, calling resolveAllImages...');
                        await window.productImageClient.resolveAllImages();
                        return { success: true, method: 'productImageClient.resolveAllImages()' };
                    } else if (typeof window.resolveProductImages === 'function') {
                        console.log('Found resolveProductImages function...');
                        window.resolveProductImages();
                        return { success: true, method: 'resolveProductImages()' };
                    } else if (typeof window.fixProductImages === 'function') {
                        console.log('Found fixProductImages function...');
                        window.fixProductImages();
                        return { success: true, method: 'fixProductImages()' };
                    } else {
                        return { success: false, error: 'No resolution methods found' };
                    }
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log(`🔧 Manual resolution: ${JSON.stringify(manualResult, null, 2)}`);
            
            if (manualResult.success) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const postManualImages = await page.evaluate(() => {
                    const images = Array.from(document.querySelectorAll('img[data-source-image]'));
                    return images.map(img => ({
                        sourceImage: img.getAttribute('data-source-image'),
                        isResolved: img.src.includes('gallery') || img.src.includes('cloudfront'),
                        fullUrl: img.src
                    }));
                });
                
                console.log('\n📊 POST-MANUAL RESOLUTION STATE');
                console.log('================================');
                let postManualResolved = 0;
                postManualImages.forEach((img, i) => {
                    const status = img.isResolved ? '✅ RESOLVED' : '❌ STILL PLACEHOLDER';
                    console.log(`   ${i + 1}. ${img.sourceImage}: ${status}`);
                    if (img.isResolved) {
                        postManualResolved++;
                        console.log(`      ✅ URL: ${img.fullUrl}`);
                    }
                });
                
                resolvedCount = postManualResolved;
            }
        }
        
        // Final verdict
        console.log('\n🎯 FINAL VERDICT');
        console.log('================');
        console.log(`📊 Total Images: ${finalImages.length}`);
        console.log(`✅ Resolved Images: ${resolvedCount}`);
        console.log(`❌ Failed Images: ${finalImages.length - resolvedCount}`);
        console.log(`📈 Success Rate: ${((resolvedCount / finalImages.length) * 100).toFixed(1)}%`);
        
        if (resolvedCount === finalImages.length && resolvedCount > 0) {
            console.log('🎉 SUCCESS: ALL IMAGES RESOLVED IN BROWSER!');
        } else if (resolvedCount > 0) {
            console.log('⚠️  PARTIAL: Some images resolved, some failed');
        } else {
            console.log('❌ FAILURE: NO IMAGES RESOLVED - SYSTEM BROKEN');
        }
        
        // Keep browser open for inspection
        console.log('\n🔍 Browser will stay open for 60 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        
    } catch (error) {
        console.error('❌ Browser test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testBrowserImageResolution();