/**
 * Quick Merchandise Store Test
 * Direct test of merchandise store functionality
 */

const puppeteer = require('puppeteer');

async function quickMerchTest() {
  let browser;
  
  try {
    console.log('🔍 Quick Merchandise Store Test...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('categories') || text.includes('products') || text.includes('navigator')) {
        console.log('📋', text);
      }
    });
    
    console.log('🛍️ Loading merchandise store directly...');
    await page.goto('http://localhost:3001/merchandise', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('\n🔍 Checking product categories...');
    
    const status = await page.evaluate(() => {
      return {
        // Check if image is selected (required for categories to show)
        selectedImage: !!window.merchandiseStore?.selectedImage,
        
        // Check for product navigator
        hasNavigatorContainer: !!document.getElementById('product-navigator-container'),
        navigatorVisible: document.getElementById('product-navigator-container')?.style.display !== 'none',
        
        // Check for categories
        categoriesVisible: document.querySelectorAll('.category-card').length,
        categoryNames: Array.from(document.querySelectorAll('.category-name')).map(el => el.textContent),
        
        // Check for choose product section
        hasChooseProductSection: !!document.getElementById('choose-product-section'),
        chooseProductVisible: document.getElementById('choose-product-section')?.style.display !== 'none',
        
        // Check gallery images
        galleryImages: document.querySelectorAll('.gallery-image-card').length,
        selectButtons: document.querySelectorAll('.gallery-image-select').length,
        
        // Get navigator content
        navigatorHTML: document.getElementById('product-navigator')?.innerHTML?.substring(0, 500) || 'No content'
      };
    });
    
    console.log('📊 STATUS:');
    console.log('- Selected image:', status.selectedImage ? '✅' : '❌');
    console.log('- Navigator container:', status.hasNavigatorContainer ? '✅' : '❌');
    console.log('- Choose product section:', status.hasChooseProductSection ? '✅' : '❌');
    console.log('- Gallery images:', status.galleryImages);
    console.log('- Select buttons:', status.selectButtons);
    console.log('- Categories visible:', status.categoriesVisible);
    console.log('- Category names:', status.categoryNames);
    
    if (status.categoriesVisible === 0 && status.selectButtons > 0) {
      console.log('\n🖼️ No categories visible. Selecting first image...');
      
      await page.click('.gallery-image-select');
      
      // Wait for product navigator to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const afterSelection = await page.evaluate(() => {
        return {
          selectedImage: !!window.merchandiseStore?.selectedImage,
          categoriesVisible: document.querySelectorAll('.category-card').length,
          categoryNames: Array.from(document.querySelectorAll('.category-name')).map(el => el.textContent),
          navigatorContent: document.getElementById('product-navigator')?.innerHTML?.substring(0, 300) || 'No content',
          hasChooseProductSection: !!document.getElementById('choose-product-section'),
          navigatorInitialized: !!window.merchandiseStore?.productNavigator
        };
      });
      
      console.log('\n📊 AFTER IMAGE SELECTION:');
      console.log('- Selected image:', afterSelection.selectedImage ? '✅' : '❌');
      console.log('- Categories visible:', afterSelection.categoriesVisible);
      console.log('- Category names:', afterSelection.categoryNames);
      console.log('- Choose product section:', afterSelection.hasChooseProductSection ? '✅' : '❌');
      console.log('- Navigator initialized:', afterSelection.navigatorInitialized ? '✅' : '❌');
      
      console.log('\n📝 Navigator Content:');
      console.log(afterSelection.navigatorContent);
    }
    
    // Test API directly
    console.log('\n🌐 Testing API endpoints...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/merchandise/product-types');
        const data = await response.json();
        return {
          success: true,
          totalProducts: data.totalProducts,
          categoriesCount: Object.keys(data.categories || {}).length,
          categoryNames: Object.keys(data.categories || {})
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
    
    console.log('API Results:');
    console.log('- Success:', apiTest.success ? '✅' : '❌');
    if (apiTest.success) {
      console.log('- Total products:', apiTest.totalProducts);
      console.log('- Categories:', apiTest.categoriesCount);
      console.log('- Category names:', apiTest.categoryNames);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'quick-merch-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: quick-merch-test.png');
    
    console.log('\n🏁 Test complete! Browser kept open for inspection.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}

quickMerchTest().catch(console.error);