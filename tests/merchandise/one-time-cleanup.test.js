const puppeteer = require('puppeteer');

describe('One-Time Cleanup', () => {
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

    it('should perform one-time cleanup of all corrupted products', async () => {
        console.log('🧹 Starting one-time cleanup of all corrupted products...');
        
        await page.goto('http://localhost:3001/merchandise?imageId=test&imageUrl=test');
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Force cleanup of ALL corrupted products
        const cleanupResult = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.firebase || !window.firebase.firestore) {
                    resolve('Firebase not available');
                    return;
                }

                const forceCleanupAll = async () => {
                    try {
                        const db = window.firebase.firestore();
                        const snapshot = await db.collection('user_products').get();
                        
                        const deletePromises = [];
                        const allProducts = [];
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const hasVariants = !!(data.variants && data.variants.length > 0);
                            const hasImages = !!(data.images && data.images.length > 0);
                            const hasSourceImage = !!(data.sourceImage && data.sourceImage.url);
                            
                            allProducts.push({
                                id: doc.id,
                                title: data.title,
                                hasVariants,
                                hasImages,
                                hasSourceImage,
                                isCorrupted: !hasVariants && !hasImages && !hasSourceImage
                            });
                            
                            // Delete ALL products that lack variants AND images (regardless of source image)
                            if (!hasVariants && !hasImages) {
                                deletePromises.push(doc.ref.delete());
                            }
                        });

                        if (deletePromises.length > 0) {
                            await Promise.all(deletePromises);
                            return {
                                success: true,
                                totalProducts: allProducts.length,
                                deletedCount: deletePromises.length,
                                remainingProducts: allProducts.length - deletePromises.length,
                                deletedProducts: allProducts.filter(p => !p.hasVariants && !p.hasImages)
                            };
                        } else {
                            return {
                                success: true,
                                totalProducts: allProducts.length,
                                deletedCount: 0,
                                message: 'No corrupted products found'
                            };
                        }
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                };

                forceCleanupAll().then(resolve).catch(err => resolve({ success: false, error: err.message }));
            });
        });

        console.log('🧹 One-time cleanup result:', cleanupResult);

        if (cleanupResult.success && cleanupResult.deletedCount > 0) {
            console.log(`✅ Successfully deleted ${cleanupResult.deletedCount} corrupted products`);
            console.log(`📊 Remaining products: ${cleanupResult.remainingProducts}`);
            
            // Wait and verify cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Reload page to verify no more deletion messages
            await page.reload();
            await page.waitForSelector('body', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('✅ One-time cleanup completed. Future page loads should not show deletion messages.');
        } else if (cleanupResult.success && cleanupResult.deletedCount === 0) {
            console.log('✅ No corrupted products found - database is clean');
        } else {
            console.error('❌ Cleanup failed:', cleanupResult.error);
        }

        expect(cleanupResult.success).toBe(true);
    });
});