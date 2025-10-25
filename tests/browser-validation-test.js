#!/usr/bin/env node

/**
 * Browser Validation Test
 * Tests admin catalog paths with browser-like validation
 */

const puppeteer = require('puppeteer');

const tests = [
  {
    name: 'Forum Admin',
    url: 'http://localhost:3001/forum/admin',
    validate: (page) => page.$('h1')
  },
  {
    name: 'Vendor Catalog Redirect',
    url: 'http://localhost:3001/admin/vendor-catalog',
    expectRedirect: true,
    finalUrl: 'http://localhost:3001/forum/test-catalog'
  },
  {
    name: 'Test Catalog',
    url: 'http://localhost:3001/forum/test-catalog',
    validate: (page) => page.$('h1')
  }
];

async function runBrowserTests() {
  console.log('🌐 BROWSER VALIDATION TEST\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const results = [];
  
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    const page = await browser.newPage();
    
    try {
      const startTime = Date.now();
      const response = await page.goto(test.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      let success = false;
      let finalUrl = page.url();
      
      if (test.expectRedirect) {
        success = finalUrl === test.finalUrl;
        console.log(`✅ ${test.name}: Redirected to ${finalUrl} (${loadTime}ms)`);
      } else if (test.validate) {
        const element = await test.validate(page);
        success = !!element;
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${response.status()} (${loadTime}ms)`);
      } else {
        success = response.ok();
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${response.status()} (${loadTime}ms)`);
      }
      
      results.push({ ...test, success, loadTime, finalUrl, status: response.status() });
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.push({ ...test, success: false, error: error.message });
    }
    
    await page.close();
    console.log('');
  }
  
  await browser.close();
  
  const passed = results.filter(r => r.success).length;
  console.log('='.repeat(50));
  console.log(`BROWSER VALIDATION: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('✅ ALL BROWSER TESTS PASSED');
  } else {
    console.log('❌ SOME BROWSER TESTS FAILED');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Validation failed'}`);
    });
  }
  
  process.exit(passed === results.length ? 0 : 1);
}

runBrowserTests().catch(console.error);