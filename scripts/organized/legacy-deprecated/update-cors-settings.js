#!/usr/bin/env node

/**
 * Update CORS Settings for S3 and CloudFront
 * Fixes the ERR_BLOCKED_BY_ORB issue in Chrome
 */

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, GetResponseHeadersPolicyCommand, UpdateResponseHeadersPolicyCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs');
const path = require('path');
const envHelper = require('./env-helper');

// Load AWS resource configuration
const awsConfig = require('../config/aws-resources');

async function updateS3BucketCors() {
  console.log('🪣 Updating S3 bucket CORS configuration...');
  
  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: awsConfig.aws.region,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || process.env.aws_wavelength_dev_access_key_id,
        secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.aws_wavelength_dev_secret_access_key
      }
    });
    
    // Get gallery bucket name
    const galleryBucket = process.env.GALLERY_S3_BUCKET || process.env.S3_BUCKET_NAME || awsConfig.s3.bucketName;
    
    console.log(`🪣 Target bucket: ${galleryBucket}`);
    
    // Load CORS configuration from file
    const corsConfig = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'aws-policies', 'gallery-bucket-cors.json')
      )
    );
    
    console.log('📋 CORS configuration:', JSON.stringify(corsConfig, null, 2));
    
    // Apply CORS configuration
    const command = new PutBucketCorsCommand({
      Bucket: galleryBucket,
      CORSConfiguration: corsConfig
    });
    
    await s3Client.send(command);
    
    console.log(`✅ Successfully updated CORS configuration for bucket: ${galleryBucket}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating S3 bucket CORS:', error.message);
    return false;
  }
}

async function updateCloudFrontHeadersPolicy() {
  console.log('☁️ Updating CloudFront response headers policy...');
  
  try {
    // Create CloudFront client
    const cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1', // CloudFront is global but API is in us-east-1
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || process.env.aws_wavelength_dev_access_key_id,
        secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.aws_wavelength_dev_secret_access_key
      }
    });
    
    // Load headers policy configuration from file
    const policyConfig = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', 'aws-policies', 'cloudfront-response-headers-policy.json')
      )
    );
    
    const policyId = process.env.CLOUDFRONT_HEADERS_POLICY_ID;
    
    if (!policyId) {
      console.warn('⚠️ No CLOUDFRONT_HEADERS_POLICY_ID found in environment variables.');
      console.log('ℹ️ Will attempt to create a new policy instead of updating existing one.');
      
      // Here we would need to create a new policy, but CloudFront doesn't directly support this
      // through the CloudFrontClient, so we'll need to provide instructions
      console.log('\n📋 To create a new policy:');
      console.log('1. Go to AWS Console → CloudFront → Policies → Response headers');
      console.log('2. Click "Create response headers policy"');
      console.log('3. Copy and paste the following policy configuration:');
      console.log(JSON.stringify(policyConfig, null, 2));
      console.log('\n4. After creating the policy, add its ID to your .env file:');
      console.log('   CLOUDFRONT_HEADERS_POLICY_ID=<your-policy-id>');
      
      return false;
    }
    
    console.log(`📋 Updating policy ID: ${policyId}`);
    
    // Get current policy to obtain ETag
    const getCommand = new GetResponseHeadersPolicyCommand({
      Id: policyId
    });
    
    const currentPolicy = await cloudFrontClient.send(getCommand);
    const etag = currentPolicy.ETag;
    
    // Update the policy
    const updateCommand = new UpdateResponseHeadersPolicyCommand({
      Id: policyId,
      ResponseHeadersPolicyConfig: policyConfig.ResponseHeadersPolicyConfig,
      IfMatch: etag
    });
    
    await cloudFrontClient.send(updateCommand);
    
    console.log(`✅ Successfully updated CloudFront response headers policy: ${policyId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating CloudFront headers policy:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛠️ CORS Settings Update Utility');
    console.log('');
    console.log('Usage: node update-cors-settings.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --s3-only           Update only S3 bucket CORS settings');
    console.log('  --cloudfront-only   Update only CloudFront headers policy');
    console.log('  --help, -h          Show this help message');
    console.log('');
    return;
  }
  
  try {
    // Validate environment first
    envHelper.validateEnvironment('aws');
    
    let s3Success = true;
    let cfSuccess = true;
    
    // Update S3 CORS if not cloudfront-only
    if (!args.includes('--cloudfront-only')) {
      s3Success = await updateS3BucketCors();
    }
    
    // Update CloudFront headers policy if not s3-only
    if (!args.includes('--s3-only')) {
      cfSuccess = await updateCloudFrontHeadersPolicy();
    }
    
    if (s3Success && cfSuccess) {
      console.log('\n✅ All CORS settings updated successfully!');
    } else {
      console.log('\n⚠️ Some updates were not successful. Please check the logs above.');
      
      // Give specific advice for fixing the ERR_BLOCKED_BY_ORB issue
      console.log('\n📋 To fix ERR_BLOCKED_BY_ORB errors:');
      console.log('1. Make sure your S3 bucket CORS settings include Crossorigin-Resource-Policy in ExposeHeaders');
      console.log('2. Update your CloudFront distribution to use a response headers policy that includes:');
      console.log('   - Crossorigin-Resource-Policy: cross-origin');
      console.log('   - Cross-Origin-Resource-Policy: cross-origin');
      console.log('   - Cross-Origin-Embedder-Policy: credentialless');
      console.log('   - Cross-Origin-Opener-Policy: same-origin');
      console.log('3. After updating, invalidate the CloudFront cache: node scripts/cloudfront-cache-bust.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  updateS3BucketCors,
  updateCloudFrontHeadersPolicy
};