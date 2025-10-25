#!/usr/bin/env node

/**
 * Fix ORB Errors for CloudFront Distribution
 * 
 * This script will check and update your CloudFront distribution's response headers policy
 * to fix ERR_BLOCKED_BY_ORB errors in Chrome.
 */

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config();
const awsResources = require('../config/aws-resources');

// Get distribution type and ID from command line or use default
const distributionType = process.argv[2] || 'primary'; // 'primary' or 'gallery'
let distributionId;

if (distributionType === 'gallery') {
  distributionId = process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID || 
                  (awsResources.cloudFront.gallery && awsResources.cloudFront.gallery.distributionId) || 
                  'E27178HG3YCIMO';
  console.log('🖼️ Using Gallery CloudFront distribution');
} else {
  distributionId = process.argv[3] || process.env.CLOUDFRONT_DISTRIBUTION_ID || 
                  (awsResources.cloudFront.primary && awsResources.cloudFront.primary.distributionId) || 
                  'E2QFR8E7I4A6ZT';
  console.log('🌐 Using Primary CloudFront distribution');
}

console.log(`🔍 Checking CloudFront distribution: ${distributionId}`);

async function fixOrbErrors() {
  try {
    // Create CloudFront client
    const cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1', // CloudFront is global but API is in us-east-1
      credentials: {
        accessKeyId: process.env.aws_wavelength_dev_access_key_id,
        secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
      }
    });
    
    // Get current distribution config
    console.log('📥 Fetching current distribution configuration...');
    const getConfigCommand = new GetDistributionConfigCommand({
      Id: distributionId
    });
    
    const { DistributionConfig, ETag } = await cloudFrontClient.send(getConfigCommand);
    
    if (!DistributionConfig) {
      throw new Error(`Could not fetch configuration for distribution ${distributionId}`);
    }
    
    console.log('✅ Got distribution configuration');
    console.log(`🌐 Domain: ${DistributionConfig.Aliases?.Items?.join(', ') || DistributionConfig.DomainName || 'Not set'}`);

    // Check for existing custom headers
    let needsUpdate = false;
    let hasCustomHeaders = false;
    
    // Check the default cache behavior
    if (!DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId) {
      console.log('⚠️ No response headers policy set for default cache behavior');
      console.log('🔧 You need to create a response headers policy in the AWS Console and attach it to this distribution');
      console.log('   This script can only modify existing custom headers, not create new policies');
      
      // Check for custom headers directly in the cache behavior
      if (!DistributionConfig.DefaultCacheBehavior.CustomHeaders || 
          DistributionConfig.DefaultCacheBehavior.CustomHeaders.Quantity === 0) {
        
        // Initialize or update custom headers
        if (!DistributionConfig.DefaultCacheBehavior.CustomHeaders) {
          DistributionConfig.DefaultCacheBehavior.CustomHeaders = {
            Quantity: 0,
            Items: []
          };
        }
        
        console.log('📝 Adding custom headers directly to distribution...');
        
        // Required headers to fix ORB errors
        const orbHeadersToAdd = [
          { HeaderName: 'Crossorigin-Resource-Policy', HeaderValue: 'cross-origin' },
          { HeaderName: 'Cross-Origin-Resource-Policy', HeaderValue: 'cross-origin' },
          { HeaderName: 'Cross-Origin-Embedder-Policy', HeaderValue: 'credentialless' },
          { HeaderName: 'Cross-Origin-Opener-Policy', HeaderValue: 'same-origin' }
        ];
        
        // Add headers if not already present
        let currentHeaders = DistributionConfig.DefaultCacheBehavior.CustomHeaders.Items || [];
        
        for (const header of orbHeadersToAdd) {
          const existingHeader = currentHeaders.find(h => h.HeaderName === header.HeaderName);
          
          if (!existingHeader) {
            currentHeaders.push(header);
            needsUpdate = true;
            console.log(`➕ Adding header: ${header.HeaderName}: ${header.HeaderValue}`);
          } else if (existingHeader.HeaderValue !== header.HeaderValue) {
            existingHeader.HeaderValue = header.HeaderValue;
            needsUpdate = true;
            console.log(`🔄 Updating header: ${header.HeaderName}: ${header.HeaderValue}`);
          } else {
            console.log(`✓ Header already correct: ${header.HeaderName}: ${header.HeaderValue}`);
          }
        }
        
        DistributionConfig.DefaultCacheBehavior.CustomHeaders.Quantity = currentHeaders.length;
        DistributionConfig.DefaultCacheBehavior.CustomHeaders.Items = currentHeaders;
        hasCustomHeaders = true;
      }
    } else {
      console.log(`ℹ️ Distribution uses response headers policy: ${DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId}`);
      console.log('   To update this policy, use the AWS Console or the update-response-headers-policy script');
    }
    
    if (!hasCustomHeaders && !DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId) {
      console.log('⚠️ Could not find a way to add headers to fix ORB errors');
      console.log('   Please create a response headers policy in the AWS Console and attach it to this distribution');
      return;
    }
    
    // Check if any cache behaviors need to be updated
    if (!needsUpdate) {
      console.log('✅ No updates needed, distribution already has the necessary headers');
      return;
    }
    
    // Update the distribution
    console.log('🔄 Updating CloudFront distribution...');
    
    const updateCommand = new UpdateDistributionCommand({
      Id: distributionId,
      IfMatch: ETag,
      DistributionConfig: DistributionConfig
    });
    
    const updateResult = await cloudFrontClient.send(updateCommand);
    
    console.log('✅ Distribution updated successfully!');
    console.log(`   Status: ${updateResult.Distribution.Status}`);
    console.log('\n⏱️ It may take 5-30 minutes for changes to propagate to all edge locations');
    
    // Provide CloudFront cache invalidation command
    console.log('\n💡 After changes are deployed, invalidate the cache with:');
    console.log(`node scripts/cloudfront-cache-bust.js --paths "/*"`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Provide helpful troubleshooting tips based on error type
    if (error.name === 'AccessDenied') {
      console.error('\n⚠️ Access denied. Check your AWS credentials have CloudFront permissions.');
    } else if (error.name === 'NoSuchDistribution') {
      console.error(`\n⚠️ Distribution ${distributionId} not found. Check the ID is correct.`);
    } else if (error.name === 'CredentialsProviderError') {
      console.error('\n⚠️ AWS credentials not found or invalid.');
      console.error('   Make sure ACCESS_KEY_ID and SECRET_ACCESS_KEY are set in your .env file.');
    }
  }
}

if (require.main === module) {
  fixOrbErrors().catch(console.error);
}

module.exports = fixOrbErrors;