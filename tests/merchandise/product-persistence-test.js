/**
 * Product Persistence Test
 * 
 * Tests product creation, persistence, and auto-removal scenarios
 * Addresses issues with products being auto-removed unexpectedly
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductPersistenceTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testProducts = [];
    this.productStates = [];
  }

  async setup() {
    console.log('🚀 Setting up Product Persistence Test');
    
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
      if (text.includes('product') || text.includes('cleanup') || text.includes('delete')) {
        console.log(`📱 Console: ${text}`);
      }
    });
  }

  async testProductCreationAndPersistence() {
    console.log('\n🎯 Test 1: Product Creation and Persistence');
    console.log('=' .repeat(60));
    
    try {
      // Navigate to merchandise store
      await this.page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      
      // Record initial product count
      const initialProducts = await this.getProductCount();
      console.log(`📦 Initial product count: ${initialProducts}`);
      
      // Select first image
      console.log('📸 Selecting first gallery image...');
      const selectButton = await this.page.waitForSelector('.gallery-image-select');
      await selectButton.click();
      await wait(500);
      
      // Wait for product navigator to load
      await this.page.waitForSelector('#choose-product-section');
      
      // Try to create a product
      console.log('🎽 Attempting to create a product...');
      
      // Click first available product option
      const productButton = await this.page.waitForSelector('.select-product-btn, .select-product-type-btn');
      await productButton.click();
      
      // Wait for customization modal
      await this.page.waitForSelector('.product-customization-modal', { timeout: 10000 });
      
      // Click Design Product button
      const designBtn = await this.page.waitForSelector('#createProductBtn');
      await designBtn.click();
      
      // Wait for product creation to complete (up to 2 minutes)
      console.log('⏳ Waiting for product creation to complete...');
      
      let productCreated = false;
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes with 5-second intervals
      
      while (attempts < maxAttempts && !productCreated) {
        await wait(5000);
        attempts++;
        
        const currentProducts = await this.getProductCount();
        if (currentProducts > initialProducts) {
          productCreated = true;
          console.log(`✅ Product created! Count increased from ${initialProducts} to ${currentProducts}`);
        } else {
          console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Still ${currentProducts} products`);
        }
        
        // Check if loading modal is still visible
        const isLoading = await this.page.evaluate(() => {
          const modal = document.querySelector('#loading-modal');
          return modal && modal.style.display !== 'none';
        });
        
        if (!isLoading && attempts > 3) {
          console.log('⚠️ Loading modal disappeared but no product created yet');
        }
      }
      
      if (!productCreated) {
        console.log('❌ Product creation failed or timed out');
        return false;
      }
      
      // Capture product details
      const productDetails = await this.captureProductDetails();
      this.testProducts.push({
        timestamp: Date.now(),
        details: productDetails,
        action: 'created'
      });
      
      console.log(`📋 Created product details:`, productDetails);
      
      return true;
      
    } catch (error) {
      console.error('❌ Product creation test failed:', error);
      return false;
    }
  }

  async testProductPersistenceAfterRefresh() {
    console.log('\n🎯 Test 2: Product Persistence After Page Refresh');
    console.log('=' .repeat(60));
    
    try {
      // Record products before refresh
      const productsBeforeRefresh = await this.captureProductDetails();
      console.log(`📦 Products before refresh: ${productsBeforeRefresh.length}`);
      
      // Refresh the page
      console.log('🔄 Refreshing page...');
      await this.page.reload({ waitUntil: 'networkidle2' });
      await wait(2000);
      
      // Record products after refresh
      const productsAfterRefresh = await this.captureProductDetails();
      console.log(`📦 Products after refresh: ${productsAfterRefresh.length}`);
      
      // Compare products
      const removedProducts = productsBeforeRefresh.filter(before => 
        !productsAfterRefresh.some(after => after.title === before.title)
      );
      
      const addedProducts = productsAfterRefresh.filter(after => 
        !productsBeforeRefresh.some(before => before.title === after.title)
      );
      
      if (removedProducts.length > 0) {
        console.log(`❌ ${removedProducts.length} products were removed after refresh:`);
        removedProducts.forEach(product => {
          console.log(`   - ${product.title} (${product.variants} variants, ${product.images} images)`);
        });
      }
      
      if (addedProducts.length > 0) {
        console.log(`➕ ${addedProducts.length} products were added after refresh:`);
        addedProducts.forEach(product => {
          console.log(`   + ${product.title} (${product.variants} variants, ${product.images} images)`);
        });
      }
      
      if (removedProducts.length === 0 && addedProducts.length === 0) {
        console.log('✅ All products persisted correctly after refresh');
      }
      
      // Record state change
      this.productStates.push({
        timestamp: Date.now(),
        action: 'refresh',
        before: productsBeforeRefresh.length,
        after: productsAfterRefresh.length,
        removed: removedProducts.length,
        added: addedProducts.length
      });
      
      return removedProducts.length === 0;
      
    } catch (error) {
      console.error('❌ Product persistence test failed:', error);
      return false;
    }
  }

  async testAutoRemovalCriteria() {
    console.log('\n🎯 Test 3: Auto-Removal Criteria Analysis');
    console.log('=' .repeat(60));
    
    try {
      const products = await this.captureProductDetails();
      console.log(`📦 Analyzing ${products.length} products for auto-removal criteria`);
      
      const brokenProducts = [];
      const incompleteProducts = [];
      const validProducts = [];
      
      products.forEach(product => {
        const isBroken = product.variants === 0 && product.images === 0;
        const isIncomplete = product.variants === 0 || product.images === 0;
        
        if (isBroken) {
          brokenProducts.push(product);
        } else if (isIncomplete) {
          incompleteProducts.push(product);
        } else {
          validProducts.push(product);
        }
      });
      
      console.log(`\n📊 Product Analysis Results:`);
      console.log(`   ✅ Valid products: ${validProducts.length}`);
      console.log(`   ⚠️ Incomplete products: ${incompleteProducts.length}`);
      console.log(`   ❌ Broken products: ${brokenProducts.length}`);
      
      if (brokenProducts.length > 0) {
        console.log(`\n🗑️ Broken products (should be auto-removed):`);
        brokenProducts.forEach(product => {
          console.log(`   - ${product.title}: ${product.variants} variants, ${product.images} images`);
        });
      }
      
      if (incompleteProducts.length > 0) {
        console.log(`\n⏳ Incomplete products (may be processing):`);
        incompleteProducts.forEach(product => {
          console.log(`   - ${product.title}: ${product.variants} variants, ${product.images} images`);
        });
      }
      
      // Test the cleanup function by triggering a reload
      if (brokenProducts.length > 0) {
        console.log(`\n🧹 Testing auto-cleanup of ${brokenProducts.length} broken products...`);
        await this.page.reload({ waitUntil: 'networkidle2' });
        await wait(3000);
        
        const productsAfterCleanup = await this.captureProductDetails();
        const remainingBroken = productsAfterCleanup.filter(product => 
          product.variants === 0 && product.images === 0
        );
        
        if (remainingBroken.length < brokenProducts.length) {
          const cleanedCount = brokenProducts.length - remainingBroken.length;
          console.log(`✅ Auto-cleanup working: ${cleanedCount} broken products removed`);
        } else {
          console.log(`⚠️ Auto-cleanup may not be working: ${remainingBroken.length} broken products remain`);
        }
      }
      
      return {
        valid: validProducts.length,
        incomplete: incompleteProducts.length,
        broken: brokenProducts.length
      };
      
    } catch (error) {
      console.error('❌ Auto-removal criteria test failed:', error);
      return null;
    }
  }

  async testProductAgeAndRemoval() {
    console.log('\n🎯 Test 4: Product Age and Time-Based Removal');
    console.log('=' .repeat(60));
    
    try {
      // Check if we can access product creation timestamps
      const productTimestamps = await this.page.evaluate(() => {
        const products = Array.from(document.querySelectorAll('.product-card'));
        return products.map(card => {
          const title = card.querySelector('h4')?.textContent || 'Unknown';
          const isIncomplete = card.classList.contains('incomplete-product');
          
          // Try to find timestamp in data attributes or other indicators
          const timestamp = card.dataset.created || card.dataset.timestamp;
          
          return {
            title,
            isIncomplete,
            timestamp,
            hasTimestamp: !!timestamp
          };
        });
      });
      
      console.log(`📅 Product timestamp analysis:`);
      const withTimestamps = productTimestamps.filter(p => p.hasTimestamp);
      const withoutTimestamps = productTimestamps.filter(p => !p.hasTimestamp);
      
      console.log(`   Products with timestamps: ${withTimestamps.length}`);
      console.log(`   Products without timestamps: ${withoutTimestamps.length}`);
      
      if (withTimestamps.length > 0) {
        console.log(`\n⏰ Products with timestamps:`);
        withTimestamps.forEach(product => {
          const age = product.timestamp ? Date.now() - parseInt(product.timestamp) : 'Unknown';
          const ageMinutes = typeof age === 'number' ? Math.floor(age / 60000) : 'Unknown';
          console.log(`   - ${product.title}: ${ageMinutes} minutes old (incomplete: ${product.isIncomplete})`);
        });
      }
      
      // Check for products that might be old and incomplete (candidates for removal)
      const oldIncompleteProducts = productTimestamps.filter(product => {
        if (!product.timestamp || !product.isIncomplete) return false;
        const age = Date.now() - parseInt(product.timestamp);
        return age > 10 * 60 * 1000; // Older than 10 minutes
      });
      
      if (oldIncompleteProducts.length > 0) {
        console.log(`\n⚠️ Old incomplete products (candidates for removal):`);
        oldIncompleteProducts.forEach(product => {
          const ageMinutes = Math.floor((Date.now() - parseInt(product.timestamp)) / 60000);
          console.log(`   - ${product.title}: ${ageMinutes} minutes old`);
        });
      } else {
        console.log(`\n✅ No old incomplete products found`);
      }
      
      return {
        withTimestamps: withTimestamps.length,
        withoutTimestamps: withoutTimestamps.length,
        oldIncomplete: oldIncompleteProducts.length
      };
      
    } catch (error) {
      console.error('❌ Product age test failed:', error);
      return null;
    }
  }

  async getProductCount() {
    return await this.page.$$eval('.product-card', cards => cards.length);
  }

  async captureProductDetails() {
    return await this.page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('.product-card'));
      return products.map(card => {
        const title = card.querySelector('h4')?.textContent || 'Unknown';
        const variants = card.querySelectorAll('.variant-option').length;
        const images = card.querySelectorAll('img').length;
        const isIncomplete = card.classList.contains('incomplete-product');
        const hasProcessingOverlay = !!card.querySelector('.processing-overlay');
        const hasRetryButton = !!card.querySelector('.retry-setup-btn');
        const hasRefreshButton = !!card.querySelector('.refresh-status-btn');
        
        // Try to extract product ID
        const productId = card.querySelector('[data-product-id]')?.dataset.productId || 'unknown';
        
        return {
          title,
          productId,
          variants,
          images,
          isIncomplete,
          hasProcessingOverlay,
          hasRetryButton,
          hasRefreshButton
        };
      });
    });
  }

  async runAllTests() {
    try {
      await this.setup();
      
      console.log('🧪 Starting Product Persistence Tests');
      console.log('=' .repeat(80));
      
      // Test 1: Create a product and verify it persists
      const creationSuccess = await this.testProductCreationAndPersistence();
      
      // Test 2: Verify products persist after page refresh
      const persistenceSuccess = await this.testProductPersistenceAfterRefresh();
      
      // Test 3: Analyze auto-removal criteria
      const removalAnalysis = await this.testAutoRemovalCriteria();
      
      // Test 4: Check product age and time-based removal
      const ageAnalysis = await this.testProductAgeAndRemoval();
      
      // Generate comprehensive report
      this.generatePersistenceReport(creationSuccess, persistenceSuccess, removalAnalysis, ageAnalysis);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generatePersistenceReport(creationSuccess, persistenceSuccess, removalAnalysis, ageAnalysis) {
    console.log('\n📊 PRODUCT PERSISTENCE TEST REPORT');
    console.log('=' .repeat(80));
    
    console.log(`🎯 Test Results:`);
    console.log(`   Product Creation: ${creationSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Persistence After Refresh: ${persistenceSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Auto-Removal Analysis: ${removalAnalysis ? '✅ COMPLETED' : '❌ FAILED'}`);
    console.log(`   Age Analysis: ${ageAnalysis ? '✅ COMPLETED' : '❌ FAILED'}`);
    
    if (removalAnalysis) {
      console.log(`\n📊 Product Distribution:`);
      console.log(`   Valid Products: ${removalAnalysis.valid}`);
      console.log(`   Incomplete Products: ${removalAnalysis.incomplete}`);
      console.log(`   Broken Products: ${removalAnalysis.broken}`);
    }
    
    if (ageAnalysis) {
      console.log(`\n⏰ Timestamp Analysis:`);
      console.log(`   Products with timestamps: ${ageAnalysis.withTimestamps}`);
      console.log(`   Products without timestamps: ${ageAnalysis.withoutTimestamps}`);
      console.log(`   Old incomplete products: ${ageAnalysis.oldIncomplete}`);
    }
    
    console.log(`\n📋 Product State Changes: ${this.productStates.length}`);
    this.productStates.forEach(state => {
      console.log(`   ${state.action}: ${state.before} → ${state.after} (${state.removed} removed, ${state.added} added)`);
    });
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (!creationSuccess) {
      console.log(`   - Investigate product creation process`);
      console.log(`   - Check for timeout issues in product setup`);
      console.log(`   - Verify API endpoints are responding correctly`);
    }
    
    if (!persistenceSuccess) {
      console.log(`   - Review auto-cleanup logic - may be too aggressive`);
      console.log(`   - Check product validation criteria`);
      console.log(`   - Consider adding grace period for incomplete products`);
    }
    
    if (removalAnalysis && removalAnalysis.broken > 0) {
      console.log(`   - ${removalAnalysis.broken} broken products should be cleaned up`);
    }
    
    if (removalAnalysis && removalAnalysis.incomplete > 0) {
      console.log(`   - Monitor ${removalAnalysis.incomplete} incomplete products for processing completion`);
    }
    
    if (ageAnalysis && ageAnalysis.oldIncomplete > 0) {
      console.log(`   - Consider removing ${ageAnalysis.oldIncomplete} old incomplete products`);
    }
    
    console.log(`\n🎯 Test completed successfully!`);
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new ProductPersistenceTest();
  test.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = ProductPersistenceTest;