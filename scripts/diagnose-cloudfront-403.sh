#!/bin/bash

# CloudFront 403 Diagnostic Script
# Helps diagnose the path mismatch issue

set -e

echo "🔍 CloudFront 403 Diagnostic Report"
echo "===================================="

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

DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E2QFR8E7I4A6ZT}"
BUCKET_NAME="${S3_BUCKET_NAME:-wavelength-lore-bucket}"

echo "📋 Configuration:"
echo "   Distribution ID: $DISTRIBUTION_ID" 
echo "   Bucket Name: $BUCKET_NAME"
echo ""

echo "🔍 1. Checking CloudFront Origin Configuration..."
ORIGIN_PATH=$(aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --query 'DistributionConfig.Origins.Items[0].OriginPath' --output text)
echo "   Current OriginPath: '$ORIGIN_PATH'"

if [ "$ORIGIN_PATH" = "/static" ]; then
    echo "   ❌ ISSUE FOUND: OriginPath is '/static' but files are at bucket root"
else
    echo "   ✅ OriginPath looks correct"
fi

echo ""
echo "🔍 2. Checking S3 Bucket File Locations..."
echo "   Looking for gallery files in bucket..."

# Check if files exist at bucket root
JS_FILES=$(aws s3 ls s3://$BUCKET_NAME/js/components/gallery/ --recursive 2>/dev/null || echo "")
if [ -n "$JS_FILES" ]; then
    echo "   ✅ Files found at bucket root:"
    echo "$JS_FILES" | sed 's/^/      /'
else
    echo "   ❓ No files found at s3://$BUCKET_NAME/js/components/gallery/"
fi

# Check if files exist under /static/ path
STATIC_JS_FILES=$(aws s3 ls s3://$BUCKET_NAME/static/js/components/gallery/ --recursive 2>/dev/null || echo "")
if [ -n "$STATIC_JS_FILES" ]; then
    echo "   ❓ Files also found under /static/ path:"
    echo "$STATIC_JS_FILES" | sed 's/^/      /'
else
    echo "   ✅ No files found under /static/ path (this is correct)"
fi

echo ""
echo "🔍 3. Checking Cache Behaviors..."
CACHE_BEHAVIORS=$(aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --query 'DistributionConfig.CacheBehaviors.Items[?PathPattern==`/static/*`].PathPattern' --output text)
if [ -n "$CACHE_BEHAVIORS" ]; then
    echo "   ❌ ISSUE FOUND: /static/* cache behavior exists"
    echo "   This creates double /static path when combined with OriginPath"
else
    echo "   ✅ No /static/* cache behavior found"
fi

echo ""
echo "🔍 4. Testing Actual File Access..."
echo "   Testing problematic URLs..."

# Test the problematic URLs
TEST_URLS=(
    "https://df5sj8f594cdx.cloudfront.net/static/js/components/gallery/gallery.js"
    "https://df5sj8f594cdx.cloudfront.net/js/components/gallery/gallery.js"
)

for URL in "${TEST_URLS[@]}"; do
    echo "   Testing: $URL"
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
    if [ "$STATUS_CODE" = "200" ]; then
        echo "      ✅ $STATUS_CODE OK"
    elif [ "$STATUS_CODE" = "403" ]; then
        echo "      ❌ $STATUS_CODE Forbidden"
    elif [ "$STATUS_CODE" = "404" ]; then
        echo "      ❌ $STATUS_CODE Not Found"
    else
        echo "      ❓ $STATUS_CODE (Unexpected)"
    fi
done

echo ""
echo "📊 Diagnosis Summary:"
if [ "$ORIGIN_PATH" = "/static" ]; then
    echo "   🎯 ROOT CAUSE IDENTIFIED:"
    echo "      CloudFront OriginPath='/static' + URL path '/static/js/...' = '/static/static/js/...'"
    echo "      Files are actually at '/js/...' in the bucket"
    echo ""
    echo "   💡 SOLUTION:"
    echo "      Run: ./scripts/fix-cloudfront-403.sh"
    echo "      This will remove the /static OriginPath to align with actual file locations"
else
    echo "   ✅ CloudFront configuration appears correct"
    echo "   💡 Try running asset sync to ensure files are uploaded:"
    echo "      ./scripts/sync-assets.sh"
fi

echo ""
echo "🔧 Next Steps:"
echo "   1. Run ./scripts/fix-cloudfront-403.sh to fix CloudFront config"
echo "   2. Wait 5-15 minutes for propagation"
echo "   3. Test the URLs again"
echo "   4. Optionally invalidate cache for immediate testing"