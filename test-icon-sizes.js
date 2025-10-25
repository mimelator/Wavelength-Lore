const puppeteer = require('puppeteer');

async function testIconSizes() {
  console.log('🔍 Testing product type icon sizes after fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate and select image
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const firstSelectButton = await page.$('.gallery-image-select');
    if (firstSelectButton) {
      await firstSelectButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check icon sizes
    const iconSizes = await page.evaluate(() => {
      const icons = document.querySelectorAll('.product-type-icon');
      return Array.from(icons).map((icon, index) => {
        const styles = window.getComputedStyle(icon);
        const rect = icon.getBoundingClientRect();
        return {
          index: index + 1,
          fontSize: styles.fontSize,
          actualWidth: Math.round(rect.width),
          actualHeight: Math.round(rect.height),
          content: icon.textContent
        };
      });
    });
    
    console.log('📊 Product Type Icon Sizes:');
    console.log('=' .repeat(50));
    
    iconSizes.forEach(icon => {
      console.log(`Icon ${icon.index} (${icon.content}):`);
      console.log(`  Font Size: ${icon.fontSize}`);
      console.log(`  Actual Size: ${icon.actualWidth}x${icon.actualHeight}px`);
      console.log('');
    });
    
    // Check if sizes are now correct (should be around 96px for 6rem)
    const correctSizes = iconSizes.filter(icon => 
      icon.fontSize === '96px' && icon.actualWidth >= 80 && icon.actualHeight >= 80
    );
    
    console.log(`✅ Icons with correct size (6rem/96px): ${correctSizes.length}/${iconSizes.length}`);
    
    if (correctSizes.length === iconSizes.length) {
      console.log('🎉 SUCCESS: All product type icons are now properly sized!');
    } else {
      console.log('⚠️  Some icons still have incorrect sizes');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testIconSizes().catch(console.error);