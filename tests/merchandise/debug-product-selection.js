/**
 * Debug Product Selection Test
 * Investigates why product selection buttons aren't found
 */

const puppeteer = require('puppeteer');

async function debugProductSelection() {
    console.log('🔍 Debug Product Selection Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await page.waitForSelector('body', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎯 Step 1: Select first image');
        const firstImageButton = await page.$('.gallery-image-select');
        if (firstImageButton) {
            await firstImageButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('🔍 Step 2: Analyze ProductNavigator structure');
        
        const navigatorAnalysis = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const simpleCategories = document.querySelector('.simple-categories');
            
            if (navigator) {
                return {
                    type: 'ProductNavigator',
                    categories: document.querySelectorAll('.category-card').length,
                    subcategories: document.querySelectorAll('.subcategory-card').length,
                    products: document.querySelectorAll('.product-card').length,
                    selectButtons: document.querySelectorAll('.select-product-btn').length,
                    breadcrumbs: document.querySelectorAll('.breadcrumb').length,
                    currentView: navigator.innerHTML.includes('categories-grid') ? 'categories' : 
                                navigator.innerHTML.includes('subcategories-grid') ? 'subcategories' :
                                navigator.innerHTML.includes('products-grid') ? 'products' : 'unknown'
                };
            } else if (simpleCategories) {
                return {
                    type: 'SimpleCategories',
                    categories: document.querySelectorAll('.simple-category').length,
                    selectButtons: document.querySelectorAll('.select-simple-product').length
                };
            } else {
                return { type: 'None' };
            }
        });
        
        console.log('📊 Navigator Analysis:', navigatorAnalysis);
        
        if (navigatorAnalysis.type === 'ProductNavigator' && navigatorAnalysis.currentView === 'categories') {
            console.log('🔍 Step 3: Navigate through ProductNavigator hierarchy');
            
            // Click first category
            const firstCategory = await page.$('.category-card');
            if (firstCategory) {
                console.log('🎯 Clicking first category...');
                await firstCategory.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check subcategories
                const subcategoryAnalysis = await page.evaluate(() => ({
                    subcategories: document.querySelectorAll('.subcategory-card').length,
                    selectButtons: document.querySelectorAll('.select-product-btn').length
                }));
                
                console.log('📊 After category click:', subcategoryAnalysis);
                
                // Click first subcategory if available
                const firstSubcategory = await page.$('.subcategory-card');
                if (firstSubcategory) {
                    console.log('🎯 Clicking first subcategory...');
                    await firstSubcategory.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check products
                    const productAnalysis = await page.evaluate(() => ({
                        products: document.querySelectorAll('.product-card').length,
                        selectButtons: document.querySelectorAll('.select-product-btn').length
                    }));
                    
                    console.log('📊 After subcategory click:', productAnalysis);
                    
                    if (productAnalysis.selectButtons > 0) {
                        console.log('✅ Found product selection buttons! Attempting selection...');
                        
                        const firstProductButton = await page.$('.select-product-btn');
                        if (firstProductButton) {
                            await firstProductButton.click();
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            const modalAppeared = await page.$('.product-customization-modal');
                            console.log(`🎨 Customization modal: ${modalAppeared ? 'Appeared' : 'Did not appear'}`);
                        }
                    }
                }
            }
        } else if (navigatorAnalysis.type === 'SimpleCategories') {
            console.log('🔍 Step 3: Test simple categories');
            
            const firstSimpleButton = await page.$('.select-simple-product');
            if (firstSimpleButton) {
                console.log('🎯 Clicking simple category button...');
                await firstSimpleButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const modalAppeared = await page.$('.product-customization-modal');
                console.log(`🎨 Customization modal: ${modalAppeared ? 'Appeared' : 'Did not appear'}`);
            }
        }
        
        // Keep browser open for manual inspection
        console.log('🔍 Browser opened for manual inspection. Check the page and press Ctrl+C to close.');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.log(`❌ Debug Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

debugProductSelection();