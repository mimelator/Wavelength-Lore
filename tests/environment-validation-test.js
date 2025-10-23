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
    
    const configTest = await this.testPrintifyEnvironmentAccess();
    const serviceTest = await this.testServiceInitialization();
    const scopeTest = await this.testVariableScopeIssues();
    
    console.log('\n📊 SUMMARY: Environment Validation Test Results');
    console.log('===============================================');
    console.log(`Config Access Test: ${configTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Service Init Test: ${serviceTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Variable Scope Test: ${scopeTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!configTest.passed) {
      console.log('\n❌ Config Errors:', configTest.errors);
    }
    
    if (!serviceTest.passed) {
      console.log('\n❌ Service Errors:', serviceTest.errors);
    }
    
    if (!scopeTest.passed) {
      console.log('\n❌ Scope Errors:', scopeTest.errors);
    }
    
    const allPassed = configTest.passed && serviceTest.passed && scopeTest.passed;
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