#!/usr/bin/env node
/**
 * AGENT_BETA: SECURE AWS Credential Validator 
 * 
 * 🔒 SECURITY-FOCUSED: All sensitive data redacted
 * Tests credential validity without exposing keys, ARNs, or account details
 */

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { ECRClient, DescribeRepositoriesCommand } = require('@aws-sdk/client-ecr');
const { AppRunnerClient, ListServicesCommand } = require('@aws-sdk/client-apprunner');

require('dotenv').config();

console.log('🔒 AGENT_BETA: SECURE AWS Credential Validator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  ALL SENSITIVE DATA WILL BE REDACTED FOR SECURITY');

const credentialPairs = [
  {
    name: 'GitHub Actions Credentials',
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    purpose: 'GitHub Actions workflow (ECR + App Runner)'
  },
  {
    name: 'Local App User Credentials',
    accessKey: process.env.ACCESS_KEY_ID,
    secretKey: process.env.SECRET_ACCESS_KEY,
    purpose: 'Local scripts and S3 operations'
  },
  {
    name: 'Dev User Credentials',
    accessKey: process.env.aws_wavelength_dev_access_key_id,
    secretKey: process.env.aws_wavelength_dev_secret_access_key,
    purpose: 'Development deployments'
  }
];

async function secureCredentialTest(credentials) {
  console.log(`\n🧪 Testing: ${credentials.name}`);
  console.log(`   Purpose: ${credentials.purpose}`);
  
  if (!credentials.accessKey || !credentials.secretKey) {
    console.log('   ❌ Missing credentials - skipping');
    return { status: 'missing', reason: 'Credentials not set' };
  }

  try {
    // Test 1: Basic identity check (most important)
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey
      }
    });

    const identityCommand = new GetCallerIdentityCommand({});
    const identity = await stsClient.send(identityCommand);
    
    // Extract just the username safely
    const username = identity.Arn.split('/').pop();
    const isRootUser = identity.Arn.includes(':root');
    
    console.log(`   ✅ Identity: VALID`);
    console.log(`   👤 User Type: ${isRootUser ? 'ROOT (not recommended)' : 'IAM User'}`);
    console.log(`   👤 Username: ${username}`);
    console.log(`   🏢 Account: ***[REDACTED]***`);
    
    // Test 2: ECR permissions (critical for GitHub Actions)
    let ecrAccess = false;
    try {
      const ecrClient = new ECRClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKey,
          secretAccessKey: credentials.secretKey
        }
      });
      
      const ecrCommand = new DescribeRepositoriesCommand({});
      const ecrResult = await ecrClient.send(ecrCommand);
      ecrAccess = true;
      
      const repoCount = ecrResult.repositories?.length || 0;
      console.log(`   ✅ ECR Access: Can list ${repoCount} repositories`);
      
      // Check for wavelength-lore repo (without exposing details)
      const hasWavelengthRepo = ecrResult.repositories?.some(repo => 
        repo.repositoryName === 'wavelength-lore'
      );
      console.log(`   ${hasWavelengthRepo ? '✅' : '⚠️'} Wavelength ECR Repo: ${hasWavelengthRepo ? 'Found' : 'Not accessible'}`);
      
    } catch (ecrError) {
      console.log(`   ❌ ECR Access: DENIED (${ecrError.name})`);
    }
    
    // Test 3: App Runner permissions (critical for deployments)
    let appRunnerAccess = false;
    try {
      const appRunnerClient = new AppRunnerClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKey,
          secretAccessKey: credentials.secretKey
        }
      });
      
      // Use ListServices instead of DescribeService to avoid exposing ARN
      const listCommand = new ListServicesCommand({});
      const listResult = await appRunnerClient.send(listCommand);
      appRunnerAccess = true;
      
      const serviceCount = listResult.ServiceSummaryList?.length || 0;
      console.log(`   ✅ App Runner Access: Can list ${serviceCount} services`);
      
    } catch (appRunnerError) {
      console.log(`   ❌ App Runner Access: DENIED (${appRunnerError.name})`);
    }
    
    return {
      status: 'valid',
      username: username,
      isRoot: isRootUser,
      hasEcrAccess: ecrAccess,
      hasAppRunnerAccess: appRunnerAccess
    };
    
  } catch (error) {
    console.log(`   ❌ CREDENTIAL INVALID: ${error.name}`);
    
    // Provide helpful guidance without exposing details
    if (error.name === 'InvalidUserID.NotFound') {
      console.log(`   🚨 CRITICAL: Access key belongs to DELETED USER`);
      return { status: 'deleted_user', reason: 'User account was deleted' };
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log(`   🚨 CRITICAL: Secret key is INVALID (rotated/revoked)`);
      return { status: 'invalid_secret', reason: 'Secret key does not match' };
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log(`   🚨 CRITICAL: Access key is INVALID or REVOKED`);
      return { status: 'revoked_key', reason: 'Access key is invalid or revoked' };
    } else if (error.name === 'TokenRefreshRequired') {
      console.log(`   🚨 CRITICAL: Credentials EXPIRED`);
      return { status: 'expired', reason: 'Credentials have expired' };
    }
    
    return { status: 'error', reason: error.name };
  }
}

async function main() {
  console.log('\n🔍 Testing all credential pairs (all sensitive data redacted)...\n');
  
  const results = [];
  
  for (const credentials of credentialPairs) {
    const result = await secureCredentialTest(credentials);
    results.push({
      name: credentials.name,
      purpose: credentials.purpose,
      result
    });
    
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  console.log('\n📊 SECURE FINDINGS SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let githubActionsWorking = false;
  let hasWorkingCredentials = false;
  
  results.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}:`);
    
    if (test.result.status === 'valid') {
      console.log(`   ✅ Status: WORKING`);
      console.log(`   👤 User: ${test.result.username}`);
      console.log(`   🐳 ECR Access: ${test.result.hasEcrAccess ? 'YES' : 'NO'}`);
      console.log(`   🚀 App Runner Access: ${test.result.hasAppRunnerAccess ? 'YES' : 'NO'}`);
      
      if (test.name.includes('GitHub Actions')) {
        githubActionsWorking = test.result.hasEcrAccess && test.result.hasAppRunnerAccess;
      }
      hasWorkingCredentials = true;
      
    } else {
      console.log(`   ❌ Status: ${test.result.status.toUpperCase()}`);
      console.log(`   📝 Issue: ${test.result.reason}`);
    }
  });
  
  console.log('\n🎯 GITHUB ACTIONS DEPLOYMENT DIAGNOSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (githubActionsWorking) {
    console.log('✅ GitHub Actions credentials are working with required permissions');
    console.log('🔍 The deployment issue may be elsewhere (image mismatch logic)');
  } else {
    console.log('❌ GitHub Actions credentials are BROKEN or lack permissions');
    console.log('🎯 This explains the deployment verification failures!');
    
    if (hasWorkingCredentials) {
      console.log('💡 SOLUTION: Update GitHub secrets with working credentials');
      console.log('   Go to: https://github.com/mimelator/Wavelength-Lore/settings/secrets/actions');
    } else {
      console.log('💡 SOLUTION: Create new AWS access key with proper permissions');
    }
  }
  
  console.log('\n🔒 SECURITY: All sensitive data has been redacted in this report');
  console.log('🌊 AGENT_BETA: Secure credential analysis complete');
}

main().catch(console.error);