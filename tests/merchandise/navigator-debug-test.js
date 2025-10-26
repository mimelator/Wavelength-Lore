#!/usr/bin/env node

/**
 * Navigator Debug Test - Check if ProductNavigator is loading the tiered catalog
 */

const puppeteer = require('puppeteer');

async function testNavigatorDebug() {
    console.log('🧪 Testing ProductNavigator Debug - Checking Tiered Catalog\n');
    
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
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Select an image to trigger navigator
        const imageSelected = await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) {
                selectBtn.click();
                return true;
            }
            return false;
        });
        
        if (imageSelected) {
            console.log('✅ Image selected, waiting for navigator...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check navigator state
            const navigatorState = await page.evaluate(() => {
                const container = document.getElementById('product-navigator');
                const categories = document.querySelectorAll('.category-card');
                const simpleCategories = document.querySelectorAll('.simple-category');
                const fallbackNotice = document.querySelector('.fallback-notice');
                
                return {
                    containerExists: !!container,
                    containerHTML: container ? container.innerHTML.substring(0, 500) : 'Not found',
                    categoryCount: categories.length,
                    simpleCategoryCount: simpleCategories.length,
                    hasFallbackNotice: !!fallbackNotice,
                    fallbackText: fallbackNotice ? fallbackNotice.textContent : null
                };
            });
            
            console.log('\n📊 Navigator State:');
            console.log(`   Container exists: ${navigatorState.containerExists}`);
            console.log(`   Category cards: ${navigatorState.categoryCount}`);
            console.log(`   Simple categories: ${navigatorState.simpleCategoryCount}`);
            console.log(`   Has fallback notice: ${navigatorState.hasFallbackNotice}`);
            if (navigatorState.fallbackText) {
                console.log(`   Fallback text: "${navigatorState.fallbackText}"`);
            }
            
            // Check if ProductNavigator class is available
            const navigatorAvailable = await page.evaluate(() => {
                return typeof ProductNavigator !== 'undefined';
            });
            
            console.log(`   ProductNavigator class available: ${navigatorAvailable}`);
            
            // Check API endpoint
            console.log('\n🌐 Testing product catalog API...');
            const apiResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/merchandise/product-types');
                    const data = await response.json();
                    return {
                        success: response.ok,
                        status: response.status,
                        data: data
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            console.log('   API Response:', apiResponse.success ? '✅' : '❌');
            if (apiResponse.success) {
                console.log(`   Categories: ${Object.keys(apiResponse.data.categories || {}).length}`);
                console.log(`   Total products: ${apiResponse.data.totalProducts || 0}`);
            } else {
                console.log(`   Error: ${apiResponse.error || apiResponse.status}`);
            }
            
            // Look for any product selection buttons
            const productButtons = await page.evaluate(() => {
                const allButtons = Array.from(document.querySelectorAll('button'));
                return allButtons
                    .filter(btn => 
                        btn.dataset.product || 
                        btn.dataset.blueprint ||
                        btn.classList.contains('select-product-btn') ||
                        btn.classList.contains('select-simple-product')
                    )
                    .map(btn => ({
                        text: btn.textContent.trim(),
                        dataset: btn.dataset,
                        classes: btn.className
                    }));
            });
            
            console.log('\n🎯 Product Selection Buttons Found:');
            if (productButtons.length > 0) {
                productButtons.forEach((btn, i) => {
                    console.log(`   ${i + 1}. "${btn.text}"`);
                    console.log(`      Dataset: ${JSON.stringify(btn.dataset)}`);
                    console.log(`      Classes: ${btn.classes}`);
                });
            } else {
                console.log('   ❌ No product selection buttons found');
            }
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'navigator-debug-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: navigator-debug-proof.png');
        
        console.log('\n⏳ Keeping browser open for 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return true;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testNavigatorDebug()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNavigatorDebug };