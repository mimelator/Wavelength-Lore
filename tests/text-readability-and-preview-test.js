const puppeteer = require('puppeteer');

async function testTextReadabilityAndPreview() {
    console.log('🌊 WAVELENGTH: Testing text readability and product preview improvements...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('📍 Navigating to merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for the gallery to load
        console.log('⏳ Waiting for image gallery...');
        await page.waitForSelector('.image-item', { timeout: 10000 });
        
        // Click on the first image
        console.log('🖱️ Clicking first gallery image...');
        await page.click('.image-item:first-child');
        
        // Wait for category cards to appear
        console.log('⏳ Waiting for category cards...');
        await page.waitForSelector('.category-card', { timeout: 5000 });
        
        // Click on the first category card (which should be t-shirt)
        console.log('🖱️ Clicking first category card...');
        await page.click('.category-card:first-child .browse-category-btn');
        
        // Wait for products to load
        console.log('⏳ Waiting for products to display...');
        await page.waitForSelector('.product-item', { timeout: 5000 });
        
        // Check text readability improvements
        console.log('🔍 Checking product description text readability...');
        const productDescriptions = await page.$$eval('.product-description', elements => {
            return elements.map(el => {
                const computedStyle = window.getComputedStyle(el);
                return {
                    text: el.textContent.trim(),
                    color: computedStyle.color,
                    textShadow: computedStyle.textShadow,
                    fontSize: computedStyle.fontSize
                };
            });
        });
        
        console.log('📋 Product Description Analysis:');
        productDescriptions.slice(0, 3).forEach((desc, i) => {
            console.log(`${i + 1}. Text: "${desc.text.substring(0, 50)}..."`);
            console.log(`   Color: ${desc.color}`);
            console.log(`   Text Shadow: ${desc.textShadow}`);
            console.log(`   Font Size: ${desc.fontSize}`);
        });
        
        // Check product preview improvements
        console.log('🔍 Checking product preview enhancements...');
        const productPreviews = await page.$$eval('.product-preview', elements => {
            return elements.map(el => {
                const placeholder = el.querySelector('.product-preview-placeholder');
                const icon = el.querySelector('.product-preview-icon');
                const text = el.querySelector('.product-preview-text');
                
                return {
                    hasPlaceholder: !!placeholder,
                    hasIcon: !!icon,
                    hasText: !!text,
                    iconContent: icon ? icon.textContent.trim() : null,
                    textContent: text ? text.textContent.trim() : null
                };
            });
        });
        
        console.log('📋 Product Preview Analysis:');
        productPreviews.slice(0, 5).forEach((preview, i) => {
            console.log(`${i + 1}. Placeholder: ${preview.hasPlaceholder ? '✅' : '❌'}`);
            console.log(`   Icon: ${preview.hasIcon ? '✅' : '❌'} (${preview.iconContent})`);
            console.log(`   Text: ${preview.hasText ? '✅' : '❌'} (${preview.textContent})`);
        });
        
        // Test visibility and contrast
        console.log('🔍 Testing text visibility and contrast...');
        const visibilityResults = await page.evaluate(() => {
            const descriptions = Array.from(document.querySelectorAll('.product-description'));
            return descriptions.slice(0, 3).map(el => {
                const rect = el.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(el);
                
                return {
                    isVisible: rect.width > 0 && rect.height > 0,
                    text: el.textContent.trim(),
                    colorRgb: computedStyle.color,
                    backgroundColorRgb: computedStyle.backgroundColor
                };
            });
        });
        
        console.log('📋 Text Visibility Results:');
        visibilityResults.forEach((result, i) => {
            console.log(`${i + 1}. Visible: ${result.isVisible ? '✅' : '❌'}`);
            console.log(`   Text: "${result.text.substring(0, 40)}..."`);
            console.log(`   Color: ${result.colorRgb}`);
            console.log(`   Background: ${result.backgroundColorRgb}`);
        });
        
        console.log('✅ Text readability and preview test completed successfully!');
        
        // Keep browser open for visual inspection
        console.log('🔍 Browser kept open for visual inspection. Press Ctrl+C to close.');
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testTextReadabilityAndPreview().catch(console.error);