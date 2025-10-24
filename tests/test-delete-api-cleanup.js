#!/usr/bin/env node

/**
 * Test: Delete API Cleanup Validation
 * 
 * Verifies that delete API actually removes products from:
 * 1. Firebase database
 * 2. Printify shop
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testDeleteCleanup() {
  console.log('\n🧪 TEST: Delete API Cleanup Validation\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Get current product count
    console.log('\n📋 STEP 1: Getting current products...');
    const catalogResponse = await axios.get(`${BASE_URL}/admin/vendor-research/catalog`);
    const html = catalogResponse.data;
    
    // Extract product IDs from delete buttons
    const deleteMatches = html.match(/deleteProduct\('([^']+)'/g) || [];
    const productIds = deleteMatches.map(m => m.match(/deleteProduct\('([^']+)'/)[1]);
    
    console.log(`Found ${productIds.length} products in catalog`);
    
    // VALIDATION: Check if count matches what's displayed
    const cardMatches = html.match(/class="product-card"/g) || [];
    console.log(`Product cards in HTML: ${cardMatches.length}`);
    
    if (productIds.length !== cardMatches.length) {
      console.log(`⚠️  WARNING: Product count mismatch - ${productIds.length} IDs vs ${cardMatches.length} cards`);
    }
    
    if (productIds.length === 0) {
      console.log('\n✅ No products to test deletion\n');
      process.exit(0);
    }
    
    // Step 2: Delete first product
    const testProductId = productIds[0];
    console.log(`\n📋 STEP 2: Deleting product ${testProductId}...`);
    
    const deleteResponse = await axios.delete(`${BASE_URL}/admin/vendor-research/delete-preview`, {
      data: { cacheKey: testProductId }
    });
    
    console.log(`Delete API response: ${deleteResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Full response:`, JSON.stringify(deleteResponse.data, null, 2));
    
    if (!deleteResponse.data.success) {
      console.log(`❌ FAIL: Delete API returned failure\n`);
      process.exit(1);
    }
    
    // VALIDATION: Check cleanup status
    const cleanup = deleteResponse.data.cleanup;
    if (cleanup) {
      console.log(`  Printify deleted: ${cleanup.printifyDeleted}`);
      console.log(`  Firebase deleted: ${cleanup.firebaseDeleted}`);
      
      if (!cleanup.printifyDeleted && !cleanup.printifyError?.includes('404')) {
        console.log(`❌ FAIL: Printify deletion failed but product exists\n`);
        process.exit(1);
      }
      
      if (!cleanup.firebaseDeleted) {
        console.log(`❌ FAIL: Firebase deletion failed\n`);
        process.exit(1);
      }
    } else {
      console.log(`⚠️  WARNING: No cleanup status in response`);
    }
    
    // Step 3: Verify removed from catalog
    console.log(`\n📋 STEP 3: Verifying removal from catalog...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec
    
    const catalogResponse2 = await axios.get(`${BASE_URL}/admin/vendor-research/catalog`);
    const html2 = catalogResponse2.data;
    
    if (html2.includes(testProductId)) {
      console.log(`❌ FAIL: Product ${testProductId} still in catalog after delete\n`);
      process.exit(1);
    } else {
      console.log(`✅ Product removed from catalog`);
    }
    
    // Step 4: Verify removed from Printify
    console.log(`\n📋 STEP 4: Verifying removal from Printify...`);
    
    try {
      const printifyResponse = await axios.get(`${BASE_URL}/merchandise/preview/${testProductId}`);
      
      if (printifyResponse.status === 200) {
        console.log(`❌ FAIL: Product ${testProductId} still accessible in Printify\n`);
        process.exit(1);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`✅ Product returns 404 (removed from Printify)`);
      } else {
        console.log(`⚠️  Unexpected error: ${err.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ ALL TESTS PASSED - Delete API properly cleans up\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
}

testDeleteCleanup();
