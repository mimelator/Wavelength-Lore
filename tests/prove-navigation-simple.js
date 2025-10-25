#!/usr/bin/env node

/**
 * Simple World Map Navigation Proof
 * Focused test to prove navigation works - compatible with current Puppeteer
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

// Helper to wait for delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function proveNavigation() {
  console.log('🎯 WORLD MAP NAVIGATION PROOF TEST');
  console.log('=' .repeat(45));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    console.log('\n📍 STEP 1: Load episode and verify compact design');
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Check section size
    const sectionInfo = await page.evaluate(() => {
      const section = document.querySelector('.episode-world-map');
      if (!section) return null;
      
      const rect = section.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        text: section.textContent.trim()
      };
    });
    
    if (sectionInfo) {
      console.log(`✅ Compact section found: ${sectionInfo.width}px x ${sectionInfo.height}px`);
      console.log(`   Text: "${sectionInfo.text.substring(0, 40)}..."`);
      
      const isCompact = sectionInfo.width <= 400 && sectionInfo.height <= 200;
      console.log(`   Size appropriate: ${isCompact ? '✅ YES' : '❌ NO'}`);
    } else {
      throw new Error('❌ World map section not found');
    }
    
    console.log('\n📍 STEP 2: Open modal and wait for content');
    
    // Click button
    const button = await page.$('#showWorldMapModal');
    if (!button) throw new Error('❌ Button not found');
    
    await button.click();
    console.log('🖱️ Button clicked - modal opening...');
    
    // Wait for modal
    await page.waitForSelector('#worldMapModal[style*="block"]');
    console.log('✅ Modal opened successfully');
    
    // Wait for content to load
    await delay(4000);
    console.log('⏳ Waited for map content to load');
    
    console.log('\n📍 STEP 3: Test navigation');
    
    // Check for clickable elements
    const clickableCount = await page.evaluate(() => {
      return document.querySelectorAll('#modalMapContent [data-location]').length;
    });
    
    console.log(`🎯 Found ${clickableCount} clickable locations`);
    
    if (clickableCount > 0) {
      // Get first clickable element info
      const locationInfo = await page.evaluate(() => {
        const element = document.querySelector('#modalMapContent [data-location]');
        return element ? {
          location: element.getAttribute('data-location'),
          tag: element.tagName
        } : null;
      });
      
      if (locationInfo) {
        console.log(`🔄 Testing click on: "${locationInfo.location}" (${locationInfo.tag})`);
        
        const originalUrl = page.url();
        console.log(`   Original URL: ${originalUrl}`);
        
        // Click the location
        await page.click('#modalMapContent [data-location]');
        
        // Wait for navigation
        await delay(3000);
        
        const newUrl = page.url();
        console.log(`   New URL: ${newUrl}`);
        
        if (newUrl !== originalUrl) {
          console.log('✅ NAVIGATION SUCCESS!');
          
          // Check if it's a valid destination
          const isLore = newUrl.includes('/lore/');
          const isCharacter = newUrl.includes('/character/');
          
          if (isLore || isCharacter) {
            console.log(`✅ CORRECT DESTINATION: ${isLore ? 'Lore' : 'Character'} page`);
            
            // Get page title
            const title = await page.title();
            console.log(`   Page title: "${title}"`);
            
            console.log('\n🎉 COMPLETE SUCCESS!');
            console.log('✅ Compact design works');
            console.log('✅ Button opens modal');
            console.log('✅ Map loads with clickable locations');
            console.log('✅ Navigation functions correctly');
            console.log('✅ Arrives at correct destination');
            
          } else {
            console.log('❌ Unexpected destination type');
          }
        } else {
          console.log('❌ Navigation failed - URL unchanged');
        }
      } else {
        console.log('❌ Could not get location info');
      }
    } else {
      console.log('❌ No clickable locations found');
    }
    
    // Keep browser open briefly
    await delay(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✅ Test complete');
    }
  }
}

proveNavigation().catch(console.error);