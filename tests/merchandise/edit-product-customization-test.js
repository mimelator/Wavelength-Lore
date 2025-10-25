/**
 * Test Edit Product Customization Flow
 * Tests the new edit flow that opens the customization modal
 */

const puppeteer = require('puppeteer');

async function testEditProductCustomization() {
  console.log('🧪 Testing Edit Product Customization Flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    console.log('✅ Merchandise store loaded');
    
    // Check if there are existing products
    const existingProducts = await page.$$('.product-card');
    console.log(`📦 Found ${existingProducts.length} existing products`);
    
    if (existingProducts.length === 0) {
      console.log('⚠️ No existing products found. Creating a test product first...');
      
      // Select first image
      await page.waitForSelector('.gallery-image-select', { timeout: 5000 });
      await page.click('.gallery-image-select');
      console.log('✅ Selected first image');
      
      // Wait for product types to load
      await page.waitForSelector('.select-product-type-btn', { timeout: 5000 });
      
      // Click first product type
      await page.click('.select-product-type-btn');
      console.log('✅ Clicked product type');
      
      // Wait for customization modal
      await page.waitForSelector('#productCustomizationModal', { timeout: 5000 });
      
      // Click create product
      await page.click('#createProductBtn');
      console.log('✅ Creating test product...');
      
      // Wait for product creation to complete
      await page.waitForFunction(() => {
        const modal = document.querySelector('#productCustomizationModal');
        return !modal || modal.style.display === 'none';
      }, { timeout: 30000 });
      
      // Wait for new product to appear
      await page.waitForSelector('.product-card', { timeout: 10000 });
      console.log('✅ Test product created');
    }
    
    // Now test editing the first product
    console.log('🔧 Testing edit product functionality...');
    
    // Find and click edit button on first product
    await page.waitForSelector('.edit-product-btn', { timeout: 5000 });
    
    // Log product data before clicking edit
    const productData = await page.evaluate(() => {
      const productCard = document.querySelector('.product-card');
      const editBtn = productCard?.querySelector('.edit-product-btn');
      const productId = editBtn?.dataset.productId;
      
      // Check if merchandiseStore exists and has products
      if (window.merchandiseStore) {
        const product = window.merchandiseStore.products.find(p => (p.id || p.productId) === productId);
        return {
          productId,
          productExists: !!product,
          productTitle: product?.title,
          sourceImageId: product?.sourceImage?.id,
          sourceImageUrl: product?.sourceImage?.url,
          totalProducts: window.merchandiseStore.products.length,
          productTypesLoaded: !!window.merchandiseStore.productTypes,
          productTypesCount: Object.keys(window.merchandiseStore.productTypes || {}).length
        };
      }
      return { error: 'merchandiseStore not found' };
    });
    
    console.log('📊 Product data:', JSON.stringify(productData, null, 2));
    
    // Click edit button
    await page.click('.edit-product-btn');
    console.log('✅ Clicked edit button');
    
    // Check for errors in console
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait a moment to see if customization modal appears
    await page.waitForTimeout(2000);
    
    // Check if customization modal opened
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('#productCustomizationModal');
      return modal && modal.style.display !== 'none';
    });
    
    if (modalVisible) {
      console.log('✅ Customization modal opened successfully');
      
      // Check modal content
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('#productCustomizationModal');
        const title = modal?.querySelector('h2')?.textContent;
        const button = modal?.querySelector('#createProductBtn')?.textContent;
        return { title, button };
      });
      
      console.log('📋 Modal content:', modalContent);
      
      // Test updating border style
      await page.select('#borderStyleSelect', 'solid-thick');
      console.log('✅ Changed border style');
      
      // Test clicking update button
      await page.click('#createProductBtn');
      console.log('✅ Clicked update button');
      
      // Wait for update to complete
      await page.waitForFunction(() => {
        const modal = document.querySelector('#productCustomizationModal');
        return !modal || modal.style.display === 'none';
      }, { timeout: 30000 });
      
      console.log('✅ Product update completed');
      
    } else {
      console.log('❌ Customization modal did not open');
      
      // Check for error messages
      const errorMessages = await page.evaluate(() => {
        const toasts = Array.from(document.querySelectorAll('.toast'));
        return toasts.map(toast => toast.textContent);
      });
      
      console.log('🚨 Error messages:', errorMessages);
    }
    
    // Log any console errors
    if (consoleMessages.length > 0) {
      console.log('🚨 Console errors:', consoleMessages);
    }
    
    console.log('✅ Edit product customization test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/edit-product-test-error.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: edit-product-test-error.png');
  }
  
  // Keep browser open for manual inspection for 30 seconds
  console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('✅ Test completed and browser closed');
}

// Run the test
testEditProductCustomization().catch(console.error);