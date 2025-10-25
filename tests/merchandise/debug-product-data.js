/**
 * Debug Product Data Structure
 */

const puppeteer = require('puppeteer');

async function debugProductData() {
  console.log('🧪 Debug Product Data Structure...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    
    // Get detailed product data
    const productData = await page.evaluate(() => {
      if (window.merchandiseStore && window.merchandiseStore.products.length > 0) {
        const product = window.merchandiseStore.products[0];
        return {
          id: product.id || product.productId,
          title: product.title,
          description: product.description,
          images: product.images,
          variants: product.variants,
          sourceImage: product.sourceImage,
          hasImages: !!(product.images && product.images.length > 0),
          hasVariants: !!(product.variants && product.variants.length > 0),
          imageCount: product.images?.length || 0,
          variantCount: product.variants?.length || 0
        };
      }
      return null;
    });
    
    console.log('📦 Product Data:');
    console.log(JSON.stringify(productData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Debug completed');
  }
}

debugProductData().catch(console.error);