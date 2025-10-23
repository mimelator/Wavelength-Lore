#!/usr/bin/env node

/**
 * Test Script: Firebase Cache Write and Read Integrity
 *
 * This script performs a direct test on the MerchandiseDatabase service to prove
 * that a cache record can be successfully written to and read back from Firebase.
 * It uses a pre-existing S3 image URL to isolate the test to only the database operations.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Use the singleton instance of the database service
const merchandiseDB = require('../services/merchandise-database');

// ANSI colors for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

/**
 * Sanitizes a string to be used as a valid Firebase Realtime Database key.
 */
function _sanitizeFirebaseKey(key) {
  return key.replace(/[.#$\[\]\/]/g, '_');
}

async function testFirebaseCache() {
  console.log(`${colors.cyan}🧪 Testing Firebase Cache Write/Read Integrity...${colors.reset}\n`);

  const originalImageId = 'static-test-image-frozen-peace';
  const sanitizedImageId = _sanitizeFirebaseKey(originalImageId);

  // This data is hardcoded using a REAL, existing S3 object from previous failed runs.
  // This isolates the test to database operations only.
  const testEnhancementData = {
    s3Key: "upscaled/test-user-s3-preview/static-test-image-frozen-peace-enhanced-1761223988642.png",
    enhancedImageUrl: "https://d3ohg9sf8htmwk.cloudfront.net/upscaled/test-user-s3-preview/static-test-image-frozen-peace-enhanced-1761223988642.png",
    enhancementMethod: "manual-test-entry",
    originalDimensions: { width: 1280, height: 896 },
    enhancedDimensions: { width: 3000, height: 3000 },
    scaleFactor: 2.3,
    improvementDescription: "Manually seeded cache entry for testing."
  };

  try {
    // --- Step 1: WRITE the record to Firebase ---
    console.log(`1️⃣  Attempting to WRITE a cache record to Firebase for key: ${colors.yellow}${sanitizedImageId}${colors.reset}`);
    const storeResult = await merchandiseDB.storeEnhancedImage(sanitizedImageId, testEnhancementData);
    if (!storeResult.success) {
      throw new Error(`DATABASE WRITE FAILED: ${storeResult.error}`);
    }
    console.log(`${colors.green}✅ WRITE successful.${colors.reset}`);

    // --- Step 2: READ the record back from Firebase ---
    console.log(`\n2️⃣  Attempting to READ the same record back from Firebase...`);
    const readResult = await merchandiseDB.getEnhancedImage(sanitizedImageId);

    // --- Step 3: VERIFY the result ---
    console.log(`\n3️⃣  Verifying the result...`);
    if (!readResult) {
      throw new Error(`FATAL CACHE FAILURE: A record was just written but getEnhancedImage() returned null. The database read operation is failing.`);
    }

    if (readResult.s3Key !== testEnhancementData.s3Key) {
      throw new Error(`Data mismatch! Expected s3Key '${testEnhancementData.s3Key}', but got '${readResult.s3Key}'.`);
    }
    console.log(`${colors.green}✅ READ successful and data is consistent.${colors.reset}`);

    console.log(`\n${colors.green}🎉 TEST PASSED: The database can successfully write and read a cache record.${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ TEST FAILED: ${error.message}${colors.reset}`);
    process.exit(1);
  } finally {
    // --- Step 4: CLEANUP ---
    console.log(`\n4️⃣  Cleaning up test record from Firebase...`);
    await merchandiseDB.deleteEnhancedImage(sanitizedImageId);
  }
}

if (require.main === module) {
  testFirebaseCache();
}

module.exports = { testFirebaseCache };
