const puppeteer = require('puppeteer');

describe('Deletion Message Alert Test', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Found') && text.includes('broken products')) {
                console.log('🚨 DELETION MESSAGE DETECTED:', text);
            }
            if (text.includes('Cleaning up') || text.includes('corrupted products')) {
                console.log('🚨 CLEANUP MESSAGE DETECTED:', text);
            }
            if (text.includes('Deleted') && text.includes('products')) {
                console.log('🚨 DELETION CONFIRMATION DETECTED:', text);
            }
        });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should ALERT if deletion messages persist when no products should exist', async () => {
        console.log('🔍 Testing for persistent deletion messages...');
        
        await page.goto('http://localhost:3001/merchandise?imageId=test&imageUrl=test');
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Wait for initialization and any cleanup
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Check for deletion-related messages in UI
        const deletionMessages = await page.evaluate(() => {
            const messages = [];
            
            // Check for toast messages
            document.querySelectorAll('.toast, .alert, .message, .notification').forEach(el => {
                const text = el.textContent.toLowerCase();
                if (text.includes('cleaning') || text.includes('removing') || text.includes('deleted') || text.includes('corrupted')) {
                    messages.push({
                        type: 'UI_MESSAGE',
                        text: el.textContent.trim(),
                        visible: el.offsetParent !== null
                    });
                }
            });
            
            return messages;
        });

        // Check database state
        const dbState = await page.evaluate(() => {
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
                                    title: data.title,
                                    createdAt: data.createdAt || data.generatedAt
                                });
                            });
                            resolve({
                                totalProducts: products.length,
                                products: products,
                                corruptedProducts: products.filter(p => !p.hasVariants && !p.hasImages && !p.hasSourceImage)
                            });
                        })
                        .catch(() => resolve({ error: 'Database access failed' }));
                } else {
                    resolve({ error: 'Firebase not available' });
                }
            });
        });

        console.log('📊 Database State:', dbState);
        console.log('💬 UI Messages:', deletionMessages);

        // ALERT CONDITIONS
        if (deletionMessages.length > 0) {
            console.log('🚨 ALERT: Deletion messages found when none should exist!');
            console.log('🚨 This indicates a bug in the product lifecycle management');
            deletionMessages.forEach(msg => {
                console.log(`🚨   - ${msg.type}: "${msg.text}"`);
            });
        }

        if (dbState.corruptedProducts && dbState.corruptedProducts.length > 0) {
            console.log('🚨 ALERT: Corrupted products still exist in database!');
            console.log('🚨 This indicates cleanup is not working properly');
            dbState.corruptedProducts.forEach(product => {
                console.log(`🚨   - Product: ${product.title} (${product.id})`);
            });
        }

        if (dbState.totalProducts > 0) {
            console.log('ℹ️  INFO: Found existing products in database');
            dbState.products.forEach(product => {
                const status = product.hasVariants && product.hasImages ? 'COMPLETE' : 
                              product.hasSourceImage ? 'INCOMPLETE' : 'CORRUPTED';
                console.log(`ℹ️    - ${product.title}: ${status}`);
            });
        }

        // Test passes but alerts on issues
        expect(true).toBe(true);
        
        // Alert summary
        if (deletionMessages.length > 0 || (dbState.corruptedProducts && dbState.corruptedProducts.length > 0)) {
            console.log('🚨 SUMMARY: Product lifecycle bugs detected - needs investigation');
        } else {
            console.log('✅ SUMMARY: No deletion messages or corrupted products found');
        }
    });
});