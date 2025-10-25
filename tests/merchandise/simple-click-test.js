/**
 * Simple Product Click Test
 * Basic test to see what's on the merchandise page and test clicking
 */

const puppeteer = require('puppeteer');

async function simpleClickTest() {
  let browser;
  
  try {
    console.log('🚀 Starting Simple Click Test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a moment for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's actually on the page
    console.log('🔍 Checking page content...');
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check for any merchandise-related elements
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('📝 Page contains "merchandise":', bodyText.toLowerCase().includes('merchandise'));
    console.log('📝 Page contains "product":', bodyText.toLowerCase().includes('product'));
    
    // Look for any containers or main elements
    const containers = await page.$$eval('div[id], div[class*="store"], div[class*="merchandise"], main, .container', 
      elements => elements.map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        hasContent: el.innerText.length > 0
      }))
    );
    
    console.log('📦 Found containers:', containers);
    
    // Look for any product-related elements
    const productElements = await page.$$eval('*[class*="product"], *[id*="product"]', 
      elements => elements.map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: el.innerText.substring(0, 100)
      }))
    );
    
    console.log('🛍️ Found product elements:', productElements);
    
    // Look for any buttons
    const buttons = await page.$$eval('button', 
      elements => elements.map(el => ({
        text: el.innerText,
        className: el.className,
        id: el.id
      }))
    );
    
    console.log('🔘 Found buttons:', buttons);
    
    // Try to find and click any clickable elements
    const clickableElements = await page.$$('button, .btn, [onclick], .clickable, .product-card, .edit-product-btn');
    console.log(`🖱️ Found ${clickableElements.length} potentially clickable elements`);
    
    if (clickableElements.length > 0) {
      console.log('🖱️ Testing click on first clickable element...');
      try {
        await clickableElements[0].click();
        console.log('✅ Click successful');
        
        // Wait to see if anything happens
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for any modals or changes
        const modals = await page.$$('.modal, [style*="display: block"], [style*="display:block"]');
        console.log(`📱 Found ${modals.length} potential modals after click`);
        
      } catch (error) {
        console.log('❌ Click failed:', error.message);
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'merchandise-page-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as merchandise-page-debug.png');
    
    console.log('✅ Simple click test completed!');
    
  } catch (error) {
    console.error('❌ Simple click test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  simpleClickTest()
    .then(() => {
      console.log('🎉 Simple click test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Simple click test failed:', error);
      process.exit(1);
    });
}

module.exports = { simpleClickTest };