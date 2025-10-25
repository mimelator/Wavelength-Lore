/**
 * Debug Authentication and Access Test
 * 
 * Check if user has proper VIP access for merchandise
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function debugAuthAccess() {
  console.log('🔐 Starting Auth Access Debug Test\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to merchandise page
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login - not authenticated');
      return;
    }
    
    // Check page content for access issues
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasErrorMessage: !!document.querySelector('.error-message, .alert-danger'),
        hasAccessDenied: document.body.textContent.includes('Access Denied') || document.body.textContent.includes('VIP'),
        hasGalleryImages: !!document.querySelector('.gallery-image-card'),
        hasProductTypes: !!document.querySelector('.select-product-type-btn'),
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('Page Analysis:');
    console.log('- Title:', pageContent.title);
    console.log('- Has Error Message:', pageContent.hasErrorMessage);
    console.log('- Has Access Denied:', pageContent.hasAccessDenied);
    console.log('- Has Gallery Images:', pageContent.hasGalleryImages);
    console.log('- Has Product Types:', pageContent.hasProductTypes);
    
    if (pageContent.hasAccessDenied) {
      console.log('\n❌ ACCESS ISSUE DETECTED');
      console.log('Body text preview:', pageContent.bodyText);
    }
    
    // Test API endpoints directly
    console.log('\n🧪 Testing API endpoints...');
    
    const apiTests = [
      '/api/merchandise/enhancement-status',
      '/api/merchandise/product-types',
      '/api/merchandise/gallery-images',
      '/api/merchandise/products'
    ];
    
    for (const endpoint of apiTests) {
      try {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(url);
          return {
            status: res.status,
            statusText: res.statusText,
            body: await res.text()
          };
        }, `${BASE_URL}${endpoint}`);
        
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        if (response.status !== 200) {
          console.log(`  Error: ${response.body.substring(0, 200)}`);
        }
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run debug test
debugAuthAccess().catch(console.error);