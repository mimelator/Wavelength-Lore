#!/usr/bin/env node

/**
 * CloudFront Cache Invalidation Utility
 * Uses environment variables for AWS credentials
 */

const envHelper = require('./env-helper');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

// Load AWS resource configuration
const awsConfig = require('../config/aws-resources');

class CloudFrontCacheBuster {
  constructor() {
    this.distributionId = awsConfig.cloudFront.distributionId;
    this.cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
      }
    });
  }

  async invalidateCache(paths = ['/*']) {
    try {
      console.log('☁️  Creating CloudFront cache invalidation...');
      console.log(`📋 Distribution ID: ${this.distributionId}`);
      console.log(`🎯 Paths: ${paths.join(', ')}`);
      
      const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: `wavelength-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      });

      const response = await this.cloudFrontClient.send(command);
      
      console.log('✅ CloudFront cache invalidation created successfully!');
      console.log(`📋 Invalidation ID: ${response.Invalidation.Id}`);
      console.log(`⏰ Status: ${response.Invalidation.Status}`);
      console.log(`🔗 Distribution: ${this.distributionId}`);
      
      return response;
      
    } catch (error) {
      console.error('❌ Failed to create CloudFront cache invalidation:', error.message);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛠️  CloudFront Cache Invalidation Utility');
    console.log('');
    console.log('Usage: node cloudfront-cache-bust.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --paths <paths>     Comma-separated paths to invalidate (default: /*)');
    console.log('  --help, -h          Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node cloudfront-cache-bust.js                    # Invalidate all paths');
    console.log('  node cloudfront-cache-bust.js --paths "/,/static/*"  # Invalidate specific paths');
    console.log('');
    return;
  }
  
  // Parse paths
  let paths = ['/*'];
  const pathsIndex = args.indexOf('--paths');
  if (pathsIndex !== -1 && args[pathsIndex + 1]) {
    paths = args[pathsIndex + 1].split(',').map(p => p.trim());
  }
  
  try {
    // Validate environment first
    envHelper.validateEnvironment('aws');
    
    const cacheBuster = new CloudFrontCacheBuster();
    await cacheBuster.invalidateCache(paths);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CloudFrontCacheBuster;