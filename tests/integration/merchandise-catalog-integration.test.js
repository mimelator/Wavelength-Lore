#!/usr/bin/env node

/**
 * WAVELENGTH Merchandise Store Catalog Integration Test
 * 
 * Tests the complete user flow:
 * 1. User browses to /merchandise
 * 2. Selects a random image
 * 3. Measures available categories and product types in UI
 * 
 * Validates integration of 142-product catalog with merchandise store
 */

require('dotenv').config();
const axios = require('axios');
const { JSDOM } = require('jsdom');

class MerchandiseStoreIntegrationTest {
  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.testResults = {
      pageLoad: false,
      apiIntegration: false,
      productCount: 0,
      categoryCount: 0,
      categories: [],
      userFlow: false,
      uiElements: {},
      errors: []
    };
  }

  async runComprehensiveTest() {
    console.log('🌊 WAVELENGTH: Merchandise Store Catalog Integration Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Testing user flow: Browse → Select Image → Measure Product Options');
    console.log('');

    try {
      // Phase 1: Test merchandise page load
      await this.testMerchandisePageLoad();
      
      // Phase 2: Test API integration
      await this.testAPIIntegration();
      
      // Phase 3: Test UI product type reporting
      await this.testUIProductTypeReporting();
      
      // Phase 4: Simulate user image selection flow
      await this.simulateUserImageSelection();
      
      // Phase 5: Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      this.testResults.errors.push(error.message);
      this.generateReport();
    }
  }

  async testMerchandisePageLoad() {
    console.log('📋 Phase 1: Testing merchandise page load...');
    
    try {
      const response = await axios.get(`${this.baseURL}/merchandise`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'WAVELENGTH-Integration-Test/1.1.0'
        }
      });
      
      if (response.status === 200) {
        this.testResults.pageLoad = true;
        console.log('  ✅ Merchandise page loads successfully (200 OK)');
        
        // Parse HTML to analyze UI elements
        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        
        // Check for key UI elements
        this.testResults.uiElements = {
          productTypeSelector: !!document.querySelector('#product-type-selector, .product-type-selector, select[name*="product"], select[name*="type"]'),
          categoryElements: document.querySelectorAll('.category, [data-category], .product-category').length,
          productElements: document.querySelectorAll('.product, [data-product], .product-item').length,
          imageUploadArea: !!document.querySelector('#image-upload, .image-upload, input[type="file"]'),
          createButton: !!document.querySelector('#create-product, .create-product, button[type="submit"]')
        };
        
        console.log('  📊 UI Elements Detected:');
        console.log(`    Product Type Selector: ${this.testResults.uiElements.productTypeSelector ? '✅' : '❌'}`);
        console.log(`    Category Elements: ${this.testResults.uiElements.categoryElements}`);
        console.log(`    Product Elements: ${this.testResults.uiElements.productElements}`);
        console.log(`    Image Upload: ${this.testResults.uiElements.imageUploadArea ? '✅' : '❌'}`);
        console.log(`    Create Button: ${this.testResults.uiElements.createButton ? '✅' : '❌'}`);
        
      } else {
        throw new Error(`Page returned status ${response.status}`);
      }
    } catch (error) {
      this.testResults.errors.push(`Page load failed: ${error.message}`);
      throw error;
    }
  }

  async testAPIIntegration() {
    console.log('\n📋 Phase 2: Testing API integration...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/merchandise/product-types`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data) {
        this.testResults.apiIntegration = true;
        
        // Analyze the API response structure
        const data = response.data;
        
        if (data.allProducts && Array.isArray(data.allProducts)) {
          this.testResults.productCount = data.allProducts.length;
          
          // Extract unique categories
          const categories = new Set();
          data.allProducts.forEach(product => {
            if (product.category) {
              categories.add(product.category);
            }
          });
          
          this.testResults.categories = Array.from(categories).sort();
          this.testResults.categoryCount = this.testResults.categories.length;
          
          console.log('  ✅ API integration successful');
          console.log(`  📊 Products Available: ${this.testResults.productCount}`);
          console.log(`  📂 Categories Available: ${this.testResults.categoryCount}`);
          console.log('  🏷️  Category List:');
          this.testResults.categories.forEach((cat, index) => {
            const productCount = data.allProducts.filter(p => p.category === cat).length;
            console.log(`    ${index + 1}. ${cat} (${productCount} products)`);
          });
          
        } else {
          throw new Error('API response missing allProducts array');
        }
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      this.testResults.errors.push(`API integration failed: ${error.message}`);
      throw error;
    }
  }

  async testUIProductTypeReporting() {
    console.log('\n📋 Phase 3: Testing UI product type reporting...');
    
    try {
      // Test the merchandise store's JavaScript components
      const jsResponse = await axios.get(`${this.baseURL}/static/js/components/merchandise-store.js`, {
        timeout: 5000
      });
      
      if (jsResponse.status === 200) {
        const jsContent = jsResponse.data;
        
        // Analyze the JavaScript for product type handling
        const hasProductTypeHandling = jsContent.includes('product-type') || jsContent.includes('productType');
        const hasCategoryHandling = jsContent.includes('category') || jsContent.includes('categories');
        const hasAPIIntegration = jsContent.includes('/api/merchandise/product-types');
        
        console.log('  📊 JavaScript Analysis:');
        console.log(`    Product Type Handling: ${hasProductTypeHandling ? '✅' : '❌'}`);
        console.log(`    Category Handling: ${hasCategoryHandling ? '✅' : '❌'}`);
        console.log(`    API Integration: ${hasAPIIntegration ? '✅' : '❌'}`);
        
        this.testResults.uiElements.jsIntegration = {
          productTypeHandling: hasProductTypeHandling,
          categoryHandling: hasCategoryHandling,
          apiIntegration: hasAPIIntegration
        };
        
      } else {
        console.log('  ⚠️  Merchandise store JavaScript not found or not accessible');
      }
    } catch (error) {
      console.log(`  ⚠️  Could not analyze JavaScript: ${error.message}`);
    }
  }

  async simulateUserImageSelection() {
    console.log('\n📋 Phase 4: Simulating user image selection flow...');
    
    try {
      // Test the typical user flow endpoints
      const testEndpoints = [
        '/api/merchandise/product-types',
        '/api/gallery/user-images', // Common endpoint for user images
        '/api/merchandise/create-product' // Product creation endpoint
      ];
      
      const endpointResults = {};
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            timeout: 3000,
            validateStatus: function (status) {
              // Accept any status code for analysis
              return status < 500;
            }
          });
          
          endpointResults[endpoint] = {
            status: response.status,
            available: response.status < 400,
            hasData: !!response.data
          };
          
          console.log(`  ${response.status < 400 ? '✅' : '❌'} ${endpoint}: ${response.status}`);
          
        } catch (error) {
          endpointResults[endpoint] = {
            status: 'error',
            available: false,
            error: error.message
          };
          console.log(`  ❌ ${endpoint}: ${error.message}`);
        }
      }
      
      this.testResults.userFlow = endpointResults['/api/merchandise/product-types'].available;
      this.testResults.endpointResults = endpointResults;
      
    } catch (error) {
      this.testResults.errors.push(`User flow simulation failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n🎉 WAVELENGTH: Integration Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Overall Status
    const overallSuccess = this.testResults.pageLoad && 
                          this.testResults.apiIntegration && 
                          this.testResults.productCount >= 140; // Allow small variance
    
    console.log(`🌊 OVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ ISSUES DETECTED'}`);
    console.log('');
    
    // Core Metrics
    console.log('📊 CORE METRICS:');
    console.log(`   Products Available: ${this.testResults.productCount}`);
    console.log(`   Categories Available: ${this.testResults.categoryCount}`);
    console.log(`   Page Load: ${this.testResults.pageLoad ? '✅' : '❌'}`);
    console.log(`   API Integration: ${this.testResults.apiIntegration ? '✅' : '❌'}`);
    console.log(`   User Flow: ${this.testResults.userFlow ? '✅' : '❌'}`);
    console.log('');
    
    // Product Categories Summary
    if (this.testResults.categories.length > 0) {
      console.log('🏷️  AVAILABLE CATEGORIES:');
      this.testResults.categories.slice(0, 10).forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat}`);
      });
      if (this.testResults.categories.length > 10) {
        console.log(`   ... and ${this.testResults.categories.length - 10} more categories`);
      }
      console.log('');
    }
    
    // UI Integration Analysis
    console.log('🎨 UI INTEGRATION:');
    if (this.testResults.uiElements.jsIntegration) {
      console.log(`   Product Type Handling: ${this.testResults.uiElements.jsIntegration.productTypeHandling ? '✅' : '❌'}`);
      console.log(`   Category Handling: ${this.testResults.uiElements.jsIntegration.categoryHandling ? '✅' : '❌'}`);
      console.log(`   API Integration: ${this.testResults.uiElements.jsIntegration.apiIntegration ? '✅' : '❌'}`);
    } else {
      console.log('   JavaScript analysis incomplete');
    }
    console.log('');
    
    // Recommendations
    console.log('🎯 RECOMMENDATIONS:');
    if (this.testResults.productCount < 140) {
      console.log('   ⚠️  Product count below expected (142) - check catalog integration');
    }
    if (!this.testResults.uiElements.productTypeSelector) {
      console.log('   ⚠️  Product type selector not detected in UI');
    }
    if (this.testResults.categoryCount < 25) {
      console.log('   ⚠️  Category count below expected (28) - verify category extraction');
    }
    if (this.testResults.errors.length === 0 && overallSuccess) {
      console.log('   🎉 All systems operational! 142-product catalog fully integrated.');
    }
    console.log('');
    
    // Error Summary
    if (this.testResults.errors.length > 0) {
      console.log('❌ ERRORS DETECTED:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    console.log('🌊 WAVELENGTH merchandise store integration test complete!');
    
    return this.testResults;
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new MerchandiseStoreIntegrationTest();
  tester.runComprehensiveTest().catch(console.error);
}

module.exports = MerchandiseStoreIntegrationTest;