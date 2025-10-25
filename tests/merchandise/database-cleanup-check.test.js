const puppeteer = require('puppeteer');

describe('Database Cleanup Check', () => {
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

    test('Check database for corrupted products', async () => {
        await page.goto('http://localhost:3001/merchandise');
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Call the API to check for user products
        const products = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/user-products');
                const data = await response.json();
                return data;
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('📊 User products response:', JSON.stringify(products, null, 2));
        
        if (products.products && Array.isArray(products.products)) {
            console.log(`📦 Found ${products.products.length} products in database`);
            
            const corruptedProducts = products.products.filter(product => 
                !product.variants || product.variants.length === 0 ||
                !product.images || product.images.length === 0
            );
            
            if (corruptedProducts.length > 0) {
                console.log(`🚨 Found ${corruptedProducts.length} corrupted products:`);
                corruptedProducts.forEach((product, index) => {
                    console.log(`   ${index + 1}. ID: ${product.id || 'unknown'}`);
                    console.log(`      Variants: ${product.variants?.length || 0}`);
                    console.log(`      Images: ${product.images?.length || 0}`);
                    console.log(`      Created: ${product.createdAt || 'unknown'}`);
                });
                
                console.log('\n💡 These products need manual database cleanup');
            } else {
                console.log('✅ No corrupted products found in database');
            }
        }
        
    }, 30000);
});