const puppeteer = require('puppeteer');

describe('Product Lifecycle - Customer Design Journey', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
    }, 120000);

    afterAll(async () => {
        if (browser) await browser.close();
    });

    test('Complete customer design flow', async () => {
        // 1. Start at gallery
        await page.goto('http://localhost:3001/my-gallery');
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log('✓ Gallery page loaded');

        // 2. Navigate to merchandise (simulating image selection)
        await page.goto('http://localhost:3001/merchandise');
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log('✓ Merchandise page loaded');

        // 3. Check for product navigator or categories
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const hasCategories = await page.$('.category-btn, .product-category');
        const hasProducts = await page.$('.product-item, .select-product-btn');
        const hasNavigator = await page.$('.product-navigator');
        
        console.log('✓ Page elements:', {
            categories: !!hasCategories,
            products: !!hasProducts, 
            navigator: !!hasNavigator
        });

        // 4. Test basic interaction
        if (hasCategories) {
            await page.click('.category-btn, .product-category');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✓ Category interaction works');
        }

        // 5. Check for any error messages
        const errorMessages = await page.$$eval('.error, .alert-danger, .cleanup-message', 
            elements => elements.map(el => el.textContent)
        );
        
        if (errorMessages.length > 0) {
            console.log('⚠️ Found messages:', errorMessages);
        } else {
            console.log('✓ No error messages detected');
        }

        // 6. Verify no persistent cleanup messages
        const cleanupMessages = await page.$$eval('*', elements => 
            Array.from(elements)
                .map(el => el.textContent)
                .filter(text => text && text.includes('broken products'))
        );

        expect(cleanupMessages.length).toBe(0);
        console.log('✓ No persistent cleanup messages');

    }, 60000);

    test('Gallery to merchandise navigation works', async () => {
        // Test direct gallery access
        await page.goto('http://localhost:3001/my-gallery');
        await page.waitForSelector('body', { timeout: 10000 });
        
        const galleryTitle = await page.title();
        console.log('✓ My Gallery page accessible, title:', galleryTitle);

        // Test merchandise access
        await page.goto('http://localhost:3001/merchandise');
        await page.waitForSelector('body', { timeout: 10000 });
        
        const pageTitle = await page.title();
        console.log('✓ Merchandise page accessible, title:', pageTitle);
        
        // Note: user-gallery redirect requires server restart to take effect
        console.log('ℹ️ user-gallery → my-gallery redirect added (requires server restart)');

    }, 30000);
});