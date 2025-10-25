#!/usr/bin/env node

/**
 * Admin Catalog Refactor Validation Test
 * Tests the refactored vendor catalog functionality
 */

const http = require('http');

console.log('🧪 ADMIN CATALOG REFACTOR VALIDATION\n');

const tests = [
  {
    name: 'Forum Admin Access',
    url: 'http://localhost:3001/forum/admin',
    expectedStatus: 200
  },
  {
    name: 'Vendor Catalog (Should Redirect)',
    url: 'http://localhost:3001/admin/vendor-catalog',
    expectedStatus: 302
  },
  {
    name: 'Test Catalog Direct',
    url: 'http://localhost:3001/forum/test-catalog',
    expectedStatus: 200
  }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(test.url, (res) => {
      const responseTime = Date.now() - startTime;
      const success = res.statusCode === test.expectedStatus;
      
      resolve({
        ...test,
        status: res.statusCode,
        success,
        responseTime,
        location: res.headers.location || null
      });
    });
    
    req.on('error', () => {
      resolve({
        ...test,
        status: 'ERROR',
        success: false,
        responseTime: Date.now() - startTime
      });
    });
    
    req.setTimeout(5000, () => {
      resolve({
        ...test,
        status: 'TIMEOUT',
        success: false,
        responseTime: Date.now() - startTime
      });
    });
  });
}

async function runValidation() {
  console.log('Testing refactored admin catalog endpoints...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    const result = await testEndpoint(test);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status} (${result.responseTime}ms)`);
    
    if (result.location) {
      console.log(`   🔀 Redirects to: ${result.location}`);
    }
    
    console.log('');
  }
  
  const allPassed = results.every(r => r.success);
  const passedCount = results.filter(r => r.success).length;
  
  console.log('='.repeat(50));
  console.log(`VALIDATION RESULTS: ${passedCount}/${results.length} tests passed`);
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Refactor successful!');
  } else {
    console.log('❌ SOME TESTS FAILED - Review refactor implementation');
    
    const failed = results.filter(r => !r.success);
    console.log('\nFailed tests:');
    failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.status}`);
    });
  }
  
  process.exit(allPassed ? 0 : 1);
}

runValidation();