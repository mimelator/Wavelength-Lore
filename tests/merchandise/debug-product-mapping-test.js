#!/usr/bin/env node

/**
 * Debug Product Mapping Test - Capture console logs to debug product type mapping
 */

const puppeteer = require('puppeteer');

async function testProductMapping() {
    console.log('🧪 Debug Product Mapping Test - Capturing Console Logs\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        console.log(`🖥️ CONSOLE: ${text}`);
    });
    
    try {
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Select an image
        const imageSelected = await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) {
                selectBtn.click();
                return true;
            }
            return false;
        });
        
        if (imageSelected) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Navigate to pillows
            console.log('\n🏠 Navigating to Home & Living > Pillows...');
            
            await page.evaluate(() => {
                const homeCategory = document.querySelector('[data-category="home"]');
                if (homeCategory) homeCategory.click();
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.evaluate(() => {
                const pillowSubcategory = document.querySelector('[data-subcategory="bedding"]');
                if (pillowSubcategory) pillowSubcategory.click();
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get the first pillow product details
            const pillowProduct = await page.evaluate(() => {
                const firstProduct = document.querySelector('.product-card');
                if (firstProduct) {
                    return {
                        title: firstProduct.querySelector('.product-title')?.textContent,
                        blueprint: firstProduct.dataset.blueprint,
                        provider: firstProduct.dataset.provider
                    };
                }
                return null;
            });
            
            console.log(`\n🛏️ First pillow product: ${pillowProduct?.title} (Blueprint: ${pillowProduct?.blueprint})`);
            
            // Click the pillow product and capture all console logs
            console.log('\n🚀 Clicking pillow product - watching console logs...');
            
            await page.evaluate(() => {
                const selectBtn = document.querySelector('.select-product-btn');
                if (selectBtn) selectBtn.click();
            });
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Get modal info
            const modalInfo = await page.evaluate(() => {
                const modal = document.querySelector('.product-customization-modal');
                if (modal) {
                    return {
                        found: true,
                        title: modal.querySelector('h2')?.textContent,
                        html: modal.innerHTML.substring(0, 500)
                    };
                }
                return { found: false };
            });
            
            console.log('\n📋 Modal Result:');
            console.log(`   Found: ${modalInfo.found}`);
            if (modalInfo.found) {
                console.log(`   Title: "${modalInfo.title}"`);
                
                const isPillow = modalInfo.title.toLowerCase().includes('pillow');
                console.log(`   Contains 'pillow': ${isPillow}`);
            }
            
            // Filter and display relevant console logs
            console.log('\n📊 Relevant Console Logs:');
            const relevantLogs = consoleLogs.filter(log => 
                log.includes('Product selected from navigator') ||
                log.includes('Mapped product type') ||
                log.includes('showProductCustomizationModal') ||
                log.includes('productType:') ||
                log.includes('productTypeName') ||
                log.includes('blueprint')
            );
            
            relevantLogs.forEach((log, i) => {
                console.log(`   ${i + 1}. ${log}`);
            });
            
            if (relevantLogs.length === 0) {
                console.log('   ⚠️ No relevant debug logs found');
                console.log('\n📋 All Console Logs:');
                consoleLogs.forEach((log, i) => {
                    console.log(`   ${i + 1}. ${log}`);
                });
            }
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: 'debug-product-mapping-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: debug-product-mapping-proof.png');
        
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
    testProductMapping()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductMapping };