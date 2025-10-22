#!/usr/bin/env node

/**
 * Gallery API Integration Test Runner
 * 
 * This script runs tests to verify the API endpoints that interact with S3 for gallery functionality.
 * 
 * Required environment variables:
 * - TEST_API_BASE_URL: The base URL of the API (default: http://localhost:3001)
 * - TEST_SESSION_COOKIE: A valid Firebase auth session token
 * 
 * Usage:
 * node scripts/test-gallery-api-integration.js
 */

const { runAllAPITests } = require('../tests/gallery/api-integration-tests');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Load test-specific variables from .env.test if available
const testEnvPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(testEnvPath)) {
  require('dotenv').config({ path: testEnvPath, override: true });
  console.log('Loaded test-specific environment from .env.test');
}

// Validate environment
function validateEnvironment() {
  const warnings = [];
  
  if (!process.env.API_BASE_URL) {
    console.log('Note: API_BASE_URL not set, defaulting to http://localhost:3001');
  }
  
  if (!process.env.SESSION_COOKIE) {
    warnings.push(
      'SESSION_COOKIE is not set. You must provide a valid Firebase auth session token.',
      'Tests will be skipped without this token.'
    );
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️ Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('\nTests will continue but may be limited.\n');
  }
}

// Main execution
async function main() {
  console.log('🧪 Gallery API Integration Test Runner');
  console.log('--------------------------------------');
  
  validateEnvironment();
  
  try {
    await runAllAPITests();
  } catch (error) {
    console.error('Test runner encountered an error:', error);
    process.exit(1);
  }
}

// Run the main function
main();