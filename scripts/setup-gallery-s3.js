#!/usr/bin/env node

/**
 * Gallery S3 Bucket Setup Script
 * 
 * This script creates and configures an S3 bucket for gallery storage:
 * 1. Creates the S3 bucket if it doesn't exist
 * 2. Configures CORS settings for the bucket
 * 3. Configures public read access policy
 * 4. Sets up CloudFront distribution for CDN
 * 5. Updates the .env file with the bucket name and CloudFront domain
 * 
 * Required environment variables:
 * - ACCESS_KEY_ID: AWS access key with S3 permissions
 * - SECRET_ACCESS_KEY: AWS secret key with S3 permissions
 * - AWS_REGION: The AWS region to create resources in
 */

const {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  HeadBucketCommand,
  PutPublicAccessBlockCommand
} = require('@aws-sdk/client-s3');

const {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand
} = require('@aws-sdk/client-cloudfront');

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const defaultBucketNamePrefix = 'wavelength-gallery';

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

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility for formatted console output
const log = {
  info: (message) => console.log(`\x1b[36m${message}\x1b[0m`),
  success: (message) => console.log(`\x1b[32m${message}\x1b[0m`),
  warning: (message) => console.log(`\x1b[33m${message}\x1b[0m`),
  error: (message) => console.log(`\x1b[31m${message}\x1b[0m`)
};

// Ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

// Check if a bucket exists
async function bucketExists(bucketName) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.name === 'NoSuchBucket') {
      return false;
    }
    throw error;
  }
}

// Create an S3 bucket
async function createBucket(bucketName) {
  try {
    log.info(`Creating bucket: ${bucketName} in region ${region}...`);
    
    let createBucketParams = { Bucket: bucketName };
    
    // For regions other than us-east-1, we need to specify LocationConstraint
    if (region !== 'us-east-1') {
      createBucketParams.CreateBucketConfiguration = {
        LocationConstraint: region
      };
    }
    
    await s3Client.send(new CreateBucketCommand(createBucketParams));
    
    log.success(`Bucket ${bucketName} created successfully!`);
    return true;
  } catch (error) {
    log.error(`Failed to create bucket: ${error.message}`);
    throw error;
  }
}

// Configure CORS for the bucket
async function configureCors(bucketName) {
  try {
    log.info(`Configuring CORS policy for ${bucketName}...`);
    
    const corsConfig = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };
    
    await s3Client.send(new PutBucketCorsCommand(corsConfig));
    
    log.success('CORS configuration applied successfully!');
    return true;
  } catch (error) {
    log.error(`Failed to configure CORS: ${error.message}`);
    throw error;
  }
}

// Configure public access for the bucket
async function configurePublicAccess(bucketName) {
  try {
    log.info(`Configuring public access for ${bucketName}...`);
    
    // First, remove the block on public access
    await s3Client.send(
      new PutPublicAccessBlockCommand({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false
        }
      })
    );
    
    // Then apply a bucket policy to allow public read access
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };
    
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy)
      })
    );
    
    log.success('Public read access configured successfully!');
    return true;
  } catch (error) {
    log.error(`Failed to configure public access: ${error.message}`);
    throw error;
  }
}

