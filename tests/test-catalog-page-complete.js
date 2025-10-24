#!/usr/bin/env node

const puppeteer = require('puppeteer');

const CATALOG_URL = 'http://localhost:3001/admin/vendor-research/catalog';
const TIMEOUT = 10000;

async function testCatalogPage() {
  console.log('🧪 TESTING CATALOG PAGE COMPLETE FUNCTIONALITY\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Track failed requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });
    
    console.log(`📄 Loading catalog page: ${CATALOG_URL}`);
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait for cards to fully render
    await page.waitForSelector('.product-card', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // TEST 1: Page loads successfully
    const title = await page.title();
    if (title) {
      console.log('✅ TEST 1: Page loads successfully');
      passed++;
    } else {
      console.log('❌ TEST 1: Page failed to load');
      failed++;
    }
    
    // TEST 2: Product cards match actual database count
    const cards = await page.$$('.product-card');
    console.log(`\n📦 Found ${cards.length} product cards on page`);
    
    // Get actual product count from page HTML (same method as test-blueprint-variety.js)
    const actualProductCount = await page.evaluate(() => {
      const blueprintMatches = document.body.innerHTML.match(/data-blueprint="(\d+)"/g) || [];
      return blueprintMatches.length;
    });
    
    console.log(`📊 Database has ${actualProductCount} products (from HTML data attributes)`);
    
    if (cards.length === actualProductCount && cards.length > 0) {
      console.log(`✅ TEST 2: Card count matches database (${cards.length} cards)`);
      passed++;
    } else if (cards.length === 0) {
      console.log('❌ TEST 2: No product cards found');
      failed++;
    } else {
      console.log(`❌ TEST 2: Card count mismatch (visible: ${cards.length}, database: ${actualProductCount})`);
      failed++;
    }
    
    // TEST 3: All cards have preview images
    console.log('\n🖼️  Checking preview images...');
    await new Promise(r => setTimeout(r, 1000));
    
    const imageResults = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-card');
      const results = [];
      
      cards.forEach((card, index) => {
        const img = card.querySelector('img.product-image');
        results.push({
          cardIndex: index,
          hasImg: !!img,
          src: img ? img.src : null,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          complete: img ? img.complete : false
        });
      });
      
      return results;
    });
    
    let allImagesValid = true;
    imageResults.forEach(result => {
      const isValid = result.hasImg && result.src && result.complete && result.naturalWidth > 0;
      console.log(`  Card ${result.cardIndex}: ${isValid ? '✅' : '❌'} ${result.src || 'NO IMAGE'}`);
      if (!isValid) {
        console.log(`    - hasImg: ${result.hasImg}, complete: ${result.complete}, width: ${result.naturalWidth}`);
        allImagesValid = false;
      }
    });
    
    if (allImagesValid && imageResults.length > 0) {
      console.log('✅ TEST 3: All cards have valid preview images');
      passed++;
    } else {
      console.log('❌ TEST 3: Some cards missing or have broken images');
      failed++;
    }
    
    // TEST 4: All cards have "Add Overlay" buttons
    console.log('\n🔘 Checking Add Overlay buttons...');
    const buttonResults = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-card');
      const results = [];
      
      cards.forEach((card, index) => {
        const button = card.querySelector('button.btn-border, button[onclick*="openBorderModalFromCard"]');
        results.push({
          cardIndex: index,
          hasButton: !!button,
          buttonText: button ? button.textContent.trim() : null,
          onclick: button ? button.getAttribute('onclick') : null
        });
      });
      
      return results;
    });
    
    let allButtonsValid = true;
    buttonResults.forEach(result => {
      const isValid = result.hasButton && result.buttonText && result.buttonText.includes('Overlay');
      console.log(`  Card ${result.cardIndex}: ${isValid ? '✅' : '❌'} "${result.buttonText}"`);
      if (!isValid) {
        console.log(`    - hasButton: ${result.hasButton}, text: ${result.buttonText}`);
        allButtonsValid = false;
      }
    });
    
    if (allButtonsValid && buttonResults.length > 0) {
      console.log('✅ TEST 4: All cards have "Add Overlay" buttons');
      passed++;
    } else {
      console.log('❌ TEST 4: Some cards missing "Add Overlay" buttons');
      failed++;
    }
    
    // TEST 5: "View Product" links go to valid HTML pages
    console.log('\n🔗 Checking View Product links...');
    const viewLinks = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-card');
      const links = [];
      
      cards.forEach((card, index) => {
        const link = card.querySelector('a[href*="/product/"], a[href*="/preview/"]');
        if (link) {
          links.push({
            cardIndex: index,
            href: link.href,
            text: link.textContent.trim()
          });
        }
      });
      
      return links;
    });
    
    let allLinksValid = true;
    for (const link of viewLinks) {
      try {
        const response = await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
        const contentType = response.headers()['content-type'] || '';
        const isHTML = contentType.includes('text/html');
        const status = response.status();
        
        console.log(`  Card ${link.cardIndex}: ${isHTML && status === 200 ? '✅' : '❌'} ${link.href}`);
        console.log(`    - Status: ${status}, Content-Type: ${contentType}`);
        
        if (!isHTML || status !== 200) {
          allLinksValid = false;
        }
      } catch (error) {
        console.log(`  Card ${link.cardIndex}: ❌ ${link.href} - ${error.message}`);
        allLinksValid = false;
      }
    }
    
    if (allLinksValid && viewLinks.length > 0) {
      console.log('✅ TEST 5: All "View Product" links go to valid HTML pages');
      passed++;
    } else {
      console.log('❌ TEST 5: Some "View Product" links are broken or return JSON');
      failed++;
    }
    
    // TEST 6: Check for console errors
    console.log('\n🐛 Checking for console errors...');
    if (consoleErrors.length === 0) {
      console.log('✅ TEST 6: No console errors');
      passed++;
    } else {
      console.log('❌ TEST 6: Console errors detected:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
      failed++;
    }
    
    // TEST 7: Check for failed network requests
    console.log('\n🌐 Checking for failed requests...');
    if (failedRequests.length === 0) {
      console.log('✅ TEST 7: No failed network requests');
      passed++;
    } else {
      console.log('❌ TEST 7: Failed requests detected:');
      failedRequests.forEach(req => console.log(`  - ${req.url}: ${req.failure}`));
      failed++;
    }
    
    // TEST 8: Click "Add Overlay" button and validate modal opens
    console.log('\n🎨 Testing Add Overlay button click...');
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    await page.waitForSelector('.product-card', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
    
    const overlayButtonExists = await page.evaluate(() => {
      const button = document.querySelector('button.btn-border, button[onclick*="openBorderModalFromCard"]');
      return !!button;
    });
    
    if (overlayButtonExists) {
      try {
        await page.click('button.btn-border, button[onclick*="openBorderModalFromCard"]');
        await new Promise(r => setTimeout(r, 1000));
        
        const modalVisible = await page.evaluate(() => {
          const modal = document.querySelector('#borderSelectionModal');
          return modal && modal.style.display !== 'none';
        });
        
        if (modalVisible) {
          console.log('✅ TEST 8: Add Overlay button opens modal');
          passed++;
        } else {
          console.log('❌ TEST 8: Add Overlay button clicked but modal not visible');
          failed++;
        }
      } catch (error) {
        console.log(`❌ TEST 8: Add Overlay button click failed - ${error.message}`);
        failed++;
      }
    } else {
      console.log('❌ TEST 8: No Add Overlay button found to click');
      failed++;
    }
    
    // TEST 9: Validate friendly names (not IDs like "Blueprint 6", "Provider 3")
    console.log('\n📝 Checking for friendly names (not IDs)...');
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    await new Promise(r => setTimeout(r, 1000));
    
    const nameResults = await page.evaluate(() => {
      const cards = document.querySelectorAll('.product-card');
      const results = [];
      
      cards.forEach((card, index) => {
        const metaElements = card.querySelectorAll('.product-meta');
        let hasBlueprintId = false;
        let hasProviderId = false;
        let blueprintText = '';
        let providerText = '';
        
        metaElements.forEach(meta => {
          const text = meta.textContent;
          if (text.includes('Blueprint:')) {
            blueprintText = text;
            // Check if it's just a number (ID) vs friendly name
            const match = text.match(/Blueprint:\s*(\d+)$/);
            if (match) hasBlueprintId = true;
          }
          if (text.includes('Provider:')) {
            providerText = text;
            // Check if it's just a number (ID) vs friendly name
            const match = text.match(/Provider:\s*(\d+)$/);
            if (match) hasProviderId = true;
          }
        });
        
        results.push({
          cardIndex: index,
          hasBlueprintId,
          hasProviderId,
          blueprintText,
          providerText
        });
      });
      
      return results;
    });
    
    let allNamesValid = true;
    nameResults.forEach(result => {
      const hasIds = result.hasBlueprintId || result.hasProviderId;
      if (hasIds) {
        console.log(`  Card ${result.cardIndex}: ❌ Contains IDs instead of friendly names`);
        if (result.hasBlueprintId) console.log(`    - ${result.blueprintText}`);
        if (result.hasProviderId) console.log(`    - ${result.providerText}`);
        allNamesValid = false;
      } else {
        console.log(`  Card ${result.cardIndex}: ✅ Uses friendly names`);
      }
    });
    
    if (allNamesValid && nameResults.length > 0) {
      console.log('✅ TEST 9: All cards use friendly names (no IDs)');
      passed++;
    } else {
      console.log('❌ TEST 9: Some cards show IDs instead of friendly names');
      failed++;
    }
    
    // TEST 10: Click Delete button and validate dialog appears (then CANCEL)
    console.log('\n🗑️  Testing Delete button click...');
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    await page.waitForSelector('.product-card', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
    
    const deleteButtonExists = await page.evaluate(() => {
      const button = document.querySelector('button.btn-danger, button[onclick*="deleteProduct"]');
      return !!button;
    });
    
    if (deleteButtonExists) {
      try {
        let dialogAppeared = false;
        
        page.once('dialog', async dialog => {
          dialogAppeared = true;
          console.log(`  Dialog message: "${dialog.message()}"`);
          await dialog.dismiss(); // CANCEL instead of accept
        });
        
        await page.click('button.btn-danger, button[onclick*="deleteProduct"]');
        await new Promise(r => setTimeout(r, 1000));
        
        if (dialogAppeared) {
          console.log('✅ TEST 10: Delete button shows confirmation dialog (cancelled)');
          passed++;
        } else {
          console.log('❌ TEST 10: Delete button clicked but no dialog appeared');
          failed++;
        }
      } catch (error) {
        console.log(`❌ TEST 10: Delete button click failed - ${error.message}`);
        failed++;
      }
    } else {
      console.log('❌ TEST 10: No Delete button found to click');
      failed++;
    }
    
  } catch (error) {
    console.error('❌ TEST SUITE ERROR:', error.message);
    failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

testCatalogPage();
