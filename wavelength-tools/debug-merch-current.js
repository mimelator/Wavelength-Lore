#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugMerchandiseStore() {
    console.log('🛍️ Debugging Current Merchandise Store State');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null 
        });
        
        const page = await browser.newPage();
        
        // Monitor network requests
        const apiCalls = [];
        page.on('response', response => {
            if (response.url().includes('merchandise') || response.url().includes('product')) {
                apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        console.log('🔗 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for page to fully load
        await page.waitForFunction(() => document.readyState === 'complete');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check what's actually displayed
        const pageAnalysis = await page.evaluate(() => {
            const results = {
                productNavigatorLoaded: false,
                visibleProducts: [],
                categories: [],
                errors: [],
                fallbackActive: false
            };
            
            // Check if ProductNavigator loaded
            if (window.productNavigator) {
                results.productNavigatorLoaded = true;
                results.productNavigatorData = window.productNavigator.productTypes ? 
                    Object.keys(window.productNavigator.productTypes) : [];
            }
            
            // Check visible product elements
            const productElements = document.querySelectorAll('.product-item, .product-card, [data-product-id]');
            productElements.forEach(el => {
                const productName = el.querySelector('.product-name, .product-title, h3, h4')?.textContent?.trim();
                const productId = el.dataset.productId || el.id;
                if (productName || productId) {
                    results.visibleProducts.push({
                        name: productName || 'Unknown',
                        id: productId || 'no-id',
                        element: el.tagName
                    });
                }
            });
            
            // Check category buttons/tabs
            const categoryElements = document.querySelectorAll('.category-btn, .category-tab, [data-category]');
            categoryElements.forEach(el => {
                results.categories.push({
                    text: el.textContent?.trim(),
                    category: el.dataset.category,
                    active: el.classList.contains('active')
                });
            });
            
            // Check for fallback indicators
            const fallbackIndicators = document.querySelectorAll('.fallback-products, .simple-categories');
            results.fallbackActive = fallbackIndicators.length > 0;
            
            // Check console errors
            if (window.console && window.console.error) {
                results.errors = window.consoleErrors || [];
            }
            
            return results;
        });
        
        console.log('\n📊 MERCHANDISE STORE ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('🔌 API Calls Made:');
        apiCalls.forEach(call => {
            console.log(`   ${call.status} ${call.url}`);
        });
        
        console.log(`\n🎯 ProductNavigator Loaded: ${pageAnalysis.productNavigatorLoaded ? '✅' : '❌'}`);
        if (pageAnalysis.productNavigatorData) {
            console.log(`   Available Categories: ${pageAnalysis.productNavigatorData.join(', ')}`);
        }
        
        console.log(`\n🛍️ Visible Products (${pageAnalysis.visibleProducts.length}):`);
        pageAnalysis.visibleProducts.forEach(product => {
            console.log(`   • ${product.name} (${product.id})`);
        });
        
        console.log(`\n📂 Category Controls (${pageAnalysis.categories.length}):`);
        pageAnalysis.categories.forEach(cat => {
            console.log(`   • ${cat.text} ${cat.active ? '(ACTIVE)' : ''}`);
        });
        
        console.log(`\n⚠️ Fallback Mode: ${pageAnalysis.fallbackActive ? '❌ Active' : '✅ Not Active'}`);
        
        if (pageAnalysis.errors.length > 0) {
            console.log(`\n❌ JavaScript Errors:`);
            pageAnalysis.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('Press Ctrl+C to close when done.');
        
        // Wait indefinitely
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugMerchandiseStore().catch(console.error);