#!/usr/bin/env node

/**
 * Apply ORB Fix Script
 * This script applies the necessary headers to your CloudFront distribution to fix ERR_BLOCKED_BY_ORB errors
 * No need to create new policies - this updates your existing distributions directly
 */

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Default headers to fix ORB issues
const ORB_FIX_HEADERS = [
  { key: 'Crossorigin-Resource-Policy', value: 'cross-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }, 
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
];

// CORS headers to ensure are present
const CORS_HEADERS = [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Content-Length, X-Requested-With' }
];

async function applyOrbFix() {
  console.log('🔧 Applying ORB Fix to CloudFront Distribution...');

  try {
    // Get credentials from .env file
    const accessKeyId = process.env.ACCESS_KEY_ID || process.env.aws_wavelength_dev_access_key_id;
    const secretAccessKey = process.env.SECRET_ACCESS_KEY || process.env.aws_wavelength_dev_secret_access_key;
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }
    
    // Create CloudFront client
    const cloudfront = new CloudFrontClient({
      region: 'us-east-1', // CloudFront is always us-east-1
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Get distribution ID from environment or aws-resources.js
    let distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    if (!distributionId) {
      try {
        const awsConfig = require('../config/aws-resources');
        distributionId = awsConfig.cloudFront.distributionId;
      } catch (error) {
        console.log('Could not load distribution ID from aws-resources.js');
      }
    }

    if (!distributionId) {
      // Ask for distribution ID if not found
      distributionId = await promptForDistributionId();
      if (!distributionId) {
        throw new Error('CloudFront Distribution ID is required');
      }
    }

    console.log(`📋 Using CloudFront Distribution ID: ${distributionId}`);

    // Get the current distribution configuration
    const { DistributionConfig, ETag } = await cloudfront.send(
      new GetDistributionConfigCommand({ Id: distributionId })
    );
    
    console.log('✅ Successfully retrieved distribution configuration');
    
    // Check and update origin response headers for each origin
    let modified = false;
    
    for (const origin of DistributionConfig.Origins.Items) {
      console.log(`🔍 Checking origin: ${origin.Id}`);

      // Create or update custom origin response headers
      if (!origin.CustomHeaders) {
        origin.CustomHeaders = { Quantity: 0, Items: [] };
      }
      
      if (!origin.CustomHeaders.Items) {
        origin.CustomHeaders.Items = [];
      }
      
      // Add missing ORB fix headers
      for (const header of ORB_FIX_HEADERS) {
        const existingHeader = origin.CustomHeaders.Items.find(h => h.HeaderName === header.key);
        
        if (!existingHeader) {
          console.log(`➕ Adding ${header.key} header to origin ${origin.Id}`);
          origin.CustomHeaders.Items.push({
            HeaderName: header.key,
            HeaderValue: header.value
          });
          modified = true;
        } else if (existingHeader.HeaderValue !== header.value) {
          console.log(`🔄 Updating ${header.key} header value to "${header.value}"`);
          existingHeader.HeaderValue = header.value;
          modified = true;
        }
      }
      
      // Add missing CORS headers
      for (const header of CORS_HEADERS) {
        const existingHeader = origin.CustomHeaders.Items.find(h => h.HeaderName === header.key);
        
        if (!existingHeader) {
          console.log(`➕ Adding ${header.key} header to origin ${origin.Id}`);
          origin.CustomHeaders.Items.push({
            HeaderName: header.key,
            HeaderValue: header.value
          });
          modified = true;
        }
      }
      
      // Update quantity
      origin.CustomHeaders.Quantity = origin.CustomHeaders.Items.length;
    }

    // Check default cache behavior
    if (DistributionConfig.DefaultCacheBehavior) {
      const behavior = DistributionConfig.DefaultCacheBehavior;
      
      // Ensure default behavior forwards all headers
      if (!behavior.ForwardedValues) {
        behavior.ForwardedValues = { 
          QueryString: true,
          Cookies: { Forward: 'none' },
          Headers: { Quantity: 0, Items: [] }
        };
      }
      
      if (!behavior.ForwardedValues.Headers) {
        behavior.ForwardedValues.Headers = { Quantity: 0, Items: [] };
      }
      
      // Make sure Origin header is forwarded
      if (!behavior.ForwardedValues.Headers.Items) {
        behavior.ForwardedValues.Headers.Items = [];
      }
      
      if (!behavior.ForwardedValues.Headers.Items.includes('Origin')) {
        behavior.ForwardedValues.Headers.Items.push('Origin');
        behavior.ForwardedValues.Headers.Quantity = behavior.ForwardedValues.Headers.Items.length;
        modified = true;
        console.log('➕ Added Origin header to forwarded headers');
      }
    }
    
    if (!modified) {
      console.log('✅ No changes needed! All required headers are already set.');
      return;
    }
    
    console.log('📤 Updating CloudFront distribution with new headers...');
    
    // Update the distribution with new configuration
    const updateParams = {
      Id: distributionId,
      DistributionConfig,
      IfMatch: ETag
    };
    
    const result = await cloudfront.send(
      new UpdateDistributionCommand(updateParams)
    );
    
    console.log('✅ CloudFront distribution updated successfully!');
    console.log(`⏱️ Changes may take up to 15 minutes to propagate`);
    
    // Save the distribution ID for future use
    if (!process.env.CLOUDFRONT_DISTRIBUTION_ID) {
      console.log(`💡 Tip: Add CLOUDFRONT_DISTRIBUTION_ID=${distributionId} to your .env file`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error applying ORB fix: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Function to prompt for distribution ID
async function promptForDistributionId() {
  // For simplicity, we'll use command line arguments or return empty
  const args = process.argv.slice(2);
  const idIndex = args.indexOf('--id');
  
  if (idIndex !== -1 && args[idIndex + 1]) {
    return args[idIndex + 1];
  }
  
  console.log('\n❌ CloudFront Distribution ID not found in environment or config!');
  console.log('Please run again with the --id parameter:');
  console.log('node scripts/apply-orb-fix.js --id YOUR_DISTRIBUTION_ID');
  console.log('\nOr add CLOUDFRONT_DISTRIBUTION_ID to your .env file\n');
  
  return null;
}

// Create a simple function to invalidate the cache after applying changes
async function invalidateCache(distributionId, paths = ['/*']) {
  try {
    // This requires CloudFront access, so we'll use the cache-bust script
    console.log('🔄 Invalidating CloudFront cache...');
    
    const cacheBustScript = path.join(__dirname, 'cloudfront-cache-bust.js');
    
    if (fs.existsSync(cacheBustScript)) {
      const { exec } = require('child_process');
      
      // Build the command
      let command = `node ${cacheBustScript}`;
      
      if (distributionId) {
        process.env.CLOUDFRONT_DISTRIBUTION_ID = distributionId;
      }
      
      if (paths && paths.length > 0 && paths[0] !== '/*') {
        command += ` --paths "${paths.join(',')}"`;
      }
      
      console.log(`🔄 Running: ${command}`);
      
      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Cache invalidation error: ${error.message}`);
          return;
        }
        
        console.log(stdout);
        
        if (stderr) {
          console.error(`Cache invalidation stderr: ${stderr}`);
        }
      });
    } else {
      console.log('❌ cloudfront-cache-bust.js script not found');
    }
  } catch (error) {
    console.error(`❌ Error invalidating cache: ${error.message}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛠️ ORB Fix Tool for CloudFront');
    console.log('This script adds the required headers to fix ERR_BLOCKED_BY_ORB errors');
    console.log('\nUsage:');
    console.log('  node scripts/apply-orb-fix.js [options]');
    console.log('\nOptions:');
    console.log('  --id <ID>         CloudFront Distribution ID');
    console.log('  --invalidate      Invalidate the CloudFront cache after applying changes');
    console.log('  --help, -h        Show this help message');
    console.log('\nExample:');
    console.log('  node scripts/apply-orb-fix.js --id E1A2B3C4D5E6F7 --invalidate');
    return;
  }
  
  try {
    // Apply the ORB fix
    const success = await applyOrbFix();
    
    if (success && args.includes('--invalidate')) {
      // Get distribution ID
      let distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
      
      if (!distributionId) {
        const idIndex = args.indexOf('--id');
        if (idIndex !== -1 && args[idIndex + 1]) {
          distributionId = args[idIndex + 1];
        }
      }
      
      // Invalidate the cache
      await invalidateCache(distributionId);
    }
    
    if (success) {
      console.log('\n✅ ORB fix applied successfully!');
      console.log('📝 Next steps:');
      console.log('1. Wait 10-15 minutes for CloudFront changes to propagate');
      console.log('2. Clear your browser cache completely');
      console.log('3. Test your site in Chrome');
      console.log('\n💡 If the issue persists:');
      console.log('- Check browser console for specific resource errors');
      console.log('- Try accessing specific resources directly to identify problematic ones');
      console.log('- Consider applying CORS headers directly to your S3 buckets as well');
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  applyOrbFix,
  invalidateCache
};