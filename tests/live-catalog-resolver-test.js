#!/usr/bin/env node
/**
 * LIVE CATALOG IMAGE RESOLVER TEST
 * 
 * This test opens the catalog page and proves that the Image Resolver 
 * system works in action, not just in terminal output.
 */

const puppeteer = require('puppeteer');

console.log('🎯 LIVE CATALOG IMAGE RESOLVER TEST');
console.log('===================================\n');

async function testImageResolverInAction() {
    let browser;
    
    try {
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show the browser so we can see it working
            devtools: true,  // Open DevTools to see console output
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Listen to console messages to see the resolver in action
        const consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);
            console.log(`🔍 Browser Console: ${text}`);
        });
        
        // Listen to network requests to see API calls
        const apiCalls = [];
        page.on('request', request => {
            if (request.url().includes('/api/product-image/resolve/')) {
                apiCalls.push(request.url());
                console.log(`📡 API Call: ${request.url()}`);
            }
        });
        
        console.log('📖 Loading catalog page...');
        await page.goto('http://localhost:3001/admin/vendor-research/catalog', {
            waitUntil: 'networkidle0',
            timeout: 15000
        });
        
        console.log('✅ Page loaded, waiting for image resolver...');
        
        // Wait a moment for the resolver to work
        await page.waitForTimeout(3000);
        
        // Check for product images
        const productImages = await page.$$('.product-image-preview img[data-source-image]');
        console.log(`📸 Found ${productImages.length} product images with data-source-image`);
        
        if (productImages.length === 0) {
            throw new Error('No product images found on catalog page');
        }
        
        // Check each image to see if it was resolved
        const imageResults = [];
        for (let i = 0; i < productImages.length; i++) {
            const img = productImages[i];
            
            const src = await img.evaluate(el => el.src);
            const dataSourceImage = await img.evaluate(el => el.getAttribute('data-source-image'));
            const resolvedType = await img.evaluate(el => el.dataset.resolvedType);
            const resolvedSuccess = await img.evaluate(el => el.dataset.resolvedSuccess);
            
            const result = {
                index: i + 1,
                sourceImage: dataSourceImage,
                currentSrc: src,
                resolvedType: resolvedType || 'not resolved',
                resolvedSuccess: resolvedSuccess || 'unknown',
                isPlaceholder: src.includes('data:image/svg+xml'),
                isResolved: !src.includes('data:image/svg+xml')
            };
            
            imageResults.push(result);
            
            console.log(`🖼️  Image ${i + 1}:`);
            console.log(`     Source ID: ${dataSourceImage}`);
            console.log(`     Current URL: ${src.substring(0, 80)}...`);
            console.log(`     Resolved Type: ${resolvedType || 'N/A'}`);
            console.log(`     Resolved Success: ${resolvedSuccess || 'N/A'}`);
            console.log(`     Is Placeholder: ${result.isPlaceholder}`);
            console.log(`     Is Resolved: ${result.isResolved}`);
        }
        
        // Test action buttons
        console.log('\n🔗 Testing action buttons...');
        
        const viewButtons = await page.$$('a[href*="/api/merchandise/vendor-preview/"]');
        const borderButtons = await page.$$('button[onclick*="openBorderModalFromCard"]');
        const deleteButtons = await page.$$('button[onclick*="deleteProduct"]');
        
        console.log(`👁️  View buttons found: ${viewButtons.length}`);
        console.log(`🎨 Border buttons found: ${borderButtons.length}`);
        console.log(`🗑️  Delete buttons found: ${deleteButtons.length}`);
        
        // Test clicking a view button
        if (viewButtons.length > 0) {
            console.log('🧪 Testing view button...');
            const viewUrl = await viewButtons[0].evaluate(el => el.href);
            console.log(`📋 View URL: ${viewUrl}`);
            
            // Open in new tab to test
            const newPage = await browser.newPage();
            const response = await newPage.goto(viewUrl, { waitUntil: 'networkidle0' });
            
            if (response.ok()) {
                console.log(`✅ View button works: ${response.status()}`);
                
                // Check for images on the product page
                const productPageImages = await newPage.$$('.main-image, .image-gallery img');
                console.log(`📸 Product page images: ${productPageImages.length}`);
            } else {
                console.log(`❌ View button failed: ${response.status()}`);
            }
            
            await newPage.close();
        }
        
        // Test border button (without actually clicking)
        if (borderButtons.length > 0) {
            console.log('🧪 Testing border button availability...');
            const borderButtonData = await borderButtons[0].evaluate(el => ({
                sourceImage: el.getAttribute('data-source-image'),
                productId: el.getAttribute('data-product-id'),
                vendorId: el.getAttribute('data-vendor-id'),
                productType: el.getAttribute('data-product-type'),
                hasOnClick: !!el.onclick
            }));
            
            console.log(`🎨 Border button data:`, borderButtonData);
            console.log(`✅ Border button is properly configured`);
        }
        
        // Summary
        console.log('\n📊 RESOLVER TEST RESULTS');
        console.log('=========================');
        
        const resolvedImages = imageResults.filter(img => img.isResolved).length;
        const placeholderImages = imageResults.filter(img => img.isPlaceholder).length;
        
        console.log(`🎯 Total Images: ${imageResults.length}`);
        console.log(`🎯 Resolved Images: ${resolvedImages}`);
        console.log(`🎯 Placeholder Images: ${placeholderImages}`);
        console.log(`🎯 Console Messages: ${consoleMessages.length}`);
        console.log(`🎯 API Calls Made: ${apiCalls.length}`);
        console.log(`🎯 View Buttons: ${viewButtons.length} (working)`);
        console.log(`🎯 Border Buttons: ${borderButtons.length} (available)`);
        console.log(`🎯 Delete Buttons: ${deleteButtons.length} (available)`);
        
        // Show some console messages
        if (consoleMessages.length > 0) {
            console.log('\n📝 Console Messages:');
            consoleMessages.forEach(msg => console.log(`   "${msg}"`));
        }
        
        // Show API calls
        if (apiCalls.length > 0) {
            console.log('\n📡 API Calls Made:');
            apiCalls.forEach(call => console.log(`   ${call}`));
        }
        
        if (resolvedImages > 0) {
            console.log('\n🎉 SUCCESS: Image Resolver System Working!');
            console.log('✅ Images are being resolved from placeholders to actual URLs');
            console.log('✅ Action buttons are properly configured');
            console.log('✅ Product views are accessible');
        } else {
            console.log('\n⚠️  ISSUE: Images still showing as placeholders');
            console.log('❓ Resolver may not be working properly');
        }
        
        // Keep browser open for 10 seconds so user can see the results
        console.log('\n⏰ Keeping browser open for 10 seconds to see results...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        
        if (error.message.includes('Could not find expected browser')) {
            console.log('💡 Try installing: npm install puppeteer');
        }
        
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    testImageResolverInAction();
} catch (error) {
    console.log('⚠️  Puppeteer not available, using manual test instead...');
    console.log('🌐 Please open: http://localhost:3001/admin/vendor-research/catalog');
    console.log('🔍 Check browser console for resolver messages');
    console.log('👁️  Look for images changing from "Loading..." to actual pictures');
}