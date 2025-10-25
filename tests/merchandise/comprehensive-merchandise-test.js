/**
 * Comprehensive Merchandise Test Suite
 * 
 * Runs all merchandise-related tests including:
 * - Upscaling progress dialog issues
 * - Product persistence and auto-removal
 * - End-to-end merchandise workflows
 */

const UpscalingProgressDialogTest = require('./upscaling-progress-dialog-test');
const ProductPersistenceTest = require('./product-persistence-test');

class ComprehensiveMerchandiseTest {
  constructor() {
    this.results = {
      upscalingTest: null,
      persistenceTest: null,
      overallSuccess: false
    };
  }

  async runUpscalingTests() {
    console.log('🎨 Running Upscaling Progress Dialog Tests...');
    console.log('=' .repeat(80));
    
    try {
      const upscalingTest = new UpscalingProgressDialogTest();
      await upscalingTest.runAllTests();
      
      this.results.upscalingTest = {
        success: true,
        progressUpdates: upscalingTest.progressUpdates.length,
        dialogStates: upscalingTest.dialogStates.length,
        networkRequests: upscalingTest.networkRequests.length,
        issues: this.analyzeUpscalingIssues(upscalingTest)
      };
      
      console.log('✅ Upscaling tests completed successfully');
      
    } catch (error) {
      console.error('❌ Upscaling tests failed:', error);
      this.results.upscalingTest = {
        success: false,
        error: error.message,
        issues: ['Test execution failed']
      };
    }
  }

  async runPersistenceTests() {
    console.log('\n📦 Running Product Persistence Tests...');
    console.log('=' .repeat(80));
    
    try {
      const persistenceTest = new ProductPersistenceTest();
      await persistenceTest.runAllTests();
      
      this.results.persistenceTest = {
        success: true,
        productStates: persistenceTest.productStates.length,
        testProducts: persistenceTest.testProducts.length,
        issues: this.analyzePersistenceIssues(persistenceTest)
      };
      
      console.log('✅ Persistence tests completed successfully');
      
    } catch (error) {
      console.error('❌ Persistence tests failed:', error);
      this.results.persistenceTest = {
        success: false,
        error: error.message,
        issues: ['Test execution failed']
      };
    }
  }

  analyzeUpscalingIssues(upscalingTest) {
    const issues = [];
    
    if (upscalingTest.progressUpdates.length === 0) {
      issues.push('No progress updates captured - progress dialog not working');
    }
    
    const pendingRequests = upscalingTest.networkRequests.filter(r => r.status === 'pending');
    if (pendingRequests.length > 0) {
      issues.push(`${pendingRequests.length} requests still pending - possible page hang`);
    }
    
    const failedRequests = upscalingTest.networkRequests.filter(r => r.status >= 400);
    if (failedRequests.length > 0) {
      issues.push(`${failedRequests.length} failed network requests`);
    }
    
    const modalNeverAppeared = upscalingTest.dialogStates.filter(s => s.modalVisible).length === 0;
    if (modalNeverAppeared) {
      issues.push('Loading modal never appeared during operations');
    }
    
    return issues;
  }

  analyzePersistenceIssues(persistenceTest) {
    const issues = [];
    
    const removedProducts = persistenceTest.productStates.filter(s => s.removed > 0);
    if (removedProducts.length > 0) {
      issues.push(`Products were auto-removed: ${removedProducts.map(s => s.removed).reduce((a, b) => a + b, 0)} total`);
    }
    
    if (persistenceTest.testProducts.length === 0) {
      issues.push('No test products were successfully created');
    }
    
    return issues;
  }

  async runComprehensiveTests() {
    console.log('🧪 COMPREHENSIVE MERCHANDISE TEST SUITE');
    console.log('=' .repeat(80));
    console.log('Testing upscaling progress dialogs and product persistence');
    console.log('Addresses issues: Progress dialog hangs, Product auto-removal');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();
    
    try {
      // Run upscaling tests
      await this.runUpscalingTests();
      
      // Run persistence tests
      await this.runPersistenceTests();
      
      // Determine overall success
      this.results.overallSuccess = 
        this.results.upscalingTest?.success && 
        this.results.persistenceTest?.success;
      
      const duration = Date.now() - startTime;
      
      // Generate comprehensive report
      this.generateComprehensiveReport(duration);
      
    } catch (error) {
      console.error('❌ Comprehensive test suite failed:', error);
      this.results.overallSuccess = false;
      throw error;
    }
  }

