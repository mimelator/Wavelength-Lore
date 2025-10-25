/**
 * Product Persistence Investigation
 * 
 * Investigates why products become "broken" and need cleanup
 * Tests cache/persistence issues across server restarts
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductPersistenceInvestigation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.productLifecycle = [];
  }

  async setup() {
    console.log('🔍 Setting up Product Persistence Investigation');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor product-related console messages
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('product') || text.includes('variant') || text.includes('image') || text.includes('broken')) {
        console.log(`📱 Console: ${text}`);
      }
    });
  }

  async investigateProductCreationFlow() {
    console.log('\n🔍 Investigation: Product Creation → Storage → Retrieval');
    console.log('=' .repeat(70));
    
    try {
      // Step 1: Navigate and create a product
      console.log('📦 Step 1: Creating a fresh product...');
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      
      // Select image and create product
      const selectButton = await this.page.waitForSelector('.gallery-image-select');
      await selectButton.click();
      await wait(500);
      
      // Navigate through ProductNavigator
      await this.page.waitForSelector('.category-card', { timeout: 10000 });
      await this.page.click('.category-card');
      await this.page.waitForSelector('.subcategory-card', { timeout: 5000 });
      await this.page.click('.subcategory-card');
      await this.page.waitForSelector('.select-product-btn', { timeout: 5000 });
      await this.page.click('.select-product-btn');
      
      // Complete product creation
      await this.page.waitForSelector('.product-customization-modal', { timeout: 10000 });
      const createBtn = await this.page.waitForSelector('#createProductBtn');
      await createBtn.click();
      
      // Wait for creation to complete
      await wait(15000);
      
      // Step 2: Capture product details immediately after creation
      const freshProducts = await this.captureDetailedProductInfo();
      console.log(`📊 Fresh products created: ${freshProducts.length}`);
      
      if (freshProducts.length > 0) {
        const product = freshProducts[0];
        console.log(`🔍 Fresh product analysis:`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Variants: ${product.variants}`);
        console.log(`   Images: ${product.images}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Has Processing: ${product.hasProcessing}`);
        
        this.productLifecycle.push({
          timestamp: Date.now(),
          stage: 'created',
          products: freshProducts
        });
      }
      
      // Step 3: Refresh page and check persistence
      console.log('\n📦 Step 2: Refreshing page to test persistence...');
      await this.page.reload({ waitUntil: 'networkidle2' });
      await wait(3000);
      
      const afterRefreshProducts = await this.captureDetailedProductInfo();
      console.log(`📊 Products after refresh: ${afterRefreshProducts.length}`);
      
      if (afterRefreshProducts.length > 0) {
        const product = afterRefreshProducts[0];
        console.log(`🔍 After refresh analysis:`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Variants: ${product.variants}`);
        console.log(`   Images: ${product.images}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Has Processing: ${product.hasProcessing}`);
        
        this.productLifecycle.push({
          timestamp: Date.now(),
          stage: 'after_refresh',
          products: afterRefreshProducts
        });
      }
      
      // Step 4: Wait and check again (simulate time passing)
      console.log('\n📦 Step 3: Waiting 30 seconds to simulate time passing...');
      await wait(30000);
      
      const afterWaitProducts = await this.captureDetailedProductInfo();
      console.log(`📊 Products after wait: ${afterWaitProducts.length}`);
      
      if (afterWaitProducts.length > 0) {
        const product = afterWaitProducts[0];
        console.log(`🔍 After wait analysis:`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Variants: ${product.variants}`);
        console.log(`   Images: ${product.images}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Has Processing: ${product.hasProcessing}`);
        
        this.productLifecycle.push({
          timestamp: Date.now(),
          stage: 'after_wait',
          products: afterWaitProducts
        });
      }
      
      return this.analyzeProductLifecycle();
      
    } catch (error) {
      console.error('❌ Investigation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async captureDetailedProductInfo() {
    return await this.page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('.product-card'));
      return products.map(card => {
        const title = card.querySelector('h4')?.textContent || 'Unknown';
        const variants = card.querySelectorAll('.variant-option').length;
        const images = card.querySelectorAll('img').length;
        const isIncomplete = card.classList.contains('incomplete-product');
        const hasProcessingOverlay = !!card.querySelector('.processing-overlay');
        const hasRetryButton = !!card.querySelector('.retry-setup-btn');
        
        // Try to get more detailed status
        const statusElement = card.querySelector('.product-status');
        const status = statusElement ? statusElement.textContent : (isIncomplete ? 'incomplete' : 'complete');
        
        // Check for any data attributes that might indicate processing state
        const productId = card.querySelector('[data-product-id]')?.dataset.productId;
        
        return {
          title,
          productId,
          variants,
          images,
          isIncomplete,
          hasProcessing: hasProcessingOverlay,
          hasRetryButton,
          status,
          isBroken: variants === 0 && images === 0
        };
      });
    });
  }

  analyzeProductLifecycle() {
    console.log('\n📊 PRODUCT LIFECYCLE ANALYSIS');
    console.log('=' .repeat(50));
    
    if (this.productLifecycle.length === 0) {
      console.log('❌ No product lifecycle data captured');
      return { success: false, issue: 'no_data' };
    }
    
    this.productLifecycle.forEach((stage, index) => {
      const timeFromStart = index === 0 ? 0 : stage.timestamp - this.productLifecycle[0].timestamp;
      console.log(`\n🕐 Stage ${index + 1}: ${stage.stage.toUpperCase()} (+${Math.round(timeFromStart/1000)}s)`);
      
      if (stage.products.length === 0) {
        console.log('   📦 No products found');
      } else {
        stage.products.forEach((product, i) => {
          console.log(`   📦 Product ${i + 1}: ${product.title}`);
          console.log(`      Variants: ${product.variants}, Images: ${product.images}`);
          console.log(`      Status: ${product.status}, Broken: ${product.isBroken ? '❌' : '✅'}`);
          console.log(`      Processing: ${product.hasProcessing ? '⏳' : '✅'}`);
        });
      }
    });
    
    // Analyze patterns
    const patterns = this.identifyPatterns();
    
    console.log('\n🔍 PATTERN ANALYSIS');
    console.log('=' .repeat(30));
    
    if (patterns.becomeBroken) {
      console.log('❌ ISSUE FOUND: Products become broken over time');
      console.log('   This suggests a cache/persistence problem');
    }
    
    if (patterns.loseVariants) {
      console.log('❌ ISSUE FOUND: Products lose variants over time');
      console.log('   This suggests variant data is not persisting');
    }
    
    if (patterns.loseImages) {
      console.log('❌ ISSUE FOUND: Products lose images over time');
      console.log('   This suggests image data is not persisting');
    }
    
    if (patterns.stuckProcessing) {
      console.log('⚠️ ISSUE FOUND: Products stuck in processing state');
      console.log('   This suggests async processing is not completing');
    }
    
    return {
      success: true,
      patterns,
      lifecycle: this.productLifecycle
    };
  }

  identifyPatterns() {
    if (this.productLifecycle.length < 2) {
      return { insufficient_data: true };
    }
    
    const patterns = {
      becomeBroken: false,
      loseVariants: false,
      loseImages: false,
      stuckProcessing: false
    };
    
    // Compare first and last stages
    const first = this.productLifecycle[0];
    const last = this.productLifecycle[this.productLifecycle.length - 1];
    
    if (first.products.length > 0 && last.products.length > 0) {
      const firstProduct = first.products[0];
      const lastProduct = last.products[0];
      
      // Check if product became broken
      if (!firstProduct.isBroken && lastProduct.isBroken) {
        patterns.becomeBroken = true;
      }
      
      // Check if variants were lost
      if (firstProduct.variants > lastProduct.variants) {
        patterns.loseVariants = true;
      }
      
      // Check if images were lost
      if (firstProduct.images > lastProduct.images) {
        patterns.loseImages = true;
      }
      
      // Check if stuck in processing
      if (firstProduct.hasProcessing && lastProduct.hasProcessing) {
        patterns.stuckProcessing = true;
      }
    }
    
    return patterns;
  }

  async runInvestigation() {
    try {
      await this.setup();
      
      console.log('🔍 Starting Product Persistence Investigation');
      console.log('=' .repeat(60));
      
      const result = await this.investigateProductCreationFlow();
      
      console.log('\n📋 INVESTIGATION SUMMARY');
      console.log('=' .repeat(40));
      
      if (result.success) {
        console.log('✅ Investigation completed successfully');
        
        if (result.patterns.becomeBroken) {
          console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
          console.log('   Products become broken after creation');
          console.log('   This indicates a cache/persistence issue');
          console.log('\n💡 LIKELY CAUSES:');
          console.log('   - Variant/image data not saved to database');
          console.log('   - Cache invalidation removing product data');
          console.log('   - Async processing not completing');
          console.log('   - Server restart clearing in-memory data');
        }
      } else {
        console.log('❌ Investigation failed');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Investigation failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the investigation if called directly
if (require.main === module) {
  const investigation = new ProductPersistenceInvestigation();
  investigation.runInvestigation().catch(error => {
    console.error('❌ Investigation execution failed:', error);
    process.exit(1);
  });
}

module.exports = ProductPersistenceInvestigation;