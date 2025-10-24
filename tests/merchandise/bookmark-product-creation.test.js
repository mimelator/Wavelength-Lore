#!/usr/bin/env node

/**
 * Test: Product Creation from Bookmarked Images
 * 
 * Validates that users can create merchandise products from BOTH:
 * 1. S3 uploaded images (existing functionality)
 * 2. Firebase bookmarked content images (new refactored functionality)
 */

const puppeteer = require('puppeteer');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  headless: false,
  slowMo: 100
};

async function runTest() {
  console.log('🧪 Testing Product Creation from Bookmarked Images\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Test 1: Load merchandise store page
    console.log('📋 Test 1: Load merchandise store page');
    await page.goto(`${TEST_CONFIG.baseUrl}/merchandise`, { waitUntil: 'networkidle0' });
    
    const title = await page.title();
    if (title.includes('Merchandise')) {
      console.log('   ✅ Merchandise page loaded');
      passed++;
    } else {
      console.log('   ❌ Failed to load merchandise page');
      failed++;
    }
    
    // Test 2: Fetch gallery images (should include bookmarks)
    console.log('\n📋 Test 2: Fetch gallery images including bookmarks');
    const galleryResponse = await page.evaluate(async () => {
      const response = await fetch('/api/merchandise/gallery-images', {
        credentials: 'include'
      });
      return response.json();
    });
    
    if (galleryResponse.success && galleryResponse.images) {
      const bookmarkedImages = galleryResponse.images.filter(img => img.type === 'bookmark');
      const uploadedImages = galleryResponse.images.filter(img => img.type === 'uploaded');
      
      console.log(`   ✅ Found ${galleryResponse.images.length} total images`);
      console.log(`      - ${uploadedImages.length} uploaded to S3`);
      console.log(`      - ${bookmarkedImages.length} bookmarked content images`);
      passed++;
      
      // Test 3: Attempt to create product from bookmarked image
      if (bookmarkedImages.length > 0) {
        console.log('\n📋 Test 3: Create product from bookmarked image');
        const bookmarkedImage = bookmarkedImages[0];
        console.log(`   🔖 Using bookmarked image: ${bookmarkedImage.title}`);
        console.log(`   🆔 Image ID: ${bookmarkedImage.id}`);
        console.log(`   🔗 Image URL: ${bookmarkedImage.url}`);
        
        const createResponse = await page.evaluate(async (image) => {
          const response = await fetch('/api/merchandise/create-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              imageId: image.id,
              imageUrl: image.url,
              imageTitle: image.title,
              productOptions: {}
            })
          });
          return {
            status: response.status,
            data: await response.json()
          };
        }, bookmarkedImage);
        
        if (createResponse.status === 200 && createResponse.data.success) {
          console.log('   ✅ Product created successfully from bookmarked image');
          console.log(`      Product ID: ${createResponse.data.product.id}`);
          passed++;
        } else {
          console.log(`   ❌ FAILED: ${createResponse.status} - ${createResponse.data.error}`);
          failed++;
        }
      } else {
        console.log('\n📋 Test 3: SKIPPED - No bookmarked images available');
      }
      
      // Test 4: Attempt to create product from uploaded image (should still work)
      if (uploadedImages.length > 0) {
        console.log('\n📋 Test 4: Create product from uploaded S3 image');
        const uploadedImage = uploadedImages[0];
        console.log(`   📤 Using uploaded image: ${uploadedImage.title}`);
        
        const createResponse = await page.evaluate(async (image) => {
          const response = await fetch('/api/merchandise/create-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              imageId: image.id,
              imageUrl: image.url,
              imageTitle: image.title,
              productOptions: {}
            })
          });
          return {
            status: response.status,
            data: await response.json()
          };
        }, uploadedImage);
        
        if (createResponse.status === 200 && createResponse.data.success) {
          console.log('   ✅ Product created successfully from uploaded image');
          passed++;
        } else {
          console.log(`   ❌ FAILED: ${createResponse.status} - ${createResponse.data.error}`);
          failed++;
        }
      } else {
        console.log('\n📋 Test 4: SKIPPED - No uploaded images available');
      }
      
    } else {
      console.log('   ❌ Failed to fetch gallery images');
      failed++;
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total:  ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    console.log('   Users can now create products from ANY image (uploaded or bookmarked)!');
    process.exit(0);
  }
}

runTest();
