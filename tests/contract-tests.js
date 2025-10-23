/**
 * Contract Testing Utilities
 * Prevents signature mismatches through automated contract validation
 */

const TypeContracts = require('../utils/type-contracts');
const DefensiveWrappers = require('../utils/defensive-wrappers');

class ContractTests {
  /**
   * Test service method contract compliance
   */
  static async testServiceContract(service, methodName, testCases) {
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`🧪 Testing ${service.constructor.name}.${methodName} with:`, testCase.name);
        
        const result = await service[methodName](...testCase.inputs);
        
        // Validate result matches expected contract
        const contractValidation = TypeContracts.validateImageProcessingResult(result, testCase.name);
        
        results.push({
          testCase: testCase.name,
          success: contractValidation.valid,
          errors: contractValidation.errors,
          result
        });
        
        if (contractValidation.valid) {
          console.log(`✅ Contract test passed: ${testCase.name}`);
        } else {
          console.error(`❌ Contract test failed: ${testCase.name}`, contractValidation.errors);
        }
        
      } catch (error) {
        console.error(`🚨 Contract test error: ${testCase.name}`, error.message);
        results.push({
          testCase: testCase.name,
          success: false,
          errors: [error.message],
          result: null
        });
      }
    }
    
    return results;
  }

  /**
   * Test that cache hits and misses return identical signatures
   */
  static async testCacheSignatureConsistency(upscalingService, imageBuffer, options = {}) {
    console.log('🧪 CACHE SIGNATURE CONSISTENCY TEST');
    console.log('=====================================');
    
    const results = {
      cacheMiss: null,
      cacheHit: null,
      signatureMatch: false,
      errors: []
    };
    
    try {
      // Test 1: Fresh generation (cache miss)
      console.log('📝 Test 1: Cache miss scenario');
      const freshResult = await upscalingService.upscaleImage(imageBuffer, {
        ...options,
        bypassCache: true // Force cache miss
      });
      
      results.cacheMiss = {
        success: freshResult.success,
        method: freshResult.method,
        hasBuffer: !!freshResult.upscaledBuffer,
        hasUrl: !!freshResult.upscaledUrl,
        metadata: Object.keys(freshResult.metadata || {})
      };
      
      // Test 2: Cache hit (run same operation again)
      console.log('📝 Test 2: Cache hit scenario');
      const cachedResult = await upscalingService.upscaleImage(imageBuffer, options);
      
      results.cacheHit = {
        success: cachedResult.success,
        method: cachedResult.method,
        hasBuffer: !!cachedResult.upscaledBuffer,
        hasUrl: !!cachedResult.upscaledUrl,
        metadata: Object.keys(cachedResult.metadata || {})
      };
      
      // Test 3: Compare signatures
      console.log('📝 Test 3: Signature comparison');
      const signatureErrors = [];
      
      if (results.cacheMiss.success !== results.cacheHit.success) {
        signatureErrors.push('success property mismatch');
      }
      
      // Both should have either buffer OR url, but structure should be consistent
      const missHasData = results.cacheMiss.hasBuffer || results.cacheMiss.hasUrl;
      const hitHasData = results.cacheHit.hasBuffer || results.cacheHit.hasUrl;
      
      if (missHasData !== hitHasData) {
        signatureErrors.push('data availability mismatch');
      }
      
      if (signatureErrors.length === 0) {
        results.signatureMatch = true;
        console.log('✅ Cache signature consistency test PASSED');
      } else {
        results.errors = signatureErrors;
        console.error('❌ Cache signature consistency test FAILED:', signatureErrors);
      }
      
    } catch (error) {
      results.errors.push(`Test execution error: ${error.message}`);
      console.error('🚨 Cache consistency test error:', error.message);
    }
    
    return results;
  }

  /**
   * Test defensive wrapper error handling
   */
  static testDefensiveWrappers() {
    console.log('🧪 DEFENSIVE WRAPPER TESTS');
    console.log('============================');
    
    const tests = [
      {
        name: 'safeSplit with null value',
        test: () => DefensiveWrappers.safeSplit(null, 'x', 'test'),
        expected: []
      },
      {
        name: 'safeSplit with undefined value',
        test: () => DefensiveWrappers.safeSplit(undefined, 'x', 'test'),
        expected: []
      },
      {
        name: 'safeSplit with non-string value',
        test: () => DefensiveWrappers.safeSplit(123, 'x', 'test'),
        expected: []
      },
      {
        name: 'safeParseDimensions with invalid input',
        test: () => DefensiveWrappers.safeParseDimensions(null, 'test'),
        expected: { width: 1024, height: 1024, string: '1024x1024' }
      },
      {
        name: 'safeValidateBuffer with null',
        test: () => DefensiveWrappers.safeValidateBuffer(null, 'test'),
        expected: { valid: false, error: 'Buffer is null/undefined' }
      }
    ];
    
    const results = tests.map(test => {
      try {
        const result = test.test();
        const passed = JSON.stringify(result) === JSON.stringify(test.expected);
        
        if (passed) {
          console.log(`✅ ${test.name}: PASSED`);
        } else {
          console.log(`❌ ${test.name}: FAILED`);
          console.log(`   Expected:`, test.expected);
          console.log(`   Got:`, result);
        }
        
        return { name: test.name, passed, result };
      } catch (error) {
        console.log(`🚨 ${test.name}: ERROR -`, error.message);
        return { name: test.name, passed: false, error: error.message };
      }
    });
    
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n📊 Defensive wrapper tests: ${passedCount}/${results.length} passed`);
    
    return results;
  }
}

module.exports = ContractTests;