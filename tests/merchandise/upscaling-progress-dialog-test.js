/**
 * Upscaling Progress Dialog Test
 * 
 * Tests the progress dialog during image upscaling operations
 * Addresses the issue where progress dialog never triggers and page hangs
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class UpscalingProgressDialogTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.progressUpdates = [];
    this.dialogStates = [];
    this.networkRequests = [];
    this.consoleMessages = [];
  }

  async setup() {
    console.log('🚀 Setting up Upscaling Progress Dialog Test');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console messages
    this.page.on('console', msg => {
      const text = msg.text();
      this.consoleMessages.push({
        timestamp: Date.now(),
        type: msg.type(),
        text: text
      });
      
      if (text.includes('🎨') || text.includes('progress') || text.includes('upscal')) {
        console.log(`📱 Console: ${text}`);
      }
    });
    
    // Monitor network requests
    this.page.on('request', request => {
      if (request.url().includes('preview-enhancement') || 
          request.url().includes('upscale') ||
          request.url().includes('create-product')) {
        this.networkRequests.push({
          timestamp: Date.now(),
          url: request.url(),
          method: request.method(),
          status: 'pending'
        });
        console.log(`🌐 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    this.page.on('response', response => {
      if (response.url().includes('preview-enhancement') || 
          response.url().includes('upscale') ||
          response.url().includes('create-product')) {
        const request = this.networkRequests.find(r => r.url === response.url() && r.status === 'pending');
        if (request) {
          request.status = response.status();
          request.duration = Date.now() - request.timestamp;
        }
        console.log(`📡 Response: ${response.status()} ${response.url()} (${Date.now() - (request?.timestamp || Date.now())}ms)`);
      }
    });
  }

  async testProgressDialogDuringUpscaling() {
    console.log('\n🎯 Test 1: Progress Dialog During Image Upscaling');
    console.log('=' .repeat(60));
    
    try {
      // Navigate to merchandise store
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      
      // Select first image
      console.log('📸 Selecting first gallery image...');
      const selectButton = await this.page.waitForSelector('.gallery-image-select');
      await selectButton.click();
      await wait(500);
      
      // Start monitoring progress dialog
      const progressMonitor = this.startProgressMonitoring();
      
      // Click preview enhancement button
      console.log('🎨 Clicking preview enhancement button...');
      const previewBtn = await this.page.waitForSelector('.btn-preview-enhancement');
      
      // Record the exact moment we click
      const clickTimestamp = Date.now();
      await previewBtn.click();
      
      console.log('⏱️ Waiting for progress dialog to appear...');
      
      // Wait for loading modal to appear (should happen immediately)
      let loadingModalAppeared = false;
      try {
        await this.page.waitForSelector('#loading-modal[style*=\"block\"]', { timeout: 2000 });
        loadingModalAppeared = true;
        console.log('✅ Loading modal appeared');
      } catch (error) {
        console.log('❌ Loading modal did NOT appear within 2 seconds');
      }
      
      // Monitor for 30 seconds or until completion
      const monitoringDuration = 30000;
      const monitoringEnd = Date.now() + monitoringDuration;
      
      while (Date.now() < monitoringEnd) {
        const dialogState = await this.captureDialogState();
        this.dialogStates.push({
          timestamp: Date.now(),
          ...dialogState
        });
        
        // Check if operation completed
        if (dialogState.modalVisible === false && this.dialogStates.length > 1) {
          console.log('✅ Operation completed, dialog closed');
          break;
        }
        
        // Check for page hang (no progress updates for 10 seconds)
        const lastProgressUpdate = this.progressUpdates[this.progressUpdates.length - 1];
        if (lastProgressUpdate && (Date.now() - lastProgressUpdate.timestamp) > 10000) {
          console.log('⚠️ Possible page hang detected - no progress updates for 10+ seconds');
        }
        
        await wait(500);
      }
      
      clearInterval(progressMonitor);
      
      // Analyze results
      this.analyzeProgressDialogBehavior(clickTimestamp, loadingModalAppeared);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async testProgressDialogDuringProductCreation() {
    console.log('\n🎯 Test 2: Progress Dialog During Product Creation');
    console.log('=' .repeat(60));
    
    try {
      // Ensure we have an image selected
      if (!await this.page.$('.gallery-image-card.selected')) {
        const selectButton = await this.page.waitForSelector('.gallery-image-select');
        await selectButton.click();
        await wait(500);
      }
      
      // Navigate to product selection
      await this.page.waitForSelector('#choose-product-section');
      
      // Wait for ProductNavigator to load and show products
      // First wait for categories to load
      await this.page.waitForSelector('.category-card', { timeout: 10000 });
      
      // Click first category
      await this.page.click('.category-card');
      await this.page.waitForSelector('.subcategory-card', { timeout: 5000 });
      
      // Click first subcategory
      await this.page.click('.subcategory-card');
      await this.page.waitForSelector('.select-product-btn', { timeout: 5000 });
      
      // Click first product
      const productButton = await this.page.waitForSelector('.select-product-btn');
      
      // Start monitoring
      const progressMonitor = this.startProgressMonitoring();
      const clickTimestamp = Date.now();
      
      console.log('🎽 Clicking product creation button...');
      await productButton.click();
      
      // Wait for customization modal
      await this.page.waitForSelector('.product-customization-modal', { timeout: 5000 });
      
      // Click Design Product button
      const designBtn = await this.page.waitForSelector('#createProductBtn');
      console.log('🚀 Clicking Design Product button...');
      
      const designClickTimestamp = Date.now();
      await designBtn.click();
      
      // Monitor progress dialog
      let loadingModalAppeared = false;
      try {
        await this.page.waitForSelector('#loading-modal[style*=\"block\"]', { timeout: 2000 });
        loadingModalAppeared = true;
        console.log('✅ Loading modal appeared for product creation');
      } catch (error) {
        console.log('❌ Loading modal did NOT appear for product creation');
      }
      
      // Monitor for up to 60 seconds (product creation takes longer)
      const monitoringDuration = 60000;
      const monitoringEnd = Date.now() + monitoringDuration;
      
      while (Date.now() < monitoringEnd) {
        const dialogState = await this.captureDialogState();
        this.dialogStates.push({
          timestamp: Date.now(),
          operation: 'product-creation',
          ...dialogState
        });
        
        // Check if operation completed
        if (dialogState.modalVisible === false && this.dialogStates.length > 1) {
          console.log('✅ Product creation completed, dialog closed');
          break;
        }
        
        await wait(1000);
      }
      
      clearInterval(progressMonitor);
      
      // Analyze results
      this.analyzeProgressDialogBehavior(designClickTimestamp, loadingModalAppeared, 'product-creation');
      
    } catch (error) {
      console.error('❌ Product creation test failed:', error);
      throw error;
    }
  }

  startProgressMonitoring() {
    return setInterval(async () => {
      try {
        const progressInfo = await this.page.evaluate(() => {
          const modal = document.querySelector('#loading-modal');
          const message = document.querySelector('#loading-message');
          const progressFill = document.querySelector('#loading-progress-fill');
          const progressText = document.querySelector('#loading-progress-text');
          
          return {
            modalVisible: modal && modal.style.display !== 'none',
            message: message ? message.textContent : null,
            progressWidth: progressFill ? progressFill.style.width : null,
            progressText: progressText ? progressText.textContent : null,
            modalExists: !!modal
          };
        });
        
        if (progressInfo.modalVisible || progressInfo.message) {
          this.progressUpdates.push({
            timestamp: Date.now(),
            ...progressInfo
          });
          
          if (progressInfo.modalVisible) {
            console.log(`📊 Progress: ${progressInfo.progressText || '0%'} - ${progressInfo.message || 'Loading...'}`);
          }
        }
      } catch (e) {
        // Ignore errors during monitoring
      }
    }, 200);
  }

  async captureDialogState() {
    return await this.page.evaluate(() => {
      const modal = document.querySelector('#loading-modal');
      const message = document.querySelector('#loading-message');
      const progressFill = document.querySelector('#loading-progress-fill');
      const progressText = document.querySelector('#loading-progress-text');
      const title = document.querySelector('#loading-title');
      
      return {
        modalExists: !!modal,
        modalVisible: modal && modal.style.display !== 'none',
        modalDisplay: modal ? modal.style.display : null,
        message: message ? message.textContent : null,
        title: title ? title.textContent : null,
        progressWidth: progressFill ? progressFill.style.width : null,
        progressText: progressText ? progressText.textContent : null,
        hasProgressBar: !!progressFill,
        bodyHasModal: document.body.contains(modal)
      };
    });
  }

  analyzeProgressDialogBehavior(operationStartTime, loadingModalAppeared, operation = 'upscaling') {
    console.log(`\n📊 Progress Dialog Analysis - ${operation.toUpperCase()}`);
    console.log('=' .repeat(50));
    
    console.log(`📈 Total progress updates captured: ${this.progressUpdates.length}`);
    console.log(`📈 Total dialog state changes: ${this.dialogStates.length}`);
    console.log(`🌐 Network requests made: ${this.networkRequests.length}`);
    console.log(`💬 Console messages: ${this.consoleMessages.length}`);
    
    // Check if modal appeared
    if (loadingModalAppeared) {
      console.log('✅ Loading modal appeared correctly');
    } else {
      console.log('❌ ISSUE: Loading modal never appeared');
    }
    
    // Analyze progress updates
    if (this.progressUpdates.length > 0) {
      console.log('\n📋 Progress Updates Timeline:');
      this.progressUpdates.forEach((update, i) => {
        const elapsed = update.timestamp - operationStartTime;
        console.log(`   ${i + 1}. +${elapsed}ms: ${update.progressText || '0%'} - ${update.message || 'No message'}`);
      });
      
      // Check for progress bar updates
      const progressBarUpdates = this.progressUpdates.filter(u => u.progressWidth && u.progressWidth !== '0%');
      if (progressBarUpdates.length > 0) {
        console.log('✅ Progress bar updated correctly');
      } else {
        console.log('⚠️ Progress bar never updated from 0%');
      }
    } else {
      console.log('❌ CRITICAL ISSUE: No progress updates captured');
    }
    
    // Analyze dialog states
    const modalVisibleStates = this.dialogStates.filter(s => s.modalVisible);
    const modalHiddenStates = this.dialogStates.filter(s => s.modalVisible === false);
    
    console.log(`\n🔍 Dialog State Analysis:`);
    console.log(`   Modal visible states: ${modalVisibleStates.length}`);
    console.log(`   Modal hidden states: ${modalHiddenStates.length}`);
    
    if (modalVisibleStates.length === 0) {
      console.log('❌ CRITICAL ISSUE: Modal was never visible during operation');
    }
    
    // Check for page hang indicators
    const lastNetworkRequest = this.networkRequests[this.networkRequests.length - 1];
    if (lastNetworkRequest && lastNetworkRequest.status === 'pending') {
      console.log('⚠️ POSSIBLE HANG: Network request still pending');
      console.log(`   Request: ${lastNetworkRequest.method} ${lastNetworkRequest.url}`);
      console.log(`   Duration: ${Date.now() - lastNetworkRequest.timestamp}ms`);
    }
    
    // Check for successful completion
    const completedRequests = this.networkRequests.filter(r => r.status >= 200 && r.status < 300);
    const failedRequests = this.networkRequests.filter(r => r.status >= 400);
    
    console.log(`\n🌐 Network Analysis:`);
    console.log(`   Successful requests: ${completedRequests.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);
    console.log(`   Pending requests: ${this.networkRequests.filter(r => r.status === 'pending').length}`);
    
    if (failedRequests.length > 0) {
      console.log('❌ Failed requests detected:');
      failedRequests.forEach(req => {
        console.log(`   ${req.status} ${req.method} ${req.url}`);
      });
    }
    
    // Overall assessment
    const hasProgressDialog = loadingModalAppeared;
    const hasProgressUpdates = this.progressUpdates.length > 0;
    const hasSuccessfulRequests = completedRequests.length > 0;
    const hasPendingRequests = this.networkRequests.filter(r => r.status === 'pending').length > 0;
    
    console.log(`\n🎯 Overall Assessment:`);
    if (hasProgressDialog && hasProgressUpdates && hasSuccessfulRequests && !hasPendingRequests) {
      console.log('✅ Progress dialog working correctly');
    } else {
      console.log('❌ Progress dialog has issues:');
      if (!hasProgressDialog) console.log('   - Modal never appeared');
      if (!hasProgressUpdates) console.log('   - No progress updates');
      if (!hasSuccessfulRequests) console.log('   - No successful network requests');
      if (hasPendingRequests) console.log('   - Requests still pending (possible hang)');
    }
  }

  async testProductAutoRemovalScenarios() {
    console.log('\n🎯 Test 3: Product Auto-Removal Scenarios');
    console.log('=' .repeat(60));
    
    try {
      // Navigate to merchandise store
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
      
      // Check for existing products
      const existingProducts = await this.page.$$('.product-card');
      console.log(`📦 Found ${existingProducts.length} existing products`);
      
      if (existingProducts.length === 0) {
        console.log('ℹ️ No existing products to test auto-removal');
        return;
      }
      
      // Analyze each product for potential auto-removal criteria
      for (let i = 0; i < existingProducts.length; i++) {
        const productCard = existingProducts[i];
        
        const productInfo = await productCard.evaluate(el => {
          const title = el.querySelector('h4')?.textContent || 'Unknown';
          const variants = el.querySelectorAll('.variant-option').length;
          const images = el.querySelectorAll('img').length;
          const hasProcessingOverlay = !!el.querySelector('.processing-overlay');
          const isIncomplete = el.classList.contains('incomplete-product');
          const hasRetryButton = !!el.querySelector('.retry-setup-btn');
          
          return {
            title,
            variants,
            images,
            hasProcessingOverlay,
            isIncomplete,
            hasRetryButton
          };
        });
        
        console.log(`\n📋 Product ${i + 1}: ${productInfo.title}`);
        console.log(`   Variants: ${productInfo.variants}`);
        console.log(`   Images: ${productInfo.images}`);
        console.log(`   Processing: ${productInfo.hasProcessingOverlay}`);
        console.log(`   Incomplete: ${productInfo.isIncomplete}`);
        console.log(`   Has Retry: ${productInfo.hasRetryButton}`);
        
        // Check if this product meets auto-removal criteria
        const shouldBeRemoved = productInfo.variants === 0 && productInfo.images <= 1;
        if (shouldBeRemoved) {
          console.log(`⚠️ Product "${productInfo.title}" should be auto-removed (0 variants, ${productInfo.images} images)`);
        }
      }
      
      // Test the cleanup function by refreshing the page
      console.log('\n🔄 Refreshing page to trigger cleanup...');
      await this.page.reload({ waitUntil: 'networkidle2' });
      
      // Check products after cleanup
      const productsAfterCleanup = await this.page.$$('.product-card');
      console.log(`📦 Products after cleanup: ${productsAfterCleanup.length}`);
      
      if (productsAfterCleanup.length < existingProducts.length) {
        const removedCount = existingProducts.length - productsAfterCleanup.length;
        console.log(`✅ Auto-removal working: ${removedCount} products removed`);
      } else {
        console.log('ℹ️ No products were auto-removed (may be expected if all products are valid)');
      }
      
    } catch (error) {
      console.error('❌ Product auto-removal test failed:', error);
      throw error;
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      console.log('🧪 Starting Comprehensive Upscaling & Product Management Tests');
      console.log('=' .repeat(80));
      
      // Test 1: Progress dialog during upscaling
      await this.testProgressDialogDuringUpscaling();
      
      // Test 2: Progress dialog during product creation
      await this.testProgressDialogDuringProductCreation();
      
      // Test 3: Product auto-removal scenarios
      await this.testProductAutoRemovalScenarios();
      
      console.log('\n🎉 All tests completed!');
      
      // Generate summary report
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateSummaryReport() {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY REPORT');
    console.log('=' .repeat(80));
    
    console.log(`📈 Total Progress Updates: ${this.progressUpdates.length}`);
    console.log(`🔄 Total Dialog State Changes: ${this.dialogStates.length}`);
    console.log(`🌐 Total Network Requests: ${this.networkRequests.length}`);
    console.log(`💬 Total Console Messages: ${this.consoleMessages.length}`);
    
    // Identify key issues
    const issues = [];
    
    if (this.progressUpdates.length === 0) {
      issues.push('No progress updates captured - progress dialog may not be working');
    }
    
    const pendingRequests = this.networkRequests.filter(r => r.status === 'pending');
    if (pendingRequests.length > 0) {
      issues.push(`${pendingRequests.length} requests still pending - possible page hang`);
    }
    
    const failedRequests = this.networkRequests.filter(r => r.status >= 400);
    if (failedRequests.length > 0) {
      issues.push(`${failedRequests.length} failed network requests`);
    }
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES IDENTIFIED:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No critical issues identified');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    if (this.progressUpdates.length === 0) {
      console.log('   - Check if setLoading() is being called properly');
      console.log('   - Verify loading modal HTML structure exists');
      console.log('   - Ensure progress updates are triggered during long operations');
    }
    
    if (pendingRequests.length > 0) {
      console.log('   - Investigate hanging network requests');
      console.log('   - Add timeout handling to prevent indefinite waits');
      console.log('   - Implement proper error handling for failed requests');
    }
    
    console.log('\n🎯 Test completed successfully!');
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new UpscalingProgressDialogTest();
  test.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = UpscalingProgressDialogTest;