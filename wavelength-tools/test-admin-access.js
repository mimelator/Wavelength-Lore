#!/usr/bin/env node

const http = require('http');

const tests = [
  { name: 'Forum Admin', url: 'http://localhost:3001/forum/admin' },
  { name: 'Vendor Catalog', url: 'http://localhost:3001/admin/vendor-catalog' },
  { name: 'Test Catalog', url: 'http://localhost:3001/forum/test-catalog' }
];

async function testUrl(test) {
  return new Promise((resolve) => {
    const req = http.get(test.url, (res) => {
      resolve({ ...test, status: res.statusCode, success: res.statusCode === 200 });
    });
    req.on('error', () => resolve({ ...test, status: 'ERROR', success: false }));
    req.setTimeout(test.name === 'Vendor Catalog' ? 15000 : 5000, () => resolve({ ...test, status: 'TIMEOUT', success: false }));
  });
}

async function runTests() {
  console.log('🧪 Testing Admin Access...\n');
  
  const results = await Promise.all(tests.map(testUrl));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
  });
  
  const allPassed = results.every(r => r.success);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests();