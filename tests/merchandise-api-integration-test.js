#!/usr/bin/env node

/**
 * WAVELENGTH Merchandise API Service Integration Test
 * 
 * This test validates that the new MerchandiseApiService properly
 * integrates with the MerchandiseStore and all API calls work correctly.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testMerchandiseApiIntegration() {
  console.log('🌊 WAVELENGTH: Testing merchandise API service integration...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport for consistent testing
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    // Navigate to merchandise store
    console.log('📄 Loading merchandise store with new API service...');
    await page.goto('http://localhost:3001/merchandise-store', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for store initialization
    await page.waitForTimeout(3000);
    
    // Check if API service loaded correctly
    console.log('🔍 Checking API service initialization...');
    const apiServiceLoaded = await page.evaluate(() => {
      return typeof MerchandiseApiService !== 'undefined';
    });
    
    if (!apiServiceLoaded) {
      throw new Error('MerchandiseApiService not loaded');
    }
    console.log('✅ MerchandiseApiService loaded successfully');
    
    // Check if MerchandiseStore initialized with API service
    const storeInitialized = await page.evaluate(() => {
      return window.merchandiseStore && 
             window.merchandiseStore.apiService instanceof MerchandiseApiService;
    });
    
    if (!storeInitialized) {
      throw new Error('MerchandiseStore not properly initialized with API service');
    }
    console.log('✅ MerchandiseStore initialized with API service');
    
    // Test API service methods
    console.log('🧪 Testing API service methods...');
    
    const testResults = await page.evaluate(async () => {
      const results = {
        loadEnhancementStatus: false,
        loadProductTypes: false,
        loadGalleryImages: false,
        loadUserProducts: false,
        errorHandling: false
      };
      
      try {
        // Test loadEnhancementStatus
        const enhancementStatus = await window.merchandiseStore.apiService.loadEnhancementStatus();
        results.loadEnhancementStatus = enhancementStatus && typeof enhancementStatus.available === 'boolean';
        
        // Test loadProductTypes
        const productTypes = await window.merchandiseStore.apiService.loadProductTypes();
        results.loadProductTypes = productTypes && typeof productTypes === 'object';
        
        // Test loadGalleryImages
        const galleryImages = await window.merchandiseStore.apiService.loadGalleryImages();
        results.loadGalleryImages = Array.isArray(galleryImages);
        
        // Test loadUserProducts
        const userProducts = await window.merchandiseStore.apiService.loadUserProducts();
        results.loadUserProducts = Array.isArray(userProducts);
        
        // Test error handling
        try {
          await window.merchandiseStore.apiService.makeRequest('/api/nonexistent-endpoint');
          results.errorHandling = false; // Should have thrown
        } catch (error) {
          results.errorHandling = true; // Correctly handled error
        }
        
      } catch (error) {
        console.error('API service test error:', error);
      }
      
      return results;
    });
    
    // Print test results
    console.log('\n📊 API SERVICE INTEGRATION TEST RESULTS:');
    console.log('═══════════════════════════════════════════');
    console.log(`🔌 Enhancement Status API: ${testResults.loadEnhancementStatus ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📦 Product Types API: ${testResults.loadProductTypes ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🖼️ Gallery Images API: ${testResults.loadGalleryImages ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`👤 User Products API: ${testResults.loadUserProducts ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚠️ Error Handling: ${testResults.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    // Test UI functionality
    console.log('\n🎨 Testing UI functionality with API service...');
    
    // Check if store renders correctly
    const storeContent = await page.$('.merchandise-store');
    if (!storeContent) {
      throw new Error('Store content not rendered');
    }
    console.log('✅ Store UI rendered successfully');
    
    // Check if gallery images load through API service
    const galleryImages = await page.$$('.gallery-image-card');
    console.log(`📸 Gallery images loaded: ${galleryImages.length}`);
    
    // Check if product categories load through API service
    const categoryCards = await page.$$('.category-card');
    console.log(`📂 Category cards loaded: ${categoryCards.length}`);
    
    // Take screenshot for verification
    const screenshotPath = path.join(__dirname, 'merchandise-api-integration-test.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 SUCCESS: API service integration is working correctly!');
      console.log('   ✅ All API methods properly extracted and functional');
      console.log('   ✅ Error handling implemented correctly');
      console.log('   ✅ UI integration working properly');
      console.log('\n🚀 Ready to proceed with next refactoring phase!');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Some API methods need attention');
      console.log('   Please review failed tests before proceeding');
    }
    
  } catch (error) {
    console.error('❌ Integration test error:', error.message);
    
    // Take error screenshot
    const errorScreenshotPath = path.join(__dirname, 'merchandise-api-integration-error.png');
    await page.screenshot({ path: errorScreenshotPath, fullPage: true });
    console.log(`📸 Error screenshot saved: ${errorScreenshotPath}`);
  } finally {
    console.log('\n🌊 Keeping browser open for manual inspection...');
    console.log('   Close the browser window when you\'re done reviewing');
    
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testMerchandiseApiIntegration().catch(console.error);
}

module.exports = { testMerchandiseApiIntegration };