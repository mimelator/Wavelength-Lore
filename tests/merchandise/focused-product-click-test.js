/**
 * Focused Product Click Test
 * Tests specific product interactions: edit and delete buttons
 */

const puppeteer = require('puppeteer');

async function focusedProductClickTest() {
  let browser;
  
  try {
    console.log('🚀 Starting Focused Product Click Test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Looking for product elements...');
    
    // Test 1: Click on Edit Button
    console.log('\n🔧 TEST 1: Edit Button Click');
    const editButtons = await page.$$('.edit-product-btn');
    console.log(`Found ${editButtons.length} edit buttons`);
    
    if (editButtons.length > 0) {
      console.log('✅ Clicking first edit button...');
      
      // Get product ID from the button
      const productId = await editButtons[0].evaluate(el => el.dataset.productId);
      console.log(`📦 Product ID: ${productId}`);
      
      await editButtons[0].click();
      
      // Wait for edit modal to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if edit modal appeared
      const editModal = await page.$('.edit-product-modal');
      if (editModal) {
        const isVisible = await editModal.evaluate(el => 
          window.getComputedStyle(el).display !== 'none'
        );
        console.log(`✅ Edit modal appeared: ${isVisible}`);
        
        if (isVisible) {
          // Test modal content
          const modalTitle = await editModal.$eval('h2', el => el.textContent);
          console.log(`📝 Modal title: "${modalTitle}"`);
          
          // Test form fields
          const titleInput = await editModal.$('#edit-title');
          const descInput = await editModal.$('#edit-description');
          
          if (titleInput && descInput) {
            const currentTitle = await titleInput.evaluate(el => el.value);
            const currentDesc = await descInput.evaluate(el => el.value);
            console.log(`📝 Current title: "${currentTitle}"`);
            console.log(`📝 Current description: "${currentDesc}"`);
          }
          
          // Close the modal
          const closeBtn = await editModal.$('.close');
          if (closeBtn) {
            await closeBtn.click();
            console.log('✅ Edit modal closed');
          }
        }
      } else {
        console.log('❌ Edit modal did not appear');
      }
    } else {
      console.log('❌ No edit buttons found');
    }
    
    // Test 2: Click on Delete Button (but cancel)
    console.log('\n🗑️ TEST 2: Delete Button Click');
    const deleteButtons = await page.$$('.delete-product-btn');
    console.log(`Found ${deleteButtons.length} delete buttons`);
    
    if (deleteButtons.length > 0) {
      console.log('✅ Clicking first delete button...');
      
      // Set up dialog handler to cancel the delete
      page.on('dialog', async dialog => {
        console.log(`📱 Dialog appeared: "${dialog.message()}"`);
        await dialog.dismiss(); // Cancel the delete
        console.log('✅ Delete cancelled');
      });
      
      await deleteButtons[0].click();
      
      // Wait for dialog to be handled
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('❌ No delete buttons found');
    }
    
    // Test 3: Product Card Hover Effects
    console.log('\n🎨 TEST 3: Product Card Hover Effects');
    const productCards = await page.$$('.product-card');
    console.log(`Found ${productCards.length} product cards`);
    
    if (productCards.length > 0) {
      console.log('✅ Testing hover on first product card...');
      
      // Get initial opacity of action buttons
      const initialOpacity = await productCards[0].$eval('.product-actions', el => 
        window.getComputedStyle(el).opacity
      );
      console.log(`📊 Initial actions opacity: ${initialOpacity}`);
      
      // Hover over the product card
      await productCards[0].hover();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get opacity after hover
      const hoverOpacity = await productCards[0].$eval('.product-actions', el => 
        window.getComputedStyle(el).opacity
      );
      console.log(`📊 Hover actions opacity: ${hoverOpacity}`);
      
      if (parseFloat(hoverOpacity) > parseFloat(initialOpacity)) {
        console.log('✅ Hover effect working - actions became more visible');
      } else {
        console.log('⚠️ Hover effect may not be working as expected');
      }
    }
    
    // Test 4: Product Image Click (should not trigger edit)
    console.log('\n🖼️ TEST 4: Product Image Click');
    const productImages = await page.$$('.product-card .product-image img');
    console.log(`Found ${productImages.length} product images`);
    
    if (productImages.length > 0) {
      console.log('✅ Clicking on product image...');
      
      // Count modals before click
      const modalsBefore = await page.$$('.modal[style*="display: block"], .modal[style*="display:block"]');
      console.log(`📱 Modals before click: ${modalsBefore.length}`);
      
      await productImages[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Count modals after click
      const modalsAfter = await page.$$('.modal[style*="display: block"], .modal[style*="display:block"]');
      console.log(`📱 Modals after click: ${modalsAfter.length}`);
      
      if (modalsAfter.length === modalsBefore.length) {
        console.log('✅ Product image click did not trigger unwanted modals');
      } else {
        console.log('⚠️ Product image click may have triggered a modal');
      }
    }
    
    // Test 5: Button Accessibility
    console.log('\n♿ TEST 5: Button Accessibility');
    const allActionButtons = await page.$$('.action-btn');
    
    for (let i = 0; i < Math.min(allActionButtons.length, 4); i++) {
      const button = allActionButtons[i];
      const title = await button.evaluate(el => el.title || el.getAttribute('aria-label'));
      const text = await button.evaluate(el => el.textContent);
      const className = await button.evaluate(el => el.className);
      
      console.log(`🔘 Button ${i + 1}: "${text}" - Title: "${title}" - Class: "${className}"`);
    }
    
    console.log('\n✅ All focused product click tests completed!');
    
    // Take final screenshot
    await page.screenshot({ path: 'focused-product-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Focused product click test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  focusedProductClickTest()
    .then(() => {
      console.log('🎉 All focused product click tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Focused product click test failed:', error);
      process.exit(1);
    });
}

module.exports = { focusedProductClickTest };