const puppeteer = require('puppeteer');

describe('Product Type Validation', () => {
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

    test('Different product selections should create different products', async () => {
        console.log('🧪 Testing product type differentiation...');

        // Navigate to merchandise store
        await page.goto('http://localhost:3001/merchandise?imageId=test-image', { waitUntil: 'networkidle0' });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test different product types
        const productTests = [
            { selector: '[data-product="premium-tshirt"]', expectedType: 'premium-tshirt', expectedName: 'Premium T-Shirt' },
            { selector: '[data-product="hoodie"]', expectedType: 'hoodie', expectedName: 'Pullover Hoodie' },
            { selector: '[data-product="mug"]', expectedType: 'mug', expectedName: 'Coffee Mug' }
        ];

        const results = [];

        for (const test of productTests) {
            console.log(`\n🎯 Testing ${test.expectedName}...`);
            
            // Click the product type
            await page.click(test.selector);
            
            // Wait for modal
            await page.waitForSelector('#productCustomizationModal', { visible: true, timeout: 5000 });
            
            // Check modal title
            const modalTitle = await page.$eval('#productCustomizationModal h2', el => el.textContent);
            console.log(`Modal title: "${modalTitle}"`);
            
            // Extract product type from API call
            const productTypeFromModal = modalTitle.includes('Premium T-Shirt') ? 'premium-tshirt' :
                                       modalTitle.includes('Pullover Hoodie') ? 'hoodie' :
                                       modalTitle.includes('Coffee Mug') ? 'mug' : 'unknown';
            
            results.push({
                selected: test.expectedType,
                modalTitle: modalTitle,
                detectedType: productTypeFromModal,
                correct: productTypeFromModal === test.expectedType
            });
            
            console.log(`Expected: ${test.expectedType}, Got: ${productTypeFromModal}, Correct: ${productTypeFromModal === test.expectedType}`);
            
            // Close modal
            await page.click('#productCustomizationModal .close');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Report results
        console.log('\n📊 TEST RESULTS:');
        results.forEach(result => {
            console.log(`${result.correct ? '✅' : '❌'} ${result.selected}: ${result.modalTitle}`);
        });
        
        const allCorrect = results.every(r => r.correct);
        console.log(`\n🎯 All products differentiated correctly: ${allCorrect ? '✅ YES' : '❌ NO'}`);
        
        expect(allCorrect).toBe(true);
        
    }, timeout);
});