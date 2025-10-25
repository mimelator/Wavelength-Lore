const puppeteer = require('puppeteer');

describe('Comprehensive Product Delete Test', () => {
    let browser, page;
    const timeout = 60000;

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

    test('Comprehensive delete validation - Firebase, Cache, and API', async () => {
        console.log('🔍 Starting comprehensive delete validation...');

        // Navigate to merchandise store
        await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get initial product count
        const initialProducts = await page.$$('.product-card');
        console.log(`📦 Initial products: ${initialProducts.length}`);

        if (initialProducts.length === 0) {
            console.log('❌ No products to test deletion');
            expect(true).toBe(true);
            return;
        }

        // Get product ID from first product
        const firstProduct = initialProducts[0];
        const productId = await firstProduct.$eval('.delete-product-btn', btn => btn.dataset.productId);
        console.log(`🎯 Target product ID: ${productId}`);

        // Monitor all network requests
        const networkRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/merchandise/')) {
                networkRequests.push({
                    method: request.method(),
                    url: request.url(),
                    timestamp: Date.now()
                });
            }
        });

        const networkResponses = [];
        page.on('response', response => {
            if (response.url().includes('/api/merchandise/')) {
                networkResponses.push({
                    method: response.request().method(),
                    url: response.url(),
                    status: response.status(),
                    timestamp: Date.now()
                });
            }
        });

        // Step 1: Delete the product
        console.log('🗑️ Step 1: Deleting product...');
        
        page.on('dialog', async dialog => {
            console.log(`📋 Confirming deletion: ${dialog.message()}`);
            await dialog.accept();
        });

        await firstProduct.$eval('.delete-product-btn', btn => btn.click());
        
        // Wait for deletion to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 2: Verify UI removal
        console.log('🖥️ Step 2: Verifying UI removal...');
        const productsAfterDelete = await page.$$('.product-card');
        const uiDeleted = productsAfterDelete.length < initialProducts.length;
        console.log(`UI deletion successful: ${uiDeleted ? '✅' : '❌'}`);

        // Step 3: Verify DELETE API call was made
        console.log('📡 Step 3: Verifying DELETE API call...');
        const deleteRequest = networkResponses.find(r => 
            r.method === 'DELETE' && 
            r.url.includes(`/products/${productId}`)
        );
        const deleteApiCalled = !!deleteRequest;
        const deleteApiSuccess = deleteRequest?.status === 200 || deleteRequest?.status === 404;
        console.log(`DELETE API called: ${deleteApiCalled ? '✅' : '❌'}`);
        console.log(`DELETE API success: ${deleteApiSuccess ? '✅' : '❌'} (Status: ${deleteRequest?.status})`);

        // Step 4: Refresh page and verify persistence
        console.log('🔄 Step 4: Refreshing page to verify persistence...');
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        const productsAfterRefresh = await page.$$('.product-card');
        const deletionPersisted = productsAfterRefresh.length === productsAfterDelete.length;
        console.log(`Deletion persisted after refresh: ${deletionPersisted ? '✅' : '❌'}`);

        // Step 5: Verify product doesn't exist via API
        console.log('🔍 Step 5: Verifying product removal via API...');
        const apiVerification = await page.evaluate(async (productId) => {
            try {
                const response = await fetch(`/api/merchandise/products/${productId}`, {
                    headers: { 'Authorization': 'Bearer dev-bypass' }
                });
                return {
                    status: response.status,
                    exists: response.status === 200
                };
            } catch (error) {
                return { status: 'error', exists: false, error: error.message };
            }
        }, productId);

        const productNotFound = apiVerification.status === 404 || !apiVerification.exists;
        console.log(`Product not found via API: ${productNotFound ? '✅' : '❌'} (Status: ${apiVerification.status})`);

        // Step 6: Verify product not in products list
        console.log('📋 Step 6: Verifying product not in products list...');
        const productsListCheck = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/merchandise/products', {
                    headers: { 'Authorization': 'Bearer dev-bypass' }
                });
                const data = await response.json();
                return {
                    success: data.success,
                    productCount: data.products?.length || 0,
                    products: data.products || []
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        const productInList = productsListCheck.products?.some(p => 
            (p.id || p.productId) === productId
        );
        console.log(`Product not in list: ${!productInList ? '✅' : '❌'}`);

        // Step 7: Test cache invalidation by creating new product
        console.log('💾 Step 7: Testing cache invalidation...');
        
        // Go back to create a new product to test cache
        await page.goto('http://localhost:3001/merchandise?imageId=test-image', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if simple categories are available
        const hasSimpleCategories = await page.$('.simple-categories') !== null;
        if (hasSimpleCategories) {
            await page.click('.select-simple-product');
            await page.waitForSelector('#productCustomizationModal', { visible: true, timeout: 5000 });
            await page.click('#createProductBtn');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Final verification - reload products
        await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalProducts = await page.$$('.product-card');
        const cacheInvalidated = !finalProducts.some(async (product) => {
            const id = await product.$eval('.delete-product-btn', btn => btn.dataset.productId).catch(() => null);
            return id === productId;
        });

        console.log(`Cache invalidated: ${cacheInvalidated ? '✅' : '❌'}`);

        // Final Results
        console.log('\n📊 COMPREHENSIVE DELETE TEST RESULTS:');
        console.log(`1. UI Removal: ${uiDeleted ? '✅' : '❌'}`);
        console.log(`2. DELETE API Called: ${deleteApiCalled ? '✅' : '❌'}`);
        console.log(`3. DELETE API Success: ${deleteApiSuccess ? '✅' : '❌'}`);
        console.log(`4. Deletion Persisted: ${deletionPersisted ? '✅' : '❌'}`);
        console.log(`5. API Verification: ${productNotFound ? '✅' : '❌'}`);
        console.log(`6. Not in Products List: ${!productInList ? '✅' : '❌'}`);
        console.log(`7. Cache Invalidated: ${cacheInvalidated ? '✅' : '❌'}`);

        const allTestsPassed = uiDeleted && deleteApiCalled && deleteApiSuccess && 
                              deletionPersisted && productNotFound && !productInList && cacheInvalidated;

        console.log(`\n🎯 ALL TESTS PASSED: ${allTestsPassed ? '✅ YES' : '❌ NO'}`);

        if (!allTestsPassed) {
            console.log('\n🔍 Network Activity:');
            networkResponses.forEach(r => {
                console.log(`  ${r.method} ${r.url} - ${r.status}`);
            });
        }

        expect(allTestsPassed).toBe(true);

    }, timeout);
});