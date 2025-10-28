/**
 * Debug Printify API Test
 *
 * Isolates the Printify API call to diagnose 400/404 errors
 * Uses the actual merchandise-store interface
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugPrintifyAPI() {
  console.log('🔍 Starting Printify API Debug Test\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Capture ALL API requests and responses
  const apiCalls = [];

  page.on('request', request => {
    if (request.url().includes('/api/merchandise/')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
      apiCalls.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/merchandise/')) {
      try {
        const responseText = await response.text();
        const isError = response.status() >= 400;
        const logPrefix = isError ? '❌' : '✅';
        console.log(`${logPrefix} RESPONSE: ${response.status()} ${response.statusText()} - ${response.url()}`);

        const apiCall = {
          type: 'response',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseText,
          timestamp: new Date().toISOString()
        };

        // Try to parse as JSON for better display
        if (responseText && response.headers()['content-type']?.includes('application/json')) {
          try {
            apiCall.jsonBody = JSON.parse(responseText);
            if (isError) {
              console.log(`   Error details:`, apiCall.jsonBody);
            }
          } catch (e) {
            // Not valid JSON
          }
        }

        apiCalls.push(apiCall);
      } catch (e) {
        console.log(`❌ ERROR reading response: ${e.message}`);
        apiCalls.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          error: e.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  try {
    console.log('🌐 Navigating to merchandise-store...');
    await page.goto(`${BASE_URL}/merchandise-store`, { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded\n');

    // Wait for gallery to load
    console.log('⏳ Waiting for gallery images...');
    await page.waitForSelector('.gallery-image-card', { timeout: 10000 });
    console.log('✅ Gallery loaded\n');

    // Select first image
    console.log('🖱️ Clicking first gallery image...');
    const selectButtons = await page.$$('.gallery-image-select');
    if (selectButtons.length > 0) {
      await selectButtons[0].click();
      await wait(800);
      console.log('✅ Image selected\n');
    }

    // Wait for category cards
    console.log('⏳ Waiting for product categories...');
    await page.waitForSelector('.category-card', { timeout: 10000 });
    console.log('✅ Categories loaded\n');

    // Click first category browse button
    console.log('🖱️ Clicking first category...');
    const browseButtons = await page.$$('.browse-category-btn');
    if (browseButtons.length > 0) {
      await browseButtons[0].click();
      await wait(1000);
      console.log('✅ Category selected\n');
    }

    // Click first product
    console.log('🖱️ Clicking first product...');
    const productButtons = await page.$$('.product-select-btn');
    if (productButtons.length > 0) {
      await productButtons[0].click();
      await wait(1000);
      console.log('✅ Product selected\n');
    }

    // Wait for customization modal
    console.log('⏳ Waiting for customization modal...');
    await page.waitForSelector('.customization-modal', { timeout: 10000 });
    console.log('✅ Modal opened\n');

    // Enable an effect
    console.log('🖱️ Enabling first effect...');
    const effectLabels = await page.$$('.effect-checkbox-label');
    if (effectLabels.length > 0) {
      await effectLabels[0].click();
      await wait(500);
      console.log('✅ Effect enabled\n');
    }

    // Click update preview
    console.log('🖱️ Clicking "Update Preview"...');
    const updateBtn = await page.$('.update-preview-btn');
    if (updateBtn) {
      await updateBtn.click();
      await wait(2000);
      console.log('✅ Preview updated\n');
    }

    // NOW - Click preview finished product - this should trigger the Printify API call
    console.log('🎯 Clicking "Preview Finished Product" - THIS SHOULD TRIGGER PRINTIFY API CALL...\n');
    const previewBtn = await page.$('.preview-finished-product-btn');
    if (previewBtn) {
      await previewBtn.click();

      // Wait and monitor for API calls
      console.log('⏳ Waiting for Printify API call (up to 20 seconds)...\n');
      let apiCallMade = false;

      for (let i = 0; i < 40; i++) {
        const createApiCall = apiCalls.find(call =>
          call.url && call.url.includes('/api/merchandise/create-guided-product')
        );

        if (createApiCall) {
          apiCallMade = true;
          break;
        }

        await wait(500);
      }

      if (!apiCallMade) {
        console.log('❌ No Printify API call was made after 20 seconds');
      } else {
        console.log('✅ Printify API call detected!');
      }
    }

    // Wait a bit more for any lingering calls
    await wait(5000);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('  📊 API CALL ANALYSIS');
    console.log('='.repeat(80) + '\n');

    const createProductCalls = apiCalls.filter(call =>
      call.url && call.url.includes('/api/merchandise/create-guided-product')
    );

    console.log(`Total API calls made: ${apiCalls.length}`);
    console.log(`Printify create-guided-product calls: ${createProductCalls.length}\n`);

    if (createProductCalls.length === 0) {
      console.log('❌ NO PRINTIFY API CALLS DETECTED');
      console.log('\nAll API calls made:');
      apiCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.type.toUpperCase()} ${call.url}`);
      });
    } else {
      createProductCalls.forEach((call, idx) => {
        console.log(`\n🖨️ PRINTIFY CALL #${idx + 1}: ${call.type.toUpperCase()}`);
        console.log('─'.repeat(80));

        if (call.type === 'request') {
          console.log(`URL: ${call.url}`);
          console.log(`Method: ${call.method}`);
          console.log(`Timestamp: ${call.timestamp}`);

          if (call.postData) {
            try {
              const parsed = JSON.parse(call.postData);
              console.log('\n📋 POST Data (parsed):');
              console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
              console.log('\n📋 POST Data (raw):');
              console.log(call.postData.substring(0, 1000));
            }
          }
        } else {
          console.log(`Status: ${call.status} ${call.statusText}`);
          console.log(`Timestamp: ${call.timestamp}`);

          if (call.jsonBody) {
            console.log('\n📋 Response (parsed):');
            console.log(JSON.stringify(call.jsonBody, null, 2));
          } else if (call.body) {
            console.log('\n📋 Response (raw):');
            console.log(call.body.substring(0, 1000));
          }

          if (call.status >= 400) {
            console.log('\n🚨 ERROR RESPONSE - Details:');
            console.log(JSON.stringify(call, null, 2));
          }
        }
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nAPI calls captured before error:');
    apiCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. ${call.type.toUpperCase()} ${call.url} (${call.timestamp})`);
    });
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

// Run debug test
debugPrintifyAPI().catch(console.error);
