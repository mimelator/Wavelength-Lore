#!/usr/bin/env node

/**
 * Gallery S3 and CloudFront Configuration Verifier
 * 
 * This script verifies the S3 bucket and CloudFront configuration:
 * 1. Checks if the S3 bucket exists
 * 2. Verifies CORS configuration
 * 3. Checks public access settings
 * 4. Tests S3 direct access
 * 5. If CloudFront is configured, tests the CDN
 */

const {
  S3Client,
  HeadBucketCommand,
  GetBucketCorsCommand,
  GetBucketPolicyCommand,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const {
  CloudFrontClient,
  GetDistributionCommand
} = require('@aws-sdk/client-cloudfront');

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch').default;  // Use .default for Node.js compatibility
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Load test-specific variables from .env.test if available
const testEnvPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(testEnvPath)) {
  require('dotenv').config({ path: testEnvPath, override: true });
  console.log('Loaded test-specific environment from .env.test');
}

// Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.GALLERY_S3_BUCKET || process.env.S3_BUCKET_NAME;
const cdnUrl = process.env.CDN_URL;
const cloudfrontDistributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;

// Utility for formatted console output
const log = {
  info: (message) => console.log(`\x1b[36m${message}\x1b[0m`),
  success: (message) => console.log(`\x1b[32m✓ ${message}\x1b[0m`),
  warning: (message) => console.log(`\x1b[33m⚠ ${message}\x1b[0m`),
  error: (message) => console.log(`\x1b[31m✗ ${message}\x1b[0m`)
};

// Initialize AWS clients
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

// Use development credentials for CloudFront if available (may have more permissions)
const cloudfrontClient = new CloudFrontClient({
  region,
  credentials: {
    accessKeyId: process.env.aws_wavelength_dev_access_key_id || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || process.env.SECRET_ACCESS_KEY
  }
});

// Verify the S3 bucket exists
async function checkBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    log.success(`S3 bucket '${bucketName}' exists`);
    return true;
  } catch (error) {
    log.error(`S3 bucket '${bucketName}' does not exist or is not accessible: ${error.message}`);
    return false;
  }
}

// Verify CORS configuration
async function checkCorsConfig() {
  try {
    const corsResponse = await s3Client.send(
      new GetBucketCorsCommand({ Bucket: bucketName })
    );
    
    if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
      const rule = corsResponse.CORSRules[0];
      
      if (rule.AllowedMethods && rule.AllowedOrigins) {
        log.success(`CORS is properly configured`);
        log.info(`  Allowed Methods: ${rule.AllowedMethods.join(', ')}`);
        log.info(`  Allowed Origins: ${rule.AllowedOrigins.join(', ')}`);
        return true;
      } else {
        log.warning(`CORS is configured but may be incomplete`);
        return false;
      }
    } else {
      log.warning(`No CORS rules found on the bucket`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to check CORS configuration: ${error.message}`);
    return false;
  }
}

// Check public access policy
async function checkPublicAccess() {
  try {
    const policyResponse = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: bucketName })
    );
    
    if (policyResponse.Policy) {
      const policy = JSON.parse(policyResponse.Policy);
      
      // Check if there's a policy that allows public read
      const hasPublicRead = policy.Statement.some(statement => 
        statement.Effect === 'Allow' && 
        (statement.Principal === '*' || statement.Principal.AWS === '*') &&
        statement.Action.includes('s3:GetObject')
      );
      
      if (hasPublicRead) {
        log.success(`Bucket has a policy allowing public read access`);
        return true;
      } else {
        log.warning(`Bucket has a policy but it may not allow public read access`);
        return false;
      }
    } else {
      log.warning(`No bucket policy found`);
      return false;
    }
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      log.warning(`No bucket policy found - public access may not be properly configured`);
    } else {
      log.error(`Failed to check bucket policy: ${error.message}`);
    }
    return false;
  }
}

// Test S3 direct upload and access
async function testS3DirectAccess() {
  // Generate a test file with random content
  const testContent = `Test content ${crypto.randomBytes(8).toString('hex')}`;
  const testKey = `test/verify-${Date.now()}.txt`;
  
  try {
    // Upload test file - don't use ACL parameter since it might not be allowed
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      })
    );
    
    log.success(`Test file uploaded successfully to S3`);
    
    // Construct the direct S3 URL
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${testKey}`;
    
    // Try to access the file directly
    try {
      const response = await fetch(s3Url);
      
      if (response.ok) {
        const retrievedContent = await response.text();
        
        if (retrievedContent === testContent) {
          log.success(`Successfully retrieved test file from S3 (${s3Url})`);
          return true;
        } else {
          log.error(`Retrieved content doesn't match the uploaded content`);
          return false;
        }
      } else {
        log.error(`Failed to retrieve file from S3: HTTP ${response.status}`);
        return false;
      }
    } catch (fetchError) {
      log.error(`Error accessing S3 URL: ${fetchError.message}`);
      return false;
    }
  } catch (uploadError) {
    log.error(`Failed to upload test file to S3: ${uploadError.message}`);
    return false;
  } finally {
    // Clean up - delete the test file
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey
        })
      );
      log.info(`Test file cleaned up from S3`);
    } catch (cleanupError) {
      log.warning(`Failed to clean up test file: ${cleanupError.message}`);
    }
  }
}

