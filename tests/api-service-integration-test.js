#!/usr/bin/env node

/**
 * WAVELENGTH API Service Integration Test
 * 
 * Tests the refactored MerchandiseApiService integration with MerchandiseStore
 * to verify all API calls work correctly after the refactoring.
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testApiServiceIntegration() {
  console.log('🧪 WAVELENGTH: Testing API service integration...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true  // Open DevTools to see console logs
  });
  const page = await browser.newPage();
  
  // Set viewport for consistent testing
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    // Navigate to merchandise store
    console.log('📄 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise-store', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for store to initialize
    await page.waitForTimeout(3000);
    
    // Test 1: Check if API service loaded
    console.log('🔍 Test 1: Checking API service availability...');
    const apiServiceAvailable = await page.evaluate(() => {
      return typeof MerchandiseApiService !== 'undefined';
    });
    
    if (apiServiceAvailable) {
      console.log('   ✅ MerchandiseApiService loaded successfully');
    } else {
      console.log('   ❌ MerchandiseApiService not found');
      throw new Error('API service not loaded');
    }
    
    // Test 2: Check if MerchandiseStore has API service instance
    console.log('🔍 Test 2: Checking MerchandiseStore API service integration...');
    const storeHasApiService = await page.evaluate(() => {
      return window.merchandiseStore && 
             window.merchandiseStore.apiService && 
             typeof window.merchandiseStore.apiService.makeRequest === 'function';
    });
    
    if (storeHasApiService) {
      console.log('   ✅ MerchandiseStore has API service instance');
    } else {
      console.log('   ❌ MerchandiseStore missing API service');
    }
    
    // Test 3: Monitor console for API service logs
    console.log('🔍 Test 3: Monitoring API service calls...');
    const consoleLogs = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('MerchandiseApiService:')) {
        consoleLogs.push(text);
        console.log(`   📊 API Call: ${text}`);
      }
    });
    
    // Wait for API calls to complete
    await page.waitForTimeout(5000);
    
    // Test 4: Check for specific API service method calls
    console.log('🔍 Test 4: Checking for expected API service calls...');
    const expectedCalls = [
      'Loading enhancement status',
      'Loading product types', 
      'Loading gallery images',
      'Loading user products'
    ];
    
    let callsFound = 0;
    expectedCalls.forEach(expectedCall => {
      const found = consoleLogs.some(log => log.includes(expectedCall));
      if (found) {
        console.log(`   ✅ Found: ${expectedCall}`);
        callsFound++;
      } else {
        console.log(`   ⚠️ Missing: ${expectedCall}`);
      }
    });
    
    // Test 5: Check for errors
    console.log('🔍 Test 5: Checking for errors...');
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push(error.toString());
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit more for any errors to surface
    await page.waitForTimeout(2000);
    
    if (errors.length === 0) {
      console.log('   ✅ No JavaScript errors detected');
    } else {
      console.log('   ❌ JavaScript errors found:');
      errors.forEach(error => console.log(`      • ${error}`));
    }
    
    // Test 6: Check if store initialized successfully
    console.log('🔍 Test 6: Checking store initialization...');
    const storeInitialized = await page.evaluate(() => {
      const container = document.getElementById('merchandise-store');
      return container && container.innerHTML.includes('Custom Merchandise');
    });
    
    if (storeInitialized) {
      console.log('   ✅ Store initialized and rendered');
    } else {
      console.log('   ❌ Store failed to initialize');
    }
    
    // Take screenshot for manual verification
    const screenshotPath = path.join(__dirname, 'api-service-integration-test.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Print test results
    console.log('\n📊 API SERVICE INTEGRATION TEST RESULTS:');
    console.log('═══════════════════════════════════════════════');
    
    const testResults = [
      { name: 'API Service Loaded', passed: apiServiceAvailable },
      { name: 'Store Has API Instance', passed: storeHasApiService },
      { name: 'Expected API Calls', passed: callsFound >= 3 },
      { name: 'No JavaScript Errors', passed: errors.length === 0 },
      { name: 'Store Initialized', passed: storeInitialized }
    ];
    
    testResults.forEach((test, i) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${i + 1}. ${status} - ${test.name}`);
    });
    
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 SUCCESS: API service integration working correctly!');
      console.log('✅ Ready to continue refactoring with confidence');
    } else {
      console.log('\n⚠️ ISSUES DETECTED: API service integration needs attention');
      console.log('🔧 Review the failing tests before proceeding');
    }
    
    console.log('\n📋 API Service Logs Found:');
    consoleLogs.forEach(log => console.log(`   • ${log}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🌊 Keeping browser open for manual inspection...');
    console.log('   Review the store functionality and close when done');
    
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testApiServiceIntegration().catch(console.error);
}

module.exports = { testApiServiceIntegration };