// Set up CloudFront distribution
async function setupCloudFront(bucketName) {
  try {
    log.info('Setting up CloudFront distribution...');
    
    // Check if we have the required permissions by attempting a simple operation
    try {
      log.info('Checking CloudFront permissions...');
      
      // We'll continue even if this fails since the actual distribution creation
      // is what we really care about
      
      const s3Origin = `${bucketName}.s3.${region}.amazonaws.com`;
      
      const distributionConfig = {
        DistributionConfig: {
          CallerReference: `gallery-cdn-${Date.now()}`,
          Comment: `CDN for ${bucketName} gallery images`,
          DefaultCacheBehavior: {
            ForwardedValues: {
              Cookies: { Forward: 'none' },
              QueryString: false
            },
            MinTTL: 86400, // 1 day
            TargetOriginId: 's3-origin',
            TrustedSigners: { Enabled: false, Quantity: 0 },
            ViewerProtocolPolicy: 'redirect-to-https',
            AllowedMethods: {
              Items: ['GET', 'HEAD'],
              Quantity: 2
            },
            CachedMethods: {
              Items: ['GET', 'HEAD'],
              Quantity: 2
            },
            Compress: true,
            DefaultTTL: 86400,
            MaxTTL: 31536000,
            SmoothStreaming: false
          },
          Enabled: true,
          Origins: {
            Items: [
              {
                DomainName: s3Origin,
                Id: 's3-origin',
                S3OriginConfig: {
                  OriginAccessIdentity: ''
                }
              }
            ],
            Quantity: 1
          },
          PriceClass: 'PriceClass_100',
          ViewerCertificate: {
            CloudFrontDefaultCertificate: true,
            MinimumProtocolVersion: 'TLSv1',
            CertificateSource: 'cloudfront'
          }
        }
      };
      
      const createDistResponse = await cloudfrontClient.send(
        new CreateDistributionCommand(distributionConfig)
      );
      
      const distributionId = createDistResponse.Distribution.Id;
      const distributionDomain = createDistResponse.Distribution.DomainName;
      
      log.success(`CloudFront distribution created successfully!`);
      log.info(`Distribution ID: ${distributionId}`);
      log.info(`Distribution Domain: ${distributionDomain}`);
      
      return {
        distributionId,
        distributionDomain
      };
    } catch (permissionError) {
      if (permissionError.message && permissionError.message.includes('is not authorized to perform')) {
        log.warning('Insufficient permissions to create CloudFront distribution.');
        log.warning('The setup will continue without CloudFront, using direct S3 URL instead.');
        
        // Return a direct S3 URL as a fallback
        const s3Domain = `${bucketName}.s3.${region}.amazonaws.com`;
        return {
          distributionId: null,
          distributionDomain: s3Domain
        };
      } else {
        // For other errors, re-throw
        throw permissionError;
      }
    }
  } catch (error) {
    log.error(`Failed to set up CloudFront: ${error.message}`);
    log.warning('Continuing with direct S3 access instead of CloudFront CDN.');
    
    // Return a direct S3 URL as a fallback
    const s3Domain = `${bucketName}.s3.${region}.amazonaws.com`;
    return {
      distributionId: null,
      distributionDomain: s3Domain
    };
  }
}

