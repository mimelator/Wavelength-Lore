#!/usr/bin/env node

/**
 * Pillow & Poster Test - Navigate to Home category to test non-t-shirt products
 */

const puppeteer = require('puppeteer');

async function testPillowPoster() {
    console.log('🧪 Testing Pillow & Poster Creation - Non-T-Shirt Products\n');
    
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
        
        // Select an image to trigger navigator
        const imageSelected = await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) {
                selectBtn.click();
                return true;
            }
            return false;
        });
        
        if (imageSelected) {
            console.log('✅ Image selected, navigating to Home & Living...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Click on Home & Living category
            const homeClicked = await page.evaluate(() => {
                const homeCategory = document.querySelector('[data-category="home"]');
                if (homeCategory) {
                    homeCategory.click();
                    return true;
                }
                return false;
            });
            
            if (homeClicked) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check subcategories in Home
                const subcategories = await page.evaluate(() => {
                    const subcategoryCards = Array.from(document.querySelectorAll('.subcategory-card'));
                    return subcategoryCards.map(card => ({
                        name: card.querySelector('.subcategory-name')?.textContent,
                        subcategory: card.dataset.subcategory,
                        productCount: card.querySelector('.product-count')?.textContent
                    }));
                });
                
                console.log('\\n🏠 Home & Living Subcategories:');
                subcategories.forEach((sub, i) => {
                    console.log(`   ${i + 1}. ${sub.name} (${sub.productCount}) - key: ${sub.subcategory}`);
                });
                
                // Look for pillows subcategory
                const pillowsSubcategory = subcategories.find(sub => 
                    sub.name.toLowerCase().includes('pillow') || 
                    sub.subcategory === 'pillows'
                );
                
                if (pillowsSubcategory) {
                    console.log(`\\n🛏️ Clicking on pillows: ${pillowsSubcategory.name}`);
                    
                    const pillowClicked = await page.evaluate((subcategoryKey) => {
                        const subcategoryCard = document.querySelector(`[data-subcategory="${subcategoryKey}"]`);
                        if (subcategoryCard) {
                            subcategoryCard.click();
                            return true;
                        }
                        return false;
                    }, pillowsSubcategory.subcategory);
                    
                    if (pillowClicked) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Check pillow products
                        const pillowProducts = await page.evaluate(() => {
                            const productCards = Array.from(document.querySelectorAll('.product-card'));
                            return productCards.map(card => ({
                                title: card.querySelector('.product-title')?.textContent,
                                blueprint: card.dataset.blueprint,
                                provider: card.dataset.provider,
                                price: card.querySelector('.product-price')?.textContent
                            }));
                        });
                        
                        console.log('\\n🛏️ Available Pillow Products:');
                        pillowProducts.forEach((prod, i) => {
                            console.log(`   ${i + 1}. ${prod.title} (${prod.price})`);
                            console.log(`      Blueprint: ${prod.blueprint}, Provider: ${prod.provider}`);
                        });
                        
                        // Click first pillow product
                        if (pillowProducts.length > 0) {
                            console.log('\\n🚀 Selecting first pillow product...');
                            
                            const pillowSelected = await page.evaluate(() => {
                                const firstBtn = document.querySelector('.select-product-btn');
                                if (firstBtn) {
                                    firstBtn.click();
                                    return true;
                                }
                                return false;
                            });
                            
                            if (pillowSelected) {
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                
                                // Check modal title
                                const modalInfo = await page.evaluate(() => {
                                    const modal = document.querySelector('.product-customization-modal');
                                    if (modal) {
                                        const title = modal.querySelector('h2')?.textContent;
                                        return { found: true, title };
                                    }
                                    return { found: false };
                                });
                                
                                console.log('\\n📋 Pillow Customization Modal:');
                                console.log(`   Found: ${modalInfo.found ? '✅' : '❌'}`);
                                if (modalInfo.found) {
                                    console.log(`   Title: "${modalInfo.title}"`);
                                    
                                    // Check if it says "Pillow" instead of "T-Shirt"
                                    const isPillowModal = modalInfo.title.toLowerCase().includes('pillow');
                                    console.log(`   Correctly identifies as pillow: ${isPillowModal ? '✅' : '❌'}`);
                                }
                            }
                        }
                    }
                } else {
                    // Try first subcategory in Home
                    if (subcategories.length > 0) {
                        const firstSub = subcategories[0];
                        console.log(`\\n🏠 Trying first subcategory: ${firstSub.name}`);
                        
                        const subClicked = await page.evaluate((subcategoryKey) => {
                            const subcategoryCard = document.querySelector(`[data-subcategory="${subcategoryKey}"]`);
                            if (subcategoryCard) {
                                subcategoryCard.click();
                                return true;
                            }
                            return false;
                        }, firstSub.subcategory);
                        
                        if (subClicked) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            const products = await page.evaluate(() => {
                                const productCards = Array.from(document.querySelectorAll('.product-card'));
                                return productCards.map(card => ({
                                    title: card.querySelector('.product-title')?.textContent,
                                    blueprint: card.dataset.blueprint,
                                    provider: card.dataset.provider
                                }));
                            });
                            
                            console.log(`\\n🏠 Products in ${firstSub.name}:`);
                            products.forEach((prod, i) => {
                                console.log(`   ${i + 1}. ${prod.title} (Blueprint: ${prod.blueprint})`);
                            });
                        }
                    }
                }
            }
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'pillow-poster-test-proof.png',
            fullPage: true 
        });
        console.log('\\n📸 Screenshot saved: pillow-poster-test-proof.png');
        
        console.log('\\n⏳ Keeping browser open for 10 seconds...');
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
    testPillowPoster()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testPillowPoster };