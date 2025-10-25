/**
 * Debug Product Types - See what IDs are actually available
 */

const puppeteer = require('puppeteer');

async function debugProductTypes() {
  console.log('🧪 Debug Product Types...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    
    // Get detailed product types info
    const productTypesInfo = await page.evaluate(() => {
      if (window.merchandiseStore && window.merchandiseStore.productTypes) {
        const types = {};
        for (const [categoryKey, category] of Object.entries(window.merchandiseStore.productTypes)) {
          types[categoryKey] = {
            name: category.name,
            products: category.products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description
            }))
          };
        }
        return types;
      }
      return null;
    });
    
    console.log('📋 Available Product Types:');
    console.log(JSON.stringify(productTypesInfo, null, 2));
    
    // Also get the existing product info
    const existingProduct = await page.evaluate(() => {
      if (window.merchandiseStore && window.merchandiseStore.products.length > 0) {
        const product = window.merchandiseStore.products[0];
        return {
          id: product.id || product.productId,
          title: product.title,
          variants: product.variants?.map(v => ({
            id: v.id,
            title: v.title
          }))
        };
      }
      return null;
    });
    
    console.log('📦 Existing Product:');
    console.log(JSON.stringify(existingProduct, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Debug completed');
  }
}

debugProductTypes().catch(console.error);