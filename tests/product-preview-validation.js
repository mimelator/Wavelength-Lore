/**
 * Product Preview Image Test
 * 
 * Validates that product preview images are loading correctly
 * and not all falling back to the generic placeholder
 */

const puppeteer = require('puppeteer');

class ProductPreviewTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      totalPreviews: 0,
      genericPreviews: 0,
      loadingPreviews: 0,
      validPreviews: 0,
      printifyOfficialPreviews: 0,
      uniquePreviewImages: new Set(),
      blueprintIds: [],
      previewUrls: []
    };
  }

  async initialize() {
    console.log('🔍 Initializing Product Preview Test...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent results
    await this.page.setViewport({ width: 1280, height: 720 });
    
    console.log('✅ Browser initialized');
  }

  async navigateToMerchandiseStore() {
    console.log('🌐 Navigating to merchandise store...');
    
    try {
      await this.page.goto('http://localhost:3001/merchandise', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      console.log('✅ Successfully loaded merchandise store');
      return true;
    } catch (error) {
      console.error('❌ Failed to load merchandise store:', error.message);
      return false;
    }
  }

  async selectProductCategory() {
    console.log('🎯 Selecting a product category to test previews...');
    
    try {
      // Wait for category cards to load
      await this.page.waitForSelector('.category-card', { timeout: 10000 });
      
      // Click on the first category card
      const categoryCards = await this.page.$$('.category-card');
      if (categoryCards.length === 0) {
        throw new Error('No category cards found');
      }
      
      console.log(`📋 Found ${categoryCards.length} category cards`);
      
      // Click the first category
      await categoryCards[0].click();
      
      // Wait for products to load
      await this.page.waitForSelector('.product-item', { timeout: 15000 });
      
      console.log('✅ Products loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to select category or load products:', error.message);
      return false;
    }
  }

  async analyzeProductPreviews() {
    console.log('🔍 Analyzing product preview images...');
    
    try {
      // Wait a bit for images to load
      await this.page.waitForTimeout(5000);
      
      // Get all product preview images
      const previewData = await this.page.evaluate(() => {
        const previewContainers = document.querySelectorAll('.product-preview-image[data-blueprint-id]');
        const results = [];
        
        previewContainers.forEach(container => {
          const img = container.querySelector('.blueprint-preview-img');
          const blueprintId = container.dataset.blueprintId;
          
          if (img) {
            results.push({
              blueprintId: parseInt(blueprintId),
              src: img.src,
              alt: img.alt,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            });
          }
        });
        
        return results;
      });
      
      this.testResults.totalPreviews = previewData.length;
      console.log(`📊 Found ${previewData.length} product preview images`);
      
      // Analyze each preview
        previewData.forEach(preview => {
        this.testResults.blueprintIds.push(preview.blueprintId);
        this.testResults.previewUrls.push(preview.src);
        this.testResults.uniquePreviewImages.add(preview.src);
        
        if (preview.src.includes('generic-product-preview.svg')) {
          this.testResults.genericPreviews++;
        } else if (preview.src.includes('loading-preview.svg')) {
          this.testResults.loadingPreviews++;
        } else if (preview.src.includes('images.printify.com')) {
          // This is an official Printify preview image!
          this.testResults.validPreviews++;
          this.testResults.printifyOfficialPreviews++;
        } else {
          // Other valid preview (custom or other source)
          this.testResults.validPreviews++;
        }
      });      return previewData;
    } catch (error) {
      console.error('❌ Failed to analyze preview images:', error.message);
      return [];
    }
  }

  async testBlueprintPreviewAPI() {
    console.log('🧪 Testing blueprint preview API directly...');
    
    try {
      // Test a few blueprint IDs
      const testBlueprintIds = [413, 68, 77, 238, 5, 6];
      
      for (const blueprintId of testBlueprintIds) {
        const response = await this.page.evaluate(async (id) => {
          try {
            const res = await fetch(`/api/merchandise/blueprint-preview/${id}`);
            return {
              status: res.status,
              data: await res.json()
            };
          } catch (error) {
            return {
              status: 'error',
              error: error.message
            };
          }
        }, blueprintId);
        
        console.log(`📡 Blueprint ${blueprintId}:`, response.status === 200 ? '✅' : '❌', 
                   response.data?.success ? response.data.name : 'Failed');
      }
    } catch (error) {
      console.error('❌ API test failed:', error.message);
    }
  }

  async checkNetworkRequests() {
    console.log('🌐 Analyzing network requests for preview loading...');
    
    const networkLogs = [];
    
    this.page.on('response', response => {
      if (response.url().includes('blueprint-preview')) {
        networkLogs.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Trigger a category selection to see network activity
    try {
      await this.page.reload({ waitUntil: 'networkidle0' });
      await this.selectProductCategory();
      
      console.log('📊 Blueprint preview network requests:');
      networkLogs.forEach(log => {
        console.log(`  ${log.status === 200 ? '✅' : '❌'} ${log.url} (${log.status})`);
      });
      
      return networkLogs;
    } catch (error) {
      console.error('❌ Network analysis failed:', error.message);
      return [];
    }
  }

  generateReport() {
    console.log('\n📋 PRODUCT PREVIEW TEST REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { totalPreviews, genericPreviews, loadingPreviews, validPreviews, printifyOfficialPreviews } = this.testResults;
    
    console.log(`📊 Total Previews Found: ${totalPreviews}`);
    console.log(`🎨 Valid Preview Images: ${validPreviews} (${((validPreviews/totalPreviews)*100).toFixed(1)}%)`);
    console.log(`🏢 Official Printify Images: ${printifyOfficialPreviews} (${((printifyOfficialPreviews/totalPreviews)*100).toFixed(1)}%)`);
    console.log(`⏳ Loading Placeholder: ${loadingPreviews} (${((loadingPreviews/totalPreviews)*100).toFixed(1)}%)`);
    console.log(`🔄 Generic Fallback: ${genericPreviews} (${((genericPreviews/totalPreviews)*100).toFixed(1)}%)`);
    console.log(`🖼️ Unique Image URLs: ${this.testResults.uniquePreviewImages.size}`);
    
    if (this.testResults.blueprintIds.length > 0) {
      console.log(`\n🎯 Blueprint IDs Found: ${this.testResults.blueprintIds.slice(0, 10).join(', ')}${this.testResults.blueprintIds.length > 10 ? '...' : ''}`);
    }
    
    // Issue detection
    const issues = [];
    
    if (genericPreviews === totalPreviews && totalPreviews > 0) {
      issues.push('🚨 ALL previews are showing generic fallback - preview loading completely failed');
    } else if (genericPreviews > totalPreviews * 0.8) {
      issues.push('⚠️ Most previews are generic fallback - preview loading mostly failed');
    }
    
    if (loadingPreviews > 0) {
      issues.push('⏳ Some previews still showing loading state - API may be slow or failed');
    }
    
    if (this.testResults.uniquePreviewImages.size === 1) {
      issues.push('🔄 All previews using same image - no variety in preview system');
    }
    
    if (issues.length > 0) {
      console.log('\n🚨 ISSUES DETECTED:');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('\n✅ PREVIEW SYSTEM WORKING CORRECTLY');
    }
    
    // Success criteria
    const successRate = (validPreviews / totalPreviews) * 100;
    const isSuccessful = successRate >= 50 && this.testResults.uniquePreviewImages.size > 1;
    
    console.log(`\n🎯 TEST RESULT: ${isSuccessful ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}% (Target: ≥50%)`);
    console.log(`   Image Variety: ${this.testResults.uniquePreviewImages.size > 1 ? '✅' : '❌'} (Target: >1 unique images)`);
    
    return {
      success: isSuccessful,
      successRate,
      totalPreviews,
      validPreviews,
      issues
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async runFullTest() {
    try {
      await this.initialize();
      
      const loaded = await this.navigateToMerchandiseStore();
      if (!loaded) {
        throw new Error('Failed to load merchandise store');
      }
      
      const categorySelected = await this.selectProductCategory();
      if (!categorySelected) {
        throw new Error('Failed to select category');
      }
      
      await this.analyzeProductPreviews();
      await this.testBlueprintPreviewAPI();
      
      const report = this.generateReport();
      
      return report;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new ProductPreviewTest();
  
  test.runFullTest().then(result => {
    console.log('\n🏁 Test completed');
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
}

module.exports = ProductPreviewTest;