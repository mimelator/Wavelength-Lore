#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugJavaScriptErrors() {
    console.log('🔍 Debugging JavaScript Errors in Merchandise Store');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Capture console logs and errors
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            logs.push(`${msg.type()}: ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            errors.push(`PAGE ERROR: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            errors.push(`FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
        });
        
        console.log('🔗 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('\n📋 CONSOLE LOGS:');
        logs.forEach(log => console.log(`   ${log}`));
        
        console.log('\n❌ ERRORS:');
        if (errors.length === 0) {
            console.log('   ✅ No errors detected');
        } else {
            errors.forEach(error => console.log(`   ${error}`));
        }
        
        // Check DOM state
        const domState = await page.evaluate(() => {
            return {
                merchandiseStoreExists: !!document.getElementById('merchandise-store'),
                merchandiseStoreClass: typeof MerchandiseStore,
                productNavigatorClass: typeof ProductNavigator,
                storeContent: document.getElementById('merchandise-store')?.innerHTML?.substring(0, 500) + '...',
                hasLoadingSpinner: !!document.querySelector('.loading-spinner'),
                hasErrorMessage: !!document.querySelector('.error-message')
            };
        });
        
        console.log('\n🏗️ DOM STATE:');
        console.log(`   Container exists: ${domState.merchandiseStoreExists}`);
        console.log(`   MerchandiseStore class: ${domState.merchandiseStoreClass}`);
        console.log(`   ProductNavigator class: ${domState.productNavigatorClass}`);
        console.log(`   Has loading spinner: ${domState.hasLoadingSpinner}`);
        console.log(`   Has error message: ${domState.hasErrorMessage}`);
        console.log(`   Store content preview: ${domState.storeContent}`);
        
        console.log('\n🔍 Browser kept open for inspection. Press Ctrl+C when done.');
        await new Promise(() => {}); // Keep open
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (browser) await browser.close();
    }
}

debugJavaScriptErrors().catch(console.error);