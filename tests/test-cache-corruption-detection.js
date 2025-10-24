#!/usr/bin/env node

/**
 * Test: Cache Corruption Detection Logic
 * 
 * Validates that cache corruption detection correctly handles:
 * 1. Buffer-based caching (no URL/S3 key) - VALID
 * 2. URL-based caching (has URL/S3 key) - VALID
 * 3. Actual corruption (missing required fields) - INVALID
 */

const admin = require('firebase-admin');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../firebaseServiceAccountKey.json')),
    databaseURL: 'https://wavelength-lore-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

async function testCacheCorruptionDetection() {
  console.log('\n🧪 TEST: Cache Corruption Detection Logic\n');
  console.log('=' .repeat(80));

  let passed = 0;
  let failed = 0;

  // Test 1: Buffer-based cache (valid - no URL/S3)
  console.log('\n📋 TEST 1: Buffer-based cache record (SHOULD BE VALID)');
  const bufferCache = {
    contentHash: 'test-hash-buffer',
    enhancedImageUrl: null,
    s3Key: null,
    enhancementMethod: 'openai',
    fileSize: 3148011,
    status: 'active'
  };
  
  const isBufferValid = validateCacheRecord(bufferCache);
  if (isBufferValid) {
    console.log('✅ PASS: Buffer-based cache correctly identified as VALID');
    passed++;
  } else {
    console.log('❌ FAIL: Buffer-based cache incorrectly flagged as CORRUPT');
    failed++;
  }

  // Test 2: URL-based cache (valid - has URL/S3)
  console.log('\n📋 TEST 2: URL-based cache record (SHOULD BE VALID)');
  const urlCache = {
    contentHash: 'test-hash-url',
    enhancedImageUrl: 'https://example.com/image.png',
    s3Key: 'path/to/image.png',
    enhancementMethod: 'openai',
    fileSize: 3148011,
    status: 'active'
  };
  
  const isUrlValid = validateCacheRecord(urlCache);
  if (isUrlValid) {
    console.log('✅ PASS: URL-based cache correctly identified as VALID');
    passed++;
  } else {
    console.log('❌ FAIL: URL-based cache incorrectly flagged as CORRUPT');
    failed++;
  }

  // Test 3: Corrupted cache (missing required fields)
  console.log('\n📋 TEST 3: Corrupted cache record (SHOULD BE INVALID)');
  const corruptCache = {
    contentHash: 'test-hash-corrupt',
    // Missing enhancementMethod
    fileSize: 3148011
  };
  
  const isCorruptValid = validateCacheRecord(corruptCache);
  if (!isCorruptValid) {
    console.log('✅ PASS: Corrupted cache correctly identified as INVALID');
    passed++;
  } else {
    console.log('❌ FAIL: Corrupted cache incorrectly identified as VALID');
    failed++;
  }

  // Test 4: Partial corruption (has method but missing hash)
  console.log('\n📋 TEST 4: Partial corruption (SHOULD BE INVALID)');
  const partialCorrupt = {
    enhancementMethod: 'openai',
    fileSize: 3148011
    // Missing contentHash
  };
  
  const isPartialValid = validateCacheRecord(partialCorrupt);
  if (!isPartialValid) {
    console.log('✅ PASS: Partially corrupted cache correctly identified as INVALID');
    passed++;
  } else {
    console.log('❌ FAIL: Partially corrupted cache incorrectly identified as VALID');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 TEST SUMMARY: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

/**
 * Validates cache record structure
 * Required fields: contentHash, enhancementMethod
 * Optional fields: enhancedImageUrl, s3Key (can be null for buffer-based caching)
 */
function validateCacheRecord(record) {
  if (!record) return false;
  
  // Required fields
  if (!record.contentHash || !record.enhancementMethod) {
    return false;
  }
  
  // Valid if has both URL and S3 key
  if (record.enhancedImageUrl && record.s3Key) {
    return true;
  }
  
  // Valid if both are explicitly null (buffer-based caching)
  if (record.enhancedImageUrl === null && record.s3Key === null) {
    return true;
  }
  
  // Invalid if only one is null (inconsistent state)
  return false;
}

// Run test
testCacheCorruptionDetection().catch(error => {
  console.error('❌ Test execution error:', error);
  process.exit(1);
});
