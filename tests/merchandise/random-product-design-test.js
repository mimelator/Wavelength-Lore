/**
 * Random Product Design Test
 * Tests complete workflow: random image selection → random product → design attempt
 */

const puppeteer = require('puppeteer');

async function testRandomProductDesign() {
    console.log('🎲 Random Product Design Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to merchandise page
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await page.waitForSelector('body', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎲 Step 1: Random Image Selection');
        
        // Get all available gallery images
        const galleryImages = await page.$$('.gallery-image-select');
        console.log(`📸 Available gallery images: ${galleryImages.length}`);
        
        if (galleryImages.length === 0) {
            console.log('❌ No gallery images available for testing');
            return false;
        }
        
        // Select random image
        const randomImageIndex = Math.floor(Math.random() * galleryImages.length);
        console.log(`🎯 Selecting random image #${randomImageIndex + 1}`);
        
        await galleryImages[randomImageIndex].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify image selection worked
        const selectedImages = await page.$$('.gallery-image-card.selected');
        console.log(`✅ Image selected: ${selectedImages.length > 0 ? 'Success' : 'Failed'}`);
        
        console.log('🎲 Step 2: Wait for ProductNavigator');
        
        // Wait for ProductNavigator or fallback to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const productNavigator = await page.$('.product-navigator');
        const simpleCategories = await page.$('.simple-categories');
        
        if (!productNavigator && !simpleCategories) {
            console.log('❌ Neither ProductNavigator nor fallback categories loaded');
            return false;
        }
        
        console.log(`🚀 Product selection system: ${productNavigator ? 'Full ProductNavigator' : 'Simple Categories Fallback'}`);
        
        console.log('🎲 Step 3: Navigate ProductNavigator Hierarchy');
        
        if (productNavigator) {
            // Navigate through ProductNavigator: Categories → Subcategories → Products
            console.log('🎯 Navigating through full ProductNavigator...');
            
            // Step 3a: Select random category
            const categories = await page.$$('.category-card');
            console.log(`📂 Available categories: ${categories.length}`);
            
            if (categories.length === 0) {
                console.log('❌ No categories found');
                return false;
            }
            
            const randomCategoryIndex = Math.floor(Math.random() * categories.length);
            console.log(`🎯 Selecting random category #${randomCategoryIndex + 1}`);
            
            await categories[randomCategoryIndex].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Step 3b: Select random subcategory
            const subcategories = await page.$$('.subcategory-card');
            console.log(`📁 Available subcategories: ${subcategories.length}`);
            
            if (subcategories.length === 0) {
                console.log('❌ No subcategories found');
                return false;
            }
            
            const randomSubcategoryIndex = Math.floor(Math.random() * subcategories.length);
            console.log(`🎯 Selecting random subcategory #${randomSubcategoryIndex + 1}`);
            
            await subcategories[randomSubcategoryIndex].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('🎲 Step 4: Random Product Selection');
        
        // Get available product selection buttons (after navigation)
        const productButtons = await page.$$('.select-product-btn, .select-simple-product');
        console.log(`📦 Available products: ${productButtons.length}`);
        
        if (productButtons.length === 0) {
            console.log('❌ No product selection buttons found after navigation');
            return false;
        }
        
        // Select random product
        const randomProductIndex = Math.floor(Math.random() * productButtons.length);
        console.log(`🎯 Selecting random product #${randomProductIndex + 1}`);
        
        // Get product info before clicking
        const productInfo = await page.evaluate((index) => {
            const buttons = document.querySelectorAll('.select-product-btn, .select-simple-product');
            const button = buttons[index];
            const card = button.closest('.product-card, .simple-category');
            
            return {
                productType: button.dataset.product || button.dataset.productType || 'unknown',
                blueprintId: button.dataset.blueprint || button.dataset.blueprintId || 'unknown',
                providerId: button.dataset.provider || button.dataset.providerId || 'unknown',
                title: card ? (card.querySelector('h4')?.textContent || 'Unknown Product') : 'Unknown'
            };
        }, randomProductIndex);
        
        console.log(`📋 Selected product: ${productInfo.title} (Type: ${productInfo.productType})`);
        
        await productButtons[randomProductIndex].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🎲 Step 5: Product Customization Modal');
        
        // Check if customization modal appeared
        const customizationModal = await page.$('.product-customization-modal');
        console.log(`🎨 Customization modal: ${customizationModal ? 'Opened' : 'Not opened'}`);
        
        if (!customizationModal) {
            console.log('❌ Product customization modal did not appear');
            return false;
        }
        
        console.log('🎲 Step 6: Random Customization Options');
        
        // Randomize size selection
        const sizeSelect = await page.$('#defaultSize');
        if (sizeSelect) {
            const sizeOptions = await page.$$eval('#defaultSize option', options => 
                options.map(opt => opt.value)
            );
            const randomSize = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
            await page.select('#defaultSize', randomSize);
            console.log(`👕 Random size selected: ${randomSize}`);
        }
        
        // Randomize color selection
        const colorSelect = await page.$('#defaultColor');
        if (colorSelect) {
            const colorOptions = await page.$$eval('#defaultColor option', options => 
                options.map(opt => opt.value)
            );
            const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            await page.select('#defaultColor', randomColor);
            console.log(`🎨 Random color selected: ${randomColor}`);
        }
        
        // Randomize border style
        const borderSelect = await page.$('#borderStyleSelect');
        if (borderSelect) {
            const borderOptions = await page.$$eval('#borderStyleSelect option', options => 
                options.map(opt => opt.value)
            );
            const randomBorder = borderOptions[Math.floor(Math.random() * borderOptions.length)];
            await page.select('#borderStyleSelect', randomBorder);
            console.log(`🖼️ Random border selected: ${randomBorder}`);
        }
        
        console.log('🎲 Step 7: Design Product Attempt');
        
        // Click the design/create button
        const createButton = await page.$('#createProductBtn');
        if (!createButton) {
            console.log('❌ Create product button not found');
            return false;
        }
        
        console.log('🚀 Clicking "Design Product" button...');
        await createButton.click();
        
        // Wait for loading modal or response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for loading modal
        const loadingModal = await page.$('#loading-modal[style*="block"]');
        console.log(`⏳ Loading modal: ${loadingModal ? 'Appeared' : 'Not shown'}`);
        
        // Wait longer for product creation process
        console.log('⏳ Waiting for product creation process...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check for success/error states
        const successToast = await page.$('.toast-success');
        const errorToast = await page.$('.toast-error');
        const modalStillOpen = await page.$('.product-customization-modal[style*="block"]');
        
        console.log('📊 Final Results:');
        console.log(`✅ Success toast: ${successToast ? 'Shown' : 'Not shown'}`);
        console.log(`❌ Error toast: ${errorToast ? 'Shown' : 'Not shown'}`);
        console.log(`🔄 Modal still open: ${modalStillOpen ? 'Yes' : 'No'}`);
        
        // Check if product was added to the products grid
        const productsGrid = await page.$('.products-grid');
        const productCards = await page.$$('.product-card');
        console.log(`📦 Products in grid: ${productCards.length}`);
        
        // Determine success
        const success = (successToast || (!modalStillOpen && !errorToast)) && productCards.length > 0;
        
        console.log(`🎯 Overall Test Result: ${success ? 'SUCCESS' : 'FAILED'}`);
        
        if (success) {
            console.log('🎉 Random product design workflow completed successfully!');
            console.log(`📋 Summary: Selected random image → ${productInfo.title} → customized → product created`);
        } else {
            console.log('💥 Product design workflow failed');
        }
        
        return success;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        console.log(`📍 Error stack: ${error.stack}`);
        return false;
    } finally {
        await browser.close();
    }
}

// Run test if called directly
if (require.main === module) {
    testRandomProductDesign()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRandomProductDesign };