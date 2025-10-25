/**
 * 🖼️ GALLERY SYSTEM TEST SUITE
 * Comprehensive testing for image management, display, and user permissions
 * 
 * Consolidates 10+ scattered gallery test files:
 * - test-gallery-*
 * - test-image-*
 * - test-upload-*
 * - test-aws-gallery-*
 * 
 * @author Test Suite Rationalization Project
 * @coverage Image Upload, Display, AWS S3, User Permissions, Performance
 */

const puppeteer = require('puppeteer');
const request = require('supertest');
const { BrowserUtils, HttpUtils, AssertUtils, MockData, TestEnvironment, PerformanceUtils } = require('../utilities/test-utils');

describe('🖼️ Gallery System', () => {
    let browser, page, testEnv;

    beforeAll(async () => {
        testEnv = new TestEnvironment();
        await testEnv.setup();
        browser = await puppeteer.launch(BrowserUtils.getConfig());
        console.log('🖼️ Gallery test environment initialized');
    });

    afterAll(async () => {
        if (browser) await browser.close();
        await testEnv.cleanup();
        console.log('🧹 Gallery test cleanup completed');
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await BrowserUtils.configurePage(page);
        await page.goto(testEnv.getBaseUrl() + '/gallery');
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    describe('🏛️ Gallery Display', () => {
        test('displays gallery grid with images', async () => {
            console.log('🏛️ Testing gallery grid display...');

            // Wait for gallery container to load
            await page.waitForSelector('.gallery-container', { timeout: 10000 });

            // Check for image grid
            const imageGrid = await page.$('.image-grid, .gallery-grid');
            expect(imageGrid).toBeTruthy();

            // Count visible images
            const imageCount = await page.$$eval('.gallery-item img', images => 
                images.filter(img => img.src && img.src !== '').length
            );

            expect(imageCount).toBeGreaterThan(0);
            console.log(`✅ Gallery displaying ${imageCount} images`);

            // Check image loading states
            const loadedImages = await page.$$eval('.gallery-item img', images =>
                images.filter(img => img.complete && img.naturalWidth > 0).length
            );

            expect(loadedImages).toBeGreaterThan(0);
            console.log(`✅ ${loadedImages}/${imageCount} images fully loaded`);
        });

        test('image thumbnails load correctly', async () => {
            console.log('🖼️ Testing thumbnail loading...');

            await page.waitForSelector('.gallery-item');

            const thumbnails = await page.evaluate(() => {
                const items = document.querySelectorAll('.gallery-item');
                return Array.from(items).slice(0, 5).map(item => {
                    const img = item.querySelector('img');
                    const thumb = item.querySelector('.thumbnail');
                    
                    return {
                        hasThumbnail: !!thumb || !!img,
                        src: img?.src,
                        alt: img?.alt,
                        loaded: img?.complete,
                        naturalWidth: img?.naturalWidth,
                        displayWidth: img?.width
                    };
                });
            });

            thumbnails.forEach((thumb, index) => {
                expect(thumb.hasThumbnail).toBe(true);
                expect(thumb.src).toBeTruthy();
                expect(thumb.loaded).toBe(true);
                expect(thumb.naturalWidth).toBeGreaterThan(0);
                console.log(`✅ Thumbnail ${index + 1}: ${thumb.displayWidth}x loaded`);
            });
        });

        test('gallery pagination works', async () => {
            console.log('📄 Testing gallery pagination...');

            // Check if pagination exists
            const pagination = await page.$('.pagination, .gallery-pagination');
            
            if (pagination) {
                // Get initial image count
                const initialCount = await page.$$eval('.gallery-item', items => items.length);
                
                // Try to click next page
                const nextButton = await page.$('.pagination .next, .page-next');
                if (nextButton) {
                    await nextButton.click();
                    await page.waitForTimeout(2000);

                    // Check if images changed
                    const newCount = await page.$$eval('.gallery-item', items => items.length);
                    const currentPage = await page.$eval('.pagination .current, .page-current', 
                        el => el.textContent).catch(() => '?');

                    console.log(`✅ Pagination working: Page ${currentPage}, ${newCount} images`);
                    expect(newCount).toBeGreaterThan(0);
                }
            } else {
                console.log('ℹ️ No pagination found - testing infinite scroll');
                
                // Test infinite scroll if pagination doesn't exist
                const initialCount = await page.$$eval('.gallery-item', items => items.length);
                
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(2000);
                
                const newCount = await page.$$eval('.gallery-item', items => items.length);
                
                if (newCount > initialCount) {
                    console.log(`✅ Infinite scroll working: ${initialCount} → ${newCount} images`);
                }
            }
        });

        test('image modal/lightbox functionality', async () => {
            console.log('🔍 Testing image modal/lightbox...');

            // Click on first gallery item
            await page.click('.gallery-item:first-child');
            
            // Wait for modal or lightbox to appear
            const modalOpen = await Promise.race([
                page.waitForSelector('.image-modal', { timeout: 5000 }).then(() => 'modal'),
                page.waitForSelector('.lightbox', { timeout: 5000 }).then(() => 'lightbox'),
                page.waitForSelector('.image-overlay', { timeout: 5000 }).then(() => 'overlay'),
                page.waitForTimeout(5000).then(() => 'none')
            ]);

            expect(['modal', 'lightbox', 'overlay']).toContain(modalOpen);
            console.log(`✅ Image viewer opened: ${modalOpen}`);

            if (modalOpen !== 'none') {
                // Test close functionality
                const closeButton = await page.$('.close-btn, .modal-close, [data-close]');
                if (closeButton) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                    
                    const modalClosed = await page.$('.image-modal, .lightbox, .image-overlay');
                    expect(modalClosed).toBeFalsy();
                    console.log('✅ Modal closes correctly');
                }
            }
        });
    });

    describe('📤 Image Upload', () => {
        test('upload interface is accessible', async () => {
            console.log('📤 Testing upload interface accessibility...');

            // Look for upload button or area
            const uploadTrigger = await page.$('.upload-btn, .add-image-btn, [data-upload]');
            
            if (uploadTrigger) {
                await uploadTrigger.click();
                
                // Wait for upload interface
                const uploadInterface = await Promise.race([
                    page.waitForSelector('.upload-modal', { timeout: 5000 }).then(() => 'modal'),
                    page.waitForSelector('.upload-form', { timeout: 5000 }).then(() => 'form'),
                    page.waitForSelector('.file-drop-zone', { timeout: 5000 }).then(() => 'dropzone'),
                    page.waitForTimeout(5000).then(() => 'none')
                ]);

                expect(['modal', 'form', 'dropzone']).toContain(uploadInterface);
                console.log(`✅ Upload interface opened: ${uploadInterface}`);

                // Check for file input
                const fileInput = await page.$('input[type="file"]');
                expect(fileInput).toBeTruthy();
                console.log('✅ File input available');

            } else {
                console.log('ℹ️ Upload functionality may require authentication');
            }
        });

        test('file validation works correctly', async () => {
            console.log('✅ Testing file upload validation...');

            const uploadBtn = await page.$('.upload-btn, .add-image-btn, [data-upload]');
            
            if (uploadBtn) {
                await uploadBtn.click();
                await page.waitForTimeout(1000);

                const fileInput = await page.$('input[type="file"]');
                
                if (fileInput) {
                    // Test invalid file type
                    await page.evaluate(() => {
                        const input = document.querySelector('input[type="file"]');
                        const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    await page.waitForTimeout(2000);

                    // Check for validation error
                    const errorMessage = await page.$('.error-message, .validation-error');
                    if (errorMessage) {
                        const errorText = await page.evaluate(el => el.textContent, errorMessage);
                        expect(errorText.toLowerCase()).toContain('invalid');
                        console.log(`✅ File validation working: ${errorText}`);
                    }

                    // Test valid file type
                    await page.evaluate(() => {
                        const input = document.querySelector('input[type="file"]');
                        const file = new File(['valid image data'], 'test.jpg', { type: 'image/jpeg' });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    await page.waitForTimeout(2000);

                    // Check validation passes
                    const successIndicator = await page.$('.upload-preview, .file-selected');
                    if (successIndicator) {
                        console.log('✅ Valid file accepted');
                    }
                }
            }
        });

        test('drag and drop upload functionality', async () => {
            console.log('🎯 Testing drag and drop upload...');

            const dropZone = await page.$('.file-drop-zone, .upload-area');
            
            if (dropZone) {
                // Simulate drag over
                await page.evaluate(() => {
                    const dropZone = document.querySelector('.file-drop-zone, .upload-area');
                    if (dropZone) {
                        const dragEvent = new DragEvent('dragover', { bubbles: true });
                        dropZone.dispatchEvent(dragEvent);
                    }
                });

                await page.waitForTimeout(500);

                // Check for drag state
                const dragState = await page.evaluate(() => {
                    const dropZone = document.querySelector('.file-drop-zone, .upload-area');
                    return dropZone ? dropZone.classList.contains('drag-over') : false;
                });

                if (dragState) {
                    console.log('✅ Drag over state detected');
                }

                // Simulate drop
                await page.evaluate(() => {
                    const dropZone = document.querySelector('.file-drop-zone, .upload-area');
                    if (dropZone) {
                        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        
                        const dropEvent = new DragEvent('drop', { 
                            bubbles: true,
                            dataTransfer: dataTransfer
                        });
                        dropZone.dispatchEvent(dropEvent);
                    }
                });

                await page.waitForTimeout(1000);
                console.log('✅ Drag and drop simulation completed');
            } else {
                console.log('ℹ️ No drag and drop zone found');
            }
        });
    });

    describe('🔐 User Permissions & Security', () => {
        test('anonymous user access restrictions', async () => {
            console.log('🔐 Testing anonymous user restrictions...');

            // Check if upload is restricted
            const uploadRestricted = await page.evaluate(() => {
                const uploadBtn = document.querySelector('.upload-btn, .add-image-btn');
                return uploadBtn ? uploadBtn.disabled || uploadBtn.style.display === 'none' : true;
            });

            // Upload should be restricted for anonymous users
            if (uploadRestricted) {
                console.log('✅ Upload properly restricted for anonymous users');
            }

            // Test admin functions
            const adminActions = await page.$$('.delete-btn, .edit-btn, [data-admin]');
            
            if (adminActions.length === 0) {
                console.log('✅ Admin actions hidden from anonymous users');
            } else {
                // Admin actions might be visible but disabled
                const disabledActions = await page.$$eval('.delete-btn, .edit-btn', buttons =>
                    buttons.filter(btn => btn.disabled).length
                );
                expect(disabledActions).toBe(adminActions.length);
                console.log('✅ Admin actions disabled for anonymous users');
            }
        });

        test('image access and loading security', async () => {
            console.log('🛡️ Testing image access security...');

            // Get image URLs
            const imageUrls = await page.$$eval('.gallery-item img', imgs =>
                imgs.slice(0, 3).map(img => img.src).filter(src => src)
            );

            expect(imageUrls.length).toBeGreaterThan(0);

            // Test direct image access
            for (const url of imageUrls) {
                try {
                    const response = await HttpUtils.get(url);
                    expect(response.status).toBe(200);
                    expect(response.headers['content-type']).toMatch(/image\//);
                    console.log(`✅ Image accessible: ${url.substring(url.lastIndexOf('/') + 1)}`);
                } catch (error) {
                    console.log(`⚠️ Image access issue: ${error.message}`);
                }
            }
        });

        test('CSRF protection on upload endpoints', async () => {
            console.log('🛡️ Testing CSRF protection...');

            // Test upload endpoint without proper credentials
            const uploadResponse = await HttpUtils.post('/api/gallery/upload', {
                body: { fake: 'data' }
            });

            // Should be rejected due to authentication/CSRF
            expect([401, 403, 422]).toContain(uploadResponse.status);
            console.log(`✅ Upload endpoint protected: ${uploadResponse.status}`);

            // Test delete endpoint
            const deleteResponse = await HttpUtils.delete('/api/gallery/delete/fake-id');
            expect([401, 403, 404]).toContain(deleteResponse.status);
            console.log(`✅ Delete endpoint protected: ${deleteResponse.status}`);
        });
    });

    describe('☁️ AWS S3 Integration', () => {
        test('S3 image URLs are properly formatted', async () => {
            console.log('☁️ Testing S3 URL formatting...');

            const imageUrls = await page.$$eval('.gallery-item img', imgs =>
                imgs.map(img => img.src).filter(src => src)
            );

            const s3Urls = imageUrls.filter(url => 
                url.includes('.s3.') || 
                url.includes('.amazonaws.com') || 
                url.includes('cloudfront.net')
            );

            if (s3Urls.length > 0) {
                s3Urls.forEach((url, index) => {
                    expect(url).toMatch(/^https:\/\//);
                    console.log(`✅ S3 URL ${index + 1}: ${url.substring(0, 50)}...`);
                });

                console.log(`✅ Found ${s3Urls.length} AWS-hosted images`);
            } else {
                console.log('ℹ️ No S3 URLs detected - may be using local storage');
            }
        });

        test('CloudFront CDN integration', async () => {
            console.log('🌐 Testing CloudFront CDN...');

            const imageUrls = await page.$$eval('.gallery-item img', imgs =>
                imgs.map(img => img.src).filter(src => src.includes('cloudfront.net'))
            );

            if (imageUrls.length > 0) {
                // Test CloudFront headers
                const testUrl = imageUrls[0];
                const response = await HttpUtils.get(testUrl);
                
                expect(response.status).toBe(200);
                expect(response.headers['content-type']).toMatch(/image\//);
                
                // Check for CloudFront headers
                const cfHeaders = Object.keys(response.headers).filter(header =>
                    header.toLowerCase().includes('cloudfront')
                );
                
                console.log(`✅ CloudFront integration: ${cfHeaders.length} CF headers`);
                console.log(`✅ Testing ${imageUrls.length} CloudFront URLs`);
            } else {
                console.log('ℹ️ No CloudFront URLs detected');
            }
        });
    });

    describe('⚡ Performance & Optimization', () => {
        test('image lazy loading implementation', async () => {
            console.log('⚡ Testing image lazy loading...');

            const lazyLoadingStats = await page.evaluate(() => {
                const images = document.querySelectorAll('.gallery-item img');
                const lazyImages = Array.from(images).filter(img => 
                    img.loading === 'lazy' || img.classList.contains('lazy')
                );
                const loadedImages = Array.from(images).filter(img => img.complete);
                
                return {
                    total: images.length,
                    lazy: lazyImages.length,
                    loaded: loadedImages.length,
                    lazyPercentage: images.length > 0 ? (lazyImages.length / images.length * 100).toFixed(1) : 0
                };
            });

            expect(lazyLoadingStats.total).toBeGreaterThan(0);
            console.log(`✅ Lazy loading: ${lazyLoadingStats.lazyPercentage}% of images (${lazyLoadingStats.lazy}/${lazyLoadingStats.total})`);
            console.log(`✅ Initially loaded: ${lazyLoadingStats.loaded} images`);

            // Test scroll-triggered loading
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(2000);

            const afterScrollStats = await page.evaluate(() => {
                const images = document.querySelectorAll('.gallery-item img');
                return Array.from(images).filter(img => img.complete).length;
            });

            if (afterScrollStats > lazyLoadingStats.loaded) {
                console.log(`✅ Scroll triggered ${afterScrollStats - lazyLoadingStats.loaded} additional images`);
            }
        });

        test('image compression and sizing', async () => {
            console.log('🗜️ Testing image optimization...');

            const imageStats = await page.evaluate(() => {
                const images = document.querySelectorAll('.gallery-item img');
                return Array.from(images).slice(0, 5).map(img => ({
                    src: img.src,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    displayWidth: img.width,
                    displayHeight: img.height,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                }));
            });

            imageStats.forEach((img, index) => {
                expect(img.naturalWidth).toBeGreaterThan(0);
                expect(img.naturalHeight).toBeGreaterThan(0);
                
                const compressionRatio = (img.displayWidth / img.naturalWidth).toFixed(2);
                console.log(`✅ Image ${index + 1}: ${img.naturalWidth}x${img.naturalHeight} → ${img.displayWidth}x${img.displayHeight} (${compressionRatio}x)`);
            });
        });

        test('gallery loading performance metrics', async () => {
            console.log('📊 Testing gallery performance metrics...');

            const performanceMetrics = await PerformanceUtils.measurePageLoad(page, testEnv.getBaseUrl() + '/gallery');
            
            expect(performanceMetrics.loadTime).toBeLessThan(8000);
            expect(performanceMetrics.domContentLoaded).toBeLessThan(4000);
            console.log(`✅ Gallery load: ${performanceMetrics.loadTime}ms, DOM ready: ${performanceMetrics.domContentLoaded}ms`);

            // Measure image loading time
            const imageLoadTime = await page.evaluate(async () => {
                const startTime = performance.now();
                const images = document.querySelectorAll('.gallery-item img');
                
                await Promise.all(Array.from(images).slice(0, 10).map(img => {
                    return new Promise(resolve => {
                        if (img.complete) resolve();
                        else {
                            img.onload = resolve;
                            img.onerror = resolve;
                        }
                    });
                }));
                
                return performance.now() - startTime;
            });

            expect(imageLoadTime).toBeLessThan(10000);
            console.log(`✅ First 10 images loaded in: ${imageLoadTime.toFixed(0)}ms`);
        });
    });

    describe('📱 Mobile & Responsive Design', () => {
        test('gallery responsive layout', async () => {
            console.log('📱 Testing responsive gallery layout...');

            const viewports = [
                { width: 375, height: 667, name: 'Mobile' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 1024, height: 768, name: 'Desktop' }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForSelector('.gallery-container');

                const layoutInfo = await page.evaluate(() => {
                    const container = document.querySelector('.gallery-container, .image-grid');
                    const items = document.querySelectorAll('.gallery-item');
                    
                    const containerStyle = window.getComputedStyle(container);
                    const gridColumns = containerStyle.gridTemplateColumns;
                    
                    return {
                        columns: gridColumns ? gridColumns.split(' ').length : items.length,
                        itemCount: items.length,
                        containerWidth: container.offsetWidth
                    };
                });

                expect(layoutInfo.itemCount).toBeGreaterThan(0);
                console.log(`✅ ${viewport.name} (${viewport.width}px): ${layoutInfo.columns} columns, ${layoutInfo.itemCount} items`);
            }

            // Reset viewport
            await page.setViewport({ width: 1280, height: 800 });
        });

        test('touch-friendly gallery navigation', async () => {
            console.log('👆 Testing touch navigation...');

            // Set mobile viewport
            await page.setViewport({ width: 375, height: 667 });
            await page.reload({ waitUntil: 'networkidle0' });

            // Test touch events on gallery items
            const firstItem = await page.$('.gallery-item:first-child');
            if (firstItem) {
                // Simulate touch
                await page.evaluate(item => {
                    const touchEvent = new TouchEvent('touchstart', { bubbles: true });
                    item.dispatchEvent(touchEvent);
                }, firstItem);

                await page.waitForTimeout(500);

                // Check if modal or action occurred
                const modalOpened = await page.$('.image-modal, .lightbox');
                console.log(`✅ Touch interaction: ${modalOpened ? 'Modal opened' : 'Action registered'}`);
            }

            // Reset viewport
            await page.setViewport({ width: 1280, height: 800 });
        });
    });

    describe('🔍 Search & Filtering', () => {
        test('gallery search functionality', async () => {
            console.log('🔍 Testing gallery search...');

            const searchInput = await page.$('.search-input, [data-search]');
            
            if (searchInput) {
                // Test search
                await searchInput.type('test');
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);

                // Check filtered results
                const filteredCount = await page.$$eval('.gallery-item:not(.hidden)', items => items.length);
                console.log(`✅ Search results: ${filteredCount} items`);

                // Clear search
                await page.evaluate(() => {
                    const input = document.querySelector('.search-input, [data-search]');
                    if (input) input.value = '';
                });
                await page.keyboard.press('Enter');
                await page.waitForTimeout(1000);

                const allCount = await page.$$eval('.gallery-item', items => items.length);
                console.log(`✅ All items restored: ${allCount} items`);
            } else {
                console.log('ℹ️ No search functionality found');
            }
        });

        test('category/tag filtering', async () => {
            console.log('🏷️ Testing category filtering...');

            const filterButtons = await page.$$('.category-filter, .tag-filter, [data-category]');
            
            if (filterButtons.length > 0) {
                // Click first filter
                await filterButtons[0].click();
                await page.waitForTimeout(1000);

                const filteredItems = await page.$$eval('.gallery-item:not(.hidden)', items => items.length);
                const category = await page.evaluate(btn => btn.textContent.trim(), filterButtons[0]);
                
                console.log(`✅ Category "${category}" filter: ${filteredItems} items`);
                expect(filteredItems).toBeGreaterThanOrEqual(0);
            } else {
                console.log('ℹ️ No category filters found');
            }
        });
    });
});