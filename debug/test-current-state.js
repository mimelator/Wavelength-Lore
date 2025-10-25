const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else if (msg.text().includes('MerchandiseStore')) {
      console.log('🛍️', msg.text());
    }
  });
  
  try {
    console.log('🚀 Testing current merchandise store state...');
    
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if MerchandiseStore is defined
    const storeExists = await page.evaluate(() => {
      return typeof window.merchandiseStore !== 'undefined';
    });
    
    console.log('🛍️ MerchandiseStore exists:', storeExists);
    
    // Check for preview buttons
    const previewButtons = await page.$$('.preview-product-btn');
    console.log('👁️ Preview buttons found:', previewButtons.length);
    
    // Check for edit buttons
    const editButtons = await page.$$('.edit-product-btn');
    console.log('✏️ Edit buttons found:', editButtons.length);
    
    // Check for product cards
    const productCards = await page.$$('.product-card');
    console.log('📦 Product cards found:', productCards.length);
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();