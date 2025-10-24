require('dotenv').config();
const puppeteer = require('puppeteer');

console.log('🔍 VENDOR CATALOG IMAGE RESOLVER PROOF TEST');
console.log('===========================================\n');

async function testImageResolver() {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        const imageRequests = [];
        const failedRequests = [];
        
        page.on('request', request => {
            if (request.resourceType() === 'image') {
                imageRequests.push(request.url());
            }
        });
        
        page.on('requestfailed', request => {
            if (request.resourceType() === 'image') {
                failedRequests.push({
                    url: request.url(),
                    error: request.failure().errorText
                });
            }
        });

        console.log('🌐 Loading catalog page...');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        console.log('⏳ Waiting 5 seconds for image resolver...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get all images with data-source-image attribute
        const images = await page.$$eval('img[data-source-image]', imgs => 
            imgs.map(img => ({
                sourceImage: img.getAttribute('data-source-image'),
                currentSrc: img.src,
                alt: img.alt,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete
            }))
        );

        console.log('📊 IMAGE RESOLVER RESULTS:');
        console.log('==========================\n');
        
        let placeholderCount = 0;
        let resolvedCount = 0;
        let brokenCount = 0;

        for (const img of images) {
            console.log(`📷 Source: ${img.sourceImage}`);
            console.log(`   Current URL: ${img.currentSrc}`);
            console.log(`   Alt text: ${img.alt}`);
            console.log(`   Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            console.log(`   Complete: ${img.complete}`);
            
            if (img.currentSrc.includes('data:image/svg+xml')) {
                console.log(`   ❌ STATUS: STILL SHOWING PLACEHOLDER - IMAGE RESOLVER FAILED`);
                placeholderCount++;
            } else if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                console.log(`   ❌ STATUS: BROKEN IMAGE - FAILED TO LOAD`);
                brokenCount++;
            } else {
                console.log(`   ✅ STATUS: RESOLVED AND LOADED`);
                resolvedCount++;
            }
            console.log('');
        }

        console.log('📊 SUMMARY:');
        console.log(`   Total images: ${images.length}`);
        console.log(`   ✅ Resolved: ${resolvedCount}`);
        console.log(`   ❌ Still placeholders: ${placeholderCount}`);
        console.log(`   ❌ Broken: ${brokenCount}\n`);

        if (failedRequests.length > 0) {
            console.log('❌ FAILED IMAGE REQUESTS:');
            failedRequests.forEach(req => {
                console.log(`   ${req.url}`);
                console.log(`   Error: ${req.error}\n`);
            });
        }

        // Test the actual image URLs
        console.log('🧪 TESTING IMAGE URL ACCESSIBILITY:');
        console.log('===================================\n');
        
        for (const img of images) {
            if (!img.currentSrc.includes('data:image/svg+xml')) {
                try {
                    const response = await fetch(img.currentSrc);
                    console.log(`${response.ok ? '✅' : '❌'} ${img.sourceImage} → HTTP ${response.status}`);
                } catch (error) {
                    console.log(`❌ ${img.sourceImage} → ${error.message}`);
                }
            }
        }

        console.log('\n🎯 FINAL VERDICT:');
        console.log('=================');
        
        if (placeholderCount > 0) {
            console.log(`❌ IMAGE RESOLVER IS BROKEN: ${placeholderCount} images still showing placeholders`);
            console.log('   The product-image-url-client.js is NOT working correctly');
            process.exit(1);
        } else if (brokenCount > 0) {
            console.log(`❌ IMAGE URLS ARE BROKEN: ${brokenCount} images failed to load`);
            console.log('   The resolved URLs return 404 or are inaccessible');
            process.exit(1);
        } else if (resolvedCount === 0) {
            console.log('❌ NO IMAGES FOUND: Cannot verify image resolver');
            process.exit(1);
        } else {
            console.log(`✅ IMAGE RESOLVER WORKS: All ${resolvedCount} images successfully resolved and loaded`);
            process.exit(0);
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testImageResolver();
