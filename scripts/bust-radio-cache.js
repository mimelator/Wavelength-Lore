#!/usr/bin/env node

/**
 * Manual Radio Cache Bust Tool
 * Simple CLI to bust radio playlist cache
 */

const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config();

async function bustRadioCache() {
  console.log('🔄 Manual Radio Cache Bust');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    if (!distributionId) {
      throw new Error('CLOUDFRONT_DISTRIBUTION_ID not found in environment');
    }
    
    const radioPaths = [
      '/api/radio/*',
      '/radio*',
      '/static/js/radio-player.js*'
    ];
    
    console.log('🎯 Invalidating paths:');
    radioPaths.forEach(path => console.log(`   - ${path}`));
    console.log('');
    
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: radioPaths.length,
          Items: radioPaths
        },
        CallerReference: 'radio-cache-bust-' + Date.now()
      }
    };
    
    const result = await cloudfront.send(new CreateInvalidationCommand(params));
    
    console.log('✅ Radio cache bust successful!');
    console.log('📋 Invalidation ID:', result.Invalidation.Id);
    console.log('⏰ Status:', result.Invalidation.Status);
    console.log('🔗 Distribution:', distributionId);
    console.log('');
    console.log('💡 Cache will be refreshed in 2-5 minutes');
    
  } catch (error) {
    console.error('❌ Cache bust failed:', error.message);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 Tip: Ensure AWS credentials are configured');
    } else if (error.message.includes('CLOUDFRONT_DISTRIBUTION_ID')) {
      console.log('💡 Tip: Set CLOUDFRONT_DISTRIBUTION_ID environment variable');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  bustRadioCache().catch(console.error);
}

module.exports = bustRadioCache;