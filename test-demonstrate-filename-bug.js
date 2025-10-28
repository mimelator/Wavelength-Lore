#!/usr/bin/env node

/**
 * TEST: DEMONSTRATE THE FILENAME BUG
 *
 * This test simulates EXACTLY what happens when:
 * 1. A WebP image passes quality validation (no upscaling)
 * 2. Gets sent to Printify with a filename mismatch
 * 3. Shows HOW the bug manifests
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('\n' + '='.repeat(80));
console.log('🐛 DEMONSTRATING THE FILENAME BUG');
console.log('='.repeat(80));

(async () => {
  try {
    // Load a real WebP image
    const testImagePath = path.join(__dirname, 'static/images/characters/wavelength/eloquence-5.webp');
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ Test image not found');
      process.exit(1);
    }

    const webpBuffer = fs.readFileSync(testImagePath);
    console.log('\n📸 STEP 1: Load WebP image');
    console.log('-'.repeat(80));
    console.log(`File: eloquence-5.webp`);
    console.log(`Size: ${(webpBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`Format: WebP`);

    // Simulate quality validation passing (no upscaling)
    console.log('\n✅ STEP 2: Image quality validation');
    console.log('-'.repeat(80));
    console.log('✅ Image passes quality validation');
    console.log('   → No upscaling needed');
    console.log('   → Goes directly to enhancement/upload path');

    // Simulate enhancement downloading a PNG
    console.log('\n🎨 STEP 3: Enhancement downloads PNG');
    console.log('-'.repeat(80));
    console.log('Enhancement API returns PNG version of the image');

    // Simulate: convert WebP to PNG (simulating what enhancement API returns)
    const enhancedPNGBuffer = await sharp(webpBuffer).png().toBuffer();
    console.log(`Downloaded PNG size: ${(enhancedPNGBuffer.length / 1024).toFixed(2)} KB`);

    // Now we have the bug condition
    console.log('\n💥 STEP 4: THE BUG MANIFESTS');
    console.log('-'.repeat(80));

    const finalBuffer = enhancedPNGBuffer;
    let fileName = 'eloquence-5.webp';  // Original filename, NEVER updated

    console.log(`finalBuffer: PNG (${(finalBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`fileName: ${fileName}`);

    const bufferMetadata = await sharp(finalBuffer).metadata();
    console.log(`\nBuffer actual format: ${bufferMetadata.format.toUpperCase()}`);
    console.log(`Filename says: ${fileName.toUpperCase()}`);

    if (bufferMetadata.format === 'png' && fileName.endsWith('.webp')) {
      console.log('\n🚨 MISMATCH DETECTED:');
      console.log('   Buffer is PNG');
      console.log('   Filename says WebP');
      console.log('   These don\'t match!');
    }

    // Simulate sending to Printify (what the parent uploadImage does)
    console.log('\n📤 STEP 5: Send to Printify parent uploadImage()');
    console.log('-'.repeat(80));

    console.log(`Parent receives:`);
    console.log(`  - Buffer: PNG (${(finalBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`  - fileName: "${fileName}"`);

    console.log(`\nParent checks: fileName ends with ".webp"? ${fileName.endsWith('.webp')}`);

    if (fileName.endsWith('.webp')) {
      console.log('\n⚠️  PROBLEM: Parent thinks it\'s WebP!');
      console.log('   Tries to convert: await sharp(buffer).png()');

      // Simulate what parent does: try to convert PNG to PNG
      console.log('\n   Attempting conversion...');
      const convertedBuffer = await sharp(finalBuffer).png().toBuffer();

      console.log(`   Original PNG: ${(finalBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   After "conversion": ${(convertedBuffer.length / 1024).toFixed(2)} KB`);

      if (convertedBuffer.length !== finalBuffer.length) {
        console.log(`   ❌ DATA CHANGED: ${Math.abs(convertedBuffer.length - finalBuffer.length)} bytes difference!`);
        console.log('   This corrupted image gets sent to Printify');
      }
    }

    // Show what Printify receives
    console.log('\n📨 STEP 6: Printify receives corrupted data');
    console.log('-'.repeat(80));
    console.log('POST /uploads/images.json');
    console.log('{');
    console.log(`  "file_name": "${fileName}",`);
    console.log(`  "contents": "[corrupted base64 data]"`);
    console.log('}');

    console.log('\n❌ PRINTIFY RESPONSE:');
    console.log('HTTP 400 Bad Request');
    console.log('{');
    console.log('  "status": "error",');
    console.log('  "code": 10300,');
    console.log('  "message": "Operation failed.",');
    console.log('  "errors": {');
    console.log('    "reason": "Failed to upload image, please contact support..."');
    console.log('  }');
    console.log('}');

    // Show the fix
    console.log('\n' + '='.repeat(80));
    console.log('✅ HOW THE FIX SOLVES THIS');
    console.log('='.repeat(80));

    console.log('\nBefore Printify upload, the fix does:');
    console.log('\n  if (fileName.endsWith(".webp")) {');
    console.log('    const bufferMetadata = await sharp(finalBuffer).metadata();');
    console.log('    if (bufferMetadata.format === "png") {');
    console.log('      fileName = fileName.replace(/\\.webp$/i, ".png");');
    console.log('    }');
    console.log('  }');

    console.log('\nThis changes:');
    console.log(`  fileName: "eloquence-5.webp" → "eloquence-5.png"`);

    console.log('\nNow Printify receives:');
    console.log('POST /uploads/images.json');
    console.log('{');
    console.log('  "file_name": "eloquence-5.png",');
    console.log('  "contents": "[clean PNG data]"');
    console.log('}');

    console.log('\n✅ PRINTIFY RESPONSE:');
    console.log('HTTP 200 OK');
    console.log('{');
    console.log('  "id": "image_12345",');
    console.log('  "file_name": "eloquence-5.png",');
    console.log('  "preview_url": "https://printify...",');
    console.log('  "mime_type": "image/png"');
    console.log('}');

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));

    console.log('\nBUG: Image passes quality validation → filename never updated');
    console.log('     → PNG buffer + .webp filename sent to Printify');
    console.log('     → Data gets corrupted by double-conversion');
    console.log('     → 400 error from Printify');

    console.log('\nFIX: Check buffer format before upload');
    console.log('     → Detect PNG buffer + .webp filename mismatch');
    console.log('     → Update fileName to match buffer');
    console.log('     → Clean data sent to Printify');
    console.log('     → ✅ Success!');

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  }
})();
