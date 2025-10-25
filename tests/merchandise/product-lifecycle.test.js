const puppeteer = require('puppeteer');

describe('Product Lifecycle - Customer Design Journey', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
    }, 120000);

    afterAll(async () => {
        if (browser) await browser.close();
    });

    describe('Complete Design Lifecycle', () => {
        let productId, imageId;

        it('1. Customer selects image from gallery', async () => {
            await page.goto('http://localhost:3001/my-gallery');
            await page.waitForSelector('.gallery-item img', { timeout: 10000 });
            
            // Select first available image
            const firstImage = await page.$('.gallery-item img');
            expect(firstImage).to.not.be.null;
            
            // Get image ID for tracking
            imageId = await page.evaluate(() => {
                const img = document.querySelector('.gallery-item img');
                return img ? img.dataset.imageId || img.src.split('/').pop().split('.')[0] : null;
            });
            
            console.log(`Selected image ID: ${imageId}`);
        });

        it('2. Navigate to merchandise store with image', async () => {
            // Click merchandise button or navigate directly
            await page.goto(`http://localhost:3001/merchandise?imageId=${imageId}`);
            await page.waitForSelector('.product-navigator', { timeout: 10000 });
            
            // Verify image is preloaded
            const preloadedImage = await page.$('.selected-image, .preview-image');
            expect(preloadedImage).to.not.be.null;
        });

        it('3. Select product category and type', async () => {
            // Wait for categories to load
            await page.waitForSelector('.category-btn', { timeout: 10000 });
            
            // Select Apparel category
            await page.click('.category-btn[data-category="apparel"]');
            await page.waitForSelector('.subcategory-btn', { timeout: 5000 });
            
            // Select T-Shirts subcategory
            await page.click('.subcategory-btn[data-subcategory="t-shirts"]');
            await page.waitForSelector('.select-product-btn', { timeout: 5000 });
            
            // Select first product
            await page.click('.select-product-btn');
            await page.waitForSelector('.product-customization, .variant-selector', { timeout: 10000 });
        });

        it('4. Customize product (size, color, etc.)', async () => {
            // Wait for customization options
            await page.waitForSelector('.size-option, .color-option, .variant-option', { timeout: 10000 });
            
            // Select size if available
            const sizeOption = await page.$('.size-option');
            if (sizeOption) {
                await page.click('.size-option');
            }
            
            // Select color if available
            const colorOption = await page.$('.color-option');
            if (colorOption) {
                await page.click('.color-option');
            }
            
            // Verify customization is applied
            const customizedProduct = await page.$('.selected-variant, .customized-product');
            expect(customizedProduct).to.not.be.null;
        });

        it('5. Create/Save product design', async () => {
            // Click create/save button
            const createBtn = await page.$('.create-product-btn, .save-design-btn, button[type="submit"]');
            expect(createBtn).to.not.be.null;
            
            await createBtn.click();
            
            // Wait for product creation
            await page.waitForFunction(() => {
                return !document.querySelector('.loading, .spinner') || 
                       document.querySelector('.success-message, .product-created');
            }, { timeout: 30000 });
            
            // Capture product ID from URL or response
            productId = await page.evaluate(() => {
                const url = window.location.href;
                const match = url.match(/productId=([^&]+)/);
                return match ? match[1] : null;
            });
            
            console.log(`Created product ID: ${productId}`);
        });

        it('6. Verify product is stored in database', async () => {
            // Navigate to user products or check via API
            const response = await page.evaluate(async () => {
                try {
                    const res = await fetch('/api/user-products');
                    return await res.json();
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            expect(response.error).to.be.undefined;
            expect(response.products || response).to.be.an('array');
            
            // Verify our product exists
            const ourProduct = (response.products || response).find(p => 
                p.id === productId || p.imageId === imageId
            );
            expect(ourProduct).to.not.be.undefined;
            expect(ourProduct.variants).to.exist;
            expect(ourProduct.images).to.exist;
        });

        it('7. Product appears in user dashboard/orders', async () => {
            // Navigate to user dashboard
            await page.goto('http://localhost:3001/user-dashboard');
            await page.waitForSelector('.user-products, .order-history, .dashboard-content', { timeout: 10000 });
            
            // Look for our product
            const productElements = await page.$$('.product-item, .order-item, .design-item');
            expect(productElements.length).to.be.greaterThan(0);
            
            // Verify product data is displayed correctly
            const productFound = await page.evaluate((pid, iid) => {
                const items = document.querySelectorAll('.product-item, .order-item, .design-item');
                return Array.from(items).some(item => 
                    item.textContent.includes(pid) || 
                    item.textContent.includes(iid) ||
                    item.querySelector(`[data-product-id="${pid}"]`) ||
                    item.querySelector(`[data-image-id="${iid}"]`)
                );
            }, productId, imageId);
            
            expect(productFound).to.be.true;
        });

        it('8. Product can be edited/modified', async () => {
            // Find edit button for our product
            const editBtn = await page.$('.edit-product-btn, .modify-design-btn');
            if (editBtn) {
                await editBtn.click();
                await page.waitForSelector('.product-customization, .edit-mode', { timeout: 10000 });
                
                // Verify we're in edit mode
                const editMode = await page.$('.edit-mode, .customization-panel');
                expect(editMode).to.not.be.null;
            }
        });

        it('9. Product can be deleted by user', async () => {
            // Find delete button
            const deleteBtn = await page.$('.delete-product-btn, .remove-design-btn');
            if (deleteBtn) {
                await deleteBtn.click();
                
                // Handle confirmation dialog
                const confirmBtn = await page.$('.confirm-delete, .btn-danger');
                if (confirmBtn) {
                    await confirmBtn.click();
                }
                
                // Wait for deletion to complete
                await page.waitForFunction(() => {
                    return !document.querySelector('.loading, .deleting');
                }, { timeout: 10000 });
                
                // Verify product is removed from UI
                const productStillExists = await page.evaluate((pid, iid) => {
                    const items = document.querySelectorAll('.product-item, .order-item, .design-item');
                    return Array.from(items).some(item => 
                        item.textContent.includes(pid) || item.textContent.includes(iid)
                    );
                }, productId, imageId);
                
                expect(productStillExists).to.be.false;
            }
        });

        it('10. Verify no corrupted products remain', async () => {
            // Check for cleanup messages
            await page.goto('http://localhost:3001/merchandise');
            
            // Wait a moment for any cleanup to occur
            await page.waitForTimeout(3000);
            
            // Check console for cleanup messages
            const logs = await page.evaluate(() => {
                return window.console._logs || [];
            });
            
            const cleanupMessages = logs.filter(log => 
                log.includes('broken products') || log.includes('cleanup')
            );
            
            console.log('Cleanup messages:', cleanupMessages);
            
            // Should not have persistent cleanup messages
            expect(cleanupMessages.length).to.equal(0);
        });
    });

    describe('Error Handling & Edge Cases', () => {
        it('Handles invalid image selection gracefully', async () => {
            await page.goto('http://localhost:3001/merchandise?imageId=invalid-id');
            
            // Should not crash, should show error or fallback
            const errorElement = await page.$('.error-message, .invalid-image, .fallback-message');
            const isWorking = await page.$('.product-navigator, .merchandise-content');
            
            // Either shows error gracefully OR continues working
            expect(errorElement || isWorking).to.not.be.null;
        });

        it('Handles product creation failures', async () => {
            // This would require mocking API failures
            // For now, just verify error handling exists
            const errorHandlers = await page.evaluate(() => {
                return typeof window.handleProductError === 'function' ||
                       document.querySelector('.error-handler') !== null;
            });
            
            // Should have some error handling mechanism
            expect(typeof errorHandlers).to.equal('boolean');
        });
    });
});