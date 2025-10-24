#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testGalleryPage() {
  console.log('🧪 TESTING GALLERY PAGE ISSUES\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log('📄 Loading gallery page...');
    await page.goto('http://localhost:3001/gallery', { 
      waitUntil: 'networkidle2', 
      timeout: 10000 
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // TEST 1: Check for merch shop link
    console.log('\n🔗 TEST 1: Checking for merch shop link...');
    const merchLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const merchLinks = links.filter(link => 
        link.textContent.toLowerCase().includes('merch') || 
        link.textContent.toLowerCase().includes('shop') ||
        link.href.includes('/merchandise')
      );
      return merchLinks.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        visible: link.offsetParent !== null
      }));
    });
    
    if (merchLink.length > 0 && merchLink.some(l => l.visible)) {
      console.log(`✅ Merch link found: "${merchLink[0].text}" -> ${merchLink[0].href}`);
      passed++;
    } else if (merchLink.length > 0) {
      console.log(`❌ Merch link exists but is hidden: "${merchLink[0].text}"`);
      failed++;
    } else {
      console.log('❌ No merch shop link found');
      failed++;
    }
    
    // TEST 2: Check for image overlays
    console.log('\n🖼️  TEST 2: Checking image overlays...');
    const overlayInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('.gallery-item, .image-card, [class*="gallery"]');
      const overlays = [];
      
      images.forEach((item, index) => {
        const itemOverlays = item.querySelectorAll('[class*="overlay"], .action-buttons, .image-actions');
        if (itemOverlays.length > 0) {
          overlays.push({
            index,
            overlayCount: itemOverlays.length,
            overlayClasses: Array.from(itemOverlays).map(o => o.className)
          });
        }
      });
      
      return {
        totalImages: images.length,
        imagesWithOverlays: overlays.length,
        overlays
      };
    });
    
    console.log(`  Total images: ${overlayInfo.totalImages}`);
    console.log(`  Images with overlays: ${overlayInfo.imagesWithOverlays}`);
    if (overlayInfo.overlays.length > 0) {
      console.log(`  Sample overlay classes: ${overlayInfo.overlays[0].overlayClasses.join(', ')}`);
    }
    
    // TEST 3: Check for multi-select functionality
    console.log('\n☑️  TEST 3: Checking multi-select functionality...');
    const multiSelectInfo = await page.evaluate(() => {
      const selectButtons = document.querySelectorAll('[class*="select"], [class*="checkbox"], input[type="checkbox"]');
      const multiSelectMode = document.querySelector('[class*="multi-select"], [id*="multi-select"]');
      
      return {
        hasSelectButtons: selectButtons.length > 0,
        selectButtonCount: selectButtons.length,
        hasMultiSelectMode: !!multiSelectMode,
        multiSelectVisible: multiSelectMode ? multiSelectMode.offsetParent !== null : false
      };
    });
    
    console.log(`  Select buttons found: ${multiSelectInfo.selectButtonCount}`);
    console.log(`  Multi-select mode: ${multiSelectInfo.hasMultiSelectMode ? 'Yes' : 'No'}`);
    
    // TEST 4: Check for overlay/multi-select conflicts
    console.log('\n⚠️  TEST 4: Checking for overlay conflicts with multi-select...');
    const conflictInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('.gallery-item, .image-card, [class*="gallery"]');
      const conflicts = [];
      
      images.forEach((item, index) => {
        const overlays = item.querySelectorAll('[class*="overlay"]:not([class*="select"])');
        const selectElements = item.querySelectorAll('[class*="select"], input[type="checkbox"]');
        
        if (overlays.length > 0 && selectElements.length > 0) {
          // Check if overlays have high z-index that might block selection
          const overlayZIndexes = Array.from(overlays).map(o => {
            const style = window.getComputedStyle(o);
            return {
              zIndex: style.zIndex,
              pointerEvents: style.pointerEvents
            };
          });
          
          conflicts.push({
            index,
            overlayCount: overlays.length,
            selectCount: selectElements.length,
            overlayZIndexes
          });
        }
      });
      
      return conflicts;
    });
    
    if (conflictInfo.length > 0) {
      console.log(`❌ Found ${conflictInfo.length} images with potential overlay/select conflicts`);
      console.log(`  Sample conflict: ${JSON.stringify(conflictInfo[0], null, 2)}`);
      failed++;
    } else {
      console.log('✅ No overlay/select conflicts detected');
      passed++;
    }
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    failed++;
  } finally {
    if (browser) await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

testGalleryPage();
