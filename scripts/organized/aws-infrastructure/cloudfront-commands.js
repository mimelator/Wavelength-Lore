#!/usr/bin/env node

/**
 * CloudFront Configuration Commands Generator
 * Generates the exact AWS CLI commands needed to update your CloudFront distribution
 */

const DISTRIBUTION_ID = 'E2QFR8E7I4A6ZT';

console.log('🛠️  CLOUDFRONT CONFIGURATION COMMANDS');
console.log('====================================');
console.log('');

console.log('📋 Since none of your current AWS users have CloudFront permissions,');
console.log('   here are the exact AWS CLI commands to run with an admin account:');
console.log('');

console.log('1️⃣  BACKUP CURRENT CONFIGURATION:');
console.log('');
console.log('aws cloudfront get-distribution-config \\');
console.log(`  --id ${DISTRIBUTION_ID} \\`);
console.log('  --output json > cloudfront-backup.json');
console.log('');

console.log('2️⃣  CREATE UPDATED CONFIGURATION FILE:');
console.log('');
console.log('cat > cloudfront-update.json << \'EOF\'');
console.log(JSON.stringify({
  "comment": "Add cache behaviors for new path structure",
  "cacheBehaviors": [
    {
      "pathPattern": "/images/*",
      "targetOriginId": "YOUR_S3_ORIGIN_ID",
      "viewerProtocolPolicy": "redirect-to-https",
      "allowedMethods": ["GET", "HEAD"],
      "cachedMethods": ["GET", "HEAD"],
      "forwardedValues": {
        "queryString": false,
        "cookies": { "forward": "none" }
      },
      "minTTL": 0,
      "defaultTTL": 86400,
      "maxTTL": 31536000,
      "compress": false
    },
    {
      "pathPattern": "/css/*",
      "targetOriginId": "YOUR_S3_ORIGIN_ID", 
      "viewerProtocolPolicy": "redirect-to-https",
      "allowedMethods": ["GET", "HEAD"],
      "cachedMethods": ["GET", "HEAD"],
      "forwardedValues": {
        "queryString": false,
        "cookies": { "forward": "none" }
      },
      "minTTL": 0,
      "defaultTTL": 86400,
      "maxTTL": 31536000,
      "compress": true
    },
    {
      "pathPattern": "/js/*",
      "targetOriginId": "YOUR_S3_ORIGIN_ID",
      "viewerProtocolPolicy": "redirect-to-https", 
      "allowedMethods": ["GET", "HEAD"],
      "cachedMethods": ["GET", "HEAD"],
      "forwardedValues": {
        "queryString": false,
        "cookies": { "forward": "none" }
      },
      "minTTL": 0,
      "defaultTTL": 86400,
      "maxTTL": 31536000,
      "compress": true
    }
  ]
}, null, 2));
console.log('EOF');
console.log('');

console.log('3️⃣  APPLY THE CONFIGURATION:');
console.log('');
console.log('# Extract the current ETag and DistributionConfig');
console.log('ETAG=$(jq -r \'.ETag\' cloudfront-backup.json)');
console.log('jq \'.DistributionConfig\' cloudfront-backup.json > current-config.json');
console.log('');
console.log('# Merge the new behaviors (you\'ll need to manually edit current-config.json)');
console.log('# Add the behaviors from cloudfront-update.json to the cacheBehaviors array');
console.log('');
console.log('# Update the distribution');
console.log('aws cloudfront update-distribution \\');
console.log(`  --id ${DISTRIBUTION_ID} \\`);
console.log('  --distribution-config file://current-config.json \\');
console.log('  --if-match $ETAG');
console.log('');

console.log('4️⃣  SIMPLIFIED APPROACH - AWS CONSOLE:');
console.log('');
console.log('🌐 Open: https://console.aws.amazon.com/cloudfront/');
console.log(`📡 Find distribution: ${DISTRIBUTION_ID}`);
console.log('⚙️  Go to Behaviors tab');
console.log('➕ Add these 3 new behaviors:');
console.log('');
console.log('   Behavior 1: /images/*');
console.log('   - Viewer Protocol Policy: Redirect HTTP to HTTPS');
console.log('   - Allowed Methods: GET, HEAD');
console.log('   - Cache TTL: Default 86400, Max 31536000');
console.log('   - Compress: No');
console.log('');
console.log('   Behavior 2: /css/*');
console.log('   - Same settings as above, but Compress: Yes');
console.log('');
console.log('   Behavior 3: /js/*');
console.log('   - Same settings as /css/*');
console.log('');

console.log('5️⃣  ALTERNATIVE - QUICK LOCALHOST SWITCH:');
console.log('');
console.log('🏠 For immediate functionality, switch to localhost CDN:');
console.log('');
console.log('# In your .env file, change:');
console.log('CDN_URL=http://localhost:3001');
console.log('');
console.log('# Restart your server:');
console.log('pkill -f "node.*index.js" && node index.js');
console.log('');
console.log('# Test:');
console.log('node scripts/test-cdn-paths.js');
console.log('');

console.log('✅ RECOMMENDATION:');
console.log('');
console.log('Since CloudFront configuration requires admin permissions:');
console.log('1. Switch to localhost CDN now for immediate functionality');
console.log('2. Use AWS Console to add the 3 cache behaviors when convenient');
console.log('3. Switch back to CloudFront CDN after configuration');
console.log('');
console.log('🧪 Test after any changes:');
console.log('   node scripts/test-cdn-paths.js');