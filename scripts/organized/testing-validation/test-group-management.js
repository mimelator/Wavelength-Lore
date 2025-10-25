#!/usr/bin/env node

/**
 * Group Management Test Runner
 * Runs comprehensive tests for the group management system
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      ...options 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function installDependencies() {
  log('📦 Installing test dependencies...', 'cyan');
  
  const devDependencies = [
    'jest',
    'supertest',
    'jsdom',
    '@jest/globals'
  ];
  
  try {
    await runCommand('npm', ['install', '--save-dev', ...devDependencies]);
    log('✅ Test dependencies installed successfully', 'green');
  } catch (error) {
    log('❌ Failed to install dependencies', 'red');
    throw error;
  }
}

async function setupJestConfig() {
  log('⚙️  Setting up Jest configuration...', 'cyan');
  
  const jestConfig = {
    testEnvironment: 'node',
    testMatch: [
      '**/tests/**/*.test.js',
      '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
      'middleware/groupAuth.js',
      'routes/groupApi.js',
      'helpers/firebase-admin-utils.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000,
    verbose: true
  };
  
  // Write jest.config.js
  const configPath = path.join(process.cwd(), 'jest.config.js');
  const configContent = `module.exports = ${JSON.stringify(jestConfig, null, 2)};`;
  
  fs.writeFileSync(configPath, configContent);
  log('✅ Jest configuration created', 'green');
}

async function createTestSetup() {
  log('🔧 Creating test setup file...', 'cyan');
  
  const setupContent = `
// Jest setup file for group management tests
const { jest } = require('@jest/globals');

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  database: jest.fn(() => ({
    ref: jest.fn(() => ({
      once: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      push: jest.fn(),
      remove: jest.fn()
    }))
  }))
}));

// Global test timeout
jest.setTimeout(10000);

// Console cleanup for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: validateDOMNesting')) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
`;
  
  const setupPath = path.join(process.cwd(), 'tests', 'setup.js');
  fs.writeFileSync(setupPath, setupContent);
  log('✅ Test setup file created', 'green');
}

async function runTests() {
  log('🧪 Running group management tests...', 'cyan');
  
  try {
    // Run specific test files
    log('\n📋 Running API tests...', 'yellow');
    await runCommand('npx', ['jest', 'tests/group-management.test.js', '--verbose']);
    
    log('\n🎨 Running route rendering tests...', 'yellow');
    await runCommand('npx', ['jest', 'tests/group-routes-rendering.test.js', '--verbose']);
    
    log('\n📊 Generating coverage report...', 'yellow');
    await runCommand('npx', ['jest', '--coverage', '--coverageDirectory=coverage']);
    
    log('✅ All tests completed successfully!', 'green');
    
  } catch (error) {
    log('❌ Some tests failed', 'red');
    throw error;
  }
}

async function runLiveTests() {
  log('🔥 Running live integration tests against running server...', 'cyan');
  
  const liveTestContent = `
const request = require('supertest');
const baseURL = 'http://localhost:3000';

describe('Live Group Management Integration Tests', () => {
  test('Server should be running', async () => {
    try {
      const response = await request(baseURL).get('/');
      expect(response.status).toBeLessThan(500);
      console.log('✅ Server is responding');
    } catch (error) {
      console.log('❌ Server is not running. Start with npm start');
      throw error;
    }
  });
  
  test('Admin panel should load (requires auth)', async () => {
    try {
      const response = await request(baseURL).get('/admin');
      // Expect either success or redirect to login
      expect([200, 302, 401]).toContain(response.status);
      console.log('✅ Admin route is accessible');
    } catch (error) {
      console.log('❌ Admin route test failed');
      throw error;
    }
  });
  
  test('Group API should be available', async () => {
    try {
      const response = await request(baseURL).get('/api/groups/hierarchy');
      // Expect either success or auth required
      expect([200, 401, 403]).toContain(response.status);
      console.log('✅ Group API endpoint is responding');
    } catch (error) {
      console.log('❌ Group API test failed');
      throw error;
    }
  });
});
`;
  
  const liveTestPath = path.join(process.cwd(), 'tests', 'live-integration.test.js');
  fs.writeFileSync(liveTestPath, liveTestContent);
  
  try {
    await runCommand('npx', ['jest', 'tests/live-integration.test.js', '--verbose']);
    log('✅ Live integration tests passed!', 'green');
  } catch (error) {
    log('⚠️  Live tests failed - this is expected if server is not running', 'yellow');
  }
}

async function displayResults() {
  log('\n📊 Test Results Summary', 'bright');
  log('========================', 'bright');
  
  // Check if coverage report exists
  const coveragePath = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
  if (fs.existsSync(coveragePath)) {
    log(`📈 Coverage report available at: file://${coveragePath}`, 'cyan');
  }
  
  log('\n🧪 Test Files Created:', 'bright');
  log('  • tests/group-management.test.js - API and middleware tests', 'blue');
  log('  • tests/group-routes-rendering.test.js - Route rendering tests', 'blue');
  log('  • tests/live-integration.test.js - Live server tests', 'blue');
  log('  • tests/setup.js - Jest setup configuration', 'blue');
  log('  • jest.config.js - Jest configuration', 'blue');
  
  log('\n🚀 Next Steps:', 'bright');
  log('  • Run tests anytime with: npm test', 'green');
  log('  • Run specific tests with: npx jest tests/group-management.test.js', 'green');
  log('  • View coverage with: npx jest --coverage', 'green');
  log('  • Start server and run live tests with: npm start (in another terminal)', 'green');
}

async function main() {
  try {
    log('🎯 Group Management System Test Suite', 'bright');
    log('====================================\n', 'bright');
    
    // Ensure tests directory exists
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }
    
    await installDependencies();
    await setupJestConfig();
    await createTestSetup();
    await runTests();
    await runLiveTests();
    await displayResults();
    
    log('\n🎉 All testing setup and execution completed!', 'green');
    
  } catch (error) {
    log(`\n💥 Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Add npm test script if package.json exists
function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!pkg.scripts) {
      pkg.scripts = {};
    }
    
    pkg.scripts.test = 'jest';
    pkg.scripts['test:watch'] = 'jest --watch';
    pkg.scripts['test:coverage'] = 'jest --coverage';
    pkg.scripts['test:live'] = 'jest tests/live-integration.test.js';
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    log('✅ Added test scripts to package.json', 'green');
  }
}

if (require.main === module) {
  updatePackageJson();
  main();
}

module.exports = { main, runTests, runLiveTests };