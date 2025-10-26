#!/usr/bin/env node

/**
 * Product Type Test - Diagnose why all products show as shirts
 */

const puppeteer = require('puppeteer');

async function testProductTypes() {
    console.log('🧪 Testing Product Type Detection and Display\n');
    
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
        
        // Select an image first
        const imageSelected = await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) {
                selectBtn.click();
                return true;
            }
            return false;
        });
        
        if (!imageSelected) {
            console.log('❌ No image to select');
            return false;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test different product types
        const productTypes = [
            { name: 'Pillow', selector: '[data-product*="pillow"], [data-blueprint="68"]' },
            { name: 'Poster', selector: '[data-product*="poster"], [data-blueprint="19"]' },
            { name: 'Hoodie', selector: '[data-product*="hoodie"], [data-blueprint="146"]' },
            { name: 'T-Shirt', selector: '[data-product*="tshirt"], [data-blueprint="5"]' }
        ];
        
        for (const productType of productTypes) {
            console.log(`\n🎯 Testing ${productType.name}...`);
            
            // Click the product type
            const productSelected = await page.evaluate((selector) => {
                const btn = document.querySelector(selector);
                if (btn) {
                    console.log('Found button:', btn.textContent, btn.dataset);
                    btn.click();
                    return {
                        found: true,
                        text: btn.textContent,
                        dataset: btn.dataset
                    };
                }
                return { found: false };
            }, productType.selector);
            
            if (productSelected.found) {
                console.log(`   ✅ Selected ${productType.name}: ${productSelected.text}`);
                console.log(`   📊 Button data:`, productSelected.dataset);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check what gets passed to the API
                const apiData = await page.evaluate(() => {
                    // Check if customization modal opened
                    const modal = document.querySelector('.product-customization-modal');
                    if (modal) {
                        const title = modal.querySelector('h2')?.textContent;
                        return { modalTitle: title, modalFound: true };
                    }
                    return { modalFound: false };
                });
                
                console.log(`   📋 Modal result:`, apiData);
                
                // Close modal if it opened
                await page.evaluate(() => {
                    const closeBtn = document.querySelector('.modal .close');
                    if (closeBtn) closeBtn.click();
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log(`   ❌ Could not find ${productType.name} button`);
            }
        }
        
        // Check existing products to see their types
        console.log('\n📦 Checking existing products...');
        const existingProducts = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll('.product-card'));
            return products.map(card => {
                const title = card.querySelector('h4')?.textContent;
                const typeIcon = card.querySelector('.product-type-icon')?.textContent;
                const typeName = card.querySelector('.product-type-name')?.textContent;
                const variants = Array.from(card.querySelectorAll('.variant-summary')).map(v => v.textContent);
                
                return {
                    title,
                    typeIcon,
                    typeName,
                    variants: variants.length > 0 ? variants : ['No variants shown']
                };
            });
        });
        
        console.log('\n📊 Existing Products Analysis:');
        existingProducts.forEach((product, i) => {
            console.log(`   ${i + 1}. "${product.title}"`);
            console.log(`      Icon: ${product.typeIcon} | Type: ${product.typeName}`);
            console.log(`      Variants: ${product.variants.join(', ')}`);
        });
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'product-type-test-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: product-type-test-proof.png');
        
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
    testProductTypes()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductTypes };