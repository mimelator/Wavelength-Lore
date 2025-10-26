#!/usr/bin/env node

/**
 * CloudFront Cache Invalidation Utility
 * Uses environment variables for AWS credentials
 */

require('dotenv').config();
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

// Load AWS resource configuration with robust error handling
const { getAWSConfig } = require('./utils/aws-config-helper');
const awsConfig = getAWSConfig();

class CloudFrontCacheBuster {
  constructor(distributionType = 'primary') {
    // Set distribution ID based on type
    if (distributionType === 'gallery') {
      this.distributionId = process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID || 
                          awsConfig.cloudfront.galleryDistributionId;
      this.distributionName = 'Gallery';
    } else {
      this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || 
                          awsConfig.cloudfront.distributionId;
      this.distributionName = 'Primary';
    }
    
    this.cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.aws_wavelength_dev_access_key_id,
        secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
      }
    });
  }

  async invalidateCache(paths = ['/*']) {
    try {
      console.log('☁️  Creating CloudFront cache invalidation...');
      console.log(`📋 Distribution ID: ${this.distributionId}`);
      console.log(`🎯 Paths: ${paths.join(', ')}`);

      // Check if distribution ID is set
      if (!this.distributionId || this.distributionId === '') {
        throw new Error(
          'CLOUDFRONT_DISTRIBUTION_ID is not set in environment variables.\n' +
          '  Please add it to your .env file:\n' +
          '  CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC\n\n' +
          '  To find your distribution ID:\n' +
          '  1. Go to AWS Console → CloudFront\n' +
          '  2. Find distribution with domain: ' + awsConfig.cloudFront.distributionDomain + '\n' +
          '  3. Copy the ID (format: E1234567890ABC)\n' +
          '  4. Add to .env: CLOUDFRONT_DISTRIBUTION_ID=<your-id>\n\n' +
          '  Or skip CloudFront cache busting: ./bust-cache.sh --local'
        );
      }

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
    console.log('  --distribution <type>  Distribution to invalidate (primary|gallery, default: primary)');
    console.log('  --paths <paths>        Comma-separated paths to invalidate (default: /*)');
    console.log('  --fix-orb              First update CORS settings to fix ERR_BLOCKED_BY_ORB errors');
    console.log('  --help, -h             Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node cloudfront-cache-bust.js                           # Invalidate primary distribution');
    console.log('  node cloudfront-cache-bust.js --distribution gallery    # Invalidate gallery distribution');
    console.log('  node cloudfront-cache-bust.js --paths "/,/static/*"     # Invalidate specific paths');
    console.log('  node cloudfront-cache-bust.js --fix-orb                 # Fix ORB issues before invalidation');
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
    // Environment validation handled by aws-config-helper
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️  AWS credentials not found in environment variables');
      console.log('   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
    
    // Determine which distribution to use
    const distIndex = args.indexOf('--distribution');
    const distributionType = distIndex !== -1 && args[distIndex + 1] 
                            ? args[distIndex + 1] 
                            : 'primary';
    
    if (distributionType !== 'primary' && distributionType !== 'gallery') {
      console.log('⚠️ Invalid distribution type. Must be "primary" or "gallery".');
      console.log('Using "primary" distribution by default.');
      distributionType = 'primary';
    }
    
    console.log(`🔄 Using ${distributionType.toUpperCase()} CloudFront distribution`);
    
    // Check if we need to update CORS settings first (to fix ORB issues)
    if (args.includes('--fix-orb')) {
      console.log('🔧 Updating CORS settings to fix ERR_BLOCKED_BY_ORB issues...');
      try {
        const corsUpdater = require('./update-cors-settings');
        await corsUpdater.updateS3BucketCors();
        await corsUpdater.updateCloudFrontHeadersPolicy(distributionType);
        console.log('✅ CORS settings updated to fix ORB issues');
      } catch (corsError) {
        console.error('⚠️ Error updating CORS settings:', corsError.message);
        console.log('Continuing with cache invalidation...');
      }
    }
    
    const cacheBuster = new CloudFrontCacheBuster(distributionType);
    await cacheBuster.invalidateCache(paths);
    
    if (args.includes('--fix-orb')) {
      console.log('\n🔒 ORB Issue Fix Information:');
      console.log('If you\'re still seeing ERR_BLOCKED_BY_ORB errors after cache invalidation:');
      console.log('1. Make sure your browser cache is cleared');
      console.log('2. Check that your CloudFront distribution has the correct response headers policy');
      console.log('3. Verify that CORS headers are properly configured on the S3 bucket');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CloudFrontCacheBuster;