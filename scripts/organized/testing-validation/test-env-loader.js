#!/usr/bin/env node

/**
 * Test script to verify env-loader works from any directory
 */

const { initScriptEnv, getEnvVar } = require('./utils/env-loader');

console.log('🧪 Testing env-loader from different script locations...\n');

// Test basic initialization
try {
  initScriptEnv(['CDN_URL']);
  
  console.log('\n🎯 Testing environment variable access:');
  console.log(`  CDN_URL: ${getEnvVar('CDN_URL', 'not found')}`);
  console.log(`  PROJECT_ID: ${getEnvVar('PROJECT_ID', 'not found')}`);
  console.log(`  DATABASE_URL: ${getEnvVar('DATABASE_URL') ? 'configured' : 'not found'}`);
  
  console.log('\n✅ env-loader test completed successfully!');
  
} catch (error) {
  console.error('❌ env-loader test failed:', error.message);
  process.exit(1);
}