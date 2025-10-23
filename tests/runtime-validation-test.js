/**
 * Runtime Validation Test for Image Upscaling
 * 
 * This script tests the comprehensive runtime validation that occurs
 * every time an image is upscaled, verifying:
 * - Original image analysis
 * - Upscaling result validation  
 * - Firebase Global Cache integration
 * - API availability verification
 * - Quality metrics assessment
 */

const ImageUpscalingService = require('../services/image-upscaling-service');
const fs = require('fs').promises;
const path = require('path');

class RuntimeValidationTester {
  constructor() {
    this.upscalingService = new ImageUpscalingService();
  }

  /**
   * Find a test image to use for validation
   */
  async findTestImage() {
    const searchPaths = [
      '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/static',
      '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/examples',
      '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/temp',
      '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/content'
    ];

    for (const searchPath of searchPaths) {
      try {
        await this.searchDirectoryForImages(searchPath);
      } catch (err) {
        // Continue searching
      }
    }

    // If no image found, create a small test image
    return await this.createTestImage();
  }

  /**
   * Recursively search directory for image files
   */
  async searchDirectoryForImages(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return null;

    try {
      const entries = await fs.readdir(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = await fs.stat(fullPath);
        
        if (stat.isFile() && entry.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const buffer = await fs.readFile(fullPath);
          if (buffer.length > 1000 && buffer.length < 5000000) { // 1KB to 5MB
            console.log(`📁 Found test image: ${fullPath} (${Math.round(buffer.length/1024)} KB)`);
            return { buffer, fileName: entry, path: fullPath };
          }
        } else if (stat.isDirectory() && !entry.startsWith('.')) {
          const result = await this.searchDirectoryForImages(fullPath, maxDepth, currentDepth + 1);
          if (result) return result;
        }
      }
    } catch (err) {
      // Directory access failed, continue
    }

    return null;
  }

  /**
   * Create a simple test image if none found
   */
  async createTestImage() {
    console.log('🎨 Creating test image...');
    
    // Create a simple colored square PNG
    const sharp = require('sharp');
    
    const testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .png()
    .toBuffer();

    return {
      buffer: testImageBuffer,
      fileName: 'runtime-test-image.png',
      path: 'generated'
    };
  }

