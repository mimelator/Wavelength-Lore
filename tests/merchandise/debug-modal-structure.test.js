/**
 * Debug Modal Structure Test
 * 
 * Inspects the actual DOM structure of the customization modal
 * to identify correct selectors for the enhanced test.
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugModalStructure() {
  console.log('🔍 Starting Modal Structure Debug...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate and open modal
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.gallery-image-card', { timeout: 10000 });
    
    // Select image
    const imageCard = await page.waitForSelector('.gallery-image-card');
    const selectButton = await imageCard.$('.gallery-image-select');
    await selectButton.click();
    await wait(500);
    
    // Open modal
    await page.waitForSelector('#choose-product-section');
    const createButton = await page.waitForSelector('.select-product-type-btn');
    await createButton.click();
    
    await page.waitForSelector('.product-preview-modal');
    await wait(500);
    
    const confirmBtn = await page.waitForSelector('.confirm-preview-btn');
    await confirmBtn.click();
    await wait(500);
    
    await page.waitForSelector('.product-customization-modal');
    await wait(1000);
    
    // Debug modal structure
    const modalStructure = await page.evaluate(() => {
      const modal = document.querySelector('.product-customization-modal');
      if (!modal) return { error: 'Modal not found' };
      
      const structure = {
        modalHTML: modal.innerHTML.substring(0, 2000) + '...',
        allInputs: [],
        allButtons: [],
        allImages: [],
        allSelects: [],
        allDivs: []
      };
      
      // Find all inputs
      modal.querySelectorAll('input').forEach((input, i) => {
        structure.allInputs.push({
          index: i,
          id: input.id,
          type: input.type,
          className: input.className,
          name: input.name
        });
      });
      
      // Find all buttons
      modal.querySelectorAll('button').forEach((btn, i) => {
        structure.allButtons.push({
          index: i,
          id: btn.id,
          className: btn.className,
          text: btn.textContent.trim()
        });
      });
      
      // Find all images
      modal.querySelectorAll('img').forEach((img, i) => {
        structure.allImages.push({
          index: i,
          id: img.id,
          className: img.className,
          src: img.src.substring(0, 100) + '...',
          parentId: img.parentElement?.id,
          parentClass: img.parentElement?.className
        });
      });
      
      // Find all selects
      modal.querySelectorAll('select').forEach((select, i) => {
        structure.allSelects.push({
          index: i,
          id: select.id,
          className: select.className,
          name: select.name
        });
      });
      
      // Find key divs
      modal.querySelectorAll('div[id]').forEach((div, i) => {
        if (div.id) {
          structure.allDivs.push({
            index: i,
            id: div.id,
            className: div.className
          });
        }
      });
      
      return structure;
    });
    
    console.log('📋 MODAL STRUCTURE ANALYSIS:');
    console.log('=' .repeat(60));
    
    console.log('\n🖼️  IMAGES FOUND:');
    modalStructure.allImages.forEach(img => {
      console.log(`   ${img.index}: id="${img.id}" class="${img.className}"`);
      console.log(`      parent: id="${img.parentId}" class="${img.parentClass}"`);
      console.log(`      src: ${img.src}`);
    });
    
    console.log('\n🎛️  INPUTS FOUND:');
    modalStructure.allInputs.forEach(input => {
      console.log(`   ${input.index}: id="${input.id}" type="${input.type}" class="${input.className}"`);
    });
    
    console.log('\n📋 SELECTS FOUND:');
    modalStructure.allSelects.forEach(select => {
      console.log(`   ${select.index}: id="${select.id}" class="${select.className}"`);
    });
    
    console.log('\n🔘 BUTTONS FOUND:');
    modalStructure.allButtons.forEach(btn => {
      console.log(`   ${btn.index}: id="${btn.id}" class="${btn.className}" text="${btn.text}"`);
    });
    
    console.log('\n📦 KEY DIVS FOUND:');
    modalStructure.allDivs.forEach(div => {
      console.log(`   ${div.index}: id="${div.id}" class="${div.className}"`);
    });
    
    console.log('\n🔍 RECOMMENDED SELECTORS:');
    console.log('=' .repeat(40));
    
    // Recommend selectors based on findings
    const createBtn = modalStructure.allButtons.find(btn => 
      btn.text.toLowerCase().includes('create') || 
      btn.className.includes('create') ||
      btn.id.includes('create')
    );
    
    if (createBtn) {
      console.log(`✅ Create Button: #${createBtn.id} or .${createBtn.className.split(' ')[0]}`);
    } else {
      console.log('❌ Create Button: NOT FOUND');
    }
    
    const borderInputs = modalStructure.allInputs.filter(input => 
      input.id.toLowerCase().includes('border') ||
      input.className.toLowerCase().includes('border')
    );
    
    if (borderInputs.length > 0) {
      console.log('✅ Border Inputs:');
      borderInputs.forEach(input => {
        console.log(`   → #${input.id} (${input.type})`);
      });
    } else {
      console.log('❌ Border Inputs: NOT FOUND');
    }
    
    const borderSelects = modalStructure.allSelects.filter(select => 
      select.id.toLowerCase().includes('border') ||
      select.className.toLowerCase().includes('border')
    );
    
    if (borderSelects.length > 0) {
      console.log('✅ Border Selects:');
      borderSelects.forEach(select => {
        console.log(`   → #${select.id}`);
      });
    }
    
    if (modalStructure.allImages.length > 0) {
      console.log('✅ Image Selectors:');
      modalStructure.allImages.forEach(img => {
        if (img.id) {
          console.log(`   → #${img.id} img`);
        } else if (img.parentId) {
          console.log(`   → #${img.parentId} img`);
        }
      });
    } else {
      console.log('❌ Images: NOT FOUND');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run debug
debugModalStructure().catch(console.error);