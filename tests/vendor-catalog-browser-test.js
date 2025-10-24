#!/usr/bin/env node
/**
 * REAL BROWSER TEST - Tests actual UI functionality
 * Tests what the user ACTUALLY sees in the browser
 */

const { chromium } = require('playwright');

console.log('🌐 VENDOR CATALOG BROWSER TEST');
console.log('==============================\n');

async function runBrowserTest() {
  let browser, page;
  
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    console.log('1️⃣ Loading catalog page...');
    await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Test 1: Check if product cards exist
    console.log('\n2️⃣ Checking product cards...');
    const productCards = await page.$$('.product-card');
    console.log(`   Found ${productCards.length} product cards`);
    
    if (productCards.length === 0) {
      console.log('   ❌ FAIL: No product cards found!');
      return false;
    }
    
    // Test 2: Check View Product button
    console.log('\n3️⃣ Testing View Product button...');
    const viewButton = await page.$('.product-card .btn');
    
    if (!viewButton) {
      console.log('   ❌ FAIL: View Product button not found!');
      return false;
    }
    
    const viewHref = await viewButton.getAttribute('href');
    console.log(`   Button href: ${viewHref}`);
    
    if (!viewHref || viewHref.includes('/api/')) {
      console.log('   ❌ FAIL: Button links to API endpoint, not HTML page!');
      return false;
    }
    
    // Click and verify it goes to HTML page
    console.log('   Clicking View Product button...');
    await viewButton.click();
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const pageContent = await page.content();
    const isHTMLPage = pageContent.includes('<!DOCTYPE html>');
    
    console.log(`   Navigated to: ${currentUrl}`);
    console.log(`   Is HTML page: ${isHTMLPage}`);
    
    if (!isHTMLPage) {
      console.log('   ❌ FAIL: Did not navigate to HTML page!');
      return false;
    }
    
    console.log('   ✅ PASS: View Product button works!');
    
    // Go back to catalog
    await page.goto('http://localhost:3001/admin/vendor-research/catalog', { 
      waitUntil: 'networkidle' 
    });
    
    // Test 3: Check image resolver
    console.log('\n4️⃣ Testing image resolver...');
    
    // Wait for image resolver to run
    await page.waitForTimeout(3000);
    
    const images = await page.$$('.product-image-preview img');
    console.log(`   Found ${images.length} product images`);
    
    if (images.length === 0) {
      console.log('   ❌ FAIL: No product images found!');
      return false;
    }
    
    // Check if images have resolved URLs
    let resolvedCount = 0;
    for (const img of images) {
      const src = await img.getAttribute('src');
      const resolvedType = await img.getAttribute('data-resolved-type');
      
      if (src && !src.includes('data:image/svg') && !src.includes('placeholder')) {
        resolvedCount++;
        console.log(`   Image resolved: ${src.substring(0, 50)}... (${resolvedType || 'unknown'})`);
      }
    }
    
    console.log(`   Resolved images: ${resolvedCount}/${images.length}`);
    
    if (resolvedCount === 0) {
      console.log('   ❌ FAIL: No images resolved!');
      return false;
    }
    
    console.log('   ✅ PASS: Image resolver works!');
    
    // Test 4: Check for JavaScript errors
    console.log('\n5️⃣ Checking for JavaScript errors...');
    if (errors.length > 0) {
      console.log(`   ❌ Found ${errors.length} JavaScript errors:`);
      errors.forEach(err => console.log(`      - ${err}`));
      return false;
    }
    
    console.log('   ✅ PASS: No JavaScript errors!');
    
    console.log('\n✅ ALL BROWSER TESTS PASSED!');
    return true;
    
  } catch (error) {
    console.error(`\n❌ Browser test failed: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runBrowserTest().then(success => {
  process.exit(success ? 0 : 1);
});
