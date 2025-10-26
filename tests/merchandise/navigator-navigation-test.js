#!/usr/bin/env node

/**
 * Navigator Navigation Test - Navigate through categories to find product buttons
 */

const puppeteer = require('puppeteer');

async function testNavigatorNavigation() {
    console.log('🧪 Testing ProductNavigator Navigation - Finding Product Buttons\n');
    
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
            console.log('✅ Image selected, waiting for navigator...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 1: Check categories
            const categories = await page.evaluate(() => {
                const categoryCards = Array.from(document.querySelectorAll('.category-card'));
                return categoryCards.map(card => ({
                    name: card.querySelector('.category-name')?.textContent,
                    category: card.dataset.category,
                    productCount: card.querySelector('.product-count')?.textContent
                }));
            });
            
            console.log('\\n📂 Available Categories:');
            categories.forEach((cat, i) => {
                console.log(`   ${i + 1}. ${cat.name} (${cat.productCount}) - key: ${cat.category}`);
            });
            
            // Step 2: Click on first category
            if (categories.length > 0) {
                const firstCategory = categories[0];
                console.log(`\\n🎯 Clicking on category: ${firstCategory.name}`);
                
                const categoryClicked = await page.evaluate((categoryKey) => {
                    const categoryCard = document.querySelector(`[data-category="${categoryKey}"]`);
                    if (categoryCard) {
                        categoryCard.click();
                        return true;
                    }
                    return false;
                }, firstCategory.category);
                
                if (categoryClicked) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Step 3: Check subcategories
                    const subcategories = await page.evaluate(() => {
                        const subcategoryCards = Array.from(document.querySelectorAll('.subcategory-card'));
                        return subcategoryCards.map(card => ({
                            name: card.querySelector('.subcategory-name')?.textContent,
                            subcategory: card.dataset.subcategory,
                            productCount: card.querySelector('.product-count')?.textContent
                        }));
                    });
                    
                    console.log('\\n📁 Available Subcategories:');
                    subcategories.forEach((sub, i) => {
                        console.log(`   ${i + 1}. ${sub.name} (${sub.productCount}) - key: ${sub.subcategory}`);
                    });
                    
                    // Step 4: Click on first subcategory
                    if (subcategories.length > 0) {
                        const firstSubcategory = subcategories[0];
                        console.log(`\\n🎯 Clicking on subcategory: ${firstSubcategory.name}`);
                        
                        const subcategoryClicked = await page.evaluate((subcategoryKey) => {
                            const subcategoryCard = document.querySelector(`[data-subcategory="${subcategoryKey}"]`);
                            if (subcategoryCard) {
                                subcategoryCard.click();
                                return true;
                            }
                            return false;
                        }, firstSubcategory.subcategory);
                        
                        if (subcategoryClicked) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Step 5: Check products and buttons
                            const products = await page.evaluate(() => {
                                const productCards = Array.from(document.querySelectorAll('.product-card'));
                                const selectButtons = Array.from(document.querySelectorAll('.select-product-btn'));
                                
                                return {
                                    products: productCards.map(card => ({
                                        title: card.querySelector('.product-title')?.textContent,
                                        blueprint: card.dataset.blueprint,
                                        provider: card.dataset.provider,
                                        price: card.querySelector('.product-price')?.textContent
                                    })),
                                    buttonCount: selectButtons.length,
                                    buttons: selectButtons.map(btn => ({
                                        text: btn.textContent,
                                        classes: btn.className
                                    }))
                                };
                            });
                            
                            console.log('\\n🎽 Available Products:');
                            products.products.forEach((prod, i) => {
                                console.log(`   ${i + 1}. ${prod.title} (${prod.price})`);
                                console.log(`      Blueprint: ${prod.blueprint}, Provider: ${prod.provider}`);
                            });
                            
                            console.log(`\\n🔘 Product Selection Buttons: ${products.buttonCount}`);
                            products.buttons.forEach((btn, i) => {
                                console.log(`   ${i + 1}. "${btn.text}" (${btn.classes})`);
                            });
                            
                            // Step 6: Try to click a product button
                            if (products.buttonCount > 0) {
                                console.log('\\n🚀 Attempting to click first product button...');
                                
                                const buttonClicked = await page.evaluate(() => {
                                    const firstBtn = document.querySelector('.select-product-btn');
                                    if (firstBtn) {
                                        firstBtn.click();
                                        return true;
                                    }
                                    return false;
                                });
                                
                                if (buttonClicked) {
                                    console.log('✅ Product button clicked!');
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    
                                    // Check if customization modal opened
                                    const modalInfo = await page.evaluate(() => {
                                        const modal = document.querySelector('.product-customization-modal');
                                        if (modal) {
                                            const title = modal.querySelector('h2')?.textContent;
                                            return { found: true, title };
                                        }
                                        return { found: false };
                                    });
                                    
                                    console.log('📋 Customization Modal:', modalInfo.found ? '✅ Opened' : '❌ Not found');
                                    if (modalInfo.found) {
                                        console.log(`   Title: "${modalInfo.title}"`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'navigator-navigation-proof.png',
            fullPage: true 
        });
        console.log('\\n📸 Screenshot saved: navigator-navigation-proof.png');
        
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
    testNavigatorNavigation()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNavigatorNavigation };