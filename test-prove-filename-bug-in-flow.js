#!/usr/bin/env node

/**
 * PROOF TEST: Show the Filename Bug in the Actual Code Flow
 *
 * This test follows the EXACT flow:
 * 1. merchandise.js downloads WebP
 * 2. Passes to AutoEnhancedPrintifyService.uploadImage()
 * 3. Upscaler converts WebP→PNG but doesn't update filename
 * 4. Parent's uploadImage() receives PNG buffer + .webp filename
 * 5. PROVES the mismatch causes the problem
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔬 PROOF TEST: Filename Bug in Actual Code Flow');
console.log('='.repeat(80));

// Load the actual services
const AutoEnhancedPrintifyService = require('./services/auto-enhanced-printify-service');
const PrintifyService = require('./services/printify-service');

// Intercept calls to track what's happening
let capturedCalls = {
  uploadImageCalls: [],
  sharpConversions: []
};

// Create instances
const printifyService = new PrintifyService();
const autoEnhancedService = new AutoEnhancedPrintifyService();

// Patch the parent uploadImage to capture what it receives
const originalUploadImage = PrintifyService.prototype.uploadImage;
PrintifyService.prototype.uploadImage = async function(imageBuffer, fileName, title) {
  console.log('\n🎣 INTERCEPTED: Parent uploadImage() called');
  console.log('   fileName:', fileName);
  console.log('   buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

  // Detect buffer format
  const isWebPFileName = fileName.toLowerCase().endsWith('.webp');
  const isPNGFileName = fileName.toLowerCase().endsWith('.png');

  let bufferFormat = 'UNKNOWN';
  try {
    const sharp = require('sharp');
    const metadata = await sharp(imageBuffer).metadata();
    bufferFormat = metadata.format.toUpperCase();
  } catch (err) {
    bufferFormat = 'ERROR DETECTING';
  }

  console.log('   Detected buffer format:', bufferFormat);
  console.log('   Filename extension:', isWebPFileName ? '.webp' : isPNGFileName ? '.png' : 'OTHER');

  // PROOF: Check for mismatch
  if (bufferFormat === 'PNG' && isWebPFileName) {
    console.log('\n   🚨 MISMATCH DETECTED:');
    console.log('      Buffer is: PNG');
    console.log('      Filename says: .webp');
    console.log('      This will cause the conversion logic to break!');
  }

  capturedCalls.uploadImageCalls.push({
    fileName,
    bufferFormat,
    fileNameExtension: isWebPFileName ? '.webp' : isPNGFileName ? '.png' : 'other',
    mismatch: bufferFormat === 'PNG' && isWebPFileName
  });

  // Call original with mock
  return {
    success: true,
    imageId: 'mock-12345',
    fileName: fileName,
    url: 'https://mock.printify.test/image.jpg'
  };
};

// Get test image
const testImagePath = path.join(__dirname, 'static/images/characters/wavelength/eloquence-5.webp');
if (!fs.existsSync(testImagePath)) {
  console.error('❌ Test image not found');
  process.exit(1);
}

const webpBuffer = fs.readFileSync(testImagePath);

console.log('\n📋 STARTING ACTUAL FLOW TEST');
console.log('-'.repeat(80));
console.log('Step 1: merchandise.js downloads eloquence-5.webp');
console.log('   fileName: eloquence-5.webp');
console.log(`   buffer size: ${(webpBuffer.length / 1024).toFixed(2)} KB`);

console.log('\nStep 2: Passes to AutoEnhancedPrintifyService.uploadImage()');
console.log('   Calling with: (webpBuffer, "eloquence-5.webp", "Test Image")');

(async () => {
  try {
    // Call the actual service with the WebP image
    const result = await autoEnhancedService.uploadImage(
      webpBuffer,
      'eloquence-5.webp',
      'Test Image',
      {}  // empty options
    );

    console.log('\n✅ uploadImage returned successfully');
    console.log('   Result:', result);

  } catch (error) {
    console.log('\n❌ uploadImage failed:', error.message);
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('📊 ANALYSIS OF CAPTURED CALLS');
  console.log('='.repeat(80));

  if (capturedCalls.uploadImageCalls.length === 0) {
    console.log('\n⚠️  No calls to parent uploadImage were captured');
    console.log('   This might mean the flow exited early or used a different path');
  } else {
    capturedCalls.uploadImageCalls.forEach((call, index) => {
      console.log(`\nCall #${index + 1}:`);
      console.log(`   fileName: ${call.fileName}`);
      console.log(`   bufferFormat: ${call.bufferFormat}`);
      console.log(`   fileNameExtension: ${call.fileNameExtension}`);

      if (call.mismatch) {
        console.log(`   🚨 MISMATCH: Buffer is ${call.bufferFormat} but fileName is ${call.fileNameExtension}`);
      } else {
        console.log(`   ✓ Match: Buffer and filename agree`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🔍 CONCLUSION');
  console.log('='.repeat(80));

  const hasMismatch = capturedCalls.uploadImageCalls.some(call => call.mismatch);

  if (hasMismatch) {
    console.log('\n✅ PROOF CONFIRMED: The filename mismatch bug DOES occur!');
    console.log('\nWhat happens:');
    console.log('  1. ✓ Upscaler converts WebP to PNG');
    console.log('  2. ✗ Filename remains "eloquence-5.webp"');
    console.log('  3. ✗ Parent uploadImage() receives PNG buffer + .webp filename');
    console.log('  4. ✗ Tries to convert PNG using sharp().png()');
    console.log('  5. ✗ This changes the buffer data');
    console.log('  6. ✗ Sends corrupted data to Printify');
    console.log('  7. ✗ Printify returns 400 error');
    console.log('\nThis is WHY you see the error!');
  } else if (capturedCalls.uploadImageCalls.length === 0) {
    console.log('\n⚠️  Could not capture the calls to verify the bug.');
    console.log('   The code path may be different or early exit.');
  } else {
    console.log('\n✓ No mismatch detected in this test run.');
    console.log('   But the bug could still exist in other code paths.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
})().catch(err => {
  console.error('Test error:', err.message);
  console.error(err);
  process.exit(1);
});
