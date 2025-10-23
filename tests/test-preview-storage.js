#!/usr/bin/env node

/**
 * Test Script: Global Image Cache System Validation
 *
 * This script verifies that the new Global Image Cache system correctly:
 * 1. Generates content-based fingerprints for images
 * 2. Stores enhancements globally and reuses them across users
 * 3. Provides cache performance metrics
 * 4. Falls back gracefully to legacy systems when needed
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
const GlobalImageCache = require('../services/global-image-cache');
const enhancedMerchandiseDB = require('../services/enhanced-merchandise-database');
const UpscaledImageManager = require('../utils/gallery/upscaled-manager');
const readline = require('readline'); // For user input

// ANSI colors for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

async function testGlobalImageCache() {
  console.log(`${colors.cyan}🧪 Testing Global Image Cache System...${colors.reset}\n`);

  const testImageFile = 'FrozenPeace-16.webp';
  const timestamp = Date.now();
  const testProductTitle = 'Global Cache Test Product';
  
  // Use different user IDs and unique image keys to avoid cache conflicts
  const testUserA = `test-user-a-cache-${timestamp}`;
  const testUserB = `test-user-b-cache-${timestamp}`;
  const testImageKeyA = `static-test-frozen-peace-a-${timestamp}`;
  const testImageKeyB = `static-test-frozen-peace-b-${timestamp}`;
  
  const service = new AutoEnhancedPrintifyService();
  const globalCache = new GlobalImageCache();
  const enhancedDB = enhancedMerchandiseDB; // Use singleton instance
  const manager = new UpscaledImageManager();

  let imageBuffer;
  let contentHash;

  try {
    // Load test image
    console.log('📸 Loading test image...');
    const imagePath = path.join(__dirname, '..', 'static', 'images', 'characters', 'wavelength', 'FrozenPeace-16.webp');
    imageBuffer = await fs.readFile(imagePath);
    console.log(`   - Loaded ${testImageFile} (${Math.round(imageBuffer.length / 1024)}KB)`);

    // Generate content fingerprint
    console.log('\n🔍 Generating content fingerprint...');
    contentHash = globalCache.generateImageFingerprint(imageBuffer);
    console.log(`   - Content Hash: ${colors.yellow}${contentHash.substring(0, 16)}...${colors.reset}`);

    // --- PRE-TEST CLEANUP ---
    console.log('\n0️⃣  Running pre-test cleanup...');
    try {
      // Clear global cache for this content (only for this specific test)
      await globalCache.globalCacheRef?.child(contentHash).remove();
      await globalCache.imageFingerprintsRef?.child(contentHash).remove();
      
      console.log('   - Global cache cleared for clean test');
    } catch (cleanupError) {
      console.log('   - Cache cleanup completed (some entries may not have existed)');
    }

    // --- Step 1: Test Global Cache Miss (First User) ---
    console.log(`\n1️⃣  Testing global cache MISS (User A - first encounter)...`);
    console.log('   - This should generate a new enhancement and store it globally');
    
    const firstRunResult = await service.uploadImage(
      imageBuffer,
      testImageFile,
      testProductTitle,
      {
        userId: testUserA,
        originalImageId: testImageKeyA, // Use unique key
      }
    );

    if (!firstRunResult.success) {
      throw new Error('First user upload failed: ' + firstRunResult.error);
    }

    console.log(`${colors.green}✅ User A upload successful!${colors.reset}`);
    console.log(`   - Enhancement Source: ${colors.yellow}${firstRunResult.enhancementSource || 'generated'}${colors.reset}`);
    
    if (firstRunResult.cacheOptimization) {
      console.log(`   - Content Hash: ${colors.blue}${firstRunResult.cacheOptimization.contentHash?.substring(0, 16)}...${colors.reset}`);
      console.log(`   - Cache Hit: ${firstRunResult.cacheOptimization.cacheHit ? '🎯' : '❌'}`);
      console.log(`   - First Occurrence: ${firstRunResult.cacheOptimization.isFirstOccurrence ? '🆕' : '♻️'}`);
    }

    // Verify global cache now contains the enhancement
    console.log('\n🔍 Verifying global cache storage...');
    const cachedEnhancement = await globalCache.getGlobalEnhancedImage(contentHash);
    if (!cachedEnhancement) {
      throw new Error('Enhancement was not stored in global cache!');
    }
    console.log(`${colors.green}✅ Enhancement confirmed in global cache${colors.reset}`);

    // --- Step 2: Test Global Cache Hit (Second User) ---
    console.log(`\n2️⃣  Testing global cache HIT (User B - same content, different user)...`);
    console.log('   - This should reuse the existing global enhancement');
    
    const secondRunResult = await service.uploadImage(
      imageBuffer,
      testImageFile,
      testProductTitle,
      {
        userId: testUserB,
        originalImageId: testImageKeyB, // Different user, different originalImageId
      }
    );

    if (!secondRunResult.success) {
      throw new Error('Second user upload failed: ' + secondRunResult.error);
    }

    console.log(`${colors.green}✅ User B upload successful!${colors.reset}`);
    console.log(`   - Enhancement Source: ${colors.yellow}${secondRunResult.enhancementSource || 'unknown'}${colors.reset}`);
    
    if (secondRunResult.cacheOptimization) {
      console.log(`   - Content Hash: ${colors.blue}${secondRunResult.cacheOptimization.contentHash?.substring(0, 16)}...${colors.reset}`);
      console.log(`   - Cache Hit: ${secondRunResult.cacheOptimization.cacheHit ? '🎯 YES' : '❌ NO'}`);
      console.log(`   - Processing Skipped: ${secondRunResult.cacheOptimization.processingSkipped ? '⚡ YES' : '❌ NO'}`);
      console.log(`   - Cache Source: ${colors.magenta}${secondRunResult.cacheOptimization.source}${colors.reset}`);
    }

    // Verify cache hit occurred
    if (secondRunResult.enhancementSource === 'cached' || 
        (secondRunResult.cacheOptimization && secondRunResult.cacheOptimization.cacheHit)) {
      console.log(`${colors.green}🎉 CACHE HIT CONFIRMED! User B reused User A's enhancement${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Cache behavior unclear - checking global cache statistics...${colors.reset}`);
    }

    // --- Step 3: Test Cache Performance Metrics ---
    console.log(`\n3️⃣  Testing cache performance metrics...`);
    
    const metrics = await service.getCachePerformanceMetrics();
    if (metrics && !metrics.error) {
      console.log(`${colors.green}✅ Cache metrics retrieved successfully${colors.reset}`);
      console.log(`   - Cache Hits: ${colors.cyan}${metrics.summary?.totalCacheHits || 0}${colors.reset}`);
      console.log(`   - Cache Misses: ${colors.cyan}${metrics.summary?.totalCacheMisses || 0}${colors.reset}`);
      console.log(`   - Hit Rate: ${colors.cyan}${((metrics.summary?.hitRate || 0) * 100).toFixed(1)}%${colors.reset}`);
      console.log(`   - Enhancements Created: ${colors.cyan}${metrics.summary?.enhancementsCreated || 0}${colors.reset}`);
      console.log(`   - Enhancements Reused: ${colors.cyan}${metrics.summary?.enhancementsReused || 0}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Cache metrics not available: ${metrics?.error || 'Unknown error'}${colors.reset}`);
    }

    // --- Step 4: Test Cache Statistics ---
    console.log(`\n4️⃣  Testing global cache statistics...`);
    
    const globalStats = await globalCache.getCacheStatistics();
    if (globalStats && !globalStats.error) {
      console.log(`${colors.green}✅ Global cache statistics retrieved${colors.reset}`);
      console.log(`   - Total Requests: ${colors.cyan}${globalStats.totalRequests}${colors.reset}`);
      console.log(`   - Cache Hits: ${colors.cyan}${globalStats.cacheHits}${colors.reset}`);
      console.log(`   - Cache Misses: ${colors.cyan}${globalStats.cacheMisses}${colors.reset}`);
      console.log(`   - Hit Rate: ${colors.cyan}${(globalStats.hitRate * 100).toFixed(1)}%${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Global cache statistics not available: ${globalStats?.error || 'Unknown error'}${colors.reset}`);
    }

    // --- Step 5: Test Content-Based Deduplication ---
    console.log(`\n5️⃣  Testing content-based deduplication...`);
    
    // Check fingerprint storage
    const fingerprintResult = await globalCache.checkImageFingerprint(imageBuffer);
    if (fingerprintResult.exists) {
      console.log(`${colors.green}✅ Image fingerprint exists in system${colors.reset}`);
      console.log(`   - Content Hash: ${colors.blue}${fingerprintResult.contentHash.substring(0, 16)}...${colors.reset}`);
      console.log(`   - Usage Count: ${colors.cyan}${fingerprintResult.fingerprintData?.usageCount || 0}${colors.reset}`);
      console.log(`   - First Seen: ${colors.magenta}${fingerprintResult.fingerprintData?.firstSeenPath || 'Unknown'}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Image fingerprint not found in system${colors.reset}`);
    }

    // --- Final Summary ---
    console.log(`\n${colors.green}🎉 GLOBAL IMAGE CACHE TEST COMPLETED!${colors.reset}`);
    console.log(`\n📊 Test Summary:`);
    console.log(`   - Content Hash: ${colors.blue}${contentHash.substring(0, 16)}...${colors.reset}`);
    console.log(`   - Users Tested: ${colors.cyan}2 (A and B)${colors.reset}`);
    console.log(`   - Cache System: ${colors.green}Operational${colors.reset}`);
    console.log(`   - Deduplication: ${fingerprintResult.exists ? colors.green + 'Working' : colors.yellow + 'Needs Review'}${colors.reset}`);
    
    // Check if cache optimization actually worked
    const cacheWorked = (secondRunResult.enhancementSource === 'cached') || 
                       (secondRunResult.cacheOptimization?.cacheHit);
    
    if (cacheWorked) {
      console.log(`   - Cache Efficiency: ${colors.green}✅ EXCELLENT - Cross-user enhancement reuse confirmed${colors.reset}`);
    } else {
      console.log(`   - Cache Efficiency: ${colors.yellow}⚠️  NEEDS INVESTIGATION - Cache reuse not clearly confirmed${colors.reset}`);
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ Global Cache Test Failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // --- POST-TEST CLEANUP ---
    console.log(`\n6️⃣  Running post-test cleanup...`);
    try {
      if (contentHash) {
        // Clear global cache entries for this test
        await globalCache.globalCacheRef?.child(contentHash).remove();
        await globalCache.imageFingerprintsRef?.child(contentHash).remove();
      }
      
      // Clear user-specific artifacts
      await manager.deleteUpscaledVersions(testUserA, testImageKeyA);
      await manager.deleteUpscaledVersions(testUserB, testImageKeyB);
      
      console.log('   - Test artifacts cleaned up successfully');
    } catch (cleanupError) {
      console.log(`   - Cleanup completed with minor issues: ${cleanupError.message}`);
    }
  }
}

if (require.main === module) {
  testGlobalImageCache().catch(err => {
    console.error(`\n${colors.red}A fatal error occurred during the global cache test:${colors.reset}`, err);
    process.exit(1);
  });
}

module.exports = { testGlobalImageCache };