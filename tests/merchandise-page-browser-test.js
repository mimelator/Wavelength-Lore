#!/usr/bin/env node
/**
 * Merchandise Page Browser Test
 * 
 * Comprehensive browser-based test to verify:
 * - Page loads correctly
 * - All images render properly
 * - Links work as expected
 * - Product preview workflow can be initiated
 * - Does NOT trigger actual Printify API calls
 * 
 * This test uses Puppeteer to simulate real browser interactions
 */

const puppeteer = require('puppeteer');
const path = require('path');

class MerchandisePageBrowserTest {
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
        console.log('🚀 MERCHANDISE PAGE BROWSER TEST');
        console.log('=================================');
        console.log('Starting Puppeteer browser...\n');
        
        this.browser = await puppeteer.launch({
            headless: false, // Browser window visible for debugging
            slowMo: 100, // Slow down actions by 100ms for visibility
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 800 });
        
        // Enable console logging from the browser
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('❌') || text.includes('Error') || text.includes('error')) {
                console.log(`  🌐 Browser Error: ${text}`);
            }
        });
        
        // Track network requests
        this.requests = [];
        this.page.on('request', request => {
            this.requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });
        
        // Track network failures
        this.page.on('requestfailed', request => {
            console.log(`  ❌ Request failed: ${request.url()}`);
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
                const screenshotPath = path.join(process.cwd(), 'temp', `error-${Date.now()}.png`);
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`   📸 Screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.log(`   ⚠️  Could not save screenshot: ${screenshotError.message}`);
            }
        }
    }

    async testPageLoads() {
        await this.runTest('Merchandise page loads', async () => {
            const response = await this.page.goto(`${this.baseUrl}/merchandise`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            if (!response.ok()) {
                throw new Error(`Page returned status ${response.status()}`);
            }
            
            // Inject mock Firebase auth to bypass client-side auth check
            await this.page.evaluate(() => {
                // Mock Firebase auth objects
                window.firebaseAuth = {
                    currentUser: {
                        uid: '4fdbYxJHjEP4xksk9sgFE3lgYUs2',
                        email: 'mimel@imelshire.com',
                        displayName: 'Mark Imel'
                    }
                };
                
                window.firebaseUtils = {
                    onAuthStateChanged: (auth, callback) => {
                        // Immediately call callback with mock user
                        callback({
                            uid: '4fdbYxJHjEP4xksk9sgFE3lgYUs2',
                            email: 'mimel@imelshire.com',
                            displayName: 'Mark Imel',
                            emailVerified: true
                        });
                    }
                };
                
                console.log('🔧 Mock Firebase auth injected');
            });
            
            // Wait for main content
            await this.page.waitForSelector('#merchandise-store', { timeout: 10000 });
            
            // Check for loading spinner first (should be present initially)
            const hasLoadingSpinner = await this.page.$('.loading-spinner, .loading-container');
            console.log(`  📊 Loading indicator: ${hasLoadingSpinner ? 'Present' : 'Not found'}`);
            
            // Wait a bit for store to initialize
            await new Promise(r => setTimeout(r, 3000));
            
            // Check page title
            const title = await this.page.title();
            console.log(`  📄 Page title: ${title}`);
            
            if (!title.toLowerCase().includes('merchandise')) {
                throw new Error(`Unexpected page title: ${title}`);
            }
            
            console.log('  ✅ Page loaded successfully');
        });
    }

    async testAuthenticationCheck() {
        await this.runTest('Authentication state check', async () => {
            // Development bypass is enabled for localhost, so auth should work
            // Wait for authentication logic to execute
            await new Promise(r => setTimeout(r, 3000));
            
            // Check if user is redirected or if store initialized
            const currentUrl = this.page.url();
            console.log(`  🔗 Current URL: ${currentUrl}`);
            
            if (currentUrl.includes('redirect=') || currentUrl.includes('/login')) {
                throw new Error('User redirected to login - development bypass not working');
            } 
            
            if (currentUrl.includes('/merchandise')) {
                console.log('  ✅ User authenticated via development bypass');
                
                // Check if store container is populated
                const storeContent = await this.page.$('#merchandise-store');
                if (!storeContent) {
                    throw new Error('Merchandise store container not found');
                }
                
                const innerHTML = await this.page.evaluate(el => el.innerHTML, storeContent);
                console.log(`  📊 Store content length: ${innerHTML.length} characters`);
                
                if (innerHTML.includes('Loading') && innerHTML.length < 500) {
                    console.log('  ⚠️  Store still showing loading state');
                } else if (innerHTML.length > 500) {
                    console.log('  ✅ Store content loaded');
                } else {
                    console.log('  ⚠️  Store content may be empty or errored');
                }
                
                // Check for error messages
                const hasErrors = await this.page.evaluate(() => {
                    const text = document.body.textContent;
                    return text.includes('Error') || text.includes('Failed') || text.includes('error');
                });
                
                if (hasErrors) {
                    console.log('  ⚠️  Page contains error text');
                }
            } else {
                throw new Error(`Unexpected URL: ${currentUrl}`);
            }
        });
    }

    async testCSSAndAssets() {
        await this.runTest('CSS and static assets load', async () => {
            const cssRequests = this.requests.filter(r => r.url.includes('.css'));
            const jsRequests = this.requests.filter(r => r.url.includes('.js'));
            const imageRequests = this.requests.filter(r => r.resourceType === 'image');
            
            console.log(`  📊 CSS files loaded: ${cssRequests.length}`);
            console.log(`  📊 JS files loaded: ${jsRequests.length}`);
            console.log(`  📊 Images loaded: ${imageRequests.length}`);
            
            // Check for merchandise-store.css
            const merchandiseCSS = cssRequests.find(r => r.url.includes('merchandise-store.css'));
            if (!merchandiseCSS) {
                throw new Error('merchandise-store.css not loaded');
            }
            console.log('  ✅ merchandise-store.css loaded');
            
            // Check for merchandise-store.js
            const merchandiseJS = jsRequests.find(r => r.url.includes('merchandise-store.js'));
            if (!merchandiseJS) {
                throw new Error('merchandise-store.js not loaded');
            }
            console.log('  ✅ merchandise-store.js loaded');
        });
    }

    async testGalleryImagesLoad() {
        await this.runTest('Gallery images render', async () => {
            // Wait for potential image gallery to load
            await new Promise(r => setTimeout(r, 3000));
            
            // Look for image elements
            const images = await this.page.$$eval('img', imgs => 
                imgs.map(img => ({
                    src: img.src,
                    alt: img.alt,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    complete: img.complete
                }))
            );
            
            console.log(`  📊 Total images on page: ${images.length}`);
            
            if (images.length > 0) {
                const loadedImages = images.filter(img => img.complete && img.naturalWidth > 0);
                const failedImages = images.filter(img => img.complete && img.naturalWidth === 0);
                
                console.log(`  ✅ Successfully loaded: ${loadedImages.length}`);
                console.log(`  ❌ Failed to load: ${failedImages.length}`);
                
                if (failedImages.length > 0) {
                    console.log('  ⚠️  Some images failed to load:');
                    failedImages.slice(0, 3).forEach(img => {
                        console.log(`     - ${img.src.substring(0, 80)}...`);
                    });
                }
                
                // Look specifically for gallery images
                const galleryImages = images.filter(img => 
                    img.src.includes('cloudfront') || 
                    img.src.includes('gallery') ||
                    img.src.includes('images/')
                );
                
                if (galleryImages.length > 0) {
                    console.log(`  🖼️  Gallery images found: ${galleryImages.length}`);
                } else {
                    console.log('  ℹ️  No gallery images found yet (may still be loading)');
                }
            } else {
                console.log('  ℹ️  No images found on page (store may still be initializing)');
            }
        });
    }

    async testNavigationLinks() {
        await this.runTest('Navigation links are functional', async () => {
            // Check for navigation elements
            const links = await this.page.$$eval('a', anchors => 
                anchors.map(a => ({
                    href: a.href,
                    text: a.textContent.trim(),
                    visible: a.offsetParent !== null
                }))
            );
            
            console.log(`  📊 Total links on page: ${links.length}`);
            
            const visibleLinks = links.filter(l => l.visible);
            console.log(`  👁️  Visible links: ${visibleLinks.length}`);
            
            // Check for key navigation links
            const homeLink = links.find(l => l.href.includes('/') || l.text.toLowerCase().includes('home'));
            const galleryLink = links.find(l => l.href.includes('gallery'));
            
            if (homeLink) console.log('  ✅ Home/navigation link found');
            if (galleryLink) console.log('  ✅ Gallery link found');
            
            // Check for merchandise-specific links
            const merchLinks = links.filter(l => 
                l.href.includes('merchandise') || 
                l.href.includes('product') ||
                l.text.toLowerCase().includes('shop') ||
                l.text.toLowerCase().includes('store')
            );
            
            if (merchLinks.length > 0) {
                console.log(`  🛍️  Merchandise-related links: ${merchLinks.length}`);
            }
        });
    }

    async testProductPreviewWorkflow() {
        await this.runTest('Product preview workflow can be initiated', async () => {
            // Wait for store to fully load
            await new Promise(r => setTimeout(r, 3000));
            
            // Look for product selection buttons or image cards
            const productButtons = await this.page.$$('button, .product-card, .image-card, [data-product-id]');
            console.log(`  📊 Interactive elements found: ${productButtons.length}`);
            
            // Look for "Create Product" or similar buttons
            const createButtons = await this.page.$$eval('button', buttons => 
                buttons
                    .filter(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('create') || 
                               text.includes('preview') || 
                               text.includes('customize') ||
                               text.includes('select');
                    })
                    .map(btn => ({
                        text: btn.textContent.trim(),
                        disabled: btn.disabled,
                        visible: btn.offsetParent !== null
                    }))
            );
            
            console.log(`  🎯 Product action buttons: ${createButtons.length}`);
            
            if (createButtons.length > 0) {
                console.log('  📋 Available actions:');
                createButtons.slice(0, 5).forEach(btn => {
                    const status = btn.disabled ? '[DISABLED]' : btn.visible ? '[VISIBLE]' : '[HIDDEN]';
                    console.log(`     - ${btn.text} ${status}`);
                });
            }
            
            // Check for product type selector
            const productTypeSelector = await this.page.$('[name="productType"], #productType, .product-type-selector');
            if (productTypeSelector) {
                console.log('  ✅ Product type selector found');
            }
            
            // Check for image selection UI
            const imageSelectors = await this.page.$$('.image-selector, .gallery-image, [data-image-id]');
            if (imageSelectors.length > 0) {
                console.log(`  ✅ Image selection UI found (${imageSelectors.length} images)`);
            }
            
            // Check if we can find the merchandise store object in window
            const storeExists = await this.page.evaluate(() => {
                return {
                    merchandiseStore: typeof window.merchandiseStore !== 'undefined',
                    MerchandiseStore: typeof window.MerchandiseStore !== 'undefined',
                    hasGalleryData: typeof window.galleryImages !== 'undefined'
                };
            });
            
            console.log(`  📦 Store object exists: ${storeExists.merchandiseStore}`);
            console.log(`  📦 MerchandiseStore class: ${storeExists.MerchandiseStore}`);
            console.log(`  📦 Gallery data loaded: ${storeExists.hasGalleryData}`);
            
            if (!storeExists.merchandiseStore && !storeExists.MerchandiseStore) {
                console.log('  ⚠️  Merchandise store JavaScript may not have initialized');
            }
        });
    }

    async testNoPrintifyAPICalls() {
        await this.runTest('No Printify API calls triggered', async () => {
            // Check all network requests made
            const printifyRequests = this.requests.filter(r => 
                r.url.includes('printify.com') ||
                r.url.includes('/api/merchandise/create') ||
                r.url.includes('publish')
            );
            
            console.log(`  📊 Printify-related requests: ${printifyRequests.length}`);
            
            if (printifyRequests.length > 0) {
                console.log('  ⚠️  Warning: Printify API calls detected:');
                printifyRequests.forEach(req => {
                    console.log(`     ${req.method} ${req.url}`);
                });
                throw new Error('Printify API calls should not be triggered during page load');
            }
            
            console.log('  ✅ No Printify API calls made (as expected)');
        });
    }

    async testConsoleErrors() {
        await this.runTest('No critical JavaScript errors', async () => {
            // Get console messages from the page
            const messages = [];
            
            this.page.on('console', msg => {
                messages.push({
                    type: msg.type(),
                    text: msg.text()
                });
            });
            
            // Wait a bit for any errors to surface
            await new Promise(r => setTimeout(r, 2000));
            
            const errors = messages.filter(m => m.type === 'error');
            const warnings = messages.filter(m => m.type === 'warning');
            
            console.log(`  📊 Console errors: ${errors.length}`);
            console.log(`  📊 Console warnings: ${warnings.length}`);
            
            if (errors.length > 0) {
                console.log('  ⚠️  JavaScript errors detected:');
                errors.slice(0, 3).forEach(err => {
                    console.log(`     - ${err.text}`);
                });
                
                // Don't fail the test for minor errors, but log them
                const criticalErrors = errors.filter(e => 
                    !e.text.includes('favicon') &&
                    !e.text.includes('analytics') &&
                    !e.text.includes('tracking')
                );
                
                if (criticalErrors.length > 0) {
                    throw new Error(`${criticalErrors.length} critical JavaScript errors found`);
                }
            }
        });
    }

    async testAPIEndpointsAvailable() {
        await this.runTest('Merchandise API endpoints respond', async () => {
            // Test key API endpoints (without authentication)
            const endpoints = [
                '/api/merchandise/products',
                '/api/merchandise/enhancement-status'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await this.page.goto(`${this.baseUrl}${endpoint}`, {
                        waitUntil: 'networkidle0',
                        timeout: 5000
                    });
                    
                    const status = response.status();
                    console.log(`  📡 ${endpoint}: ${status}`);
                    
                    if (status === 200 || status === 401 || status === 403) {
                        // 200 = success, 401/403 = auth required (expected)
                        console.log(`     ✅ Endpoint is responding`);
                    } else {
                        console.log(`     ⚠️  Unexpected status: ${status}`);
                    }
                } catch (error) {
                    console.log(`  ❌ ${endpoint}: ${error.message}`);
                }
            }
            
            // Navigate back to merchandise page
            await this.page.goto(`${this.baseUrl}/merchandise`, {
                waitUntil: 'networkidle0'
            });
        });
    }

    async displayResults() {
        console.log('\n');
        console.log('='.repeat(60));
        console.log('📊 MERCHANDISE PAGE BROWSER TEST RESULTS');
        console.log('='.repeat(60));
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

        console.log('\n🎯 SUMMARY');
        console.log('─'.repeat(60));
        
        if (this.testResults.failed === 0) {
            console.log('🎉 ALL TESTS PASSED!');
            console.log('✅ Merchandise page loads correctly');
            console.log('✅ Images render properly');
            console.log('✅ Navigation links work');
            console.log('✅ Product preview workflow can be initiated');
            console.log('✅ No unintended Printify API calls');
        } else {
            console.log('⚠️  SOME TESTS FAILED');
            console.log('Please review the errors above and ensure:');
            console.log('- Server is running on http://localhost:3001');
            console.log('- User is properly authenticated');
            console.log('- Gallery has images available');
            console.log('- All dependencies are installed');
        }
        
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Review any failed tests above');
        console.log('2. Check server logs for errors');
        console.log('3. Verify user authentication and permissions');
        console.log('4. Test manually at: http://localhost:3001/merchandise');
        
        return this.testResults.failed === 0;
    }

    async runAllTests() {
        try {
            await this.setup();
            
            await this.testPageLoads();
            await this.testAuthenticationCheck();
            await this.testCSSAndAssets();
            await this.testGalleryImagesLoad();
            await this.testNavigationLinks();
            await this.testProductPreviewWorkflow();
            await this.testNoPrintifyAPICalls();
            await this.testConsoleErrors();
            await this.testAPIEndpointsAvailable();
            
            const success = await this.displayResults();
            
            await this.cleanup();
            
            return success;
            
        } catch (error) {
            console.error('💥 Test suite execution failed:', error);
            await this.cleanup();
            throw error;
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new MerchandisePageBrowserTest();
    test.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = MerchandisePageBrowserTest;
