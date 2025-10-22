/**
 * Temporary fix for running gallery tests
 * This script applies the session token directly and runs the end-to-end test
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const { runEndToEndTest } = require('../tests/gallery/end-to-end-tests');

// Verify we have the session token and all required values
const sessionToken = process.env.SESSION_COOKIE;
const s3Bucket = process.env.S3_BUCKET_NAME;
const cdnUrl = process.env.CDN_URL;

console.log('=== Gallery Test Direct Runner ===');
console.log('Checking configuration:');
console.log('- Session token exists:', !!sessionToken);
console.log('- S3 bucket name:', s3Bucket);
console.log('- CDN URL:', cdnUrl);

if (!sessionToken) {
  console.error('❌ ERROR: No session token found in environment!');
  process.exit(1);
}

if (!s3Bucket) {
  console.error('❌ ERROR: No S3 bucket name found!');
  process.exit(1);
}

if (!cdnUrl) {
  console.error('❌ ERROR: No CDN URL found!');
  process.exit(1);
}

console.log('\nStarting end-to-end test with direct parameters...\n');

// Force set the variables in the module's scope
const testModule = require('../tests/gallery/end-to-end-tests');
testModule.SESSION_COOKIE = sessionToken;
testModule.S3_BUCKET = s3Bucket;
testModule.CDN_DOMAIN = cdnUrl;

// Run the test
runEndToEndTest()
  .then(result => {
    if (!result.success) {
      console.error('❌ End-to-end test failed!');
      process.exit(1);
    } else {
      console.log('✅ End-to-end test succeeded!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Error running test:', error);
    process.exit(1);
  });