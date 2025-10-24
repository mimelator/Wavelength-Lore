/**
 * Comprehensive Catalog Validation Test
 * 
 * Tests EVERYTHING:
 * - Image resolution from placeholders to actual URLs
 * - Action button links (view, border, delete)
 * - JavaScript functionality
 * - Page responsiveness
 * - Error detection
 */

const puppeteer = require('puppeteer');

async function comprehensiveCatalogTest() {
    console.log('🎯 COMPREHENSIVE CATALOG VALIDATION TEST');
    console.log('=========================================');
    
    let browser;
    const errors = [];
    const results = {
        imageResolution: { passed: false, details: [] },
        actionButtons: { passed: false, details: [] },
        javascript: { passed: false, details: [] },
        overall: { passed: false, summary: '' }
    };
    
    try {
        // Launch browser
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({ 
            headless: false,
            devtools: true,
            defaultViewport: { width: 1400, height: 900 }
        });
        
        const page = await browser.newPage();
        
        // Capture all errors and logs
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                errors.push(`JS Error: ${text}`);
                console.log(`❌ JS Error: ${text}`);
            } else if (text.includes('resolved') || text.includes('Updated') || text.includes('Batch')) {
                console.log(`🔍 Resolution: ${text}`);
            }
        });
        
        page.on('pageerror', error => {
            errors.push(`Page Error: ${error.message}`);
            console.log(`❌ Page Error: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
            console.log(`❌ Request Failed: ${request.url()}`);
        });
        
        // Navigate to catalog page
        console.log('\n📖 Loading catalog page...');
        const response = await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        console.log(`📊 Page loaded with status: ${response.status()}`);
        
        // Wait for initial load and JavaScript execution
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // TEST 1: IMAGE RESOLUTION VALIDATION
        console.log('\n🔍 TEST 1: IMAGE RESOLUTION VALIDATION');
        console.log('======================================');
        
        const imageData = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[data-source-image]'));
            return images.map(img => ({
                sourceImage: img.getAttribute('data-source-image'),
                currentSrc: img.src,
                isPlaceholder: img.src.includes('data:image/svg+xml'),
                isResolved: img.src.includes('gallery') || img.src.includes('cloudfront'),
                dimensions: { width: img.naturalWidth, height: img.naturalHeight }
            }));
        });
        
        console.log(`📊 Found ${imageData.length} images with data-source-image attributes:`);
        let resolvedCount = 0;
        imageData.forEach((img, i) => {
            const status = img.isResolved ? '✅ RESOLVED' : '❌ PLACEHOLDER';
            console.log(`   ${i + 1}. ${img.sourceImage}: ${status}`);
            console.log(`      URL: ${img.currentSrc.substring(0, 100)}...`);
            console.log(`      Dimensions: ${img.dimensions.width}x${img.dimensions.height}`);
            
            if (img.isResolved) {
                resolvedCount++;
                results.imageResolution.details.push(`✅ ${img.sourceImage} resolved successfully`);
            } else {
                results.imageResolution.details.push(`❌ ${img.sourceImage} still showing placeholder`);
            }
        });
        
        results.imageResolution.passed = resolvedCount === imageData.length && imageData.length > 0;
        console.log(`📈 Image Resolution: ${resolvedCount}/${imageData.length} (${((resolvedCount/imageData.length)*100).toFixed(1)}%)`);
        
        // TEST 2: ACTION BUTTON VALIDATION
        console.log('\n🔗 TEST 2: ACTION BUTTON VALIDATION');
        console.log('===================================');
        
        const actionButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('a[href*="preview"], a[onclick*="border"], a[onclick*="delete"], button[onclick*="border"], button[onclick*="delete"]'));
            return buttons.map(btn => ({
                text: btn.textContent.trim(),
                href: btn.href || null,
                onclick: btn.getAttribute('onclick') || null,
                className: btn.className,
                tagName: btn.tagName,
                isVisible: btn.offsetParent !== null
            }));
        });
        
        console.log(`📊 Found ${actionButtons.length} action buttons:`);
        actionButtons.forEach((btn, i) => {
            console.log(`   ${i + 1}. ${btn.text} (${btn.tagName})`);
            console.log(`      Href: ${btn.href || 'none'}`);
            console.log(`      Onclick: ${btn.onclick || 'none'}`);
            console.log(`      Visible: ${btn.isVisible}`);
            console.log(`      Classes: ${btn.className}`);
        });
        
        // Test each action button
        let buttonTestsPassed = 0;
        for (let i = 0; i < actionButtons.length; i++) {
            const btn = actionButtons[i];
            console.log(`\n🧪 Testing button: ${btn.text}`);
            
            try {
                if (btn.href && btn.href !== 'null') {
                    // Test href links by making a request
                    console.log(`   Testing URL: ${btn.href}`);
                    const testResponse = await page.goto(btn.href, { timeout: 5000 });
                    console.log(`   Status: ${testResponse.status()}`);
                    
                    if (testResponse.status() === 200) {
                        console.log(`   ✅ Link works`);
                        results.actionButtons.details.push(`✅ ${btn.text} link works (${testResponse.status()})`);
                        buttonTestsPassed++;
                    } else {
                        console.log(`   ❌ Link failed with status ${testResponse.status()}`);
                        results.actionButtons.details.push(`❌ ${btn.text} link failed (${testResponse.status()})`);
                    }
                    
                    // Go back to catalog page
                    await page.goBack({ waitUntil: 'networkidle2' });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } else if (btn.onclick) {
                    // Test onclick functions
                    console.log(`   Testing onclick: ${btn.onclick}`);
                    
                    const clickResult = await page.evaluate((buttonIndex) => {
                        try {
                            const buttons = Array.from(document.querySelectorAll('a[href*="preview"], a[onclick*="border"], a[onclick*="delete"], button[onclick*="border"], button[onclick*="delete"]'));
                            const button = buttons[buttonIndex];
                            
                            if (button.onclick) {
                                button.click();
                                return { success: true, message: 'Click executed' };
                            } else {
                                return { success: false, message: 'No onclick function' };
                            }
                        } catch (error) {
                            return { success: false, message: error.message };
                        }
                    }, i);
                    
                    if (clickResult.success) {
                        console.log(`   ✅ Onclick works: ${clickResult.message}`);
                        results.actionButtons.details.push(`✅ ${btn.text} onclick works`);
                        buttonTestsPassed++;
                    } else {
                        console.log(`   ❌ Onclick failed: ${clickResult.message}`);
                        results.actionButtons.details.push(`❌ ${btn.text} onclick failed: ${clickResult.message}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.log(`   ⚠️  No testable action found`);
                    results.actionButtons.details.push(`⚠️ ${btn.text} has no testable action`);
                }
                
            } catch (error) {
                console.log(`   ❌ Test failed: ${error.message}`);
                results.actionButtons.details.push(`❌ ${btn.text} test failed: ${error.message}`);
            }
        }
        
        results.actionButtons.passed = buttonTestsPassed === actionButtons.length && actionButtons.length > 0;
        console.log(`📈 Action Buttons: ${buttonTestsPassed}/${actionButtons.length} working`);
        
        // TEST 3: JAVASCRIPT FUNCTIONALITY
        console.log('\n⚙️ TEST 3: JAVASCRIPT FUNCTIONALITY');
        console.log('===================================');
        
        const jsValidation = await page.evaluate(() => {
            const checks = {
                productImageClient: typeof window.productImageClient !== 'undefined',
                productImageClientClass: typeof window.ProductImageUrlClient !== 'undefined',
                jquery: typeof $ !== 'undefined',
                fixProductImages: typeof window.fixProductImages === 'function',
                borderModalFunction: typeof window.showBorderModal === 'function' || typeof window.borderModal === 'function',
                deleteFunction: typeof window.deletePreview === 'function' || typeof window.confirmDelete === 'function'
            };
            
            return {
                checks,
                windowObjects: Object.keys(window).filter(key => key.includes('product') || key.includes('image') || key.includes('border') || key.includes('delete')),
                documentReady: document.readyState
            };
        });
        
        console.log('JavaScript Environment Checks:');
        Object.entries(jsValidation.checks).forEach(([key, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${key}: ${value}`);
            results.javascript.details.push(`${status} ${key}: ${value}`);
        });
        
        console.log(`📋 Available window objects: ${jsValidation.windowObjects.join(', ')}`);
        console.log(`📄 Document ready state: ${jsValidation.documentReady}`);
        
        const jsPassedCount = Object.values(jsValidation.checks).filter(Boolean).length;
        results.javascript.passed = jsPassedCount >= 4; // At least 4 critical functions should work
        
        // FINAL SUMMARY
        console.log('\n🎯 FINAL TEST RESULTS');
        console.log('=====================');
        
        console.log('\n📸 IMAGE RESOLUTION:');
        results.imageResolution.details.forEach(detail => console.log(`   ${detail}`));
        console.log(`   Overall: ${results.imageResolution.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        console.log('\n🔗 ACTION BUTTONS:');
        results.actionButtons.details.forEach(detail => console.log(`   ${detail}`));
        console.log(`   Overall: ${results.actionButtons.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        console.log('\n⚙️ JAVASCRIPT:');
        results.javascript.details.forEach(detail => console.log(`   ${detail}`));
        console.log(`   Overall: ${results.javascript.passed ? '✅ PASSED' : '❌ FAILED'}`);
        
        console.log('\n❌ ERRORS DETECTED:');
        if (errors.length === 0) {
            console.log('   ✅ No errors detected');
        } else {
            errors.forEach(error => console.log(`   ${error}`));
        }
        
        // Overall verdict
        const allPassed = results.imageResolution.passed && results.actionButtons.passed && results.javascript.passed && errors.length === 0;
        results.overall.passed = allPassed;
        
        console.log('\n🏆 OVERALL VERDICT');
        console.log('==================');
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED - CATALOG IS FULLY FUNCTIONAL!');
            results.overall.summary = 'All tests passed - catalog is fully functional';
        } else {
            console.log('❌ TESTS FAILED - CATALOG HAS BUGS THAT NEED FIXING');
            results.overall.summary = 'Tests failed - catalog has bugs';
            
            console.log('\n🔧 REQUIRED FIXES:');
            if (!results.imageResolution.passed) console.log('   - Fix image resolution system');
            if (!results.actionButtons.passed) console.log('   - Fix action button functionality');
            if (!results.javascript.passed) console.log('   - Fix JavaScript errors/missing functions');
            if (errors.length > 0) console.log('   - Fix browser errors and failed requests');
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser staying open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        return results;
        
    } catch (error) {
        console.error('❌ Comprehensive test failed:', error);
        results.overall.passed = false;
        results.overall.summary = `Test failed: ${error.message}`;
        return results;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
comprehensiveCatalogTest().then(results => {
    console.log('\n📊 FINAL RESULTS SUMMARY:');
    console.log('=========================');
    console.log(`Image Resolution: ${results.imageResolution.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Action Buttons: ${results.actionButtons.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`JavaScript: ${results.javascript.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Overall: ${results.overall.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`Summary: ${results.overall.summary}`);
    
    process.exit(results.overall.passed ? 0 : 1);
});