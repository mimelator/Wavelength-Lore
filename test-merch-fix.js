#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testMerchandiseFix() {
    console.log('🧪 Testing Merchandise Store Fix');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        console.log('🔗 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for store to initialize
        await page.waitForFunction(() => document.readyState === 'complete');
        await new Promise(resolve => setTimeout(resolve, 8000)); // Wait for full initialization
        
        // Check what products are visible
        const results = await page.evaluate(() => {
            const productCards = document.querySelectorAll('.simple-category, .category-card');
            const products = [];
            
            productCards.forEach(card => {
                const title = card.querySelector('h4, h3, .category-name')?.textContent?.trim();
                if (title) {
                    products.push(title);
                }
            });
            
            return {
                totalProducts: products.length,
                products: products,
                hasNavigator: !!document.querySelector('.product-navigator'),
                hasSimpleCategories: !!document.querySelector('.simple-categories'),
                hasFallbackNotice: !!document.querySelector('.fallback-notice'),
                hasErrorNotice: !!document.querySelector('.error-notice')
            };
        });
        
        console.log('\n📊 TEST RESULTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log(`🎯 ProductNavigator: ${results.hasNavigator ? '✅ Active' : '❌ Not Found'}`);
        console.log(`📦 Simple Categories: ${results.hasSimpleCategories ? '✅ Active' : '❌ Not Active'}`);
        console.log(`⚠️ Fallback Notice: ${results.hasFallbackNotice ? '🚧 Showing' : '✅ Hidden'}`);
        console.log(`❌ Error Notice: ${results.hasErrorNotice ? '🚨 Showing' : '✅ Hidden'}`);
        
        console.log(`\n🛍️ Visible Products (${results.totalProducts}):`);
        results.products.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product}`);
        });
        
        // Analyze results
        const onlyTshirts = results.products.every(p => 
            p.toLowerCase().includes('t-shirt') || 
            p.toLowerCase().includes('tee') ||
            p.toLowerCase().includes('shirt')
        );
        
        const hasVariety = results.products.some(p => 
            p.toLowerCase().includes('hoodie') ||
            p.toLowerCase().includes('mug') ||
            p.toLowerCase().includes('pillow')
        );
        
        console.log('\n🔍 ANALYSIS:');
        if (results.totalProducts === 0) {
            console.log('❌ FAIL: No products visible');
        } else if (onlyTshirts && results.totalProducts > 0) {
            console.log('❌ FAIL: Only t-shirts visible (original issue persists)');
        } else if (hasVariety && results.totalProducts >= 3) {
            console.log('✅ PASS: Multiple product types visible');
        } else {
            console.log('⚠️ PARTIAL: Some products visible but may need verification');
        }
        
        await browser.close();
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (browser) await browser.close();
    }
}

testMerchandiseFix().catch(console.error);