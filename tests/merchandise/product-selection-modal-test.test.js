const puppeteer = require('puppeteer');

describe('Product Selection Modal Issues', () => {
    let browser, page;
    const timeout = 30000;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            slowMo: 50,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    test('Product selection modal title and behavior issues', async () => {
        console.log('🧪 Testing product selection modal issues...');

        // Navigate to merchandise store with preselected image
        await page.goto('http://localhost:3001/merchandise?imageId=test-image', { waitUntil: 'networkidle0' });
        
        // Wait for page to load and image to be selected
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Look for either product navigator or simple categories
        const hasNavigator = await page.$('.product-navigator') !== null;
        const hasSimpleCategories = await page.$('.simple-categories') !== null;
        
        console.log(`Navigator found: ${hasNavigator}, Simple categories found: ${hasSimpleCategories}`);
        
        if (!hasNavigator && !hasSimpleCategories) {
            console.log('❌ No product selection interface found');
            expect(true).toBe(false); // Fail the test
            return;
        }
        
        // Select a product (try both interfaces)
        if (hasNavigator) {
            console.log('📂 Using product navigator...');
            // Try to select from navigator
            await page.click('[data-category="apparel"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.click('[data-subcategory="t-shirts"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.click('.select-product-btn');
        } else {
            console.log('📦 Using simple categories...');
            // Use simple categories fallback
            await page.click('.select-simple-product');
        }
        
        // Wait for modal to appear
        console.log('⏳ Waiting for customization modal...');
        await page.waitForSelector('#productCustomizationModal', { visible: true, timeout: 10000 });
        
        // Check modal title immediately after selection
        console.log('🔍 Checking modal title...');
        const modalTitle = await page.$eval('#productCustomizationModal h2', el => el.textContent);
        console.log(`Modal title: "${modalTitle}"`);
        
        // Issue 1: Check if title is now fixed (should NOT contain "undefined")
        const hasUndefinedTitle = modalTitle.includes('undefined');
        console.log(`Modal title after fix: "${modalTitle}"`);
        console.log(`Issue 1 - Title contains undefined: ${hasUndefinedTitle ? '❌ STILL BROKEN' : '✅ FIXED'}`);
        
        // Issue 2: Try to create product and monitor for progress dialog
        console.log('🚀 Testing product creation...');
        
        let progressDialogAppeared = false;
        let modalDisappeared = false;
        
        // Monitor for progress dialog appearance
        const checkProgressDialog = async () => {
            try {
                await page.waitForSelector('#loading-modal[style*="block"]', { visible: true, timeout: 5000 });
                progressDialogAppeared = true;
                console.log('✅ Progress dialog appeared');
            } catch (e) {
                console.log('❌ Progress dialog did not appear within 5 seconds');
            }
        };
        
        // Start monitoring for progress dialog
        const progressPromise = checkProgressDialog();
        
        // Click create product button
        const createButton = await page.waitForSelector('#createProductBtn', { timeout: 5000 });
        await createButton.click();
        
        // Wait for progress dialog check to complete
        await progressPromise;
        
        // Wait a bit for product creation
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Issue 3: Check if modal disappeared
        try {
            const modalStillVisible = await page.$('#productCustomizationModal') !== null;
            modalDisappeared = !modalStillVisible;
            console.log(`Modal disappeared: ${modalDisappeared}`);
        } catch (e) {
            console.log('Modal state check failed');
            modalDisappeared = false;
        }
        
        // Report all issues
        console.log('\n🧪 TEST RESULTS:');
        console.log(`Issue 1 - Title shows "undefined": ${hasUndefinedTitle ? '❌ STILL BROKEN' : '✅ FIXED'}`);
        console.log(`Issue 2 - Progress dialog missing: ${!progressDialogAppeared ? '❌ STILL BROKEN' : '✅ FIXED'}`);
        console.log(`Issue 3 - Modal doesn't disappear: ${!modalDisappeared ? '❌ STILL BROKEN' : '✅ FIXED'}`);
        
        const allIssuesFixed = !hasUndefinedTitle && progressDialogAppeared && modalDisappeared;
        console.log(`\n🎉 ALL ISSUES FIXED: ${allIssuesFixed ? '✅ YES' : '❌ NO'}`);
        
        // Test passes if all issues are fixed
        expect(allIssuesFixed).toBe(true);
        
    }, 45000); // Increased timeout for full test
});