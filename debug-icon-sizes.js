const puppeteer = require('puppeteer');

async function debugIconSizes() {
  console.log('🔍 Debugging product type icon sizes...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to merchandise store
    console.log('📍 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Select first image to show Choose Your Merch section
    console.log('🖱️  Selecting first image...');
    const firstSelectButton = await page.$('.gallery-image-select');
    if (firstSelectButton) {
      await firstSelectButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if Choose Your Merch section appeared
    const chooseMerchSection = await page.$('#choose-product-section');
    if (!chooseMerchSection) {
      console.log('❌ Choose Your Merch section not found');
      return;
    }
    
    console.log('✅ Choose Your Merch section found');
    
    // Analyze icon sizes
    const iconAnalysis = await page.evaluate(() => {
      const results = [];
      
      // Check product type icons
      const icons = document.querySelectorAll('.product-type-icon');
      icons.forEach((icon, index) => {
        const styles = window.getComputedStyle(icon);
        results.push({
          type: 'icon',
          index: index + 1,
          fontSize: styles.fontSize,
          width: styles.width,
          height: styles.height,
          display: styles.display,
          visibility: styles.visibility,
          text: icon.textContent,
          actualSize: icon.getBoundingClientRect()
        });
      });
      
      // Check product type images
      const images = document.querySelectorAll('.product-type-image');
      images.forEach((img, index) => {
        const styles = window.getComputedStyle(img);
        results.push({
          type: 'image-container',
          index: index + 1,
          width: styles.width,
          height: styles.height,
          display: styles.display,
          visibility: styles.visibility,
          actualSize: img.getBoundingClientRect()
        });
      });
      
      // Check actual img elements inside
      const imgElements = document.querySelectorAll('.product-type-image img');
      imgElements.forEach((img, index) => {
        const styles = window.getComputedStyle(img);
        results.push({
          type: 'image-element',
          index: index + 1,
          width: styles.width,
          height: styles.height,
          display: styles.display,
          visibility: styles.visibility,
          src: img.src,
          actualSize: img.getBoundingClientRect()
        });
      });
      
      return results;
    });
    
    console.log('\n📊 Icon and Image Analysis:');
    console.log('=' .repeat(80));
    
    iconAnalysis.forEach(item => {
      console.log(`\n${item.type.toUpperCase()} ${item.index}:`);
      console.log(`  CSS Width: ${item.width}`);
      console.log(`  CSS Height: ${item.height}`);
      if (item.fontSize) console.log(`  Font Size: ${item.fontSize}`);
      console.log(`  Display: ${item.display}`);
      console.log(`  Visibility: ${item.visibility}`);
      console.log(`  Actual Size: ${Math.round(item.actualSize.width)}x${Math.round(item.actualSize.height)}px`);
      if (item.text) console.log(`  Content: "${item.text}"`);
      if (item.src) console.log(`  Image: ${item.src.includes('printify') ? 'Printify image' : 'Other'}`);
    });
    
    // Check if CSS is loading properly
    const cssCheck = await page.evaluate(() => {
      const link = document.querySelector('link[href*="merchandise-store.css"]');
      return {
        cssLinkExists: !!link,
        cssHref: link ? link.href : null,
        cssLoaded: link ? !link.sheet ? false : link.sheet.cssRules.length > 0 : false
      };
    });
    
    console.log('\n📄 CSS Loading Check:');
    console.log(`  CSS Link Exists: ${cssCheck.cssLinkExists}`);
    console.log(`  CSS Href: ${cssCheck.cssHref}`);
    console.log(`  CSS Loaded: ${cssCheck.cssLoaded}`);
    
    // Check for conflicting styles
    const styleConflicts = await page.evaluate(() => {
      const icon = document.querySelector('.product-type-icon');
      if (!icon) return null;
      
      const allRules = [];
      for (let sheet of document.styleSheets) {
        try {
          for (let rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('product-type-icon')) {
              allRules.push({
                selector: rule.selectorText,
                fontSize: rule.style.fontSize,
                sheet: sheet.href || 'inline'
              });
            }
          }
        } catch (e) {
          // Cross-origin or other access issues
        }
      }
      return allRules;
    });
    
    if (styleConflicts) {
      console.log('\n🎨 CSS Rules for .product-type-icon:');
      styleConflicts.forEach(rule => {
        console.log(`  ${rule.selector}: font-size: ${rule.fontSize || 'not set'} (${rule.sheet})`);
      });
    }
    
    console.log('\n🔍 Browser kept open for manual inspection. Check the Elements tab to see computed styles.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugIconSizes().catch(console.error);