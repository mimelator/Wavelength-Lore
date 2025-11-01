#!/usr/bin/env node
/**
 * Test script for discontinued product validation
 * Tests the new availability validation system
 */

// Load environment variables first
require('dotenv').config();

const PrintifyService = require('../services/printify-service');
const { getAllProducts } = require('../config/product-types');

async function testProductAvailability() {
  console.log('🧪 Testing Printify Product Availability Validation');
  console.log('=' .repeat(60));
  
  try {
    const printifyService = new PrintifyService();
    
    // Get first 5 products from catalog for testing
    const allProducts = getAllProducts();
    const testProducts = allProducts.slice(0, 5);
    
    console.log(`\n📋 Testing ${testProducts.length} products from catalog:`);
    testProducts.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.name} (Blueprint ${product.blueprintId}, Provider ${product.printProviderId})`);
    });
    
    // Test individual validation
    console.log('\n🔍 Testing Individual Validation:');
    for (const product of testProducts) {
      const result = await printifyService.validateProductAvailability(
        product.blueprintId, 
        product.printProviderId
      );
      
      const status = result.available ? '✅ Available' : '❌ Discontinued';
      console.log(`   ${product.name}: ${status}`);
      if (!result.available) {
        console.log(`      Reason: ${result.reason}`);
      } else {
        console.log(`      Variants: ${result.variantCount}`);
      }
    }
    
    // Test bulk validation
    console.log('\n📦 Testing Bulk Validation:');
    const bulkResults = await printifyService.bulkValidateAvailability(testProducts, {
      maxConcurrent: 2,
      includeReasons: true
    });
    
    console.log(`   Available: ${bulkResults.available.length}/${testProducts.length}`);
    console.log(`   Discontinued: ${bulkResults.unavailable.length}/${testProducts.length}`);
    console.log(`   Errors: ${bulkResults.errors.length}/${testProducts.length}`);
    console.log(`   Cache hits: ${bulkResults.cached}`);
    console.log(`   New validations: ${bulkResults.validated}`);
    
    // Show discontinued products
    if (bulkResults.unavailable.length > 0) {
      console.log('\n❌ Discontinued Products:');
      bulkResults.unavailable.forEach(product => {
        console.log(`   - ${product.name}: ${product.reason}`);
      });
    }
    
    // Test cache performance
    console.log('\n💾 Testing Cache Performance:');
    const startTime = Date.now();
    const cachedResults = await printifyService.bulkValidateAvailability(testProducts);
    const cacheTime = Date.now() - startTime;
    console.log(`   Cached validation completed in ${cacheTime}ms`);
    console.log(`   All results should be cached: ${cachedResults.cached === testProducts.length ? '✅' : '❌'}`);
    
    console.log('\n🎉 Test Complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testProductAvailability()
    .then(() => {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testProductAvailability };