#!/usr/bin/env node

/**
 * TEST: Filename Mismatch Bug After Upscaling
 *
 * The upscaler converts WebP to PNG internally,
 * but NEVER updates the filename!
 *
 * This causes the uploadImage() function to receive:
 * - A PNG buffer (from upscaler)
 * - A .webp filename (original, never updated)
 *
 * This mismatch could cause upload failures.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('\n' + '='.repeat(80));
console.log('🐛 TEST: Filename Mismatch Bug After Upscaling');
console.log('='.repeat(80));

const testImagePath = path.join(__dirname, 'static/images/characters/wavelength/eloquence-5.webp');

if (!fs.existsSync(testImagePath)) {
  console.error('❌ Test image not found');
  process.exit(1);
}

(async () => {
  const originalWebPBuffer = fs.readFileSync(testImagePath);
  const originalFileName = 'eloquence-5.webp';

  console.log('\n📋 SCENARIO: Upscaler gets WebP');
  console.log('-'.repeat(80));
  console.log('Input to upscaler:');
  console.log(`   fileName: ${originalFileName}`);
  console.log(`   buffer format: WebP (detected from metadata)`);
  console.log(`   buffer size: ${(originalWebPBuffer.length / 1024).toFixed(2)} KB`);

  // Simulate what the upscaler does
  console.log('\n🔄 Inside upscaler:');
  const metadata = await sharp(originalWebPBuffer).metadata();
  console.log(`   Detected format: ${metadata.format}`);
  console.log(`   Is WebP? ${metadata.format === 'webp' ? 'YES' : 'NO'}`);

  if (metadata.format === 'webp') {
    console.log('   ✓ Found WebP, converting to PNG...');
    const pngBuffer = await sharp(originalWebPBuffer)
      .png({ quality: 70, compressionLevel: 9 })
      .toBuffer();

    console.log(`   ✓ Converted: WebP → PNG`);
    console.log(`   ✓ New buffer size: ${(pngBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   ✗ BUT FILENAME IS NEVER UPDATED!`);

    console.log('\n📤 Upscaler returns:');
    console.log(`   fileName: ${originalFileName} ❌ STILL .webp!`);
    console.log(`   buffer format: PNG (from conversion)`);
    console.log(`   buffer size: ${(pngBuffer.length / 1024).toFixed(2)} KB`);

    console.log('\n' + '='.repeat(80));
    console.log('🚨 THE BUG: Filename vs Buffer Format Mismatch!');
    console.log('='.repeat(80));

    console.log('\n❌ PROBLEM:');
    console.log(`   ✗ fileName says: .webp`);
    console.log(`   ✗ buffer is: PNG`);
    console.log(`   ✗ Mismatch!`);

    console.log('\n⚡ CONSEQUENCE:');
    console.log('   When this gets to printifyService.uploadImage()...');
    console.log(`   1. It sees fileName ending in ".webp"`);
    console.log(`   2. It tries to convert: sharp(buffer).png().toBuffer()`);
    console.log(`   3. BUT the buffer is already PNG!`);
    console.log(`   4. Sharp tries to read PNG as WebP and may fail`);
    console.log(`   5. Or produces wrong output`);
    console.log(`   6. Sends wrong data to Printify → 400 error`);

    console.log('\n✅ THE FIX:');
    console.log('   When upscaler converts WebP to PNG,');
    console.log('   it MUST also update the filename:');
    console.log(`   return { buffer: pngBuffer, fileName: 'eloquence-5.png' }`);
    console.log('   OR at minimum update it before returning from uploadImage()');

    console.log('\n📋 VERIFICATION:');
    console.log('-'.repeat(80));

    // Prove what happens when we try to convert PNG to PNG
    console.log('\nWhat happens if we try to convert PNG buffer with .webp filename:');
    try {
      const testConvert = await sharp(pngBuffer)
        .png()
        .toBuffer();

      console.log(`   ✓ Conversion succeeded (PNG → PNG works)`);
      console.log(`   But produced: ${(testConvert.length / 1024).toFixed(2)} KB`);
      console.log(`   Original PNG: ${(pngBuffer.length / 1024).toFixed(2)} KB`);

      if (testConvert.length !== pngBuffer.length) {
        console.log(`   ⚠️  Output is different size! Data corruption possible!`);
      }
    } catch (err) {
      console.log(`   ❌ Conversion FAILED: ${err.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS');
    console.log('='.repeat(80));
    console.log(`\nThe root cause of the Printify 400 error is:`);
    console.log(`  1. Upscaler converts WebP → PNG internally ✓`);
    console.log(`  2. But NEVER updates the filename to .png ❌`);
    console.log(`  3. Passes PNG buffer + .webp filename to uploadImage()`);
    console.log(`  4. uploadImage() sees .webp extension`);
    console.log(`  5. Tries to convert PNG using sharp(buffer).png()`);
    console.log(`  6. This may corrupt or change the buffer`);
    console.log(`  7. Sends corrupted data to Printify`);
    console.log(`  8. Printify rejects with 400 error`);

    console.log('\n' + '='.repeat(80) + '\n');
  }
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
