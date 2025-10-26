#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugProductTypes() {
    console.log('🔍 Debugging Product Types Loading');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Capture all network requests
        const requests = [];
        page.on('request', request => {
            if (request.url().includes('merchandise') || request.url().includes('product')) {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Capture responses
        const responses = [];
        page.on('response', response => {
            if (response.url().includes('merchandise') || response.url().includes('product')) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        console.log('🔗 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check what happened with product types loading
        const debugInfo = await page.evaluate(() => {
            return {
                merchandiseStoreExists: !!window.merchandiseStore,
                productTypes: window.merchandiseStore?.productTypes,
                availableProducts: window.merchandiseStore?.availableProducts,
                productNavigatorExists: !!window.merchandiseStore?.productNavigator,
                hasSimpleCategories: !!document.querySelector('.simple-categories'),
                hasErrorNotice: !!document.querySelector('.error-notice'),
                containerContent: document.getElementById('product-navigator')?.innerHTML?.substring(0, 500)
            };
        });
        
        console.log('\n📊 DEBUG RESULTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('🌐 Network Requests:');
        requests.forEach(req => {
            console.log(`   ${req.method} ${req.url}`);
        });
        
        console.log('\n📡 Network Responses:');
        responses.forEach(res => {
            console.log(`   ${res.status} ${res.statusText} - ${res.url}`);
        });
        
        console.log('\n🏗️ JavaScript State:');
        console.log(`   MerchandiseStore exists: ${debugInfo.merchandiseStoreExists}`);
        console.log(`   ProductTypes loaded: ${debugInfo.productTypes ? Object.keys(debugInfo.productTypes).length : 0} categories`);
        console.log(`   Available products: ${debugInfo.availableProducts?.length || 0}`);
        console.log(`   ProductNavigator exists: ${debugInfo.productNavigatorExists}`);
        console.log(`   Has simple categories: ${debugInfo.hasSimpleCategories}`);
        console.log(`   Has error notice: ${debugInfo.hasErrorNotice}`);
        
        if (debugInfo.productTypes) {
            console.log('\n📦 Product Types Detail:');
            Object.entries(debugInfo.productTypes).forEach(([key, category]) => {
                console.log(`   ${key}: ${category.name} (${category.products?.length || 0} products)`);
            });
        }
        
        console.log('\n🔍 Container Content Preview:');
        console.log(debugInfo.containerContent || 'No content');
        
        console.log('\n🔍 Browser kept open for inspection. Press Ctrl+C when done.');
        await new Promise(() => {}); // Keep open
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (browser) await browser.close();
    }
}

debugProductTypes().catch(console.error);