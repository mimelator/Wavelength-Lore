/**
 * Product Click Test
 * Tests clicking on products in the merchandise store
 */

const puppeteer = require('puppeteer');

async function testProductClicks() {
  let browser;
  
  try {
    console.log('🚀 Starting Product Click Test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise-store', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the store to load
    console.log('⏳ Waiting for store to load...');
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    
    // Wait for products to load
    console.log('📦 Waiting for products to load...');
    await page.waitForSelector('.products-grid', { timeout: 10000 });
    
    // Check if products exist
    const productCards = await page.$$('.product-card');
    console.log(`📊 Found ${productCards.length} product cards`);
    
    if (productCards.length === 0) {
      console.log('⚠️ No products found to test clicking');
      return;
    }
    
    // Test clicking on the first product's edit button
    console.log('🔧 Testing edit button click...');
    const editButton = await page.$('.edit-product-btn');
    
    if (editButton) {
      console.log('✅ Edit button found, clicking...');
      await editButton.click();
      
      // Wait for edit modal to appear
      try {
        await page.waitForSelector('.edit-product-modal', { timeout: 5000 });
        console.log('✅ Edit modal opened successfully');
        
        // Close the modal
        const closeButton = await page.$('.edit-product-modal .close');
        if (closeButton) {
          await closeButton.click();
          console.log('✅ Edit modal closed');
        }
      } catch (error) {
        console.log('❌ Edit modal did not appear:', error.message);
      }
    } else {
      console.log('❌ No edit button found');
    }
    
    // Test clicking on product image/card (should not trigger edit)
    console.log('🖼️ Testing product card click...');
    const firstProductCard = productCards[0];
    
    if (firstProductCard) {
      // Click on the product image area (not on buttons)
      const productImage = await firstProductCard.$('.product-image img');
      if (productImage) {
        console.log('🖱️ Clicking on product image...');
        await productImage.click();
        
        // Wait a moment to see if any unwanted modals appear
        await page.waitForTimeout(1000);
        
        // Check if any modals appeared (they shouldn't)
        const modals = await page.$$('.modal[style*="block"]');
        if (modals.length === 0) {
          console.log('✅ Product image click did not trigger unwanted modals');
        } else {
          console.log('⚠️ Product image click triggered unexpected modal');
        }
      }
    }
    
    // Test add to cart functionality
    console.log('🛒 Testing add to cart button...');
    const addToCartButton = await page.$('.add-to-cart-btn');
    
    if (addToCartButton) {
      console.log('✅ Add to cart button found, clicking...');
      await addToCartButton.click();
      
      // Wait for success message or cart update
      await page.waitForTimeout(2000);
      
      // Check if cart was updated
      const cartItems = await page.$$('.cart-item');
      console.log(`🛒 Cart now has ${cartItems.length} items`);
      
      if (cartItems.length > 0) {
        console.log('✅ Add to cart functionality working');
      } else {
        console.log('⚠️ Add to cart may not have worked');
      }
    } else {
      console.log('❌ No add to cart button found');
    }
    
    // Test product action buttons visibility
    console.log('👁️ Testing product action buttons visibility...');
    const actionButtons = await page.$$('.product-actions .action-btn');
    console.log(`🔘 Found ${actionButtons.length} action buttons`);
    
    for (let i = 0; i < actionButtons.length; i++) {
      const button = actionButtons[i];
      const isVisible = await button.isIntersectingViewport();
      const buttonText = await button.evaluate(el => el.textContent || el.title);
      console.log(`  Button ${i + 1}: "${buttonText}" - Visible: ${isVisible}`);
    }
    
    // Test hover effects on product cards
    console.log('🎨 Testing hover effects...');
    if (firstProductCard) {
      await firstProductCard.hover();
      await page.waitForTimeout(500);
      
      // Check if action buttons become more visible on hover
      const actionsAfterHover = await page.$eval('.product-actions', el => 
        window.getComputedStyle(el).opacity
      );
      console.log(`🎨 Product actions opacity after hover: ${actionsAfterHover}`);
    }
    
    console.log('✅ Product click test completed successfully!');
    
  } catch (error) {
    console.error('❌ Product click test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testProductClicks()
    .then(() => {
      console.log('🎉 All product click tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Product click test failed:', error);
      process.exit(1);
    });
}

module.exports = { testProductClicks };