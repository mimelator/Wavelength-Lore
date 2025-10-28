#!/usr/bin/env node

/**
 * Diagnostic test to understand what's loaded on the merchandise page
 */

const puppeteer = require('puppeteer');

async function runDiagnostics() {
  console.log('\n🔍 MERCHANDISE PAGE DIAGNOSTIC\n');
  console.log('=' .repeat(70) + '\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.setDefaultNavigationTimeout(30000);
  page.setDefaultTimeout(10000);

  // Capture console messages
  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('📍 Navigating to http://localhost:3001/merchandise...\n');
    const response = await page.goto('http://localhost:3001/merchandise');

    console.log(`HTTP Status: ${response?.status()}\n`);

    // Wait a bit for JS to load
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check what's available
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        bodyClass: document.body.className,
        merchandiseStore: !!window.merchandiseStore,
        pricingService: !!window.WavelengthPricingService,
        eventBus: !!window.WavelengthEventBus,
        cartService: !!window.MerchandiseCartService,
        apiService: !!window.MerchandiseApiService,
        validationService: !!window.MerchandiseProductValidationService,
        galleryImages: document.querySelectorAll('.gallery-image-card').length,
        productNavigator: !!document.querySelector('#product-navigator'),
        storeContainer: !!document.querySelector('#merchandise-store'),
        containerHTML: document.querySelector('#merchandise-store')?.innerHTML?.substring(0, 200),
        globalWindowKeys: Object.keys(window).filter(k =>
          k.includes('Merchandise') || k.includes('Wavelength') || k.includes('cart') || k.includes('pricing')
        )
      };
    });

    console.log('📊 PAGE STATE:\n');
    console.log(`  ✓ Title: ${pageState.title}`);
    console.log(`  ✓ Body Class: ${pageState.bodyClass}`);
    console.log(`  ${pageState.merchandiseStore ? '✅' : '❌'} window.merchandiseStore: ${pageState.merchandiseStore}`);
    console.log(`  ${pageState.pricingService ? '✅' : '❌'} window.WavelengthPricingService: ${pageState.pricingService}`);
    console.log(`  ${pageState.eventBus ? '✅' : '❌'} window.WavelengthEventBus: ${pageState.eventBus}`);
    console.log(`  ${pageState.cartService ? '✅' : '❌'} window.MerchandiseCartService: ${pageState.cartService}`);
    console.log(`  ${pageState.apiService ? '✅' : '❌'} window.MerchandiseApiService: ${pageState.apiService}`);
    console.log(`  ${pageState.validationService ? '✅' : '❌'} window.MerchandiseProductValidationService: ${pageState.validationService}`);
    console.log(`  Gallery Images: ${pageState.galleryImages}`);
    console.log(`  Product Navigator: ${pageState.productNavigator}`);
    console.log(`  Store Container: ${pageState.storeContainer}`);

    if (pageState.containerHTML) {
      console.log(`  Container Content (first 200 chars): ${pageState.containerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;')}`);
    }

    console.log(`\n  Global Services Found: ${pageState.globalWindowKeys.length}`);
    pageState.globalWindowKeys.forEach(key => {
      console.log(`    - ${key}`);
    });

    console.log('\n📋 CONSOLE LOGS:\n');
    consoleLogs.slice(-20).forEach(log => console.log(`  ${log}`));

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n' + '=' .repeat(70) + '\n');
}

runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
