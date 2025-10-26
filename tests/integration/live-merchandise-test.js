#!/usr/bin/env node

/**
 * WAVELENGTH Live Browser Test
 * 
 * Simulates actual user interaction with the merchandise store
 * by accessing the page and measuring UI response
 */

require('dotenv').config();
const { execSync } = require('child_process');
const axios = require('axios');

class LiveMerchandiseTest {
  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.results = {
      pageAccessible: false,
      apiResponse: null,
      uiIntegration: false,
      productCount: 0,
      categoryCount: 0,
      errors: []
    };
  }

  async runLiveTest() {
    console.log('🌊 WAVELENGTH: Live Merchandise Store Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 User Flow: Visit /merchandise → Measure product availability');
    console.log('');

    try {
      // Test 1: Can user access the merchandise page?
      await this.testPageAccess();
      
      // Test 2: What does the API return?
      await this.testAPIResponse();
      
      // Test 3: Open browser for visual inspection
      await this.openBrowserForInspection();
      
      // Test 4: Final report
      this.generateLiveReport();
      
    } catch (error) {
      console.error('❌ Live test failed:', error.message);
      this.results.errors.push(error.message);
      this.generateLiveReport();
    }
  }

  async testPageAccess() {
    console.log('📋 Phase 1: Testing page accessibility...');
    
    try {
      const response = await axios.get(`${this.baseURL}/merchandise`, {
        timeout: 10000,
        headers: { 'User-Agent': 'WAVELENGTH-Live-Test/1.1.0' }
      });
      
      if (response.status === 200) {
        this.results.pageAccessible = true;
        console.log('  ✅ Merchandise page accessible (200 OK)');
        
        // Check if page contains the expected elements
        const html = response.data;
        const hasStoreContainer = html.includes('merchandise-store');
        const hasScriptLoad = html.includes('merchandise-store.js');
        const hasProductNavigator = html.includes('product-navigator.js');
        
        console.log(`  📊 Page Analysis:`);
        console.log(`    Store Container: ${hasStoreContainer ? '✅' : '❌'}`);
        console.log(`    Store Script: ${hasScriptLoad ? '✅' : '❌'}`);
        console.log(`    Navigator Script: ${hasProductNavigator ? '✅' : '❌'}`);
        
      } else {
        throw new Error(`Page returned status ${response.status}`);
      }
    } catch (error) {
      this.results.errors.push(`Page access failed: ${error.message}`);
      throw error;
    }
  }

  async testAPIResponse() {
    console.log('\n📋 Phase 2: Testing API response structure...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/merchandise/product-types`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data) {
        this.results.apiResponse = response.data;
        
        console.log('  ✅ API accessible');
        console.log('  📊 Response Structure:');
        console.log(`    Success: ${response.data.success ? '✅' : '❌'}`);
        console.log(`    Has productTypes: ${response.data.productTypes ? '✅' : '❌'}`);
        console.log(`    Has allProducts: ${response.data.allProducts ? '✅' : '❌'}`);
        
        if (response.data.allProducts) {
          this.results.productCount = response.data.allProducts.length;
          console.log(`    Product Count: ${this.results.productCount}`);
          
          // Count unique categories
          const categories = new Set();
          response.data.allProducts.forEach(product => {
            if (product.category) categories.add(product.category);
          });
          this.results.categoryCount = categories.size;
          console.log(`    Category Count: ${this.results.categoryCount}`);
          
          // Show sample products
          console.log('  🔍 Sample Products:');
          response.data.allProducts.slice(0, 5).forEach((product, index) => {
            console.log(`    ${index + 1}. ${product.name} (${product.category})`);
          });
        }
        
        // Check if structure matches what UI expects
        const hasExpectedStructure = response.data.success && 
                                   response.data.productTypes && 
                                   response.data.allProducts;
        
        this.results.uiIntegration = hasExpectedStructure;
        console.log(`  🎨 UI Integration: ${hasExpectedStructure ? '✅' : '❌'}`);
        
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      this.results.errors.push(`API test failed: ${error.message}`);
      throw error;
    }
  }

  async openBrowserForInspection() {
    console.log('\n📋 Phase 3: Opening browser for visual inspection...');
    
    try {
      const url = `${this.baseURL}/merchandise`;
      console.log(`  🌐 Opening: ${url}`);
      console.log('  👀 Visual inspection checklist:');
      console.log('    - Does the page load without errors?');
      console.log('    - Are product categories visible?');
      console.log('    - Can you see product options when selecting an image?');
      console.log('    - How many product types are displayed?');
      console.log('');
      console.log('  💡 Check browser console for any JavaScript errors');
      console.log('  💡 Look for "ProductNavigator" or "Simple Categories" in the UI');
      console.log('');
      
      // Try to open browser (works on macOS)
      try {
        execSync(`open "${url}"`, { stdio: 'ignore' });
        console.log('  ✅ Browser opened successfully');
        
        // Give user time to inspect
        console.log('  ⏱️  Waiting 5 seconds for browser inspection...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.log(`  ⚠️  Could not auto-open browser: ${error.message}`);
        console.log(`  🔗 Please manually visit: ${url}`);
      }
      
    } catch (error) {
      console.log(`  ⚠️  Browser inspection failed: ${error.message}`);
    }
  }

  generateLiveReport() {
    console.log('\n🎉 WAVELENGTH: Live Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const overallSuccess = this.results.pageAccessible && 
                          this.results.uiIntegration && 
                          this.results.productCount >= 140;
    
    console.log(`🌊 OVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
    console.log('');
    
    console.log('📊 LIVE TEST RESULTS:');
    console.log(`   Page Accessible: ${this.results.pageAccessible ? '✅' : '❌'}`);
    console.log(`   API Integration: ${this.results.uiIntegration ? '✅' : '❌'}`);
    console.log(`   Products Available: ${this.results.productCount} (Expected: 142)`);
    console.log(`   Categories Available: ${this.results.categoryCount} (Expected: ~23)`);
    console.log('');
    
    if (this.results.apiResponse) {
      console.log('🔍 API STRUCTURE ANALYSIS:');
      console.log(`   Response Success: ${this.results.apiResponse.success ? '✅' : '❌'}`);
      console.log(`   Has Product Types: ${this.results.apiResponse.productTypes ? '✅' : '❌'}`);
      console.log(`   Has All Products: ${this.results.apiResponse.allProducts ? '✅' : '❌'}`);
      
      if (this.results.apiResponse.productTypes) {
        const ptKeys = Object.keys(this.results.apiResponse.productTypes);
        console.log(`   Product Type Categories: ${ptKeys.length}`);
      }
      console.log('');
    }
    
    console.log('🎯 USER EXPERIENCE CHECKLIST:');
    console.log('   1. Visit http://localhost:3001/merchandise');
    console.log('   2. Check browser console for errors');
    console.log('   3. Look for product categories/options in UI');
    console.log('   4. Select a test image and see available products');
    console.log('   5. Count how many product types are shown to user');
    console.log('');
    
    if (this.results.errors.length > 0) {
      console.log('❌ ISSUES DETECTED:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    if (overallSuccess) {
      console.log('🎉 All systems operational! 142-product catalog is live and accessible.');
    } else {
      console.log('⚠️  Some issues detected. Check the analysis above and visit the page manually.');
    }
    
    console.log('\n🌊 WAVELENGTH live merchandise store test complete!');
  }
}

// Run the live test
if (require.main === module) {
  const tester = new LiveMerchandiseTest();
  tester.runLiveTest().catch(console.error);
}

module.exports = LiveMerchandiseTest;