  /**
   * Test runtime validation with a real upscaling operation
   */
  async testRuntimeValidation() {
    console.log('🚀 RUNTIME VALIDATION TEST');
    console.log('=' .repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);

    try {
      // Find or create test image
      console.log('\n🔍 Preparing test image...');
      const testImage = await this.findTestImage();
      
      if (!testImage) {
        throw new Error('Could not find or create test image');
      }

      console.log(`✅ Test image ready: ${testImage.fileName} (${Math.round(testImage.buffer.length/1024)} KB)`);

      // Perform upscaling with runtime validation
      console.log('\n🎯 Starting upscaling with runtime validation...');
      
      const startTime = Date.now();
      
      const result = await this.upscalingService.upscaleImage(
        testImage.buffer,
        {
          method: 'openai',
          style: 'digital artwork, high quality',
          quality: 'high',
          originalImageId: `runtime-test-${Date.now()}`,
          userId: 'runtime-test-user'
        }
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log('\n📊 UPSCALING OPERATION COMPLETE');
      console.log('=' .repeat(60));
      console.log(`Total Time: ${totalTime}ms`);
      console.log(`Success: ${result.success}`);
      
      if (result.success) {
        console.log(`Upscaled Size: ${Math.round(result.upscaledBuffer.length/1024)} KB`);
        console.log(`S3 Key: ${result.s3Key}`);
        console.log(`URL: ${result.metadata?.url}`);
      } else {
        console.log(`Error: ${result.error}`);
      }

      // Access the validation data from the service
      console.log('\n🔍 RUNTIME VALIDATION RESULTS');
      console.log('=' .repeat(60));
      
      if (this.upscalingService.lastValidation) {
        const validation = this.upscalingService.lastValidation;
        
        console.log(`Validation ID: ${validation.id}`);
        console.log(`Validation Status: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`Errors: ${validation.errors.length}`);
        console.log(`Warnings: ${validation.warnings.length}`);
        
        // Summary of key validations
        console.log('\n📋 KEY VALIDATION POINTS:');
        console.log(`✓ Original Image: ${validation.originalImage.contentHash ? 'Analyzed' : 'Failed'}`);
        console.log(`✓ Upscaled Image: ${validation.upscaledImage.success ? 'Valid' : 'Failed'}`);
        console.log(`✓ Global Cache Save: ${validation.globalCache.saveSuccess ? 'Success' : 'Failed'}`);
        console.log(`✓ Firebase Retrieval: ${validation.globalCache.retrievalSuccess ? 'Success' : 'Failed'}`);
        console.log(`✓ URL Access: ${validation.apiVerification?.directUrlAccess?.accessible ? 'Accessible' : 'Failed'}`);
        console.log(`✓ Proxy Access: ${validation.apiVerification?.proxyUrlAccess?.accessible ? 'Accessible' : 'Failed'}`);

        if (validation.errors.length > 0) {
          console.log('\n❌ VALIDATION ERRORS:');
          validation.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }

        if (validation.warnings.length > 0) {
          console.log('\n⚠️  VALIDATION WARNINGS:');
          validation.warnings.forEach((warning, index) => {
            console.log(`   ${index + 1}. ${warning}`);
          });
        }

        // Test success criteria
        const criticalTests = [
          validation.originalImage.contentHash,
          validation.upscaledImage.success,
          validation.globalCache.saveSuccess,
          validation.globalCache.retrievalSuccess
        ];

        const allCriticalPassed = criticalTests.every(test => !!test);
        
        console.log(`\n${allCriticalPassed ? '🎉' : '💥'} OVERALL TEST RESULT: ${allCriticalPassed ? 'SUCCESS' : 'FAILURE'}`);
        
        return {
          success: allCriticalPassed,
          upscalingResult: result,
          validationResult: validation,
          totalTime: totalTime
        };

      } else {
        console.log('❌ No validation data found - runtime validation may not have executed');
        return {
          success: false,
          error: 'No validation data available',
          upscalingResult: result
        };
      }

    } catch (error) {
      console.error('💥 Runtime validation test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test multiple upscaling operations to verify cache consistency
   * The first run should upscale, subsequent runs should use cache
   */
  async testMultipleOperations(count = 3) {
    console.log(`\n🔄 TESTING ${count} SEQUENTIAL OPERATIONS FOR CACHE BEHAVIOR`);
    console.log('=' .repeat(60));

    const results = [];
    let testImage = null;

    for (let i = 1; i <= count; i++) {
      console.log(`\n🔄 Operation ${i} of ${count}`);
      console.log('-' .repeat(30));

      try {
        // Use the same test image for all runs to test caching
        if (!testImage) {
          testImage = await this.findTestImage();
          if (!testImage) {
            throw new Error('Could not find or create test image');
          }
          console.log(`📁 Using consistent test image: ${testImage.fileName} (${Math.round(testImage.buffer.length/1024)} KB)`);
        }

        const startTime = Date.now();
        
        // Use consistent parameters for cache testing
        const testId = `cache-test-${Date.now()}`;
        const result = await this.upscalingService.upscaleImage(
          testImage.buffer,
          {
            method: 'openai',
            style: 'digital artwork, high quality',
            quality: 'high',
            originalImageId: testId,
            userId: 'cache-test-user'
          }
        );

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Analyze the result for cache behavior
        const wasCached = result.cached || result.method === 'cache';
        const wasUpscaled = !wasCached && result.success;
        
        console.log(`\n📊 OPERATION ${i} RESULTS:`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Method: ${result.method || 'unknown'}`);
        console.log(`   Was Cached: ${wasCached}`);
        console.log(`   Was Upscaled: ${wasUpscaled}`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   S3 Key: ${result.s3Key || 'none'}`);
        console.log(`   URL: ${result.metadata?.url || 'none'}`);

        // Validate expectations based on operation number
        let expectedBehavior;
        let actualBehavior;
        let behaviorCorrect = false;

        if (i === 1) {
          // First run should upscale (unless cache already exists)
          expectedBehavior = 'upscale or cache (if pre-existing)';
          actualBehavior = wasCached ? 'used cache' : 'upscaled';
          behaviorCorrect = true; // Either behavior is acceptable for first run
        } else {
          // Subsequent runs MUST use cache
          expectedBehavior = 'use cache';
          actualBehavior = wasCached ? 'used cache' : 'upscaled';
          behaviorCorrect = wasCached;
        }

        console.log(`\n🎯 CACHE BEHAVIOR ANALYSIS:`);
        console.log(`   Expected: ${expectedBehavior}`);
        console.log(`   Actual: ${actualBehavior}`);
        console.log(`   Correct: ${behaviorCorrect ? '✅ YES' : '❌ NO'}`);

        if (!behaviorCorrect) {
          console.error(`\n❌ CACHE FAILURE: Operation ${i} should have used cache but performed upscaling!`);
        }

        results.push({
          operation: i,
          success: result.success,
          wasCached: wasCached,
          wasUpscaled: wasUpscaled,
          totalTime: totalTime,
          expectedBehavior: expectedBehavior,
          actualBehavior: actualBehavior,
          behaviorCorrect: behaviorCorrect,
          s3Key: result.s3Key,
          url: result.metadata?.url,
          contentHash: result.metadata?.contentHash || null,
          validationResult: this.upscalingService.lastValidation
        });

        // Brief pause between operations
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`💥 Operation ${i} failed:`, error.message);
        results.push({
          operation: i,
          success: false,
          error: error.message,
          behaviorCorrect: false
        });
      }
    }

    // Comprehensive analysis
    console.log('\n📊 CACHE BEHAVIOR ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const correctBehavior = results.filter(r => r.behaviorCorrect).length;
    const cacheUsageFromSecond = results.slice(1).filter(r => r.wasCached).length;
    const expectedCacheUsage = Math.max(0, results.length - 1);
    
    console.log(`Total Operations: ${count}`);
    console.log(`Successful Operations: ${successful}/${count}`);
    console.log(`Correct Cache Behavior: ${correctBehavior}/${count}`);
    console.log(`Cache Usage (from op 2+): ${cacheUsageFromSecond}/${expectedCacheUsage}`);
    
    // Detailed breakdown
    console.log('\n📋 OPERATION-BY-OPERATION ANALYSIS:');
    results.forEach((result, index) => {
      const op = index + 1;
      const status = result.success ? '✅' : '❌';
      const behavior = result.behaviorCorrect ? '✅' : '❌';
      console.log(`   Op ${op}: ${status} Success | ${behavior} Cache | ${result.actualBehavior}`);
      
      if (!result.behaviorCorrect && result.success) {
        console.log(`      ⚠️ Expected: ${result.expectedBehavior}, Got: ${result.actualBehavior}`);
      }
    });

    // Cache consistency check
    const uniqueContentHashes = [...new Set(results.filter(r => r.contentHash).map(r => r.contentHash))];
    const uniqueUrls = [...new Set(results.filter(r => r.url).map(r => r.url))];
    
    console.log('\n🔍 CACHE CONSISTENCY CHECK:');
    console.log(`   Unique Content Hashes: ${uniqueContentHashes.length} (should be 1)`);
    console.log(`   Unique URLs: ${uniqueUrls.length} (should be 1 for same image)`);
    
    if (uniqueContentHashes.length > 1) {
      console.warn('   ⚠️ Multiple content hashes detected - same image producing different results');
    }
    
    if (uniqueUrls.length > 1) {
      console.warn('   ⚠️ Multiple URLs detected - cache not reusing existing enhanced images');
    }

    // Final assessment
    const cacheWorking = correctBehavior === count && cacheUsageFromSecond === expectedCacheUsage;
    const allSuccessful = successful === count;
    
    console.log(`\n${cacheWorking ? '🎉' : '💥'} CACHE SYSTEM: ${cacheWorking ? 'WORKING CORRECTLY' : 'FAILING'}`);
    console.log(`${allSuccessful ? '🎉' : '💥'} OPERATIONS: ${allSuccessful ? 'ALL SUCCESSFUL' : 'SOME FAILED'}`);

    if (!cacheWorking) {
      console.log('\n❌ CACHE ISSUES DETECTED:');
      if (cacheUsageFromSecond < expectedCacheUsage) {
        console.log(`   • Cache not being used: Only ${cacheUsageFromSecond}/${expectedCacheUsage} subsequent operations used cache`);
      }
      if (uniqueUrls.length > 1) {
        console.log(`   • Multiple URLs for same image: ${uniqueUrls.join(', ')}`);
      }
      if (uniqueContentHashes.length > 1) {
        console.log(`   • Inconsistent content hashing: ${uniqueContentHashes.join(', ')}`);
      }
    }

    return {
      totalOperations: count,
      successful: successful,
      correctCacheBehavior: correctBehavior,
      cacheUsageFromSecond: cacheUsageFromSecond,
      expectedCacheUsage: expectedCacheUsage,
      cacheWorking: cacheWorking,
      allSuccessful: allSuccessful,
      overallSuccess: cacheWorking && allSuccessful,
      results: results,
      uniqueContentHashes: uniqueContentHashes,
      uniqueUrls: uniqueUrls
    };
  }

  /**
   * Check if a specific content hash exists in cache
   */
  async checkCacheStatus(testImage) {
    try {
      const upscalingService = new (require('../services/image-upscaling-service'))();
      const globalCache = new (require('../services/global-image-cache'))();
      
      // Generate content hash
      const contentHash = globalCache.generateImageFingerprint(testImage.buffer);
      
      // Check cache
      const cacheResult = await upscalingService.checkGlobalCacheForUpscaling(testImage.buffer, {});
      
      console.log(`🔍 PRE-OPERATION CACHE CHECK:`);
      console.log(`   Content Hash: ${contentHash}`);
      console.log(`   Cache Status: ${cacheResult.found ? 'EXISTS' : 'NOT FOUND'}`);
      if (cacheResult.found) {
        console.log(`   Cached URL: ${cacheResult.enhancedUrl}`);
        console.log(`   Cached S3 Key: ${cacheResult.s3Key}`);
      }
      
      return {
        contentHash: contentHash,
        cacheExists: cacheResult.found,
        cacheData: cacheResult
      };
    } catch (error) {
      console.warn(`⚠️ Cache check failed: ${error.message}`);
      return {
        contentHash: null,
        cacheExists: false,
        error: error.message
      };
    }
  }

  /**
   * Test cache data integrity - detect corrupted cache records
   */
  async testCacheDataIntegrity() {
    console.log('\n🔍 CACHE DATA INTEGRITY TEST');
    console.log('=' .repeat(80));
    
    try {
      const testImage = await this.findTestImage();
      console.log(`✅ Test image ready: ${testImage.fileName} (${Math.round(testImage.buffer.length/1024)} KB)`);
      
      // First, ensure we have a cache entry by running upscaling
      console.log('\n📋 STEP 1: Creating cache entry');
      console.log('-'.repeat(50));
      
      const result1 = await this.upscalingService.upscaleImage(testImage.buffer, {
        method: 'openai',
        originalImageId: `integrity-test-${Date.now()}`,
        userId: 'integrity-test-user'
      });
      
      console.log('Initial result:', {
        success: result1.success,
        hasEnhancedUrl: !!result1.enhancedUrl,
        hasS3Key: !!result1.s3Key,
        usedCache: result1.usedCache,
        contentHash: result1.contentHash
      });
      
      // Now test cache retrieval integrity
      console.log('\n📋 STEP 2: Testing cache retrieval integrity');
      console.log('-'.repeat(50));
      
      const result2 = await this.upscalingService.upscaleImage(testImage.buffer, {
        method: 'openai',
        contentType: 'illustration'
      });
      
      console.log('Cache retrieval result:', {
        success: result2.success,
        hasEnhancedUrl: !!result2.enhancedUrl,
        hasS3Key: !!result2.s3Key,
        usedCache: result2.usedCache,
        contentHash: result2.contentHash
      });
      
      // Integrity checks
      console.log('\n🔍 INTEGRITY ANALYSIS');
      console.log('-'.repeat(50));
      
      const integrityIssues = [];
      
      // Check for missing critical fields
      if (result2.usedCache && !result2.enhancedUrl) {
        integrityIssues.push('Cache hit missing enhancedUrl');
      }
      
      if (result2.usedCache && !result2.s3Key) {
        integrityIssues.push('Cache hit missing s3Key');
      }
      
      if (result2.usedCache && !result2.contentHash) {
        integrityIssues.push('Cache hit missing contentHash');
      }
      
      // Check for invalid timestamps
      if (result2.metadata && result2.metadata.enhancementData) {
        const data = result2.metadata.enhancementData;
        if (data.createdAt && isNaN(new Date(data.createdAt))) {
          integrityIssues.push('Invalid createdAt timestamp');
        }
      }
      
      if (integrityIssues.length > 0) {
        console.log('❌ CACHE INTEGRITY ISSUES DETECTED:');
        integrityIssues.forEach(issue => console.log(`   - ${issue}`));
        console.log('\n💡 DIAGNOSIS: Cache storage/retrieval corruption');
        console.log('   - Cache records missing critical fields');
        console.log('   - May indicate Global Cache save/load bug');
        
        return {
          integrity: false,
          issues: integrityIssues,
          diagnosis: 'Cache data corruption detected'
        };
      } else {
        console.log('✅ Cache integrity verified');
        return {
          integrity: true,
          issues: [],
          diagnosis: 'Cache data integrity confirmed'
        };
      }
      
    } catch (error) {
      console.error('❌ Cache integrity test failed:', error.message);
      return {
        integrity: false,
        issues: ['Test execution failed'],
        error: error.message
      };
    }
  }
  async testAPIConsistency() {
    console.log('\n🔄 API CONSISTENCY TEST');
    console.log('=' .repeat(80));
    
    try {
      const testImage = await this.findTestImage();
      console.log(`✅ Test image ready: ${testImage.fileName} (${Math.round(testImage.buffer.length/1024)} KB)`);
      
      // Test 1: Call WITHOUT storage parameters (like API caller does)
      console.log('\n📋 TEST 1: No storage parameters (API caller style)');
      console.log('-'.repeat(50));
      
      const result1 = await this.upscalingService.upscaleImage(testImage.buffer, {
        method: 'openai',
        scaleFactor: 2,
        enhanceDetails: true,
        preserveStyle: true,
        contentType: 'illustration'
      });
      
      console.log('Result 1:', {
        success: result1.success,
        hasEnhancedUrl: !!result1.enhancedUrl,
        hasS3Key: !!result1.s3Key,
        hasBuffer: !!result1.upscaledBuffer,
        usedCache: result1.usedCache
      });
      
      // Test 2: Call WITH storage parameters (like runtime test does) 
      console.log('\n📋 TEST 2: With storage parameters (runtime test style)');
      console.log('-'.repeat(50));
      
      const result2 = await this.upscalingService.upscaleImage(testImage.buffer, {
        method: 'openai',
        style: 'digital artwork, high quality',
        quality: 'high',
        originalImageId: `consistency-test-${Date.now()}`,
        userId: 'consistency-test-user'
      });
      
      console.log('Result 2:', {
        success: result2.success,
        hasEnhancedUrl: !!result2.enhancedUrl,
        hasS3Key: !!result2.s3Key,
        hasBuffer: !!result2.upscaledBuffer,
        usedCache: result2.usedCache
      });
      
      // Compare results
      console.log('\n🔍 CONSISTENCY ANALYSIS');
      console.log('-'.repeat(50));
      
      const inconsistencies = [];
      
      if (result1.success !== result2.success) {
        inconsistencies.push('Success status differs');
      }
      
      if (!!result1.enhancedUrl !== !!result2.enhancedUrl) {
        inconsistencies.push('Enhanced URL availability differs');
      }
      
      if (!!result1.s3Key !== !!result2.s3Key) {
        inconsistencies.push('S3 Key availability differs');
      }
      
      if (inconsistencies.length > 0) {
        console.log('❌ INCONSISTENCIES DETECTED:');
        inconsistencies.forEach(issue => console.log(`   - ${issue}`));
        console.log('\n💡 DIAGNOSIS: Service behavior changes based on parameters');
        console.log('   - Without userId/originalImageId: No S3 storage, no enhanced URL');
        console.log('   - With userId/originalImageId: S3 storage enabled, enhanced URL provided');
        console.log('\n🛠️ FIX NEEDED: API callers should get same functionality as tests');
        
        return {
          consistent: false,
          issues: inconsistencies,
          diagnosis: 'Service requires storage parameters for full functionality'
        };
      } else {
        console.log('✅ No inconsistencies detected');
        return {
          consistent: true,
          issues: [],
          diagnosis: 'Service behavior is consistent'
        };
      }
      
    } catch (error) {
      console.error('❌ Consistency test failed:', error.message);
      return {
        consistent: false,
        issues: ['Test execution failed'],
        error: error.message
      };
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new RuntimeValidationTester();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const single = args.includes('--single');
  const multiple = args.includes('--multiple') || !single; // Default to multiple
  const count = multiple ? (parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 3) : 1;

  if (single) {
    tester.testRuntimeValidation()
      .then(result => {
        console.log(`\n🏁 Final Result: ${result.success ? 'TEST PASSED' : 'TEST FAILED'}`);
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
      });
  } else {
    tester.testMultipleOperations(count)
      .then(result => {
        console.log(`\n🏁 Final Result: ${result.overallSuccess ? 'ALL TESTS PASSED' : 'CACHE SYSTEM FAILING'}`);
        
        if (!result.cacheWorking) {
          console.log('\n🚨 CRITICAL: Cache system is not working properly!');
          console.log('   Subsequent operations are re-upscaling instead of using cache.');
          console.log('   This will cause performance issues and duplicate processing.');
        }
        
        process.exit(result.overallSuccess ? 0 : 1);
      })
      .catch(error => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
      });
  }
}

module.exports = RuntimeValidationTester;