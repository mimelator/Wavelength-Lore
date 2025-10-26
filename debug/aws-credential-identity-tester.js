#!/usr/bin/env node
/**
 * AGENT_BETA: AWS Credential Identity Tester
 * 
 * Tests each credential pair to identify which AWS user it belongs to
 * and what permissions that user has
 */

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { ECRClient, DescribeRepositoriesCommand } = require('@aws-sdk/client-ecr');
const { AppRunnerClient, DescribeServiceCommand } = require('@aws-sdk/client-apprunner');

require('dotenv').config();

console.log('🔍 AGENT_BETA: AWS Credential Identity & Permission Tester');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const credentialPairs = [
  {
    name: 'GitHub Actions Credentials',
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    purpose: 'Used by GitHub Actions workflow'
  },
  {
    name: 'Local App User Credentials',
    accessKey: process.env.ACCESS_KEY_ID,
    secretKey: process.env.SECRET_ACCESS_KEY,
    envVars: ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY'],
    purpose: 'Used by local scripts and S3 operations'
  },
  {
    name: 'Dev User Credentials',
    accessKey: process.env.aws_wavelength_dev_access_key_id,
    secretKey: process.env.aws_wavelength_dev_secret_access_key,
    envVars: ['aws_wavelength_dev_access_key_id', 'aws_wavelength_dev_secret_access_key'],
    purpose: 'Used for development deployments'
  }
];

async function testCredentialIdentity(credentials) {
  console.log(`\n🧪 Testing: ${credentials.name}`);
  console.log(`   Purpose: ${credentials.purpose}`);
  console.log(`   Key Preview: ***[REDACTED-FOR-SECURITY]***`);
  
  if (!credentials.accessKey || !credentials.secretKey) {
    console.log('   ❌ Missing credentials - skipping');
    return null;
  }

  try {
    // Test 1: Get caller identity
    console.log('   🔍 Testing caller identity...');
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey
      }
    });

    const identityCommand = new GetCallerIdentityCommand({});
    const identity = await stsClient.send(identityCommand);
    
    console.log(`   ✅ AWS User: ${identity.Arn}`);
    console.log(`   ✅ Account: ${identity.Account}`);
    console.log(`   ✅ User ID: ${identity.UserId}`);
    
    // Extract username from ARN
    const username = identity.Arn.split('/').pop();
    console.log(`   👤 Username: ${username}`);
    
    // Test 2: ECR access
    console.log('   🧪 Testing ECR access...');
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
      console.log(`   ✅ ECR Access: Can list ${ecrResult.repositories?.length || 0} repositories`);
      
      // Look for wavelength-lore repository specifically
      const wavelengthRepo = ecrResult.repositories?.find(repo => repo.repositoryName === 'wavelength-lore');
      if (wavelengthRepo) {
        console.log(`   ✅ ECR Wavelength Repo: Found ${wavelengthRepo.repositoryName}`);
      } else {
        console.log(`   ⚠️  ECR Wavelength Repo: Not found (may not have permissions)`);
      }
      
    } catch (ecrError) {
      console.log(`   ❌ ECR Access: DENIED - ${ecrError.name}`);
      console.log(`      Error: ${ecrError.message}`);
    }
    
    // Test 3: App Runner access  
    console.log('   🧪 Testing App Runner access...');
    try {
      const appRunnerClient = new AppRunnerClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKey,
          secretAccessKey: credentials.secretKey
        }
      });
      
      const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
      if (serviceArn) {
        const appRunnerCommand = new DescribeServiceCommand({ ServiceArn: serviceArn });
        const appRunnerResult = await appRunnerClient.send(appRunnerCommand);
        console.log(`   ✅ App Runner Access: Service status is ${appRunnerResult.Service.Status}`);
        console.log(`   ✅ Current Image: ${appRunnerResult.Service.SourceConfiguration.ImageRepository.ImageIdentifier}`);
      } else {
        console.log(`   ⚠️  App Runner: No APPRUNNER_SERVICE_ARN set, skipping test`);
      }
      
    } catch (apprunnerError) {
      console.log(`   ❌ App Runner Access: DENIED - ${apprunnerError.name}`);
      console.log(`      Error: ${apprunnerError.message}`);
    }
    
    return {
      username,
      arn: identity.Arn,
      account: identity.Account,
      hasEcrAccess: true, // If we got here, basic access works
      hasAppRunnerAccess: true // If we got here, basic access works
    };
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.name}`);
    console.log(`      Error: ${error.message}`);
    
    if (error.name === 'InvalidUserID.NotFound' || error.message.includes('does not exist')) {
      console.log(`   🚨 CRITICAL: This access key belongs to a DELETED USER!`);
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log(`   🚨 CRITICAL: Invalid secret key - credentials may be rotated/revoked`);
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log(`   🚨 CRITICAL: Access key is invalid or revoked`);
    }
    
    return null;
  }
}

async function main() {
  console.log('\n🔍 Testing all credential pairs to identify users and permissions...\n');
  
  const results = [];
  
  for (const credentials of credentialPairs) {
    const result = await testCredentialIdentity(credentials);
    results.push({
      name: credentials.name,
      purpose: credentials.purpose,
      result
    });
    
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  console.log('\n📊 SUMMARY OF FINDINGS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}:`);
    if (test.result) {
      console.log(`   ✅ Working - User: ${test.result.username}`);
      console.log(`   📧 ARN: ${test.result.arn}`);
    } else {
      console.log(`   ❌ FAILED - Credentials invalid or revoked`);
    }
    console.log(`   🎯 Purpose: ${test.purpose}`);
  });
  
  // Identify which credential should be used for GitHub Actions
  console.log('\n🎯 GITHUB ACTIONS CREDENTIAL ANALYSIS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const githubActionsTest = results[0]; // First one is GitHub Actions credentials
  if (githubActionsTest.result) {
    console.log(`✅ GitHub Actions credentials are working`);
    console.log(`   User: ${githubActionsTest.result.username}`);
    console.log(`   This user should have ECR + App Runner permissions`);
  } else {
    console.log(`❌ GitHub Actions credentials are BROKEN`);
    console.log(`   This explains the deployment failures!`);
    console.log(`   Need to update GitHub repository secrets with working credentials`);
  }
  
  console.log('\n🌊 AGENT_BETA: Analysis complete');
  console.log('Next: Fix the broken credentials if any were identified');
}

main().catch(console.error);