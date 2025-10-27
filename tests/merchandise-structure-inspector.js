/**
 * Simple Merchandise Store Structure Test
 * 
 * Check what elements are actually present on the merchandise page
 */

const puppeteer = require('puppeteer');

async function inspectMerchandiseStore() {
  console.log('🔍 Inspecting merchandise store structure...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for JavaScript to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const pageStructure = await page.evaluate(() => {
      const structure = {
        title: document.title,
        mainElements: {},
        classesFound: [],
        idsFound: [],
        textContent: {}
      };
      
      // Check for key elements
      const elementsToCheck = [
        'merchandise-store',
        'gallery-section', 
        'product-navigator-container',
        'category-cards-grid',
        'products-grid',
        'product-item',
        'category-card'
      ];
      
      elementsToCheck.forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        structure.mainElements[className] = {
          count: elements.length,
          visible: elements.length > 0 && elements[0].offsetParent !== null
        };
      });
      
      // Get all classes and IDs present
      document.querySelectorAll('*').forEach(el => {
        if (el.className) {
          el.className.split(' ').forEach(cls => {
            if (cls && !structure.classesFound.includes(cls)) {
              structure.classesFound.push(cls);
            }
          });
        }
        if (el.id && !structure.idsFound.includes(el.id)) {
          structure.idsFound.push(el.id);
        }
      });
      
      // Get some key text content
      const h1 = document.querySelector('h1');
      const mainContent = document.querySelector('#merchandise-store, .merchandise-store');
      
      structure.textContent.h1 = h1?.textContent?.trim() || 'No H1 found';
      structure.textContent.mainContent = mainContent?.textContent?.substring(0, 200) || 'No main content found';
      
      return structure;
    });
    
    console.log('\n📋 MERCHANDISE STORE STRUCTURE:');
    console.log('═══════════════════════════════════');
    console.log(`Page Title: ${pageStructure.title}`);
    console.log(`Main H1: ${pageStructure.textContent.h1}`);
    
    console.log('\n🎯 KEY ELEMENTS STATUS:');
    Object.entries(pageStructure.mainElements).forEach(([element, info]) => {
      const status = info.count > 0 ? (info.visible ? '✅ VISIBLE' : '⚠️ HIDDEN') : '❌ MISSING';
      console.log(`   .${element}: ${status} (${info.count} found)`);
    });
    
    console.log('\n📝 SAMPLE OF CLASSES FOUND:');
    pageStructure.classesFound
      .filter(cls => cls.includes('merchandise') || cls.includes('gallery') || cls.includes('product') || cls.includes('category'))
      .slice(0, 10)
      .forEach(cls => console.log(`   .${cls}`));
    
    console.log('\n📝 SAMPLE OF IDS FOUND:');
    pageStructure.idsFound
      .filter(id => id.includes('merchandise') || id.includes('gallery') || id.includes('product'))
      .slice(0, 5)
      .forEach(id => console.log(`   #${id}`));
    
    console.log('\n📄 MAIN CONTENT PREVIEW:');
    console.log(`"${pageStructure.textContent.mainContent}..."`);
    
    await page.screenshot({ path: 'merchandise-store-structure.png', fullPage: true });
    console.log('\n📸 Screenshot saved: merchandise-store-structure.png');
    
  } catch (error) {
    console.error('❌ Inspection failed:', error);
  } finally {
    await browser.close();
  }
}

inspectMerchandiseStore().catch(console.error);