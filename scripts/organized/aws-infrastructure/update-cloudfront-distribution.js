#!/usr/bin/env node

/**
 * Update CloudFront Distribution to Fix ERR_BLOCKED_BY_ORB
 * 
 * This script updates your existing CloudFront distribution (E2QFR8E7I4A6ZT)
 * to include the necessary headers to fix ERR_BLOCKED_BY_ORB errors.
 */

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand, 
        CreateResponseHeadersPolicyCommand, GetResponseHeadersPolicyCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const awsResources = require('../config/aws-resources');

// Get distribution type from command line
const distributionType = process.argv[2] || 'primary'; // 'primary' or 'gallery'
let DISTRIBUTION_ID;

if (distributionType === 'gallery') {
  DISTRIBUTION_ID = process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID || 
                    (awsResources.cloudFront.gallery && awsResources.cloudFront.gallery.distributionId) || 
                    'E27178HG3YCIMO';
  console.log('🖼️ Using Gallery CloudFront distribution');
} else {
  DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || 
                    (awsResources.cloudFront.primary && awsResources.cloudFront.primary.distributionId) || 
                    'E2QFR8E7I4A6ZT';
  console.log('🌐 Using Primary CloudFront distribution');
}

async function main() {
  try {
    console.log(`\n🔄 Updating CloudFront Distribution: ${DISTRIBUTION_ID}`);

    // Create CloudFront client
    const cloudFrontClient = new CloudFrontClient({
      region: 'us-east-1', // CloudFront is global but API is in us-east-1
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Load the response headers policy from your JSON file
    console.log('📂 Loading response headers policy configuration...');
    const policyConfigPath = path.join(__dirname, '../aws-policies/cloudfront-response-headers-policy.json');
    const policyConfigJson = await fs.readFile(policyConfigPath, 'utf-8');
    const policyConfig = JSON.parse(policyConfigJson);

    // Create a name for the policy that includes the distribution ID
    const policyName = `ORB-Fix-${DISTRIBUTION_ID}-${Date.now()}`;
    policyConfig.ResponseHeadersPolicyConfig.Name = policyName;
    
    console.log(`📋 Creating new response headers policy: ${policyName}`);
    console.log('   This policy includes headers to fix ERR_BLOCKED_BY_ORB errors');

    // Create a new response headers policy
    const createPolicyCommand = new CreateResponseHeadersPolicyCommand({
      ResponseHeadersPolicyConfig: policyConfig.ResponseHeadersPolicyConfig
    });

    const createPolicyResponse = await cloudFrontClient.send(createPolicyCommand);
    const policyId = createPolicyResponse.ResponseHeadersPolicy.Id;

    console.log(`✅ Response headers policy created with ID: ${policyId}`);
    console.log('   Remember to add this to your .env file as CLOUDFRONT_HEADERS_POLICY_ID');

    // Now get the current distribution config
    console.log(`\n📡 Getting current configuration for distribution ${DISTRIBUTION_ID}...`);
    const getConfigCommand = new GetDistributionConfigCommand({
      Id: DISTRIBUTION_ID
    });

    const { DistributionConfig, ETag } = await cloudFrontClient.send(getConfigCommand);

    // Save original config for reference
    console.log('💾 Backing up original distribution config...');
    await fs.writeFile(
      path.join(__dirname, '../aws-policies', `cloudfront-${DISTRIBUTION_ID}-original.json`),
      JSON.stringify(DistributionConfig, null, 2)
    );

    // Update the default cache behavior to use our new policy
    console.log('🔄 Updating distribution cache behaviors to use new headers policy...');
    
    // Update default cache behavior
    if (DistributionConfig.DefaultCacheBehavior) {
      DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = policyId;
    }
    
    // Update any other cache behaviors
    if (DistributionConfig.CacheBehaviors && DistributionConfig.CacheBehaviors.Items) {
      DistributionConfig.CacheBehaviors.Items.forEach(behavior => {
        behavior.ResponseHeadersPolicyId = policyId;
      });
    }

    // Save updated config for reference
    await fs.writeFile(
      path.join(__dirname, '../aws-policies', `cloudfront-${DISTRIBUTION_ID}-updated.json`),
      JSON.stringify(DistributionConfig, null, 2)
    );

    // Update the distribution
    console.log('🚀 Applying updated configuration to distribution...');
    console.log('   This may take several minutes to complete and deploy globally');
    
    const updateCommand = new UpdateDistributionCommand({
      Id: DISTRIBUTION_ID,
      DistributionConfig: DistributionConfig,
      IfMatch: ETag
    });

    const updateResponse = await cloudFrontClient.send(updateCommand);
    
    console.log('\n✅ CloudFront distribution update initiated!');
    console.log('   Distribution ID:', updateResponse.Distribution.Id);
    console.log('   Domain name:', updateResponse.Distribution.DomainName);
    console.log('   Status:', updateResponse.Distribution.Status);
    
    console.log('\n🔄 CloudFront updates typically take 5-15 minutes to propagate globally.');
    console.log('   After it completes, the ERR_BLOCKED_BY_ORB errors should be fixed.');
    
    // Instructions for next steps
    console.log('\n📝 Next Steps:');
    console.log('1. Add the following to your .env file:');
    console.log(`   CLOUDFRONT_HEADERS_POLICY_ID=${policyId}`);
    console.log('2. Invalidate your CloudFront cache with:');
    console.log('   node scripts/cloudfront-cache-bust.js');
    console.log('3. If issues persist after distribution deployment completes:');
    console.log('   - Clear your browser cache');
    console.log('   - Test in an incognito/private window');

  } catch (error) {
    console.error('\n❌ Error updating CloudFront distribution:', error);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check your AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY)');
    console.log('2. Verify the distribution ID is correct: ' + DISTRIBUTION_ID);
    console.log('3. Make sure your IAM user has CloudFront management permissions');
    console.log('4. Check the aws-policies/cloudfront-response-headers-policy.json file for valid JSON');
    
    // If there's a specific error about permissions, provide more guidance
    if (error.name === 'AccessDeniedException' || error.message.includes('Access Denied')) {
      console.log('\n🔑 IAM Permission Issue Detected:');
      console.log('You need the following CloudFront permissions in your IAM policy:');
      console.log('- cloudfront:GetDistribution');
      console.log('- cloudfront:GetDistributionConfig');
      console.log('- cloudfront:UpdateDistribution');
      console.log('- cloudfront:CreateResponseHeadersPolicy');
      console.log('- cloudfront:GetResponseHeadersPolicy');
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}