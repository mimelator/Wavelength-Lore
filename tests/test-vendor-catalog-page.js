#!/usr/bin/env node
/**
 * TEST: Vendor Catalog Page Functionality
 */

const axios = require('axios');

async function testVendorCatalogPage() {
  console.log('🧪 TEST: Vendor Catalog Page\n');
  
  const baseUrl = 'http://localhost:3001';
  const errors = [];
  
  try {
    // Test 1: Catalog API returns products
    console.log('1️⃣ Testing catalog API...');
    const apiResponse = await axios.get(`${baseUrl}/api/merchandise/vendor-previews`);
    
    if (!apiResponse.data.success) {
      errors.push('API returned success: false');
      console.log('   ❌ API failed');
    } else if (apiResponse.data.count === 0) {
      errors.push('No products in catalog');
      console.log('   ❌ No products found');
    } else {
      console.log(`   ✅ Found ${apiResponse.data.count} products`);
    }
    
    // Test 2: Products have required fields
    console.log('\n2️⃣ Testing product data structure...');
    if (apiResponse.data.previews && apiResponse.data.previews.length > 0) {
      const product = apiResponse.data.previews[0];
      const requiredFields = ['productId', 'viewUrl', 'blueprintName', 'providerName'];
      
      requiredFields.forEach(field => {
        if (!product[field]) {
          errors.push(`Product missing field: ${field}`);
          console.log(`   ❌ Missing ${field}`);
        }
      });
      
      if (errors.length === 0) {
        console.log('   ✅ All required fields present');
      }
    }
    
    // Test 3: Catalog page loads
    console.log('\n3️⃣ Testing catalog page HTML...');
    const pageResponse = await axios.get(`${baseUrl}/admin/vendor-research/catalog`);
    
    if (pageResponse.status !== 200) {
      errors.push(`Page returned status ${pageResponse.status}`);
      console.log(`   ❌ Status ${pageResponse.status}`);
    } else if (!pageResponse.data.includes('Vendor Catalog')) {
      errors.push('Page missing expected content');
      console.log('   ❌ Missing expected content');
    } else {
      console.log('   ✅ Page loads successfully');
    }
    
    console.log(`\n📊 Results: ${errors.length} errors found`);
    
    if (errors.length > 0) {
      console.log('\n❌ TEST FAILED');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
      process.exit(1);
    }
    
    console.log('\n✅ ALL TESTS PASSED');
    console.log(`\n🔗 Catalog URL: ${baseUrl}/admin/vendor-research/catalog`);
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

testVendorCatalogPage();
