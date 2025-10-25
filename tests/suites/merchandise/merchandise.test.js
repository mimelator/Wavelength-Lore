/**
 * 🛍️ MERCHANDISE SYSTEM TEST SUITE
 * Comprehensive testing for product lifecycle, vendor integration, and customization
 * 
 * Consolidates 80+ scattered merchandise test files:
 * - test-merchandise-*
 * - test-printify-*
 * - test-teespring-*
 * - test-product-*
 * - test-vendor-*
 * - custom-merch-*
 * 
 * @author Test Suite Rationalization Project
 * @coverage Product Management, Vendor APIs, User Customization, Order Processing
 */

const puppeteer = require('puppeteer');
const request = require('supertest');
const { BrowserUtils, HttpUtils, AssertUtils, MockData, TestEnvironment, PerformanceUtils } = require('../utilities/test-utils');

describe('🛍️ Merchandise System', () => {
    let browser, page, testEnv;

    beforeAll(async () => {
        testEnv = new TestEnvironment();
        await testEnv.setup();
        browser = await puppeteer.launch(BrowserUtils.getConfig());
        console.log('🛍️ Merchandise test environment initialized');
    });

    afterAll(async () => {
        if (browser) await browser.close();
        await testEnv.cleanup();
        console.log('🧹 Merchandise test cleanup completed');
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await BrowserUtils.configurePage(page);
        await page.goto(testEnv.getBaseUrl() + '/merchandise');
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    describe('🏪 Product Catalog', () => {
        test('displays available merchandise categories', async () => {
            console.log('🔍 Testing product catalog display...');

            // Wait for merchandise grid to load
            await page.waitForSelector('.merchandise-grid', { timeout: 10000 });

            // Check for main product categories
            const categories = await page.evaluate(() => {
                const categoryElements = document.querySelectorAll('.product-category');
                return Array.from(categoryElements).map(el => ({
                    name: el.textContent.trim(),
                    products: el.querySelectorAll('.product-item').length
                }));
            });

            expect(categories.length).toBeGreaterThan(0);
            console.log(`✅ Found ${categories.length} product categories`);

            // Verify essential categories exist
            const categoryNames = categories.map(c => c.name.toLowerCase());
            expect(categoryNames).toContain('apparel');
            expect(categoryNames).toContain('accessories');
        });

        test('product items have required information', async () => {
            console.log('🏷️ Testing product information completeness...');

            await page.waitForSelector('.product-item');
            
            const products = await page.evaluate(() => {
                const productElements = document.querySelectorAll('.product-item');
                return Array.from(productElements).slice(0, 5).map(el => ({
                    title: el.querySelector('.product-title')?.textContent.trim(),
                    price: el.querySelector('.product-price')?.textContent.trim(),
                    image: el.querySelector('.product-image')?.src,
                    description: el.querySelector('.product-description')?.textContent.trim(),
                    vendor: el.dataset.vendor
                }));
            });

            expect(products.length).toBeGreaterThan(0);

            products.forEach((product, index) => {
                expect(product.title).toBeTruthy();
                expect(product.price).toMatch(/\$[\d,]+\.?\d*/);
                expect(product.image).toBeTruthy();
                expect(product.vendor).toBeTruthy();
                console.log(`✅ Product ${index + 1}: ${product.title} - ${product.price}`);
            });
        });

        test('product filtering works correctly', async () => {
            console.log('🔍 Testing product filtering functionality...');

            // Wait for filter controls
            await page.waitForSelector('.filter-controls');

            // Test category filter
            if (await page.$('.category-filter')) {
                await page.click('.category-filter[data-category="apparel"]');
                await page.waitForTimeout(1000); // Allow filter to apply

                const filteredProducts = await page.$$eval('.product-item:not(.hidden)', 
                    elements => elements.length
                );

                expect(filteredProducts).toBeGreaterThan(0);
                console.log(`✅ Category filter working: ${filteredProducts} apparel items shown`);
            }

            // Test price filter if available
            if (await page.$('.price-filter')) {
                await page.select('.price-filter', 'under-25');
                await page.waitForTimeout(1000);

                const priceFilteredProducts = await page.evaluate(() => {
                    const visibleProducts = document.querySelectorAll('.product-item:not(.hidden)');
                    return Array.from(visibleProducts).map(el => {
                        const priceText = el.querySelector('.product-price')?.textContent;
                        const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
                        return price;
                    });
                });

                priceFilteredProducts.forEach(price => {
                    expect(price).toBeLessThanOrEqual(25);
                });
                console.log(`✅ Price filter working: ${priceFilteredProducts.length} items under $25`);
            }
        });
    });

    describe('🏭 Vendor Integration', () => {
        test('Printify API integration', async () => {
            console.log('🖨️ Testing Printify vendor integration...');

            // Test Printify product loading
            const printifyResponse = await HttpUtils.get('/api/vendors/printify/products');
            expect(printifyResponse.status).toBe(200);
            expect(printifyResponse.data).toHaveProperty('products');
            expect(Array.isArray(printifyResponse.data.products)).toBe(true);

            if (printifyResponse.data.products.length > 0) {
                const sampleProduct = printifyResponse.data.products[0];
                expect(sampleProduct).toHaveProperty('id');
                expect(sampleProduct).toHaveProperty('title');
                expect(sampleProduct).toHaveProperty('variants');
                console.log(`✅ Printify integration working: ${printifyResponse.data.products.length} products`);
            }
        });

        test('vendor product synchronization', async () => {
            console.log('🔄 Testing vendor product sync...');

            // Trigger sync endpoint
            const syncResponse = await HttpUtils.post('/api/merchandise/sync-vendors');
            expect(syncResponse.status).toBeIn([200, 202]); // Accepted for async processing

            // Wait a bit for sync to process
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check sync status
            const statusResponse = await HttpUtils.get('/api/merchandise/sync-status');
            expect(statusResponse.status).toBe(200);
            expect(statusResponse.data).toHaveProperty('lastSync');
            console.log(`✅ Vendor sync status: ${statusResponse.data.lastSync}`);
        });

        test('vendor API error handling', async () => {
            console.log('🚨 Testing vendor API error handling...');

            // Test with invalid vendor
            const invalidVendorResponse = await HttpUtils.get('/api/vendors/invalid-vendor/products');
            expect(invalidVendorResponse.status).toBe(404);

            // Test API timeout handling (mock slow response)
            const timeoutResponse = await HttpUtils.get('/api/vendors/printify/products?timeout=1');
            // Should either succeed or fail gracefully, not hang
            expect([200, 408, 503]).toContain(timeoutResponse.status);
            console.log('✅ Error handling working correctly');
        });
    });

    describe('🎨 Product Customization', () => {
        test('custom design upload functionality', async () => {
            console.log('🎨 Testing custom design upload...');

            // Navigate to customization page
            await page.goto(testEnv.getBaseUrl() + '/merchandise/custom');
            await page.waitForSelector('.design-upload-area');

            // Test file upload simulation
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                // Simulate file selection
                await page.evaluate(() => {
                    const input = document.querySelector('input[type="file"]');
                    const file = new File(['test image data'], 'test-design.png', { type: 'image/png' });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });

                // Wait for upload processing
                await page.waitForTimeout(2000);

                // Check if upload was processed
                const uploadStatus = await page.evaluate(() => {
                    return document.querySelector('.upload-status')?.textContent;
                });

                expect(uploadStatus).toBeTruthy();
                console.log(`✅ Upload processed: ${uploadStatus}`);
            }
        });

        test('product preview generation', async () => {
            console.log('🖼️ Testing product preview generation...');

            // Click on a customizable product
            await page.click('.product-item[data-customizable="true"]');
            await page.waitForSelector('.product-customization-panel');

            // Check if preview canvas exists
            const previewCanvas = await page.$('.product-preview canvas');
            expect(previewCanvas).toBeTruthy();

            // Test color selection if available
            const colorOptions = await page.$$('.color-option');
            if (colorOptions.length > 0) {
                await page.click('.color-option:nth-child(2)');
                await page.waitForTimeout(1000);

                // Verify preview updated
                const previewUpdated = await page.evaluate(() => {
                    return document.querySelector('.product-preview')?.dataset.lastUpdate;
                });
                expect(previewUpdated).toBeTruthy();
                console.log('✅ Color customization working');
            }
        });

        test('size and variant selection', async () => {
            console.log('📏 Testing size and variant selection...');

            // Navigate to a product with variants
            await page.click('.product-item[data-has-variants="true"]');
            await page.waitForSelector('.variant-selection');

            // Test size selection
            const sizeOptions = await page.$$('.size-option');
            if (sizeOptions.length > 0) {
                await page.click('.size-option[data-size="L"]');
                
                const selectedSize = await page.evaluate(() => {
                    return document.querySelector('.size-option.selected')?.dataset.size;
                });
                expect(selectedSize).toBe('L');
                console.log('✅ Size selection working');
            }

            // Test price update with variant
            const priceDisplay = await page.$eval('.current-price', el => el.textContent);
            expect(priceDisplay).toMatch(/\$[\d,]+\.?\d*/);
            console.log(`✅ Price display: ${priceDisplay}`);
        });
    });

    describe('🛒 Shopping Cart & Orders', () => {
        test('add to cart functionality', async () => {
            console.log('🛒 Testing add to cart functionality...');

            // Add a product to cart
            await page.click('.product-item:first-child');
            await page.waitForSelector('.add-to-cart-btn');
            await page.click('.add-to-cart-btn');

            // Wait for cart update
            await page.waitForTimeout(1000);

            // Check cart count
            const cartCount = await page.$eval('.cart-count', el => parseInt(el.textContent));
            expect(cartCount).toBeGreaterThan(0);
            console.log(`✅ Cart updated: ${cartCount} items`);

            // Open cart and verify item
            await page.click('.cart-toggle');
            await page.waitForSelector('.cart-items');

            const cartItems = await page.$$eval('.cart-item', items => items.length);
            expect(cartItems).toBeGreaterThan(0);
            console.log(`✅ Cart contains ${cartItems} items`);
        });

        test('cart quantity updates', async () => {
            console.log('🔢 Testing cart quantity updates...');

            // Ensure we have an item in cart from previous test or add one
            const cartCount = await page.$eval('.cart-count', el => parseInt(el.textContent)).catch(() => 0);
            
            if (cartCount === 0) {
                await page.click('.product-item:first-child .add-to-cart-btn');
                await page.waitForTimeout(1000);
            }

            // Open cart
            await page.click('.cart-toggle');
            await page.waitForSelector('.cart-items');

            // Update quantity
            const quantityInput = await page.$('.quantity-input');
            if (quantityInput) {
                await page.clear('.quantity-input');
                await page.type('.quantity-input', '3');
                await page.keyboard.press('Enter');
                await page.waitForTimeout(1000);

                const updatedQuantity = await page.$eval('.quantity-input', el => parseInt(el.value));
                expect(updatedQuantity).toBe(3);
                console.log('✅ Quantity updated successfully');
            }
        });

        test('checkout process initiation', async () => {
            console.log('💳 Testing checkout process...');

            // Ensure cart has items
            await page.click('.cart-toggle');
            await page.waitForSelector('.checkout-btn');
            
            // Click checkout
            await page.click('.checkout-btn');
            
            // Should redirect to checkout page or show checkout form
            const checkoutIndicator = await Promise.race([
                page.waitForSelector('.checkout-form', { timeout: 5000 }).then(() => 'form'),
                page.waitForURL('**/checkout', { timeout: 5000 }).then(() => 'redirect'),
                page.waitForSelector('.login-required', { timeout: 5000 }).then(() => 'login')
            ]).catch(() => 'timeout');

            expect(['form', 'redirect', 'login']).toContain(checkoutIndicator);
            console.log(`✅ Checkout initiated: ${checkoutIndicator}`);
        });
    });

    describe('⚡ Performance & Reliability', () => {
        test('merchandise page load performance', async () => {
            console.log('⚡ Testing merchandise page performance...');

            const performanceMetrics = await PerformanceUtils.measurePageLoad(page, testEnv.getBaseUrl() + '/merchandise');
            
            expect(performanceMetrics.loadTime).toBeLessThan(5000);
            expect(performanceMetrics.domContentLoaded).toBeLessThan(3000);
            console.log(`✅ Page load: ${performanceMetrics.loadTime}ms, DOM ready: ${performanceMetrics.domContentLoaded}ms`);
        });

        test('image loading optimization', async () => {
            console.log('🖼️ Testing image loading performance...');

            const imageMetrics = await page.evaluate(() => {
                const images = document.querySelectorAll('.product-image img');
                const loadedImages = Array.from(images).filter(img => img.complete);
                const lazyImages = Array.from(images).filter(img => img.loading === 'lazy');
                
                return {
                    total: images.length,
                    loaded: loadedImages.length,
                    lazy: lazyImages.length
                };
            });

            expect(imageMetrics.total).toBeGreaterThan(0);
            expect(imageMetrics.loaded).toBeGreaterThan(0);
            console.log(`✅ Images: ${imageMetrics.loaded}/${imageMetrics.total} loaded, ${imageMetrics.lazy} lazy-loaded`);
        });

        test('API response times', async () => {
            console.log('⏱️ Testing API response times...');

            const apiTests = [
                { endpoint: '/api/merchandise/categories', maxTime: 1000 },
                { endpoint: '/api/merchandise/featured', maxTime: 2000 },
                { endpoint: '/api/vendors/printify/status', maxTime: 3000 }
            ];

            for (const test of apiTests) {
                const startTime = Date.now();
                const response = await HttpUtils.get(test.endpoint);
                const responseTime = Date.now() - startTime;

                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(test.maxTime);
                console.log(`✅ ${test.endpoint}: ${responseTime}ms (< ${test.maxTime}ms)`);
            }
        });
    });

    describe('🔧 Error Handling & Edge Cases', () => {
        test('handles out of stock products', async () => {
            console.log('📦 Testing out of stock handling...');

            // Look for out of stock products or simulate
            const outOfStockProducts = await page.$$('.product-item[data-stock="0"]');
            
            if (outOfStockProducts.length > 0) {
                await outOfStockProducts[0].click();
                
                const addToCartBtn = await page.$('.add-to-cart-btn');
                const isDisabled = await page.evaluate(btn => btn.disabled, addToCartBtn);
                
                expect(isDisabled).toBe(true);
                console.log('✅ Out of stock products properly disabled');
            } else {
                console.log('ℹ️ No out of stock products found for testing');
            }
        });

        test('handles network failures gracefully', async () => {
            console.log('🌐 Testing network failure handling...');

            // Simulate offline condition
            await page.setOfflineMode(true);
            
            // Try to load product data
            await page.reload({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
                // Expected to fail offline
            });
            
            // Check for offline message or cached content
            const offlineHandling = await Promise.race([
                page.waitForSelector('.offline-message', { timeout: 3000 }).then(() => 'message'),
                page.waitForSelector('.cached-content', { timeout: 3000 }).then(() => 'cached'),
                page.waitForTimeout(3000).then(() => 'none')
            ]);

            await page.setOfflineMode(false);
            expect(['message', 'cached']).toContain(offlineHandling);
            console.log(`✅ Offline handling: ${offlineHandling}`);
        });

        test('validates user input properly', async () => {
            console.log('✅ Testing input validation...');

            // Test custom design upload with invalid file
            await page.goto(testEnv.getBaseUrl() + '/merchandise/custom');
            
            if (await page.$('input[type="file"]')) {
                await page.evaluate(() => {
                    const input = document.querySelector('input[type="file"]');
                    // Simulate invalid file type
                    const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    input.files = dataTransfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });

                await page.waitForTimeout(1000);

                const errorMessage = await page.$('.error-message');
                expect(errorMessage).toBeTruthy();
                console.log('✅ File type validation working');
            }
        });
    });

    describe('📱 Mobile Responsiveness', () => {
        test('merchandise display on mobile devices', async () => {
            console.log('📱 Testing mobile responsiveness...');

            // Test different viewport sizes
            const viewports = [
                { width: 375, height: 667, name: 'iPhone' },
                { width: 768, height: 1024, name: 'iPad' },
                { width: 414, height: 896, name: 'iPhone Plus' }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.reload({ waitUntil: 'networkidle0' });

                // Check if mobile navigation exists
                const mobileNav = await page.$('.mobile-nav, .hamburger-menu');
                if (viewport.width < 768) {
                    expect(mobileNav).toBeTruthy();
                }

                // Check product grid responsiveness
                const gridColumns = await page.evaluate(() => {
                    const grid = document.querySelector('.merchandise-grid');
                    return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
                });

                expect(gridColumns).toBeTruthy();
                console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): responsive grid`);
            }

            // Reset to desktop
            await page.setViewport({ width: 1280, height: 800 });
        });
    });
});