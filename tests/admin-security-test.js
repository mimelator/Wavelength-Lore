#!/usr/bin/env node

/**
 * Admin Authentication Security Test
 * Tests the newly implemented admin authentication system
 */

const crypto = require('crypto');

const ADMIN_KEY = 'f0132b3189809e851b4034bc915d35b93bfdc65f4458f7f65734a19940c82229';
const BASE_URL = 'http://localhost:3001';

// Test endpoints
const PROTECTED_ENDPOINTS = [
  { method: 'GET', path: '/api/admin/backup/status', critical: true },
  { method: 'POST', path: '/api/admin/backup/create', critical: true },
  { method: 'GET', path: '/api/admin/backup/list', critical: true },
  { method: 'GET', path: '/api/cache/bust', critical: false },
  { method: 'POST', path: '/api/cache/bust', critical: false },
  { method: 'GET', path: '/forum/admin', critical: false }
];

async function testEndpoint(endpoint, headers = {}) {
  try {
    const url = `${BASE_URL}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (endpoint.method === 'POST') {
      options.body = JSON.stringify({ type: 'test' });
    }

    const response = await fetch(url, options);
    
    return {
      status: response.status,
      success: response.ok,
      data: await response.text().catch(() => 'Unable to parse response')
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runSecurityTests() {
  console.log('🔐 Admin Authentication Security Test Suite');
  console.log('==========================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Unauthorized access should be blocked
  console.log('📋 Test 1: Unauthorized Access Protection');
  console.log('-'.repeat(50));

  for (const endpoint of PROTECTED_ENDPOINTS) {
    totalTests++;
    console.log(`Testing ${endpoint.method} ${endpoint.path} (no auth)`);
    
    const result = await testEndpoint(endpoint);
    
    if (result.status === 401 || result.status === 403) {
      console.log(`  ✅ PASS - Correctly blocked (${result.status})`);
      passedTests++;
    } else {
      console.log(`  ❌ FAIL - Should be blocked but got ${result.status}`);
      console.log(`     Response: ${result.data.substring(0, 100)}...`);
    }
  }

  console.log('\n📋 Test 2: Invalid Admin Key Rejection');
  console.log('-'.repeat(50));

  const invalidKey = crypto.randomBytes(32).toString('hex');
  
  for (const endpoint of PROTECTED_ENDPOINTS) {
    totalTests++;
    console.log(`Testing ${endpoint.method} ${endpoint.path} (invalid key)`);
    
    const result = await testEndpoint(endpoint, {
      'X-Admin-Key': invalidKey
    });
    
    if (result.status === 401 || result.status === 403) {
      console.log(`  ✅ PASS - Invalid key rejected (${result.status})`);
      passedTests++;
    } else {
      console.log(`  ❌ FAIL - Invalid key should be rejected but got ${result.status}`);
    }
  }

  console.log('\n📋 Test 3: Valid Admin Key Access');
  console.log('-'.repeat(50));

  for (const endpoint of PROTECTED_ENDPOINTS) {
    totalTests++;
    console.log(`Testing ${endpoint.method} ${endpoint.path} (valid key)`);
    
    const headers = {
      'X-Admin-Key': ADMIN_KEY
    };
    
    // Add critical operation header for backup operations
    if (endpoint.critical) {
      headers['X-Admin-Critical'] = 'confirmed';
    }
    
    const result = await testEndpoint(endpoint, headers);
    
    if (result.success || result.status === 200 || result.status === 503) {
      console.log(`  ✅ PASS - Valid key accepted (${result.status})`);
      passedTests++;
    } else {
      console.log(`  ❌ FAIL - Valid key should be accepted but got ${result.status}`);
      console.log(`     Response: ${result.data.substring(0, 100)}...`);
    }
  }

  console.log('\n📋 Test 4: Critical Operations Extra Protection');
  console.log('-'.repeat(50));

  const criticalEndpoints = PROTECTED_ENDPOINTS.filter(e => e.critical);
  
  for (const endpoint of criticalEndpoints) {
    totalTests++;
    console.log(`Testing ${endpoint.method} ${endpoint.path} (missing critical header)`);
    
    const result = await testEndpoint(endpoint, {
      'X-Admin-Key': ADMIN_KEY
      // Missing X-Admin-Critical header
    });
    
    if (result.status === 403) {
      console.log(`  ✅ PASS - Critical operation requires extra confirmation (${result.status})`);
      passedTests++;
    } else {
      console.log(`  ❌ FAIL - Critical operation should require extra confirmation but got ${result.status}`);
    }
  }

  console.log('\n📋 Test 5: Security Monitoring Endpoints');
  console.log('-'.repeat(50));

  // Test security health endpoint (should be accessible without auth)
  totalTests++;
  console.log('Testing GET /api/admin/security/health (no auth - should work)');
  const healthResult = await testEndpoint({ method: 'GET', path: '/api/admin/security/health' });
  
  if (healthResult.success) {
    console.log(`  ✅ PASS - Health endpoint accessible (${healthResult.status})`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Health endpoint should be accessible but got ${healthResult.status}`);
  }

  // Test security logs endpoint (should require auth)
  totalTests++;
  console.log('Testing GET /api/admin/security/logs (with valid key)');
  const logsResult = await testEndpoint(
    { method: 'GET', path: '/api/admin/security/logs' },
    { 'X-Admin-Key': ADMIN_KEY }
  );
  
  if (logsResult.success) {
    console.log(`  ✅ PASS - Security logs accessible with valid key (${logsResult.status})`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Security logs should be accessible with valid key but got ${logsResult.status}`);
  }

  // Summary
  console.log('\n🎯 Security Test Results');
  console.log('='.repeat(50));
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ✅ ALL TESTS PASSED - Admin authentication is working correctly!');
    console.log('🔒 All admin routes are properly protected.');
  } else {
    console.log('\n⚠️  ❌ SOME TESTS FAILED - Security implementation needs review.');
    console.log(`🔍 ${totalTests - passedTests} security issues detected.`);
  }

  console.log('\n📝 Admin Access Instructions:');
  console.log('To access admin endpoints, include one of these headers:');
  console.log(`  X-Admin-Key: ${ADMIN_KEY}`);
  console.log('For critical operations, also include:');
  console.log('  X-Admin-Critical: confirmed');
  console.log('\nOr use query parameter: ?adminKey=YOUR_KEY');

  return passedTests === totalTests;
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This test requires Node.js 18+ with built-in fetch API');
  console.log('Install node-fetch for older versions or upgrade Node.js');
  process.exit(1);
}

// Run tests
runSecurityTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});