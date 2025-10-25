const puppeteer = require('puppeteer');

async function debugChooseMerchHTML() {
  console.log('🔍 Debugging Choose Your Merch HTML rendering...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages and errors
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log('💥 Page Error:', text);
      } else if (text.includes('MerchandiseStore') || text.includes('Choose') || text.includes('Merch')) {
        console.log(`📱 Browser: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message);
    });
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the store to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if Choose Your Merch section exists
    console.log('\n🔍 Checking for Choose Your Merch section...');
    
    const chooseMerchSection = await page.$('#choose-product-section');
    if (chooseMerchSection) {
      console.log('✅ Choose Your Merch section found');
      
      // Get the HTML content of the section
      const sectionHTML = await page.evaluate(() => {
        const section = document.getElementById('choose-product-section');
        return section ? section.innerHTML : 'Section not found';
      });
      
      console.log('\n📄 Choose Your Merch section HTML:');
      console.log('=' .repeat(80));
      console.log(sectionHTML);
      console.log('=' .repeat(80));
      
      // Check for specific elements
      const productTypesGrid = await page.$('.product-types-grid');
      if (productTypesGrid) {
        console.log('\n✅ Product types grid found');
        
        // Get product type cards
        const productCards = await page.$$('.product-type-card');
        console.log(`📦 Found ${productCards.length} product type cards`);
        
        // Check each card for HTML issues
        for (let i = 0; i < productCards.length; i++) {
          const cardHTML = await page.evaluate((index) => {
            const cards = document.querySelectorAll('.product-type-card');
            return cards[index] ? cards[index].outerHTML : 'Card not found';
          }, i);
          
          console.log(`\n📋 Product Card ${i + 1} HTML:`);
          console.log('-'.repeat(40));
          console.log(cardHTML);
          console.log('-'.repeat(40));
          
          // Check for broken HTML patterns
          if (cardHTML.includes('undefined') || cardHTML.includes('null') || cardHTML.includes('[object Object]')) {
            console.log('⚠️  Potential HTML issue detected in card', i + 1);
          }
        }
      } else {
        console.log('❌ Product types grid not found');
      }
      
      // Check for JavaScript errors in the section
      const jsErrors = await page.evaluate(() => {
        const errors = [];
        const section = document.getElementById('choose-product-section');
        if (section) {
          // Look for common HTML issues
          const innerHTML = section.innerHTML;
          if (innerHTML.includes('undefined')) errors.push('Contains "undefined" text');
          if (innerHTML.includes('null')) errors.push('Contains "null" text');
          if (innerHTML.includes('[object Object]')) errors.push('Contains "[object Object]" text');
          if (innerHTML.includes('${')) errors.push('Contains unprocessed template literals');
          if (innerHTML.match(/<[^>]*>/g)?.some(tag => !tag.endsWith('>'))) errors.push('Malformed HTML tags');
        }
        return errors;
      });
      
      if (jsErrors.length > 0) {
        console.log('\n⚠️  HTML Issues detected:');
        jsErrors.forEach(error => console.log(`   - ${error}`));
      } else {
        console.log('\n✅ No obvious HTML issues detected');
      }
      
    } else {
      console.log('❌ Choose Your Merch section not found');
      
      // Check if an image is selected
      const selectedImage = await page.evaluate(() => {
        return window.merchandiseStore ? window.merchandiseStore.selectedImage : null;
      });
      
      console.log('🖼️  Selected image:', selectedImage || 'None');
      
      if (!selectedImage) {
        console.log('💡 Try selecting an image first to make the Choose Your Merch section appear');
        
        // Try to select the first image
        const firstSelectButton = await page.$('.gallery-image-select');
        if (firstSelectButton) {
          console.log('🖱️  Clicking first image select button...');
          await firstSelectButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again for the section
          const sectionAfterSelect = await page.$('#choose-product-section');
          if (sectionAfterSelect) {
            console.log('✅ Choose Your Merch section appeared after image selection');
            
            const sectionHTML = await page.evaluate(() => {
              const section = document.getElementById('choose-product-section');
              return section ? section.innerHTML : 'Section not found';
            });
            
            console.log('\n📄 Choose Your Merch section HTML after selection:');
            console.log('=' .repeat(80));
            console.log(sectionHTML);
            console.log('=' .repeat(80));
          } else {
            console.log('❌ Choose Your Merch section still not found after image selection');
          }
        }
      }
    }
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection. Press Ctrl+C to close.');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugChooseMerchHTML().catch(console.error);