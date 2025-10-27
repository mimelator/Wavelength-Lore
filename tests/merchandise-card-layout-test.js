/**
 * Merchandise Card Layout Test
 * 
 * Tests product card layout issues including:
 * 1. Button overflow (drifting over card edge)
 * 2. Card size optimization opportunities
 * 3. Provider text clarity for end users
 */

const puppeteer = require('puppeteer');

async function testMerchandiseCardLayout() {
  console.log('🧪 Testing merchandise card layout and usability...');
  
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  try {
    // Set viewport for testing
    await page.setViewport({ width: 1400, height: 900 });
    
    // Navigate to merchandise store
    console.log('📄 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for store to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Analyzing card layout issues...');
    
    // Check for product cards
    const productCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-item, .category-card');
      return {
        count: cards.length,
        cardElements: Array.from(cards).map(card => ({
          className: card.className,
          width: card.offsetWidth,
          height: card.offsetHeight,
          hasButton: !!card.querySelector('.product-select-btn, .select-simple-product, .browse-category-btn'),
          buttonText: card.querySelector('.product-select-btn, .select-simple-product, .browse-category-btn')?.textContent?.trim(),
          hasProvider: !!card.querySelector('.product-provider')
        }))
      };
    });
    
    console.log('📊 Card Analysis Results:');
    console.log(`   Total Cards: ${productCards.count}`);
    
    if (productCards.count > 0) {
      productCards.cardElements.forEach((card, index) => {
        console.log(`   Card ${index + 1}:`);
        console.log(`     - Type: ${card.className}`);
        console.log(`     - Size: ${card.width}x${card.height}px`);
        console.log(`     - Has Button: ${card.hasButton}`);
        console.log(`     - Button Text: "${card.buttonText}"`);
        console.log(`     - Has Provider: ${card.hasProvider}`);
      });
    }
    
    // Check for button overflow issues
    const buttonOverflowIssues = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.product-select-btn, .select-simple-product');
      const issues = [];
      
      buttons.forEach((button, index) => {
        const buttonRect = button.getBoundingClientRect();
        const parentCard = button.closest('.product-item, .category-card');
        
        if (parentCard) {
          const cardRect = parentCard.getBoundingClientRect();
          
          // Check if button extends beyond card boundaries
          const overflowRight = buttonRect.right > cardRect.right;
          const overflowLeft = buttonRect.left < cardRect.left;
          const overflowBottom = buttonRect.bottom > cardRect.bottom;
          
          if (overflowRight || overflowLeft || overflowBottom) {
            issues.push({
              buttonIndex: index,
              buttonText: button.textContent.trim(),
              buttonRect: {
                width: buttonRect.width,
                height: buttonRect.height,
                right: buttonRect.right,
                left: buttonRect.left,
                bottom: buttonRect.bottom
              },
              cardRect: {
                width: cardRect.width,
                height: cardRect.height,
                right: cardRect.right,
                left: cardRect.left,
                bottom: cardRect.bottom
              },
              overflowRight,
              overflowLeft,
              overflowBottom
            });
          }
        }
      });
      
      return issues;
    });
    
    console.log('🚨 Button Overflow Issues:');
    if (buttonOverflowIssues.length === 0) {
      console.log('   ✅ No button overflow detected');
    } else {
      buttonOverflowIssues.forEach((issue, index) => {
        console.log(`   Issue ${index + 1}:`);
        console.log(`     - Button: "${issue.buttonText}"`);
        console.log(`     - Button Size: ${issue.buttonRect.width}x${issue.buttonRect.height}px`);
        console.log(`     - Card Size: ${issue.cardRect.width}x${issue.cardRect.height}px`);
        console.log(`     - Overflow Right: ${issue.overflowRight}`);
        console.log(`     - Overflow Left: ${issue.overflowLeft}`);
        console.log(`     - Overflow Bottom: ${issue.overflowBottom}`);
      });
    }
    
    // Check provider text clarity
    const providerTextAnalysis = await page.evaluate(() => {
      const providerElements = document.querySelectorAll('.product-provider');
      return Array.from(providerElements).map(el => ({
        text: el.textContent.trim(),
        isConfusing: el.textContent.includes('MWW') || el.textContent.includes('On Demand'),
        styles: window.getComputedStyle(el)
      }));
    });
    
    console.log('🏷️ Provider Text Analysis:');
    if (providerTextAnalysis.length === 0) {
      console.log('   ℹ️ No provider text found');
    } else {
      providerTextAnalysis.forEach((provider, index) => {
        console.log(`   Provider ${index + 1}: "${provider.text}"`);
        console.log(`     - Potentially Confusing: ${provider.isConfusing}`);
      });
    }
    
    // Size analysis for compactness recommendations
    const sizeAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-item, .category-card');
      const sizes = Array.from(cards).map(card => ({
        width: card.offsetWidth,
        height: card.offsetHeight,
        area: card.offsetWidth * card.offsetHeight
      }));
      
      if (sizes.length === 0) return null;
      
      const avgWidth = sizes.reduce((sum, s) => sum + s.width, 0) / sizes.length;
      const avgHeight = sizes.reduce((sum, s) => sum + s.height, 0) / sizes.length;
      const avgArea = sizes.reduce((sum, s) => sum + s.area, 0) / sizes.length;
      
      return {
        averageSize: { width: avgWidth, height: avgHeight, area: avgArea },
        minSize: { 
          width: Math.min(...sizes.map(s => s.width)),
          height: Math.min(...sizes.map(s => s.height))
        },
        maxSize: {
          width: Math.max(...sizes.map(s => s.width)),
          height: Math.max(...sizes.map(s => s.height))
        }
      };
    });
    
    console.log('📏 Card Size Analysis:');
    if (sizeAnalysis) {
      console.log(`   Average Size: ${Math.round(sizeAnalysis.averageSize.width)}x${Math.round(sizeAnalysis.averageSize.height)}px`);
      console.log(`   Size Range: ${sizeAnalysis.minSize.width}-${sizeAnalysis.maxSize.width}px wide, ${sizeAnalysis.minSize.height}-${sizeAnalysis.maxSize.height}px tall`);
      
      // Provide compactness recommendations
      if (sizeAnalysis.averageSize.width > 500 || sizeAnalysis.averageSize.height > 200) {
        console.log('   💡 RECOMMENDATION: Cards could be more compact');
        console.log(`      - Current average: ${Math.round(sizeAnalysis.averageSize.width)}x${Math.round(sizeAnalysis.averageSize.height)}px`);
        console.log('      - Suggested max: 450x180px for better density');
      }
    }
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: 'merchandise-card-layout-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved: merchandise-card-layout-test.png');
    
    console.log('\n✅ Card layout analysis complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testMerchandiseCardLayout().catch(console.error);