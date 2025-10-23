#!/usr/bin/env node

/**
 * Test Script: Preview Enhancement and S3 Storage
 *
 * This script verifies that the `previewImageEnhancement` workflow correctly
 * generates an upscaled image and stores it in the S3 bucket.
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const UpscaledImageManager = require('../utils/gallery/upscaled-manager');

// ANSI colors for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

async function testPreviewStorage() {
  console.log(`${colors.cyan}🧪 Testing Preview Enhancement S3 Storage...${colors.reset}\n`);

  let previewResult;
  const testUserId = 'test-user-s3-preview';
  const originalImageId = `test-image-${Date.now()}`;

  try {
    // --- Step 1: Run the preview enhancement ---
    console.log('1️⃣  Running `previewImageEnhancement`...');
    const service = new AutoEnhancedPrintifyService();
    const imagePath = path.join(__dirname, '..', 'static', 'images', 'characters', 'wavelength', 'FrozenPeace-16.webp');
    const imageBuffer = await fs.readFile(imagePath);

    previewResult = await service.previewImageEnhancement(
      imageBuffer,
      'FrozenPeace-16.webp',
      {
        userId: testUserId,
        originalImageId: originalImageId,
      }
    );

    if (!previewResult.success || !previewResult.enhancedImageUrl) {
      throw new Error('Preview enhancement failed or did not return an image URL.');
    }

    console.log(`${colors.green}✅ Preview enhancement successful.${colors.reset}`);
    console.log(`   - Method: ${previewResult.enhancementMethod}`);
    console.log(`   - New URL: ${previewResult.enhancedImageUrl}`);
    console.log(`   - Improvement: ${previewResult.improvementDescription}`);

    // --- Step 2: Verify the image exists in S3 ---
    console.log('\n2️⃣  Verifying image existence in S3...');
    const manager = new UpscaledImageManager();
    const upscaledVersions = await manager.getUpscaledVersions(testUserId, originalImageId);

    if (!upscaledVersions || upscaledVersions.length === 0) {
      throw new Error(`No upscaled images found in S3 for originalImageId: ${originalImageId}`);
    }

    const storedImage = upscaledVersions.find(img => img.url === previewResult.enhancedImageUrl);

    if (!storedImage) {
      throw new Error('The URL returned by the preview does not match any image found in S3.');
    }

    console.log(`${colors.green}✅ Verification successful! Image found in S3.${colors.reset}`);
    console.log(`   - S3 Key: ${storedImage.key}`);
    console.log(`   - Size: ${(storedImage.size / 1024).toFixed(2)} KB`);
    console.log(`   - Last Modified: ${storedImage.lastModified}`);

    // --- Final Summary ---
    console.log(`\n${colors.green}🎉 All tests passed! The preview enhancement and S3 storage workflow is working correctly.${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test Failed: ${error.message}${colors.reset}`);
    if (previewResult) {
      console.log('\n🔍 Preview Result Details:');
      console.log(JSON.stringify(previewResult, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testPreviewStorage().catch(err => {
    console.error(`\n${colors.red}A fatal error occurred during the test:${colors.reset}`, err);
    process.exit(1);
  });
}

module.exports = { testPreviewStorage };