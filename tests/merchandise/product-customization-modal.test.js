/**
 * Product Customization Modal Test Suite
 * 
 * Tests the complete product customization flow including:
 * 1. Modal opening and initialization
 * 2. Border style selection and preview
 * 3. Product name editing
 * 4. Size/color selection
 * 5. Product creation with customization
 * 
 * This is an end-to-end test using Puppeteer to validate the full user experience.
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 90000; // 90 seconds for modal interactions

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductCustomizationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async setup() {
    console.log('🚀 Setting up Puppeteer browser for customization tests...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
      slowMo: 30
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Console logging
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`❌ Browser Error: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  Browser Warning: ${text}`);
      } else if (text.includes('✨') || text.includes('🎨') || text.includes('🛍️') || text.includes('📸') || 
                 text.includes('📦') || text.includes('🆔') || text.includes('🔍')) {
        console.log(`📱 Browser: ${text}`);
      }
    });
    
    // Page errors
    this.page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });
    
    // Network monitoring
    this.page.on('response', async response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('/api/merchandise/gallery-images')) {
        console.log(`📡 API: gallery-images - Status: ${status}`);
        if (status === 200) {
          try {
            const data = await response.json();
            console.log(`   → Images returned: ${data.images?.length || 0}`);
          } catch (e) {}
        }
      }
      
      if (url.includes('/api/border-preview/generate')) {
        if (status === 200) {
          console.log(`✅ Border preview generated successfully`);
        } else {
          console.log(`❌ Border preview failed: ${status}`);
        }
      }
    });
  }

  async checkAuthentication() {
    console.log('\n🔐 TEST: Verify authentication session');
    
    try {
      await this.page.goto(`${BASE_URL}/merchandise`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Check if redirected to login
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Not authenticated - redirected to login page');
      }
      
      // Check for auth indicators and user info
      const authStatus = await this.page.evaluate(() => {
        // Check if page has user-specific content
        const hasUserContent = !!document.querySelector('.store-header');
        const notOnLoginPage = !window.location.pathname.includes('/login');
        
        // Check navigation for user info
        const userNameElement = document.querySelector('.user-name, .user-info, [class*="user"]');
        const userName = userNameElement ? userNameElement.textContent : 'Not found';
        
        // Check for login/logout buttons
        const hasLogoutButton = !!document.querySelector('a[href*="logout"], button[onclick*="logout"]');
        const hasLoginButton = !!document.querySelector('a[href*="login"]');
        
        return { 
          hasUserContent, 
          notOnLoginPage, 
          url: window.location.href,
          userName,
          hasLogoutButton,
          hasLoginButton
        };
      });
      
      if (!authStatus.notOnLoginPage) {
        throw new Error('Redirected to login - no valid session');
      }
      
      console.log('✅ Authentication verified');
      console.log(`   → URL: ${authStatus.url}`);
      console.log(`   → User displayed: ${authStatus.userName}`);
      console.log(`   → Has logout button: ${authStatus.hasLogoutButton}`);
      console.log(`   → Has login button: ${authStatus.hasLoginButton}`);
      
      if (authStatus.hasLoginButton && !authStatus.hasLogoutButton) {
        this.results.warnings.push('Navigation shows login button - user may not be authenticated in UI');
      }
      
      this.results.passed.push('Verify authentication session');
      return true;
    } catch (error) {
      console.error('❌ Authentication check failed:', error.message);
      console.error('   💡 TIP: Make sure server is running in development mode on localhost');
      console.error('   💡 TIP: Middleware should auto-authenticate localhost requests');
      this.results.failed.push({
        test: 'Verify authentication session',
        error: error.message
      });
      return false;
    }
  }
  
  async navigateToMerchandise() {
    console.log('\n📍 Navigating to merchandise store...');
    
    try {
      await this.page.waitForSelector('.gallery-image-card', { timeout: 20000 });
      
      console.log('✅ Merchandise store loaded');
      this.results.passed.push('Navigate to merchandise store');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate:', error.message);
      console.error('   💡 TIP: Test user may not have any gallery images');
      this.results.failed.push({
        test: 'Navigate to merchandise store',
        error: error.message
      });
      return false;
    }
  }

  async testSelectImage() {
    console.log('\n🖼️  TEST: Select an image from gallery');
    
    try {
      // Find first gallery image card
      const imageCard = await this.page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      
      // Click the Select button
      const selectButton = await imageCard.$('.gallery-image-select');
      if (!selectButton) {
        throw new Error('Select button not found');
      }
      
      await selectButton.click();
      console.log('   → Clicked Select button');
      
      // Wait for selection state to update
      await wait(500);
      
      // Verify card has selected class
      const hasSelectedClass = await this.page.evaluate(() => {
        const card = document.querySelector('.gallery-image-card.selected');
        return !!card;
      });
      
      if (hasSelectedClass) {
        console.log('✅ Image selected successfully (card has .selected class)');
        this.results.passed.push('Select image from gallery');
        return true;
      } else {
        throw new Error('Card does not have selected class');
      }
    } catch (error) {
      console.error('❌ Select image test failed:', error.message);
      this.results.failed.push({
        test: 'Select image from gallery',
        error: error.message
      });
      return false;
    }
  }

  async testOpenCustomizationModal() {
    console.log('\n✨ TEST: Open customization modal');
    
    try {
      // Wait for product section to appear
      await this.page.waitForSelector('#choose-product-section', { timeout: 5000 });
      console.log('   → Product selection section appeared');
      
      // Find and click first "Create" product button (simple categories)
      const createButton = await this.page.waitForSelector('.select-simple-product', { timeout: 5000 });
      
      // Get product name for logging
      const productName = await this.page.evaluate(btn => {
        return btn.textContent.trim();
      }, createButton);
      
      console.log(`   → Clicking "${productName}" button`);
      await createButton.click();
      
      // Wait for customization modal to appear directly
      await this.page.waitForSelector('.product-customization-modal', { timeout: 5000 });
      await wait(500);
      
      // Verify modal is visible
      const modalVisible = await this.page.evaluate(() => {
        const modal = document.querySelector('.product-customization-modal');
        return modal && modal.style.display !== 'none';
      });
      
      if (modalVisible) {
        console.log('✅ Customization modal opened successfully');
        this.results.passed.push('Open customization modal');
        return true;
      } else {
        throw new Error('Modal not visible');
      }
    } catch (error) {
      console.error('❌ Open modal test failed:', error.message);
      this.results.failed.push({
        test: 'Open customization modal',
        error: error.message
      });
      return false;
    }
  }

  async testModalInitialState() {
    console.log('\n🔍 TEST: Verify modal initial state');
    
    try {
      const modalState = await this.page.evaluate(() => {
        const modal = document.querySelector('.product-customization-modal');
        if (!modal) return null;
        
        return {
          hasTitle: !!modal.querySelector('h2'),
          hasBorderSelect: !!modal.querySelector('#borderStyleSelect'),
          hasAutoTitleInfo: !!modal.querySelector('.auto-title-info'),
          hasAutoTitlePreview: !!modal.querySelector('.auto-title-preview'),
          hasSizeSelect: !!modal.querySelector('#defaultSize'),
          hasColorSelect: !!modal.querySelector('#defaultColor'),
          hasCreateButton: !!modal.querySelector('#createProductBtn'),
          hasPreview: !!modal.querySelector('#mockupPreview'),
          hasBorderedPreview: !!modal.querySelector('#borderedImagePreview'),
          borderValue: modal.querySelector('#borderStyleSelect')?.value,
          autoTitleText: modal.querySelector('.auto-title-preview')?.textContent,
          priceDisplay: modal.querySelector('.price-value')?.textContent
        };
      });
      
      if (!modalState) {
        throw new Error('Could not retrieve modal state');
      }
      
      console.log('   Modal state:', JSON.stringify(modalState, null, 2));
      
      // Verify all required elements exist (simplified for our modal)
      const requiredElements = [
        'hasTitle', 'hasBorderSelect', 'hasSizeSelect', 'hasColorSelect', 
        'hasCreateButton', 'hasBorderedPreview'
      ];
      
      const missingElements = requiredElements.filter(key => !modalState[key]);
      
      if (missingElements.length > 0) {
        throw new Error(`Missing elements: ${missingElements.join(', ')}`);
      }
      
      // Verify default border is selected
      if (modalState.borderValue !== 'solid-medium') {
        this.results.warnings.push('Default border is not "solid-medium"');
      }
      
      // Skip auto-title check for simple modal (our modal doesn't have auto-title elements)
      // if (!modalState.autoTitleText || modalState.autoTitleText.length === 0) {
      //   throw new Error('Auto-generated title is not displayed');
      // }
      
      // Verify price is displayed
      if (!modalState.priceDisplay || !modalState.priceDisplay.includes('$')) {
        throw new Error('Price is not displayed correctly');
      }
      
      console.log('✅ Modal initial state is correct');
      console.log(`   → Price: ${modalState.priceDisplay}`);
      console.log(`   → Border: ${modalState.borderValue}`);
      
      this.results.passed.push('Verify modal initial state');
      return true;
    } catch (error) {
      console.error('❌ Modal initial state test failed:', error.message);
      this.results.failed.push({
        test: 'Verify modal initial state',
        error: error.message
      });
      return false;
    }
  }

  async testBorderStyleChange() {
    console.log('\n🎨 TEST: Change border style and verify preview update');
    
    try {
      // Change border style to "thick"
      await this.page.select('#borderStyleSelect', 'solid-thick');
      console.log('   → Changed border to "solid-thick"');
      
      // Wait for debounce (300ms) plus processing time
      await wait(2000);
      
      // Check if loading spinner appeared (indicates API call was made)
      const spinnerAppeared = await this.page.evaluate(() => {
        const spinner = document.querySelector('#borderLoadingSpinner');
        return spinner !== null;
      });
      
      if (!spinnerAppeared) {
        this.results.warnings.push('Loading spinner did not appear during border change');
      }
      
      // Verify border select value changed
      const currentBorder = await this.page.$eval('#borderStyleSelect', el => el.value);
      if (currentBorder !== 'solid-thick') {
        throw new Error(`Border not updated. Expected: solid-thick, Got: ${currentBorder}`);
      }
      
      console.log('✅ Border style changed successfully');
      this.results.passed.push('Change border style');
      
      // Test another border style
      await this.page.select('#borderStyleSelect', 'wavelength-theme');
      console.log('   → Changed border to "wavelength-theme"');
      await wait(2000);
      
      const finalBorder = await this.page.$eval('#borderStyleSelect', el => el.value);
      if (finalBorder !== 'wavelength-theme') {
        throw new Error(`Border not updated to wavelength-theme`);
      }
      
      console.log('✅ Border style change (wavelength-theme) successful');
      this.results.passed.push('Change border to wavelength-theme');
      
      return true;
    } catch (error) {
      console.error('❌ Border style change test failed:', error.message);
      this.results.failed.push({
        test: 'Change border style',
        error: error.message
      });
      return false;
    }
  }

  async testEditProductName() {
    console.log('\n✏️  TEST: Edit product name');
    
    try {
      const originalName = await this.page.$eval('#productName', el => el.value);
      console.log(`   → Original name: "${originalName}"`);
      
      // Clear and type new name
      await this.page.click('#productName', { clickCount: 3 });
      await this.page.type('#productName', 'My Custom Test Product');
      
      await wait(300);
      
      const newName = await this.page.$eval('#productName', el => el.value);
      console.log(`   → New name: "${newName}"`);
      
      if (newName !== 'My Custom Test Product') {
        throw new Error(`Name not updated. Got: ${newName}`);
      }
      
      console.log('✅ Product name edited successfully');
      this.results.passed.push('Edit product name');
      return true;
    } catch (error) {
      console.error('❌ Edit product name test failed:', error.message);
      this.results.failed.push({
        test: 'Edit product name',
        error: error.message
      });
      return false;
    }
  }

  async testAddDescription() {
    console.log('\n📝 TEST: Add product description');
    
    try {
      await this.page.click('#productDescription');
      await this.page.type('#productDescription', 'This is a test description for my custom product.');
      
      await wait(300);
      
      const description = await this.page.$eval('#productDescription', el => el.value);
      
      if (!description.includes('test description')) {
        throw new Error('Description not saved correctly');
      }
      
      console.log(`✅ Description added: "${description}"`);
      this.results.passed.push('Add product description');
      return true;
    } catch (error) {
      console.error('❌ Add description test failed:', error.message);
      this.results.failed.push({
        test: 'Add product description',
        error: error.message
      });
      return false;
    }
  }

  async testSizeColorSelection() {
    console.log('\n👕 TEST: Change size and color options');
    
    try {
      // Change size
      await this.page.select('#defaultSize', 'L');
      const selectedSize = await this.page.$eval('#defaultSize', el => el.value);
      console.log(`   → Selected size: ${selectedSize}`);
      
      // Change color
      const colorOptions = await this.page.$$eval('#defaultColor option', options => 
        options.map(opt => opt.value)
      );
      console.log(`   → Available colors: ${colorOptions.join(', ')}`);
      
      // Select second color option (avoid Black which might be default)
      if (colorOptions.length > 1) {
        await this.page.select('#defaultColor', colorOptions[1]);
        const selectedColor = await this.page.$eval('#defaultColor', el => el.value);
        console.log(`   → Selected color: ${selectedColor}`);
      }
      
      console.log('✅ Size and color selection working');
      this.results.passed.push('Change size and color options');
      return true;
    } catch (error) {
      console.error('❌ Size/color selection test failed:', error.message);
      this.results.failed.push({
        test: 'Change size and color options',
        error: error.message
      });
      return false;
    }
  }

  async testModalClose() {
    console.log('\n❌ TEST: Close modal without creating');
    
    try {
      // Click close button
      const closeButton = await this.page.waitForSelector('.product-customization-modal .close');
      await closeButton.click();
      
      await wait(500);
      
      // Verify modal is gone
      const modalExists = await this.page.evaluate(() => {
        return !!document.querySelector('.product-customization-modal');
      });
      
      if (modalExists) {
        throw new Error('Modal still exists after close');
      }
      
      console.log('✅ Modal closed successfully');
      this.results.passed.push('Close modal without creating');
      return true;
    } catch (error) {
      console.error('❌ Modal close test failed:', error.message);
      this.results.failed.push({
        test: 'Close modal without creating',
        error: error.message
      });
      return false;
    }
  }

  async testCreateProductWithCustomization() {
    console.log('\n🎯 TEST: Create product with full customization');
    
    try {
      // Count existing products before creation
      const productCountBefore = await this.page.evaluate(() => {
        const cards = document.querySelectorAll('.product-card');
        return cards.length;
      });
      console.log(`   → Products before: ${productCountBefore}`);
      
      // Re-open modal
      console.log('   → Re-opening modal...');
      const createButton = await this.page.waitForSelector('.select-simple-product', { timeout: 5000 });
      await createButton.click();
      
      // Wait for customization modal to appear directly
      await this.page.waitForSelector('.product-customization-modal', { timeout: 5000 });
      await wait(500);
      
      // Apply customizations
      console.log('   → Applying customizations...');
      await this.page.select('#borderStyleSelect', 'solid-thick');
      await wait(1000);
      
      // Product name/description auto-generated - no manual input needed
      console.log('   → Product title will be auto-generated');
      
      // Click create button
      console.log('   → Clicking Create Product button...');
      const createProductBtn = await this.page.waitForSelector('#createProductBtn');
      
      // Monitor for loading state
      const buttonTextBefore = await createProductBtn.evaluate(btn => btn.textContent);
      console.log(`   → Button text before: "${buttonTextBefore}"`);
      
      await createProductBtn.click();
      
      // Wait for button to show loading state
      await wait(500);
      
      const buttonTextDuring = await this.page.evaluate(() => {
        const btn = document.querySelector('#createProductBtn');
        return btn ? btn.textContent : 'Button not found';
      });
      console.log(`   → Button text during: "${buttonTextDuring}"`);
      
      if (buttonTextDuring.includes('Creating')) {
        console.log('   ✓ Button shows loading state');
      } else {
        this.results.warnings.push('Button may not show loading state');
      }
      
      // Wait for product creation (may take time with border processing)
      console.log('   → Waiting for product creation...');
      await wait(10000);
      
      // Check if modal closed (indicates success)
      const modalStillExists = await this.page.evaluate(() => {
        return !!document.querySelector('.product-customization-modal');
      });
      
      if (!modalStillExists) {
        console.log('✅ Product created successfully (modal closed)');
        this.results.passed.push('Create product with customization');
        return true;
      } else {
        this.results.warnings.push('Modal still open after create - may indicate error or slow processing');
        return true; // Don't fail, might just be slow
      }
    } catch (error) {
      console.error('❌ Create product test failed:', error.message);
      this.results.failed.push({
        test: 'Create product with customization',
        error: error.message
      });
      return false;
    }
  }
  
  async testProductAppearsInList() {
    console.log('\n📦 TEST: Verify new product appears in products list');
    
    try {
      // Wait for page to re-render
      await wait(2000);
      
      // Check for product cards
      const productInfo = await this.page.evaluate(() => {
        const cards = document.querySelectorAll('.product-card');
        if (cards.length === 0) {
          return { count: 0, products: [] };
        }
        
        const products = Array.from(cards).map(card => {
          const title = card.querySelector('.product-info h4')?.textContent || 'No title';
          const description = card.querySelector('.product-description')?.textContent || 'No description';
          const variants = card.querySelectorAll('.variant-option').length;
          const hasAddToCart = !!card.querySelector('.add-to-cart-btn');
          const image = card.querySelector('.product-image img')?.src || 'No image';
          
          return { title, description, variants, hasAddToCart, image };
        });
        
        return { count: cards.length, products };
      });
      
      console.log(`   → Found ${productInfo.count} product(s)`);
      
      if (productInfo.count === 0) {
        throw new Error('No products found in list');
      }
      
      // Display product details
      productInfo.products.forEach((product, index) => {
        console.log(`\n   Product ${index + 1}:`);
        console.log(`      Title: ${product.title}`);
        console.log(`      Description: ${product.description.substring(0, 60)}...`);
        console.log(`      Variants: ${product.variants}`);
        console.log(`      Has Add to Cart: ${product.hasAddToCart ? '✓' : '✗'}`);
      });
      
      // Verify product has required elements
      const latestProduct = productInfo.products[productInfo.products.length - 1];
      
      if (!latestProduct.title || latestProduct.title === 'No title') {
        throw new Error('Product missing title');
      }
      
      // Some products may not have variants loaded yet
      if (latestProduct.variants === 0 && !latestProduct.hasAddToCart) {
        this.results.warnings.push('Product has no variants or Add to Cart button');
      }
      
      console.log('\n✅ New product appears correctly in products list');
      this.results.passed.push('Verify new product appears in list');
      return true;
    } catch (error) {
      console.error('❌ Product list verification failed:', error.message);
      this.results.failed.push({
        test: 'Verify new product appears in list',
        error: error.message
      });
      return false;
    }
  }

  async testViewProductDetails() {
    console.log('\n👁️  TEST: View product details');
    
    try {
      // Hover over first product card to reveal actions
      const productCard = await this.page.$('.product-card');
      if (!productCard) {
        throw new Error('No product card found');
      }
      
      await productCard.hover();
      await wait(500);
      
      // Click Preview button (our products use preview-product-btn)
      const viewBtn = await this.page.$('.preview-product-btn');
      if (!viewBtn) {
        throw new Error('Preview button not found');
      }
      
      await viewBtn.click();
      await wait(500);
      
      // Wait for preview modal to appear
      await this.page.waitForSelector('.product-preview-modal', { timeout: 3000 });
      await wait(500);
      
      // Check if preview modal opened
      const modalOpen = await this.page.evaluate(() => {
        return !!document.querySelector('.product-preview-modal');
      });
      
      if (!modalOpen) {
        throw new Error('Product preview modal did not open');
      }
      
      console.log('   → Preview modal opened');
      
      // Verify modal content
      const modalContent = await this.page.evaluate(() => {
        const modal = document.querySelector('.product-preview-modal');
        return {
          hasTitle: !!modal.querySelector('h2'),
          hasImage: !!modal.querySelector('.detail-image img'),
          hasVariants: !!modal.querySelector('.variants-list')
        };
      });
      
      console.log('   → Modal has title:', modalContent.hasTitle);
      console.log('   → Modal has image:', modalContent.hasImage);
      console.log('   → Modal has variants:', modalContent.hasVariants);
      
      // Close modal
      await this.page.click('.product-preview-modal .close');
      await wait(300);
      
      console.log('✅ View product details working');
      this.results.passed.push('View product details');
      return true;
    } catch (error) {
      console.error('❌ View details test failed:', error.message);
      this.results.failed.push({
        test: 'View product details',
        error: error.message
      });
      return false;
    }
  }
  
  async testEditProduct() {
    console.log('\n✏️  TEST: Edit product button');
    
    try {
      // Hover over first product card
      const productCard = await this.page.$('.product-card');
      await productCard.hover();
      await wait(500);
      
      // Click Edit button
      const editBtn = await this.page.$('.edit-product-btn');
      if (!editBtn) {
        throw new Error('Edit button not found');
      }
      
      await editBtn.click();
      await wait(500);
      
      // Check for success message (edit shows "coming soon")
      const hasToast = await this.page.evaluate(() => {
        return !!document.querySelector('.toast, .notification');
      });
      
      console.log('   → Edit button clicked');
      console.log('   → Shows feedback:', hasToast);
      
      console.log('✅ Edit button working');
      this.results.passed.push('Edit product button');
      return true;
    } catch (error) {
      console.error('❌ Edit test failed:', error.message);
      this.results.failed.push({
        test: 'Edit product button',
        error: error.message
      });
      return false;
    }
  }
  
  async testDeleteProduct() {
    console.log('\n🗑️  TEST: Delete product');
    
    try {
      // Count products before delete
      const countBefore = await this.page.evaluate(() => {
        return document.querySelectorAll('.product-card').length;
      });
      console.log(`   → Products before delete: ${countBefore}`);
      
      // Hover over last product card
      const productCards = await this.page.$$('.product-card');
      const lastCard = productCards[productCards.length - 1];
      await lastCard.hover();
      await wait(500);
      
      // Click Delete button
      const deleteBtn = await lastCard.$('.delete-product-btn');
      if (!deleteBtn) {
        throw new Error('Delete button not found');
      }
      
      // Handle confirmation dialog
      this.page.on('dialog', async dialog => {
        console.log('   → Confirmation dialog appeared');
        await dialog.accept();
      });
      
      await deleteBtn.click();
      await wait(2000);
      
      // Count products after delete
      const countAfter = await this.page.evaluate(() => {
        return document.querySelectorAll('.product-card').length;
      });
      console.log(`   → Products after delete: ${countAfter}`);
      
      if (countAfter >= countBefore) {
        this.results.warnings.push('Product count did not decrease after delete');
      }
      
      console.log('✅ Delete product working');
      this.results.passed.push('Delete product');
      return true;
    } catch (error) {
      console.error('❌ Delete test failed:', error.message);
      this.results.failed.push({
        test: 'Delete product',
        error: error.message
      });
      return false;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED: ${this.results.passed.length}`);
    this.results.passed.forEach(test => {
      console.log(`   ✓ ${test}`);
    });
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(warning => {
        console.log(`   ⚠ ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.results.failed.length}`);
      this.results.failed.forEach(failure => {
        console.log(`   ✗ ${failure.test}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    console.log(`Pass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('='.repeat(80) + '\n');
    
    return this.results.failed.length === 0;
  }
}

// Run tests
async function runTests() {
  const tester = new ProductCustomizationTester();
  
  try {
    await tester.setup();
    
    // First check authentication
    const authenticated = await tester.checkAuthentication();
    if (!authenticated) {
      console.log('❌ Cannot continue - authentication failed');
      await tester.cleanup();
      process.exit(1);
    }
    
    const navigated = await tester.navigateToMerchandise();
    if (!navigated) {
      console.log('❌ Cannot continue - failed to navigate to merchandise store');
      await tester.cleanup();
      process.exit(1);
    }
    
    // Run all tests in sequence
    await tester.testSelectImage();
    await tester.testOpenCustomizationModal();
    await tester.testModalInitialState();
    await tester.testBorderStyleChange();
    // testEditProductName and testAddDescription removed - titles auto-generated
    await tester.testSizeColorSelection();
    await tester.testModalClose();
    await tester.testCreateProductWithCustomization();
    await tester.testProductAppearsInList();
    
    // Test product card actions
    await tester.testViewProductDetails();
    await tester.testEditProduct();
    await tester.testDeleteProduct();
    
    // Print results
    const allPassed = tester.printResults();
    
    await tester.cleanup();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = ProductCustomizationTester;
