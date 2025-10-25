#!/usr/bin/env node

/**
 * ProductNavigator Live Test
 * Demonstrates working tiered product catalog system
 */

const puppeteer = require('puppeteer');

async function testProductNavigatorLive() {
    console.log('🧪 ProductNavigator Live Demonstration Test\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    try {
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        console.log('⏳ Waiting for page initialization...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if ProductNavigator loaded
        console.log('🔍 Checking ProductNavigator status...');
        const navigatorStatus = await page.evaluate(() => {
            return {
                productNavigatorExists: !!document.querySelector('.product-navigator'),
                simpleCategoriesExists: !!document.querySelector('.simple-categories'),
                categoryCount: document.querySelectorAll('.category-card, .simple-category').length,
                hasProductNavigatorClass: typeof ProductNavigator !== 'undefined',
                hasMerchandiseStore: typeof MerchandiseStore !== 'undefined'
            };
        });
        
        console.log('📊 Navigator Status:');
        console.log(`   ProductNavigator Class: ${navigatorStatus.hasProductNavigatorClass ? '✅' : '❌'}`);
        console.log(`   MerchandiseStore Class: ${navigatorStatus.hasMerchandiseStore ? '✅' : '❌'}`);
        console.log(`   Navigator Element: ${navigatorStatus.productNavigatorExists ? '✅' : '❌'}`);
        console.log(`   Simple Categories: ${navigatorStatus.simpleCategoriesExists ? '✅' : '❌'}`);
        console.log(`   Categories Loaded: ${navigatorStatus.categoryCount}`);
        
        if (navigatorStatus.categoryCount === 0) {
            console.log('⚠️ No categories found. Checking for gallery images...');
            
            // Try to select an image to trigger navigator
            const imageSelected = await page.evaluate(() => {
                const selectBtn = document.querySelector('.gallery-image-select');
                if (selectBtn) {
                    selectBtn.click();
                    return true;
                }
                return false;
            });
            
            if (imageSelected) {
                console.log('🖼️ Image selected, waiting for navigator...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const updatedStatus = await page.evaluate(() => ({
                    categoryCount: document.querySelectorAll('.category-card, .simple-category').length,
                    navigatorVisible: !!document.querySelector('.product-navigator, .simple-categories')
                }));
                
                console.log(`   Updated Categories: ${updatedStatus.categoryCount}`);
                console.log(`   Navigator Visible: ${updatedStatus.navigatorVisible ? '✅' : '❌'}`);
            }
        }
        
        // Test API endpoint directly
        console.log('\n🌐 Testing API endpoint...');
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/product-catalog');
                const data = await response.json();
                return {
                    success: response.ok,
                    categories: Object.keys(data.categories || {}).length,
                    totalProducts: data.totalProducts || 0
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log(`   API Response: ${apiResponse.success ? '✅' : '❌'}`);
        if (apiResponse.success) {
            console.log(`   Categories: ${apiResponse.categories}`);
            console.log(`   Products: ${apiResponse.totalProducts}`);
        } else {
            console.log(`   Error: ${apiResponse.error}`);
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'productnavigator-test-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: productnavigator-test-proof.png');
        
        // Check final status after image selection
        const finalStatus = await page.evaluate(() => ({
            categoryCount: document.querySelectorAll('.category-card, .simple-category').length,
            navigatorVisible: !!document.querySelector('.product-navigator, .simple-categories')
        }));
        
        const success = (navigatorStatus.productNavigatorExists || navigatorStatus.simpleCategoriesExists || finalStatus.navigatorVisible) && 
                       (navigatorStatus.categoryCount > 0 || finalStatus.categoryCount > 0) && 
                       apiResponse.success;
        
        console.log(`\n${success ? '✅' : '❌'} ProductNavigator Live Test ${success ? 'PASSED' : 'FAILED'}`);
        
        if (success) {
            console.log('\n🎉 ProductNavigator is working correctly!');
            console.log('   - Tiered product catalog loaded');
            console.log('   - Categories are displaying');
            console.log('   - API endpoint is functional');
        }
        
        // Keep browser open for 5 seconds to show results
        console.log('\n⏳ Keeping browser open for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return success;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

// Run test if called directly
if (require.main === module) {
    testProductNavigatorLive()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductNavigatorLive };