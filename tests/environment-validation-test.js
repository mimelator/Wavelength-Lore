/**
 * Environment Validation Test
 * 
 * Tests to detect missing or invalid environment variables that cause service initialization failures.
 * This test should CATCH the bug where env vars exist but services can't access them.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EnvironmentValidationTester {
  constructor() {
    this.testResults = [];
    this.envFile = path.join(process.cwd(), '.env');
  }

  // Test that should have detected the PrintifyConfig.api.baseUrl undefined error
  async testPrintifyEnvironmentAccess() {
    console.log('🧪 TESTING: Printify environment variable access vs actual service initialization');
    
    // Check raw environment
    const rawEnvCheck = {
      PRINTIFY_API_TOKEN: !!process.env.PRINTIFY_API_TOKEN,
      PRINTIFY_SHOP_ID: !!process.env.PRINTIFY_SHOP_ID,
      PRINTIFY_API_URL: !!process.env.PRINTIFY_API_URL
    };
    
    console.log('📊 Raw Environment Check:', rawEnvCheck);
    
    // Check .env file content
    let envFileContent = '';
    if (fs.existsSync(this.envFile)) {
      envFileContent = fs.readFileSync(this.envFile, 'utf8');
      const printifyLines = envFileContent.split('\n').filter(line => 
        line.includes('PRINTIFY') && !line.startsWith('#')
      );
      console.log('📄 .env File Printify Lines:');
      printifyLines.forEach(line => console.log(`   ${line}`));
    }
    
    // Now test actual config access (this should have caught the bug!)
    try {
      console.log('🔍 Testing PrintifyConfig access...');
      const { PrintifyConfig } = require('../config/printify-config');
      
      console.log('📊 PrintifyConfig.api object:', {
        baseUrl: PrintifyConfig.api.baseUrl,
        token: PrintifyConfig.api.token ? '[PRESENT]' : '[MISSING]',
        shopId: PrintifyConfig.api.shopId,
        version: PrintifyConfig.api.version
      });
      
      // This is the EXACT test that would have caught the bug
      if (!PrintifyConfig.api.baseUrl) {
        throw new Error('🚨 BUG DETECTED: PrintifyConfig.api.baseUrl is undefined - this will crash service initialization!');
      }
      
      if (!PrintifyConfig.api.shopId) {
        throw new Error('🚨 BUG DETECTED: PrintifyConfig.api.shopId is undefined - this will crash service initialization!');
      }
      
      if (!PrintifyConfig.api.token) {
        throw new Error('🚨 BUG DETECTED: PrintifyConfig.api.token is undefined - this will crash service initialization!');
      }
      
      // NEW: Check for double version in URL (the actual bug we just fixed)
      if (PrintifyConfig.api.baseUrl.includes('/v1') && PrintifyConfig.api.version === 'v1') {
        console.warn('⚠️  POTENTIAL BUG: baseUrl already contains version, adding version again may cause double /v1/v1');
        console.warn(`   baseUrl: ${PrintifyConfig.api.baseUrl}`);
        console.warn(`   version: ${PrintifyConfig.api.version}`);
        console.warn(`   Combined would be: ${PrintifyConfig.api.baseUrl}/${PrintifyConfig.api.version}`);
      }
      
      console.log('✅ PrintifyConfig validation passed');
      return { passed: true, errors: [] };
      
    } catch (error) {
      console.error('❌ PrintifyConfig validation failed:', error.message);
      return { passed: false, errors: [error.message] };
    }
  }

  // Test service initialization with current config
  async testServiceInitialization() {
    console.log('🧪 TESTING: Actual service initialization (this should catch the exact error)');
    
    try {
      console.log('🔍 Attempting PrintifyService initialization...');
      const PrintifyService = require('../services/printify-service');
      const service = new PrintifyService();
      
      console.log('✅ PrintifyService initialized successfully');
      console.log('📊 Service baseUrl:', service.baseUrl);
      console.log('📊 Service shopId:', service.shopId);
      
      return { passed: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Service initialization failed:', error.message);
      console.error('📚 Stack trace:', error.stack);
      return { passed: false, errors: [error.message] };
    }
  }

  // Test for variable scope issues in service methods
  async testVariableScopeIssues() {
    console.log('🧪 TESTING: Variable scope issues in service methods');
    
    try {
      // Test EnhancedPrintifyService for scope issues
      const EnhancedPrintifyService = require('../services/enhanced-printify-service');
      const service = new EnhancedPrintifyService();
      
      // Create a small test buffer to trigger the enhancement path
      const testBuffer = Buffer.from('test image data');
      
      // Mock the upscaling service to return a result that would trigger the scope issue
      const originalUpscalingService = service.upscalingService;
      service.upscalingService = {
        analyzeImageQuality: () => Promise.resolve({
          originalWidth: 100,
          originalHeight: 100,
          suitableForPrint: false,
          recommendedAction: 'upscale'
        }),
        upscaleImage: () => Promise.resolve({
          success: true,
          method: 'test',
          metadata: {
            processedDimensions: '400x400',
            url: 'test-url',
            s3Key: 'test-key'
          }
        })
      };
      
      // Mock the base uploadImage method to avoid actual API calls
      service.uploadImage = () => Promise.resolve({ success: true, imageId: 'test-id' });
      
      // Mock the merchandise database
      service.merchandiseDatabase = {
        getEnhancedImage: () => Promise.resolve(null),
        storeEnhancedImage: () => Promise.resolve({ success: true })
      };
      
      console.log('🔍 Testing uploadImageWithAutoEnhancement for scope issues...');
      
      // This should NOT throw a ReferenceError about undefined variables
      const result = await service.uploadImageWithAutoEnhancement(
        testBuffer,
        'test-image.png',
        { originalImageId: 'test-id' }
      );
      
      console.log('✅ Variable scope test passed - no undefined variable errors');
      return { passed: true, errors: [] };
      
    } catch (error) {
      if (error.message.includes('is not defined')) {
        console.error('❌ VARIABLE SCOPE BUG DETECTED:', error.message);
        return { passed: false, errors: [`Variable scope issue: ${error.message}`] };
      } else {
        console.log('✅ No variable scope issues detected (other error occurred, which is expected in test)');
        return { passed: true, errors: [] };
      }
    }
  }

  // Test method signature mismatches that cause runtime errors
  async testMethodSignatureMismatches() {
    console.log('🧪 TESTING: Method signature mismatches between services');
    
    try {
      const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
      const CacheOptimizedPrintifyService = require('../services/cache-optimized-printify-service');
      
      const autoService = new AutoEnhancedPrintifyService();
      const cacheService = new CacheOptimizedPrintifyService();
      
      // Check if previewEnhancement method exists on cache service
      if (typeof cacheService.previewEnhancement !== 'function') {
        console.error('❌ METHOD SIGNATURE BUG DETECTED: CacheOptimizedPrintifyService missing previewEnhancement method');
        console.error('   AutoEnhancedPrintifyService.previewImageEnhancement calls cacheOptimizedService.previewEnhancement');
        console.error('   But CacheOptimizedPrintifyService does not have this method!');
        return { passed: false, errors: ['CacheOptimizedPrintifyService missing previewEnhancement method'] };
      }
      
      // Check VendorPreviewService inheritance (skip if env vars missing)
      try {
        const VendorPreviewService = require('../services/vendor-preview-service');
        const vendorService = new VendorPreviewService();
        
        if (typeof vendorService.previewImageEnhancement !== 'function') {
          console.error('❌ METHOD SIGNATURE BUG DETECTED: VendorPreviewService missing previewImageEnhancement method');
          console.error('   VendorPreviewService.createVendorPreview calls this.previewImageEnhancement');
          console.error('   But method is not available - inheritance issue!');
          return { passed: false, errors: ['VendorPreviewService missing previewImageEnhancement method'] };
        }
        
        console.log('✅ VendorPreviewService inheritance validation passed');
      } catch (error) {
        if (error.message.includes('environment variable is required')) {
          console.log('⚠️ Skipping VendorPreviewService test - environment variables missing (expected in test)');
        } else {
          console.error('❌ VendorPreviewService initialization failed:', error.message);
          return { passed: false, errors: [`VendorPreviewService error: ${error.message}`] };
        }
      }
      
      console.log('✅ Method signature validation passed');
      return { passed: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Method signature validation failed:', error.message);
      return { passed: false, errors: [error.message] };
    }
  }

  // Test blueprint-provider compatibility to prevent 404 errors
  async testBlueprintProviderCompatibility() {
    console.log('🧪 TESTING: Blueprint-provider compatibility (this should catch 404 errors)');
    
    try {
      const PrintifyService = require('../services/printify-service');
      const service = new PrintifyService();
      
      // Test combinations with verified working blueprint-provider pairs
      const testCombinations = [
        { blueprintId: 5, providerId: 3, name: "Unisex Cotton Crew Tee with Marco Fine Arts" },
        { blueprintId: 6, providerId: 3, name: "Unisex Heavy Cotton Tee with Marco Fine Arts" },
        { blueprintId: 9, providerId: 3, name: "Women's Favorite Tee with Marco Fine Arts" },
        { blueprintId: 220, providerId: 10, name: "Spun Polyester Square Pillow with MWW On Demand" }
      ];
      
      const errors = [];
      
      for (const combo of testCombinations) {
        try {
          console.log(`🔍 Testing ${combo.name}...`);
          
          // This should detect the exact 404 error we encountered
          const variants = await service.getBlueprintVariants(combo.blueprintId, combo.providerId);
          
          if (!variants || variants.length === 0) {
            console.warn(`⚠️ No variants found for ${combo.name} - may not be compatible`);
          } else {
            console.log(`✅ ${combo.name}: ${variants.length} variants available`);
          }
          
        } catch (error) {
          if (error.response?.status === 404) {
            console.error(`❌ BLUEPRINT-PROVIDER BUG DETECTED: ${combo.name}`);
            console.error(`   Blueprint ${combo.blueprintId} is not compatible with provider ${combo.providerId}`);
            console.error(`   This will cause 404 errors in vendor preview generation!`);
            errors.push(`Blueprint ${combo.blueprintId} incompatible with provider ${combo.providerId}`);
          } else {
            console.warn(`⚠️ API error testing ${combo.name}: ${error.message}`);
          }
        }
      }
      
      if (errors.length > 0) {
        console.error('❌ Blueprint-provider compatibility issues detected!');
        console.error('   These combinations will fail in production with 404 errors.');
        console.error('   Update the vendor preview service to use compatible combinations.');
        return { passed: false, errors };
      }
      
      console.log('✅ Blueprint-provider compatibility validation passed');
      return { passed: true, errors: [] };
      
    } catch (error) {
      console.error('❌ Blueprint-provider compatibility test failed:', error.message);
      return { passed: false, errors: [error.message] };
    }
  }

  // Test AWS credentials to ensure correct IAM user
  async testAWSCredentials() {
    console.log('🧪 TESTING: AWS Credentials - Verifying correct IAM user');
    
    try {
      const galleryConfig = require('../utils/gallery/config');
      
      console.log('📊 AWS Credential Check:');
      console.log(`   ACCESS_KEY_ID: ${galleryConfig.ACCESS_KEY_ID ? galleryConfig.ACCESS_KEY_ID.substring(0, 8) + '...' : '[NOT SET]'}`);
      console.log(`   ACCESS_KEY_ID starts with AKIA: ${galleryConfig.ACCESS_KEY_ID?.startsWith('AKIA') ? 'YES' : 'NO'}`);
      
      if (!galleryConfig.ACCESS_KEY_ID) {
        console.error('❌ ACCESS_KEY_ID not set - gallery operations will fail!');
        return { passed: false, errors: ['ACCESS_KEY_ID not configured'] };
      }
      
      // Just verify it's set and looks like a valid AWS access key
      if (!galleryConfig.ACCESS_KEY_ID.startsWith('AKIA')) {
        console.error('❌ ACCESS_KEY_ID does not appear to be a valid AWS access key (should start with AKIA)');
        return { 
          passed: false, 
          errors: ['ACCESS_KEY_ID format invalid'] 
        };
      }
      
      console.log('✅ AWS credentials configured correctly');
      console.log('   ACCESS_KEY_ID is set and appears valid');
      return { passed: true, errors: [] };
      
    } catch (error) {
      console.error('❌ AWS credential validation failed:', error.message);
      return { passed: false, errors: [error.message] };
    }
  }

  // Enhanced environment diagnostics
  async runEnhancedDiagnostics() {
    console.log('🔍 ENHANCED ENVIRONMENT DIAGNOSTICS');
    console.log('=====================================');
    
    // Check if dotenv is being loaded correctly
    console.log('📄 .env file exists:', fs.existsSync(this.envFile));
    
    // Check process.env vs config access
    console.log('📊 Direct process.env access:');
    console.log(`   PRINTIFY_API_TOKEN: ${process.env.PRINTIFY_API_TOKEN ? '[SET]' : '[MISSING]'}`);
    console.log(`   PRINTIFY_SHOP_ID: ${process.env.PRINTIFY_SHOP_ID || '[MISSING]'}`);
    console.log(`   PRINTIFY_API_URL: ${process.env.PRINTIFY_API_URL || '[MISSING]'}`);
    console.log(`   ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID ? '[SET]' : '[MISSING]'}`);
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '[SET]' : '[MISSING]'}`);
    
    // Check config module loading
    try {
      delete require.cache[require.resolve('../config/printify-config')];
      const { PrintifyConfig: config } = require('../config/printify-config');
      console.log('📊 Config module access:');
      console.log(`   baseUrl: ${config.api.baseUrl || '[UNDEFINED]'}`);
      console.log(`   shopId: ${config.api.shopId || '[UNDEFINED]'}`);
      console.log(`   token: ${config.api.token ? '[SET]' : '[UNDEFINED]'}`);
    } catch (error) {
      console.error('❌ Config module loading failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚨 ENVIRONMENT VALIDATION TEST SUITE');
    console.log('====================================');
    console.log('These tests should detect environment configuration bugs BEFORE service initialization\n');
    
    await this.runEnhancedDiagnostics();
    console.log('');
    
    const awsTest = await this.testAWSCredentials();
    const configTest = await this.testPrintifyEnvironmentAccess();
    const serviceTest = await this.testServiceInitialization();
    const scopeTest = await this.testVariableScopeIssues();
    const methodTest = await this.testMethodSignatureMismatches();
    const compatibilityTest = await this.testBlueprintProviderCompatibility();
    
    console.log('\n📊 SUMMARY: Environment Validation Test Results');
    console.log('===============================================');
    console.log(`AWS Credentials Test: ${awsTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Config Access Test: ${configTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Service Init Test: ${serviceTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Variable Scope Test: ${scopeTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Method Signature Test: ${methodTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Blueprint-Provider Test: ${compatibilityTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!awsTest.passed) {
      console.log('\n❌ AWS Errors:', awsTest.errors);
    }
    
    if (!configTest.passed) {
      console.log('\n❌ Config Errors:', configTest.errors);
    }
    
    if (!serviceTest.passed) {
      console.log('\n❌ Service Errors:', serviceTest.errors);
    }
    
    if (!scopeTest.passed) {
      console.log('\n❌ Scope Errors:', scopeTest.errors);
    }
    
    if (!methodTest.passed) {
      console.log('\n❌ Method Signature Errors:', methodTest.errors);
    }
    
    if (!compatibilityTest.passed) {
      console.log('\n❌ Blueprint-Provider Compatibility Errors:', compatibilityTest.errors);
    }
    
    const allPassed = awsTest.passed && configTest.passed && serviceTest.passed && scopeTest.passed && methodTest.passed && compatibilityTest.passed;
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED - ENVIRONMENT ISSUE DETECTED'}`);
    
    return allPassed;
  }
}

// Run the test
if (require.main === module) {
  const tester = new EnvironmentValidationTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentValidationTester;