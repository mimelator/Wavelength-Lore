#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugCurrentMerchandise() {
    console.log('🔍 Debugging Current Merchandise Store Display');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null 
        });
        
        const page = await browser.newPage();
        
        console.log('🔗 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for page to fully load
        await page.waitForFunction(() => document.readyState === 'complete');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for everything to load
        
        // Check what products are actually visible
        const analysis = await page.evaluate(() => {
            const results = {
                productNavigatorExists: !!document.querySelector('.product-navigator'),
                simpleCategoriesExists: !!document.querySelector('.simple-categories'),
                fallbackNoticeExists: !!document.querySelector('.fallback-notice'),
                visibleProductCards: [],
                categoryButtons: [],
                apiCalls: []
            };
            
            // Check for product cards/categories
            const productCards = document.querySelectorAll('.simple-category, .category-card, .product-card');
            productCards.forEach(card => {
                const title = card.querySelector('h4, h3, .category-name, .product-title')?.textContent?.trim();
                const button = card.querySelector('button')?.textContent?.trim();
                const price = card.querySelector('.product-price, .price-value')?.textContent?.trim();
                
                results.visibleProductCards.push({
                    title: title || 'No title',
                    button: button || 'No button',
                    price: price || 'No price',
                    className: card.className
                });
            });
            
            // Check for category buttons
            const categoryBtns = document.querySelectorAll('.select-simple-product, .select-product-btn');
            categoryBtns.forEach(btn => {
                results.categoryButtons.push({
                    text: btn.textContent?.trim(),
                    productType: btn.dataset.product,
                    blueprint: btn.dataset.blueprint,
                    provider: btn.dataset.provider
                });
            });
            
            return results;
        });
        
        console.log('\n📊 CURRENT MERCHANDISE STORE STATE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log(`🎯 ProductNavigator: ${analysis.productNavigatorExists ? '✅ Loaded' : '❌ Not Found'}`);
        console.log(`📦 Simple Categories: ${analysis.simpleCategoriesExists ? '✅ Active' : '❌ Not Active'}`);
        console.log(`⚠️ Fallback Notice: ${analysis.fallbackNoticeExists ? '🚧 Showing' : '✅ Hidden'}`);
        
        console.log(`\n🛍️ Visible Products/Categories (${analysis.visibleProductCards.length}):`);
        analysis.visibleProductCards.forEach((card, index) => {
            console.log(`   ${index + 1}. ${card.title} - ${card.button} - ${card.price}`);
        });
        
        console.log(`\n🔘 Category Buttons (${analysis.categoryButtons.length}):`);
        analysis.categoryButtons.forEach((btn, index) => {
            console.log(`   ${index + 1}. ${btn.text} (${btn.productType}) - Blueprint: ${btn.blueprint}`);
        });
        
        // Check if only t-shirts are showing
        const onlyTshirts = analysis.visibleProductCards.every(card => 
            card.title.toLowerCase().includes('t-shirt') || 
            card.title.toLowerCase().includes('tee') ||
            card.title.toLowerCase().includes('shirt')
        );
        
        if (onlyTshirts && analysis.visibleProductCards.length > 0) {
            console.log('\n❌ ISSUE CONFIRMED: Only T-shirts are visible!');
            
            if (analysis.fallbackNoticeExists) {
                console.log('🔍 Root cause: Fallback system is active with hardcoded products');
                console.log('💡 Solution: ProductNavigator failed to load properly');
            }
        } else if (analysis.visibleProductCards.length === 0) {
            console.log('\n❌ ISSUE: No products visible at all!');
        } else {
            console.log('\n✅ Products look good - multiple types visible');
        }
        
        // Keep browser open for inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('Check the page and press Ctrl+C when done.');
        
        // Wait indefinitely
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugCurrentMerchandise().catch(console.error);