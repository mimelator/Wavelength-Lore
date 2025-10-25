/**
 * Comprehensive Random Product Design Test
 * Handles both ProductNavigator and Simple Categories fallback
 */

const puppeteer = require('puppeteer');

async function testComprehensiveRandomDesign() {
    console.log('🎲 Comprehensive Random Product Design Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await page.waitForSelector('body', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎲 Step 1: Random Image Selection');
        const galleryImages = await page.$$('.gallery-image-select');
        console.log(`📸 Available gallery images: ${galleryImages.length}`);
        
        if (galleryImages.length === 0) {
            console.log('❌ No gallery images available');
            return false;
        }
        
        const randomImageIndex = Math.floor(Math.random() * galleryImages.length);
        console.log(`🎯 Selecting random image #${randomImageIndex + 1}`);
        await galleryImages[randomImageIndex].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎲 Step 2: Detect Navigation System');
        const productNavigator = await page.$('.product-navigator');
        const simpleCategories = await page.$('.simple-categories');
        
        let productButtons = [];
        
        if (productNavigator) {
            console.log('🚀 Using Full ProductNavigator - navigating hierarchy...');
            
            // Navigate through ProductNavigator hierarchy
            const categories = await page.$$('.category-card');
            if (categories.length > 0) {
                const randomCategoryIndex = Math.floor(Math.random() * categories.length);
                console.log(`📂 Selecting category #${randomCategoryIndex + 1}/${categories.length}`);
                await categories[randomCategoryIndex].click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const subcategories = await page.$$('.subcategory-card');
                if (subcategories.length > 0) {
                    const randomSubcategoryIndex = Math.floor(Math.random() * subcategories.length);
                    console.log(`📁 Selecting subcategory #${randomSubcategoryIndex + 1}/${subcategories.length}`);
                    await subcategories[randomSubcategoryIndex].click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            productButtons = await page.$$('.select-product-btn');
            
        } else if (simpleCategories) {
            console.log('🔧 Using Simple Categories Fallback');
            productButtons = await page.$$('.select-simple-product');
        } else {
            console.log('❌ No product navigation system found');
            return false;
        }
        
        console.log('🎲 Step 3: Random Product Selection');
        console.log(`📦 Available products: ${productButtons.length}`);
        
        if (productButtons.length === 0) {
            console.log('❌ No product selection buttons found');
            return false;
        }
        
        const randomProductIndex = Math.floor(Math.random() * productButtons.length);
        console.log(`🎯 Selecting random product #${randomProductIndex + 1}`);
        
        // Get product info
        const productInfo = await page.evaluate((index, isSimple) => {
            const selector = isSimple ? '.select-simple-product' : '.select-product-btn';
            const buttons = document.querySelectorAll(selector);
            const button = buttons[index];
            const card = button.closest('.product-card, .simple-category');
            
            return {
                productType: button.dataset.product || button.dataset.productType || 'unknown',
                title: card ? (card.querySelector('h4')?.textContent || 'Unknown Product') : 'Unknown'
            };
        }, randomProductIndex, !!simpleCategories);
        
        console.log(`📋 Selected: ${productInfo.title} (${productInfo.productType})`);
        
        await productButtons[randomProductIndex].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎲 Step 4: Product Customization');
        const customizationModal = await page.$('.product-customization-modal');
        console.log(`🎨 Customization modal: ${customizationModal ? 'Opened' : 'Not opened'}`);
        
        if (!customizationModal) {
            console.log('❌ Customization modal did not appear');
            return false;
        }
        
        // Randomize options
        const sizeSelect = await page.$('#defaultSize');
        if (sizeSelect) {
            const sizes = await page.$$eval('#defaultSize option', opts => opts.map(o => o.value));
            const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
            await page.select('#defaultSize', randomSize);
            console.log(`👕 Size: ${randomSize}`);
        }
        
        const colorSelect = await page.$('#defaultColor');
        if (colorSelect) {
            const colors = await page.$$eval('#defaultColor option', opts => opts.map(o => o.value));
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            await page.select('#defaultColor', randomColor);
            console.log(`🎨 Color: ${randomColor}`);
        }
        
        const borderSelect = await page.$('#borderStyleSelect');
        if (borderSelect) {
            const borders = await page.$$eval('#borderStyleSelect option', opts => opts.map(o => o.value));
            const randomBorder = borders[Math.floor(Math.random() * borders.length)];
            await page.select('#borderStyleSelect', randomBorder);
            console.log(`🖼️ Border: ${randomBorder}`);
        }
        
        console.log('🎲 Step 5: Design Product');
        const createButton = await page.$('#createProductBtn');
        if (!createButton) {
            console.log('❌ Create button not found');
            return false;
        }
        
        console.log('🚀 Initiating product design...');
        await createButton.click();
        
        // Monitor progress for 20 seconds
        let success = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const loadingModal = await page.$('#loading-modal[style*="block"]');
            const successToast = await page.$('.toast-success');
            const errorToast = await page.$('.toast-error');
            const modalClosed = !(await page.$('.product-customization-modal[style*="block"]'));
            
            if (i === 0 && loadingModal) {
                console.log('⏳ Loading process started...');
            }
            
            if (successToast) {
                console.log(`✅ Success detected after ${i + 1} seconds`);
                success = true;
                break;
            }
            
            if (errorToast) {
                console.log(`❌ Error detected after ${i + 1} seconds`);
                break;
            }
            
            if (modalClosed && i > 5) {
                console.log(`🔄 Modal closed after ${i + 1} seconds`);
                success = true;
                break;
            }
        }
        
        // Final verification
        const finalProductCount = await page.$$eval('.product-card', cards => cards.length);
        console.log(`📦 Final product count: ${finalProductCount}`);
        
        console.log(`🎯 Test Result: ${success ? 'SUCCESS' : 'FAILED'}`);
        
        if (success) {
            console.log('🎉 Random product design completed successfully!');
            console.log(`📋 Workflow: Random image → ${productInfo.title} → customized → designed`);
        }
        
        return success;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

testComprehensiveRandomDesign()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });