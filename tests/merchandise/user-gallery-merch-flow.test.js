/**
 * User Gallery to Merchandise Flow Test
 * 
 * Tests the exact user flow: Gallery → Select Image → Click Merch Overlay
 * Addresses 404 errors during product cleanup
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class UserGalleryMerchFlowTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  async setup() {
    console.log('🚀 Setting up User Gallery to Merch Flow Test');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console errors
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        this.consoleErrors.push(text);
        console.log(`❌ Console Error: ${text}`);
      } else if (text.includes('🧹') || text.includes('🗑️') || text.includes('404')) {
        console.log(`📱 Console: ${text}`);
      }
    });
    
    // Monitor network failures
    this.page.on('response', response => {
      if (response.status() >= 400) {
        const error = `${response.status()} ${response.url()}`;
        this.networkErrors.push(error);
        console.log(`🌐 Network Error: ${error}`);
      }
    });
  }

  async testUserGalleryToMerchFlow() {
    console.log('\n🎯 Test: User Gallery → Select Image → Merch Overlay');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Navigate to user gallery
      console.log('📸 Step 1: Navigating to user gallery...');
      await this.page.goto(`${BASE_URL}/my-gallery`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.gallery-container', { timeout: 10000 });
      
      // Step 2: Select first image
      console.log('🖼️ Step 2: Selecting first gallery image...');
      const firstImage = await this.page.waitForSelector('.gallery-item', { timeout: 5000 });
      await firstImage.click();
      await wait(500);
      
      // Step 3: Click merchandise overlay
      console.log('🛍️ Step 3: Clicking merchandise overlay...');
      const merchOverlay = await this.page.waitForSelector('.merch-overlay, .merchandise-overlay, [data-action="merchandise"]', { timeout: 5000 });
      
      // Record errors before clicking
      const errorsBefore = this.consoleErrors.length;
      const networkErrorsBefore = this.networkErrors.length;
      
      await merchOverlay.click();
      
      // Wait for navigation to merchandise page
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Step 4: Wait for merchandise store to load
      console.log('⏳ Step 4: Waiting for merchandise store to initialize...');
      await this.page.waitForSelector('#merchandise-store', { timeout: 10000 });
      
      // Give time for cleanup to complete
      await wait(3000);
      
      // Step 5: Analyze errors
      const errorsAfter = this.consoleErrors.length;
      const networkErrorsAfter = this.networkErrors.length;
      
      const newConsoleErrors = errorsAfter - errorsBefore;
      const newNetworkErrors = networkErrorsAfter - networkErrorsBefore;
      
      console.log(`\n📊 Error Analysis:`);
      console.log(`   Console errors: ${newConsoleErrors} new (${errorsAfter} total)`);
      console.log(`   Network errors: ${newNetworkErrors} new (${networkErrorsAfter} total)`);
      
      // Check for specific 404 product deletion errors
      const productDeletionErrors = this.networkErrors.filter(error => 
        error.includes('404') && error.includes('/api/merchandise/products/')
      );
      
      if (productDeletionErrors.length > 0) {
        console.log(`\n🚨 Product Deletion 404 Errors Found:`);
        productDeletionErrors.forEach(error => {
          console.log(`   - ${error}`);
        });
        
        // Extract product IDs from errors
        const failedProductIds = productDeletionErrors.map(error => {
          const match = error.match(/\/api\/merchandise\/products\/([a-f0-9]+)/);
          return match ? match[1] : null;
        }).filter(Boolean);
        
        console.log(`\n🔍 Failed Product IDs: ${failedProductIds.join(', ')}`);
        
        return {
          success: false,
          issue: 'product_deletion_404',
          failedProductIds,
          errorCount: productDeletionErrors.length
        };
      }
      
      // Step 6: Verify merchandise store loaded correctly
      const storeLoaded = await this.page.$('#merchandise-store .store-header');
      if (!storeLoaded) {
        return {
          success: false,
          issue: 'store_not_loaded',
          consoleErrors: newConsoleErrors,
          networkErrors: newNetworkErrors
        };
      }
      
      console.log('✅ User flow completed successfully');
      return {
        success: true,
        consoleErrors: newConsoleErrors,
        networkErrors: newNetworkErrors
      };
      
    } catch (error) {
      console.error('❌ User flow test failed:', error);
      return {
        success: false,
        issue: 'test_exception',
        error: error.message
      };
    }
  }

  async testProductCleanupErrorHandling() {
    console.log('\n🎯 Test: Product Cleanup Error Handling');
    console.log('=' .repeat(60));
    
    try {
      // Navigate directly to merchandise store to trigger cleanup
      console.log('🛍️ Navigating to merchandise store...');
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
      
      // Wait for cleanup to complete
      await wait(5000);
      
      // Check for 404 errors during cleanup
      const cleanup404Errors = this.networkErrors.filter(error => 
        error.includes('404') && error.includes('/api/merchandise/products/')
      );
      
      if (cleanup404Errors.length > 0) {
        console.log(`❌ Found ${cleanup404Errors.length} cleanup 404 errors`);
        return {
          success: false,
          cleanup404Errors: cleanup404Errors.length,
          errors: cleanup404Errors
        };
      }
      
      console.log('✅ No cleanup errors found');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Cleanup test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      console.log('🧪 Starting User Gallery to Merchandise Flow Tests');
      console.log('=' .repeat(80));
      
      // Test 1: Full user flow
      const flowResult = await this.testUserGalleryToMerchFlow();
      
      // Test 2: Cleanup error handling
      const cleanupResult = await this.testProductCleanupErrorHandling();
      
      // Generate report
      this.generateReport(flowResult, cleanupResult);
      
      return {
        flowResult,
        cleanupResult,
        overallSuccess: flowResult.success && cleanupResult.success
      };
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateReport(flowResult, cleanupResult) {
    console.log('\n📊 USER GALLERY TO MERCH FLOW TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`🎯 Test Results:`);
    console.log(`   User Flow: ${flowResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Cleanup Handling: ${cleanupResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!flowResult.success) {
      console.log(`\n❌ User Flow Issues:`);
      console.log(`   Issue Type: ${flowResult.issue}`);
      if (flowResult.failedProductIds) {
        console.log(`   Failed Product IDs: ${flowResult.failedProductIds.join(', ')}`);
        console.log(`   404 Errors: ${flowResult.errorCount}`);
      }
    }
    
    if (!cleanupResult.success) {
      console.log(`\n❌ Cleanup Issues:`);
      console.log(`   404 Errors: ${cleanupResult.cleanup404Errors || 0}`);
      if (cleanupResult.errors) {
        cleanupResult.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    }
    
    console.log(`\n📊 Error Summary:`);
    console.log(`   Total Console Errors: ${this.consoleErrors.length}`);
    console.log(`   Total Network Errors: ${this.networkErrors.length}`);
    
    if (this.networkErrors.length > 0) {
      console.log(`\n🌐 Network Errors:`);
      this.networkErrors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (!flowResult.success && flowResult.issue === 'product_deletion_404') {
      console.log(`   - Fix product cleanup to handle 404 errors gracefully`);
      console.log(`   - Add error handling in cleanupBrokenProducts() method`);
      console.log(`   - Consider checking if product exists before deletion`);
    }
    
    if (!cleanupResult.success) {
      console.log(`   - Implement proper error handling for missing products`);
      console.log(`   - Add try-catch around individual product deletions`);
      console.log(`   - Log warnings instead of errors for missing products`);
    }
    
    console.log(`\n🎯 Test completed!`);
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new UserGalleryMerchFlowTest();
  test.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = UserGalleryMerchFlowTest;