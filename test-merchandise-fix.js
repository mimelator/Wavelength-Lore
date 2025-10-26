#!/usr/bin/env node

/**
 * Test script to verify merchandise store fixes
 */

const puppeteer = require('puppeteer');

async function testMerchandiseStore() {
    console.log('🛍️ Testing Merchandise Store Fixes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({ 
            headless: false, // Show browser for debugging
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from page
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'log') console.log('📝', msg.text());
            else if (type === 'error') console.error('❌', msg.text());
            else if (type === 'warn') console.warn('⚠️', msg.text());
        });
        
        // Navigate to merchandise store
        console.log('🔗 Loading merchandise store...');
        await page.goto('http://localhost:3001/merchandise-store', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for page to load
        console.log('⏳ Waiting for page initialization...');
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if merchandise store loaded
        const storeExists = await page.evaluate(() => {
            return document.getElementById('merchandise-store') !== null;
        });
        
        console.log('🔍 Store container exists:', storeExists);
        
        // Check if product types API is working
        const apiTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/merchandise/product-types');
                const data = await response.json();
                return {
                    success: data.success,
                    productCount: data.allProducts?.length || 0,
                    categories: Object.keys(data.productTypes || {})
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('📋 API Test Results:', apiTest);
        
        // Wait for an image to be selected (simulate user action)
        console.log('🖼️ Simulating image selection...');
        
        // Check if gallery images are loaded
        const galleryCheck = await page.evaluate(() => {
            const galleryGrid = document.querySelector('.gallery-grid');
            const images = document.querySelectorAll('.gallery-image-card');
            return {
                galleryExists: !!galleryGrid,
                imageCount: images.length,
                hasEmptyState: !!document.querySelector('.empty-state')
            };
        });
        
        console.log('📸 Gallery Status:', galleryCheck);
        
        // If no images, create a mock selection to test product navigator
        if (galleryCheck.hasEmptyState || galleryCheck.imageCount === 0) {
            console.log('🧪 No gallery images, testing product navigator directly...');
            
            // Simulate having a selected image to trigger product navigator
            await page.evaluate(() => {
                if (window.merchandiseStore) {
                    // Mock a selected image
                    window.merchandiseStore.selectedImage = 'test-image-id';
                    window.merchandiseStore.galleryImages = [{
                        id: 'test-image-id',
                        title: 'Test Image',
                        url: 'http://localhost:3001/test-image.jpg',
                        thumbnailUrl: 'http://localhost:3001/test-image.jpg',
                        suitableForPrint: true
                    }];
                    
                    // Re-render to show product selection
                    window.merchandiseStore.render();
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Check if product navigator or simple categories are rendered
        const productNavigatorCheck = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const simpleCategories = document.querySelector('.simple-categories');
            const productCards = document.querySelectorAll('.simple-category, .category-card');
            
            return {
                hasNavigator: !!navigator,
                hasSimpleCategories: !!simpleCategories,
                productCardCount: productCards.length,
                productTypes: Array.from(productCards).map(card => {
                    const title = card.querySelector('h4, .category-name')?.textContent;
                    const button = card.querySelector('button');
                    return {
                        title,
                        hasButton: !!button,
                        buttonText: button?.textContent
                    };
                })
            };
        });
        
        console.log('🎯 Product Navigator Results:', productNavigatorCheck);
        
        // Summary
        console.log('\n📊 Test Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (apiTest.success && apiTest.productCount > 0) {
            console.log('✅ API Working: Found', apiTest.productCount, 'products in', apiTest.categories.length, 'categories');
            console.log('   Categories:', apiTest.categories.join(', '));
        } else {
            console.log('❌ API Issue:', apiTest.error || 'No products found');
        }
        
        if (productNavigatorCheck.productCardCount > 4) {
            console.log('✅ Product Selection Fixed: Showing', productNavigatorCheck.productCardCount, 'product types');
            console.log('   Products:', productNavigatorCheck.productTypes.map(p => p.title).join(', '));
        } else if (productNavigatorCheck.productCardCount === 4) {
            console.log('⚠️ Still showing fallback: Only 4 products visible (may be expected during loading)');
        } else {
            console.log('❌ Product Selection Issue: Only', productNavigatorCheck.productCardCount, 'products visible');
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser left open for manual inspection...');
        console.log('Press Ctrl+C to close browser and exit.');
        
        // Wait for user to close
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    testMerchandiseStore();
} catch (error) {
    console.log('⚠️ Puppeteer not available, manual testing required...');
    console.log('\n🛍️ Manual Test Instructions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Open browser to: http://localhost:3001/merchandise-store');
    console.log('2. Check if you see more than just t-shirts');
    console.log('3. Look for: Premium T-Shirt, Hoodie, Coffee Mug, Pillow, etc.');
    console.log('4. Open Developer Console and check for any errors');
}