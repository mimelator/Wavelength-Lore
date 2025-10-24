#!/usr/bin/env node
/**
 * Gallery Display Test
 * 
 * Verifies that gallery API returns both uploaded images and bookmarks correctly
 * and that they have the correct structure for frontend display
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function testGalleryDisplay() {
  console.log('\n🧪 GALLERY DISPLAY TEST');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // STEP 1: Get gallery images
    console.log('📋 STEP 1: Fetch gallery images');
    const response = await fetch(`${API_BASE_URL}/api/gallery/user/images`, {
      headers: {
        'X-User-ID': TEST_USER_ID,
        'X-API-Request': 'test'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API returned success: false');
    }
    
    console.log(`   ✅ Fetched ${data.images.length} images\n`);
    
    // STEP 2: Validate image structure
    console.log('📋 STEP 2: Validate image structure');
    
    const requiredFields = ['id', 'url', 'title', 'type', 'uploadedAt'];
    let uploadedCount = 0;
    let bookmarkCount = 0;
    
    for (const image of data.images) {
      // Check required fields
      for (const field of requiredFields) {
        if (!(field in image)) {
          throw new Error(`Image missing required field: ${field}`);
        }
      }
      
      // Count types
      if (image.type === 'uploaded') {
        uploadedCount++;
        if (!image.relativePath) {
          throw new Error(`Uploaded image missing relativePath: ${image.id}`);
        }
      } else if (image.type === 'bookmark') {
        bookmarkCount++;
        if (image.relativePath !== null) {
          throw new Error(`Bookmark should have null relativePath: ${image.id}`);
        }
      } else {
        throw new Error(`Unknown image type: ${image.type}`);
      }
      
      // Validate URL
      try {
        new URL(image.url);
      } catch (e) {
        throw new Error(`Invalid URL for image ${image.id}: ${image.url}`);
      }
    }
    
    console.log(`   ✅ All images have required fields`);
    console.log(`   📊 Uploaded images: ${uploadedCount}`);
    console.log(`   📊 Bookmarked images: ${bookmarkCount}\n`);
    
    // STEP 3: Test that bookmarks are accessible
    if (bookmarkCount > 0) {
      console.log('📋 STEP 3: Verify bookmark URLs are accessible');
      
      const bookmark = data.images.find(img => img.type === 'bookmark');
      
      const urlResponse = await fetch(bookmark.url);
      if (!urlResponse.ok) {
        throw new Error(`Bookmark URL not accessible: ${bookmark.url}`);
      }
      
      console.log(`   ✅ Bookmark URL accessible: ${bookmark.url}\n`);
    } else {
      console.log('📋 STEP 3: No bookmarks to test (skipped)\n');
    }
    
    // STEP 4: Verify frontend can distinguish types
    console.log('📋 STEP 4: Verify type differentiation');
    const hasTypes = data.images.every(img => img.type === 'uploaded' || img.type === 'bookmark');
    if (!hasTypes) {
      throw new Error('Not all images have valid type field');
    }
    console.log(`   ✅ All images properly typed for frontend display\n`);
    
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
  testGalleryDisplay();
}

module.exports = { testGalleryDisplay };
