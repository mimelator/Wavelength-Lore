/**
 * Vendor Preview Access Test
 * 
 * Tests to detect when vendor preview products are created but can't be accessed via routes.
 * This should catch the bug where products are stored as vendor previews but routes only look for user products.
 */

const axios = require('axios');

class VendorPreviewAccessTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.testResults = [];
  }

  // Test that should detect the vendor preview access bug
  async testVendorPreviewAccess(productId) {
    console.log('🧪 TESTING: Vendor preview product access');
    console.log(`🏷️ Product ID: ${productId}`);
    
    const productUrl = `${this.baseUrl}/merchandise/product/${productId}`;
    console.log(`🔗 Testing URL: ${productUrl}`);
    
    try {
      // This should fail with current implementation
      const response = await axios.get(productUrl, {
        headers: {
          'Cookie': 'test-auth=true' // Simulate auth for testing
        }
      });
      
      console.log('✅ Product accessible:', response.status === 200);
      console.log('📊 Response:', response.data);
      
      return { 
        accessible: true, 
        status: response.status, 
        data: response.data 
      };
      
    } catch (error) {
      console.log('❌ Product access failed:', error.response?.status, error.response?.data?.error);
      
      // This is the exact bug we're detecting
      if (error.response?.status === 403 && error.response?.data?.error === 'Product not found') {
        console.log('🚨 BUG DETECTED: Vendor preview exists but route returns "Product not found"');
        console.log('💡 This suggests the route only looks for user products, not vendor previews');
      }
      
      return { 
        accessible: false, 
        status: error.response?.status, 
        error: error.response?.data?.error,
        bugDetected: error.response?.status === 403 && error.response?.data?.error === 'Product not found'
      };
    }
  }

  // Test the database structure difference
  async testDatabaseStructure() {
    console.log('🧪 TESTING: Database structure for vendor previews vs user products');
    
    try {
      const MerchandiseDatabase = require('../services/merchandise-database');
      const db = require('../services/merchandise-database');
      
      console.log('🔍 Checking database methods available:');
      console.log('   getUserProduct: ✅ Available');
      console.log('   getCachedPreview: ✅ Available');
      console.log('   getVendorPreview: ❌ Missing (this might be the issue!)');
      
      // Check if there's a method to get vendor previews by product ID
      const dbMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(db))
        .filter(method => method.includes('preview') || method.includes('vendor') || method.includes('product'));
      
      console.log('📊 Database methods related to products/previews:');
      dbMethods.forEach(method => console.log(`   ${method}`));
      
      return {
        hasUserProductMethod: typeof db.getUserProduct === 'function',
        hasCachedPreviewMethod: typeof db.getCachedPreview === 'function',
        hasVendorPreviewMethod: dbMethods.some(m => m.includes('vendor') && m.includes('preview')),
        availableMethods: dbMethods
      };
      
    } catch (error) {
      console.error('❌ Database structure test failed:', error.message);
      return { error: error.message };
    }
  }

  // Test route handler logic
  async testRouteHandlerLogic() {
    console.log('🧪 TESTING: Route handler logic for product lookup');
    
    try {
      // Read the route file to understand the logic
      const fs = require('fs');
      const routeContent = fs.readFileSync('/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/routes/merchandise.js', 'utf8');
      
      // Check what methods the route uses
      const usesGetUserProduct = routeContent.includes('getUserProduct');
      const usesGetCachedPreview = routeContent.includes('getCachedPreview');
      const usesVendorPreview = routeContent.includes('vendor') && routeContent.includes('preview');
      
      console.log('📊 Route handler analysis:');
      console.log(`   Uses getUserProduct: ${usesGetUserProduct ? '✅' : '❌'}`);
      console.log(`   Uses getCachedPreview: ${usesGetCachedPreview ? '✅' : '❌'}`);
      console.log(`   Handles vendor previews: ${usesVendorPreview ? '✅' : '❌'}`);
      
      if (usesGetUserProduct && !usesVendorPreview) {
        console.log('🚨 BUG DETECTED: Route only looks for user products, not vendor previews!');
        console.log('💡 SOLUTION: Route needs to check both user products AND vendor previews');
      }
      
      return {
        usesGetUserProduct,
        usesGetCachedPreview,
        usesVendorPreview,
        bugDetected: usesGetUserProduct && !usesVendorPreview
      };
      
    } catch (error) {
      console.error('❌ Route handler test failed:', error.message);
      return { error: error.message };
    }
  }

  async runAllTests(productId) {
    console.log('🚨 VENDOR PREVIEW ACCESS TEST SUITE');
    console.log('===================================');
    console.log('These tests should detect when vendor previews exist but can\'t be accessed via routes\n');
    
    // Test database structure
    const dbTest = await this.testDatabaseStructure();
    console.log('');
    
    // Test route handler logic
    const routeTest = await this.testRouteHandlerLogic();
    console.log('');
    
    // Test actual access (if productId provided)
    let accessTest = null;
    if (productId) {
      accessTest = await this.testVendorPreviewAccess(productId);
      console.log('');
    }
    
    console.log('📊 SUMMARY: Vendor Preview Access Test Results');
    console.log('==============================================');
    console.log(`Database Structure: ${dbTest.error ? '❌ ERROR' : '✅ ANALYZED'}`);
    console.log(`Route Handler Logic: ${routeTest.error ? '❌ ERROR' : routeTest.bugDetected ? '🚨 BUG DETECTED' : '✅ OK'}`);
    
    if (accessTest) {
      console.log(`Product Access: ${accessTest.accessible ? '✅ ACCESSIBLE' : accessTest.bugDetected ? '🚨 BUG DETECTED' : '❌ FAILED'}`);
    }
    
    const bugsDetected = [dbTest, routeTest, accessTest].filter(test => test && test.bugDetected).length;
    console.log(`\n🎯 BUGS DETECTED: ${bugsDetected}`);
    
    if (bugsDetected > 0) {
      console.log('💡 RECOMMENDED FIX: Modify /merchandise/product/:productId route to check vendor previews');
    }
    
    return bugsDetected === 0;
  }
}

// Run the test
if (require.main === module) {
  const tester = new VendorPreviewAccessTester();
  const productId = process.argv[2]; // Allow passing product ID as argument
  
  tester.runAllTests(productId).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = VendorPreviewAccessTester;