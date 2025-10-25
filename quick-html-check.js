const puppeteer = require('puppeteer');

async function quickHTMLCheck() {
  console.log('🔍 Quick HTML validation check...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    let jsErrorCount = 0;
    
    // Listen for JavaScript errors
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' && text.includes('Invalid or unexpected token')) {
        jsErrorCount++;
        console.log('💥 JS Error:', text);
      }
    });
    
    page.on('pageerror', error => {
      if (error.message.includes('Invalid or unexpected token')) {
        jsErrorCount++;
        console.log('💥 Page Error:', error.message);
      }
    });
    
    // Navigate to merchandise store
    await page.goto('http://localhost:3001/merchandise', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Select an image to trigger Choose Your Merch section
    const firstSelectButton = await page.$('.gallery-image-select');
    if (firstSelectButton) {
      await firstSelectButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check for HTML issues
    const htmlIssues = await page.evaluate(() => {
      const issues = [];
      const section = document.getElementById('choose-product-section');
      
      if (section) {
        const innerHTML = section.innerHTML;
        
        // Check for common HTML problems
        if (innerHTML.includes('&lt;div class=')) {
          issues.push('HTML entities in onerror attributes');
        }
        if (innerHTML.includes('undefined')) {
          issues.push('Contains "undefined" text');
        }
        if (innerHTML.includes('null')) {
          issues.push('Contains "null" text');
        }
        if (innerHTML.includes('[object Object]')) {
          issues.push('Contains "[object Object]" text');
        }
        
        // Check for malformed attributes
        const malformedAttrs = innerHTML.match(/onerror="[^"]*"[^>]*"[^>]*>/g);
        if (malformedAttrs) {
          issues.push('Malformed onerror attributes detected');
        }
      }
      
      return issues;
    });
    
    console.log(`📊 JavaScript Errors: ${jsErrorCount}`);
    console.log(`📊 HTML Issues: ${htmlIssues.length}`);
    
    if (jsErrorCount === 0) {
      console.log('✅ No JavaScript syntax errors detected');
    } else {
      console.log(`❌ Found ${jsErrorCount} JavaScript syntax errors`);
    }
    
    if (htmlIssues.length === 0) {
      console.log('✅ No HTML issues detected');
    } else {
      console.log('❌ HTML Issues found:');
      htmlIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Check if Choose Your Merch section renders properly
    const sectionExists = await page.$('#choose-product-section');
    const productCards = await page.$$('.product-type-card');
    
    console.log(`📦 Choose Your Merch section: ${sectionExists ? 'Found' : 'Not found'}`);
    console.log(`📦 Product type cards: ${productCards.length}`);
    
    if (jsErrorCount === 0 && htmlIssues.length === 0 && sectionExists && productCards.length > 0) {
      console.log('\n🎉 SUCCESS: Choose Your Merch section HTML is now properly rendered!');
    } else {
      console.log('\n⚠️  Some issues remain to be addressed');
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await browser.close();
  }
}

quickHTMLCheck().catch(console.error);