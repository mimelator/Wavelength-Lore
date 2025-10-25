/**
 * Browser Diagnostic Test for Merchandise Store
 * Detects JavaScript errors and styling anomalies
 */

const puppeteer = require('puppeteer');

async function runMerchandiseStoreDiagnostic() {
  let browser;
  
  try {
    console.log('🔍 Starting Merchandise Store Browser Diagnostic...\n');
    
    browser = await puppeteer.launch({
      headless: false, // Show browser for visual inspection
      devtools: true,  // Open DevTools automatically
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console messages and errors
    const consoleMessages = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', text);
        jsErrors.push(text);
      } else if (msg.type() === 'warning') {
        console.log('⚠️  Console Warning:', text);
      } else if (text.includes('❌') || text.includes('Failed')) {
        console.log('🚨 Error Message:', text);
        jsErrors.push(text);
      }
    });
    
    // Capture JavaScript exceptions
    page.on('pageerror', error => {
      console.log('💥 JavaScript Exception:', error.message);
      jsErrors.push(`JavaScript Exception: ${error.message}`);
    });
    
    // Capture failed network requests
    const failedRequests = [];
    page.on('response', response => {
      if (!response.ok()) {
        const failure = `${response.status()} ${response.url()}`;
        console.log('🌐 Failed Request:', failure);
        failedRequests.push(failure);
      }
    });
    
    console.log('🌐 Navigating to merchandise store...');
    await page.goto('http://localhost:3001/merchandise', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for initial page load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Analyzing page structure...');
    
    // Check if main elements exist
    const pageAnalysis = await page.evaluate(() => {
      const results = {
        title: document.title,
        hasContainer: !!document.getElementById('merchandise-store'),
        hasHeader: !!document.querySelector('.store-header'),
        hasGallerySection: !!document.querySelector('.gallery-grid'),
        hasProductSection: !!document.querySelector('.products-grid'),
        hasCartSection: !!document.querySelector('.cart-container'),
        
        // Check for CSS loading
        stylesheetCount: document.styleSheets.length,
        hasMainCSS: Array.from(document.styleSheets).some(sheet => 
          sheet.href && sheet.href.includes('merchandise-store.css')
        ),
        hasNavigatorCSS: Array.from(document.styleSheets).some(sheet => 
          sheet.href && sheet.href.includes('product-navigator.css')
        ),
        
        // Check for JavaScript classes
        hasMerchandiseStore: typeof window.MerchandiseStore !== 'undefined',
        hasProductNavigator: typeof window.ProductNavigator !== 'undefined',
        merchandiseStoreInstance: !!window.merchandiseStore,
        
        // Check for visible content
        visibleImages: document.querySelectorAll('.gallery-image-card').length,
        visibleProducts: document.querySelectorAll('.product-card').length,
        
        // Check for error states
        hasErrorMessages: document.querySelectorAll('.error-state, .empty-state').length,
        hasLoadingSpinners: document.querySelectorAll('.loading-spinner').length,
        
        // Get any visible text content
        mainContent: document.querySelector('#merchandise-store')?.textContent?.substring(0, 200) || 'No content'
      };
      
      return results;
    });
    
    console.log('\n📋 PAGE ANALYSIS RESULTS:');
    console.log('========================');
    console.log('Title:', pageAnalysis.title);
    console.log('Container exists:', pageAnalysis.hasContainer ? '✅' : '❌');
    console.log('Header exists:', pageAnalysis.hasHeader ? '✅' : '❌');
    console.log('Gallery section:', pageAnalysis.hasGallerySection ? '✅' : '❌');
    console.log('Product section:', pageAnalysis.hasProductSection ? '✅' : '❌');
    console.log('Cart section:', pageAnalysis.hasCartSection ? '✅' : '❌');
    console.log('');
    console.log('CSS Loading:');
    console.log('- Total stylesheets:', pageAnalysis.stylesheetCount);
    console.log('- Main CSS loaded:', pageAnalysis.hasMainCSS ? '✅' : '❌');
    console.log('- Navigator CSS loaded:', pageAnalysis.hasNavigatorCSS ? '✅' : '❌');
    console.log('');
    console.log('JavaScript:');
    console.log('- MerchandiseStore class:', pageAnalysis.hasMerchandiseStore ? '✅' : '❌');
    console.log('- ProductNavigator class:', pageAnalysis.hasProductNavigator ? '✅' : '❌');
    console.log('- Store instance created:', pageAnalysis.merchandiseStoreInstance ? '✅' : '❌');
    console.log('');
    console.log('Content:');
    console.log('- Gallery images:', pageAnalysis.visibleImages);
    console.log('- Products:', pageAnalysis.visibleProducts);
    console.log('- Error states:', pageAnalysis.hasErrorMessages);
    console.log('- Loading spinners:', pageAnalysis.hasLoadingSpinners);
    
    // Check for styling issues
    console.log('\n🎨 STYLING ANALYSIS:');
    console.log('===================');
    
    const stylingIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check if main container has proper styling
      const container = document.getElementById('merchandise-store');
      if (container) {
        const styles = window.getComputedStyle(container);
        if (styles.display === 'none') {
          issues.push('Main container is hidden (display: none)');
        }
        if (styles.visibility === 'hidden') {
          issues.push('Main container is invisible (visibility: hidden)');
        }
        if (styles.opacity === '0') {
          issues.push('Main container is transparent (opacity: 0)');
        }
      }
      
      // Check for missing background colors/gradients
      const storeDiv = document.querySelector('.merchandise-store');
      if (storeDiv) {
        const styles = window.getComputedStyle(storeDiv);
        if (!styles.background || styles.background === 'rgba(0, 0, 0, 0)') {
          issues.push('Main store div missing background gradient');
        }
      }
      
      // Check for broken images
      const images = document.querySelectorAll('img');
      let brokenImages = 0;
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          brokenImages++;
        }
      });
      if (brokenImages > 0) {
        issues.push(`${brokenImages} broken images detected`);
      }
      
      return issues;
    });
    
    stylingIssues.forEach(issue => {
      console.log('🎨 Styling Issue:', issue);
    });
    
    if (stylingIssues.length === 0) {
      console.log('✅ No obvious styling issues detected');
    }
    
    // Take a screenshot for visual inspection
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: 'merchandise-store-diagnostic.png',
      fullPage: true
    });
    console.log('Screenshot saved as: merchandise-store-diagnostic.png');
    
    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('======================');
    console.log('JavaScript Errors:', jsErrors.length);
    console.log('Failed Requests:', failedRequests.length);
    console.log('Styling Issues:', stylingIssues.length);
    console.log('Console Messages:', consoleMessages.length);
    
    if (jsErrors.length > 0) {
      console.log('\n❌ JAVASCRIPT ERRORS:');
      jsErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    if (failedRequests.length > 0) {
      console.log('\n🌐 FAILED REQUESTS:');
      failedRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req}`);
      });
    }
    
    // Wait a bit longer to see if any delayed errors occur
    console.log('\n⏳ Waiting for delayed initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Final check
    const finalCheck = await page.evaluate(() => {
      return {
        storeInitialized: !!window.merchandiseStore,
        hasContent: document.querySelector('#merchandise-store')?.children.length > 1,
        finalErrors: document.querySelectorAll('.error-state').length
      };
    });
    
    console.log('\n🏁 FINAL STATUS:');
    console.log('================');
    console.log('Store Initialized:', finalCheck.storeInitialized ? '✅' : '❌');
    console.log('Has Content:', finalCheck.hasContent ? '✅' : '❌');
    console.log('Error States:', finalCheck.finalErrors);
    
    // Close browser after diagnostic
    console.log('\n🏁 Diagnostic complete!');
    await browser.close();
    return { jsErrors, failedRequests, stylingIssues, pageAnalysis, finalCheck };
    
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

// Run the diagnostic
runMerchandiseStoreDiagnostic().catch(console.error);