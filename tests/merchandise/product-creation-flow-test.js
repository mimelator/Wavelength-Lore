#!/usr/bin/env node

/**
 * Product Creation Flow Test - Trace what happens when creating different product types
 */

const puppeteer = require('puppeteer');

async function testProductCreationFlow() {
    console.log('🧪 Testing Product Creation Flow - Tracing Product Type Data\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    // Intercept network requests to see what's being sent to the API
    const apiCalls = [];
    page.on('request', request => {
        if (request.url().includes('/api/merchandise/create-product')) {
            const postData = request.postData();
            apiCalls.push({
                url: request.url(),
                method: request.method(),
                data: postData ? JSON.parse(postData) : null
            });
            console.log('🌐 API Call intercepted:', {
                url: request.url(),
                method: request.method(),
                data: postData ? JSON.parse(postData) : null
            });
        }
    });
    
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
        
        // Look for any product selection buttons
        const availableButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons
                .filter(btn => btn.textContent.toLowerCase().includes('select') || 
                              btn.dataset.product || 
                              btn.dataset.blueprint)
                .map(btn => ({
                    text: btn.textContent.trim(),
                    dataset: btn.dataset,
                    className: btn.className
                }));
        });
        
        console.log('\n🔍 Available product selection buttons:');
        availableButtons.forEach((btn, i) => {
            console.log(`   ${i + 1}. "${btn.text}"`);
            console.log(`      Dataset:`, btn.dataset);
            console.log(`      Class: ${btn.className}`);
        });
        
        // Try to select a non-t-shirt product if available
        const nonTshirtBtn = availableButtons.find(btn => 
            btn.text.toLowerCase().includes('pillow') ||
            btn.text.toLowerCase().includes('hoodie') ||
            btn.text.toLowerCase().includes('mug') ||
            btn.dataset.product !== 'premium-tshirt'
        );
        
        if (nonTshirtBtn) {
            console.log(`\n🎯 Attempting to select: ${nonTshirtBtn.text}`);
            
            const clicked = await page.evaluate((btnText) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const targetBtn = buttons.find(btn => btn.textContent.trim() === btnText);
                if (targetBtn) {
                    targetBtn.click();
                    return true;
                }
                return false;
            }, nonTshirtBtn.text);
            
            if (clicked) {
                console.log('✅ Button clicked, waiting for modal...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if customization modal opened
                const modalInfo = await page.evaluate(() => {
                    const modal = document.querySelector('.product-customization-modal');
                    if (modal) {
                        const title = modal.querySelector('h2')?.textContent;
                        const createBtn = modal.querySelector('#createProductBtn');
                        return {
                            found: true,
                            title: title,
                            buttonText: createBtn?.textContent
                        };
                    }
                    return { found: false };
                });
                
                console.log('📋 Modal info:', modalInfo);
                
                if (modalInfo.found) {
                    console.log('🚀 Attempting to create product...');
                    
                    // Click the create button
                    await page.evaluate(() => {
                        const createBtn = document.querySelector('#createProductBtn');
                        if (createBtn) createBtn.click();
                    });
                    
                    // Wait for API call
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    console.log('\n📡 API Calls Made:');
                    apiCalls.forEach((call, i) => {
                        console.log(`   ${i + 1}. ${call.method} ${call.url}`);
                        console.log('      Data sent:', JSON.stringify(call.data, null, 2));
                    });
                }
            }
        } else {
            console.log('\n⚠️ No non-t-shirt products found to test');
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'product-creation-flow-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: product-creation-flow-proof.png');
        
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
    testProductCreationFlow()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductCreationFlow };