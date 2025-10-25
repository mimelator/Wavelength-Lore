#!/usr/bin/env node

/**
 * Complete World Map Integration Proof Test
 * Validates compact design, functionality, and successful navigation
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

async function proveWorldMapIntegration() {
  console.log('🏆 COMPLETE WORLD MAP INTEGRATION PROOF');
  console.log('=' .repeat(55));
  
  let browser;
  let testResults = {
    compactDesign: false,
    buttonWorks: false,
    modalOpens: false,
    mapLoads: false,
    navigationWorks: false,
    correctDestination: false
  };
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      slowMo: 300,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track navigation events
    let navigationOccurred = false;
    let finalUrl = '';
    
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        console.log(`🔄 Navigation detected: ${url}`);
        finalUrl = url;
        if (!url.includes('/season/1/episode/8')) {
          navigationOccurred = true;
        }
      }
    });
    
    console.log('\n🎯 TEST 1: Compact Design Validation');
    console.log('-'.repeat(40));
    
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Check if world map section exists and is properly sized
    const worldMapSection = await page.$('.episode-world-map');
    
    if (!worldMapSection) {
      throw new Error('❌ World map section not found');
    }
    
    console.log('✅ World map section found');
    
    // Get section dimensions and validate compact design
    const sectionInfo = await worldMapSection.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      return {
        width: rect.width,
        height: rect.height,
        maxWidth: styles.maxWidth,
        margin: styles.margin,
        padding: styles.padding,
        textContent: element.textContent.trim()
      };
    });
    
    console.log(`📏 Section Analysis:`);
    console.log(`   Actual Width: ${Math.round(sectionInfo.width)}px`);
    console.log(`   Max Width: ${sectionInfo.maxWidth}`);
    console.log(`   Height: ${Math.round(sectionInfo.height)}px`);
    console.log(`   Content: "${sectionInfo.textContent.substring(0, 50)}..."`);
    
    // Validate compact design
    const isCompact = sectionInfo.width <= 350 && sectionInfo.height <= 200;
    if (isCompact) {
      console.log('✅ COMPACT DESIGN: Section is appropriately sized');
      testResults.compactDesign = true;
    } else {
      console.log('❌ DESIGN ISSUE: Section may be too large');
    }
    
    console.log('\n🎯 TEST 2: Button Functionality');
    console.log('-'.repeat(40));
    
    // Find and test button
    const mapButton = await page.$('#showWorldMapModal');
    
    if (!mapButton) {
      throw new Error('❌ World map button not found');
    }
    
    console.log('✅ World map button found');
    testResults.buttonWorks = true;
    
    // Check button styling
    const buttonInfo = await mapButton.evaluate(element => ({
      text: element.textContent.trim(),
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height
    }));
    
    console.log(`📋 Button: "${buttonInfo.text}" (${Math.round(buttonInfo.width)}x${Math.round(buttonInfo.height)}px)`);
    
    console.log('\n🎯 TEST 3: Modal Opening');
    console.log('-'.repeat(40));
    
    // Click button and test modal
    console.log('🖱️ Clicking world map button...');
    await mapButton.click();
    
    // Wait for modal to appear
    try {
      await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
      console.log('✅ MODAL OPENED: Successfully');
      testResults.modalOpens = true;
    } catch (error) {
      throw new Error('❌ Modal failed to open within 3 seconds');
    }
    
    console.log('\n🎯 TEST 4: Map Content Loading');
    console.log('-'.repeat(40));
    
    // Wait for map content to load
    console.log('⏳ Waiting for map content to load...');
    await page.waitForTimeout(3000);
    
    // Check map content
    const mapContent = await page.evaluate(() => {
      const content = document.getElementById('modalMapContent');
      if (!content) return { exists: false };
      
      return {
        exists: true,
        innerHTML: content.innerHTML.substring(0, 100),
        hasClickableElements: content.querySelectorAll('[data-location]').length > 0,
        clickableCount: content.querySelectorAll('[data-location]').length,
        isLoading: content.innerHTML.includes('Loading')
      };
    });
    
    console.log(`📊 Map Content:`);
    console.log(`   Content exists: ${mapContent.exists ? '✅' : '❌'}`);
    console.log(`   Clickable elements: ${mapContent.clickableCount}`);
    console.log(`   Still loading: ${mapContent.isLoading ? '⏳' : '✅'}`);
    
    if (mapContent.exists && mapContent.clickableCount > 0 && !mapContent.isLoading) {
      console.log('✅ MAP LOADED: Content and interactivity ready');
      testResults.mapLoads = true;
    } else if (mapContent.isLoading) {
      console.log('⏳ Waiting additional time for map to finish loading...');
      await page.waitForTimeout(2000);
      
      // Check again
      const updatedContent = await page.evaluate(() => {
        const content = document.getElementById('modalMapContent');
        return {
          clickableCount: content ? content.querySelectorAll('[data-location]').length : 0,
          isLoading: content ? content.innerHTML.includes('Loading') : true
        };
      });
      
      if (updatedContent.clickableCount > 0 && !updatedContent.isLoading) {
        console.log('✅ MAP LOADED: Content ready after additional wait');
        testResults.mapLoads = true;
      }
    }
    
    console.log('\n🎯 TEST 5: Navigation Functionality');
    console.log('-'.repeat(40));
    
    // Get all clickable elements
    const clickableElements = await page.$$('#modalMapContent [data-location]');
    
    if (clickableElements.length === 0) {
      console.log('❌ NO CLICKABLE ELEMENTS: Cannot test navigation');
    } else {
      console.log(`🎯 Found ${clickableElements.length} clickable locations`);
      
      // Test clicking first location
      const firstLocation = clickableElements[0];
      const locationData = await firstLocation.evaluate(el => ({
        location: el.getAttribute('data-location'),
        tag: el.tagName.toLowerCase()
      }));
      
      console.log(`🖱️ Testing click on: "${locationData.location}" (${locationData.tag})`);
      
      const urlBefore = page.url();
      console.log(`📍 Starting URL: ${urlBefore}`);
      
      // Click the location
      await firstLocation.click();
      
      // Wait for navigation to occur
      console.log('⏳ Waiting for navigation...');
      await page.waitForTimeout(3000);
      
      const urlAfter = page.url();
      console.log(`📍 Final URL: ${urlAfter}`);
      
      if (navigationOccurred || urlAfter !== urlBefore) {
        console.log('✅ NAVIGATION SUCCESS: URL changed');
        testResults.navigationWorks = true;
        
        // Validate destination
        const isLorePage = urlAfter.includes('/lore/');
        const isCharacterPage = urlAfter.includes('/character/');
        const isValidDestination = isLorePage || isCharacterPage;
        
        if (isValidDestination) {
          console.log(`✅ CORRECT DESTINATION: ${isLorePage ? 'Lore' : 'Character'} page`);
          testResults.correctDestination = true;
          
          // Get page title to confirm
          const pageTitle = await page.title();
          console.log(`📄 Destination page: "${pageTitle}"`);
        } else {
          console.log(`❌ UNEXPECTED DESTINATION: Not a lore or character page`);
        }
      } else {
        console.log('❌ NAVIGATION FAILED: No URL change detected');
      }
    }
    
    console.log('\n🏆 FINAL TEST RESULTS');
    console.log('=' .repeat(55));
    
    const results = [
      { test: 'Compact Design', passed: testResults.compactDesign },
      { test: 'Button Works', passed: testResults.buttonWorks },
      { test: 'Modal Opens', passed: testResults.modalOpens },
      { test: 'Map Loads', passed: testResults.mapLoads },
      { test: 'Navigation Works', passed: testResults.navigationWorks },
      { test: 'Correct Destination', passed: testResults.correctDestination }
    ];
    
    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} - ${result.test}`);
    });
    
    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\n📊 SCORE: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 COMPLETE SUCCESS: World map integration fully functional!');
    } else if (totalPassed >= 4) {
      console.log('🌟 MOSTLY WORKING: Core functionality operational');
    } else {
      console.log('🚨 NEEDS WORK: Significant issues detected');
    }
    
    // Keep browser open for inspection
    console.log('\n👁️ Browser staying open for 6 seconds for inspection...');
    await page.waitForTimeout(6000);
    
  } catch (error) {
    console.error('❌ TEST EXECUTION ERROR:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Test complete - browser closed');
    }
  }
}

// Run the comprehensive proof test
proveWorldMapIntegration().catch(console.error);