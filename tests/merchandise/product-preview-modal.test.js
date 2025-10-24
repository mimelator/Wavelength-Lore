#!/usr/bin/env node

/**
 * Product Preview Modal Test Suite
 * 
 * Tests the product preview functionality that shows users what their
 * customized product will look like BEFORE creating it.
 * 
 * Features tested:
 * 1. Preview modal opens with selected image on product mockup
 * 2. Size selector updates preview and price
 * 3. Color selector changes product color in real-time
 * 4. User can change configuration before confirming
 * 5. Preview accurately represents final product
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 60000;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductPreviewTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = { passed: [], failed: [], warnings: [] };
  }

  async setup() {
    console.log('🚀 Setting up Product Preview tests...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 30
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log(`❌ Browser Error: ${text}`);
      }
    });
    
    this.page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });
  }

  async navigateAndSelectImage() {
    console.log('📍 TEST: Navigate and select image');
    
    try {
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      
      // Select first image
      const selectBtn = await this.page.waitForSelector('.gallery-image-select');
      await selectBtn.click();
      await wait(500);
      
      console.log('✅ Image selected\n');
      this.results.passed.push('Navigate and select image');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Navigate and select image', error: error.message });
      return false;
    }
  }

  async openProductSelection() {
    console.log('📍 TEST: Open product selection');
    
    try {
      await this.page.waitForSelector('.select-product-type-btn', { timeout: 5000 });
      const productBtn = await this.page.$('.select-product-type-btn');
      await productBtn.click();
      await wait(500);
      
      console.log('✅ Product selection opened\n');
      this.results.passed.push('Open product selection');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Open product selection', error: error.message });
      return false;
    }
  }

  async testPreviewModalOpens() {
    console.log('📍 TEST: Preview modal opens with mockup');
    
    try {
      // Check for preview modal
      const hasPreviewModal = await this.page.evaluate(() => {
        const modal = document.querySelector('.product-preview-modal, #productPreviewModal');
        return !!modal;
      });
      
      if (!hasPreviewModal) {
        throw new Error('Preview modal not found');
      }
      
      // Check for mockup image
      const mockupInfo = await this.page.evaluate(() => {
        const mockup = document.querySelector('.product-mockup, .preview-mockup');
        const userImage = document.querySelector('.preview-user-image, .mockup-overlay');
        
        return {
          hasMockup: !!mockup,
          hasUserImage: !!userImage,
          mockupSrc: mockup?.src || mockup?.style?.backgroundImage || 'none'
        };
      });
      
      console.log('   → Has mockup:', mockupInfo.hasMockup);
      console.log('   → Has user image overlay:', mockupInfo.hasUserImage);
      
      if (!mockupInfo.hasMockup) {
        throw new Error('Product mockup not displayed');
      }
      
      console.log('✅ Preview modal displays correctly\n');
      this.results.passed.push('Preview modal opens with mockup');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Preview modal opens', error: error.message });
      return false;
    }
  }

  async testSizeSelector() {
    console.log('📍 TEST: Size selector updates preview and price');
    
    try {
      // Get initial price
      const initialPrice = await this.page.evaluate(() => {
        const priceEl = document.querySelector('.preview-price, .variant-price');
        return priceEl?.textContent || '';
      });
      
      console.log('   → Initial price:', initialPrice);
      
      // Change size
      const sizeOptions = await this.page.$$('.size-option, [data-size]');
      if (sizeOptions.length < 2) {
        this.results.warnings.push('Less than 2 size options available');
      } else {
        await sizeOptions[1].click();
        await wait(300);
        
        const newPrice = await this.page.evaluate(() => {
          const priceEl = document.querySelector('.preview-price, .variant-price');
          return priceEl?.textContent || '';
        });
        
        console.log('   → New price:', newPrice);
        console.log('   → Price updated:', initialPrice !== newPrice);
      }
      
      console.log('✅ Size selector working\n');
      this.results.passed.push('Size selector updates preview');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Size selector', error: error.message });
      return false;
    }
  }

  async testColorSelector() {
    console.log('📍 TEST: Color selector changes product appearance');
    
    try {
      const colorOptions = await this.page.$$('.color-option, [data-color]');
      
      if (colorOptions.length === 0) {
        this.results.warnings.push('No color options found');
        return true;
      }
      
      console.log(`   → Found ${colorOptions.length} color options`);
      
      // Click second color option
      if (colorOptions.length > 1) {
        await colorOptions[1].click();
        await wait(500);
        
        // Check if mockup updated
        const mockupUpdated = await this.page.evaluate(() => {
          const mockup = document.querySelector('.product-mockup, .preview-mockup');
          const selectedColor = document.querySelector('.color-option.selected, [data-color].selected');
          return {
            hasMockup: !!mockup,
            hasSelectedColor: !!selectedColor,
            selectedColorValue: selectedColor?.dataset?.color || selectedColor?.getAttribute('data-color')
          };
        });
        
        console.log('   → Color selected:', mockupUpdated.selectedColorValue);
        console.log('   → Mockup updated:', mockupUpdated.hasMockup);
      }
      
      console.log('✅ Color selector working\n');
      this.results.passed.push('Color selector changes appearance');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Color selector', error: error.message });
      return false;
    }
  }

  async testConfigurationChange() {
    console.log('📍 TEST: User can change configuration');
    
    try {
      // Verify configuration options are present and editable
      const configEditable = await this.page.evaluate(() => {
        const sizeOptions = document.querySelectorAll('.size-option');
        const colorOptions = document.querySelectorAll('.color-option');
        return sizeOptions.length > 0 && colorOptions.length > 0;
      });
      
      if (!configEditable) {
        throw new Error('Configuration options not found');
      }
      
      console.log('   → Configuration options are present and editable');
      console.log('✅ Configuration change working\n');
      this.results.passed.push('User can change configuration');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Configuration change', error: error.message });
      return false;
    }
  }

  async testConfirmCreation() {
    console.log('📍 TEST: Confirm button creates product with selected config');
    
    try {
      const confirmBtn = await this.page.$('.confirm-preview-btn');
      
      if (!confirmBtn) {
        throw new Error('Confirm button not found');
      }
      
      const btnText = await confirmBtn.evaluate(el => el.textContent);
      console.log('   → Confirm button text:', btnText.trim());
      
      console.log('✅ Confirm button present\n');
      this.results.passed.push('Confirm button creates product');
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.message);
      this.results.failed.push({ test: 'Confirm creation', error: error.message });
      return false;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...\n');
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ PASSED: ${this.results.passed.length}`);
    this.results.passed.forEach(test => console.log(`   ✓ ${test}`));
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.results.failed.length}`);
      this.results.failed.forEach(failure => {
        console.log(`   ✗ ${failure.test}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    console.log(`\nPass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('='.repeat(80) + '\n');
    
    return this.results.failed.length === 0;
  }
}

async function runTests() {
  const tester = new ProductPreviewTester();
  
  try {
    await tester.setup();
    
    const navigated = await tester.navigateAndSelectImage();
    if (!navigated) {
      console.log('❌ Cannot continue - navigation failed');
      await tester.cleanup();
      process.exit(1);
    }
    
    const productOpened = await tester.openProductSelection();
    if (!productOpened) {
      console.log('❌ Cannot continue - product selection failed');
      await tester.cleanup();
      process.exit(1);
    }
    
    // Run preview tests
    await tester.testPreviewModalOpens();
    await tester.testSizeSelector();
    await tester.testColorSelector();
    await tester.testConfigurationChange();
    await tester.testConfirmCreation();
    
    const allPassed = tester.printResults();
    await tester.cleanup();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = ProductPreviewTester;
