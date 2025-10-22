#!/usr/bin/env node

/**
 * Gallery End-to-End Test Runner
 * 
 * This script runs comprehensive end-to-end tests for the gallery functionality,
 * testing the entire flow from upload to S3 storage to CDN access.
 * 
 * Required environment variables:
 * - TEST_API_BASE_URL: The base URL of the API (default: http://localhost:3001)
 * - TEST_SESSION_COOKIE: A valid Firebase auth session token
 * - AWS_REGION: The AWS region of your S3 bucket
 * - AWS_ACCESS_KEY_ID: AWS access key with S3 permissions
 * - AWS_SECRET_ACCESS_KEY: AWS secret key with S3 permissions
 * - S3_BUCKET: The S3 bucket name used for gallery storage
 * - CDN_DOMAIN: The domain of your CDN serving the images
 * 
 * Usage:
 * node scripts/test-gallery-end-to-end.js
 */

const { runEndToEndTest } = require('../tests/gallery/end-to-end-tests');
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
  const required = [
    'SESSION_COOKIE',
    'AWS_REGION',
    'ACCESS_KEY_ID',
    'SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'CDN_URL'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (!process.env.API_BASE_URL) {
    console.log('Note: API_BASE_URL not set, defaulting to http://localhost:3001');
  }
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(env => console.error(`  - ${env}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    
    // Provide helpful context about what each variable is for
    console.error('\nVariable descriptions:');
    console.error('  SESSION_COOKIE: A valid Firebase auth session token');
    console.error('  AWS_REGION: The AWS region of your S3 bucket (e.g., us-west-2)');
    console.error('  ACCESS_KEY_ID: AWS access key with S3 permissions');
    console.error('  SECRET_ACCESS_KEY: AWS secret key with S3 permissions');
    console.error('  S3_BUCKET_NAME: The S3 bucket name used for gallery storage');
    console.error('  CDN_URL: The domain of your CDN serving the images');
    
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('🧪 Gallery End-to-End Test Runner');
  console.log('--------------------------------');
  
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  try {
    const result = await runEndToEndTest();
    
    if (!result.success) {
      console.error('\n❌ End-to-End tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test runner encountered an error:', error);
    process.exit(1);
  }
}

// Run the main function
main();