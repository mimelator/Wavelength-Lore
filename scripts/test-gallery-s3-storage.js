#!/usr/bin/env node
/**
 * Gallery S3 Storage Test Runner
 * 
 * Script to run tests to verify the S3 storage functionality for gallery images.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Load test-specific variables from .env.test if available
const testEnvPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(testEnvPath)) {
  require('dotenv').config({ path: testEnvPath, override: true });
  console.log('Loaded test-specific environment from .env.test');
}

const tests = require('../tests/gallery/s3-storage-tests');

// Check for required environment variables
const requiredEnvVars = [
  'ACCESS_KEY_ID',
  'SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME',
  'CDN_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\nPlease set these variables in your .env file and try again.');
  process.exit(1);
}

// Run the tests
console.log('Running Gallery S3 Storage Tests...');
tests.runAllTests()
  .then(() => {
    console.log('✅ All tests completed successfully!');
  })
  .catch(error => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });