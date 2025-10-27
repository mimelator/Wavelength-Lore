#!/usr/bin/env node

/**
 * WAVELENGTH Merchandise Card Fix Validator
 * 
 * This test validates the three main UX fixes:
 * 1. Button overflow prevention (max-width constraint)
 * 2. Card compactness (reduced padding and sizing)
 * 3. Provider text improvements (user-friendly labels)
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function validateMerchandiseCardFixes() {
  console.log('🌊 WAVELENGTH: Validating merchandise card fixes...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport for consistent testing
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    // Navigate to merchandise store
    console.log('📄 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise-store', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for store to initialize
    await page.waitForTimeout(2000);
    
    // Look for gallery button and click it to start the flow
    console.log('🎯 Looking for gallery access...');
    const galleryBtn = await page.$('.gallery-access-btn, .open-gallery-btn, [data-action="open-gallery"]');
    if (galleryBtn) {
      console.log('📸 Clicking gallery button...');
      await galleryBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for any existing images or add a test image
    const images = await page.$$('.gallery-image, .image-item');
    if (images.length === 0) {
      console.log('🎨 No images found, looking for upload option...');
      const uploadBtn = await page.$('.upload-btn, .add-image-btn, [data-action="upload"]');
      if (uploadBtn) {
        console.log('⬆️ Upload button found, but skipping actual upload for test');
      }
    }
    
    // Try to find and click a category to show products
    console.log('📂 Looking for product categories...');
    const categories = await page.$$('.category-card, .product-category');
    
    if (categories.length > 0) {
      console.log(`🎯 Found ${categories.length} categories, clicking first one...`);
      await categories[0].click();
      await page.waitForTimeout(2000);
    }
    
    // Now look for product cards
    console.log('🔍 Analyzing product cards...');
    const productCards = await page.$$('.product-item, .product-card');
    console.log(`📦 Found ${productCards.length} product cards`);
    
    // Test results object
    const testResults = {
      totalCards: productCards.length,
      buttonOverflowTests: [],
      compactnessTests: [],
      providerTextTests: []
    };
    
    // Test each product card
    for (let i = 0; i < Math.min(productCards.length, 5); i++) {
      const card = productCards[i];
      console.log(`🧪 Testing card ${i + 1}...`);
      
      try {
        // 1. Test button overflow
        const button = await card.$('.product-select-btn, .select-simple-product');
        if (button) {
          const buttonBox = await button.boundingBox();
          const cardBox = await card.boundingBox();
          
          const buttonOverflows = buttonBox && cardBox && 
            (buttonBox.x + buttonBox.width > cardBox.x + cardBox.width);
          
          testResults.buttonOverflowTests.push({
            cardIndex: i,
            overflows: buttonOverflows,
            buttonWidth: buttonBox ? buttonBox.width : 'N/A',
            cardWidth: cardBox ? cardBox.width : 'N/A'
          });
          
          console.log(`   🔲 Button overflow test: ${buttonOverflows ? '❌ FAIL' : '✅ PASS'}`);
        }
        
        // 2. Test compactness (card dimensions)
        const cardBox = await card.boundingBox();
        const isCompact = cardBox && cardBox.width <= 460; // Allow some margin
        
        testResults.compactnessTests.push({
          cardIndex: i,
          width: cardBox ? cardBox.width : 'N/A',
          height: cardBox ? cardBox.height : 'N/A',
          isCompact: isCompact
        });
        
        console.log(`   📏 Compactness test: ${isCompact ? '✅ PASS' : '❌ FAIL'} (width: ${cardBox?.width || 'N/A'}px)`);
        
        // 3. Test provider text
        const providerElement = await card.$('.product-provider');
        if (providerElement) {
          const providerText = await page.evaluate(el => el.textContent, providerElement);
          const isFriendly = !providerText.includes('MWW On Demand') && 
                           !providerText.includes('SPOD') &&
                           (providerText.includes('Print-on-Demand') || 
                            providerText.includes('Print Service') ||
                            providerText.includes('Custom Print'));
          
          testResults.providerTextTests.push({
            cardIndex: i,
            originalText: providerText,
            isFriendly: isFriendly
          });
          
          console.log(`   🏷️ Provider text test: ${isFriendly ? '✅ PASS' : '❌ FAIL'} ("${providerText}")`);
        }
        
      } catch (cardError) {
        console.log(`   ⚠️ Error testing card ${i + 1}:`, cardError.message);
      }
    }
    
    // Take a screenshot for manual verification
    const screenshotPath = path.join(__dirname, 'merchandise-card-fixes-validated.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Print comprehensive results
    console.log('\n📊 MERCHANDISE CARD FIX VALIDATION RESULTS:');
    console.log('═══════════════════════════════════════════════');
    
    console.log(`\n📦 Total Cards Tested: ${testResults.totalCards}`);
    
    // Button overflow results
    const buttonOverflowPassed = testResults.buttonOverflowTests.filter(t => !t.overflows).length;
    console.log(`\n🔲 Button Overflow Prevention:`);
    console.log(`   ✅ Passed: ${buttonOverflowPassed}/${testResults.buttonOverflowTests.length}`);
    if (testResults.buttonOverflowTests.length > 0) {
      console.log(`   📊 Button widths: ${testResults.buttonOverflowTests.map(t => `${t.buttonWidth}px`).join(', ')}`);
    }
    
    // Compactness results  
    const compactnessPassed = testResults.compactnessTests.filter(t => t.isCompact).length;
    console.log(`\n📏 Card Compactness:`);
    console.log(`   ✅ Passed: ${compactnessPassed}/${testResults.compactnessTests.length}`);
    if (testResults.compactnessTests.length > 0) {
      console.log(`   📊 Card widths: ${testResults.compactnessTests.map(t => `${t.width}px`).join(', ')}`);
    }
    
    // Provider text results
    const providerTextPassed = testResults.providerTextTests.filter(t => t.isFriendly).length;
    console.log(`\n🏷️ Provider Text Improvements:`);
    console.log(`   ✅ Passed: ${providerTextPassed}/${testResults.providerTextTests.length}`);
    if (testResults.providerTextTests.length > 0) {
      console.log(`   📊 Provider texts: ${testResults.providerTextTests.map(t => `"${t.originalText}"`).join(', ')}`);
    }
    
    // Overall success rate
    const totalTests = testResults.buttonOverflowTests.length + 
                      testResults.compactnessTests.length + 
                      testResults.providerTextTests.length;
    const totalPassed = buttonOverflowPassed + compactnessPassed + providerTextPassed;
    
    console.log(`\n🎯 Overall Success Rate: ${totalPassed}/${totalTests} (${Math.round(totalPassed/totalTests*100)}%)`);
    
    if (testResults.totalCards === 0) {
      console.log('\n⚠️ NOTE: No product cards were found during testing.');
      console.log('   This could mean:');
      console.log('   - No images are uploaded to the gallery');
      console.log('   - No product category was selected');
      console.log('   - Products are still loading');
      console.log('   - Authentication or session issues');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('\n🌊 Keeping browser open for manual inspection...');
    console.log('   Close the browser window when you\'re done reviewing');
    
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the validation
if (require.main === module) {
  validateMerchandiseCardFixes().catch(console.error);
}

module.exports = { validateMerchandiseCardFixes };