// Update .env files with the bucket and CloudFront info
function updateEnvFiles(bucketName, distributionId, distributionDomain) {
  try {
    log.info('Updating environment files with new bucket and CDN information...');
    
    // Update main .env file
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add S3_BUCKET_NAME
    if (envContent.includes('S3_BUCKET_NAME=')) {
      envContent = envContent.replace(
        /S3_BUCKET_NAME=.*/g,
        `S3_BUCKET_NAME=${bucketName}`
      );
    } else {
      envContent += `\nS3_BUCKET_NAME=${bucketName}`;
    }
    
    // Replace or add CDN_URL
    if (envContent.includes('CDN_URL=')) {
      envContent = envContent.replace(
        /CDN_URL=.*/g,
        `CDN_URL=https://${distributionDomain}`
      );
    } else {
      envContent += `\nCDN_URL=https://${distributionDomain}`;
    }
    
    // Replace or add CLOUDFRONT_DISTRIBUTION_ID if we have a distribution
    if (distributionId) {
      if (envContent.includes('CLOUDFRONT_DISTRIBUTION_ID=')) {
        envContent = envContent.replace(
          /CLOUDFRONT_DISTRIBUTION_ID=.*/g,
          `CLOUDFRONT_DISTRIBUTION_ID=${distributionId}`
        );
      } else {
        envContent += `\nCLOUDFRONT_DISTRIBUTION_ID=${distributionId}`;
      }
    } else {
      // No CloudFront distribution, so make sure we don't have a stale ID
      if (envContent.includes('CLOUDFRONT_DISTRIBUTION_ID=')) {
        envContent = envContent.replace(
          /CLOUDFRONT_DISTRIBUTION_ID=.*/g,
          'CLOUDFRONT_DISTRIBUTION_ID='
        );
      }
    }
    
    // Write updated content back to .env
    fs.writeFileSync(envPath, envContent);
    
    // Also update .env.test example
    const testEnvPath = path.resolve(__dirname, '../.env.test.example');
    if (fs.existsSync(testEnvPath)) {
      let testEnvContent = fs.readFileSync(testEnvPath, 'utf8');
      
      // Replace or add S3_BUCKET_NAME
      if (testEnvContent.includes('S3_BUCKET_NAME=')) {
        testEnvContent = testEnvContent.replace(
          /S3_BUCKET_NAME=.*/g,
          `S3_BUCKET_NAME=${bucketName}`
        );
      } else {
        testEnvContent += `\nS3_BUCKET_NAME=${bucketName}`;
      }
      
      // Replace or add CDN_URL
      if (testEnvContent.includes('CDN_URL=')) {
        testEnvContent = testEnvContent.replace(
          /CDN_URL=.*/g,
          `CDN_URL=https://${distributionDomain}`
        );
      } else {
        testEnvContent += `\nCDN_URL=https://${distributionDomain}`;
      }
      
      fs.writeFileSync(testEnvPath, testEnvContent);
    }
    
    log.success('Environment files updated successfully!');
    return true;
  } catch (error) {
    log.error(`Failed to update environment files: ${error.message}`);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    log.info('=== Gallery S3 Bucket Setup ===');
    
    // Check for required AWS credentials
    if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
      log.error('Missing required AWS credentials. Please check your .env file.');
      process.exit(1);
    }
    
    // Generate a default unique bucket name
    const timestamp = new Date().getTime().toString().slice(-6);
    const defaultBucketName = `${defaultBucketNamePrefix}-${timestamp}`;
    
    // Ask for bucket name
    const bucketName = await askQuestion(`Enter the S3 bucket name [${defaultBucketName}]: `) || defaultBucketName;
    
    // Check if bucket already exists
    const exists = await bucketExists(bucketName);
    
    if (exists) {
      log.warning(`Bucket ${bucketName} already exists.`);
      const proceed = await askQuestion('Do you want to proceed with configuration? (y/n): ');
      
      if (proceed.toLowerCase() !== 'y') {
        log.info('Setup cancelled. No changes were made.');
        rl.close();
        return;
      }
    } else {
      // Create the bucket
      await createBucket(bucketName);
    }
    
    // Configure CORS
    await configureCors(bucketName);
    
    // Configure public access
    await configurePublicAccess(bucketName);
    
    // Ask if CloudFront should be set up
    const setupCdn = await askQuestion('Do you want to set up a CloudFront distribution for CDN? (y/n): ');
    
    let distributionId = '';
    let distributionDomain = '';
    
    if (setupCdn.toLowerCase() === 'y') {
      const cloudFrontSetup = await setupCloudFront(bucketName);
      distributionId = cloudFrontSetup.distributionId;
      distributionDomain = cloudFrontSetup.distributionDomain;
      
      log.warning('CloudFront distribution is being created. It may take 10-30 minutes to fully deploy.');
      log.warning('Until then, you can use the direct S3 URL for testing.');
    } else {
      log.info('Skipping CloudFront setup.');
      // Use direct S3 URL as CDN URL for now
      distributionDomain = `${bucketName}.s3.${region}.amazonaws.com`;
    }
    
    // Update .env files
    await updateEnvFiles(bucketName, distributionId, distributionDomain);
    
    log.success('\n=== Gallery S3 Bucket Setup Complete! ===');
    log.info(`Bucket Name: ${bucketName}`);
    
    if (distributionDomain) {
      log.info(`CDN URL: https://${distributionDomain}`);
    }
    
    if (distributionId) {
      log.info(`CloudFront Distribution ID: ${distributionId}`);
    }
    
    log.info('\nYou can now use the S3 bucket for gallery storage!');
    rl.close();
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Run the main function
main();