#!/usr/bin/env node

/**
 * Test: Modal Close Button - Single Click Verification
 *
 * This test PROVES whether the modal closes on 1 click or requires 2 clicks.
 * No docs, no celebrations. Just proof.
 */

const puppeteer = require('puppeteer');
const assert = require('assert');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000;

async function testModalCloseSingleClick() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST: Modal Close Button - Single Click');
  console.log('='.repeat(80) + '\n');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('1. Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    page.setDefaultTimeout(TEST_TIMEOUT);

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to merchandise store
    console.log('2. Navigating to merchandise store...');
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });

    // Wait for products to load
    console.log('3. Waiting for products to load...');
    await page.waitForSelector('[data-product-id]', { timeout: 10000 });

    // Get first product
    console.log('4. Finding first product...');
    const productId = await page.$eval('[data-product-id]', el => el.dataset.productId);
    console.log(`   Found product: ${productId}`);

    // Click customize button
    console.log('5. Clicking customize button...');
    await page.click('.edit-product-btn');

    // Wait for modal to appear
    console.log('6. Waiting for modal to appear...');
    await page.waitForSelector('.customization-modal, .modal-dialog', { timeout: 5000 });

    // Verify modal is visible
    const modalVisible = await page.$('.customization-modal, .modal-dialog');
    assert(modalVisible, 'Modal should be visible');
    console.log('   ✓ Modal is visible');

    // Get close button
    console.log('7. Finding close button...');
    const closeBtn = await page.$('.modal-close-btn');
    assert(closeBtn, 'Close button should exist');
    console.log('   ✓ Close button found');

    // Get modal element before click
    const modal = await page.$('[data-modal-id]');
    assert(modal, 'Modal element should exist');

    // CRITICAL TEST: Click close button ONCE
    console.log('8. Clicking close button (SINGLE CLICK)...');
    await page.click('.modal-close-btn');

    // Wait a bit for animation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if modal still exists
    console.log('9. Checking if modal closed after FIRST click...');

    // Give it 500ms for animation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to find modal
    const modalStillVisible = await page.$('[data-modal-id]');

    if (!modalStillVisible) {
      console.log('   ✓ MODAL CLOSED ON FIRST CLICK');
      console.log('\n' + '='.repeat(80));
      console.log('✅ TEST PASSED: Modal closes on single click');
      console.log('='.repeat(80) + '\n');
      return true;
    } else {
      console.log('   ✗ MODAL STILL OPEN AFTER FIRST CLICK');
      console.log('   Testing if it closes on SECOND click...');

      // Click again
      await page.click('.modal-close-btn');
      await new Promise(resolve => setTimeout(resolve, 500));

      const modalAfterSecondClick = await page.$('[data-modal-id]');

      if (!modalAfterSecondClick) {
        console.log('   ✓ Modal closed on SECOND click');
        console.log('\n' + '='.repeat(80));
        console.log('❌ TEST FAILED: Modal requires 2 clicks to close (BUG STILL EXISTS)');
        console.log('='.repeat(80) + '\n');
        return false;
      } else {
        console.log('   ✗ Modal still open after SECOND click');
        console.log('\n' + '='.repeat(80));
        console.log('❌ TEST FAILED: Modal won\'t close at all');
        console.log('='.repeat(80) + '\n');
        return false;
      }
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testModalCloseSingleClick().then(success => {
  process.exit(success ? 0 : 1);
});
