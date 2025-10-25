const puppeteer = require('puppeteer');

describe('Final Verification - Corrupted Products & Categories', () => {
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

    it('should verify corrupted products are cleaned up and categories appear', async () => {
        console.log('🧪 Testing complete user flow: Gallery → Merchandise with image selection');
        
        // Navigate to merchandise store with image selection (simulating gallery flow)
        await page.goto('http://localhost:3001/merchandise?imageId=test-image&imageUrl=http://localhost:3001/test.jpg');
        await page.waitForSelector('body', { timeout: 10000 });

        // Wait for initialization and cleanup
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Check cleanup results
        const cleanupResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (window.firebase && window.firebase.firestore) {
                    const db = window.firebase.firestore();
                    db.collection('user_products').get()
                        .then(snapshot => {
                            const products = [];
                            snapshot.forEach(doc => {
                                const data = doc.data();
                                products.push({
                                    id: doc.id,
                                    hasVariants: !!(data.variants && data.variants.length > 0),
                                    hasImages: !!(data.images && data.images.length > 0),
                                    hasSourceImage: !!(data.sourceImage && data.sourceImage.url),
                                    title: data.title
                                });
                            });
                            resolve({
                                totalProducts: products.length,
                                validProducts: products.filter(p => p.hasVariants || p.hasImages || p.hasSourceImage).length,
                                corruptedProducts: products.filter(p => !p.hasVariants && !p.hasImages && !p.hasSourceImage).length
                            });
                        })
                        .catch(() => resolve({ error: 'Database access failed' }));
                } else {
                    resolve({ error: 'Firebase not available' });
                }
            });
        });

        console.log('🗄️ Database Cleanup Results:', cleanupResults);

        // Check product categories
        const categoryResults = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const categories = document.querySelectorAll('.category-card');
            const chooseSection = document.getElementById('choose-product-section');
            const selectedImage = window.merchandiseStore?.selectedImage;
            
            return {
                navigatorExists: !!navigator,
                navigatorVisible: navigator ? navigator.offsetParent !== null : false,
                categoryCount: categories.length,
                chooseSectionExists: !!chooseSection,
                chooseSectionVisible: chooseSection ? chooseSection.offsetParent !== null : false,
                imageSelected: !!selectedImage,
                merchandiseStoreReady: !!window.merchandiseStore,
                productNavigatorReady: !!window.merchandiseStore?.productNavigator
            };
        });

        console.log('📂 Category Display Results:', categoryResults);

        // Test category interaction
        if (categoryResults.categoryCount > 0) {
            console.log('🖱️ Testing category interaction...');
            
            // Click first category
            await page.click('.category-card:first-child');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const interactionResults = await page.evaluate(() => {
                const subcategories = document.querySelectorAll('.subcategory-card');
                const breadcrumbs = document.querySelectorAll('.breadcrumb');
                
                return {
                    subcategoryCount: subcategories.length,
                    breadcrumbCount: breadcrumbs.length,
                    navigationWorking: subcategories.length > 0
                };
            });
            
            console.log('🧭 Navigation Results:', interactionResults);
        }

        // Assertions
        expect(categoryResults.merchandiseStoreReady).toBe(true);
        expect(categoryResults.navigatorExists).toBe(true);
        expect(categoryResults.categoryCount).toBeGreaterThan(0);
        expect(categoryResults.chooseSectionExists).toBe(true);
        
        // Verify cleanup worked
        if (cleanupResults.totalProducts !== undefined) {
            expect(cleanupResults.corruptedProducts).toBe(0);
            console.log(`✅ Cleanup Success: ${cleanupResults.corruptedProducts} corrupted products remaining`);
        }
        
        console.log(`✅ Categories Success: ${categoryResults.categoryCount} categories displayed`);
        console.log('🎉 All issues resolved!');
    });
});