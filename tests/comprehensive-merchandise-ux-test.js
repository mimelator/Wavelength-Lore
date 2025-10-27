/**
 * Comprehensive Merchandise Card UX Test
 * 
 * Tests the fixes for:
 * 1. Button overflow issues
 * 2. Card compactness improvements  
 * 3. Provider text user-friendliness
 */

const puppeteer = require('puppeteer');

async function testMerchandiseCardUX() {
  console.log('🧪 Testing merchandise card UX improvements...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    defaultViewport: { width: 1200, height: 800 }
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to merchandise store
    console.log('📄 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Wait for store to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we need to select an image first
    console.log('🔍 Checking store state...');
    
    const hasGallerySection = await page.$('.gallery-section') !== null;
    const hasProductSection = await page.$('.product-navigator-container') !== null;
    
    console.log(`   Gallery section visible: ${hasGallerySection}`);
    console.log(`   Product section visible: ${hasProductSection}`);
    
    // If gallery is visible, try to select an image to trigger product categories
    if (hasGallerySection) {
      console.log('📸 Attempting to select a gallery image...');
      
      // Look for gallery images
      const galleryImages = await page.$$('.gallery-image-card');
      console.log(`   Found ${galleryImages.length} gallery images`);
      
      if (galleryImages.length > 0) {
        // Click the first gallery image's select button
        const selectButton = await page.$('.gallery-image-select');
        if (selectButton) {
          await selectButton.click();
          console.log('✅ Selected first gallery image');
          
          // Wait for product navigator to load
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log('⚠️ No gallery image select button found');
        }
      } else {
        console.log('ℹ️ No gallery images found - may need to load gallery first');
      }
    }
    
    // Now look for category cards or product cards
    console.log('🎴 Looking for category cards...');
    
    const categoryCards = await page.$$('.category-card');
    console.log(`   Found ${categoryCards.length} category cards`);
    
    if (categoryCards.length > 0) {
      // Click on a category to see products
      console.log('📦 Clicking on first category...');
      const browseCategoryBtn = await page.$('.browse-category-btn');
      if (browseCategoryBtn) {
        await browseCategoryBtn.click();
        console.log('✅ Clicked browse category button');
        
        // Wait for products to load
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Now analyze the product cards
    console.log('🔍 Analyzing product cards...');
    
    const productAnalysis = await page.evaluate(() => {
      const productItems = document.querySelectorAll('.product-item');
      const analysis = {
        totalCards: productItems.length,
        cards: [],
        buttonOverflowIssues: [],
        providerTextAnalysis: []
      };
      
      productItems.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const button = card.querySelector('.product-select-btn, .select-simple-product');
        const provider = card.querySelector('.product-provider');
        
        const cardInfo = {
          index: index + 1,
          width: Math.round(cardRect.width),
          height: Math.round(cardRect.height),
          hasButton: !!button,
          buttonText: button?.textContent?.trim() || '',
          hasProvider: !!provider,
          providerText: provider?.textContent?.trim() || ''
        };
        
        analysis.cards.push(cardInfo);
        
        // Check for button overflow
        if (button) {
          const buttonRect = button.getBoundingClientRect();
          const overflowRight = buttonRect.right > cardRect.right + 2; // 2px tolerance
          const overflowLeft = buttonRect.left < cardRect.left - 2;
          
          if (overflowRight || overflowLeft) {
            analysis.buttonOverflowIssues.push({
              cardIndex: index + 1,
              buttonText: button.textContent.trim(),
              overflowRight,
              overflowLeft,
              buttonWidth: Math.round(buttonRect.width),
              cardWidth: Math.round(cardRect.width)
            });
          }
        }
        
        // Analyze provider text
        if (provider) {
          const providerText = provider.textContent.trim();
          analysis.providerTextAnalysis.push({
            cardIndex: index + 1,
            text: providerText,
            isUserFriendly: !providerText.includes('MWW') && !providerText.includes('On Demand'),
            isMinimalist: providerText.length <= 15
          });
        }
      });
      
      return analysis;
    });
    
    console.log('\n📊 PRODUCT CARD ANALYSIS RESULTS:');
    console.log('═══════════════════════════════════════');
    
    console.log(`\n📦 Total Product Cards Found: ${productAnalysis.totalCards}`);
    
    if (productAnalysis.totalCards > 0) {
      // Card size analysis
      const avgWidth = productAnalysis.cards.reduce((sum, card) => sum + card.width, 0) / productAnalysis.cards.length;
      const avgHeight = productAnalysis.cards.reduce((sum, card) => sum + card.height, 0) / productAnalysis.cards.length;
      
      console.log(`\n📏 CARD SIZE ANALYSIS:`);
      console.log(`   Average Size: ${Math.round(avgWidth)} × ${Math.round(avgHeight)} pixels`);
      console.log(`   Size Range: ${Math.min(...productAnalysis.cards.map(c => c.width))}-${Math.max(...productAnalysis.cards.map(c => c.width))}px wide`);
      
      if (avgWidth <= 450) {
        console.log(`   ✅ COMPACTNESS: Cards are appropriately compact (≤450px wide)`);
      } else {
        console.log(`   ⚠️ COMPACTNESS: Cards could be more compact (current: ${Math.round(avgWidth)}px)`);
      }
      
      // Button overflow analysis
      console.log(`\n🔘 BUTTON OVERFLOW ANALYSIS:`);
      if (productAnalysis.buttonOverflowIssues.length === 0) {
        console.log(`   ✅ NO BUTTON OVERFLOW: All ${productAnalysis.cards.filter(c => c.hasButton).length} buttons are contained within cards`);
      } else {
        console.log(`   ❌ BUTTON OVERFLOW ISSUES FOUND: ${productAnalysis.buttonOverflowIssues.length} buttons overflow their cards`);
        productAnalysis.buttonOverflowIssues.forEach(issue => {
          console.log(`      Card ${issue.cardIndex}: "${issue.buttonText}" (${issue.buttonWidth}px) overflows ${issue.cardWidth}px card`);
        });
      }
      
      // Provider text analysis
      console.log(`\n🏷️ PROVIDER TEXT ANALYSIS:`);
      if (productAnalysis.providerTextAnalysis.length === 0) {
        console.log(`   ℹ️ No provider text found`);
      } else {
        const userFriendlyCount = productAnalysis.providerTextAnalysis.filter(p => p.isUserFriendly).length;
        const minimalistCount = productAnalysis.providerTextAnalysis.filter(p => p.isMinimalist).length;
        
        console.log(`   Total Provider Labels: ${productAnalysis.providerTextAnalysis.length}`);
        console.log(`   User-Friendly: ${userFriendlyCount}/${productAnalysis.providerTextAnalysis.length} (${Math.round(userFriendlyCount/productAnalysis.providerTextAnalysis.length*100)}%)`);
        console.log(`   Minimalist (≤15 chars): ${minimalistCount}/${productAnalysis.providerTextAnalysis.length} (${Math.round(minimalistCount/productAnalysis.providerTextAnalysis.length*100)}%)`);
        
        productAnalysis.providerTextAnalysis.forEach(provider => {
          const status = provider.isUserFriendly ? '✅' : '⚠️';
          console.log(`      Card ${provider.cardIndex}: ${status} "${provider.text}"`);
        });
      }
      
      // Individual card details
      console.log(`\n📋 INDIVIDUAL CARD DETAILS:`);
      productAnalysis.cards.forEach(card => {
        console.log(`   Card ${card.index}: ${card.width}×${card.height}px, Button: "${card.buttonText}", Provider: "${card.providerText}"`);
      });
      
    } else {
      console.log('ℹ️ No product cards found. This might be because:');
      console.log('   - No image was selected');
      console.log('   - No category was browsed');  
      console.log('   - Products are still loading');
      console.log('   - Store is in a different state');
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'merchandise-card-ux-test.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: merchandise-card-ux-test.png');
    
    // Generate summary
    console.log('\n🎯 SUMMARY OF FIXES:');
    console.log('═══════════════════════');
    
    if (productAnalysis.totalCards > 0) {
      const avgWidth = productAnalysis.cards.reduce((sum, card) => sum + card.width, 0) / productAnalysis.cards.length;
      
      console.log(`✅ Button Overflow: ${productAnalysis.buttonOverflowIssues.length === 0 ? 'FIXED' : 'NEEDS WORK'}`);
      console.log(`✅ Card Compactness: ${avgWidth <= 450 ? 'IMPROVED' : 'NEEDS WORK'} (${Math.round(avgWidth)}px avg width)`);
      
      if (productAnalysis.providerTextAnalysis.length > 0) {
        const userFriendlyPercent = productAnalysis.providerTextAnalysis.filter(p => p.isUserFriendly).length / productAnalysis.providerTextAnalysis.length;
        console.log(`✅ Provider Text: ${userFriendlyPercent >= 0.8 ? 'IMPROVED' : 'NEEDS WORK'} (${Math.round(userFriendlyPercent*100)}% user-friendly)`);
      } else {
        console.log(`ℹ️ Provider Text: No provider text to analyze`);
      }
    } else {
      console.log('⚠️ Could not verify fixes - no product cards were loaded during test');
    }
    
    console.log('\n✅ Merchandise card UX test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMerchandiseCardUX().catch(console.error);