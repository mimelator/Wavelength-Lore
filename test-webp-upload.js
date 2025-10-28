#!/usr/bin/env node

/**
 * Test: WebP Image Upload to Printify
 *
 * This test simulates uploading a WebP image and captures the logs
 * to prove whether the upload succeeds or fails.
 */

const PrintifyService = require('./services/printify-service');
const fs = require('fs');
const path = require('path');

async function testWebPUpload() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST: WebP Image Upload to Printify');
  console.log('='.repeat(70) + '\n');

  try {
    // Create a mock PrintifyService
    const printifyService = new PrintifyService();

    // Try to find a real WebP file in the project
    const webpPath = '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/public/images/characters/wavelength/eloquence-5.webp';

    if (!fs.existsSync(webpPath)) {
      console.error('❌ Test file not found:', webpPath);
      return;
    }

    console.log('📄 Test file:', webpPath);
    const imageBuffer = fs.readFileSync(webpPath);
    console.log('📦 Image size:', imageBuffer.length, 'bytes\n');

    console.log('🚀 Attempting to upload WebP image...\n');

    // Call uploadImage
    const result = await printifyService.uploadImage(imageBuffer, 'eloquence-5.webp', 'Test Image');

    console.log('\n' + '─'.repeat(70));
    console.log('📊 UPLOAD RESULT:');
    console.log('─'.repeat(70));

    if (result.success) {
      console.log('✅ SUCCESS! Image uploaded to Printify');
      console.log('   Image ID:', result.imageId);
      console.log('   URL:', result.url);
    } else {
      console.log('❌ FAILED! Image upload failed');
      console.log('   Error:', result.error);
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    }

    console.log('─'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);
  }
}

testWebPUpload();
