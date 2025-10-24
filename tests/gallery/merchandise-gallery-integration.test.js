#!/usr/bin/env node
/**
 * Merchandise Gallery Integration Test
 * 
 * Verifies that merchandise store can access both uploaded images and bookmarks
 */

const fetch = require('node-fetch');
const { generateProductTitle, prettifyImageName } = require('../../utils/product-name-formatter');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function testMerchandiseGalleryIntegration() {
  console.log('\n🧪 MERCHANDISE GALLERY INTEGRATION TEST');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // STEP 1: Get regular gallery images
    console.log('📋 STEP 1: Get regular gallery images');
    const galleryResponse = await fetch(`${API_BASE_URL}/api/gallery/user/images`, {
      headers: {
        'X-User-ID': TEST_USER_ID,
        'X-API-Request': 'test'
      }
    });
    
    if (!galleryResponse.ok) {
      throw new Error(`Gallery API failed: ${galleryResponse.status}`);
    }
    
    const galleryData = await galleryResponse.json();
    const totalGalleryImages = galleryData.images.length;
    const galleryBookmarks = galleryData.images.filter(img => img.type === 'bookmark').length;
    
    console.log(`   ✅ Gallery has ${totalGalleryImages} total images`);
    console.log(`   📊 ${galleryBookmarks} bookmarks\n`);
    
    // STEP 2: Get merchandise gallery images
    console.log('📋 STEP 2: Get merchandise gallery images');
    const merchResponse = await fetch(`${API_BASE_URL}/api/merchandise/gallery-images`, {
      headers: {
        'X-User-ID': TEST_USER_ID,
        'X-API-Request': 'test'
      }
    });
    
    if (!merchResponse.ok) {
      // 403 is expected if user doesn't have VIP access
      if (merchResponse.status === 403) {
        console.log('   ℹ️  User requires VIP access for merchandise gallery');
        console.log('   ✅ TEST SKIPPED: Cannot test without VIP access\n');
        process.exit(0);
      }
      throw new Error(`Merchandise API failed: ${merchResponse.status}`);
    }
    
    const merchData = await merchResponse.json();
    const totalMerchImages = merchData.images.length;
    
    console.log(`   ✅ Merchandise API returned ${totalMerchImages} images\n`);
    
    // STEP 3: Verify counts match
    console.log('📋 STEP 3: Verify merchandise includes all gallery images');
    
    if (totalMerchImages === 0 && totalGalleryImages > 0) {
      throw new Error(`❌ BUG: Merchandise API returns 0 images but gallery has ${totalGalleryImages} images (including ${galleryBookmarks} bookmarks)`);
    }
    
    if (totalMerchImages < totalGalleryImages) {
      console.log(`   ⚠️  WARNING: Merchandise API returned fewer images than gallery`);
      console.log(`      Gallery: ${totalGalleryImages} images (${galleryBookmarks} bookmarks)`);
      console.log(`      Merchandise: ${totalMerchImages} images`);
      console.log(`      Missing: ${totalGalleryImages - totalMerchImages} images`);
      
      if (galleryBookmarks > 0) {
        throw new Error(`❌ BUG: Merchandise API likely missing bookmarks`);
      }
    } else {
      console.log(`   ✅ Merchandise API includes all gallery images\n`);
    }
    
    // STEP 4: Verify bookmark structure in merchandise API
    if (galleryBookmarks > 0) {
      console.log('📋 STEP 4: Verify bookmarks have merchandise-compatible structure');
      
      const merchBookmarks = merchData.images.filter(img => 
        // Bookmarks won't have relativePath or will have null relativePath
        !img.relativePath || img.relativePath === null
      );
      
      console.log(`   📊 Found ${merchBookmarks.length} potential bookmarks in merchandise API`);
      
      if (merchBookmarks.length === 0 && galleryBookmarks > 0) {
        throw new Error(`❌ BUG: No bookmarks found in merchandise API but gallery has ${galleryBookmarks}`);
      }
      
      // Check required fields for merchandise
      const requiredMerchFields = ['id', 'url', 'title'];
      for (const bookmark of merchBookmarks) {
        for (const field of requiredMerchFields) {
          if (!(field in bookmark)) {
            throw new Error(`Bookmark missing required field for merchandise: ${field}`);
          }
        }
      }
      
      console.log(`   ✅ Bookmarks have required fields for merchandise\n`);
    }
    
    // STEP 5: Verify product title generation
    console.log('📋 STEP 5: Verify automatic product title generation');
    
    // Test with sample images from gallery
    const sampleImages = merchData.images.slice(0, 3);
    for (const image of sampleImages) {
      const filename = image.fileName || image.originalName || 'unknown.webp';
      const productTitle = generateProductTitle(filename, 'T-Shirt');
      const prettyName = prettifyImageName(filename);
      
      // Verify title is generated
      if (!productTitle || productTitle.length === 0) {
        throw new Error(`Failed to generate product title for ${filename}`);
      }
      
      // Verify title includes prettified name
      if (!productTitle.includes(prettyName)) {
        throw new Error(`Product title "${productTitle}" doesn't include prettified name "${prettyName}"`);
      }
      
      // Verify title includes product type
      if (!productTitle.includes('T-Shirt')) {
        throw new Error(`Product title "${productTitle}" doesn't include product type`);
      }
      
      console.log(`   ✅ ${filename} → "${productTitle}"`);
    }
    
    console.log(`   ✅ Product titles auto-generated correctly\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('═══════════════════════════════════════\n');
    process.exit(1);
  }
}

if (require.main === module) {
  testMerchandiseGalleryIntegration();
}

module.exports = { testMerchandiseGalleryIntegration };
