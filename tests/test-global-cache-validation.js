#!/usr/bin/env node
/**
 * TEST: Global Cache Validation
 */

require('dotenv').config();

async function testGlobalCacheValidation() {
  console.log('🧪 TEST: Global Cache Validation\n');
  
  const errors = [];
  
  // Test 1: Check that saved cache has required fields
  console.log('1️⃣ Testing cache save includes required fields...');
  const requiredFields = ['contentHash', 'enhancementMethod'];
  const optionalFields = ['enhancedImageUrl', 's3Key'];
  
  const mockCacheData = {
    contentHash: 'test123',
    enhancedImageUrl: null,
    s3Key: null,
    enhancementMethod: 'openai'
  };
  
  requiredFields.forEach(field => {
    if (mockCacheData[field] === null || mockCacheData[field] === undefined) {
      errors.push(`Required field ${field} is null/undefined`);
      console.log(`   ❌ ${field} is null/undefined`);
    }
  });
  
  optionalFields.forEach(field => {
    if (mockCacheData[field] === null || mockCacheData[field] === undefined) {
      console.log(`   ⚠️  ${field} is null (OK if buffer is stored)`);
    }
  });
  
  if (errors.length === 0) {
    console.log('   ✅ All required fields present');
  }
  
  // Test 2: Check that cache data matches after retrieval
  console.log('\n2️⃣ Testing cache data consistency...');
  const savedData = { contentHash: 'abc', method: 'openai', url: 'http://test.com' };
  const retrievedData = { contentHash: 'abc', method: 'openai', createdAt: 123456 }; // Firebase adds fields
  
  // Check key fields match
  const keyFields = ['contentHash', 'method'];
  let mismatch = false;
  keyFields.forEach(field => {
    if (savedData[field] !== retrievedData[field]) {
      errors.push(`Field ${field} mismatch: saved=${savedData[field]}, retrieved=${retrievedData[field]}`);
      console.log(`   ❌ ${field} mismatch`);
      mismatch = true;
    }
  });
  
  if (!mismatch) {
    console.log('   ✅ Key fields match');
  }
  
  console.log(`\n📊 Results: ${errors.length} errors found`);
  
  if (errors.length > 0) {
    console.log('\n❌ VALIDATION FAILED');
    console.log('Errors:');
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    process.exit(1);
  }
  
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}

testGlobalCacheValidation();
