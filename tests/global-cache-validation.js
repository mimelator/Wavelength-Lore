/**
 * Global Cache Firebase Validation Test
 * 
 * This test validates that:
 * 1. Images are properly upscaled
 * 2. Records are written to Firebase Global Cache
 * 3. Records can be retrieved from Firebase
 * 4. Cache prevents duplicate processing
 */

const ImageUpscalingService = require('../services/image-upscaling-service');
const GlobalImageCache = require('../services/global-image-cache');
const fs = require('fs').promises;
const path = require('path');

class GlobalCacheValidator {
  constructor() {
    this.upscalingService = new ImageUpscalingService();
    this.globalCache = new GlobalImageCache();
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    
    this.testResults.tests.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
   * Load test image from gallery API
   */
  async loadTestImage() {
    try {
      console.log('📡 Fetching real image from gallery API...');
      
      // Use the same method as other working tests - get images from gallery API
      const axios = require('axios');
      const galleryResponse = await axios.get('http://localhost:3001/api/gallery/user/images');
      
      if (!galleryResponse.data || !Array.isArray(galleryResponse.data) || galleryResponse.data.length === 0) {
        throw new Error('No images available in gallery API');
      }
      
      // Get the first available image
      const imageData = galleryResponse.data[0];
      const imageUrl = imageData.url;
      
      console.log(`📡 Downloading image from: ${imageUrl}`);
      
      // Download the image buffer
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data);
      
      // Extract filename from URL or use a default
      const fileName = imageData.title ? `${imageData.title.replace(/[^a-zA-Z0-9]/g, '-')}.webp` : 'gallery-image.webp';
      
      console.log(`📁 Using gallery image: ${fileName} (${buffer.length} bytes)`);
      return { buffer, fileName, path: imageUrl };
      
    } catch (error) {
      console.error('Failed to load test image from gallery API:', error.message);
      throw new Error(`No test image available from gallery API: ${error.message}`);
    }
  }

