#!/usr/bin/env node

/**
 * Quick World Map Navigation Test
 * Simple test to verify clicking works after our fixes
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

async function quickNavigationTest() {
  console.log('⚡ QUICK WORLD MAP NAVIGATION TEST');
  console.log('=' .repeat(45));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 500
    });
    
    const page = await browser.newPage();
    
    console.log('📍 Loading episode with world map...');
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Find and click world map button
    const mapButton = await page.$('#showWorldMapModal');
    if (!mapButton) {
      throw new Error('❌ World map button not found');
    }
    
    console.log('🗺️ Opening world map modal...');
    await mapButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 5000 });
    
    console.log('⏳ Waiting for map content to load...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Check for clickable elements
    const clickableElements = await page.$$('#modalMapContent [data-location]');
    console.log(`🎯 Found ${clickableElements.length} clickable locations`);
    
    if (clickableElements.length > 0) {
      // Test clicking first location
      const firstLocation = clickableElements[0];
      const locationName = await firstLocation.evaluate(el => el.getAttribute('data-location'));
      
      console.log(`🖱️ Testing click on: ${locationName}`);
      
      const originalUrl = page.url();
      
      // Click the location
      await firstLocation.click();
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newUrl = page.url();
      
      if (newUrl !== originalUrl) {
        console.log('✅ NAVIGATION SUCCESS!');
        console.log(`   From: ${originalUrl}`);
        console.log(`   To:   ${newUrl}`);
        
        // Verify we're on a valid page
        const pageTitle = await page.title();
        console.log(`   Page: ${pageTitle}`);
        
        return true;
      } else {
        console.log('❌ Navigation failed - URL unchanged');
        return false;
      }
    } else {
      console.log('❌ No clickable elements found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      console.log('\n⏸️ Keeping browser open for 5 seconds...');
      setTimeout(async () => {
        await browser.close();
        console.log('✅ Test complete');
      }, 5000);
    }
  }
}

// Run the test
quickNavigationTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 WORLD MAP NAVIGATION WORKS!');
    } else {
      console.log('\n💥 WORLD MAP NAVIGATION NEEDS FIXING');
    }
  })
  .catch(console.error);