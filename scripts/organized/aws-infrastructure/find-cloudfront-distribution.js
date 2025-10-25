#!/usr/bin/env node

/**
 * CloudFront Distribution Finder
 * Helps locate the correct CloudFront distribution for your domain
 */

console.log('🔍 CLOUDFRONT DISTRIBUTION FINDER');
console.log('=================================');
console.log('');

console.log('❌ The distribution ID "df5sj8f594cdx" was not found.');
console.log('   This could mean:');
console.log('   • The distribution ID is incorrect');
console.log('   • The distribution is in a different AWS region');
console.log('   • The distribution has been deleted');
console.log('   • Your AWS credentials don\'t have access to this distribution');
console.log('');

console.log('🔧 FINDING YOUR CORRECT DISTRIBUTION:');
console.log('');

console.log('1️⃣  LIST ALL CLOUDFRONT DISTRIBUTIONS:');
console.log('');
console.log('aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Comment]" --output table');
console.log('');

console.log('2️⃣  FIND BY DOMAIN NAME:');
console.log('');
console.log('aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, \'your-domain.com\')].[Id,DomainName]" --output table');
console.log('');

console.log('3️⃣  CHECK DOMAIN OWNERSHIP:');
console.log('');
console.log('# Check what domain your CDN_URL points to');
console.log('echo "Current CDN_URL from .env:"');
console.log('grep "CDN_URL=" .env');
console.log('');
console.log('# Extract just the domain');
console.log('CDN_DOMAIN=$(grep "CDN_URL=" .env | cut -d= -f2 | sed "s|https://||" | sed "s|http://||")');
console.log('echo "CDN Domain: $CDN_DOMAIN"');
console.log('');

console.log('4️⃣  VERIFY DOMAIN EXISTS:');
console.log('');
console.log('# Test if the domain is accessible');
console.log('curl -I https://df5sj8f594cdx.cloudfront.net');
console.log('');

console.log('5️⃣  AWS CONSOLE METHOD:');
console.log('');
console.log('🌐 Open: https://console.aws.amazon.com/cloudfront/');
console.log('📋 Look for distributions that match your domain');
console.log('🏷️  Copy the correct Distribution ID');
console.log('');

console.log('6️⃣  UPDATE SCRIPTS WITH CORRECT ID:');
console.log('');
console.log('# Once you find the correct distribution ID, update it:');
console.log('CORRECT_DISTRIBUTION_ID="YOUR_ACTUAL_ID"');
console.log('');
console.log('# Test the correct ID:');
console.log('aws cloudfront get-distribution-config --id $CORRECT_DISTRIBUTION_ID');
console.log('');

console.log('💡 ALTERNATIVE APPROACHES:');
console.log('');

console.log('Option A - No CloudFront distribution exists:');
console.log('   • Create a new CloudFront distribution');
console.log('   • Point it to your S3 bucket');
console.log('   • Configure the cache behaviors');
console.log('');

console.log('Option B - Use S3 directly:');
console.log('   • CDN_URL=https://your-bucket.s3.amazonaws.com');
console.log('   • No CloudFront needed');
console.log('');

console.log('Option C - Use localhost (immediate solution):');
console.log('   • CDN_URL=http://localhost:3001');
console.log('   • Everything works immediately');
console.log('');

console.log('🧪 QUICK DIAGNOSTIC COMMANDS:');
console.log('');
console.log('# List all distributions');
console.log('aws cloudfront list-distributions');
console.log('');
console.log('# Test current CDN domain');
console.log('curl -I $(grep CDN_URL .env | cut -d= -f2)/css/styles.css');
console.log('');
console.log('# Switch to localhost for immediate functionality');
console.log('node scripts/switch-cdn.js localhost');
console.log('');

console.log('✅ NEXT STEPS:');
console.log('1. Run the diagnostic commands above');
console.log('2. Find your correct distribution ID (or create one)');
console.log('3. Or switch to localhost CDN for immediate functionality');
console.log('');
console.log('🆘 Need immediate functionality?');
console.log('   Run: node scripts/switch-cdn.js localhost');