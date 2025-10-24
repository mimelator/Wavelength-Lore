#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testImageLazyLoading() {
  console.log('🧪 TESTING IMAGE LAZY LOADING\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const productUrl = 'http://localhost:3001/merchandise/preview/68fbb2662e525b85970df388';
    
    console.log(`📄 Loading product page: ${productUrl}\n`);
    
    // Track image requests
    let imageRequestCount = 0;
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequestCount++;
      }
    });
    
    const startTime = Date.now();
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Wait a bit for initial images
    await new Promise(r => setTimeout(r, 2000));
    
    console.log(`⏱️  Page load time: ${loadTime}ms`);
    console.log(`📊 Image requests: ${imageRequestCount}\n`);
    
    // Check if lazy loading is implemented
    const hasLazyLoading = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      let lazyCount = 0;
      images.forEach(img => {
        if (img.loading === 'lazy' || img.dataset.src) {
          lazyCount++;
        }
      });
      return { total: images.length, lazy: lazyCount };
    });
    
    console.log(`Total images in DOM: ${hasLazyLoading.total}`);
    console.log(`Lazy-loaded images: ${hasLazyLoading.lazy}\n`);
    
    if (imageRequestCount > 50) {
      console.log(`❌ FAIL: Too many image requests (${imageRequestCount})`);
      console.log(`   Recommendation: Implement lazy loading for thumbnails\n`);
      process.exit(1);
    } else {
      console.log(`✅ PASS: Reasonable image count (${imageRequestCount})\n`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

testImageLazyLoading();
