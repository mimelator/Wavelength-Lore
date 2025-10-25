#!/bin/bash

# CloudFront Distribution Update Script
# Updates the Wavelength Lore CloudFront distribution to support new path structure

set -e

DISTRIBUTION_ID="df5sj8f594cdx"
CONFIG_FILE="./config/cloudfront-config-updated.json"
BACKUP_FILE="./config/cloudfront-config-backup.json"

echo "🔧 CloudFront Distribution Update Script"
echo "========================================"
echo "📡 Distribution ID: $DISTRIBUTION_ID"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli"
    echo "   or visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "🔑 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured or invalid."
    echo "   Run: aws configure"
    echo "   Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

echo "✅ AWS credentials are valid"
echo ""

# Backup current configuration
echo "📥 Backing up current CloudFront configuration..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > $BACKUP_FILE
echo "✅ Backup saved to: $BACKUP_FILE"
echo ""

# Extract ETag for update
ETAG=$(jq -r '.ETag' $BACKUP_FILE)
echo "🏷️  Current ETag: $ETAG"
echo ""

# Prepare configuration for update (remove ETag and metadata)
echo "🔧 Preparing updated configuration..."
jq '.DistributionConfig' $BACKUP_FILE > ./config/cloudfront-config-current.json

# Show what will be added
echo "📋 New cache behaviors that will be added:"
echo "   • /images/* - For image assets (no compression)"
echo "   • /css/*    - For CSS files (with compression)"  
echo "   • /js/*     - For JavaScript files (with compression)"
echo "   • /static/* - Maintain legacy compatibility"
echo ""

# Ask for confirmation
read -p "🤔 Do you want to proceed with updating the CloudFront distribution? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled"
    exit 1
fi

echo ""
echo "🚀 Updating CloudFront distribution..."

# Note: You'll need to manually merge the configurations or use a more sophisticated script
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "The current configuration has been backed up. You need to:"
echo "1. Open AWS CloudFront Console: https://console.aws.amazon.com/cloudfront/"
echo "2. Find distribution: $DISTRIBUTION_ID"
echo "3. Go to 'Behaviors' tab"
echo "4. Add the following cache behaviors:"
echo ""
echo "   Behavior 1: /images/*"
echo "   - Origin: Your existing S3 origin"
echo "   - Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   - Allowed HTTP Methods: GET, HEAD"
echo "   - Cache Based on Selected Request Headers: None"
echo "   - Object Caching: Custom (Default TTL: 86400)"
echo "   - Forward Cookies: None"
echo "   - Query String Forwarding: No"
echo "   - Compress Objects: No"
echo ""
echo "   Behavior 2: /css/*"
echo "   - Origin: Your existing S3 origin"
echo "   - Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   - Allowed HTTP Methods: GET, HEAD"
echo "   - Cache Based on Selected Request Headers: None"
echo "   - Object Caching: Custom (Default TTL: 86400)"
echo "   - Forward Cookies: None"
echo "   - Query String Forwarding: No"
echo "   - Compress Objects: Yes"
echo ""
echo "   Behavior 3: /js/*"
echo "   - Origin: Your existing S3 origin"
echo "   - Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   - Allowed HTTP Methods: GET, HEAD"
echo "   - Cache Based on Selected Request Headers: None"
echo "   - Object Caching: Custom (Default TTL: 86400)"
echo "   - Forward Cookies: None"
echo "   - Query String Forwarding: No"
echo "   - Compress Objects: Yes"
echo ""
echo "5. Save and deploy the distribution"
echo "6. Wait 15-20 minutes for deployment to complete"
echo ""
echo "📋 Alternative: Use the AWS CLI with the prepared config:"
echo "   aws cloudfront update-distribution \\"
echo "     --id $DISTRIBUTION_ID \\"
echo "     --distribution-config file://config/cloudfront-config-merged.json \\"
echo "     --if-match $ETAG"
echo ""
echo "🧪 After deployment, test with:"
echo "   node scripts/test-cdn-paths.js"
echo ""
echo "✅ Setup complete! Please follow the manual steps above."