  /**
   * Test 1: Basic upscaling and Firebase storage
   */
  async testBasicUpscalingAndStorage() {
    console.log('\n🧪 TEST 1: Basic Upscaling and Firebase Storage');
    console.log('=' .repeat(60));
    
    try {
      // Load test image
      const testImage = await this.loadTestImage();
      
      // Generate content hash for tracking
      const contentHash = this.globalCache.generateImageFingerprint(testImage.buffer);
      console.log(`🔑 Test image content hash: ${contentHash}`);
      
      // Clear any existing cache entry for this test
      console.log('🧹 Clearing any existing cache entry...');
      await this.clearCacheEntry(contentHash);
      
      // Perform upscaling
      console.log('🚀 Starting upscaling process...');
      const upscaleResult = await this.upscalingService.upscaleImage(
        testImage.buffer,
        'test-user-123',
        'test-image-id-' + Date.now(),
        {
          method: 'openai',
          style: 'digital artwork',
          quality: 'high'
        }
      );
      
      // Validate upscaling result
      if (!upscaleResult.success) {
        this.addTestResult('Basic Upscaling', false, `Upscaling failed: ${upscaleResult.error}`);
        return false;
      }
      
      this.addTestResult('Basic Upscaling', true, 'Image upscaled successfully');
      
      // Wait a moment for Firebase writes to complete
      console.log('⏳ Waiting for Firebase writes to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify Firebase record exists
      console.log('🔍 Verifying Firebase record...');
      const cachedRecord = await this.globalCache.getGlobalEnhancedImage(contentHash);
      
      if (!cachedRecord) {
        this.addTestResult('Firebase Storage', false, 'No record found in Firebase after upscaling');
        return false;
      }
      
      this.addTestResult('Firebase Storage', true, `Record found with S3 key: ${cachedRecord.s3Key}`);
      
      // Validate record structure
      const requiredFields = ['contentHash', 'enhancedImageUrl', 's3Key', 'enhancementMethod', 'createdAt'];
      const missingFields = requiredFields.filter(field => !cachedRecord[field]);
      
      if (missingFields.length > 0) {
        this.addTestResult('Record Structure', false, `Missing fields: ${missingFields.join(', ')}`);
        return false;
      }
      
      this.addTestResult('Record Structure', true, 'All required fields present');
      
      console.log('📋 Firebase Record Details:');
      console.log(JSON.stringify(cachedRecord, null, 2));
      
      return true;
      
    } catch (error) {
      this.addTestResult('Basic Upscaling and Storage', false, `Exception: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 2: Cache hit prevention (duplicate processing)
   */
  async testCacheHitPrevention() {
    console.log('\n🧪 TEST 2: Cache Hit Prevention');
    console.log('=' .repeat(60));
    
    try {
      // Load test image
      const testImage = await this.loadTestImage();
      const contentHash = this.globalCache.generateImageFingerprint(testImage.buffer);
      
      // First, ensure we have a cached version
      console.log('🏪 Ensuring cached version exists...');
      const existingRecord = await this.globalCache.getGlobalEnhancedImage(contentHash);
      
      if (!existingRecord) {
        // Run basic test first to create cache entry
        const basicTestPassed = await this.testBasicUpscalingAndStorage();
        if (!basicTestPassed) {
          this.addTestResult('Cache Hit Setup', false, 'Could not create initial cache entry');
          return false;
        }
      }
      
      // Now test that cache prevents reprocessing
      console.log('🔄 Testing cache hit behavior...');
      
      // Check cache first (this should be a hit)
      const cacheCheckResult = await this.upscalingService.checkGlobalCacheForUpscaling(testImage.buffer);
      
      if (!cacheCheckResult.exists) {
        this.addTestResult('Cache Hit Detection', false, 'Cache check failed to find existing enhancement');
        return false;
      }
      
      this.addTestResult('Cache Hit Detection', true, 'Cache correctly detected existing enhancement');
      
      // Verify the cached data is usable
      if (!cacheCheckResult.enhancementData.enhancedImageUrl) {
        this.addTestResult('Cached Data Quality', false, 'Cached data missing enhancedImageUrl');
        return false;
      }
      
      this.addTestResult('Cached Data Quality', true, 'Cached data contains required fields');
      
      return true;
      
    } catch (error) {
      this.addTestResult('Cache Hit Prevention', false, `Exception: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 3: Firebase connection and permissions
   */
  async testFirebaseConnection() {
    console.log('\n🧪 TEST 3: Firebase Connection and Permissions');
    console.log('=' .repeat(60));
    
    try {
      // Test database initialization
      this.globalCache.initializeDatabase();
      
      if (!this.globalCache.initialized) {
        this.addTestResult('Firebase Initialization', false, 'Failed to initialize Firebase database');
        return false;
      }
      
      this.addTestResult('Firebase Initialization', true, 'Firebase database initialized successfully');
      
      // Test cache statistics read
      console.log('📊 Testing cache statistics access...');
      const stats = await this.globalCache.getCacheStatistics();
      
      if (stats.error) {
        this.addTestResult('Firebase Read Access', false, `Failed to read cache stats: ${stats.error}`);
        return false;
      }
      
      this.addTestResult('Firebase Read Access', true, `Cache stats retrieved: ${stats.totalRequests} total requests`);
      
      // Test write access with a simple stats update
      console.log('✍️  Testing Firebase write access...');
      await this.globalCache.updateCacheStats('test_validation_runs', 1);
      
      this.addTestResult('Firebase Write Access', true, 'Successfully updated cache statistics');
      
      return true;
      
    } catch (error) {
      this.addTestResult('Firebase Connection', false, `Exception: ${error.message}`);
      return false;
    }
  }

  /**
   * Clear cache entry for testing
   */
  async clearCacheEntry(contentHash) {
    try {
      this.globalCache.initializeDatabase();
      await this.globalCache.globalCacheRef.child(contentHash).remove();
      console.log(`🗑️  Cleared cache entry for: ${contentHash}`);
    } catch (error) {
      console.warn(`⚠️  Could not clear cache entry: ${error.message}`);
    }
  }

  /**
   * Run all validation tests
   */
  async runAllTests() {
    console.log('🚀 GLOBAL CACHE FIREBASE VALIDATION TESTS');
    console.log('=' .repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    
    const startTime = Date.now();
    
    try {
      // Test 1: Firebase connection and permissions
      await this.testFirebaseConnection();
      
      // Test 2: Basic upscaling and storage
      await this.testBasicUpscalingAndStorage();
      
      // Test 3: Cache hit prevention
      await this.testCacheHitPrevention();
      
    } catch (error) {
      console.error('💥 Validation test suite failed:', error);
      this.addTestResult('Test Suite Execution', false, `Suite failed: ${error.message}`);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print final results
    console.log('\n📊 VALIDATION TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed} ✅`);
    console.log(`Failed: ${this.testResults.failed} ❌`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.details}`);
        });
    }
    
    const allPassed = this.testResults.failed === 0;
    console.log(`\n${allPassed ? '🎉' : '💥'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return {
      success: allPassed,
      results: this.testResults,
      duration: duration
    };
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const validator = new GlobalCacheValidator();
  
  validator.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = GlobalCacheValidator;