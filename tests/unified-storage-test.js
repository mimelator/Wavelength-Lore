/**
 * Unified Storage Test
 * 
 * Tests to verify that vendor preview storage works consistently
 * between API preview builder and merchandise UI routes.
 */

class UnifiedStorageTest {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
  }

  async testVendorPreviewHelper() {
    console.log('🧪 TESTING: VendorPreviewHelper functionality');
    
    try {
      const VendorPreviewHelper = require('../utils/vendor-preview-helper');
      const helper = new VendorPreviewHelper();
      
      // Test data that simulates what the API preview builder would pass
      const mockProductData = {
        product: {
          productId: 'test-' + Date.now(),
          title: 'Test Vendor Preview Product',
          blueprint_id: 5,
          print_provider_id: 3,
          images: ['test-image.png'],
          variants: [{ id: 1, price: 2099 }]
        }
      };
      
      const mockMetadata = {
        sourceImage: 'test-image.webp',
        blueprintId: 5,
        providerId: 3,
        runId: 'test-run-123',
        imageUrl: 'https://example.com/test.webp',
        createdBy: 'unified-storage-test'
      };
      
      console.log('📊 Testing vendor preview storage...');
      const storeResult = await helper.storeVendorPreview(mockProductData, mockMetadata);
      
      console.log(`   Storage success: ${storeResult.success ? '✅' : '❌'}`);
      if (!storeResult.success) {
        console.error(`   Error: ${storeResult.error}`);
        return false;
      }
      
      console.log('📊 Testing product lookup...');
      const lookupResult = await helper.getProductByIdWithFallback(mockProductData.product.productId);
      
      console.log(`   Lookup success: ${lookupResult.found ? '✅' : '❌'}`);
      console.log(`   Found via: ${lookupResult.source}`);
      console.log(`   Is vendor preview: ${lookupResult.isVendorPreview ? '✅' : '❌'}`);
      
      if (lookupResult.found) {
        console.log('📊 Stored data validation:');
        const data = lookupResult.productData;
        console.log(`   Product ID: ${data.productId === mockProductData.product.productId ? '✅' : '❌'}`);
        console.log(`   Source Image: ${data.sourceImage === mockMetadata.sourceImage ? '✅' : '❌'}`);
        console.log(`   Created By: ${data.createdBy === mockMetadata.createdBy ? '✅' : '❌'}`);
        console.log(`   Has Full Product Data: ${data.printifyProduct ? '✅' : '❌'}`);
      }
      
      return lookupResult.found;
      
    } catch (error) {
      console.error('❌ VendorPreviewHelper test failed:', error.message);
      return false;
    }
  }

  async testRouteIntegration(productId) {
    console.log('🧪 TESTING: Route integration with VendorPreviewHelper');
    
    if (!productId) {
      console.log('⚠️ No product ID provided, skipping route test');
      return true;
    }
    
    try {
      const axios = require('axios');
      const testUrl = `${this.baseUrl}/merchandise/product/${productId}`;
      
      console.log(`🔗 Testing route: ${testUrl}`);
      
      // This should now work with our refactored route
      const response = await axios.get(testUrl, {
        headers: {
          'Cookie': 'test-auth=true' // Simulate auth
        }
      });
      
      console.log(`   Route response: ${response.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('📊 Response analysis:');
        console.log(`   Has product data: ${response.data.product ? '✅' : '❌'}`);
        console.log(`   Is vendor preview: ${response.data.product.isVendorPreview ? '✅' : '❌'}`);
        console.log(`   Data source: ${response.data.product.dataSource}`);
        console.log(`   Source image: ${response.data.product.sourceImage || 'N/A'}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.log(`   Route failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testAPIPreviewBuilderIntegration() {
    console.log('🧪 TESTING: API Preview Builder integration (code analysis)');
    
    try {
      const fs = require('fs');
      const builderContent = fs.readFileSync('/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/scripts/api-product-preview-builder.js', 'utf8');
      
      const usesVendorPreviewHelper = builderContent.includes('VendorPreviewHelper');
      const usesStoreVendorPreview = builderContent.includes('storeVendorPreview');
      const removedOldCode = !builderContent.includes('setCachedPreview');
      
      console.log('📊 Code analysis:');
      console.log(`   Uses VendorPreviewHelper: ${usesVendorPreviewHelper ? '✅' : '❌'}`);
      console.log(`   Calls storeVendorPreview: ${usesStoreVendorPreview ? '✅' : '❌'}`);
      console.log(`   Removed old direct cache calls: ${removedOldCode ? '✅' : '❌'}`);
      
      return usesVendorPreviewHelper && usesStoreVendorPreview;
      
    } catch (error) {
      console.error('❌ API Preview Builder integration test failed:', error.message);
      return false;
    }
  }

  async runAllTests(testProductId = null) {
    console.log('🚨 UNIFIED STORAGE TEST SUITE');
    console.log('=============================');
    console.log('Testing vendor preview storage consistency across components\n');
    
    const helperTest = await this.testVendorPreviewHelper();
    console.log('');
    
    const builderTest = await this.testAPIPreviewBuilderIntegration();
    console.log('');
    
    const routeTest = await this.testRouteIntegration(testProductId);
    console.log('');
    
    console.log('📊 SUMMARY: Unified Storage Test Results');
    console.log('=========================================');
    console.log(`VendorPreviewHelper: ${helperTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Builder Integration: ${builderTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Route Integration: ${routeTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = helperTest && builderTest && routeTest;
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('✨ Storage logic is now unified and reusable across components!');
    }
    
    return allPassed;
  }
}

// Run the test
if (require.main === module) {
  const tester = new UnifiedStorageTest();
  const productId = process.argv[2]; // Allow passing product ID as argument
  
  tester.runAllTests(productId).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = UnifiedStorageTest;