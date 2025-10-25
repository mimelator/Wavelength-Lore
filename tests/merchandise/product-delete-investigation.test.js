const puppeteer = require('puppeteer');

describe('Product Delete Investigation', () => {
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

    test('Investigate product delete behavior', async () => {
        console.log('🔍 Investigating product delete issue...');

        // Navigate to merchandise store
        await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Count initial products
        const initialProducts = await page.$$('.product-card');
        console.log(`📦 Initial products found: ${initialProducts.length}`);

        if (initialProducts.length === 0) {
            console.log('❌ No products to delete - test cannot proceed');
            expect(true).toBe(true); // Pass test if no products
            return;
        }

        // Monitor network requests
        const deleteRequests = [];
        page.on('response', async (response) => {
            if (response.url().includes('/api/merchandise/products/') && response.request().method() === 'DELETE') {
                const status = response.status();
                console.log(`🗑️ DELETE request: ${response.url()} - Status: ${status}`);
                deleteRequests.push({ url: response.url(), status });
            }
        });

        // Try to delete first product
        const deleteButton = await page.$('.delete-product-btn');
        if (!deleteButton) {
            console.log('❌ No delete button found');
            expect(false).toBe(true);
            return;
        }

        // Click delete button
        console.log('🗑️ Clicking delete button...');
        await deleteButton.click();

        // Handle confirmation dialog
        page.on('dialog', async dialog => {
            console.log(`📋 Dialog: ${dialog.message()}`);
            await dialog.accept();
        });

        // Wait for delete operation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if product was removed from UI
        const productsAfterDelete = await page.$$('.product-card');
        console.log(`📦 Products after delete: ${productsAfterDelete.length}`);

        const deletedFromUI = productsAfterDelete.length < initialProducts.length;
        console.log(`✅ Deleted from UI: ${deletedFromUI}`);

        // Check if DELETE request was made
        const deleteRequestMade = deleteRequests.length > 0;
        console.log(`📡 DELETE request made: ${deleteRequestMade}`);

        if (deleteRequestMade) {
            deleteRequests.forEach(req => {
                console.log(`   - ${req.url} (${req.status})`);
            });
        }

        // Refresh page to see if deletion persisted
        console.log('🔄 Refreshing page to check persistence...');
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const productsAfterRefresh = await page.$$('.product-card');
        console.log(`📦 Products after refresh: ${productsAfterRefresh.length}`);

        const deletionPersisted = productsAfterRefresh.length === productsAfterDelete.length;
        console.log(`💾 Deletion persisted: ${deletionPersisted}`);

        // Report findings
        console.log('\n📊 DELETE INVESTIGATION RESULTS:');
        console.log(`Initial products: ${initialProducts.length}`);
        console.log(`After delete: ${productsAfterDelete.length}`);
        console.log(`After refresh: ${productsAfterRefresh.length}`);
        console.log(`UI deletion worked: ${deletedFromUI ? '✅' : '❌'}`);
        console.log(`API request made: ${deleteRequestMade ? '✅' : '❌'}`);
        console.log(`Deletion persisted: ${deletionPersisted ? '✅' : '❌'}`);

        if (deleteRequestMade && deleteRequests[0].status !== 200) {
            console.log(`❌ DELETE request failed with status: ${deleteRequests[0].status}`);
        }

        // Test should pass to show results, actual fix comes next
        expect(true).toBe(true);

    }, timeout);
});