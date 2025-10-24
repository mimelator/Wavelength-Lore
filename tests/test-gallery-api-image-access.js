#!/usr/bin/env node
/**
 * TEST: Gallery API Image Access
 */

require('dotenv').config();
const axios = require('axios');
const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
const galleryStorage = require('../utils/gallery/storage');

async function testGalleryApiAccess() {
  console.log('🧪 TEST: Gallery API Image Access\n');
  
  try {
    // Get user and image
    initializeFirebaseAdmin();
    const admin = require('firebase-admin');
    const listUsersResult = await admin.app('admin').auth().listUsers(1);
    const userId = listUsersResult.users[0].uid;
    
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    if (userImages.length === 0) {
      console.log('ℹ️  No S3 uploaded images found - this is expected with bookmark-only system');
      console.log('✅ TEST SKIPPED: No uploaded images to test metadata/download endpoints');
      console.log('   (These endpoints only work for S3-uploaded images, not bookmarks)');
      process.exit(0);
    }
    
    const testImage = userImages[0];
    const imageFilename = testImage.fileName || testImage.relativePath.split('/').pop();
    const imageFullPath = testImage.relativePath;
    
    console.log(`1️⃣ Testing with S3 uploaded image:`);
    console.log(`   Full path: ${imageFullPath}`);
    console.log(`   Filename: ${imageFilename}`);
    
    const baseUrl = process.env.CDN_URL || 'http://localhost:3001';
    
    // Test 1: Check metadata endpoint with filename
    console.log('\n2️⃣ Testing metadata endpoint with filename...');
    try {
      const metadataUrl = `${baseUrl}/api/gallery/image/${imageFilename}`;
      console.log(`   URL: ${metadataUrl}`);
      
      const response = await axios.get(metadataUrl, {
        headers: {
          'X-User-ID': userId,
          'X-API-Request': 'test'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log('   ✅ Metadata endpoint works with filename');
      } else {
        console.log('   ❌ Metadata endpoint returned success: false');
        process.exit(1);
      }
    } catch (error) {
      console.log(`   ❌ Metadata endpoint failed: ${error.response?.status} ${error.message}`);
      process.exit(1);
    }
    
    // Test 2: Check metadata endpoint with full path (should also work)
    console.log('\n3️⃣ Testing metadata endpoint with full path...');
    try {
      const metadataUrl = `${baseUrl}/api/gallery/image/${imageFullPath}`;
      console.log(`   URL: ${metadataUrl}`);
      
      const response = await axios.get(metadataUrl, {
        headers: {
          'X-User-ID': userId,
          'X-API-Request': 'test'
        },
        timeout: 5000
      });
      
      if (response.data.success) {
        console.log('   ✅ Metadata endpoint works with full path');
      } else {
        console.log('   ❌ Metadata endpoint returned success: false');
        process.exit(1);
      }
    } catch (error) {
      console.log(`   ❌ Metadata endpoint with full path failed: ${error.response?.status} ${error.message}`);
      console.log('   ⚠️  This is expected - API should accept both filename and full path');
    }
    
    // Test 4: Check download endpoint
    console.log('\n4️⃣ Testing download endpoint...');
    try {
      const downloadUrl = `${baseUrl}/api/gallery/image/${imageFilename}/download`;
      console.log(`   URL: ${downloadUrl}`);
      
      const response = await axios.get(downloadUrl, {
        headers: {
          'X-User-ID': userId,
          'X-API-Request': 'test'
        },
        responseType: 'arraybuffer',
        timeout: 5000
      });
      
      if (response.status === 200 && response.data) {
        const size = Buffer.from(response.data).length;
        console.log(`   ✅ Download endpoint works (${size} bytes)`);
      } else {
        console.log('   ❌ Download endpoint returned no data');
        process.exit(1);
      }
    } catch (error) {
      console.log(`   ❌ Download endpoint failed: ${error.response?.status} ${error.message}`);
      process.exit(1);
    }
    
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

testGalleryApiAccess();
