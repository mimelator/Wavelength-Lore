/**
 * Debug Merchandise Page
 * Investigates why ProductNavigator isn't loading
 */

const puppeteer = require('puppeteer');

async function debugMerchandisePage() {
    console.log('🔍 Debug Merchandise Page');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => console.log('🖥️  CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));
    
    try {
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait a bit for JavaScript to execute
        await page.waitForTimeout(3000);
        
        // Check page title and basic structure
        const title = await page.title();
        console.log(`📄 Page Title: ${title}`);
        
        // Check for key elements
        const elements = await page.evaluate(() => {
            return {
                productNavigator: !!document.querySelector('.product-navigator'),
                merchandiseStore: !!document.querySelector('#merchandise-store'),
                scriptTags: document.querySelectorAll('script[src*="merchandise"]').length,
                categories: document.querySelectorAll('.category-item').length,
                products: document.querySelectorAll('.product-card').length,
                variants: document.querySelectorAll('.variant-summary').length
            };
        });
        
        console.log('🔍 Element Analysis:');
        Object.entries(elements).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        
        // Check JavaScript errors
        const jsErrors = await page.evaluate(() => {
            return window.jsErrors || [];
        });
        
        if (jsErrors.length > 0) {
            console.log('❌ JavaScript Errors:');
            jsErrors.forEach(error => console.log(`  ${error}`));
        }
        
        // Keep browser open for manual inspection
        console.log('🔍 Browser opened for manual inspection. Press Ctrl+C to close.');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.log(`❌ Debug Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

debugMerchandisePage();