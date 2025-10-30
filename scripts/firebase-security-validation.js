#!/usr/bin/env node

/**
 * Firebase Security Rules Validation Test Suite
 * 
 * Comprehensive automated testing to ensure Firebase security rule changes
 * haven't broken any existing functionality. Tests both client-side and
 * server-side Firebase operations across all major use cases.
 */

const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wavelengthlore.com' 
  : 'http://localhost:3001';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Logger utility with colors and formatting
 */
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => {
    console.log(`✅ ${msg}`);
    testResults.passed++;
  },
  warning: (msg) => {
    console.log(`⚠️  ${msg}`);
    testResults.warnings++;
  },
  error: (msg) => {
    console.log(`❌ ${msg}`);
    testResults.failed++;
    testResults.errors.push(msg);
  },
  section: (msg) => console.log(`\n🔍 ${msg}\n${'='.repeat(60)}`),
  header: (msg) => console.log(`\n📋 ${msg}\n${'-'.repeat(40)}`)
};

/**
 * HTTP request helper with admin authentication
 */
async function request(path, options = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    const config = {
      timeout: 15000,
      validateStatus: () => true, // Don't throw on HTTP errors
      headers: {
        'User-Agent': 'Firebase-Security-Test-Suite/1.0',
        ...(ADMIN_SECRET && { 'X-Admin-Secret': ADMIN_SECRET }),
        ...options.headers
      },
      ...options
    };

    log.info(`Testing: ${url}`);
    const response = await axios(url, config);
    return response;
  } catch (error) {
    return {
      status: 500,
      statusText: 'Network Error',
      data: { error: error.message }
    };
  }
}

/**
 * Test API endpoint functionality
 */
async function testApiEndpoint(path, expectedData = null, description = '') {
  const response = await request(path);
  
  if (response.status >= 200 && response.status < 300) {
    // Check if response has expected structure
    if (expectedData) {
      const hasExpectedData = Object.keys(expectedData).every(key => 
        response.data && response.data.hasOwnProperty(key)
      );
      
      if (hasExpectedData) {
        log.success(`${description || path} - API working correctly`);
        return true;
      } else {
        log.warning(`${description || path} - API responding but missing expected data structure`);
        return false;
      }
    } else {
      log.success(`${description || path} - API responding correctly`);
      return true;
    }
  } else {
    log.error(`${description || path} - API error: ${response.status} ${response.statusText}`);
    if (response.data && response.data.error) {
      log.error(`  Details: ${response.data.error}`);
    }
    return false;
  }
}

/**
 * Test page rendering (basic functionality)
 */
async function testPageRender(path, expectedContent = null, description = '') {
  const response = await request(path);
  
  if (response.status >= 200 && response.status < 300) {
    if (expectedContent && typeof response.data === 'string') {
      const hasContent = expectedContent.every(content => 
        response.data.includes(content)
      );
      
      if (hasContent) {
        log.success(`${description || path} - Page rendering correctly`);
        return true;
      } else {
        log.warning(`${description || path} - Page renders but missing expected content`);
        return false;
      }
    } else {
      log.success(`${description || path} - Page renders successfully`);
      return true;
    }
  } else {
    log.error(`${description || path} - Page error: ${response.status} ${response.statusText}`);
    return false;
  }
}

/**
 * Test Firebase-dependent API endpoints
 */
async function testFirebaseAPIs() {
  log.section('Firebase API Endpoints Test');

  // Test public data APIs (should work with new rules)
  await testApiEndpoint('/api/characters', { success: true, data: {} }, 'Characters API');
  await testApiEndpoint('/api/lore', { success: true, data: {} }, 'Lore API');
  await testApiEndpoint('/api/episodes', { success: true, data: {} }, 'Episodes API');
  
  // Test specific character/lore endpoints
  await testApiEndpoint('/api/characters/alex', null, 'Specific Character API');
  await testApiEndpoint('/api/lore/shire', null, 'Specific Lore API');

  // Test leaderboard functionality (critical after rule changes)
  await testApiEndpoint('/api/games/wavelength-knowledge/leaderboard', 
    { success: true, leaderboard: [] }, 'Game Leaderboard API');

  // Test forum APIs (should still work with public read access)
  await testApiEndpoint('/api/forum/posts/recent', 
    { success: true, posts: [] }, 'Forum Recent Posts API');
  await testApiEndpoint('/api/forum/posts/popular', 
    { success: true, posts: [] }, 'Forum Popular Posts API');
  await testApiEndpoint('/api/forum/stats', 
    { success: true }, 'Forum Statistics API');
}

/**
 * Test page rendering for Firebase-dependent pages
 */
async function testFirebasePages() {
  log.section('Firebase-Dependent Pages Test');

  // Test pages that load Firebase data server-side
  await testPageRender('/', ['Wavelength', 'Season'], 'Home Page');
  await testPageRender('/character/alex', ['Alex', 'character'], 'Character Page');
  await testPageRender('/lore/shire', ['Shire', 'lore'], 'Lore Page');
  await testPageRender('/season/1/episode/1', ['Episode', 'Season'], 'Episode Page');
  
  // Test leaderboard page (critical test)
  await testPageRender('/leaderboard', ['Leaderboard', 'players'], 'Leaderboard Page');
  
  // Test forum pages (should work with public read rules)
  await testPageRender('/forum', ['Forum', 'Community'], 'Forum Home');
  await testPageRender('/forum/category/general', ['General', 'Discussion'], 'Forum Category');
  
  // Test admin/debug pages
  await testPageRender('/firebase-debug', ['Firebase', 'Debug'], 'Firebase Debug Page');
  await testPageRender('/firebase-leaderboard-test', ['Permission', 'Test'], 'Firebase Test Page');
}

/**
 * Test client-side Firebase functionality (simulated)
 */
async function testClientSideFirebase() {
  log.section('Client-Side Firebase Access Test');

  // Test pages with heavy client-side Firebase usage
  const clientSidePages = [
    { path: '/forum/popular', desc: 'Forum Popular Posts (Client-side Firebase)' },
    { path: '/forum/recent', desc: 'Forum Recent Posts (Client-side Firebase)' },
    { path: '/forum/admin', desc: 'Forum Admin Panel (Client-side Firebase)' },
    { path: '/auth/login', desc: 'Authentication Page (Firebase Auth)' }
  ];

  for (const page of clientSidePages) {
    await testPageRender(page.path, ['firebase'], page.desc);
  }
}

/**
 * Test game and user functionality
 */
async function testGameAndUserFeatures() {
  log.section('Game & User Features Test');

  // Test game-related endpoints
  await testApiEndpoint('/api/games/wavelength-knowledge/stats', null, 'Game Stats API');
  
  // Test user-related functionality (these might require auth)
  const response = await request('/api/user/profile');
  if (response.status === 401 || response.status === 403) {
    log.success('User Profile API - Correctly requires authentication');
  } else if (response.status === 200) {
    log.success('User Profile API - Working (authenticated or public)');
  } else {
    log.warning('User Profile API - Unexpected response status');
  }
}

/**
 * Test admin functionality
 */
async function testAdminFeatures() {
  log.section('Admin Features Test');

  // Test admin APIs (should work with ADMIN_SECRET)
  if (ADMIN_SECRET) {
    await testApiEndpoint('/api/admin/users', { success: true }, 'Admin Users API');
    await testApiEndpoint('/api/admin/posts', { success: true }, 'Admin Posts API');
    log.success('Admin functionality tested with authentication');
  } else {
    log.warning('Admin functionality skipped - ADMIN_SECRET not provided');
  }
}

/**
 * Test specific security scenarios
 */
async function testSecurityScenarios() {
  log.section('Security Scenarios Test');

  // Test that unauthenticated users can't access protected data
  const protectedEndpoints = [
    '/api/admin/users',
    '/api/admin/posts',
    '/api/admin/analytics'
  ];

  for (const endpoint of protectedEndpoints) {
    const response = await request(endpoint, { headers: {} }); // No admin secret
    if (response.status === 401 || response.status === 403) {
      log.success(`${endpoint} - Correctly protected (${response.status})`);
    } else {
      log.error(`${endpoint} - Security issue: should require authentication`);
    }
  }

  // Test that public endpoints are still accessible
  const publicEndpoints = [
    '/api/characters',
    '/api/lore',
    '/api/episodes'
  ];

  for (const endpoint of publicEndpoints) {
    const response = await request(endpoint);
    if (response.status >= 200 && response.status < 300) {
      log.success(`${endpoint} - Correctly public`);
    } else {
      log.error(`${endpoint} - Public access issue: ${response.status}`);
    }
  }
}

/**
 * Generate final test report
 */
function generateReport() {
  log.section('Test Results Summary');
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Critical Issues Found:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log(`\n🎉 All critical tests passed! Firebase security rules update successful.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the issues above.`);
  }
  
  console.log(`\n🔗 Tested against: ${BASE_URL}`);
  console.log(`🔒 Admin auth: ${ADMIN_SECRET ? 'Enabled' : 'Disabled'}`);
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🔒 Firebase Security Rules Validation Test Suite');
  console.log('================================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Admin Auth: ${ADMIN_SECRET ? 'Available' : 'Not configured'}`);
  console.log(`Start Time: ${new Date().toISOString()}`);

  try {
    // Core functionality tests
    await testFirebaseAPIs();
    await testFirebasePages();
    await testClientSideFirebase();
    await testGameAndUserFeatures();
    await testAdminFeatures();
    await testSecurityScenarios();

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
  } finally {
    generateReport();
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Firebase Security Rules Validation Test Suite

Usage: node firebase-security-validation.js [options]

Options:
  --help     Show this help message

Environment Variables:
  NODE_ENV=production    Test against production (default: localhost)
  ADMIN_SECRET_KEY      Admin secret for authenticated endpoints

Examples:
  # Test local development
  node firebase-security-validation.js
  
  # Test production with admin access
  NODE_ENV=production ADMIN_SECRET_KEY=your_secret node firebase-security-validation.js
`);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});