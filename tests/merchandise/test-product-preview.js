/**
 * Test Product Preview Functionality
 */

const puppeteer = require('puppeteer');

async function testProductPreview() {
  console.log('🧪 Testing Product Preview Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  try {
    // Navigate to merchandise
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    console.log('✅ Page loaded');
    
    // Check if products exist
    const productCount = await page.$$eval('.product-card', cards => cards.length);
    console.log(`📦 Found ${productCount} products`);
    
    if (productCount === 0) {
      console.log('⚠️ No products found - cannot test preview');
      return;
    }
    
    // Check if preview button exists
    const previewButtonExists = await page.$('.preview-product-btn');
    console.log(`👁️ Preview button exists: ${!!previewButtonExists}`);
    
    if (!previewButtonExists) {
      console.log('❌ Preview button not found in DOM');
      
      // Check what buttons do exist
      const existingButtons = await page.$$eval('.product-actions button', buttons => 
        buttons.map(btn => ({
          class: btn.className,
          title: btn.title,
          innerHTML: btn.innerHTML
        }))
      );
      console.log('🔍 Existing buttons:', existingButtons);
      return;
    }
    
    // Click preview button
    console.log('👁️ Clicking preview button...');
    await page.click('.preview-product-btn');
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if modal opened
    const modalExists = await page.$('.product-preview-modal');
    const modalVisible = modalExists ? await page.evaluate(el => el.style.display !== 'none', modalExists) : false;
    
    console.log(`📋 Preview modal exists: ${!!modalExists}, visible: ${modalVisible}`);
    
    if (modalExists && modalVisible) {
      // Check modal content
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('.product-preview-modal');
        const title = modal?.querySelector('h2')?.textContent;
        const mainImage = modal?.querySelector('#mainPreviewImage')?.src;
        const variantCount = modal?.querySelectorAll('.variant-card').length;
        const thumbnailCount = modal?.querySelectorAll('.preview-thumb').length;
        
        return {
          title,
          mainImage,
          variantCount,
          thumbnailCount,
          hasMainImage: !!modal?.querySelector('#mainPreviewImage'),
          hasVariants: !!modal?.querySelector('.variants-grid')
        };
      });
      
      console.log('📋 Modal content:', modalContent);
      
      // Test variant selection
      const variantButtons = await page.$$('.select-variant-btn');
      console.log(`🎯 Found ${variantButtons.length} variant buttons`);
      
      if (variantButtons.length > 0) {
        console.log('🛒 Testing variant selection...');
        await page.click('.select-variant-btn');
        
        // Check if modal closed and item added to cart
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const modalStillVisible = await page.evaluate(() => {
          const modal = document.querySelector('.product-preview-modal');
          return modal && modal.style.display !== 'none';
        });
        
        console.log(`🛒 Modal closed after variant selection: ${!modalStillVisible}`);
      }
      
    } else {
      console.log('❌ Preview modal did not open properly');
      
      // Check for error messages
      const errorToasts = await page.$$eval('.toast-error', toasts => 
        toasts.map(t => t.textContent)
      );
      
      if (errorToasts.length > 0) {
        console.log('🚨 Error toasts:', errorToasts);
      }
    }
    
    // Log console messages
    console.log('📝 Console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Test completed');
  }
}

testProductPreview().catch(console.error);