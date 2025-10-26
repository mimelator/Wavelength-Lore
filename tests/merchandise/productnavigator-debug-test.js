#!/usr/bin/env node

/**
 * ProductNavigator Debug Test
 * Diagnose why full catalog isn't loading
 */

const puppeteer = require('puppeteer');

async function debugProductNavigator() {
    console.log('🔍 Debugging ProductNavigator Loading Issue\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    try {
        // Capture console errors
        const consoleMessages = [];
        page.on('console', (msg) => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });
        
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Select an image to trigger navigator
        console.log('🖼️ Selecting image to trigger ProductNavigator...');
        await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) selectBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check ProductNavigator status
        const navigatorStatus = await page.evaluate(() => {
            return {
                productNavigatorClass: typeof ProductNavigator !== 'undefined',
                navigatorContainer: !!document.getElementById('product-navigator'),
                navigatorElement: !!document.querySelector('.product-navigator'),
                simpleCategories: !!document.querySelector('.simple-categories'),
                fallbackNotice: !!document.querySelector('.fallback-notice'),
                categoryCards: document.querySelectorAll('.category-card').length,
                simpleCategoryCards: document.querySelectorAll('.simple-category').length,
                merchandiseStoreInstance: !!window.merchandiseStore,
                productNavigatorInstance: window.merchandiseStore ? !!window.merchandiseStore.productNavigator : false
            };
        });
        
        // Test API call from browser
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/merchandise/product-types');
                const data = await response.json();
                return {
                    success: response.ok,
                    status: response.status,
                    categoriesCount: Object.keys(data.categories || {}).length,
                    hasSearchIndex: !!data.searchIndex,
                    error: null
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        console.log('📊 Navigator Status:');
        console.log(`   ProductNavigator Class: ${navigatorStatus.productNavigatorClass ? '✅' : '❌'}`);
        console.log(`   Navigator Container: ${navigatorStatus.navigatorContainer ? '✅' : '❌'}`);
        console.log(`   Navigator Element: ${navigatorStatus.navigatorElement ? '✅' : '❌'}`);
        console.log(`   Simple Categories: ${navigatorStatus.simpleCategories ? '✅' : '❌'}`);
        console.log(`   Fallback Notice: ${navigatorStatus.fallbackNotice ? '✅' : '❌'}`);
        console.log(`   Category Cards: ${navigatorStatus.categoryCards}`);
        console.log(`   Simple Category Cards: ${navigatorStatus.simpleCategoryCards}`);
        console.log(`   MerchandiseStore Instance: ${navigatorStatus.merchandiseStoreInstance ? '✅' : '❌'}`);
        console.log(`   ProductNavigator Instance: ${navigatorStatus.productNavigatorInstance ? '✅' : '❌'}`);
        
        console.log('\n🌐 API Test:');
        console.log(`   API Success: ${apiTest.success ? '✅' : '❌'}`);
        if (apiTest.success) {
            console.log(`   Categories: ${apiTest.categoriesCount}`);
            console.log(`   Search Index: ${apiTest.hasSearchIndex ? '✅' : '❌'}`);
        } else {
            console.log(`   Error: ${apiTest.error}`);
        }
        
        console.log('\n🖥️ Console Messages:');
        consoleMessages.forEach(msg => {
            if (msg.includes('ProductNavigator') || msg.includes('error') || msg.includes('failed')) {
                console.log(`   ${msg}`);
            }
        });
        
        // Check if ProductNavigator initialization was attempted
        const initAttempt = await page.evaluate(() => {
            // Look for any evidence of ProductNavigator initialization
            const logs = [];
            
            // Check if initializeProductNavigator was called
            if (window.merchandiseStore && window.merchandiseStore.initializeProductNavigator) {
                logs.push('initializeProductNavigator method exists');
            }
            
            // Check container content
            const container = document.getElementById('product-navigator');
            if (container) {
                logs.push(`Container content: ${container.innerHTML.substring(0, 100)}...`);
            }
            
            return logs;
        });
        
        console.log('\n🔧 Initialization Details:');
        initAttempt.forEach(log => console.log(`   ${log}`));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return {
            usingFallback: navigatorStatus.simpleCategories && !navigatorStatus.navigatorElement,
            apiWorking: apiTest.success,
            classAvailable: navigatorStatus.productNavigatorClass
        };
        
    } catch (error) {
        console.log(`❌ Debug Error: ${error.message}`);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    debugProductNavigator()
        .then(result => {
            console.log('\n📋 Summary:');
            if (result.usingFallback) {
                console.log('❌ ProductNavigator falling back to simple categories');
            }
            if (result.apiWorking) {
                console.log('✅ API is working correctly');
            }
            if (result.classAvailable) {
                console.log('✅ ProductNavigator class is available');
            }
        })
        .catch(console.error);
}

module.exports = { debugProductNavigator };