  generateComprehensiveReport(duration) {
    console.log('\n📊 COMPREHENSIVE MERCHANDISE TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`⏱️ Total Test Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🎯 Overall Result: ${this.results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    // Upscaling Test Results
    console.log('\n🎨 UPSCALING PROGRESS DIALOG TESTS:');
    if (this.results.upscalingTest) {
      console.log(`   Status: ${this.results.upscalingTest.success ? '✅ PASS' : '❌ FAIL'}`);
      if (this.results.upscalingTest.success) {
        console.log(`   Progress Updates: ${this.results.upscalingTest.progressUpdates}`);
        console.log(`   Dialog State Changes: ${this.results.upscalingTest.dialogStates}`);
        console.log(`   Network Requests: ${this.results.upscalingTest.networkRequests}`);
      }
      if (this.results.upscalingTest.issues.length > 0) {
        console.log(`   Issues Found:`);
        this.results.upscalingTest.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    } else {
      console.log('   Status: ❌ NOT RUN');
    }
    
    // Persistence Test Results
    console.log('\n📦 PRODUCT PERSISTENCE TESTS:');
    if (this.results.persistenceTest) {
      console.log(`   Status: ${this.results.persistenceTest.success ? '✅ PASS' : '❌ FAIL'}`);
      if (this.results.persistenceTest.success) {
        console.log(`   Product State Changes: ${this.results.persistenceTest.productStates}`);
        console.log(`   Test Products Created: ${this.results.persistenceTest.testProducts}`);
      }
      if (this.results.persistenceTest.issues.length > 0) {
        console.log(`   Issues Found:`);
        this.results.persistenceTest.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    } else {
      console.log('   Status: ❌ NOT RUN');
    }
    
    // Combined Issues Analysis
    const allIssues = [
      ...(this.results.upscalingTest?.issues || []),
      ...(this.results.persistenceTest?.issues || [])
    ];
    
    if (allIssues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES IDENTIFIED:');
      allIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No critical issues identified');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    // Progress dialog recommendations
    if (this.results.upscalingTest?.issues.some(i => i.includes('progress'))) {
      console.log('   🎨 PROGRESS DIALOG FIXES:');
      console.log('     - Ensure setLoading() is called immediately when operations start');
      console.log('     - Verify loading modal HTML exists and is properly structured');
      console.log('     - Add progress updates at regular intervals during long operations');
      console.log('     - Implement timeout handling to prevent indefinite loading states');
    }
    
    // Product persistence recommendations
    if (this.results.persistenceTest?.issues.some(i => i.includes('auto-removed'))) {
      console.log('   📦 PRODUCT PERSISTENCE FIXES:');
      console.log('     - Review auto-cleanup logic - may be too aggressive');
      console.log('     - Add grace period for products being processed');
      console.log('     - Improve product validation criteria');
      console.log('     - Add timestamps to track product age accurately');
    }
    
    // Network request recommendations
    if (this.results.upscalingTest?.issues.some(i => i.includes('pending'))) {
      console.log('   🌐 NETWORK REQUEST FIXES:');
      console.log('     - Add proper timeout handling to all API calls');
      console.log('     - Implement retry logic for failed requests');
      console.log('     - Add error handling to prevent page hangs');
      console.log('     - Monitor and log request/response cycles');
    }
    
    console.log('\n🎯 Test suite completed!');
    console.log(`📋 Full results available in test objects for detailed analysis`);
  }

  // Static method to run all tests
  static async runAll() {
    const suite = new ComprehensiveMerchandiseTest();
    await suite.runComprehensiveTests();
    return suite.results;
  }
}

// Run the comprehensive test suite if called directly
if (require.main === module) {
  ComprehensiveMerchandiseTest.runAll().catch(error => {
    console.error('❌ Comprehensive test suite execution failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveMerchandiseTest;