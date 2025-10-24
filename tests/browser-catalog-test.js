#!/usr/bin/env node
/**
 * REAL BROWSER TEST - Tests what user actually sees
 */

const { chromium } = require('playwright');

async function testCatalogInBrowser() {
  console.log('🌐 REAL BROWSER TEST - Testing actual UI');
  console.log('=========================================\n');

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
      timeout: 10000 
    });
    
    // Wait for products to load
    await page.waitForSelector('.product-card', { timeout: 5000 });
    
    const productCards = await page.$$('.product-card');
    console.log(`   ✅ Found ${productCards.length} product cards\n`);
    
    if (productCards.length === 0) {
      console.log('   ❌ NO PRODUCTS FOUND');
      return false;
    }
    
    const firstCard = productCards[0];
    
    // Test 1: Check images
    console.log('2️⃣ Testing images...');
    const images = await firstCard.$$('img');
    if (images.length > 0) {
      const img = images[0];
      const src = await img.getAttribute('src');
      const isPlaceholder = src.includes('data:image/svg') || src.includes('placeholder');
      
      console.log(`   Image src: ${src.substring(0, 80)}...`);
      console.log(`   Is placeholder: ${isPlaceholder}`);
      
      if (isPlaceholder) {
        console.log('   ❌ IMAGES NOT RESOLVED - Still showing placeholder\n');
      } else {
        console.log('   ✅ Image resolved\n');
      }
    } else {
      console.log('   ❌ NO IMAGES FOUND\n');
    }
    
    // Test 2: View Product button
    console.log('3️⃣ Testing View Product button...');
    const viewBtn = await firstCard.$('a[href*="/merchandise/preview/"], a.btn:has-text("View Product")');
    
    if (viewBtn) {
      const href = await viewBtn.getAttribute('href');
      console.log(`   Button href: ${href}`);
      
      // Click and check destination
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        viewBtn.click({ modifiers: ['Meta'] }) // Cmd+click to open in new tab
      ]);
      
      await newPage.waitForLoadState('networkidle');
      const url = newPage.url();
      const content = await newPage.content();
      const isHTML = content.includes('<!DOCTYPE html>');
      const isJSON = content.trim().startsWith('{');
      
      console.log(`   Destination: ${url}`);
      console.log(`   Is HTML page: ${isHTML}`);
      console.log(`   Is JSON: ${isJSON}`);
      
      if (isHTML && !isJSON) {
        console.log('   ✅ View Product works - goes to HTML page\n');
      } else {
        console.log('   ❌ View Product BROKEN - not HTML page\n');
      }
      
      await newPage.close();
    } else {
      console.log('   ❌ VIEW PRODUCT BUTTON NOT FOUND\n');
    }
    
    // Test 3: Border button
    console.log('4️⃣ Testing Add Border button...');
    const borderBtn = await firstCard.$('button:has-text("Add Border"), .btn-border');
    
    if (borderBtn) {
      console.log('   ✅ Border button exists');
      
      // Check if modal exists
      const modal = await page.$('#borderSelectionModal, .border-selection-modal');
      if (modal) {
        console.log('   ✅ Border modal exists\n');
      } else {
        console.log('   ⚠️  Border modal not found in DOM\n');
      }
    } else {
      console.log('   ❌ BORDER BUTTON NOT FOUND\n');
    }
    
    // Test 4: Delete button
    console.log('5️⃣ Testing Delete button...');
    const deleteBtn = await firstCard.$('button:has-text("Delete"), .btn-delete');
    
    if (deleteBtn) {
      console.log('   ✅ Delete button exists\n');
    } else {
      console.log('   ❌ DELETE BUTTON NOT FOUND\n');
    }
    
    // Check for JavaScript errors
    console.log('6️⃣ JavaScript errors:');
    if (errors.length > 0) {
      console.log('   ❌ ERRORS FOUND:');
      errors.forEach(err => console.log(`      ${err}`));
    } else {
      console.log('   ✅ No JavaScript errors');
    }
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    if (browser) await browser.close();
    return false;
  }
}

testCatalogInBrowser().then(success => {
  process.exit(success ? 0 : 1);
});
