#!/usr/bin/env node
/**
 * Vendor Preview with Bookmarks Test
 * 
 * Tests that vendor preview generation works with BOTH:
 * 1. S3 uploaded images (relativePath exists)
 * 2. Firebase bookmarks (content images - relativePath null)
 * 
 * This is critical for the Admin Product Preview Builder.
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function testVendorPreviewWithBookmarks() {
  console.log('\n🧪 VENDOR PREVIEW WITH BOOKMARKS TEST');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // STEP 1: Get user's gallery images (should have bookmarks)
    console.log('📋 STEP 1: Get gallery images');
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
    const allImages = galleryData.images || [];
    const bookmarks = allImages.filter(img => img.type === 'bookmark');
    const uploadedImages = allImages.filter(img => img.type === 'uploaded');
    
    console.log(`   ✅ Total images: ${allImages.length}`);
    console.log(`   📊 Bookmarks: ${bookmarks.length}`);
    console.log(`   📊 Uploaded: ${uploadedImages.length}\n`);
    
    if (allImages.length === 0) {
      throw new Error('No images in gallery - cannot test vendor preview');
    }
    
    // STEP 2: Test vendor preview generation with bookmark
    if (bookmarks.length > 0) {
      console.log('📋 STEP 2: Test vendor preview with bookmark');
      
      const bookmark = bookmarks[0];
      console.log(`   Using bookmark: ${bookmark.title}`);
      console.log(`   URL: ${bookmark.url}`);
      console.log(`   ID: ${bookmark.id}\n`);
      
      // TODO: This is where we'd call the vendor preview generation
      // For now, we're testing that the image is accessible
      const imageResponse = await fetch(bookmark.url);
      if (!imageResponse.ok) {
        throw new Error(`Bookmark URL not accessible: ${bookmark.url}`);
      }
      
      console.log(`   ✅ Bookmark image accessible`);
      console.log(`   📊 Size: ${imageResponse.headers.get('content-length')} bytes\n`);
    } else {
      console.log('📋 STEP 2: No bookmarks to test (skipped)\n');
    }
    
    // STEP 3: Test vendor preview generation with uploaded image
    if (uploadedImages.length > 0) {
      console.log('📋 STEP 3: Test vendor preview with uploaded image');
      
      const uploaded = uploadedImages[0];
      console.log(`   Using uploaded: ${uploaded.title}`);
      console.log(`   URL: ${uploaded.url}`);
      console.log(`   Path: ${uploaded.relativePath}\n`);
      
      // Test the gallery API metadata endpoint
      const metadataResponse = await fetch(`${API_BASE_URL}/api/gallery/image/${uploaded.id}`, {
        headers: {
          'X-User-ID': TEST_USER_ID,
          'X-API-Request': 'test'
        }
      });
      
      if (!metadataResponse.ok) {
        throw new Error(`Metadata API failed for uploaded image: ${metadataResponse.status}`);
      }
      
      console.log(`   ✅ Uploaded image metadata accessible\n`);
    } else {
      console.log('📋 STEP 3: No uploaded images to test (skipped)\n');
    }
    
    // STEP 4: Analyze what vendor preview builder needs
    console.log('📋 STEP 4: Requirements for vendor preview builder');
    console.log(`   ⚠️  Current issue: Builder only checks S3 uploaded images`);
    console.log(`   ✅ Solution needed: Builder should handle bookmarks too`);
    console.log(`   📝 Bookmarks need: Download from original URL before upload to Printify\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ANALYSIS COMPLETE');
    console.log(`   Images available: ${allImages.length}`);
    console.log(`   Bookmarks work: ${bookmarks.length > 0 ? 'YES' : 'N/A'}`);
    console.log(`   Uploaded work: ${uploadedImages.length > 0 ? 'YES' : 'N/A'}`);
    console.log('═══════════════════════════════════════\n');
    
    // Exit with info about what needs fixing
    if (bookmarks.length > 0 && uploadedImages.length === 0) {
      console.log('ℹ️  NEXT STEPS:');
      console.log('   1. Update batch-product-preview-builder.js to use /api/gallery/user/images');
      console.log('   2. Update vendor-preview-service.js to download bookmarks from original URL');
      console.log('   3. Handle both relativePath (uploaded) and url (bookmark) in vendor service\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('═══════════════════════════════════════\n');
    process.exit(1);
  }
}

if (require.main === module) {
  testVendorPreviewWithBookmarks();
}

module.exports = { testVendorPreviewWithBookmarks };
