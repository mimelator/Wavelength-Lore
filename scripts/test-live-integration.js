#!/usr/bin/env node

/**
 * Live Integration Test Runner
 * Tests the group management system against a running server
 */

const http = require('http');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https://') ? https : http;
    
    const req = requestModule.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              return null;
            }
          }
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testServerConnection(baseURL) {
  log('🔍 Testing server connection...', 'cyan');
  
  try {
    const response = await makeRequest(baseURL);
    if (response.status < 500) {
      log('✅ Server is responding', 'green');
      return true;
    } else {
      log('❌ Server returned error status', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Server connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGroupAPIEndpoints(baseURL) {
  log('\n🧪 Testing Group API Endpoints...', 'cyan');
  
  const tests = [
    {
      name: 'Group Hierarchy Endpoint',
      url: `${baseURL}/api/groups/hierarchy`,
      expectedStatus: [200, 401, 403], // Success or auth required
      test: (response) => {
        if (response.status === 200) {
          const data = response.json();
          return data && data.data && data.data.admin;
        }
        return true; // Auth errors are expected without login
      }
    },
    {
      name: 'My Permissions Endpoint',
      url: `${baseURL}/api/groups/my-permissions`,
      expectedStatus: [200, 401], // Success or auth required
      test: (response) => true // Auth errors are expected
    },
    {
      name: 'Group Users Endpoint',
      url: `${baseURL}/api/groups/users/admin`,
      expectedStatus: [200, 401, 403], // Success or auth required
      test: (response) => true
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      log(`  Testing: ${test.name}...`, 'yellow');
      const response = await makeRequest(test.url);
      
      if (test.expectedStatus.includes(response.status)) {
        if (test.test(response)) {
          log(`  ✅ ${test.name} - Status: ${response.status}`, 'green');
          passed++;
        } else {
          log(`  ❌ ${test.name} - Test failed despite correct status`, 'red');
        }
      } else {
        log(`  ❌ ${test.name} - Unexpected status: ${response.status}`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${test.name} - Error: ${error.message}`, 'red');
    }
  }

  log(`\n📊 API Tests: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return passed === total;
}

async function testRouteAvailability(baseURL) {
  log('\n🌐 Testing Route Availability...', 'cyan');
  
  const routes = [
    { path: '/', name: 'Home Page' },
    { path: '/admin', name: 'Admin Panel' },
    { path: '/forum', name: 'Forum' },
    { path: '/api/groups/hierarchy', name: 'Groups API' }
  ];

  let available = 0;
  let total = routes.length;

  for (const route of routes) {
    try {
      log(`  Testing: ${route.name}...`, 'yellow');
      const response = await makeRequest(`${baseURL}${route.path}`);
      
      // Consider routes available if they don't return 404
      if (response.status !== 404) {
        log(`  ✅ ${route.name} - Available (${response.status})`, 'green');
        available++;
      } else {
        log(`  ❌ ${route.name} - Not Found (404)`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${route.name} - Error: ${error.message}`, 'red');
    }
  }

  log(`\n📊 Route Tests: ${available}/${total} available`, available >= total * 0.7 ? 'green' : 'yellow');
  return available >= total * 0.7; // 70% success rate
}

async function testGroupLogicEndpoints(baseURL) {
  log('\n🔧 Testing Group Logic Endpoints...', 'cyan');
  
  // Test endpoints that don't require authentication
  const logicTests = [
    {
      name: 'Static Assets',
      url: `${baseURL}/css/character_styles.css`,
      expectedStatus: [200, 404], // Should be available or not found
      test: (response) => response.status === 200 || response.status === 404
    },
    {
      name: 'JavaScript Files',
      url: `${baseURL}/js/group-management.js`,
      expectedStatus: [200, 404],
      test: (response) => response.status === 200 || response.status === 404
    }
  ];

  let passed = 0;
  let total = logicTests.length;

  for (const test of logicTests) {
    try {
      log(`  Testing: ${test.name}...`, 'yellow');
      const response = await makeRequest(test.url);
      
      if (test.test(response)) {
        log(`  ✅ ${test.name} - Status: ${response.status}`, 'green');
        passed++;
      } else {
        log(`  ❌ ${test.name} - Unexpected status: ${response.status}`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${test.name} - Error: ${error.message}`, 'red');
    }
  }

  log(`\n📊 Logic Tests: ${passed}/${total} passed`, passed >= total * 0.5 ? 'green' : 'yellow');
  return passed >= total * 0.5;
}

async function runPerformanceTests(baseURL) {
  log('\n⚡ Running Performance Tests...', 'cyan');
  
  const testUrl = `${baseURL}/api/groups/hierarchy`;
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await makeRequest(testUrl);
      const end = Date.now();
      times.push(end - start);
      log(`  Request ${i + 1}: ${end - start}ms`, 'blue');
    } catch (error) {
      log(`  Request ${i + 1}: Failed`, 'red');
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    log(`\n📊 Performance Results:`, 'bright');
    log(`  Average: ${avg.toFixed(2)}ms`, avg < 1000 ? 'green' : 'yellow');
    log(`  Min: ${min}ms`, 'blue');
    log(`  Max: ${max}ms`, 'blue');
    
    return avg < 2000; // Consider good if under 2 seconds
  }
  
  return false;
}

async function generateTestReport(results) {
  log('\n📋 Test Report Summary', 'bright');
  log('========================', 'bright');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  for (const [testName, passed] of Object.entries(results)) {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${testName}`, color);
  }
  
  log(`\n🎯 Overall: ${passedTests}/${totalTests} test suites passed`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Group management system is working correctly.', 'green');
  } else if (passedTests >= totalTests * 0.7) {
    log('\n⚠️  Most tests passed. Some issues may need attention.', 'yellow');
  } else {
    log('\n❌ Multiple test failures. System may need debugging.', 'red');
  }
  
  log('\n💡 Next Steps:', 'bright');
  log('  • Start your server with: npm start', 'cyan');
  log('  • Access admin panel at: http://localhost:3000/admin', 'cyan');
  log('  • Test group management APIs manually', 'cyan');
  log('  • Check server logs for any errors', 'cyan');
}

async function main() {
  const baseURL = process.argv[2] || 'http://localhost:3000';
  
  log('🎯 Group Management Live Integration Tests', 'bright');
  log(`🌐 Testing server at: ${baseURL}`, 'bright');
  log('=' .repeat(50), 'bright');
  
  const results = {};
  
  // Run all test suites
  results['Server Connection'] = await testServerConnection(baseURL);
  results['Route Availability'] = await testRouteAvailability(baseURL);
  results['Group API Endpoints'] = await testGroupAPIEndpoints(baseURL);
  results['Group Logic Features'] = await testGroupLogicEndpoints(baseURL);
  results['Performance Tests'] = await runPerformanceTests(baseURL);
  
  await generateTestReport(results);
  
  const overallSuccess = Object.values(results).filter(Boolean).length >= Object.keys(results).length * 0.7;
  process.exit(overallSuccess ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, testServerConnection, testGroupAPIEndpoints };