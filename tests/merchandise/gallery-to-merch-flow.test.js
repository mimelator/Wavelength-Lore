/**
 * Gallery to Merchandise Store Flow Test
 * Tests clicking overlay in gallery to navigate to merchandise store
 */

const puppeteer = require('puppeteer');

async function testGalleryToMerchFlow() {
  let browser;
  
  try {
    console.log('🔍 Testing Gallery to Merchandise Store Flow...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', text);
      } else if (text.includes('❌') || text.includes('Failed')) {
        console.log('🚨 Error Message:', text);
      } else if (text.includes('✅') || text.includes('loaded') || text.includes('initialized')) {
        console.log('✅ Success:', text);
      }
    });
    
    console.log('🖼️ Step 1: Loading gallery page...');
    await page.goto('http://localhost:3001/my-gallery', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for gallery to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if gallery loaded properly
    const galleryStatus = await page.evaluate(() => {
      return {
        hasGalleryContainer: !!document.querySelector('.gallery-main-container'),
        hasMerchLink: !!document.querySelector('.merch-link-button'),
        merchLinkText: document.querySelector('.merch-link-button')?.textContent,
        merchLinkHref: document.querySelector('.merch-link-button')?.href
      };
    });
    
    console.log('📊 Gallery Status:');
    console.log('- Container exists:', galleryStatus.hasGalleryContainer ? '✅' : '❌');
    console.log('- Merch link exists:', galleryStatus.hasMerchLink ? '✅' : '❌');
    console.log('- Merch link text:', galleryStatus.merchLinkText);
    console.log('- Merch link URL:', galleryStatus.merchLinkHref);
    
    if (!galleryStatus.hasMerchLink) {
      console.log('❌ No merchandise link found in gallery');
      return;
    }
    
    console.log('\n🛍️ Step 2: Clicking merchandise store link...');
    await page.click('.merch-link-button');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('📍 Current URL:', page.url());
    
    // Wait for merchandise store to initialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔍 Step 3: Checking merchandise store initialization...');
    
    const merchStatus = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasContainer: !!document.getElementById('merchandise-store'),
        hasHeader: !!document.querySelector('.store-header'),
        hasGallerySection: !!document.querySelector('.gallery-grid'),
        hasMerchandiseStore: typeof window.MerchandiseStore !== 'undefined',
        hasProductNavigator: typeof window.ProductNavigator !== 'undefined',
        storeInstance: !!window.merchandiseStore,
        navigatorContainer: !!document.getElementById('product-navigator'),
        
        // Check for product categories specifically
        hasProductNavigatorContainer: !!document.getElementById('product-navigator-container'),
        navigatorContent: document.getElementById('product-navigator')?.innerHTML?.substring(0, 200) || 'No content',
        categoriesVisible: document.querySelectorAll('.category-card').length,
        subcategoriesVisible: document.querySelectorAll('.subcategory-card').length,
        productsVisible: document.querySelectorAll('.product-card').length,
        
        // Check for loading states
        hasLoadingSpinner: !!document.querySelector('.loading-spinner'),
        hasErrorState: !!document.querySelector('.error-state'),
        
        // Get any visible text from the navigator area
        navigatorText: document.getElementById('product-navigator-container')?.textContent?.substring(0, 300) || 'No navigator text'
      };
    });
    
    console.log('\n📊 MERCHANDISE STORE STATUS:');
    console.log('============================');
    console.log('URL:', merchStatus.url);
    console.log('Title:', merchStatus.title);
    console.log('Container exists:', merchStatus.hasContainer ? '✅' : '❌');
    console.log('Header exists:', merchStatus.hasHeader ? '✅' : '❌');
    console.log('Gallery section:', merchStatus.hasGallerySection ? '✅' : '❌');
    console.log('');
    console.log('JavaScript Classes:');
    console.log('- MerchandiseStore:', merchStatus.hasMerchandiseStore ? '✅' : '❌');
    console.log('- ProductNavigator:', merchStatus.hasProductNavigator ? '✅' : '❌');
    console.log('- Store instance:', merchStatus.storeInstance ? '✅' : '❌');
    console.log('');
    console.log('Product Navigator:');
    console.log('- Navigator container:', merchStatus.hasProductNavigatorContainer ? '✅' : '❌');
    console.log('- Navigator element:', merchStatus.navigatorContainer ? '✅' : '❌');
    console.log('- Categories visible:', merchStatus.categoriesVisible);
    console.log('- Subcategories visible:', merchStatus.subcategoriesVisible);
    console.log('- Products visible:', merchStatus.productsVisible);
    console.log('- Loading spinner:', merchStatus.hasLoadingSpinner ? '⏳' : '❌');
    console.log('- Error state:', merchStatus.hasErrorState ? '❌' : '✅');
    
    console.log('\n📝 Navigator Content Preview:');
    console.log(merchStatus.navigatorContent);
    
    console.log('\n📝 Navigator Text Preview:');
    console.log(merchStatus.navigatorText);
    
    // If no categories are visible, try selecting an image first
    if (merchStatus.categoriesVisible === 0 && !merchStatus.hasLoadingSpinner) {
      console.log('\n🖼️ Step 4: No categories visible, trying to select an image first...');
      
      const imageSelected = await page.evaluate(() => {
        const selectBtn = document.querySelector('.gallery-image-select');
        if (selectBtn) {
          selectBtn.click();
          return true;
        }
        return false;
      });
      
      if (imageSelected) {
        console.log('✅ Image selection attempted');
        
        // Wait for product navigator to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const afterImageSelection = await page.evaluate(() => {
          return {
            categoriesVisible: document.querySelectorAll('.category-card').length,
            subcategoriesVisible: document.querySelectorAll('.subcategory-card').length,
            productsVisible: document.querySelectorAll('.product-card').length,
            navigatorContent: document.getElementById('product-navigator')?.innerHTML?.substring(0, 300) || 'No content',
            hasChooseProductSection: !!document.getElementById('choose-product-section'),
            navigatorInitialized: !!window.merchandiseStore?.productNavigator
          };
        });
        
        console.log('\n📊 AFTER IMAGE SELECTION:');
        console.log('=========================');
        console.log('- Categories visible:', afterImageSelection.categoriesVisible);
        console.log('- Subcategories visible:', afterImageSelection.subcategoriesVisible);
        console.log('- Products visible:', afterImageSelection.productsVisible);
        console.log('- Choose product section:', afterImageSelection.hasChooseProductSection ? '✅' : '❌');
        console.log('- Navigator initialized:', afterImageSelection.navigatorInitialized ? '✅' : '❌');
        
        console.log('\n📝 Updated Navigator Content:');
        console.log(afterImageSelection.navigatorContent);
      } else {
        console.log('❌ No gallery image select button found');
      }
    }
    
    // Take screenshot for visual inspection
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: 'gallery-to-merch-flow.png',
      fullPage: true
    });
    console.log('Screenshot saved as: gallery-to-merch-flow.png');
    
    // Test API endpoints manually
    console.log('\n🌐 Step 5: Testing API endpoints...');
    
    const apiTests = await page.evaluate(async () => {
      const results = {};
      
      try {
        const catalogResponse = await fetch('/api/merchandise/product-types');
        results.catalog = {
          status: catalogResponse.status,
          ok: catalogResponse.ok,
          data: catalogResponse.ok ? await catalogResponse.json() : null
        };
      } catch (e) {
        results.catalog = { error: e.message };
      }
      
      try {
        const categoriesResponse = await fetch('/api/merchandise/categories');
        results.categories = {
          status: categoriesResponse.status,
          ok: categoriesResponse.ok,
          data: categoriesResponse.ok ? await categoriesResponse.json() : null
        };
      } catch (e) {
        results.categories = { error: e.message };
      }
      
      return results;
    });
    
    console.log('API Test Results:');
    console.log('- Product Catalog:', apiTests.catalog.ok ? '✅' : '❌', apiTests.catalog.status);
    console.log('- Categories:', apiTests.categories.ok ? '✅' : '❌', apiTests.categories.status);
    
    if (apiTests.catalog.ok) {
      console.log('- Total products:', apiTests.catalog.data?.totalProducts);
      console.log('- Categories count:', Object.keys(apiTests.catalog.data?.categories || {}).length);
    }
    
    console.log('\n🏁 FLOW TEST SUMMARY:');
    console.log('=====================');
    console.log('Gallery → Merch Navigation:', '✅');
    console.log('Merchandise Store Loading:', merchStatus.hasContainer ? '✅' : '❌');
    console.log('JavaScript Initialization:', merchStatus.storeInstance ? '✅' : '❌');
    console.log('Product Categories Visible:', merchStatus.categoriesVisible > 0 ? '✅' : '❌');
    console.log('API Endpoints Working:', apiTests.catalog.ok && apiTests.categories.ok ? '✅' : '❌');
    
    // Keep browser open for inspection
    console.log('\n👀 Browser kept open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {});
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Browser already closed
      }
    }
  }
}

// Run the test
testGalleryToMerchFlow().catch(console.error);