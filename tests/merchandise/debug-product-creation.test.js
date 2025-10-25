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
  
  // Capture responses with detailed error info
  const responses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/merchandise/')) {
      try {
        const responseText = await response.text();
        const responseData = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseText
        };
        
        // Parse JSON if possible for better error details
        if (responseText && response.headers()['content-type']?.includes('application/json')) {
          try {
            responseData.jsonBody = JSON.parse(responseText);
          } catch (e) {
            // Not valid JSON, keep as text
          }
        }
        
        responses.push(responseData);
      } catch (e) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body: 'Could not read response body: ' + e.message
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
    console.log('🔄 Clicking Design Product button...');
    await designButton.click();
    
    // Monitor button state changes
    const monitorButton = setInterval(async () => {
      try {
        const buttonText = await page.evaluate(() => {
          const btn = document.querySelector('#createProductBtn');
          return btn ? btn.textContent.trim() : 'Button not found';
        });
        console.log('🔄 Button state:', buttonText);
      } catch (e) {
        // Button might be removed or changed
      }
    }, 2000);
    
    setTimeout(() => clearInterval(monitorButton), 15000);
    
    console.log('⏳ Waiting for API call...');
    
    // Monitor for create-product response in real-time
    let createProductFound = false;
    const checkInterval = setInterval(() => {
      const createProductResponse = responses.find(r => r.url.includes('create-product'));
      if (createProductResponse && !createProductFound) {
        createProductFound = true;
        console.log('✅ CREATE-PRODUCT RESPONSE RECEIVED:', createProductResponse.status);
        clearInterval(checkInterval);
      }
    }, 500);
    
    // Wait longer for the response
    await wait(15000);
    clearInterval(checkInterval);
    
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
        if (res.jsonBody) {
          console.log('   Parsed Error:', JSON.stringify(res.jsonBody, null, 2));
        }
        console.log('   Response Headers:', res.headers);
      }
    });
    
    // Check for specific create-product call
    const createProductResponse = responses.find(r => r.url.includes('create-product'));
    if (createProductResponse) {
      console.log('\n🎯 CREATE PRODUCT DETAILED ANALYSIS:');
      console.log('Status:', createProductResponse.status, createProductResponse.statusText);
      console.log('Raw Body:', createProductResponse.body);
      if (createProductResponse.jsonBody) {
        console.log('Parsed Error:', JSON.stringify(createProductResponse.jsonBody, null, 2));
      }
      console.log('Response Headers:', createProductResponse.headers);
      
      // Find the corresponding request
      const createProductRequest = requests.find(r => r.url.includes('create-product'));
      if (createProductRequest) {
        console.log('\n📤 CORRESPONDING REQUEST:');
        console.log('Method:', createProductRequest.method);
        console.log('URL:', createProductRequest.url);
        console.log('Headers:', createProductRequest.headers);
        console.log('POST Data:', createProductRequest.postData);
        
        // Parse POST data if JSON
        if (createProductRequest.postData) {
          try {
            const parsedData = JSON.parse(createProductRequest.postData);
            console.log('Parsed POST Data:', JSON.stringify(parsedData, null, 2));
          } catch (e) {
            console.log('POST Data (not JSON):', createProductRequest.postData);
          }
        }
      }
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