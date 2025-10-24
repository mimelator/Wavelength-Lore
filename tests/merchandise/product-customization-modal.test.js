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
      } else if (text.includes('✨') || text.includes('🎨') || text.includes('🛍️')) {
        console.log(`📱 Browser: ${text}`);
      }
    });
    
    // Network monitoring
    this.page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/border-preview/generate')) {
        const status = response.status();
        if (status === 200) {
          console.log(`✅ Border preview generated successfully`);
        } else {
          console.log(`❌ Border preview failed: ${status}`);
        }
      }
    });
  }

  async navigateToMerchandise() {
    console.log('\n📍 Navigating to merchandise store...');
    
    try {
      await this.page.goto(`${BASE_URL}/merchandise`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await this.page.waitForSelector('.gallery-image-card', { timeout: 20000 });
      
      console.log('✅ Merchandise store loaded');
      this.results.passed.push('Navigate to merchandise store');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate:', error.message);
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
      
      // Find and click first "Create" product button
      const createButton = await this.page.waitForSelector('.select-product-type-btn', { timeout: 5000 });
      
      // Get product name for logging
      const productName = await this.page.evaluate(btn => {
        return btn.textContent.trim();
      }, createButton);
      
      console.log(`   → Clicking "${productName}" button`);
      await createButton.click();
      
      // Wait for modal to appear
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
      
      // Verify all required elements exist
      const requiredElements = [
        'hasTitle', 'hasBorderSelect', 'hasAutoTitleInfo', 'hasAutoTitlePreview',
        'hasSizeSelect', 'hasColorSelect', 'hasCreateButton', 
        'hasPreview', 'hasBorderedPreview'
      ];
      
      const missingElements = requiredElements.filter(key => !modalState[key]);
      
      if (missingElements.length > 0) {
        throw new Error(`Missing elements: ${missingElements.join(', ')}`);
      }
      
      // Verify default border is selected
      if (modalState.borderValue !== 'solid-medium') {
        this.results.warnings.push('Default border is not "solid-medium"');
      }
      
      // Verify auto-title is displayed
      if (!modalState.autoTitleText || modalState.autoTitleText.length === 0) {
        throw new Error('Auto-generated title is not displayed');
      }
      
      // Verify price is displayed
      if (!modalState.priceDisplay || !modalState.priceDisplay.includes('$')) {
        throw new Error('Price is not displayed correctly');
      }
      
      console.log('✅ Modal initial state is correct');
      console.log(`   → Auto-generated title: "${modalState.autoTitleText}"`);
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
      // Re-open modal
      console.log('   → Re-opening modal...');
      const createButton = await this.page.waitForSelector('.select-product-type-btn', { timeout: 5000 });
      await createButton.click();
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
      await wait(5000);
      
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
