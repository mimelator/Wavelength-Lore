require('dotenv').config();
const puppeteer = require('puppeteer');

console.log('🎯 VENDOR CATALOG ACTION BUTTONS & IMAGE RESOLVER TEST');
console.log('=====================================================\n');

async function validateActionButtons() {
    let browser;
    try {
        // 1. Test environment validation first
        console.log('1️⃣ Running Environment Validation...');
        const { execSync } = require('child_process');
        try {
            execSync('node tests/environment-validation-test.js', { stdio: 'inherit' });
            console.log('✅ Environment validation passed\n');
        } catch (error) {
            throw new Error('Environment validation failed - must fix regressions first');
        }

        // 2. Test server and API endpoints
        console.log('2️⃣ Testing Server & API Endpoints...');
        const serverResponse = await fetch('http://localhost:3001/health');
        if (!serverResponse.ok) {
            throw new Error('Server not responding');
        }
        console.log('✅ Server running\n');

        // 3. Test catalog loads with products
        console.log('3️⃣ Testing Catalog Page...');
        const catalogResponse = await fetch('http://localhost:3001/admin/vendor-research/catalog');
        if (!catalogResponse.ok) {
            throw new Error('Catalog page not accessible');
        }
        const catalogHtml = await catalogResponse.text();
        
        // Extract product ID from HTML for testing
        const productIdMatch = catalogHtml.match(/data-product-id="([^"]+)"/);
        if (!productIdMatch) {
            throw new Error('No product IDs found in catalog');
        }
        const productId = productIdMatch[1];
        console.log(`✅ Found product ID: ${productId}`);

        // Extract View Product link
        const viewLinkMatch = catalogHtml.match(/href="([^"]*\/merchandise\/preview\/[^"]+)"/);
        if (!viewLinkMatch) {
            throw new Error('No View Product links found');
        }
        const viewProductUrl = viewLinkMatch[1];
        console.log(`✅ Found View Product URL: ${viewProductUrl}\n`);

        // 4. Test View Product button functionality
        console.log('4️⃣ Testing View Product Button...');
        const fullViewUrl = `http://localhost:3001${viewProductUrl}`;
        const viewResponse = await fetch(fullViewUrl);
        if (!viewResponse.ok) {
            throw new Error(`View Product link failed: ${viewResponse.status} ${viewResponse.statusText}`);
        }
        const viewHtml = await viewResponse.text();
        
        // Validate the product preview page contains expected elements
        if (!viewHtml.includes('Product Preview') && !viewHtml.includes('preview')) {
            throw new Error('View Product page does not contain product preview content');
        }
        console.log('✅ View Product button works - returns valid product page\n');

        // 5. Test image resolution with browser
        console.log('5️⃣ Testing Image Resolution in Browser...');
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Track network requests and console logs
        const failedRequests = [];
        const consoleErrors = [];
        
        page.on('requestfailed', request => {
            failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Load catalog page
        console.log('🌐 Loading catalog in browser...');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Wait for images to be processed
        console.log('⏳ Waiting for image resolver to process...');
        await page.waitForTimeout(5000);

        // Check for failed image requests
        const imageFailures = failedRequests.filter(req => 
            req.includes('.webp') || req.includes('.jpg') || req.includes('.png')
        );
        
        if (imageFailures.length > 0) {
            console.log('❌ Image loading failures:');
            imageFailures.forEach(failure => console.log(`   ${failure}`));
            throw new Error(`${imageFailures.length} image(s) failed to load`);
        }

        // Check if images were resolved properly
        const imageElements = await page.$$eval('img[data-source-image]', imgs => 
            imgs.map(img => ({
                sourceImage: img.getAttribute('data-source-image'),
                currentSrc: img.src,
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                hasCloudfront: img.src.includes('cloudfront')
            }))
        );

        console.log('📊 Image Resolution Results:');
        let resolvedCount = 0;
        let placeholderCount = 0;
        
        for (const img of imageElements) {
            if (img.isPlaceholder) {
                placeholderCount++;
                console.log(`❌ ${img.sourceImage} → Still showing placeholder`);
            } else if (img.hasCloudfront) {
                resolvedCount++;
                console.log(`✅ ${img.sourceImage} → Resolved to CDN`);
            } else {
                console.log(`⚠️ ${img.sourceImage} → Resolved but not to CDN: ${img.currentSrc}`);
            }
        }

        if (placeholderCount > 0) {
            throw new Error(`${placeholderCount} images still showing placeholders - image resolver failed`);
        }

        if (resolvedCount === 0) {
            throw new Error('No images were resolved to CDN URLs');
        }

        console.log(`✅ ${resolvedCount} images successfully resolved to CDN\n`);

        // 6. Test action buttons in browser
        console.log('6️⃣ Testing Action Buttons in Browser...');
        
        // Check for View Product buttons
        const viewButtons = await page.$$('a[href*="/merchandise/preview/"]');
        if (viewButtons.length === 0) {
            throw new Error('No View Product buttons found in browser');
        }
        console.log(`✅ Found ${viewButtons.length} View Product button(s)`);

        // Test clicking View Product button
        const firstViewButton = viewButtons[0];
        const buttonHref = await firstViewButton.evaluate(el => el.href);
        
        if (!buttonHref || !buttonHref.includes('/merchandise/preview/')) {
            throw new Error('View Product button has invalid href');
        }
        console.log(`✅ View Product button has valid href: ${buttonHref}`);

        // Navigate to product preview to verify it works
        await page.goto(buttonHref, { waitUntil: 'networkidle0', timeout: 15000 });
        
        const pageTitle = await page.title();
        const pageContent = await page.content();
        
        if (!pageTitle.includes('Preview') && !pageContent.includes('preview')) {
            throw new Error('View Product button leads to invalid page');
        }
        console.log('✅ View Product button successfully navigates to product preview\n');

        // 7. Check for console errors
        console.log('7️⃣ Checking for Console Errors...');
        if (consoleErrors.length > 0) {
            console.log('⚠️ Console errors detected:');
            consoleErrors.forEach(error => console.log(`   ${error}`));
            
            // Filter out known warnings that aren't critical
            const criticalErrors = consoleErrors.filter(error => 
                !error.includes('AWS SDK for JavaScript (v2)') &&
                !error.includes('trace-warnings') &&
                !error.toLowerCase().includes('warning')
            );
            
            if (criticalErrors.length > 0) {
                throw new Error(`${criticalErrors.length} critical console errors detected`);
            }
        }
        console.log('✅ No critical console errors\n');

        console.log('🎉 ALL ACTION BUTTON & IMAGE RESOLVER TESTS PASSED!');
        console.log('===================================================');
        console.log('✅ Environment validation passed');
        console.log('✅ Server running and responding');
        console.log('✅ Catalog page loads with products');
        console.log('✅ View Product buttons work and lead to valid pages');
        console.log('✅ Images resolve properly to CDN URLs');
        console.log('✅ No critical browser errors');
        console.log('\n🚀 Vendor catalog action buttons and image resolver are fully functional!');

    } catch (error) {
        console.error('\n❌ ACTION BUTTON & IMAGE RESOLVER TEST FAILED:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

validateActionButtons();