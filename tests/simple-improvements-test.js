const puppeteer = require('puppeteer');

async function testImprovements() {
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
        
        // Instead of relying on gallery, let's directly trigger the category view
        console.log('🔧 Directly triggering category card display...');
        await page.evaluate(() => {
            // Simulate the workflow by calling the method directly
            if (window.merchandiseStore && window.merchandiseStore.displayCategoryCards) {
                window.merchandiseStore.displayCategoryCards();
            }
        });
        
        // Wait for category cards to appear
        console.log('⏳ Waiting for category cards...');
        await page.waitForSelector('.category-card', { timeout: 10000 });
        
        // Click on the first category card (which should be t-shirt)
        console.log('🖱️ Clicking first category card...');
        await page.click('.category-card:first-child .browse-category-btn');
        
        // Wait for products to load
        console.log('⏳ Waiting for products to display...');
        await page.waitForSelector('.product-item', { timeout: 10000 });
        
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
        
        // Check if the color is darker (should be rgb(45, 55, 72) instead of light gray)
        const hasImprovedColor = productDescriptions.some(desc => 
            desc.color.includes('45, 55, 72') || desc.color.includes('rgb(45, 55, 72)')
        );
        console.log(`✅ Improved text color detected: ${hasImprovedColor ? 'YES' : 'NO'}`);
        
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
            console.log(`   Text: ${preview.hasText ? '✅' : '❌'} (${preview.textContent?.substring(0, 20)}...)`);
        });
        
        // Check for improvements
        const hasNewPreviewSystem = productPreviews.some(p => p.hasPlaceholder && p.hasIcon && p.hasText);
        console.log(`✅ New preview system detected: ${hasNewPreviewSystem ? 'YES' : 'NO'}`);
        
        // Summary
        console.log('\n🎯 IMPROVEMENT SUMMARY:');
        console.log(`📝 Text Readability: ${hasImprovedColor ? '✅ IMPROVED' : '❌ NEEDS WORK'}`);
        console.log(`🖼️ Product Previews: ${hasNewPreviewSystem ? '✅ ENHANCED' : '❌ NEEDS WORK'}`);
        
        console.log('\n✅ Test completed successfully!');
        
        // Keep browser open for visual inspection
        console.log('🔍 Browser kept open for visual inspection. Check the products and text readability.');
        console.log('Press Ctrl+C to close.');
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
testImprovements().catch(console.error);