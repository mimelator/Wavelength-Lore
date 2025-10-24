/**
 * Merchandise Store UI Interaction Test
 * 
 * Tests the complex behavior of:
 * 1. Select button - Selects image, scrolls to product section, updates UI
 * 2. View Printable Image button - Opens enhancement modal with progress updates
 * 
 * Expected Behaviors:
 * 
 * SELECT BUTTON:
 * - Click selects the image (this.selectedImage set to imageId)
 * - Button text changes from "Select" to "Selected"
 * - Card gets "selected" CSS class
 * - Auto-scrolls to "Choose Product" section after 300ms
 * - Re-renders the page to show selection state
 * - Product creation buttons become enabled
 * 
 * VIEW PRINTABLE IMAGE BUTTON:
 * - Shows loading indicator with progressive messages
 * - Messages update every 4 seconds during ~20 second enhancement
 * - Makes POST request to /api/merchandise/preview-enhancement
 * - Opens modal with enhanced image preview
 * - Shows enhancement details (resolution, DPI, dimensions)
 * - Handles errors gracefully with user-friendly messages
 * - Clears loading state when complete
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 60000; // 60 seconds for long operations

// Helper function to wait (replacement for deprecated waitForTimeout)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class MerchandiseUITester {
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
    console.log('🚀 Setting up Puppeteer browser...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50 // Slow down for visibility
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`❌ Browser Error: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  Browser Warning: ${text}`);
      } else if (text.includes('🛍️') || text.includes('📸') || text.includes('🎨')) {
        console.log(`📱 Browser: ${text}`);
      }
    });
    
    // Capture network errors
    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && url.includes('/api/merchandise')) {
        console.log(`❌ API Error: ${status} ${url}`);
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
      
      // Wait for the store to initialize
      await this.page.waitForSelector('.gallery-image-card', { timeout: 20000 });
      
      console.log('✅ Merchandise store loaded successfully');
      this.results.passed.push('Navigation to merchandise store');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to merchandise:', error.message);
      this.results.failed.push(`Navigation: ${error.message}`);
      return false;
    }
  }

  async testSelectButton() {
    console.log('\n🧪 Testing SELECT BUTTON behavior...');
    
    try {
      // Find the first gallery image card
      const firstImageCard = await this.page.$('.gallery-image-card');
      if (!firstImageCard) {
        throw new Error('No gallery images found');
      }
      
      // Get image details before selection
      const imageId = await this.page.evaluate(card => {
        const selectBtn = card.querySelector('.gallery-image-select');
        return selectBtn ? selectBtn.dataset.imageId : null;
      }, firstImageCard);
      
      console.log(`📸 Testing with image ID: ${imageId}`);
      
      // Check initial state
      const initialButtonText = await this.page.evaluate(card => {
        return card.querySelector('.gallery-image-select').textContent.trim();
      }, firstImageCard);
      
      console.log(`   Initial button text: "${initialButtonText}"`);
      
      if (initialButtonText !== 'Select') {
        this.results.warnings.push(`Select button shows "${initialButtonText}" instead of "Select"`);
      }
      
      // Check if card has selected class (should not)
      const initiallySelected = await this.page.evaluate(card => {
        return card.classList.contains('selected');
      }, firstImageCard);
      
      if (initiallySelected) {
        this.results.warnings.push('Image card already has "selected" class before clicking');
      }
      
      // Click the select button
      console.log('   👆 Clicking Select button...');
      await firstImageCard.$eval('.gallery-image-select', btn => btn.click());
      
      // Wait for re-render (the component calls this.render())
      await wait(500);
      
      // Verify button text changed
      const updatedButtonText = await this.page.evaluate(id => {
        const card = document.querySelector(`.gallery-image-card .gallery-image-select[data-image-id="${id}"]`);
        return card ? card.textContent.trim() : null;
      }, imageId);
      
      console.log(`   Updated button text: "${updatedButtonText}"`);
      
      if (updatedButtonText === 'Selected') {
        console.log('   ✅ Button text changed to "Selected"');
        this.results.passed.push('Select button text updates correctly');
      } else {
        throw new Error(`Button text is "${updatedButtonText}", expected "Selected"`);
      }
      
      // Verify card has selected class
      const nowSelected = await this.page.evaluate(id => {
        const selectBtn = document.querySelector(`.gallery-image-select[data-image-id="${id}"]`);
        const card = selectBtn ? selectBtn.closest('.gallery-image-card') : null;
        return card ? card.classList.contains('selected') : false;
      }, imageId);
      
      if (nowSelected) {
        console.log('   ✅ Card has "selected" CSS class');
        this.results.passed.push('Selected card gets CSS class');
      } else {
        throw new Error('Card does not have "selected" class after clicking');
      }
      
      // Wait for auto-scroll (300ms delay)
      await wait(500);
      
      // Check if Choose Product section is in view
      const productSectionVisible = await this.page.evaluate(() => {
        const section = document.getElementById('choose-product-section');
        if (!section) return false;
        
        const rect = section.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
      });
      
      if (productSectionVisible) {
        console.log('   ✅ Auto-scrolled to Choose Product section');
        this.results.passed.push('Auto-scroll to product selection');
      } else {
        this.results.warnings.push('Choose Product section may not be in view after selection');
      }
      
      // Verify product creation buttons are available
      const productButtonsEnabled = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('.select-product-type-btn');
        return buttons.length > 0;
      });
      
      if (productButtonsEnabled) {
        console.log('   ✅ Product creation buttons are available');
        this.results.passed.push('Product creation buttons enabled after selection');
      } else {
        this.results.warnings.push('No product creation buttons found');
      }
      
      console.log('\n✅ SELECT BUTTON test completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ SELECT BUTTON test failed:', error.message);
      this.results.failed.push(`Select button: ${error.message}`);
      return false;
    }
  }

  async testViewPrintableImageButton() {
    console.log('\n🧪 Testing VIEW PRINTABLE IMAGE BUTTON behavior...');
    
    try {
      // Find the first View Printable Image button
      const previewBtn = await this.page.$('.btn-preview-enhancement');
      if (!previewBtn) {
        throw new Error('No View Printable Image button found');
      }
      
      const imageId = await this.page.evaluate(btn => {
        return btn.dataset.imageId;
      }, previewBtn);
      
      console.log(`📸 Testing preview for image ID: ${imageId}`);
      
      // Set up request interceptor to monitor API call
      let apiCallMade = false;
      let apiResponse = null;
      
      this.page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/merchandise/preview-enhancement')) {
          apiCallMade = true;
          try {
            apiResponse = await response.json();
          } catch (e) {
            apiResponse = { error: 'Could not parse response' };
          }
        }
      });
      
      // Click the button
      console.log('   👆 Clicking View Printable Image button...');
      await previewBtn.click();
      
      // Wait for loading indicator
      await this.page.waitForSelector('.loading-overlay, .loading-container', { timeout: 2000 })
        .catch(() => console.log('   ⚠️  No loading indicator found (may appear too quickly)'));
      
      // Check for loading message
      const loadingMessage = await this.page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .loading-container');
        return overlay ? overlay.textContent : null;
      });
      
      if (loadingMessage && loadingMessage.includes('Analyzing')) {
        console.log(`   ✅ Loading indicator shows: "${loadingMessage.substring(0, 50)}..."`);
        this.results.passed.push('Loading indicator displays during enhancement');
      }
      
      // Wait for progressive messages (check a few times)
      console.log('   ⏳ Monitoring progressive loading messages...');
      const messages = new Set();
      
      for (let i = 0; i < 5; i++) {
        await wait(4000);
        
        const currentMessage = await this.page.evaluate(() => {
          const overlay = document.querySelector('.loading-overlay, .loading-container');
          return overlay ? overlay.textContent : null;
        });
        
        if (currentMessage) {
          messages.add(currentMessage);
          console.log(`   📝 Message ${i + 1}: ${currentMessage.substring(0, 60)}...`);
        }
        
        // Check if modal appeared (enhancement complete)
        const modalAppeared = await this.page.$('.enhancement-modal, .modal');
        if (modalAppeared) {
          console.log('   ✅ Enhancement modal appeared');
          break;
        }
      }
      
      if (messages.size >= 2) {
        console.log(`   ✅ Progressive messages updated (${messages.size} different messages)`);
        this.results.passed.push('Progressive loading messages displayed');
      } else {
        this.results.warnings.push('Only one loading message detected (expected multiple)');
      }
      
      // Wait for API call to complete (max 30 seconds)
      await wait(2000);
      
      if (apiCallMade) {
        console.log('   ✅ API call made to /api/merchandise/preview-enhancement');
        this.results.passed.push('API call to preview-enhancement endpoint');
        
        if (apiResponse) {
          if (apiResponse.success) {
            console.log('   ✅ API returned success response');
            console.log(`   📊 Enhanced image: ${apiResponse.enhancedImage?.url || 'URL provided'}`);
            this.results.passed.push('Enhancement API returned success');
          } else {
            console.log(`   ⚠️  API returned error: ${apiResponse.error}`);
            this.results.warnings.push(`API error: ${apiResponse.error}`);
          }
        }
      } else {
        this.results.warnings.push('No API call detected (may have completed too quickly)');
      }
      
      // Check if modal is visible
      const modalVisible = await this.page.$('.enhancement-modal, .modal, [role="dialog"]');
      
      if (modalVisible) {
        console.log('   ✅ Enhancement modal/preview displayed');
        this.results.passed.push('Enhancement modal displayed');
        
        // Check modal content
        const modalHasImage = await this.page.evaluate(() => {
          const modal = document.querySelector('.enhancement-modal, .modal, [role="dialog"]');
          return modal ? modal.querySelector('img') !== null : false;
        });
        
        if (modalHasImage) {
          console.log('   ✅ Modal contains enhanced image');
          this.results.passed.push('Enhanced image displayed in modal');
        } else {
          this.results.warnings.push('Modal does not contain an image element');
        }
        
        // Close modal if there's a close button
        const closeBtn = await this.page.$('.modal-close, .close-modal, [aria-label="Close"]');
        if (closeBtn) {
          await closeBtn.click();
          await wait(500);
          console.log('   ✅ Modal closed successfully');
        }
      } else {
        this.results.warnings.push('Enhancement modal not visible after API call');
      }
      
      // Verify loading state cleared
      const loadingGone = await this.page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .loading-container');
        return !overlay || overlay.style.display === 'none' || !overlay.offsetParent;
      });
      
      if (loadingGone) {
        console.log('   ✅ Loading state cleared');
        this.results.passed.push('Loading state cleared after completion');
      } else {
        this.results.warnings.push('Loading indicator still visible');
      }
      
      console.log('\n✅ VIEW PRINTABLE IMAGE BUTTON test completed');
      return true;
      
    } catch (error) {
      console.error('❌ VIEW PRINTABLE IMAGE BUTTON test failed:', error.message);
      this.results.failed.push(`View Printable Image: ${error.message}`);
      return false;
    }
  }

  async testMultipleSelections() {
    console.log('\n🧪 Testing MULTIPLE IMAGE SELECTIONS...');
    
    try {
      // Get all image cards
      const imageCards = await this.page.$$('.gallery-image-card');
      
      if (imageCards.length < 2) {
        console.log('   ⚠️  Only one image available, skipping multi-selection test');
        this.results.warnings.push('Insufficient images for multi-selection test');
        return true;
      }
      
      console.log(`   Found ${imageCards.length} images, testing selection switch...`);
      
      // Select first image
      const firstImageId = await this.page.evaluate(card => {
        const btn = card.querySelector('.gallery-image-select');
        btn.click();
        return btn.dataset.imageId;
      }, imageCards[0]);
      
      await wait(800);
      
      // Verify first is selected
      const firstButtonText = await this.page.evaluate(id => {
        const btn = document.querySelector(`.gallery-image-select[data-image-id="${id}"]`);
        return btn ? btn.textContent.trim() : null;
      }, firstImageId);
      
      console.log(`   First image button text after click: "${firstButtonText}"`);
      
      if (firstButtonText !== 'Selected') {
        throw new Error(`First image not selected (button shows: "${firstButtonText}")`);
      }
      
      // Select second image - get fresh elements after re-render
      await wait(200);
      const secondImageCards = await this.page.$$('.gallery-image-card');
      
      const secondImageId = await this.page.evaluate(card => {
        const btn = card.querySelector('.gallery-image-select');
        if (btn) {
          console.log('About to click button with ID:', btn.dataset.imageId, 'Text:', btn.textContent.trim());
          btn.click();
          return btn.dataset.imageId;
        }
        return null;
      }, secondImageCards[1]);
      
      if (!secondImageId) {
        throw new Error('Could not find second image button');
      }
      
      console.log(`   Clicked second image: ${secondImageId}`);
      
      await wait(800); // Longer wait for re-render
      
      // Verify second is selected
      const secondButtonText = await this.page.evaluate(id => {
        const btn = document.querySelector(`.gallery-image-select[data-image-id="${id}"]`);
        return btn ? btn.textContent.trim() : null;
      }, secondImageId);
      
      console.log(`   Second image button text after click: "${secondButtonText}"`);
      
      // Verify first is now deselected
      const firstButtonTextAfter = await this.page.evaluate(id => {
        const btn = document.querySelector(`.gallery-image-select[data-image-id="${id}"]`);
        return btn ? btn.textContent.trim() : null;
      }, firstImageId);
      
      console.log(`   First image button text after second click: "${firstButtonTextAfter}"`);
      
      if (secondButtonText === 'Selected' && firstButtonTextAfter === 'Select') {
        console.log('   ✅ Selection switches correctly between images');
        this.results.passed.push('Multiple selections work correctly');
      } else {
        throw new Error(`Selection state incorrect - Second: "${secondButtonText}", First: "${firstButtonTextAfter}"`);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Multiple selection test failed:', error.message);
      this.results.failed.push(`Multiple selections: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`\n✅ PASSED (${this.results.passed.length}):`);
    this.results.passed.forEach(test => console.log(`   ✓ ${test}`));
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.results.warnings.length}):`);
      this.results.warnings.forEach(warning => console.log(`   ! ${warning}`));
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n❌ FAILED (${this.results.failed.length}):`);
      this.results.failed.forEach(failure => console.log(`   ✗ ${failure}`));
    }
    
    console.log('\n' + '='.repeat(70));
    
    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? ((this.results.passed.length / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`Pass Rate: ${passRate}% (${this.results.passed.length}/${totalTests})`);
    console.log('='.repeat(70) + '\n');
    
    return this.results.failed.length === 0;
  }
}

// Main test runner
async function runTests() {
  const tester = new MerchandiseUITester();
  
  try {
    await tester.setup();
    
    // Navigate to merchandise store
    const navigated = await tester.navigateToMerchandise();
    if (!navigated) {
      console.error('❌ Cannot proceed without successful navigation');
      process.exit(1);
    }
    
    // Run tests
    await tester.testSelectButton();
    await tester.testViewPrintableImageButton();
    await tester.testMultipleSelections();
    
    // Print results
    const allPassed = tester.printResults();
    
    await tester.cleanup();
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { MerchandiseUITester, runTests };