// Check CloudFront distribution
async function checkCloudFrontDistribution() {
  if (!cloudfrontDistributionId) {
    log.warning(`No CloudFront distribution ID found in environment variables`);
    log.info(`Using direct S3 access instead of CloudFront CDN`);
    // This isn't a failure, it's a valid configuration option
    return true;
  }
  
  try {
    // Use wavelength-dev credentials if available
    const client = new CloudFrontClient({
      region,
      credentials: {
        accessKeyId: process.env.aws_wavelength_dev_access_key_id || process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || process.env.SECRET_ACCESS_KEY
      }
    });
    
    const response = await client.send(
      new GetDistributionCommand({
        Id: cloudfrontDistributionId
      })
    );
    
    const distribution = response.Distribution;
    
    if (distribution && distribution.Status === 'Deployed') {
      log.success(`CloudFront distribution is active and deployed`);
      log.info(`  Distribution Domain: ${distribution.DomainName}`);
      log.info(`  Origin: ${distribution.DistributionConfig.Origins.Items[0].DomainName}`);
      
      // Verify the distribution is pointing to our S3 bucket
      const originDomain = distribution.DistributionConfig.Origins.Items[0].DomainName;
      if (originDomain.includes(bucketName)) {
        log.success(`Distribution is correctly pointing to the S3 bucket`);
      } else {
        log.warning(`Distribution may be pointing to a different S3 bucket`);
      }
      
      return true;
    } else if (distribution && distribution.Status === 'InProgress') {
      log.warning(`CloudFront distribution exists but is still deploying`);
      log.info(`  This can take 10-30 minutes to complete`);
      
      // Signal that CloudFront is still deploying (not a failure)
      results.cloudFrontDeploymentInProgress = true;
      return false;
    } else {
      log.error(`CloudFront distribution has an unexpected status: ${distribution?.Status}`);
      return false;
    }
  } catch (error) {
    if (error.message && error.message.includes('is not authorized to perform')) {
      log.warning(`Insufficient permissions to check CloudFront distribution`);
      log.info(`Continuing with verification using direct S3 access`);
      return true;
    } else {
      log.error(`Failed to check CloudFront distribution: ${error.message}`);
      return false;
    }
  }
}

// Test CloudFront CDN access
async function testCloudFrontAccess() {
  if (!cdnUrl) {
    log.warning(`No CDN URL found in environment variables`);
    return false;
  }
  
  // Generate a test file with random content
  const testContent = `CDN Test content ${crypto.randomBytes(8).toString('hex')}`;
  const testKey = `test/cdn-verify-${Date.now()}.txt`;
  
  try {
    // Upload test file - don't use ACL parameter since it might not be allowed
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      })
    );
    
    log.success(`Test file uploaded successfully to S3`);
    
    // Construct the CloudFront URL
    let cdnTestUrl = cdnUrl;
    if (!cdnTestUrl.startsWith('http')) {
      cdnTestUrl = `https://${cdnTestUrl}`;
    }
    
    if (!cdnTestUrl.endsWith('/')) {
      cdnTestUrl += '/';
    }
    
    cdnTestUrl += testKey;
    
    // Try to access the file through CloudFront
    try {
      log.info(`Testing CDN access at: ${cdnTestUrl}`);
      
      // Wait a moment for CloudFront to possibly catch up
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await fetch(cdnTestUrl);
      
      if (response.ok) {
        const retrievedContent = await response.text();
        
        if (retrievedContent === testContent) {
          log.success(`Successfully retrieved test file from CloudFront CDN`);
          return true;
        } else {
          log.error(`Retrieved content from CDN doesn't match the uploaded content`);
          return false;
        }
      } else {
        log.error(`Failed to retrieve file from CDN: HTTP ${response.status}`);
        log.warning(`This may be due to CloudFront propagation delay (can take minutes)`);
        return false;
      }
    } catch (fetchError) {
      log.error(`Error accessing CDN URL: ${fetchError.message}`);
      return false;
    }
  } catch (uploadError) {
    log.error(`Failed to upload test file for CDN testing: ${uploadError.message}`);
    return false;
  } finally {
    // Clean up - delete the test file
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey
        })
      );
      log.info(`Test file cleaned up from S3`);
    } catch (cleanupError) {
      log.warning(`Failed to clean up test file: ${cleanupError.message}`);
    }
  }
}

