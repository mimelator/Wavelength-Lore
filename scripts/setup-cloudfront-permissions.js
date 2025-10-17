#!/usr/bin/env node

/**
 * CloudFront IAM Policy Generator
 * Generates the required IAM policy for CloudFront cache invalidation
 */

console.log('🔐 AWS IAM Policy for CloudFront Cache Invalidation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const distributionId = 'E2QFR8E7I4A6ZT';

const iamPolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontCacheInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": `arn:aws:cloudfront::170023515523:distribution/${distributionId}`
    },
    {
      "Sid": "CloudFrontListDistributions",
      "Effect": "Allow", 
      "Action": [
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
};

console.log('📋 Required IAM Policy JSON:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(JSON.stringify(iamPolicy, null, 2));
console.log('');

console.log('🔧 Steps to Add CloudFront Permissions:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Go to AWS Console → IAM → Users');
console.log('2. Select your user (wavelength-lore-app-user)');
console.log('3. Click "Add permissions" → "Create inline policy"');
console.log('4. Choose "JSON" tab and paste the policy above');
console.log('5. Name it "CloudFrontCacheInvalidation"');
console.log('6. Click "Create policy"');
console.log('');

console.log('🚀 Alternative: Use AWS CLI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('If you have AWS CLI configured with admin access:');
console.log('');
console.log('# Save policy to file');
console.log('cat > cloudfront-policy.json << \'EOF\'');
console.log(JSON.stringify(iamPolicy, null, 2));
console.log('EOF');
console.log('');
console.log('# Attach policy to user');
console.log('aws iam put-user-policy \\');
console.log('  --user-name wavelength-lore-app-user \\');
console.log('  --policy-name CloudFrontCacheInvalidation \\');
console.log('  --policy-document file://cloudfront-policy.json');
console.log('');

console.log('✅ After adding permissions, test with:');
console.log('   node scripts/cloudfront-cache-bust.js');
console.log('   ./scripts/bust-cache.sh --cdn');
console.log('');

console.log('💡 Temporary Solution:');
console.log('   Until permissions are added, use local cache busting only:');
console.log('   ./scripts/bust-cache.sh --local');
console.log('');

console.log('🔒 Security Note:');
console.log('   This policy grants minimal CloudFront permissions needed only for');
console.log('   cache invalidation on your specific distribution.');