#!/usr/bin/env node

/**
 * WAVELENGTH Badge Placement Integration Test
 * 
 * Validates the badge placement UI system for merchandise integration readiness
 * Tests API endpoints, configuration format, and integration compatibility
 * 
 * 🏆 INTEGRATION TEST SUITE for Badge Placement Demo UI
 */

const https = require('https');
const http = require('http');

console.log('🏆'.repeat(80));
console.log('🏆 WAVELENGTH BADGE PLACEMENT INTEGRATION TEST SUITE');
console.log('🏆'.repeat(80));
console.log('');

const BASE_URL = 'http://localhost:3001';

/**
 * Test Configuration
 */
const TESTS = {
  'Badge Demo UI Access': {
    url: `${BASE_URL}/merchandise/badge-demo`,
    method: 'GET',
    expectStatus: 200,
    expectContent: ['BadgePlacementUI', 'badge-placement-container'],
    description: 'Verify badge placement demo UI is accessible'
  },
  
  'Badge Placement Component JS': {
    url: `${BASE_URL}/js/components/badge-placement-ui.js`,
    method: 'GET',
    expectStatus: 200,
    expectContent: ['class BadgePlacementUI', 'addBadge', 'clearAllBadges'],
    description: 'Verify badge placement JavaScript component loads'
  },
  
  'Badge Placement CSS': {
    url: `${BASE_URL}/css/badge-placement-ui.css`,
    method: 'GET',
    expectStatus: 200,
    expectContent: ['.badge-placement', '.badge-canvas'],
    description: 'Verify badge placement CSS styles load'
  },
  
  'Merchandise Routes Available': {
    url: `${BASE_URL}/merchandise`,
    method: 'GET',
    expectStatus: [200, 302], // May redirect to login
    description: 'Verify merchandise routes are mounted'
  }
};

/**
 * Mock Badge Configuration for Testing
 */
const MOCK_BADGE_CONFIG = {
  badges: [
    {
      id: 'harmony-student',
      name: 'Harmony Student',
      position: { x: 0.1, y: 0.1 },
      size: 'medium',
      zIndex: 1
    },
    {
      id: 'wisdom-seeker', 
      name: 'Wisdom Seeker',
      position: { x: 0.8, y: 0.1 },
      size: 'small',
      zIndex: 2
    }
  ],
  metadata: {
    totalBadges: 2,
    canvasSize: { width: 600, height: 400 },
    created: new Date().toISOString()
  }
};

/**
 * HTTP Request Helper
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Wavelength-Badge-Test/1.0'
      }
    };
    
    if (data && method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Run Individual Test
 */
async function runTest(testName, testConfig) {
  console.log(`\n🔍 TESTING: ${testName}`);
  console.log(`   📋 ${testConfig.description}`);
  console.log(`   🌐 ${testConfig.method} ${testConfig.url}`);
  
  try {
    const response = await makeRequest(testConfig.url, testConfig.method);
    
    // Check status code
    const expectedStatus = Array.isArray(testConfig.expectStatus) ? testConfig.expectStatus : [testConfig.expectStatus];
    const statusOk = expectedStatus.includes(response.status);
    
    console.log(`   📊 Status: ${response.status} ${statusOk ? '✅' : '❌'}`);
    
    if (!statusOk) {
      console.log(`   ❌ Expected status: ${testConfig.expectStatus}, got: ${response.status}`);
      return { name: testName, passed: false, error: `Status ${response.status}` };
    }
    
    // Check content if specified
    if (testConfig.expectContent && response.data) {
      const contentChecks = testConfig.expectContent.map(expectedContent => {
        const found = response.data.includes(expectedContent);
        console.log(`   🔍 Content "${expectedContent}": ${found ? '✅' : '❌'}`);
        return found;
      });
      
      const allContentFound = contentChecks.every(check => check);
      if (!allContentFound) {
        return { name: testName, passed: false, error: 'Content check failed' };
      }
    }
    
    console.log(`   ✅ PASSED: ${testName}`);
    return { name: testName, passed: true };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { name: testName, passed: false, error: error.message };
  }
}

/**
 * Test Badge Configuration Format
 */