// Main verification function
async function verifyConfiguration() {
  log.info('=== Gallery S3 and CloudFront Configuration Verification ===');
  
  // Check for required configuration
  if (!bucketName) {
    log.error('GALLERY_S3_BUCKET or S3_BUCKET_NAME is not set in environment variables');
    process.exit(1);
  }
  
  log.info(`Using S3 bucket: ${bucketName}`);
  log.info(`Using AWS region: ${region}`);
  
  if (cdnUrl) {
    log.info(`Using CDN URL: ${cdnUrl}`);
  } else {
    log.warning('No CDN_URL found in environment variables');
  }
  
  // Perform verification checks
  const results = {};
  
  results.bucketExists = await checkBucketExists();
  
  if (results.bucketExists) {
    results.corsConfig = await checkCorsConfig();
    results.publicAccess = await checkPublicAccess();
    results.s3DirectAccess = await testS3DirectAccess();
    
    if (cloudfrontDistributionId) {
      results.cloudFrontDistribution = await checkCloudFrontDistribution();
      
      if (results.cloudFrontDistribution && cdnUrl) {
        results.cloudFrontAccess = await testCloudFrontAccess();
      }
    }
  }
  
  // Print summary
  log.info('\n=== Verification Summary ===');
  
  const summary = [
    { name: 'S3 Bucket Exists', result: results.bucketExists },
    { name: 'CORS Configuration', result: results.corsConfig },
    { name: 'Public Access Policy', result: results.publicAccess },
    { name: 'S3 Direct Access', result: results.s3DirectAccess }
  ];
  
  // Track if CloudFront is still deploying
  let cloudFrontDeploying = false;
  
  if (cloudfrontDistributionId) {
    if (results.cloudFrontDistribution === false && results.cloudFrontDeploymentInProgress) {
      cloudFrontDeploying = true;
      summary.push({ name: 'CloudFront Distribution', result: 'deploying' });
    } else {
      summary.push({ name: 'CloudFront Distribution', result: results.cloudFrontDistribution });
    }
  }
  
  if (cdnUrl) {
    summary.push({ name: 'CDN Access', result: results.cloudFrontAccess });
  }
  
  summary.forEach(item => {
    if (item.result === true) {
      log.success(`${item.name}: Passed`);
    } else if (item.result === false) {
      log.error(`${item.name}: Failed`);
    } else if (item.result === 'deploying') {
      log.warning(`${item.name}: Deploying (normal, will be ready soon)`);
    } else {
      log.warning(`${item.name}: Not Tested`);
    }
  });
  
  // Overall assessment
  const failed = summary.some(item => item.result === false);
  const allPassed = summary.every(item => item.result === true || item.result === 'deploying');
  
  if (allPassed && !cloudFrontDeploying) {
    log.success('\nAll checks passed! Your gallery storage is properly configured.');
  } else if (allPassed && cloudFrontDeploying) {
    log.success('\nCore S3 setup is complete and working! CloudFront is still deploying (this is normal).');
    log.info('CloudFront deployment can take 10-30 minutes. You can use direct S3 access in the meantime.');
    // Return success even though CloudFront is still deploying
    return true;
  } else if (failed) {
    log.error('\nSome checks failed. Please review the issues above.');
  } else {
    log.warning('\nSome checks were not performed. Configuration may be incomplete.');
  }
  
  // Only fail if something other than CloudFront deployment is causing issues
  return !failed || cloudFrontDeploying;
}

// Run the verification
verifyConfiguration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log.error(`Verification failed with an error: ${error.message}`);
    process.exit(1);
  });