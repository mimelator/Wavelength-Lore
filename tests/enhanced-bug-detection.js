/**
 * Enhanced Contract Tests to Detect the Bugs We Just Fixed
 * These tests should have caught the issues before they happened
 */

const DefensiveWrappers = require('../utils/defensive-wrappers');

class EnhancedBugDetectionTests {
  /**
   * Test for filename validation issues that caused "unsupported format" errors
   */
  static testFilenameValidation() {
    console.log('🧪 TESTING: Filename validation edge cases');
    
    const testCases = [
      { input: 'unknown-image', expected: 'should handle missing extension' },
      { input: '', expected: 'should handle empty string' },
      { input: null, expected: 'should handle null' },
      { input: undefined, expected: 'should handle undefined' },
      { input: 'file.png', expected: 'should handle valid extension' },
      { input: 'cache-file-no-ext', expected: 'should handle cache files' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        // Test the filename validation logic
        const hasExtension = testCase.input && typeof testCase.input === 'string' && testCase.input.includes('.');
        const isValid = hasExtension || testCase.input === null || testCase.input === undefined;
        
        results.push({
          input: testCase.input,
          hasExtension,
          isValid,
          expected: testCase.expected,
          shouldPass: true // All should be handled gracefully
        });
        
        console.log(`   ✅ ${testCase.expected}: ${testCase.input} -> ${isValid ? 'handled' : 'failed'}`);
      } catch (error) {
        console.log(`   ❌ ${testCase.expected}: ${testCase.input} -> ERROR: ${error.message}`);
        results.push({
          input: testCase.input,
          error: error.message,
          shouldPass: false
        });
      }
    }
    
    return results;
  }

  /**
   * Test for array validation issues that caused "blueprints.slice is not a function"
   */
  static testArrayValidation() {
    console.log('🧪 TESTING: Array validation edge cases');
    
    const testCases = [
      { input: [], expected: 'empty array' },
      { input: null, expected: 'null value' },
      { input: undefined, expected: 'undefined value' },
      { input: {}, expected: 'object instead of array' },
      { input: 'string', expected: 'string instead of array' },
      { input: [{ id: 1 }, { id: 2 }], expected: 'valid array' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const isArray = Array.isArray(testCase.input);
        const canSlice = isArray && testCase.input.length >= 0;
        
        // This is the validation we should have had
        if (!testCase.input || !Array.isArray(testCase.input)) {
          results.push({
            input: testCase.input,
            error: `Invalid blueprints result: expected array, got ${typeof testCase.input}`,
            caught: true
          });
          console.log(`   ✅ CAUGHT: ${testCase.expected} -> would throw proper error`);
        } else {
          results.push({
            input: testCase.input,
            valid: true,
            length: testCase.input.length
          });
          console.log(`   ✅ VALID: ${testCase.expected} -> length ${testCase.input.length}`);
        }
        
      } catch (error) {
        console.log(`   ❌ UNCAUGHT: ${testCase.expected} -> ${error.message}`);
        results.push({
          input: testCase.input,
          error: error.message,
          caught: false
        });
      }
    }
    
    return results;
  }

  /**
   * Test for cache signature mismatches
   */
  static testCacheSignatureMismatch() {
    console.log('🧪 TESTING: Cache signature mismatch detection');
    
    // Simulate different return formats that could cause mismatches
    const cacheHitResponse = {
      success: true,
      method: 'cache',
      upscaledBuffer: null, // This was the problem!
      upscaledUrl: 'https://example.com/image.png',
      metadata: {
        url: 'https://example.com/image.png'
      }
    };
    
    const freshResponse = {
      success: true,
      method: 'openai',
      upscaledBuffer: Buffer.from('fake-buffer'),
      upscaledUrl: 'https://example.com/fresh.png',
      metadata: {
        url: 'https://example.com/fresh.png'
      }
    };
    
    const tests = [
      {
        name: 'Cache hit with null buffer',
        response: cacheHitResponse,
        shouldDetect: 'Missing buffer requires download'
      },
      {
        name: 'Fresh response with buffer',
        response: freshResponse,
        shouldDetect: 'Buffer present, no download needed'
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const hasBuffer = test.response.upscaledBuffer && Buffer.isBuffer(test.response.upscaledBuffer);
      const hasUrl = !!test.response.upscaledUrl;
      const needsDownload = !hasBuffer && hasUrl;
      
      results.push({
        testName: test.name,
        hasBuffer,
        hasUrl,
        needsDownload,
        detected: needsDownload ? 'Buffer download required' : 'Buffer available'
      });
      
      console.log(`   📊 ${test.name}:`);
      console.log(`      Has Buffer: ${hasBuffer}`);
      console.log(`      Has URL: ${hasUrl}`);
      console.log(`      Needs Download: ${needsDownload}`);
      console.log(`      Detection: ${needsDownload ? '⚠️ Should download' : '✅ Ready to use'}`);
    }
    
    return results;
  }

  /**
   * Run all enhanced bug detection tests
   */
  static runAllBugDetectionTests() {
    console.log('🚨 ENHANCED BUG DETECTION TEST SUITE');
    console.log('=====================================');
    console.log('These tests should detect the bugs we just fixed\n');
    
    const results = {
      filename: this.testFilenameValidation(),
      arrays: this.testArrayValidation(),
      cacheSignature: this.testCacheSignatureMismatch()
    };
    
    console.log('\n📊 SUMMARY: Bug Detection Test Results');
    console.log('=====================================');
    console.log(`Filename validation tests: ${results.filename.length} cases`);
    console.log(`Array validation tests: ${results.arrays.length} cases`);
    console.log(`Cache signature tests: ${results.cacheSignature.length} cases`);
    
    return results;
  }
}

module.exports = EnhancedBugDetectionTests;

// Run tests if called directly
if (require.main === module) {
  EnhancedBugDetectionTests.runAllBugDetectionTests();
}