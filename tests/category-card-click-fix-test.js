#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testCategoryCardClick() {
  console.log('🔧 CATEGORY CARD CLICK FIX TEST');
  console.log('================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  const page = await browser.newPage();
  
  // Listen for console messages from the page
  page.on('console', msg => {
    console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
  });
  
  // Listen for JavaScript errors
  page.on('pageerror', error => {
    console.error(`❌ JavaScript Error:`, error.message);
  });
  
  try {
    console.log('📍 Navigating to merchandise page...');
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded');
    
    // Wait for merchandise store to load
    await page.waitForSelector('.merchandise-store', { timeout: 5000 });
    console.log('✅ Merchandise store loaded');
    
    // Wait for gallery images and select one
    await page.waitForSelector('.gallery-image-card', { timeout: 5000 });
    const galleryImages = await page.$$('.gallery-image-card');
    console.log(`📸 Found ${galleryImages.length} gallery images`);
    
    if (galleryImages.length > 0) {
      console.log('🖱️ Clicking first gallery image...');
      await galleryImages[0].click();
      
      // Wait for category container to appear
      await page.waitForSelector('#category-navigation-container', { timeout: 5000 });
      console.log('✅ Category navigation container appeared');
      
      // Wait a moment for category cards to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const categoryCards = await page.$$('.category-card');
      console.log(`🎴 Found ${categoryCards.length} category cards`);
      
      if (categoryCards.length > 0) {
        console.log('🖱️ Clicking first category card (THIS IS THE TEST!)...');
        await categoryCards[0].click();
        
        // Wait for products to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const productItems = await page.$$('.product-item');
        console.log(`📦 Found ${productItems.length} product items after click`);
        
        if (productItems.length > 0) {
          console.log('✅ SUCCESS: Category card click worked! No errors!');
        } else {
          console.log('⚠️ Category clicked but no products found');
        }
      } else {
        console.log('❌ No category cards found');
      }
    } else {
      console.log('❌ No gallery images found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('🏁 Test complete - check for any JavaScript errors above');
    await browser.close();
  }
}

testCategoryCardClick().catch(console.error);