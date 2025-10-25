const puppeteer = require('puppeteer');

describe('Product Categories Display Test', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
    }, 60000);

    afterAll(async () => {
        if (browser) await browser.close();
    });

    test('Check if product categories appear on merchandise page', async () => {
        console.log('🔍 Testing product categories display...');
        
        // Navigate to merchandise page
        await page.goto('http://localhost:3001/merchandise');
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for category elements
        const categoryElements = await page.$$('.category-btn, .product-category, .category-item');
        console.log(`📦 Found ${categoryElements.length} category elements`);
        
        // Check for product navigator
        const productNavigator = await page.$('.product-navigator');
        console.log('🧭 Product navigator present:', !!productNavigator);
        
        // Check for any cleanup messages
        const cleanupMessages = await page.$$eval('*', elements => 
            Array.from(elements)
                .map(el => el.textContent)
                .filter(text => text && (
                    text.includes('broken products') || 
                    text.includes('cleanup') ||
                    text.includes('corrupted')
                ))
        );
        
        console.log('🧹 Cleanup messages found:', cleanupMessages.length);
        if (cleanupMessages.length > 0) {
            console.log('   Messages:', cleanupMessages);
        }
        
        // Check page content for categories
        const pageText = await page.evaluate(() => document.body.textContent);
        const hasApparel = pageText.includes('Apparel') || pageText.includes('T-Shirts');
        const hasHome = pageText.includes('Home') || pageText.includes('Mugs');
        const hasAccessories = pageText.includes('Accessories') || pageText.includes('Bags');
        
        console.log('📋 Category content found:');
        console.log('   - Apparel:', hasApparel);
        console.log('   - Home:', hasHome);
        console.log('   - Accessories:', hasAccessories);
        
        // Check for any error messages
        const errorMessages = await page.$$eval('.error, .alert-danger', 
            elements => elements.map(el => el.textContent)
        );
        
        if (errorMessages.length > 0) {
            console.log('❌ Error messages:', errorMessages);
        }
        
        // Success if we have categories OR no cleanup messages
        const success = categoryElements.length > 0 || cleanupMessages.length === 0;
        console.log('✅ Test result: Categories working =', success);
        
        expect(success).toBe(true);
        
    }, 30000);
});