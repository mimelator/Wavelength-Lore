/**
 * Debug Edit Product Flow - Quick Test
 */

const puppeteer = require('puppeteer');

async function debugEditProduct() {
  console.log('🧪 Debug Edit Product Flow...');
  
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
    
    if (productCount > 0) {
      // Try to click edit on first product
      console.log('🔧 Clicking edit button...');
      await page.click('.edit-product-btn');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check what happened
      const modalExists = await page.$('#productCustomizationModal');
      const modalVisible = modalExists ? await page.evaluate(el => el.style.display !== 'none', modalExists) : false;
      
      console.log(`📋 Modal exists: ${!!modalExists}, visible: ${modalVisible}`);
      
      // Check for error toasts
      const errorToasts = await page.$$eval('.toast-error', toasts => 
        toasts.map(t => t.textContent)
      );
      
      if (errorToasts.length > 0) {
        console.log('🚨 Error toasts:', errorToasts);
      }
    } else {
      console.log('⚠️ No products found to edit');
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

debugEditProduct().catch(console.error);