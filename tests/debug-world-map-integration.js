#!/usr/bin/env node

/**
 * Debug World Map Integration
 * Comprehensive test to investigate why the world map isn't showing and test navigation
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

async function debugWorldMapIntegration() {
  console.log('🐛 WORLD MAP INTEGRATION - DEBUG & NAVIGATION TEST');
  console.log('=' .repeat(60));
  
  let browser;
  
  try {
    // Launch browser with debugging
    console.log('🚀 Starting browser with debugging...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 200,
      devtools: true
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      } else if (msg.text().includes('hasLocationConnections')) {
        console.log('🔍 Location Debug:', msg.text());
      }
    });
    
    console.log('\n📍 PHASE 1: Episode Data Investigation');
    console.log('-'.repeat(40));
    
    // Navigate to Life in the Shire
    console.log('🔄 Loading episode: Life in the Shire...');
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Check what's actually in the HTML
    console.log('\n🔍 HTML Investigation:');
    
    const pageTitle = await page.title();
    console.log(`   Page Title: ${pageTitle}`);
    
    // Check if hasLocationConnections variable exists in the rendered template
    const hasLocationInTemplate = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const templateScript = scripts.find(s => s.innerHTML.includes('hasLocationConnections'));
      if (templateScript) {
        const match = templateScript.innerHTML.match(/hasLocationConnections[:\s]*([^,\s}]+)/);
        return match ? match[1] : 'not found in template';
      }
      return 'template script not found';
    });
    console.log(`   hasLocationConnections in template: ${hasLocationInTemplate}`);
    
    // Check for world map section
    const worldMapSection = await page.$('.episode-world-map');
    console.log(`   World Map Section Found: ${worldMapSection ? '✅ YES' : '❌ NO'}`);
    
    if (!worldMapSection) {
      // Look for the comment that indicates where it should be
      const worldMapComment = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_COMMENT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeValue.includes('World Map Exploration')) {
            return node.nodeValue;
          }
        }
        return null;
      });
      console.log(`   World Map Comment: ${worldMapComment ? '✅ Found' : '❌ Not Found'}`);
    }
    
    // Check episode keywords in the page
    const episodeKeywords = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const dataScript = scripts.find(s => s.innerHTML.includes('keywords'));
      if (dataScript) {
        const match = dataScript.innerHTML.match(/keywords[:\s]*\[(.*?)\]/);
        return match ? match[1] : 'no keywords match';
      }
      return 'no data script found';
    });
    console.log(`   Episode Keywords: ${episodeKeywords}`);
    
    // If no world map section, check the server response directly
    if (!worldMapSection) {
      console.log('\n🔍 Server Response Investigation:');
      const response = await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
      const html = await response.text();
      
      const hasWorldMapHTML = html.includes('episode-world-map');
      const hasLocationVar = html.includes('hasLocationConnections');
      const locationVarValue = html.match(/hasLocationConnections[:\s]*([^,\s}]+)/)?.[1];
      
      console.log(`   HTML contains world map section: ${hasWorldMapHTML ? '✅ YES' : '❌ NO'}`);
      console.log(`   HTML contains hasLocationConnections: ${hasLocationVar ? '✅ YES' : '❌ NO'}`);
      console.log(`   hasLocationConnections value: ${locationVarValue || 'not found'}`);
      
      // Check what lore items exist
      const loreMatches = html.match(/lore-link.*?title="Learn about ([^"]+)"/g);
      console.log(`   Lore links found: ${loreMatches ? loreMatches.length : 0}`);
      if (loreMatches) {
        loreMatches.forEach((match, i) => {
          console.log(`     ${i + 1}. ${match}`);
        });
      }
    }
    
    console.log('\n📍 PHASE 2: Test Different Episodes');
    console.log('-'.repeat(40));
    
    // Test episode without locations (My Lucky Charm)
    console.log('🔄 Testing episode without locations...');
    await page.goto(`${BASE_URL}/season/1/episode/1`, { waitUntil: 'networkidle2' });
    
    const noMapSection = await page.$('.episode-world-map');
    console.log(`   Episode 1 World Map: ${noMapSection ? '❌ Found (should not be)' : '✅ Not found (correct)'}`);
    
    console.log('\n📍 PHASE 3: Manual Navigation Test');
    console.log('-'.repeat(40));
    
    // Go back to Life in the Shire for navigation test
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // If we find a world map button, test navigation
    const mapButton = await page.$('#showWorldMapModal');
    if (mapButton) {
      console.log('✅ World map button found - testing navigation...');
      
      // Click to open modal
      await mapButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('worldMapModal');
        return modal && (modal.style.display === 'block' || getComputedStyle(modal).display !== 'none');
      });
      
      console.log(`   Modal opened: ${modalVisible ? '✅ YES' : '❌ NO'}`);
      
      if (modalVisible) {
        // Wait for map content to load
        await page.waitForTimeout(2000);
        
        // Look for clickable locations
        const clickableLocations = await page.$$eval('[data-location]', elements => 
          elements.map(el => ({ 
            location: el.getAttribute('data-location'),
            tag: el.tagName 
          }))
        );
        
        console.log(`   Clickable locations found: ${clickableLocations.length}`);
        clickableLocations.forEach((loc, i) => {
          console.log(`     ${i + 1}. ${loc.location} (${loc.tag})`);
        });
        
        // Test clicking a location if any exist
        if (clickableLocations.length > 0) {
          const firstLocation = await page.$('[data-location]');
          if (firstLocation) {
            console.log('🔄 Testing location click navigation...');
            
            // Get current URL before click
            const urlBefore = page.url();
            
            // Click the location
            await firstLocation.click();
            await page.waitForTimeout(1000);
            
            // Check if navigation occurred
            const urlAfter = page.url();
            const navigationOccurred = urlBefore !== urlAfter;
            
            console.log(`   Navigation test: ${navigationOccurred ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`     Before: ${urlBefore}`);
            console.log(`     After: ${urlAfter}`);
          }
        }
        
        // Close modal
        const closeButton = await page.$('.modal-close-map');
        if (closeButton) {
          await closeButton.click();
          console.log('✅ Modal closed successfully');
        }
      }
    } else {
      console.log('❌ World map button NOT found - investigating template rendering...');
      
      // Check what sections DO exist
      const sections = await page.$$eval('section', sections => 
        sections.map(section => ({
          class: section.className,
          id: section.id,
          hasHeader: !!section.querySelector('h2, h3'),
          headerText: section.querySelector('h2, h3')?.textContent?.trim()
        }))
      );
      
      console.log('   Sections found on page:');
      sections.forEach((section, i) => {
        console.log(`     ${i + 1}. class="${section.class}" ${section.headerText ? `header="${section.headerText}"` : ''}`);
      });
    }
    
    console.log('\n🎯 DEBUGGING SUMMARY:');
    console.log('=' .repeat(60));
    console.log('This test investigated why the world map section is not appearing.');
    console.log('Key things to check:');
    console.log('1. hasLocationConnections variable value in template');
    console.log('2. Episode keywords matching lore items with type="place"');
    console.log('3. Template conditional logic rendering');
    console.log('4. Navigation functionality when map is present');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Run the debug test
debugWorldMapIntegration().catch(console.error);