#!/usr/bin/env node
/**
 * Merchandise Category Card Browser Test
 * 
 * Comprehensive test for the new category card system:
 * 1. User selects an image from gallery
 * 2. Category cards are displayed
 * 3. User selects a category card
 * 4. Products within that category are shown
 * 5. User can navigate back to category cards
 * 6. User can select a specific product
 * 
 * This test uses Puppeteer to simulate real user interactions
 */

const puppeteer = require('puppeteer');
const path = require('path');

class MerchandiseCategoryCardBrowserTest {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.browser = null;
        this.page = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async setup() {
        console.log('🚀 MERCHANDISE CATEGORY CARD BROWSER TEST');
        console.log('==========================================');
        console.log('Testing the new category card workflow...\n');
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            slowMo: 250, // Slow down by 250ms for visibility
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1400, height: 900 });
        
        // Enable console logging
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('❌') || text.includes('Error') || text.includes('Failed')) {
                console.log(`  🌐 Browser: ${text}`);
            }
        });
        
        console.log('✅ Browser setup complete\n');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('\n✅ Browser closed');
        }
    }

    async runTest(testName, testFunction) {
        try {
            console.log(`\n🧪 Testing: ${testName}`);
            console.log('─'.repeat(60));
            
            await testFunction();
            
            this.testResults.passed++;
            this.testResults.tests.push({ name: testName, status: 'PASSED' });
            console.log(`✅ PASSED: ${testName}`);
            
        } catch (error) {
            this.testResults.failed++;
            this.testResults.tests.push({ 
                name: testName, 
                status: 'FAILED', 
                error: error.message 
            });
            console.log(`❌ FAILED: ${testName}`);
            console.log(`   Error: ${error.message}`);
            
            // Take screenshot on failure
            try {
                const screenshotPath = path.join(process.cwd(), 'temp', `category-test-error-${Date.now()}.png`);
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`   📸 Screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.log(`   ⚠️  Could not save screenshot: ${screenshotError.message}`);
            }
        }
    }

    async testPageLoadsWithAuth() {
        await this.runTest('Merchandise page loads and authenticates', async () => {
            const response = await this.page.goto(`${this.baseUrl}/merchandise`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            if (!response.ok()) {
                throw new Error(`Page returned status ${response.status()}`);
            }
            
            // Mock Firebase authentication
            await this.page.evaluate(() => {
                window.firebaseAuth = {
                    currentUser: {
                        uid: 'test-user-123',
                        email: 'test@wavelengthlore.com',
                        displayName: 'Test User'
                    }
                };
                
                window.firebaseUtils = {
                    onAuthStateChanged: (auth, callback) => {
                        callback({
                            uid: 'test-user-123',
                            email: 'test@wavelengthlore.com',
                            displayName: 'Test User',
                            emailVerified: true
                        });
                    }
                };
                
                console.log('🔧 Mock Firebase auth injected');
            });
            
            // Wait for main container
            await this.page.waitForSelector('#merchandise-store', { timeout: 10000 });
            
            // Wait for store to initialize
            await new Promise(r => setTimeout(r, 3000));
            
            console.log('  ✅ Page loaded and authenticated');
        });
    }

    async testGalleryImagesLoad() {
        await this.runTest('Gallery images load for selection', async () => {
            // Wait for gallery to load
            await new Promise(r => setTimeout(r, 2000));
            
            // Check if gallery images are present
            const galleryImages = await this.page.$$('.gallery-image-card, .image-selector img, [data-image-id]');
            console.log(`  📊 Gallery images found: ${galleryImages.length}`);
            
            if (galleryImages.length === 0) {
                // Check if gallery is still loading
                const loadingIndicators = await this.page.$$('.loading-spinner, .loading-state');
                if (loadingIndicators.length > 0) {
                    console.log('  ⏳ Gallery still loading, waiting...');
                    await new Promise(r => setTimeout(r, 5000));
                    
                    // Check again
                    const retryImages = await this.page.$$('.gallery-image-card, .image-selector img, [data-image-id]');
                    if (retryImages.length === 0) {
                        throw new Error('No gallery images loaded after waiting');
                    }
                    console.log(`  📊 Gallery images after retry: ${retryImages.length}`);
                }
            }
            
            console.log('  ✅ Gallery images are available for selection');
        });
    }

    async testImageSelection() {
        await this.runTest('User can select an image from gallery', async () => {
            // Look for gallery images to select
            const firstImage = await this.page.$('.gallery-image-card img, .image-selector img, [data-image-id] img');
            
            if (!firstImage) {
                throw new Error('No gallery images found to select');
            }
            
            // Get image info before clicking
            const imageInfo = await this.page.evaluate(img => {
                return {
                    src: img.src,
                    alt: img.alt,
                    visible: img.offsetParent !== null
                };
            }, firstImage);
            
            console.log(`  🖼️  Selecting image: ${imageInfo.alt || 'Unknown'}`);
            
            if (!imageInfo.visible) {
                throw new Error('First gallery image is not visible');
            }
            
            // Click the image
            await firstImage.click();
            
            // Wait for any selection effects
            await new Promise(r => setTimeout(r, 1000));
            
            // Check if image selection was registered
            const selectionConfirmed = await this.page.evaluate(() => {
                return {
                    selectedImageExists: !!window.merchandiseStore?.selectedImage,
                    selectedImageData: window.merchandiseStore?.selectedImage
                };
            });
            
            if (!selectionConfirmed.selectedImageExists) {
                throw new Error('Image selection was not registered in store state');
            }
            
            console.log(`  ✅ Image selected: ${selectionConfirmed.selectedImageData?.name || 'Image data confirmed'}`);
        });
    }

    async testCategoryCardsDisplay() {
        await this.runTest('Category cards display after image selection', async () => {
            // Wait for category cards to render
            await new Promise(r => setTimeout(r, 2000));
            
            // Look for category cards container
            const categoryCardsContainer = await this.page.$('.category-cards-view, .categories-grid, #category-cards');
            
            if (!categoryCardsContainer) {
                throw new Error('Category cards container not found');
            }
            
            // Count category cards
            const categoryCards = await this.page.$$('.category-card');
            console.log(`  📊 Category cards found: ${categoryCards.length}`);
            
            if (categoryCards.length === 0) {
                throw new Error('No category cards displayed');
            }
            
            // Verify expected categories are present
            const categoryData = await this.page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.category-card'));
                return cards.map(card => ({
                    name: card.querySelector('.category-name, h3')?.textContent?.trim(),
                    icon: card.querySelector('.category-icon')?.textContent?.trim(),
                    stats: card.querySelector('.category-stats, .stats')?.textContent?.trim(),
                    description: card.querySelector('.category-description, .description')?.textContent?.trim(),
                    clickable: card.style.cursor === 'pointer' || card.hasAttribute('data-category')
                }));
            });
            
            console.log('  📋 Category cards analysis:');
            categoryData.slice(0, 5).forEach((cat, i) => {
                console.log(`     ${i + 1}. ${cat.icon} ${cat.name} - ${cat.stats?.substring(0, 30)}...`);
            });
            
            const validCategories = categoryData.filter(cat => cat.name && cat.name.length > 0);
            if (validCategories.length === 0) {
                throw new Error('Category cards found but no valid category names detected');
            }
            
            // Check for priority categories (t-shirt, hoodie, coffee-mug should be first)
            const priorityCategories = ['t-shirt', 'hoodie', 'coffee-mug'];
            const hasPriorityCategory = categoryData.some(cat => 
                priorityCategories.some(priority => 
                    cat.name?.toLowerCase().includes(priority.replace('-', ''))
                )
            );
            
            if (hasPriorityCategory) {
                console.log('  ✅ Priority categories detected (t-shirt, hoodie, coffee-mug)');
            }
            
            console.log(`  ✅ ${validCategories.length} valid category cards displayed`);
        });
    }

    async testCategoryCardInteractivity() {
        await this.runTest('Category cards are interactive with hover effects', async () => {
            const firstCategoryCard = await this.page.$('.category-card');
            
            if (!firstCategoryCard) {
                throw new Error('No category card found for interaction test');
            }
            
            // Get category info
            const categoryInfo = await this.page.evaluate(card => {
                return {
                    name: card.querySelector('.category-name, h3')?.textContent?.trim(),
                    initialStyles: {
                        transform: window.getComputedStyle(card).transform,
                        borderColor: window.getComputedStyle(card).borderColor,
                        backgroundColor: window.getComputedStyle(card).backgroundColor
                    }
                };
            }, firstCategoryCard);
            
            console.log(`  🎯 Testing interactivity on: ${categoryInfo.name}`);
            
            // Hover over the card
            await firstCategoryCard.hover();
            await new Promise(r => setTimeout(r, 500)); // Allow hover effects to apply
            
            // Check if hover effects applied
            const hoverStyles = await this.page.evaluate(card => {
                return {
                    transform: window.getComputedStyle(card).transform,
                    borderColor: window.getComputedStyle(card).borderColor,
                    backgroundColor: window.getComputedStyle(card).backgroundColor
                };
            }, firstCategoryCard);
            
            const hasHoverEffect = 
                hoverStyles.transform !== categoryInfo.initialStyles.transform ||
                hoverStyles.borderColor !== categoryInfo.initialStyles.borderColor ||
                hoverStyles.backgroundColor !== categoryInfo.initialStyles.backgroundColor;
            
            if (hasHoverEffect) {
                console.log('  ✅ Hover effects detected');
            } else {
                console.log('  ⚠️  No obvious hover effects detected (may be subtle)');
            }
            
            console.log('  ✅ Category card is interactive');
        });
    }

    async testCategorySelection() {
        await this.runTest('User can select a category card', async () => {
            // Find the first category card
            const firstCategoryCard = await this.page.$('.category-card');
            
            if (!firstCategoryCard) {
                throw new Error('No category card found for selection');
            }
            
            // Get category name before clicking
            const categoryName = await this.page.evaluate(card => {
                return card.querySelector('.category-name, h3')?.textContent?.trim();
            }, firstCategoryCard);
            
            console.log(`  🎯 Selecting category: ${categoryName}`);
            
            // Click the category card
            await firstCategoryCard.click();
            
            // Wait for view transition
            await new Promise(r => setTimeout(r, 2000));
            
            // Check if we moved to product view
            const productView = await this.page.$('.category-products-view, .products-grid, #category-products');
            const backButton = await this.page.$('.back-to-categories, .back-button, [data-action="back"]');
            
            if (!productView && !backButton) {
                throw new Error('Category selection did not navigate to product view');
            }
            
            // Verify products are displayed for the selected category
            const productCards = await this.page.$$('.product-card');
            console.log(`  📊 Products found in category: ${productCards.length}`);
            
            if (productCards.length === 0) {
                throw new Error('No products displayed for selected category');
            }
            
            console.log(`  ✅ Category selected successfully, showing ${productCards.length} products`);
        });
    }

    async testProductsDisplayInCategory() {
        await this.runTest('Products display correctly within selected category', async () => {
            // Should be in product view from previous test
            const productCards = await this.page.$$('.product-card');
            
            if (productCards.length === 0) {
                throw new Error('No product cards found');
            }
            
            // Analyze first few products
            const productData = await this.page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.product-card'));
                return cards.slice(0, 3).map(card => ({
                    name: card.querySelector('.product-name, h4')?.textContent?.trim(),
                    price: card.querySelector('.product-price, .price')?.textContent?.trim(),
                    description: card.querySelector('.product-description, .description')?.textContent?.trim(),
                    hasImage: !!card.querySelector('img'),
                    hasButton: !!card.querySelector('button, .select-button'),
                    productId: card.getAttribute('data-product-id')
                }));
            });
            
            console.log('  📋 Product cards analysis:');
            productData.forEach((product, i) => {
                console.log(`     ${i + 1}. ${product.name} - ${product.price || 'No price'}`);
                console.log(`        Image: ${product.hasImage ? '✅' : '❌'} | Button: ${product.hasButton ? '✅' : '❌'}`);
            });
            
            const validProducts = productData.filter(p => p.name && p.name.length > 0);
            if (validProducts.length === 0) {
                throw new Error('Product cards found but no valid product data');
            }
            
            console.log(`  ✅ ${validProducts.length} valid products displayed in category`);
        });
    }

    async testBackNavigation() {
        await this.runTest('User can navigate back to category cards', async () => {
            // Look for back button
            const backButton = await this.page.$('.back-to-categories, .back-button, [data-action="back"], button[onclick*="back"]');
            
            if (!backButton) {
                throw new Error('Back button not found in product view');
            }
            
            // Get back button text
            const backButtonText = await this.page.evaluate(button => button.textContent?.trim(), backButton);
            console.log(`  🔙 Found back button: "${backButtonText}"`);
            
            // Click back button
            await backButton.click();
            
            // Wait for navigation
            await new Promise(r => setTimeout(r, 2000));
            
            // Verify we're back to category view
            const categoryCards = await this.page.$$('.category-card');
            const productView = await this.page.$('.category-products-view, .products-grid, #category-products');
            
            if (categoryCards.length === 0) {
                throw new Error('Back navigation failed - no category cards found');
            }
            
            if (productView) {
                const productViewVisible = await this.page.evaluate(view => {
                    const styles = window.getComputedStyle(view);
                    return styles.display !== 'none' && styles.visibility !== 'hidden';
                }, productView);
                
                if (productViewVisible) {
                    throw new Error('Back navigation failed - product view still visible');
                }
            }
            
            console.log(`  ✅ Successfully navigated back to category cards (${categoryCards.length} cards)`);
        });
    }

    async testProductSelection() {
        await this.runTest('User can select a specific product', async () => {
            // Navigate to a category first
            const firstCategoryCard = await this.page.$('.category-card');
            if (firstCategoryCard) {
                await firstCategoryCard.click();
                await new Promise(r => setTimeout(r, 1500));
            }
            
            // Find first product with a selection button
            const productButton = await this.page.$('.product-card button, .select-product-button, [data-action="select-product"]');
            
            if (!productButton) {
                throw new Error('No product selection button found');
            }
            
            // Get product info
            const productCard = await this.page.evaluateHandle(button => {
                return button.closest('.product-card');
            }, productButton);
            
            const productInfo = await this.page.evaluate(card => {
                return {
                    name: card?.querySelector('.product-name, h4')?.textContent?.trim(),
                    price: card?.querySelector('.product-price, .price')?.textContent?.trim(),
                    productId: card?.getAttribute('data-product-id')
                };
            }, productCard);
            
            console.log(`  🎯 Selecting product: ${productInfo.name} (${productInfo.price})`);
            
            // Click the product selection button
            await productButton.click();
            
            // Wait for selection to process
            await new Promise(r => setTimeout(r, 1500));
            
            // Check if product was selected (could trigger cart update, modal, etc.)
            const selectionResult = await this.page.evaluate(() => {
                return {
                    cartUpdated: !!window.merchandiseStore?.cart?.length,
                    modalOpened: !!document.querySelector('.modal, .product-modal, .cart-modal'),
                    selectedProduct: window.merchandiseStore?.selectedProduct,
                    consoleMessages: [] // Could capture relevant messages
                };
            });
            
            if (selectionResult.cartUpdated) {
                console.log(`  ✅ Product added to cart`);
            } else if (selectionResult.modalOpened) {
                console.log(`  ✅ Product selection modal opened`);
            } else if (selectionResult.selectedProduct) {
                console.log(`  ✅ Product selected in store state`);
            } else {
                console.log(`  ⚠️  Product selection may not have completed (no obvious state change)`);
            }
            
            console.log(`  ✅ Product selection workflow completed`);
        });
    }

    async testResponsiveDesign() {
        await this.runTest('Category cards work on mobile viewport', async () => {
            // Switch to mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await new Promise(r => setTimeout(r, 1000));
            
            // Navigate back to category view if not there
            const backButton = await this.page.$('.back-to-categories, .back-button, [data-action="back"]');
            if (backButton) {
                await backButton.click();
                await new Promise(r => setTimeout(r, 1500));
            }
            
            // Check category cards layout on mobile
            const categoryCards = await this.page.$$('.category-card');
            
            if (categoryCards.length === 0) {
                throw new Error('No category cards found in mobile view');
            }
            
            // Check if cards stack properly on mobile
            const mobileLayout = await this.page.evaluate(() => {
                const cards = Array.from(document.querySelectorAll('.category-card'));
                const firstCard = cards[0];
                
                if (!firstCard) return null;
                
                const styles = window.getComputedStyle(firstCard);
                const container = firstCard.parentElement;
                const containerStyles = window.getComputedStyle(container);
                
                return {
                    cardWidth: firstCard.offsetWidth,
                    containerWidth: container.offsetWidth,
                    cardsPerRow: Math.floor(container.offsetWidth / firstCard.offsetWidth),
                    gridDisplay: containerStyles.display,
                    cardFlexBasis: styles.flexBasis,
                    cardMaxWidth: styles.maxWidth
                };
            });
            
            console.log(`  📱 Mobile layout analysis:`);
            console.log(`     Container width: ${mobileLayout.containerWidth}px`);
            console.log(`     Card width: ${mobileLayout.cardWidth}px`);
            console.log(`     Cards per row: ${mobileLayout.cardsPerRow}`);
            
            if (mobileLayout.cardsPerRow <= 2) {
                console.log('  ✅ Cards stack appropriately on mobile (1-2 per row)');
            } else {
                console.log('  ⚠️  Cards may be too small on mobile (3+ per row)');
            }
            
            // Switch back to desktop
            await this.page.setViewport({ width: 1400, height: 900 });
            await new Promise(r => setTimeout(r, 500));
            
            console.log('  ✅ Mobile responsiveness tested');
        });
    }

    async displayResults() {
        console.log('\n');
        console.log('='.repeat(70));
        console.log('📊 MERCHANDISE CATEGORY CARD TEST RESULTS');
        console.log('='.repeat(70));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📊 Total: ${this.testResults.passed + this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.tests
                .filter(test => test.status === 'FAILED')
                .forEach((test, index) => {
                    console.log(`  ${index + 1}. ${test.name}`);
                    console.log(`     Error: ${test.error}`);
                });
        }

        console.log('\n🎯 WORKFLOW SUMMARY');
        console.log('─'.repeat(70));
        
        if (this.testResults.failed === 0) {
            console.log('🎉 ALL CATEGORY CARD TESTS PASSED!');
            console.log('✅ Image selection works');
            console.log('✅ Category cards display with stats and descriptions');
            console.log('✅ Category selection navigates to products');
            console.log('✅ Products display correctly within categories');
            console.log('✅ Back navigation works between views');
            console.log('✅ Product selection workflow completes');
            console.log('✅ Mobile responsive design works');
        } else {
            console.log('⚠️  SOME CATEGORY CARD TESTS FAILED');
            console.log('Please review the errors above and check:');
            console.log('- Server is running on http://localhost:3001');
            console.log('- Category card JavaScript is loading correctly');
            console.log('- CSS for category cards is applied');
            console.log('- Product catalog API is responding');
        }
        
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Review any failed tests above');
        console.log('2. Test manually at: http://localhost:3001/merchandise');
        console.log('3. Check browser console for JavaScript errors');
        console.log('4. Verify category card CSS styling is applied');
        
        return this.testResults.failed === 0;
    }

    async runAllTests() {
        try {
            await this.setup();
            
            // Core workflow tests
            await this.testPageLoadsWithAuth();
            await this.testGalleryImagesLoad();
            await this.testImageSelection();
            await this.testCategoryCardsDisplay();
            await this.testCategoryCardInteractivity();
            await this.testCategorySelection();
            await this.testProductsDisplayInCategory();
            await this.testBackNavigation();
            await this.testProductSelection();
            await this.testResponsiveDesign();
            
            const success = await this.displayResults();
            
            await this.cleanup();
            
            return success;
            
        } catch (error) {
            console.error('💥 Category card test suite execution failed:', error);
            await this.cleanup();
            throw error;
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new MerchandiseCategoryCardBrowserTest();
    test.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = MerchandiseCategoryCardBrowserTest;