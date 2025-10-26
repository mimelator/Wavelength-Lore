#!/usr/bin/env node
/**
 * AGENT_BETA: Basic AWS Credential Security Analysis
 * 
 * 🔒 SECURITY-FOCUSED: All sensitive data redacted
 * Analyzes credential patterns without making AWS API calls
 */

require('dotenv').config();

console.log('🔒 AGENT_BETA: AWS Credential Security Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  ALL SENSITIVE DATA REDACTED FOR SECURITY');

const credentialPairs = [
  {
    name: 'GitHub Actions Credentials',
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    purpose: 'Used by GitHub Actions workflow for ECR + App Runner',
    critical: true
  },
  {
    name: 'Local App User Credentials',
    accessKey: process.env.ACCESS_KEY_ID,
    secretKey: process.env.SECRET_ACCESS_KEY,
    purpose: 'Used by local scripts and S3 operations',
    critical: false
  },
  {
    name: 'Dev User Credentials',
    accessKey: process.env.aws_wavelength_dev_access_key_id,
    secretKey: process.env.aws_wavelength_dev_secret_access_key,
    purpose: 'Used for development deployments',
    critical: false
  }
];

function analyzeCredentialPair(pair) {
  console.log(`\n🔍 Analyzing: ${pair.name}`);
  console.log(`   Purpose: ${pair.purpose}`);
  console.log(`   Critical for GitHub Actions: ${pair.critical ? 'YES' : 'NO'}`);
  
  const hasAccessKey = !!pair.accessKey;
  const hasSecretKey = !!pair.secretKey;
  
  console.log(`   Access Key Present: ${hasAccessKey ? '✅ YES' : '❌ NO'}`);
  console.log(`   Secret Key Present: ${hasSecretKey ? '✅ YES' : '❌ NO'}`);
  
  if (!hasAccessKey || !hasSecretKey) {
    console.log(`   Status: ❌ INCOMPLETE - Missing credentials`);
    return { status: 'incomplete', hasCredentials: false };
  }
  
  // Validate format without exposing actual keys
  const validAccessKeyFormat = pair.accessKey.startsWith('AKIA') && pair.accessKey.length === 20;
  const validSecretKeyFormat = pair.secretKey.length === 40;
  
  console.log(`   Access Key Format: ${validAccessKeyFormat ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Secret Key Format: ${validSecretKeyFormat ? '✅ Valid' : '❌ Invalid'}`);
  
  // Check if all three pairs use the same access key (indicating one user for everything)
  const keyPrefix = pair.accessKey.substring(0, 8);
  console.log(`   Key Pattern: ***[REDACTED]***`);
  
  if (validAccessKeyFormat && validSecretKeyFormat) {
    console.log(`   Status: ✅ FORMAT VALID (need to test permissions)`);
    return { status: 'format_valid', hasCredentials: true, keyPrefix };
  } else {
    console.log(`   Status: ❌ INVALID FORMAT`);
    return { status: 'invalid_format', hasCredentials: false };
  }
}

function main() {
  console.log('\n🔍 Analyzing credential patterns (no API calls, all data redacted)...\n');
  
  const results = [];
  const keyPrefixes = new Set();
  
  credentialPairs.forEach(pair => {
    const result = analyzeCredentialPair(pair);
    results.push({
      name: pair.name,
      critical: pair.critical,
      result
    });
    
    if (result.keyPrefix) {
      keyPrefixes.add(result.keyPrefix);
    }
    
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
  
  console.log('\n📊 SECURITY ANALYSIS SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const githubActionsResult = results.find(r => r.critical);
  const workingCredentials = results.filter(r => r.result.status === 'format_valid');
  
  console.log(`\n🎯 GITHUB ACTIONS CREDENTIAL STATUS:`);
  if (githubActionsResult && githubActionsResult.result.hasCredentials) {
    if (githubActionsResult.result.status === 'format_valid') {
      console.log('✅ GitHub Actions credentials are present and properly formatted');
      console.log('🔍 Need to test actual AWS permissions to confirm they work');
    } else {
      console.log('❌ GitHub Actions credentials have invalid format');
    }
  } else {
    console.log('❌ GitHub Actions credentials are missing');
  }
  
  console.log(`\n🔑 CREDENTIAL DIVERSITY ANALYSIS:`);
  console.log(`   Total unique key patterns: ${keyPrefixes.size}`);
  
  if (keyPrefixes.size === 1) {
    console.log('   ⚠️  All credentials appear to be from the same AWS user');
    console.log('   💡 This could be the issue - all eggs in one basket');
    console.log('   🎯 If this user was deleted/revoked, ALL operations would fail');
  } else if (keyPrefixes.size === 3) {
    console.log('   ✅ Each credential pair appears to be from different AWS users');
    console.log('   🎯 Failure likely isolated to specific user permissions');
  } else {
    console.log('   🔍 Mixed credential pattern - some may be duplicates');
  }
  
  console.log(`\n💡 NEXT STEPS:`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (githubActionsResult?.result.status === 'format_valid') {
    console.log('1. 🧪 Test GitHub Actions credentials with actual AWS API calls');
    console.log('2. 🔍 Verify ECR and App Runner permissions specifically');
    console.log('3. 🔑 Check if the AWS user still exists and is active');
  } else {
    console.log('1. 🚨 URGENT: Fix GitHub Actions credentials in repository secrets');
    console.log('2. 🔑 Generate new AWS access key with proper permissions');
    console.log('3. 🔄 Update GitHub repository secrets with working credentials');
  }
  
  console.log('\n🔒 SECURITY: No actual credentials or account details exposed');
  console.log('🌊 AGENT_BETA: Basic credential analysis complete');
  console.log('\nRECOMMENDATION: Run AWS CLI commands manually to test credentials');
  console.log('aws sts get-caller-identity  # Test basic authentication');
  console.log('aws ecr describe-repositories --region us-east-1  # Test ECR access');
}

main();