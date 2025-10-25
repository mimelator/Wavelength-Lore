/**
 * Cache Flaw Fix Test
 * 
 * Tests that products persist correctly with variants and images
 * after the database storage fix
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class CacheFlawFixTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🔧 Setting up Cache Flaw Fix Test');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console for product-related messages
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('product') || text.includes('variant') || text.includes('image') || text.includes('Stored product')) {
        console.log(`📱 Console: ${text}`);
      }
    });
  }

  async testProductPersistenceAfterFix() {
    console.log('\n🔧 Test: Product Persistence After Cache Fix');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Create a product
      console.log('📦 Step 1: Creating a product...');
      await this.page.goto(`${BASE_URL}/merchandise?v=${Date.now()}`, { waitUntil: 'networkidle2' });
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
      console.log('⏳ Waiting for product creation...');
      await wait(15000);
      
      // Step 2: Capture product details immediately after creation
      const freshProduct = await this.captureProductDetails();
      console.log(`📊 Fresh product created:`);
      console.log(`   Title: ${freshProduct.title}`);
      console.log(`   Variants: ${freshProduct.variants}`);
      console.log(`   Images: ${freshProduct.images}`);
      console.log(`   Broken: ${freshProduct.isBroken ? '❌' : '✅'}`);
      
      this.testResults.push({
        stage: 'created',
        product: freshProduct,
        timestamp: Date.now()
      });
      
      // Step 3: Refresh page to test persistence
      console.log('\n📦 Step 2: Refreshing page to test persistence...');
      await this.page.reload({ waitUntil: 'networkidle2' });
      await wait(5000); // Wait for cleanup to complete
      
      const afterRefreshProduct = await this.captureProductDetails();
      console.log(`📊 Product after refresh:`);
      console.log(`   Title: ${afterRefreshProduct.title}`);
      console.log(`   Variants: ${afterRefreshProduct.variants}`);
      console.log(`   Images: ${afterRefreshProduct.images}`);
      console.log(`   Broken: ${afterRefreshProduct.isBroken ? '❌' : '✅'}`);
      
      this.testResults.push({
        stage: 'after_refresh',
        product: afterRefreshProduct,
        timestamp: Date.now()
      });
      
      // Step 4: Wait longer and test again
      console.log('\n📦 Step 3: Waiting 30 seconds and testing again...');
      await wait(30000);
      
      const afterWaitProduct = await this.captureProductDetails();
      console.log(`📊 Product after wait:`);
      console.log(`   Title: ${afterWaitProduct.title}`);
      console.log(`   Variants: ${afterWaitProduct.variants}`);
      console.log(`   Images: ${afterWaitProduct.images}`);
      console.log(`   Broken: ${afterWaitProduct.isBroken ? '❌' : '✅'}`);
      
      this.testResults.push({
        stage: 'after_wait',
        product: afterWaitProduct,
        timestamp: Date.now()
      });
      
      return this.analyzeResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async captureProductDetails() {
    const products = await this.page.evaluate(() => {
      const productCards = Array.from(document.querySelectorAll('.product-card'));
      if (productCards.length === 0) return null;
      
      const card = productCards[0]; // Get first product
      const title = card.querySelector('h4')?.textContent || 'Unknown';
      const variants = card.querySelectorAll('.variant-option').length;
      const images = card.querySelectorAll('img').length;
      const isIncomplete = card.classList.contains('incomplete-product');
      
      return {
        title,
        variants,
        images,
        isIncomplete,
        isBroken: variants === 0 && images === 0
      };
    });
    
    return products || { title: 'No Product', variants: 0, images: 0, isBroken: true };
  }

  analyzeResults() {
    console.log('\n📊 CACHE FIX ANALYSIS');
    console.log('=' .repeat(40));
    
    if (this.testResults.length < 2) {
      return { success: false, issue: 'insufficient_data' };
    }
    
    const created = this.testResults.find(r => r.stage === 'created');
    const afterRefresh = this.testResults.find(r => r.stage === 'after_refresh');
    const afterWait = this.testResults.find(r => r.stage === 'after_wait');
    
    // Check if fix worked
    const fixWorked = {
      productPersisted: afterRefresh && !afterRefresh.product.isBroken,
      variantsPersisted: afterRefresh && afterRefresh.product.variants > 0,
      imagesPersisted: afterRefresh && afterRefresh.product.images > 0,
      stableOverTime: afterWait && !afterWait.product.isBroken
    };
    
    console.log('🔍 Fix Analysis:');
    console.log(`   Product Persisted: ${fixWorked.productPersisted ? '✅' : '❌'}`);
    console.log(`   Variants Persisted: ${fixWorked.variantsPersisted ? '✅' : '❌'}`);
    console.log(`   Images Persisted: ${fixWorked.imagesPersisted ? '✅' : '❌'}`);
    console.log(`   Stable Over Time: ${fixWorked.stableOverTime ? '✅' : '❌'}`);
    
    const overallSuccess = Object.values(fixWorked).every(Boolean);
    
    if (overallSuccess) {
      console.log('\n🎉 CACHE FIX SUCCESSFUL!');
      console.log('   Products now persist correctly with variants and images');
    } else {
      console.log('\n❌ CACHE FIX INCOMPLETE');
      console.log('   Products still losing data after refresh');
    }
    
    return {
      success: overallSuccess,
      fixWorked,
      testResults: this.testResults
    };
  }

  async runTest() {
    try {
      await this.setup();
      
      console.log('🔧 Starting Cache Flaw Fix Test');
      console.log('=' .repeat(50));
      
      const result = await this.testProductPersistenceAfterFix();
      
      console.log('\n📊 CACHE FIX TEST REPORT');
      console.log('=' .repeat(40));
      
      console.log(`🎯 Test Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      
      if (result.success) {
        console.log('✅ Cache flaw has been fixed!');
        console.log('   Products maintain variants and images after refresh');
        console.log('   No more broken products requiring cleanup');
      } else {
        console.log('❌ Cache flaw still exists');
        console.log('   Products continue to lose data after refresh');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new CacheFlawFixTest();
  test.runTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = CacheFlawFixTest;