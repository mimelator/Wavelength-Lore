#!/bin/bash

# CloudFront Configuration Fix Script
# Fixes 403 errors caused by double /static path issue

set -e

echo "🔧 CloudFront Configuration Fix"
echo "==============================="
echo "Problem: 403 Forbidden errors on /static/js/components/gallery/*.js files"
echo "Cause: CloudFront origin has OriginPath: '/static' but files are at bucket root"
echo "Solution: Remove /static origin path and /static/* cache behavior"
echo ""

# Load environment variables if available
if [ -f .env ]; then
    set -a
    source .env
    set +a
    
    # Use wavelength-dev credentials which have CloudFront permissions
    if [ -n "$aws_wavelength_dev_access_key_id" ] && [ -n "$aws_wavelength_dev_secret_access_key" ]; then
        export AWS_ACCESS_KEY_ID="$aws_wavelength_dev_access_key_id"
        export AWS_SECRET_ACCESS_KEY="$aws_wavelength_dev_secret_access_key"
        echo "Using wavelength-dev credentials for CloudFront access..."
    fi
fi

# Configuration
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E2QFR8E7I4A6ZT}"
CONFIG_FILE="aws-policies/cloudfront-fixed-config.json"

echo "📋 Current Issue Analysis:"
echo "   - Files uploaded to: s3://bucket/js/components/gallery/gallery.js"
echo "   - CloudFront looking for: s3://bucket/static/js/components/gallery/gallery.js"
echo "   - Result: 403 Forbidden (file not found)"
echo ""

echo "🔍 Checking current CloudFront configuration..."
aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --query 'DistributionConfig.Origins.Items[0].OriginPath' --output text

echo ""
echo "📝 Steps to fix:"
echo "1. Get current ETag for the distribution"
echo "2. Update distribution config to remove /static origin path"
echo "3. Remove /static/* cache behavior (redundant)"
echo "4. Apply the configuration"
echo ""

# Get current ETag
echo "🏷️  Getting current ETag..."
ETAG=$(aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --query 'ETag' --output text)
echo "Current ETag: $ETAG"

# Apply the fixed configuration
echo ""
echo "🚀 Applying fixed configuration..."
echo "Using config file: $CONFIG_FILE"

# Update the distribution
aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --distribution-config "file://$CONFIG_FILE" \
  --if-match "$ETAG"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CloudFront configuration updated successfully!"
    echo ""
    echo "📊 Changes made:"
    echo "   - Removed OriginPath: '/static' from origin configuration"
    echo "   - Removed /static/* cache behavior (redundant)"
    echo "   - Kept /js/*, /css/*, /images/* cache behaviors"
    echo ""
    echo "⏳ Note: Changes will take 5-15 minutes to propagate globally"
    echo ""
    echo "🧪 Test after propagation:"
    echo "   curl -I https://df5sj8f594cdx.cloudfront.net/js/components/gallery/gallery.js"
    echo "   (Should return 200 OK instead of 403 Forbidden)"
    echo ""
    echo "🔄 If you need to invalidate cache for immediate testing:"
    echo "   aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/js/*'"
else
    echo ""
    echo "❌ Failed to update CloudFront configuration"
    echo "Check the error message above and try again"
    exit 1
fi