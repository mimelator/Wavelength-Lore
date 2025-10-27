#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testMerchandisePage() {
  console.log('🚀 SIMPLE MERCHANDISE PAGE TEST');
  console.log('================================');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages from the page
  page.on('console', msg => {
    console.log(`🌐 Browser Console [${msg.type()}]:`, msg.text());
  });
  
  // Listen for JavaScript errors
  page.on('pageerror', error => {
    console.log(`❌ JavaScript Error:`, error.message);
  });
  
  try {
    console.log('📍 Navigating to merchandise page...');
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for the main content to load
    await page.waitForSelector('.merchandise-store', { timeout: 5000 });
    console.log('✅ Merchandise container found');
    
    // Check if gallery images are loading
    const galleryImages = await page.$$('.gallery-image-card');
    console.log(`📸 Gallery images found: ${galleryImages.length}`);
    
    if (galleryImages.length > 0) {
      // Select the first image
      console.log('🖱️ Clicking first gallery image...');
      await galleryImages[0].click();
      
      // Wait for category container to appear
      console.log('⏳ Waiting for category container to appear...');
      await page.waitForSelector('#category-navigation-container', { timeout: 5000 });
      console.log('✅ Category container appeared!');
      
      // Check if category cards are rendered
      const categoryCards = await page.$$('.category-card');
      console.log(`🎴 Category cards found: ${categoryCards.length}`);
      
      if (categoryCards.length > 0) {
        console.log('🖱️ Clicking first category card...');
        await categoryCards[0].click();
        
        // Wait a bit to see product view
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const productItems = await page.$$('.product-item');
        console.log(`📦 Product items found: ${productItems.length}`);
      }
    } else {
      console.log('⚠️ No gallery images found to test with');
    }
    
    // Check if category navigation container exists
    const categoryContainer = await page.$('#category-navigation-container');
    console.log(`🎴 Category container exists: ${categoryContainer ? 'YES' : 'NO'}`);
    
    // Wait a bit to see what happens
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testMerchandisePage().catch(console.error);