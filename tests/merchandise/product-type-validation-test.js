#!/usr/bin/env node

/**
 * Product Type Validation Test - Comprehensive test for t-shirt display bug
 * Tests both existing products and new product creation scenarios
 */

const puppeteer = require('puppeteer');

async function testProductTypeValidation() {
    console.log('🧪 Product Type Validation Test - Checking T-Shirt Display Bug\n');
    
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
        
        // TEST 1: Check existing products
        console.log('\n📦 TEST 1: Analyzing existing products...');
        
        const existingProducts = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll('.product-card'));
            return products.map(card => {
                const title = card.querySelector('h4')?.textContent || 'No title';
                const typeIcon = card.querySelector('.product-type-icon')?.textContent || 'No icon';
                const typeName = card.querySelector('.product-type-name')?.textContent || 'No type';
                
                // Extract variant info to help identify actual product type
                const variantBtn = card.querySelector('.view-variants-btn');
                const productId = variantBtn?.dataset.productId;
                
                return {
                    title,
                    typeIcon,
                    typeName,
                    productId,
                    isTshirt: typeName.toLowerCase().includes('t-shirt') || typeName.toLowerCase().includes('tee')
                };
            });
        });
        
        console.log(`   Found ${existingProducts.length} existing products:`);
        existingProducts.forEach((product, i) => {
            const status = product.isTshirt ? '👕 T-SHIRT' : '✅ OTHER';
            console.log(`   ${i + 1}. "${product.title}"`);
            console.log(`      Type: ${product.typeName} | Icon: ${product.typeIcon} | Status: ${status}`);
        });
        
        const allAreTshirts = existingProducts.every(p => p.isTshirt);
        console.log(`\n   Result: ${allAreTshirts ? '❌ ALL PRODUCTS SHOW AS T-SHIRTS' : '✅ Mixed product types found'}`);
        
        // TEST 2: Test new product creation flow
        console.log('\n🆕 TEST 2: Testing new product creation...');
        
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
            
            // Navigate to Home & Living for pillows
            console.log('   Navigating to Home & Living > Pillows...');
            
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
                
                const pillowClicked = await page.evaluate(() => {
                    const pillowSubcategory = document.querySelector('[data-subcategory="bedding"]');
                    if (pillowSubcategory) {
                        pillowSubcategory.click();
                        return true;
                    }
                    return false;
                });
                
                if (pillowClicked) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Get pillow product info
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
                    
                    console.log(`   Selected pillow product: ${pillowProduct?.title} (Blueprint: ${pillowProduct?.blueprint})`);
                    
                    // Click pillow product
                    const pillowSelected = await page.evaluate(() => {
                        const selectBtn = document.querySelector('.select-product-btn');
                        if (selectBtn) {
                            selectBtn.click();
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
                        
                        console.log(`   Modal opened: ${modalInfo.found ? '✅' : '❌'}`);
                        if (modalInfo.found) {
                            const isPillowModal = modalInfo.title.toLowerCase().includes('pillow');
                            console.log(`   Modal title: "${modalInfo.title}"`);
                            console.log(`   Correctly identifies as pillow: ${isPillowModal ? '✅' : '❌'}`);
                            
                            if (isPillowModal) {
                                // Try to create the pillow
                                console.log('   Attempting to create pillow product...');
                                
                                const productCreated = await page.evaluate(() => {
                                    const createBtn = document.querySelector('#createProductBtn');
                                    if (createBtn) {
                                        createBtn.click();
                                        return true;
                                    }
                                    return false;
                                });
                                
                                if (productCreated) {
                                    console.log('   ✅ Pillow creation initiated');
                                    
                                    // Wait for creation to complete
                                    await new Promise(resolve => setTimeout(resolve, 10000));
                                    
                                    // Check if new product appears correctly
                                    const newProducts = await page.evaluate(() => {
                                        const products = Array.from(document.querySelectorAll('.product-card'));
                                        return products.map(card => ({
                                            title: card.querySelector('h4')?.textContent || 'No title',
                                            typeName: card.querySelector('.product-type-name')?.textContent || 'No type',
                                            typeIcon: card.querySelector('.product-type-icon')?.textContent || 'No icon'
                                        }));
                                    });
                                    
                                    console.log('\n   📊 Products after pillow creation:');
                                    newProducts.forEach((product, i) => {
                                        const isPillow = product.typeName.toLowerCase().includes('pillow');
                                        const status = isPillow ? '🛏️ PILLOW' : '👕 T-SHIRT';
                                        console.log(`      ${i + 1}. "${product.title}"`);
                                        console.log(`         Type: ${product.typeName} | Icon: ${product.typeIcon} | Status: ${status}`);
                                    });
                                    
                                    const hasPillows = newProducts.some(p => p.typeName.toLowerCase().includes('pillow'));
                                    console.log(`\n   Result: ${hasPillows ? '✅ PILLOW CREATED CORRECTLY' : '❌ PILLOW SHOWS AS T-SHIRT'}`);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // TEST 3: Debug product type extraction
        console.log('\n🔍 TEST 3: Debug product type extraction...');
        
        if (existingProducts.length > 0) {
            const debugInfo = await page.evaluate((productId) => {
                // Simulate the extractProductTypeFromProduct function
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    // Try to find any data that could indicate product type
                    const allText = productCard.textContent;
                    const dataAttributes = {};
                    
                    // Get all data attributes
                    for (let attr of productCard.attributes) {
                        if (attr.name.startsWith('data-')) {
                            dataAttributes[attr.name] = attr.value;
                        }
                    }
                    
                    return {
                        allText: allText.substring(0, 200),
                        dataAttributes,
                        innerHTML: productCard.innerHTML.substring(0, 300)
                    };
                }
                return null;
            }, existingProducts[0].productId);
            
            console.log('   Debug info for first product:');
            console.log('   Text content:', debugInfo?.allText);
            console.log('   Data attributes:', debugInfo?.dataAttributes);
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'product-type-validation-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: product-type-validation-proof.png');
        
        console.log('\n⏳ Keeping browser open for 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return !allAreTshirts; // Return true if we have mixed types (success)
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testProductTypeValidation()
        .then(success => {
            console.log(`\n🎯 Final Result: ${success ? 'MIXED PRODUCT TYPES FOUND' : 'ALL PRODUCTS SHOW AS T-SHIRTS'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductTypeValidation };