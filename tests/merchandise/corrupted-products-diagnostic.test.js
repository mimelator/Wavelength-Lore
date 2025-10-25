const puppeteer = require('puppeteer');

describe('Corrupted Products Diagnostic', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Monitor console for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
            }
        });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should identify corrupted products and deletion failures', async () => {
        // Navigate to merchandise store with image selection
        await page.goto('http://localhost:3001/merchandise?imageId=test-image-123&imageUrl=test-url');
        await page.waitForSelector('body', { timeout: 10000 });

        // Check for deletion messages
        const deletionMessages = await page.$$eval('.alert, .message, [class*="delete"], [class*="clean"]', 
            elements => elements.map(el => ({
                text: el.textContent.trim(),
                className: el.className,
                visible: el.offsetParent !== null
            }))
        );

        console.log('🔍 Deletion Messages Found:', deletionMessages);

        // Check database state for corrupted products
        const corruptedProducts = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.firebase && window.firebase.firestore) {
                    const db = window.firebase.firestore();
                    db.collection('user_products')
                        .where('userId', '==', 'current-user-id')
                        .get()
                        .then(snapshot => {
                            const products = [];
                            snapshot.forEach(doc => {
                                const data = doc.data();
                                products.push({
                                    id: doc.id,
                                    hasVariants: !!data.variants && data.variants.length > 0,
                                    hasImages: !!data.images && data.images.length > 0,
                                    blueprintId: data.blueprint_id,
                                    providerId: data.provider_id,
                                    corrupted: (!data.variants || !data.images)
                                });
                            });
                            resolve(products);
                        })
                        .catch(() => resolve([]));
                } else {
                    resolve([]);
                }
            });
        });

        console.log('🗄️ Database Products:', corruptedProducts);

        // Check if cleanup function is being called
        const cleanupCalled = await page.evaluate(() => {
            return window.merchandiseStore && 
                   typeof window.merchandiseStore.cleanupBrokenProducts === 'function';
        });

        console.log('🧹 Cleanup Function Available:', cleanupCalled);

        // Check product categories visibility
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for async operations

        const categoriesVisible = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const categories = document.querySelectorAll('.category-card, .product-category');
            return {
                navigatorExists: !!navigator,
                navigatorVisible: navigator ? navigator.offsetParent !== null : false,
                categoryCount: categories.length,
                categoriesVisible: Array.from(categories).some(cat => cat.offsetParent !== null)
            };
        });

        console.log('📂 Categories State:', categoriesVisible);

        // Test manual cleanup trigger
        const cleanupResult = await page.evaluate(() => {
            if (window.merchandiseStore && window.merchandiseStore.cleanupBrokenProducts) {
                return window.merchandiseStore.cleanupBrokenProducts();
            }
            return 'cleanup function not available';
        });

        console.log('🔧 Manual Cleanup Result:', cleanupResult);

        // Assertions
        if (deletionMessages.length > 0) {
            console.log('✅ Found deletion messages as expected');
        }
        expect(categoriesVisible.navigatorExists).toBe(true);
        
        if (corruptedProducts.length > 0) {
            const actuallyCorrupted = corruptedProducts.filter(p => p.corrupted);
            console.log(`⚠️ Found ${actuallyCorrupted.length} corrupted products that should be deleted`);
        }
    });

    it('should test product category initialization after image selection', async () => {
        // Simulate the exact flow: gallery -> merchandise with image
        await page.goto('http://localhost:3001/user-gallery');
        await page.waitForSelector('body', { timeout: 10000 });

        // Click merchandise button (simulate the flow)
        await page.goto('http://localhost:3001/merchandise?imageId=gallery-test&imageUrl=http://localhost:3001/test-image.jpg');
        await page.waitForSelector('body', { timeout: 10000 });

        // Wait for merchandise store to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if product navigator initializes
        const initializationState = await page.evaluate(() => {
            return {
                merchandiseStoreExists: !!window.merchandiseStore,
                productNavigatorExists: !!window.ProductNavigator,
                navigatorInitialized: !!document.querySelector('.product-navigator'),
                imageSelected: !!document.querySelector('[data-image-id]'),
                categoriesLoaded: document.querySelectorAll('.category-card').length > 0,
                apiCalled: window.fetch && window.fetch.toString().includes('product-catalog')
            };
        });

        console.log('🚀 Initialization State:', initializationState);

        // Check network requests for catalog API
        const responses = [];
        page.on('response', response => {
            if (response.url().includes('product-catalog')) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    ok: response.ok()
                });
            }
        });

        // Trigger category loading manually if needed
        await page.evaluate(() => {
            if (window.merchandiseStore && window.merchandiseStore.initializeProductNavigator) {
                window.merchandiseStore.initializeProductNavigator();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        const finalState = await page.evaluate(() => {
            return {
                categoriesNow: document.querySelectorAll('.category-card').length,
                navigatorVisible: document.querySelector('.product-navigator')?.offsetParent !== null,
                errorMessages: Array.from(document.querySelectorAll('.error, .alert-danger')).map(el => el.textContent)
            };
        });

        console.log('📊 Final State:', finalState);
        console.log('🌐 API Responses:', responses);

        expect(initializationState.merchandiseStoreExists).toBe(true);
        expect(finalState.categoriesNow).toBeGreaterThan(0);
    });
});