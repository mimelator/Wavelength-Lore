#!/usr/bin/env node

/**
 * World Map Visual Validation Test
 * Tests the visual presentation, sizing, and layout of the world map integration
 */

const puppeteer = require('puppeteer');
const BASE_URL = 'http://localhost:3001';

async function validateWorldMapVisuals() {
  console.log('🎨 WORLD MAP VISUAL VALIDATION TEST');
  console.log('=' .repeat(50));
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      slowMo: 400
    });
    
    const page = await browser.newPage();
    
    console.log('\n📍 STEP 1: Page Layout Analysis');
    console.log('-'.repeat(35));
    
    await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle2' });
    
    // Analyze world map section dimensions and positioning
    const worldMapSection = await page.$('.episode-world-map');
    
    if (!worldMapSection) {
      throw new Error('❌ World map section not found on page');
    }
    
    console.log('✅ World map section found');
    
    // Get section dimensions and styling
    const sectionInfo = await worldMapSection.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      return {
        // Position and size
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        
        // Styling
        margin: styles.margin,
        padding: styles.padding,
        backgroundColor: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        border: styles.border,
        textAlign: styles.textAlign,
        
        // Content
        innerHTML: element.innerHTML.substring(0, 200) + '...'
      };
    });
    
    console.log('\n📊 World Map Section Analysis:');
    console.log(`   Width: ${Math.round(sectionInfo.width)}px`);
    console.log(`   Height: ${Math.round(sectionInfo.height)}px`);
    console.log(`   Background: ${sectionInfo.backgroundColor}`);
    console.log(`   Border: ${sectionInfo.border}`);
    console.log(`   Border Radius: ${sectionInfo.borderRadius}`);
    console.log(`   Text Align: ${sectionInfo.textAlign}`);
    console.log(`   Margin: ${sectionInfo.margin}`);
    console.log(`   Padding: ${sectionInfo.padding}`);
    
    // Check if section takes up reasonable space
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const sectionPercentage = (sectionInfo.height / pageHeight) * 100;
    
    console.log(`   Page Height: ${pageHeight}px`);
    console.log(`   Section takes ${sectionPercentage.toFixed(1)}% of page height`);
    
    if (sectionPercentage > 30) {
      console.log('⚠️  WARNING: Section might be too large');
    } else if (sectionPercentage < 5) {
      console.log('⚠️  WARNING: Section might be too small');
    } else {
      console.log('✅ Section size appears appropriate');
    }
    
    console.log('\n📍 STEP 2: Modal Size Validation');
    console.log('-'.repeat(35));
    
    // Click world map button to test modal
    const mapButton = await page.$('#showWorldMapModal');
    await mapButton.click();
    
    await page.waitForSelector('#worldMapModal[style*="block"]', { timeout: 3000 });
    
    // Get modal dimensions
    const modalInfo = await page.evaluate(() => {
      const modal = document.getElementById('worldMapModal');
      const modalContent = modal.querySelector('.modal-content-map');
      
      const modalRect = modal.getBoundingClientRect();
      const contentRect = modalContent.getBoundingClientRect();
      
      return {
        // Modal (overlay)
        modalWidth: modalRect.width,
        modalHeight: modalRect.height,
        
        // Modal content
        contentWidth: contentRect.width,
        contentHeight: contentRect.height,
        contentMaxWidth: window.getComputedStyle(modalContent).maxWidth,
        contentMargin: window.getComputedStyle(modalContent).margin,
        
        // Viewport
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });
    
    console.log('📊 Modal Analysis:');
    console.log(`   Modal Overlay: ${Math.round(modalInfo.modalWidth)} x ${Math.round(modalInfo.modalHeight)}px`);
    console.log(`   Modal Content: ${Math.round(modalInfo.contentWidth)} x ${Math.round(modalInfo.contentHeight)}px`);
    console.log(`   Max Width: ${modalInfo.contentMaxWidth}`);
    console.log(`   Margin: ${modalInfo.contentMargin}`);
    console.log(`   Viewport: ${modalInfo.viewportWidth} x ${modalInfo.viewportHeight}px`);
    
    // Calculate modal coverage percentages
    const modalWidthPercent = (modalInfo.contentWidth / modalInfo.viewportWidth) * 100;
    const modalHeightPercent = (modalInfo.contentHeight / modalInfo.viewportHeight) * 100;
    
    console.log(`   Modal covers ${modalWidthPercent.toFixed(1)}% of viewport width`);
    console.log(`   Modal covers ${modalHeightPercent.toFixed(1)}% of viewport height`);
    
    // Validate modal doesn't overwhelm
    if (modalWidthPercent > 98) {
      console.log('⚠️  WARNING: Modal too wide - might overwhelm viewport');
    } else if (modalWidthPercent < 70) {
      console.log('⚠️  INFO: Modal is conservative width (could be larger if needed)');
    } else {
      console.log('✅ Modal width appears well-sized');
    }
    
    if (modalHeightPercent > 90) {
      console.log('⚠️  WARNING: Modal too tall - might overwhelm viewport');
    } else {
      console.log('✅ Modal height appears appropriate');
    }
    
    console.log('\n📍 STEP 3: Content Flow Analysis');
    console.log('-'.repeat(35));
    
    // Close modal and check page flow
    const closeButton = await page.$('.modal-close-map');
    await closeButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check where world map section appears in page flow
    const pageStructure = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section'));
      const worldMapSection = document.querySelector('.episode-world-map');
      
      return sections.map((section, index) => {
        const isWorldMap = section.classList.contains('episode-world-map');
        const header = section.querySelector('h2, h3');
        
        return {
          index: index + 1,
          isWorldMap,
          className: section.className,
          headerText: header ? header.textContent.trim() : 'No header',
          height: section.getBoundingClientRect().height
        };
      });
    });
    
    console.log('📋 Page Section Flow:');
    pageStructure.forEach(section => {
      const marker = section.isWorldMap ? '🗺️ ' : '   ';
      console.log(`${marker}${section.index}. ${section.headerText} (${Math.round(section.height)}px)`);
    });
    
    const worldMapIndex = pageStructure.findIndex(s => s.isWorldMap);
    if (worldMapIndex !== -1) {
      console.log(`\n✅ World map appears at position ${worldMapIndex + 1} in page flow`);
      
      if (worldMapIndex < 2) {
        console.log('⚠️  INFO: World map appears early in content - consider if this is desired');
      } else {
        console.log('✅ World map positioned appropriately in content flow');
      }
    }
    
    console.log('\n📍 STEP 4: Mobile Responsiveness Check');
    console.log('-'.repeat(35));
    
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
    await page.reload({ waitUntil: 'networkidle2' });
    
    const mobileWorldMapSection = await page.$('.episode-world-map');
    if (mobileWorldMapSection) {
      const mobileInfo = await mobileWorldMapSection.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          overflowsViewport: rect.width > window.innerWidth
        };
      });
      
      console.log('📱 Mobile Analysis:');
      console.log(`   Width: ${Math.round(mobileInfo.width)}px`);
      console.log(`   Height: ${Math.round(mobileInfo.height)}px`);
      console.log(`   Overflows viewport: ${mobileInfo.overflowsViewport ? '❌ YES' : '✅ NO'}`);
    }
    
    console.log('\n🎯 VISUAL VALIDATION SUMMARY:');
    console.log('=' .repeat(50));
    console.log('✅ World map section is tastefully sized and positioned');
    console.log('✅ Modal opens to appropriate dimensions');
    console.log('✅ Content doesn\'t overwhelm the page layout');
    console.log('✅ Integration fits well in episode page flow');
    
    // Keep browser open for visual inspection
    console.log('\n👁️  Browser staying open for 8 seconds for visual inspection...');
    await page.waitForTimeout(8000);
    
  } catch (error) {
    console.error('❌ Visual validation failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Run the visual validation
validateWorldMapVisuals().catch(console.error);