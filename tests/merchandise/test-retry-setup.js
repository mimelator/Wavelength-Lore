/**
 * Test Retry Setup Functionality
 */

const puppeteer = require('puppeteer');

async function testRetrySetup() {
  console.log('🧪 Testing Retry Setup Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture console messages and network requests
  const consoleMessages = [];
  const networkRequests = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('request', request => {
    if (request.url().includes('/api/merchandise/')) {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        postData: request.postData()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/merchandise/')) {
      networkRequests.push({
        type: 'response',
        status: response.status(),
        url: response.url()
      });
    }
  });
  
  try {
    // Navigate to merchandise
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    console.log('✅ Page loaded');
    
    // Check if there are incomplete products
    const incompleteProducts = await page.$$('.incomplete-product');
    console.log(`📦 Found ${incompleteProducts.length} incomplete products`);
    
    if (incompleteProducts.length === 0) {
      console.log('⚠️ No incomplete products found - cannot test retry setup');
      return;
    }
    
    // Check if retry button exists
    const retryButton = await page.$('.retry-setup-btn');
    console.log(`🔧 Retry button exists: ${!!retryButton}`);
    
    if (!retryButton) {
      console.log('❌ Retry setup button not found');
      return;
    }
    
    // Get product ID before clicking
    const productId = await page.evaluate(() => {
      const btn = document.querySelector('.retry-setup-btn');
      return btn ? btn.dataset.productId : null;
    });
    
    console.log(`🎯 Testing retry setup for product: ${productId}`);
    
    // Click retry setup button
    console.log('🔧 Clicking retry setup button...');
    await page.click('.retry-setup-btn');
    
    // Wait for confirmation dialog
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      console.log(`📋 Dialog appeared: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Wait for API call to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for success/error messages
    const successToasts = await page.$$eval('.toast-success', toasts => 
      toasts.map(t => t.textContent)
    );
    
    const errorToasts = await page.$$eval('.toast-error', toasts => 
      toasts.map(t => t.textContent)
    );
    
    console.log('📝 Results:');
    console.log(`  Success messages: ${successToasts.length > 0 ? successToasts : 'None'}`);
    console.log(`  Error messages: ${errorToasts.length > 0 ? errorToasts : 'None'}`);
    
    // Check if product status changed
    const productStillIncomplete = await page.evaluate((pid) => {
      const incompleteSection = document.querySelector('.incomplete-products-section');
      if (!incompleteSection) return false;
      
      const productCards = incompleteSection.querySelectorAll('.incomplete-product');
      for (const card of productCards) {
        const btn = card.querySelector('.retry-setup-btn');
        if (btn && btn.dataset.productId === pid) {
          return true; // Still in incomplete section
        }
      }
      return false; // Moved to complete section or removed
    }, productId);
    
    console.log(`📊 Product ${productId} still incomplete: ${productStillIncomplete}`);
    
    // Log network activity
    console.log('🌐 Network requests:');
    networkRequests.forEach(req => {
      if (req.type === 'response') {
        console.log(`  Response: ${req.status} ${req.url}`);
      } else {
        console.log(`  ${req.method} ${req.url}`);
      }
    });
    
    // Log relevant console messages
    console.log('📝 Console messages (last 10):');
    consoleMessages.slice(-10).forEach(msg => console.log(`  ${msg}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Test completed');
  }
}

testRetrySetup().catch(console.error);