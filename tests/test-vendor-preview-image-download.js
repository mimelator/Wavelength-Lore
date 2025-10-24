#!/usr/bin/env node
/**
 * TEST: Vendor Preview Service Image Download
 */

require('dotenv').config();
const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
const galleryStorage = require('../utils/gallery/storage');

async function testVendorPreviewImageDownload() {
  console.log('🧪 TEST: Vendor Preview Service Image Download\n');
  
  try {
    // Get user and image
    initializeFirebaseAdmin();
    const admin = require('firebase-admin');
    const listUsersResult = await admin.app('admin').auth().listUsers(1);
    const userId = listUsersResult.users[0].uid;
    
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    if (userImages.length === 0) {
      console.log('❌ TEST FAILED: No images found');
      process.exit(1);
    }
    
    const testImage = userImages[0];
    console.log(`1️⃣ Test image: ${testImage.relativePath}`);
    
    // Test vendor preview service download method
    const VendorPreviewService = require('../services/vendor-preview-service');
    const vendorService = new VendorPreviewService();
    
    console.log('\n2️⃣ Testing downloadImageFromGallery with relativePath...');
    try {
      const buffer = await vendorService.downloadImageFromGallery(testImage.relativePath, userId);
      if (buffer && buffer.length > 0) {
        console.log(`   ✅ Downloaded ${buffer.length} bytes`);
      } else {
        console.log('   ❌ No buffer returned');
        process.exit(1);
      }
    } catch (error) {
      console.log(`   ❌ Download failed: ${error.message}`);
      process.exit(1);
    }
    
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

testVendorPreviewImageDownload();
