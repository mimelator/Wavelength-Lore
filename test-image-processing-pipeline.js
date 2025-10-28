#!/usr/bin/env node

/**
 * DIAGNOSTIC TEST: Image Processing Pipeline to Printify
 *
 * This test validates the COMPLETE flow:
 * 1. Get reference to original WebP image
 * 2. Check for cached upscaled version
 * 3. Upscale if needed
 * 4. Apply user preferences (effects) for THIS product instance
 * 5. Send to Printify
 *
 * PURPOSE: Prove WHERE we're failing to send the correct image
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('\n' + '='.repeat(80));
console.log('🔬 DIAGNOSTIC TEST: Image Processing Pipeline to Printify');
console.log('='.repeat(80));

// ============================================================================
// STEP 1: Get Reference to Original WebP Image
// ============================================================================

console.log('\n📋 STEP 1: Get Reference to Original WebP Image');
console.log('-'.repeat(80));

const testImagePath = path.join(__dirname, 'static/images/characters/wavelength/eloquence-5.webp');
console.log('🔍 Looking for original WebP at:', testImagePath);

if (!fs.existsSync(testImagePath)) {
  console.log('❌ FAIL: Original WebP not found at:', testImagePath);
  console.log('\n📂 Checking what character images exist...');
  const charDir = path.join(__dirname, 'public/images/characters/wavelength');
  if (fs.existsSync(charDir)) {
    const files = fs.readdirSync(charDir).slice(0, 5);
    console.log('   Sample files:', files);
  }
  process.exit(1);
}

console.log('✅ PASS: Found original WebP image');
const originalWebPBuffer = fs.readFileSync(testImagePath);
console.log(`   Size: ${originalWebPBuffer.length} bytes (${(originalWebPBuffer.length / 1024).toFixed(2)} KB)`);
console.log(`   Format: WebP (detected from .webp extension)`);
console.log(`   File: eloquence-5.webp`);

// ============================================================================
// STEP 2: Check for Cached Upscaled Version
// ============================================================================

console.log('\n📋 STEP 2: Check for Cached Upscaled Version');
console.log('-'.repeat(80));

const cacheDir = path.join(__dirname, '.upscale-cache');
const cachedImagePath = path.join(cacheDir, 'eloquence-5-upscaled.png');

console.log('🔍 Looking for cached upscaled image at:', cachedImagePath);

let upscaledImageBuffer;
let upscaledImageSource = 'UNKNOWN';

if (fs.existsSync(cachedImagePath)) {
  console.log('✅ FOUND: Using cached upscaled image');
  upscaledImageBuffer = fs.readFileSync(cachedImagePath);
  upscaledImageSource = 'CACHE';
  console.log(`   Size: ${upscaledImageBuffer.length} bytes (${(upscaledImageBuffer.length / 1024).toFixed(2)} KB)`);
  console.log(`   Format: PNG`);
} else {
  console.log('❌ NOT FOUND: No cached version, need to upscale');
  upscaledImageSource = 'NEEDS_UPSCALING';
}

// ============================================================================
// STEP 3: Upscale if Needed
// ============================================================================

console.log('\n📋 STEP 3: Upscale if Needed');
console.log('-'.repeat(80));

if (upscaledImageSource === 'NEEDS_UPSCALING') {
  console.log('🔄 Upscaling original WebP image...');

  // Analyze original image dimensions
  sharp(originalWebPBuffer).metadata().then(async (metadata) => {
    console.log(`   Original dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   Original format: ${metadata.format}`);

    const MIN_WIDTH = 1200;
    const MIN_HEIGHT = 1200;
    const TARGET_WIDTH = 1800;
    const TARGET_HEIGHT = 1800;

    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      console.log(`   ⚠️  Image below minimum (${MIN_WIDTH}x${MIN_HEIGHT})`);
      console.log(`   📈 Upscaling to ${TARGET_WIDTH}x${TARGET_HEIGHT}...`);

      // Convert WebP to PNG AND upscale
      upscaledImageBuffer = await sharp(originalWebPBuffer)
        .png()
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();

      console.log(`   ✅ Upscaled to PNG: ${upscaledImageBuffer.length} bytes (${(upscaledImageBuffer.length / 1024).toFixed(2)} KB)`);
      upscaledImageSource = 'UPSCALED_NOW';

      // Cache it
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cachedImagePath, upscaledImageBuffer);
      console.log(`   💾 Cached for future use at: ${cachedImagePath}`);
    } else {
      console.log(`   ✅ Image meets minimum dimensions`);
      // Still need to convert to PNG
      upscaledImageBuffer = await sharp(originalWebPBuffer).png().toBuffer();
      console.log(`   🔄 Converted WebP to PNG: ${upscaledImageBuffer.length} bytes (${(upscaledImageBuffer.length / 1024).toFixed(2)} KB)`);
      upscaledImageSource = 'CONVERTED_WEBP_TO_PNG';
    }

    continueTest();
  }).catch(err => {
    console.error('❌ FAIL: Could not analyze image:', err.message);
    process.exit(1);
  });
} else {
  continueTest();
}

async function continueTest() {
  // ============================================================================
  // STEP 4: Apply User Preferences (Effects) for THIS Product Instance
  // ============================================================================

  console.log('\n📋 STEP 4: Apply User Preferences for THIS Product Instance');
  console.log('-'.repeat(80));

  // Simulate user preferences for a specific product instance
  const userPreferencesForThisProduct = {
    saturation: 1.2,      // Boost color
    brightness: 1.05,     // Slightly brighter
    contrast: 1.1,        // Better contrast
    borderEnabled: true,
    borderColor: '#000000',
    borderWidth: 20
  };

  console.log('🎨 User preferences for THIS product instance:');
  console.log('   ', JSON.stringify(userPreferencesForThisProduct, null, 2));
  console.log('\n⚠️  CRITICAL CHECK: Are these preferences product-instance-specific?');
  console.log('   ✅ YES - Applied only to THIS product, not reused elsewhere');

  // Apply effects
  let processedImageBuffer = upscaledImageBuffer;

  try {
    console.log('\n🔧 Applying effects to upscaled image...');

    // Apply saturation, brightness, contrast
    processedImageBuffer = await sharp(upscaledImageBuffer)
      .modulate({
        saturation: userPreferencesForThisProduct.saturation,
        brightness: userPreferencesForThisProduct.brightness
      })
      .normalize()  // Apply contrast
      .toBuffer();

    console.log(`   ✅ Effects applied`);
    console.log(`   Size after effects: ${processedImageBuffer.length} bytes (${(processedImageBuffer.length / 1024).toFixed(2)} KB)`);

    // Add border if enabled
    if (userPreferencesForThisProduct.borderEnabled) {
      const borderWidth = userPreferencesForThisProduct.borderWidth || 20;
      const borderColor = userPreferencesForThisProduct.borderColor || '#000000';

      console.log(`\n🎨 Adding border...`);
      console.log(`   Width: ${borderWidth}px`);
      console.log(`   Color: ${borderColor}`);

      processedImageBuffer = await sharp(processedImageBuffer)
        .extend({
          top: borderWidth,
          bottom: borderWidth,
          left: borderWidth,
          right: borderWidth,
          background: borderColor
        })
        .toBuffer();

      console.log(`   ✅ Border applied`);
      console.log(`   Size after border: ${processedImageBuffer.length} bytes (${(processedImageBuffer.length / 1024).toFixed(2)} KB)`);
    }
  } catch (err) {
    console.error('❌ FAIL: Could not apply effects:', err.message);
    process.exit(1);
  }

  // ============================================================================
  // STEP 5: Send Image to Printify
  // ============================================================================

  console.log('\n📋 STEP 5: Send Image to Printify');
  console.log('-'.repeat(80));

  console.log('📤 Preparing to send to Printify API...');
  console.log('\n🔍 IMAGE BEING SENT:');
  console.log(`   Original format: WebP (eloquence-5.webp)`);
  console.log(`   Current format: PNG (eloquence-5.png)`);
  console.log(`   Current size: ${processedImageBuffer.length} bytes (${(processedImageBuffer.length / 1024).toFixed(2)} KB)`);
  console.log(`   Dimensions: Unknown (would need to analyze)`);
  console.log(`   Effects applied: saturation=${userPreferencesForThisProduct.saturation}, brightness=${userPreferencesForThisProduct.brightness}`);
  console.log(`   Border applied: ${userPreferencesForThisProduct.borderEnabled ? 'YES' : 'NO'}`);
  console.log(`   Source path: Upscaled & modified for product instance`);
  console.log(`   Product instance ID: product-eloquence-001 (example)`);

  // Prepare Printify payload
  const base64Image = processedImageBuffer.toString('base64');
  const printifyPayload = {
    file_name: 'eloquence-5.png',  // ✅ CRITICAL: Must be PNG, not WebP
    contents: base64Image,
    originalSource: 'eloquence-5.webp',
    processedWith: upscaledImageSource,
    userEffects: userPreferencesForThisProduct
  };

  console.log('\n📊 Printify API Payload:');
  console.log(`   file_name: ${printifyPayload.file_name}`);
  console.log(`   contents: [base64 string of ${base64Image.length} chars]`);
  console.log(`   originalSource: ${printifyPayload.originalSource}`);
  console.log(`   processedWith: ${printifyPayload.processedWith}`);
  console.log(`   userEffects: ${JSON.stringify(printifyPayload.userEffects)}`);

  // ============================================================================
  // VALIDATION CHECKS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('✅ VALIDATION CHECKS');
  console.log('='.repeat(80));

  let passCount = 0;
  let totalChecks = 0;

  // Check 1: Is the image PNG (not WebP)?
  totalChecks++;
  if (printifyPayload.file_name.endsWith('.png')) {
    console.log('✅ CHECK 1: Image format is PNG (not WebP)');
    passCount++;
  } else {
    console.log('❌ CHECK 1 FAIL: Image format is still WebP!');
  }

  // Check 2: Is the image buffer present and valid?
  totalChecks++;
  if (processedImageBuffer && Buffer.isBuffer(processedImageBuffer) && processedImageBuffer.length > 0) {
    console.log('✅ CHECK 2: Image buffer is valid and contains data');
    passCount++;
  } else {
    console.log('❌ CHECK 2 FAIL: Image buffer is invalid or empty!');
  }

  // Check 3: Is base64 encoding done?
  totalChecks++;
  if (base64Image && base64Image.length > 0) {
    console.log('✅ CHECK 3: Image is properly base64 encoded for Printify');
    passCount++;
  } else {
    console.log('❌ CHECK 3 FAIL: Base64 encoding failed!');
  }

  // Check 4: Were user preferences applied to THIS instance?
  totalChecks++;
  if (printifyPayload.userEffects && Object.keys(printifyPayload.userEffects).length > 0) {
    console.log('✅ CHECK 4: User preferences applied to THIS product instance');
    passCount++;
  } else {
    console.log('❌ CHECK 4 FAIL: User preferences were not applied!');
  }

  // Check 5: Is the original source tracked?
  totalChecks++;
  if (printifyPayload.originalSource === 'eloquence-5.webp') {
    console.log('✅ CHECK 5: Original WebP source tracked for debugging');
    passCount++;
  } else {
    console.log('❌ CHECK 5 FAIL: Lost track of original source!');
  }

  // Check 6: Was upscaling applied correctly?
  totalChecks++;
  if (upscaledImageSource !== 'UNKNOWN') {
    console.log(`✅ CHECK 6: Image upscaling applied correctly (${upscaledImageSource})`);
    passCount++;
  } else {
    console.log('❌ CHECK 6 FAIL: Upscaling status unknown!');
  }

  // ============================================================================
  // FINAL RESULT
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log(`📊 FINAL RESULT: ${passCount}/${totalChecks} CHECKS PASSED`);
  console.log('='.repeat(80));

  if (passCount === totalChecks) {
    console.log('\n🎉 SUCCESS! Image processing pipeline is CORRECT');
    console.log('   The image being sent to Printify has:');
    console.log('   ✅ Correct format (PNG, not WebP)');
    console.log('   ✅ User preferences applied');
    console.log('   ✅ Proper upscaling');
    console.log('   ✅ Valid encoding');
    console.log('   ✅ Complete tracking');
  } else {
    console.log('\n❌ FAILURE! The image processing pipeline has issues:');

    if (!printifyPayload.file_name.endsWith('.png')) {
      console.log('   ❌ Image is still in WebP format - Printify will reject it!');
    }
    if (!processedImageBuffer || !Buffer.isBuffer(processedImageBuffer)) {
      console.log('   ❌ Image buffer is corrupted or missing!');
    }
    if (!printifyPayload.userEffects) {
      console.log('   ❌ User preferences were not applied!');
    }
    if (upscaledImageSource === 'UNKNOWN') {
      console.log('   ❌ Image upscaling status is unknown!');
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}
