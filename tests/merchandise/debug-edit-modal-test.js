/**
 * Debug Edit Modal Test
 * Investigates why the edit modal isn't appearing
 */

const puppeteer = require('puppeteer');

async function debugEditModalTest() {
  let browser;
  
  try {
    console.log('🚀 Starting Debug Edit Modal Test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🌐 PAGE LOG:', msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if MerchandiseStore class is loaded
    console.log('🔍 Checking if MerchandiseStore is loaded...');
    const merchandiseStoreExists = await page.evaluate(() => {
      return typeof window.merchandiseStore !== 'undefined';
    });
    console.log(`📦 MerchandiseStore instance exists: ${merchandiseStoreExists}`);
    
    // Check if event listeners are set up
    console.log('🔍 Checking event listeners...');
    const hasEventListeners = await page.evaluate(() => {
      const editBtn = document.querySelector('.edit-product-btn');
      if (!editBtn) return 'No edit button found';
      
      // Try to get event listeners (this might not work in all browsers)
      return 'Edit button found, checking click handler...';
    });
    console.log(`👂 Event listeners: ${hasEventListeners}`);
    
    // Get the first edit button and its data
    const editButton = await page.$('.edit-product-btn');
    if (editButton) {
      const productId = await editButton.evaluate(el => el.dataset.productId);
      const buttonText = await editButton.evaluate(el => el.textContent.trim());
      const buttonClass = await editButton.evaluate(el => el.className);
      
      console.log(`🔘 Edit button details:`);
      console.log(`   Product ID: ${productId}`);
      console.log(`   Text: "${buttonText}"`);
      console.log(`   Classes: ${buttonClass}`);
      
      // Check if the product exists in the store's products array
      const productExists = await page.evaluate((id) => {
        if (typeof window.merchandiseStore === 'undefined') return 'Store not loaded';
        if (!window.merchandiseStore.products) return 'No products array';
        
        const product = window.merchandiseStore.products.find(p => p.id === id || p.productId === id);
        return product ? 'Product found' : 'Product not found';
      }, productId);
      console.log(`📦 Product in store: ${productExists}`);
      
      // Try clicking and monitor what happens
      console.log('🖱️ Clicking edit button and monitoring...');
      
      // Set up monitoring for modal creation
      await page.evaluate(() => {
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName.toLowerCase() === 'div' && arguments.length > 0) {
            console.log('🔨 Creating div element');
          }
          return element;
        };
      });
      
      // Click the button
      await editButton.click();
      
      // Wait and check for modal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check all modals
      const allModals = await page.$$('.modal');
      console.log(`📱 Total modals found: ${allModals.length}`);
      
      for (let i = 0; i < allModals.length; i++) {
        const modal = allModals[i];
        const className = await modal.evaluate(el => el.className);
        const id = await modal.evaluate(el => el.id);
        const display = await modal.evaluate(el => window.getComputedStyle(el).display);
        const innerHTML = await modal.evaluate(el => el.innerHTML.substring(0, 100));
        
        console.log(`📱 Modal ${i + 1}:`);
        console.log(`   ID: ${id}`);
        console.log(`   Class: ${className}`);
        console.log(`   Display: ${display}`);
        console.log(`   Content preview: ${innerHTML}...`);
      }
      
      // Check specifically for edit modal
      const editModal = await page.$('.edit-product-modal');
      if (editModal) {
        const isVisible = await editModal.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
          };
        });
        console.log(`✅ Edit modal found with styles:`, isVisible);
      } else {
        console.log('❌ Edit modal not found');
      }
      
      // Try to manually call the edit function
      console.log('🔧 Trying to manually call editProduct function...');
      const manualResult = await page.evaluate((id) => {
        if (typeof window.merchandiseStore === 'undefined') return 'Store not available';
        if (typeof window.merchandiseStore.editProduct !== 'function') return 'editProduct function not available';
        
        try {
          window.merchandiseStore.editProduct(id);
          return 'editProduct called successfully';
        } catch (error) {
          return `editProduct error: ${error.message}`;
        }
      }, productId);
      console.log(`🔧 Manual edit result: ${manualResult}`);
      
      // Wait a bit more and check again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalModalCheck = await page.$('.edit-product-modal');
      if (finalModalCheck) {
        const finalDisplay = await finalModalCheck.evaluate(el => window.getComputedStyle(el).display);
        console.log(`✅ Final modal check - Display: ${finalDisplay}`);
      } else {
        console.log('❌ Final modal check - Still not found');
      }
    } else {
      console.log('❌ No edit button found');
    }
    
    console.log('✅ Debug test completed!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  debugEditModalTest()
    .then(() => {
      console.log('🎉 Debug test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Debug test failed:', error);
      process.exit(1);
    });
}

module.exports = { debugEditModalTest };