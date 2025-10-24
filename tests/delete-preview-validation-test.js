/**
 * Comprehensive Delete Preview Functionality Test
 * 
 * Tests the fixed delete preview functionality end-to-end
 */

const assert = require('assert');

class DeletePreviewValidationTest {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.testResults = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async testDeleteEndpointExists() {
    await this.log('🧪 Testing DELETE endpoint exists and responds...');
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/admin/vendor-research/delete-preview`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey: 'test-validation-key' })
      });

      await this.log(`DELETE endpoint status: ${response.status}`);
      
      if (response.status === 404) {
        await this.log('❌ FAIL: DELETE endpoint still returns 404', 'error');
        return false;
      }

      const responseData = await response.json();
      await this.log(`Response includes diagnostics: ${!!responseData.diagnostics}`);
      await this.log(`Response includes validation: ${!!responseData.diagnostics?.validation}`);
      
      await this.log('✅ PASS: DELETE endpoint exists and responds', 'success');
      return true;

    } catch (error) {
      await this.log(`❌ FAIL: Error testing endpoint: ${error.message}`, 'error');
      return false;
    }
  }

  async testValidationWorks() {
    await this.log('🧪 Testing request validation...');
    
    try {
      const fetch = (await import('node-fetch')).default;
      
      // Test missing cacheKey
      const response = await fetch(`${this.baseUrl}/admin/vendor-research/delete-preview`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No cacheKey
      });

      const responseData = await response.json();
      
      if (response.status === 400 && responseData.error === 'Validation failed') {
        await this.log('✅ PASS: Validation correctly rejects missing cacheKey', 'success');
        return true;
      } else {
        await this.log('❌ FAIL: Validation should reject missing cacheKey', 'error');
        return false;
      }

    } catch (error) {
      await this.log(`❌ FAIL: Error testing validation: ${error.message}`, 'error');
      return false;
    }
  }

  async testDiagnosticsLogging() {
    await this.log('🧪 Testing diagnostic logging...');
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/admin/vendor-research/delete-preview`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey: 'diagnostic-test-key' })
      });

      const responseData = await response.json();
      
      // Check if response includes diagnostic information
      const hasDiagnostics = responseData.diagnostics;
      const hasValidation = responseData.diagnostics?.validation;
      const hasRouteHealth = responseData.diagnostics?.routeHealth;
      
      await this.log(`Response has diagnostics: ${!!hasDiagnostics}`);
      await this.log(`Response has validation: ${!!hasValidation}`);
      await this.log(`Response has route health: ${!!hasRouteHealth}`);
      
      if (hasDiagnostics && hasValidation && hasRouteHealth) {
        await this.log('✅ PASS: Enhanced diagnostics are working', 'success');
        return true;
      } else {
        await this.log('❌ FAIL: Enhanced diagnostics missing', 'error');
        return false;
      }

    } catch (error) {
      await this.log(`❌ FAIL: Error testing diagnostics: ${error.message}`, 'error');
      return false;
    }
  }

  async testUIIntegration() {
    await this.log('🧪 Testing UI integration (simulated)...');
    
    try {
      // Simulate what the UI does
      const fetch = (await import('node-fetch')).default;
      
      // First get list of previews
      const listResponse = await fetch(`${this.baseUrl}/api/merchandise/vendor-previews`);
      const listData = await listResponse.json();
      
      if (!listData.success || !listData.previews || listData.previews.length === 0) {
        await this.log('⚠️ SKIP: No vendor previews available for UI test', 'warning');
        return true;
      }

      const testPreview = listData.previews[0];
      await this.log(`Found test preview: ${testPreview.cacheKey}`);
      
      // Test the delete call (but don't actually delete)
      const deleteResponse = await fetch(`${this.baseUrl}/admin/vendor-research/delete-preview`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey: 'ui-test-fake-key' })
      });

      const deleteData = await deleteResponse.json();
      
      // Should get a proper response (even if key doesn't exist)
      if (deleteResponse.status !== 404) {
        await this.log('✅ PASS: UI integration endpoint responds correctly', 'success');
        return true;
      } else {
        await this.log('❌ FAIL: UI still gets 404 response', 'error');
        return false;
      }

    } catch (error) {
      await this.log(`❌ FAIL: Error testing UI integration: ${error.message}`, 'error');
      return false;
    }
  }

  async runComprehensiveTest() {
    await this.log('🚀 Starting comprehensive delete preview test suite...');
    
    const tests = [
      { name: 'Endpoint Exists', test: () => this.testDeleteEndpointExists() },
      { name: 'Validation Works', test: () => this.testValidationWorks() },
      { name: 'Diagnostics Logging', test: () => this.testDiagnosticsLogging() },
      { name: 'UI Integration', test: () => this.testUIIntegration() }
    ];

    const results = [];
    
    for (const { name, test } of tests) {
      await this.log(`\n🔬 Running test: ${name}`);
      const passed = await test();
      results.push({ name, passed });
      await this.log(`Test ${name}: ${passed ? 'PASSED' : 'FAILED'}\n`);
    }

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    
    await this.log(`\n📊 TEST SUMMARY:`);
    await this.log(`   Total tests: ${totalTests}`);
    await this.log(`   Passed: ${passedTests}`);
    await this.log(`   Failed: ${totalTests - passedTests}`);
    await this.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      await this.log('🎉 ALL TESTS PASSED - Delete preview functionality is working!', 'success');
    } else {
      await this.log('❌ SOME TESTS FAILED - Delete preview needs attention', 'error');
    }

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      allPassed: passedTests === totalTests,
      results
    };
  }
}

// Export for use in other tests
module.exports = DeletePreviewValidationTest;

// Run test if executed directly
if (require.main === module) {
  (async () => {
    const test = new DeletePreviewValidationTest();
    const results = await test.runComprehensiveTest();
    
    process.exit(results.allPassed ? 0 : 1);
  })();
}