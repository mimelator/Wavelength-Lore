/**
 * Debug Product Creation API Test
 * 
 * Simple test to isolate the 400 Bad Request issue
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugProductCreation() {
  console.log('🔍 Starting Product Creation Debug Test\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/merchandise/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      });
    }
  });
  
  // Capture responses
  const responses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/merchandise/')) {
      try {
        const responseText = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: responseText
        });
      } catch (e) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: 'Could not read response body'
        });
      }
    }
  });
  
  try {
    // Navigate to merchandise page
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
    
    // Wait for gallery to load
    await page.waitForSelector('.gallery-image-card', { timeout: 10000 });
    
    // Select first image
    const selectButton = await page.waitForSelector('.gallery-image-select');
    await selectButton.click();
    await wait(500);
    
    // Click first product type
    await page.waitForSelector('#choose-product-section');
    const productButton = await page.waitForSelector('.select-product-type-btn');
    await productButton.click();
    
    // Wait for modal
    await page.waitForSelector('.product-customization-modal');
    await wait(500);
    
    // Click Design Product button
    const designButton = await page.waitForSelector('#createProductBtn');
    await designButton.click();
    
    console.log('⏳ Waiting for API call...');
    await wait(5000);
    
    // Analyze requests and responses
    console.log('\n📡 API REQUESTS:');
    requests.forEach((req, i) => {
      console.log(`\n${i + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log('   POST Data:', req.postData.substring(0, 500));
      }
    });
    
    console.log('\n📨 API RESPONSES:');
    responses.forEach((res, i) => {
      console.log(`\n${i + 1}. ${res.status} ${res.statusText} - ${res.url}`);
      if (res.status !== 200) {
        console.log('   Error Body:', res.body);
      }
    });
    
    // Check for specific create-product call
    const createProductResponse = responses.find(r => r.url.includes('create-product'));
    if (createProductResponse) {
      console.log('\n🎯 CREATE PRODUCT RESPONSE:');
      console.log('Status:', createProductResponse.status);
      console.log('Body:', createProductResponse.body);
    } else {
      console.log('\n❌ No create-product API call found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run debug test
debugProductCreation().catch(console.error);