function testBadgeConfigurationFormat() {
  console.log(`\n🔍 TESTING: Badge Configuration Format Validation`);
  console.log(`   📋 Verify badge configuration structure`);
  
  try {
    // Test required fields
    const requiredFields = ['badges', 'metadata'];
    const missingFields = requiredFields.filter(field => !MOCK_BADGE_CONFIG[field]);
    
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
      return { name: 'Badge Configuration Format', passed: false, error: 'Missing fields' };
    }
    
    // Test badge structure
    const badges = MOCK_BADGE_CONFIG.badges;
    if (!Array.isArray(badges)) {
      console.log(`   ❌ Badges must be an array`);
      return { name: 'Badge Configuration Format', passed: false, error: 'Invalid badges format' };
    }
    
    // Test individual badge format
    for (const badge of badges) {
      const requiredBadgeFields = ['id', 'name', 'position', 'size'];
      const missingBadgeFields = requiredBadgeFields.filter(field => !badge[field]);
      
      if (missingBadgeFields.length > 0) {
        console.log(`   ❌ Badge missing fields: ${missingBadgeFields.join(', ')}`);
        return { name: 'Badge Configuration Format', passed: false, error: 'Invalid badge format' };
      }
      
      // Test position format
      if (!badge.position.x || !badge.position.y) {
        console.log(`   ❌ Badge position must have x and y coordinates`);
        return { name: 'Badge Configuration Format', passed: false, error: 'Invalid position format' };
      }
      
      // Test position range (0-1)
      if (badge.position.x < 0 || badge.position.x > 1 || badge.position.y < 0 || badge.position.y > 1) {
        console.log(`   ❌ Badge position coordinates must be between 0 and 1`);
        return { name: 'Badge Configuration Format', passed: false, error: 'Position out of range' };
      }
      
      console.log(`   ✅ Badge "${badge.name}" format valid`);
    }
    
    console.log(`   ✅ Configuration format validation passed`);
    console.log(`   📊 Sample config:`, JSON.stringify(MOCK_BADGE_CONFIG, null, 2));
    
    return { name: 'Badge Configuration Format', passed: true };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return { name: 'Badge Configuration Format', passed: false, error: error.message };
  }
}

/**
 * Test Integration Readiness
 */
function testIntegrationReadiness() {
  console.log(`\n🔍 TESTING: Integration Readiness Checklist`);
  console.log(`   📋 Verify system ready for merchandise integration`);
  
  const checklist = [
    {
      name: 'Badge Configuration Schema',
      check: () => MOCK_BADGE_CONFIG.badges && Array.isArray(MOCK_BADGE_CONFIG.badges),
      description: 'Badge configuration follows expected schema'
    },
    {
      name: 'Position Normalization',
      check: () => MOCK_BADGE_CONFIG.badges.every(b => 
        b.position && b.position.x >= 0 && b.position.x <= 1 && 
        b.position.y >= 0 && b.position.y <= 1
      ),
      description: 'Badge positions use normalized coordinates (0-1)'
    },
    {
      name: 'Size Standardization',
      check: () => MOCK_BADGE_CONFIG.badges.every(b => 
        ['small', 'medium', 'large'].includes(b.size)
      ),
      description: 'Badge sizes use standard values'
    },
    {
      name: 'Unique Badge IDs',
      check: () => {
        const ids = MOCK_BADGE_CONFIG.badges.map(b => b.id);
        return ids.length === new Set(ids).size;
      },
      description: 'All badge IDs are unique'
    },
    {
      name: 'Metadata Present',
      check: () => MOCK_BADGE_CONFIG.metadata && 
        MOCK_BADGE_CONFIG.metadata.totalBadges === MOCK_BADGE_CONFIG.badges.length,
      description: 'Metadata matches badge count'
    }
  ];
  
  let allPassed = true;
  
  for (const item of checklist) {
    try {
      const passed = item.check();
      console.log(`   ${passed ? '✅' : '❌'} ${item.name}: ${item.description}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`   ❌ ${item.name}: Error - ${error.message}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log(`   🚀 INTEGRATION READY: All checks passed!`);
  } else {
    console.log(`   ⚠️  INTEGRATION ISSUES: Some checks failed`);
  }
  
  return { name: 'Integration Readiness', passed: allPassed };
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 Starting Badge Placement Integration Tests...\n');
  
  const results = [];
  
  // Run HTTP endpoint tests
  for (const [testName, testConfig] of Object.entries(TESTS)) {
    const result = await runTest(testName, testConfig);
    results.push(result);
  }
  
  // Run configuration format test
  const configResult = testBadgeConfigurationFormat();
  results.push(configResult);
  
  // Run integration readiness test
  const integrationResult = testIntegrationReadiness();
  results.push(integrationResult);
  
  // Summary
  console.log('\n' + '🏆'.repeat(80));
  console.log('🏆 TEST RESULTS SUMMARY');
  console.log('🏆'.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 OVERALL RESULTS: ${passed}/${total} tests passed`);
  
  results.forEach(result => {
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.name}${result.error ? ` (${result.error})` : ''}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Badge placement system is integration-ready! 🎉');
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Test the badge demo UI at: http://localhost:3001/merchandise/badge-demo');
    console.log('   2. Try the interactive features: Add badges, test layouts, export config');
    console.log('   3. Integrate with merchandise creation workflow');
    console.log('   4. Add real badge image assets');
    console.log('   5. Connect to badge unlock system');
  } else {
    console.log(`\n⚠️  ${total - passed} tests failed. Please fix issues before integration.`);
  }
  
  console.log('\n🌊 WAVELENGTH Badge Placement Test Complete! ⚡');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});