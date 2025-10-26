#!/usr/bin/env node
/**
 * AGENT_BETA: AWS User-to-Operation Mapping Analyzer
 * 
 * Analyzes which AWS credential pairs are used for which operations
 * to identify if we're using the wrong user or if expected user lost permissions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AGENT_BETA: AWS User-to-Operation Mapping Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Load environment to see what credential pairs exist
require('dotenv').config();

console.log('\n🔑 DETECTED CREDENTIAL PAIRS IN .env:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const credentialPairs = [
  {
    name: 'Standard AWS SDK Pattern',
    accessKey: 'AWS_ACCESS_KEY_ID',
    secretKey: 'AWS_SECRET_ACCESS_KEY',
    user: 'Unknown',
    purpose: 'GitHub Actions + AWS SDK default'
  },
  {
    name: 'App User Pattern',
    accessKey: 'ACCESS_KEY_ID', 
    secretKey: 'SECRET_ACCESS_KEY',
    user: 'wavelength-lore-app-user',
    purpose: 'Local development + S3 gallery operations'
  },
  {
    name: 'Dev User Pattern',
    accessKey: 'aws_wavelength_dev_access_key_id',
    secretKey: 'aws_wavelength_dev_secret_access_key', 
    user: 'wavelength-dev-user',
    purpose: 'Development deployments + admin operations'
  }
];

credentialPairs.forEach((pair, index) => {
  const hasAccessKey = !!process.env[pair.accessKey];
  const hasSecretKey = !!process.env[pair.secretKey];
  const isComplete = hasAccessKey && hasSecretKey;
  
  console.log(`\n${index + 1}. ${pair.name}:`);
  console.log(`   Access Key (${pair.accessKey}): ${hasAccessKey ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   Secret Key (${pair.secretKey}): ${hasSecretKey ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   Expected User: ${pair.user}`);
  console.log(`   Purpose: ${pair.purpose}`);
  console.log(`   Status: ${isComplete ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}`);
  
  if (hasAccessKey) {
    const keyPreview = '***[REDACTED]***';
    console.log(`   Key Preview: ${keyPreview}`);
    
    // Validate key format without exposing
    if (process.env[pair.accessKey].startsWith('AKIA')) {
      console.log(`   Format: ✅ Valid AWS access key format`);
    } else {
      console.log(`   Format: ❌ Invalid AWS access key format (should start with AKIA)`);
    }
  }
});

console.log('\n🎯 OPERATION-TO-CREDENTIAL MAPPING:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Analyze which operations use which credentials by scanning code
const operationMappings = [
  {
    operation: 'GitHub Actions ECR Push',
    file: '.github/workflows/docker-ecr-deploy.yml',
    expectedCredentials: 'AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY',
    expectedUser: 'github-actions-user or wavelength-lore-app-user',
    requiredPermissions: ['ecr:*', 'apprunner:*']
  },
  {
    operation: 'Local Gallery S3 Operations', 
    file: 'utils/gallery/config.js',
    expectedCredentials: 'ACCESS_KEY_ID + SECRET_ACCESS_KEY',
    expectedUser: 'wavelength-lore-app-user',
    requiredPermissions: ['s3:*']
  },
  {
    operation: 'App Runner Environment Updates',
    file: 'scripts/organized/aws-infrastructure/apprunner-env-updater.js',
    expectedCredentials: 'ACCESS_KEY_ID + SECRET_ACCESS_KEY',
    expectedUser: 'wavelength-lore-app-user',
    requiredPermissions: ['apprunner:DescribeService', 'apprunner:UpdateService']
  },
  {
    operation: 'Development Deployments',
    file: 'scripts/organized/aws-infrastructure/apprunner-force-deploy.js',
    expectedCredentials: 'aws_wavelength_dev_* (fallback to others)',
    expectedUser: 'wavelength-dev-user',
    requiredPermissions: ['apprunner:*', 'ecr:*']
  },
  {
    operation: 'CloudFront Operations',
    file: 'scripts/organized/aws-infrastructure/setup-cloudfront-credentials.js',
    expectedCredentials: 'Multiple patterns tested',
    expectedUser: 'admin-user or dev-user',
    requiredPermissions: ['cloudfront:*']
  }
];

operationMappings.forEach((mapping, index) => {
  console.log(`\n${index + 1}. ${mapping.operation}:`);
  console.log(`   📁 File: ${mapping.file}`);
  console.log(`   🔑 Expected Credentials: ${mapping.expectedCredentials}`);
  console.log(`   👤 Expected User: ${mapping.expectedUser}`);
  console.log(`   🛡️ Required Permissions: ${mapping.requiredPermissions.join(', ')}`);
});

console.log('\n🚨 CRITICAL GITHUB ACTIONS ANALYSIS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\nThe failing GitHub Actions workflow uses:');
console.log('🔍 Configure AWS credentials step:');
console.log('   aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}');
console.log('   aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}');
console.log('   aws-region: ${{ secrets.AWS_REGION }}');

console.log('\n🎯 INVESTIGATION QUESTIONS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Which AWS user does your GitHub secrets AWS_ACCESS_KEY_ID belong to?');
console.log('2. Does that user still exist and have active access keys?');
console.log('3. Does that user have the required ECR + App Runner permissions?');
console.log('4. Did you recently rotate/revoke any AWS access keys?');

console.log('\n💡 DIAGNOSTIC COMMANDS TO RUN:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('# Check which user owns the GitHub Actions credentials:');
console.log('aws sts get-caller-identity');
console.log('');
console.log('# Test ECR access:');
console.log('aws ecr describe-repositories --region us-east-1');
console.log('');
console.log('# Test App Runner access:');
console.log('aws apprunner describe-service --service-arn ***[REDACTED]***');

console.log('\n🌊 AGENT_BETA: Next step - Check your GitHub repository secrets');
console.log('   URL: https://github.com/mimelator/Wavelength-Lore/settings/secrets/actions');