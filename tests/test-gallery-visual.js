#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testGalleryVisual() {
  console.log('🧪 VISUAL TEST: Gallery Page\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('📄 Loading gallery page...');
    await page.goto('http://localhost:3001/gallery', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'gallery-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to: gallery-screenshot.png\n');
    
    // Check for merch link in action buttons
    const actionButtonsHTML = await page.evaluate(() => {
      const section = document.getElementById('action-buttons');
      return section ? section.innerHTML : 'NOT FOUND';
    });
    
    console.log('🔍 Action Buttons HTML:\n');
    console.log(actionButtonsHTML);
    console.log('\n');
    
    // Check if merch link exists
    const hasMerchLink = actionButtonsHTML.includes('Merch Shop') || actionButtonsHTML.includes('merchandise');
    
    if (hasMerchLink) {
      console.log('✅ Merch Shop link found in action buttons\n');
    } else {
      console.log('❌ Merch Shop link NOT found in action buttons\n');
    }
    
    // Check CSS for overlay fix
    const overlayCSS = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = '.test { }';
      document.head.appendChild(style);
      
      // Check if selectable class hides overlays
      const testDiv = document.createElement('div');
      testDiv.className = 'gallery-item selectable';
      const testActions = document.createElement('div');
      testActions.className = 'gallery-item-actions';
      testDiv.appendChild(testActions);
      document.body.appendChild(testDiv);
      
      const computedStyle = window.getComputedStyle(testActions);
      const display = computedStyle.display;
      
      testDiv.remove();
      
      return { display };
    });
    
    console.log('🎨 Overlay CSS in select mode:');
    console.log(`   display: ${overlayCSS.display}`);
    
    if (overlayCSS.display === 'none') {
      console.log('✅ Overlays are hidden in select mode\n');
    } else {
      console.log('❌ Overlays are NOT hidden in select mode\n');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (browser) await browser.close();
  }
}

testGalleryVisual();
