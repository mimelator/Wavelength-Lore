#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkProducts() {
  console.log('\n🔍 CHECKING MERCHANDISE STORE PRODUCTS\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.setDefaultNavigationTimeout(30000);

  try {
    await page.goto('http://localhost:3001/merchandise');
    await page.waitForSelector('#merchandise-store');

    // Wait for store to initialize
    await page.waitForFunction(() => {
      return window.merchandiseStore && window.merchandiseStore.products;
    }, { timeout: 15000 });

    // Give it more time to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const info = await page.evaluate(() => {
      const store = window.merchandiseStore;
      return {
        storeExists: !!store,
        hasProducts: !!store?.products,
        userProductCount: store?.products?.length || 0,
        hasAvailableProducts: !!store?.availableProducts,
        availableProductCount: store?.availableProducts?.length || 0,
        availableProducts: (store?.availableProducts || []).slice(0, 5).map(p => ({
          id: p.id || p.productId,
          title: p.title,
          blueprintId: p.blueprintId,
          printProviderId: p.printProviderId,
          productType: p.productType
        })),
        pricingService: !!window.WavelengthPricingService,
        displayableProducts: window.WavelengthPricingService ? new window.WavelengthPricingService().getDisplayableProducts().length : 0
      };
    });

    console.log('Store Exists:', info.storeExists);
    console.log('User Products:', info.userProductCount);
    console.log('Available Products (Catalog):', info.availableProductCount);
    console.log('Pricing Service:', info.pricingService);
    console.log('Displayable Products:', info.displayableProducts);
    console.log('\nFirst 5 Available Products (with pricing metadata):');
    info.availableProducts.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title} (Blueprint: ${p.blueprintId}, Provider: ${p.printProviderId})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('');
}

checkProducts().catch(error => {
  console.error('Fatal:', error);
  process.exit(1);
});
