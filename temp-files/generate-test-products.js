// Generate 3 random test products from gallery images and product catalog
const puppeteer = require('puppeteer');

async function generateTestProducts() {
    console.log('🎯 Generating 3 random test products...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 100
    });
    
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get available gallery images
        const galleryImages = await page.$$('.gallery-image-card');
        console.log(`📸 Found ${galleryImages.length} gallery images`);
        
        if (galleryImages.length === 0) {
            console.log('❌ No gallery images available');
            return;
        }
        
        // We'll just use the first available product type for simplicity
        
        for (let i = 0; i < 3; i++) {
            console.log(`\n🎨 Creating product ${i + 1}/3...`);
            
            // Select random image
            const randomImageIndex = Math.floor(Math.random() * galleryImages.length);
            const selectedImage = galleryImages[randomImageIndex];
            
            const imageInfo = await page.evaluate((element) => {
                const selectBtn = element.querySelector('.gallery-image-select');
                const title = element.querySelector('h4')?.textContent;
                return {
                    imageId: selectBtn?.dataset.imageId,
                    title: title?.trim()
                };
            }, selectedImage);
            
            console.log(`📷 Selected image: ${imageInfo.title}`);
            
            // Click to select image
            await selectedImage.$eval('.gallery-image-select', btn => btn.click());
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Wait for product navigator to load
            await page.waitForSelector('.simple-categories, .product-navigator', { timeout: 10000 });
            
            // Debug: Check what selectors are available
            const availableButtons = await page.$$eval('.select-simple-product', buttons => 
                buttons.map(btn => ({ 
                    text: btn.textContent.trim(), 
                    dataset: btn.dataset 
                }))
            );
            console.log('🔍 Available product buttons:', availableButtons);
            
            // Just click the first available product button
            await page.click('.select-simple-product');
            console.log('👕 Creating product...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wait for customization modal
            await page.waitForSelector('#productCustomizationModal', { visible: true, timeout: 10000 });
            
            // Click create button
            await page.click('#createProductBtn');
            console.log(`⏳ Creating ${productType.name}...`);
            
            // Wait for creation to complete (longer timeout for processing)
            await page.waitForSelector('#productCustomizationModal', { hidden: true, timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log(`✅ Product ${i + 1} created successfully`);
        }
        
        // Final verification
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const finalProducts = await page.$$('.product-card');
        console.log(`\n🎉 Test complete! Created ${finalProducts.length} products total`);
        
        // List created products
        const productList = await page.evaluate(() => {
            const cards = document.querySelectorAll('.product-card');
            return Array.from(cards).map(card => {
                const title = card.querySelector('h4')?.textContent;
                const productType = card.querySelector('.product-type-name')?.textContent;
                return `${title} (${productType})`;
            });
        });
        
        console.log('\n📦 Created products:');
        productList.forEach((product, i) => {
            console.log(`${i + 1}. ${product}`);
        });
        
    } catch (error) {
        console.error('❌ Error generating test products:', error);
    } finally {
        await browser.close();
    }
}

generateTestProducts();