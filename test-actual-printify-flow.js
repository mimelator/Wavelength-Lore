#!/usr/bin/env node

/**
 * ACTUAL FLOW TEST: Trace What Really Happens When Image Goes to Printify
 *
 * This test follows the ACTUAL code path from merchandise.js -> printify-service.js
 * to show WHERE we're failing to send the right image.
 *
 * We'll inject logging at each step to PROVE what's being sent.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔍 ACTUAL FLOW TEST: Tracing Image to Printify');
console.log('='.repeat(80));

// Mock the actual Printify API call to see what payload is being sent
const originalPostFunction = {};
let capturedPrintifyPayload = null;

// Load the actual PrintifyService
console.log('\n📦 Loading PrintifyService...');
const PrintifyService = require('./services/printify-service');
const printifyService = new PrintifyService();

// Intercept the API call to see what's being sent
console.log('🎣 Intercepting Printify API calls...\n');

const originalApiPost = printifyService.api.post;
printifyService.api.post = async function(endpoint, payload) {
  if (endpoint === '/uploads/images.json') {
    console.log('🚨 INTERCEPTED PRINTIFY API CALL: /uploads/images.json');
    console.log('-'.repeat(80));

    capturedPrintifyPayload = payload;

    console.log('📊 PAYLOAD BEING SENT TO PRINTIFY:');
    console.log('   file_name:', payload.file_name);
    console.log('   contents (first 100 chars of base64):', payload.contents.substring(0, 100) + '...');
    console.log('   contents (base64 length):', payload.contents.length);

    // Check 1: Is the filename WebP or PNG?
    const isWebP = payload.file_name.toLowerCase().endsWith('.webp');
    const isPNG = payload.file_name.toLowerCase().endsWith('.png');

    console.log('\n⚠️  CRITICAL CHECK:');
    if (isWebP) {
      console.log('   ❌ FAIL: Sending WebP format to Printify!');
      console.log('   file_name:', payload.file_name);
      console.log('   Printify will reject this with 400 error!');
    } else if (isPNG) {
      console.log('   ✅ PASS: Sending PNG format to Printify');
      console.log('   file_name:', payload.file_name);
    } else {
      console.log('   ⚠️  UNKNOWN: Unexpected format in filename');
      console.log('   file_name:', payload.file_name);
    }

    console.log('-'.repeat(80));

    // Return mock success response
    return {
      data: {
        id: 'mock-image-12345',
        file_name: payload.file_name,
        preview_url: 'https://printify.mock/preview.jpg',
        width: 1800,
        height: 1800,
        size: payload.contents.length / 1.33,  // Approximate
        mime_type: 'image/png',
        upload_time: new Date().toISOString()
      }
    };
  }

  // For other endpoints, return mock responses
  return { data: {} };
};

// ============================================================================
// SIMULATE: What merchandise.js ACTUALLY sends to printifyService
// ============================================================================

console.log('\n📋 SIMULATING: merchandise.js → printify-service.js flow');
console.log('-'.repeat(80));

// Step 1: Download the WebP image (as merchandise.js does)
console.log('\nStep 1: Download image from URL (as merchandise.js does)');
console.log('   URL: http://localhost:3001/images/characters/wavelength/eloquence-5.webp');

const testImagePath = path.join(__dirname, 'static/images/characters/wavelength/eloquence-5.webp');
if (!fs.existsSync(testImagePath)) {
  console.error('❌ Test image not found');
  process.exit(1);
}

const downloadedWebPBuffer = fs.readFileSync(testImagePath);
console.log(`   ✅ Downloaded: ${downloadedWebPBuffer.length} bytes (${(downloadedWebPBuffer.length / 1024).toFixed(2)} KB)`);
console.log(`   Format detected: WebP (from .webp extension in URL)`);

// Step 2: Pass to printifyService.uploadImage (as merchandise.js does)
console.log('\nStep 2: Call printifyService.uploadImage()');
console.log('   Parameters:');
console.log('      imageBuffer: [WebP buffer]');
console.log('      fileName: "eloquence-5.webp"');
console.log('      title: "Test Image"');

(async () => {
  try {
    console.log('\n   Calling uploadImage...');
    const result = await printifyService.uploadImage(downloadedWebPBuffer, 'eloquence-5.webp', 'Test Image');

    console.log('\n   Result from uploadImage:');
    if (result.success) {
      console.log('   ✅ SUCCESS: Image uploaded');
      console.log('      imageId:', result.imageId);
      console.log('      fileName:', result.fileName);
      console.log('      url:', result.url);
    } else {
      console.log('   ❌ FAILED: Image upload failed');
      console.log('      error:', result.error);
    }

    // ============================================================================
    // ANALYSIS: What Was Actually Sent?
    // ============================================================================

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS: What Was Actually Sent to Printify?');
    console.log('='.repeat(80));

    if (capturedPrintifyPayload) {
      const filename = capturedPrintifyPayload.file_name;
      const isWebP = filename.toLowerCase().endsWith('.webp');
      const isPNG = filename.toLowerCase().endsWith('.png');

      console.log('\n🔍 PAYLOAD ANALYSIS:');
      console.log('   Filename sent:', filename);
      console.log('   Is WebP?', isWebP);
      console.log('   Is PNG?', isPNG);

      if (isWebP) {
        console.log('\n❌ PROBLEM IDENTIFIED:');
        console.log('   The actual code is sending WebP to Printify!');
        console.log('   Printify will respond with: 400 Bad Request "Failed to upload image: Operation failed"');
        console.log('\n🔧 ROOT CAUSE:');
        console.log('   The code downloads a .webp file BUT does NOT convert it to PNG before sending');
        console.log('   Even though printify-service.js HAS conversion code, it may not be executing');
      } else if (isPNG) {
        console.log('\n✅ CORRECT:');
        console.log('   The code correctly converted WebP to PNG before sending');
        console.log('   This is the behavior we expect after the fix is applied');
      }
    } else {
      console.log('❌ ERROR: Could not capture Printify payload');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error);
  }
})();
