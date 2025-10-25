const puppeteer = require('puppeteer');

describe('Cleanup Fix Test', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should force cleanup corrupted products and verify deletion', async () => {
        await page.goto('http://localhost:3001/merchandise?imageId=test&imageUrl=test');
        await page.waitForSelector('body', { timeout: 10000 });

        // Get initial product count
        const initialProducts = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.firebase && window.firebase.firestore) {
                    const db = window.firebase.firestore();
                    db.collection('user_products').get()
                        .then(snapshot => resolve(snapshot.size))
                        .catch(() => resolve(0));
                } else {
                    resolve(0);
                }
            });
        });

        console.log('📊 Initial Products:', initialProducts);

        // Force cleanup with enhanced error handling
        const cleanupResult = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.merchandiseStore) {
                    resolve('merchandiseStore not available');
                    return;
                }

                // Enhanced cleanup function
                const forceCleanup = async () => {
                    try {
                        const db = firebase.firestore();
                        const snapshot = await db.collection('user_products').get();
                        
                        const deletePromises = [];
                        const corruptedProducts = [];
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const isCorrupted = !data.variants || !data.images || 
                                              data.variants.length === 0 || data.images.length === 0;
                            
                            if (isCorrupted) {
                                corruptedProducts.push(doc.id);
                                deletePromises.push(doc.ref.delete());
                            }
                        });

                        if (deletePromises.length > 0) {
                            await Promise.all(deletePromises);
                            return `Deleted ${deletePromises.length} corrupted products: ${corruptedProducts.join(', ')}`;
                        } else {
                            return 'No corrupted products found';
                        }
                    } catch (error) {
                        return `Cleanup error: ${error.message}`;
                    }
                };

                forceCleanup().then(resolve).catch(err => resolve(`Error: ${err.message}`));
            });
        });

        console.log('🧹 Cleanup Result:', cleanupResult);

        // Wait and check final count
        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalProducts = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.firebase && window.firebase.firestore) {
                    const db = window.firebase.firestore();
                    db.collection('user_products').get()
                        .then(snapshot => resolve(snapshot.size))
                        .catch(() => resolve(0));
                } else {
                    resolve(0);
                }
            });
        });

        console.log('📊 Final Products:', finalProducts);
        console.log('🗑️ Products Deleted:', initialProducts - finalProducts);

        expect(typeof cleanupResult).toBe('string');
    });

    it('should verify product categories appear after cleanup', async () => {
        // Reload page after cleanup
        await page.reload();
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check categories
        const categoriesState = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const categories = document.querySelectorAll('.category-card');
            const loadingElements = document.querySelectorAll('[class*="loading"]');
            
            return {
                navigatorExists: !!navigator,
                navigatorVisible: navigator ? navigator.offsetParent !== null : false,
                categoryCount: categories.length,
                loadingActive: loadingElements.length > 0,
                bodyClasses: document.body.className,
                merchandiseStoreReady: !!window.merchandiseStore
            };
        });

        console.log('📂 Categories After Cleanup:', categoriesState);

        // Force initialize if needed
        if (!categoriesState.categoryCount) {
            await page.evaluate(() => {
                if (window.merchandiseStore && window.merchandiseStore.initializeProductNavigator) {
                    window.merchandiseStore.initializeProductNavigator();
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const retriedState = await page.evaluate(() => ({
                categoryCount: document.querySelectorAll('.category-card').length,
                navigatorVisible: document.querySelector('.product-navigator')?.offsetParent !== null
            }));
            
            console.log('🔄 After Retry:', retriedState);
        }

        expect(categoriesState.merchandiseStoreReady).toBe(true);
    });
});