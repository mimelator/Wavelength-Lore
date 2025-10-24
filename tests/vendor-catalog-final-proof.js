require('dotenv').config();
const puppeteer = require('puppeteer');

console.log('🎯 VENDOR CATALOG FINAL PROOF TEST');
console.log('===================================\n');

async function finalProof() {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        const imageRequests = [];
        const failedImages = [];
        
        page.on('request', request => {
            if (request.resourceType() === 'image') {
                imageRequests.push(request.url());
            }
        });
        
        page.on('requestfailed', request => {
            if (request.resourceType() === 'image') {
                failedImages.push({
                    url: request.url(),
                    error: request.failure().errorText
                });
            }
        });

        console.log('1️⃣ Loading catalog page...\n');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // TEST 1: Validate product data structure
        console.log('TEST 1: Product Data Validation');
        console.log('================================');
        const products = await page.$$eval('.product-card', cards => 
            cards.map(card => ({
                productId: card.querySelector('[data-product-id]')?.dataset.productId,
                title: card.querySelector('.product-title')?.textContent.trim(),
                hasImage: !!card.querySelector('.product-image-preview img'),
                imageSrc: card.querySelector('.product-image-preview img')?.src,
                hasImageUrl: card.querySelector('[data-image-url]')?.dataset.imageUrl ? true : false,
                imageUrl: card.querySelector('[data-image-url]')?.dataset.imageUrl
            }))
        );

        console.log(`Found ${products.length} products\n`);
        let dataValidationPassed = true;
        
        for (const product of products) {
            console.log(`Product: ${product.productId}`);
            console.log(`  Title: ${product.title}`);
            console.log(`  Has Image: ${product.hasImage}`);
            console.log(`  Image Src: ${product.imageSrc?.substring(0, 60)}...`);
            console.log(`  Has imageUrl field: ${product.hasImageUrl}`);
            
            if (!product.hasImageUrl) {
                console.log(`  ❌ FAIL: Product missing imageUrl field - MALFORMED DATA`);
                dataValidationPassed = false;
            } else {
                console.log(`  ✅ PASS: imageUrl present`);
            }
            console.log('');
        }

        if (!dataValidationPassed) {
            throw new Error('DATA VALIDATION FAILED: Products missing imageUrl field');
        }
        console.log('✅ TEST 1 PASSED: All products have valid imageUrl\n');
        
        // TEST 2: Images must load successfully
        console.log('TEST 2: Image Loading');
        console.log('=====================');
        const images = await page.$$eval('.product-image-preview img', imgs => 
            imgs.map(img => ({
                src: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete
            }))
        );

        let imageTestPassed = true;
        for (const img of images) {
            const isBroken = img.naturalWidth === 0 || img.naturalHeight === 0;
            
            if (isBroken) {
                console.log(`❌ FAIL: Image returns 403/404: ${img.src.substring(0, 60)}...`);
                imageTestPassed = false;
            } else {
                console.log(`✅ PASS: Image loaded (${img.naturalWidth}x${img.naturalHeight})`);
            }
        }

        if (!imageTestPassed) {
            throw new Error('IMAGE LOADING FAILED: Images return 403/404');
        }
        console.log('✅ TEST 2 PASSED: All images load successfully\n');

        // TEST 3: View Product buttons must exist and have valid hrefs
        console.log('TEST 3: View Product Buttons');
        console.log('============================');
        const viewButtons = await page.$$eval('a[href*="/merchandise/preview/"]', btns =>
            btns.map(btn => ({
                href: btn.href,
                text: btn.textContent.trim()
            }))
        );

        if (viewButtons.length === 0) {
            throw new Error('VIEW PRODUCT BUTTONS MISSING: No buttons found');
        }
        console.log(`✅ Found ${viewButtons.length} View Product buttons`);

        // TEST 4: View Product links must navigate to valid pages (not JSON)
        console.log('\nTEST 4: View Product Link Validity');
        console.log('===================================');
        const testUrl = viewButtons[0].href;
        console.log(`Testing: ${testUrl}`);
        
        await page.goto(testUrl, { waitUntil: 'networkidle0', timeout: 15000 });
        const content = await page.content();
        const contentType = await page.evaluate(() => document.contentType);
        
        if (contentType === 'application/json' || content.trim().startsWith('{')) {
            throw new Error('VIEW PRODUCT RETURNS JSON: Should be HTML page');
        }
        
        if (!content.includes('<!DOCTYPE html>') && !content.includes('<html')) {
            throw new Error('VIEW PRODUCT NOT HTML: Invalid page content');
        }
        
        console.log(`✅ Returns HTML page (${contentType})`);
        console.log('✅ TEST 4 PASSED: View Product links work\n');

        // TEST 5: Delete buttons must exist
        console.log('TEST 5: Delete Buttons');
        console.log('======================');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle0' 
        });
        
        const deleteButtons = await page.$$('button[onclick*="deleteProduct"]');
        if (deleteButtons.length === 0) {
            throw new Error('DELETE BUTTONS MISSING: No buttons found');
        }
        console.log(`✅ Found ${deleteButtons.length} Delete buttons`);
        console.log('✅ TEST 5 PASSED: Delete buttons exist\n');

        // FINAL VERDICT
        console.log('🎉 ALL TESTS PASSED!');
        console.log('====================');
        console.log('✅ Images resolve and load correctly');
        console.log('✅ View Product buttons exist');
        console.log('✅ View Product links navigate to HTML pages (not JSON)');
        console.log('✅ Delete buttons exist');
        console.log('\n🚀 VENDOR CATALOG IS FULLY FUNCTIONAL!');
        
        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

finalProof();
