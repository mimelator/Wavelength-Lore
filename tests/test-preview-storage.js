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

// Handle EPIPE errors globally to prevent crashes when output is truncated (e.g., with head command)
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    process.exit(0); // Exit gracefully on EPIPE
  }
});

process.stderr.on('error', (err) => {
  if (err.code === 'EPIPE') {
    process.exit(0); // Exit gracefully on EPIPE
  }
});

const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const UpscaledImageManager = require('../utils/gallery/upscaled-manager');
const MerchandiseDatabase = require('../services/merchandise-database');
const readline = require('readline'); // For user input

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
  const testImageFile = 'FrozenPeace-16.webp'; // The image we are testing
  const testProductTitle = 'Test Cache Product';
  // Use a STATIC ID to ensure cache persists between test runs.
  // This is the key to testing the caching logic correctly.
  const originalImageId = 'static-test-image-frozen-peace';

  const service = new AutoEnhancedPrintifyService();
  const manager = new UpscaledImageManager();
  const db = require('../services/merchandise-database'); // Use the singleton instance

  try {
    // --- PRE-TEST CLEANUP ---
    console.log('0️⃣  Running pre-test cleanup...');
    const sanitizedImageId = originalImageId.replace(/[.#$\[\]\/]/g, '_');
    await db.deleteEnhancedImage(sanitizedImageId);
    await manager.deleteUpscaledVersions(testUserId, originalImageId);
    console.log('   - Cache and S3 artifacts cleared for a clean test run.');

    // --- Step 1: First product creation. This should GENERATE and CACHE the enhancement. ---
    console.log(`\n1️⃣  Running first product creation for '${originalImageId}'...`);
    console.log('   - This run is expected to GENERATE a new enhancement.');
    const imagePath = path.join(__dirname, '..', 'static', 'images', 'characters', 'wavelength', 'FrozenPeace-16.webp');
    const imageBuffer = await fs.readFile(imagePath);

    const firstRunResult = await service.uploadImage(
      imageBuffer,
      testImageFile,
      testProductTitle,
      {
        userId: testUserId,
        originalImageId: originalImageId,
      }
    );

    if (!firstRunResult.success) {
      throw new Error('First product creation run failed during image upload.');
    }
    if (firstRunResult.enhancementSource !== 'generated') {
      throw new Error(`First run failed: Expected enhancementSource to be 'generated', but got '${firstRunResult.enhancementSource}'.`);
    }
    console.log(`${colors.green}✅ First run successful. Enhancement was generated as expected.${colors.reset}`);

    // --- Step 2: Second product creation. This should REUSE the cached enhancement. ---
    console.log(`\n2️⃣  Running second product creation for '${originalImageId}'...`);
    console.log('   - This run is expected to REUSE the cached enhancement.');
    const secondRunResult = await service.uploadImage(
      imageBuffer,
      testImageFile,
      testProductTitle,
      {
        userId: testUserId,
        originalImageId: originalImageId,
      }
    );

    if (!secondRunResult.success) {
      throw new Error('Second product creation run failed during image upload.');
    }
    if (secondRunResult.enhancementSource !== 'cached') {
      throw new Error(`FATAL CACHE FAILURE: Expected enhancementSource to be 'cached', but got '${secondRunResult.enhancementSource}'. The cache was not reused.`);
    }
    console.log(`${colors.green}✅ Second run successful! Existing enhancement was reused.${colors.reset}`);
    console.log(`   - Enhancement Source: ${colors.yellow}${secondRunResult.enhancementSource}${colors.reset}`);

    // --- Final Summary ---
    console.log(`\n${colors.green}🎉 TEST PASSED: The enhancement, storage, and caching workflows are working correctly.${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test Failed: ${error.message}${colors.reset}`);
    if (previewResult) {
      console.log('\n🔍 Preview Result Details:');
      console.log(JSON.stringify(previewResult, null, 2));
    }
    process.exit(1);
  } finally {
    // --- POST-TEST CLEANUP ---
    console.log('\n3️⃣  Running post-test cleanup...');
    const sanitizedImageId = originalImageId.replace(/[.#$\[\]\/]/g, '_');
    await db.deleteEnhancedImage(sanitizedImageId);
    await manager.deleteUpscaledVersions(testUserId, originalImageId);
    console.log('   - Test artifacts in S3 and Firebase have been deleted.');
  }
}

if (require.main === module) {
  testPreviewStorage().catch(err => {
    console.error(`\n${colors.red}A fatal error occurred during the test:${colors.reset}`, err);
    process.exit(1);
  });
}

module.exports = { testPreviewStorage };