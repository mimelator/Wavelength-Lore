#!/usr/bin/env node

/**
 * World Map Navigation Test
 * Tests that clicking on world map locations actually navigates to the correct pages
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

async function testWorldMapNavigation() {
  console.log('🧪 WORLD MAP NAVIGATION TEST');
  console.log('=' .repeat(50));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 300
    });
    
    const page = await browser.newPage();
    
    // Listen for navigation events
    const navigationEvents = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationEvents.push({
          url: frame.url(),
          timestamp: Date.now()
        });
      }
    });
    
    console.log('\n📍 STEP 1: Navigate to episode with locations');
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Verify world map button exists
    const mapButton = await page.$('#showWorldMapModal');
    if (!mapButton) {
      throw new Error('World map button not found!');
    }
    console.log('✅ World map button found');
    
    console.log('\n📍 STEP 2: Open world map modal');
    await mapButton.click();
    await page.waitForTimeout(1000);
    
    // Check if modal opened
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('worldMapModal');
      return modal && modal.style.display === 'block';
    });
    
    if (!modalVisible) {
      throw new Error('World map modal did not open!');
    }
    console.log('✅ World map modal opened');
    
    console.log('\n📍 STEP 3: Wait for map content to load');
    await page.waitForTimeout(3000); // Give time for map to load
    
    // Check what's in the map content
    const mapContent = await page.evaluate(() => {
      const content = document.getElementById('modalMapContent');
      return {
        innerHTML: content ? content.innerHTML.substring(0, 200) : 'not found',
        hasClickableElements: content ? content.querySelectorAll('[data-location]').length > 0 : false,
        clickableCount: content ? content.querySelectorAll('[data-location]').length : 0
      };
    });
    
    console.log(`📊 Map content loaded: ${mapContent.innerHTML.includes('Loading') ? 'Still loading' : 'Content present'}`);
    console.log(`📊 Clickable elements: ${mapContent.clickableCount}`);
    
    if (mapContent.clickableCount === 0) {
      console.log('⚠️  No clickable locations found. Map content:');
      console.log(mapContent.innerHTML);
      
      // Let's see what the loadMapContent function is doing
      const mapLoadResult = await page.evaluate(() => {
        // Check if loadMapContent function exists
        if (typeof loadMapContent === 'function') {
          try {
            loadMapContent();
            return 'loadMapContent called successfully';
          } catch (e) {
            return `loadMapContent error: ${e.message}`;
          }
        } else {
          return 'loadMapContent function not found';
        }
      });
      console.log(`📄 Map load function: ${mapLoadResult}`);
      
      // Wait a bit more and check again
      await page.waitForTimeout(2000);
      
      const updatedContent = await page.evaluate(() => {
        const content = document.getElementById('modalMapContent');
        return content ? content.querySelectorAll('[data-location]').length : 0;
      });
      console.log(`📊 Updated clickable elements: ${updatedContent}`);
    }
    
    console.log('\n📍 STEP 4: Test navigation functionality');
    
    // Get all clickable locations
    const clickableLocations = await page.$$('[data-location]');
    
    if (clickableLocations.length === 0) {
      console.log('❌ NO CLICKABLE LOCATIONS FOUND - Navigation cannot be tested');
      console.log('   This indicates the map SVG or interactive elements are not loading properly');
    } else {
      console.log(`🎯 Found ${clickableLocations.length} clickable locations`);
      
      // Test clicking the first location
      const firstLocation = clickableLocations[0];
      const locationData = await firstLocation.evaluate(el => ({
        location: el.getAttribute('data-location'),
        tag: el.tagName,
        onclick: el.getAttribute('onclick'),
        href: el.getAttribute('href')
      }));
      
      console.log(`🔄 Testing click on: ${locationData.location} (${locationData.tag})`);
      
      const urlBefore = page.url();
      const navigationsBefore = navigationEvents.length;
      
      // Click the location
      await firstLocation.click();
      
      // Wait for potential navigation
      await page.waitForTimeout(2000);
      
      const urlAfter = page.url();
      const navigationsAfter = navigationEvents.length;
      
      console.log(`📊 Navigation Test Results:`);
      console.log(`   URL Before: ${urlBefore}`);
      console.log(`   URL After: ${urlAfter}`);
      console.log(`   Navigation occurred: ${urlBefore !== urlAfter ? '✅ YES' : '❌ NO'}`);
      console.log(`   Navigation events: ${navigationsAfter - navigationsBefore}`);
      
      if (navigationEvents.length > navigationsBefore) {
        console.log('📍 Navigation events:');
        navigationEvents.slice(navigationsBefore).forEach((nav, i) => {
          console.log(`   ${i + 1}. ${nav.url}`);
        });
      }
      
      // Test if we're now on a lore or character page
      if (urlAfter !== urlBefore) {
        const pageType = urlAfter.includes('/lore/') ? 'Lore Page' : 
                        urlAfter.includes('/character/') ? 'Character Page' : 
                        'Other Page';
        console.log(`✅ Successfully navigated to ${pageType}`);
        
        // Verify the page loaded correctly
        await page.waitForTimeout(1000);
        const pageTitle = await page.title();
        console.log(`📄 Destination page title: ${pageTitle}`);
      } else {
        console.log('❌ Navigation failed - URL did not change');
      }
    }
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('=' .repeat(50));
    
    if (clickableLocations.length > 0 && navigationEvents.length > 1) {
      console.log('✅ NAVIGATION TEST PASSED');
      console.log('   - World map button works');
      console.log('   - Modal opens correctly'); 
      console.log('   - Clickable locations present');
      console.log('   - Navigation functionality works');
    } else {
      console.log('❌ NAVIGATION TEST FAILED');
      console.log(`   - Clickable locations: ${clickableLocations.length > 0 ? '✅' : '❌'}`);
      console.log(`   - Navigation events: ${navigationEvents.length > 1 ? '✅' : '❌'}`);
    }
    
    // Keep browser open for inspection
    console.log('\n⏸️  Browser staying open for 8 seconds for inspection...');
    await page.waitForTimeout(8000);
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Run the navigation test
testWorldMapNavigation().catch(console.error);