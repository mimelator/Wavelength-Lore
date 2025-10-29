#!/bin/bash

# 🌊 WAVELENGTH Asset Sync to S3/CloudFront
# This script syncs local assets to production S3 bucket and invalidates CloudFront cache

set -e

echo "🌊 WAVELENGTH ASSET SYNC STARTING..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Check AWS configuration
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Configuration
BUCKET_NAME=${S3_BUCKET_NAME:-"wavelength-lore-bucket"}
CLOUDFRONT_ID=${CLOUDFRONT_DISTRIBUTION_ID:-""}

echo "📦 Bucket: $BUCKET_NAME"
echo ""

# Sync static directory (CSS, JS, images, etc.)
LOCAL_STATIC_DIR="./static"
if [ -d "$LOCAL_STATIC_DIR" ]; then
    echo "🔄 Syncing static directory..."
    LOCAL_COUNT=$(find "$LOCAL_STATIC_DIR" -type f | wc -l | tr -d ' ')
    echo "📊 Found $LOCAL_COUNT files in static/"

    aws s3 sync "$LOCAL_STATIC_DIR" "s3://$BUCKET_NAME" \
        --exact-timestamps \
        --no-progress \
        --exclude ".DS_Store" \
        --exclude "*.md"

    if [ $? -eq 0 ]; then
        echo "✅ Static directory sync completed"
    else
        echo "❌ Static directory sync failed"
        exit 1
    fi
else
    echo "⚠️  Static directory not found: $LOCAL_STATIC_DIR"
fi

# Sync public directory (for legacy assets)
LOCAL_PUBLIC_DIR="./public"
if [ -d "$LOCAL_PUBLIC_DIR" ]; then
    echo ""
    echo "🔄 Syncing public directory..."
    PUBLIC_COUNT=$(find "$LOCAL_PUBLIC_DIR" -type f | wc -l | tr -d ' ')
    echo "📊 Found $PUBLIC_COUNT files in public/"

    aws s3 sync "$LOCAL_PUBLIC_DIR" "s3://$BUCKET_NAME/" \
        --exact-timestamps \
        --exclude ".DS_Store" \
        --exclude "*.md"

    if [ $? -eq 0 ]; then
        echo "✅ Public directory sync completed"
    else
        echo "⚠️  Public directory sync failed (non-critical)"
    fi
fi

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$CLOUDFRONT_ID" ]; then
    echo ""
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    if [ $? -eq 0 ]; then
        echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
        echo "🕐 Cache invalidation may take 5-10 minutes to complete"
    else
        echo "⚠️  CloudFront invalidation failed (assets still updated)"
    fi
else
    echo ""
    echo "ℹ️  CloudFront distribution ID not set - skipping cache invalidation"
    echo "   Set CLOUDFRONT_DISTRIBUTION_ID in .env to enable cache invalidation"
fi

# Verify NPC images were uploaded
echo ""
echo "🎯 Verifying NPC images upload..."
TARGET_FILE="images/npc-characters/fp_elf_2.png"
if aws s3 ls "s3://$BUCKET_NAME/$TARGET_FILE" &> /dev/null; then
    echo "✅ NPC images confirmed in S3"
else
    echo "⚠️  NPC images may not have uploaded correctly"
fi

echo ""
echo "🌊 WAVELENGTH ASSET SYNC COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Synced assets from:"
echo "   • static/ directory"
echo "   • public/ directory (legacy)"
echo ""
echo "🌐 CDN URLs:"
echo "   • Images: https://df5sj8f594cdx.cloudfront.net/images/"
echo "   • NPC Characters: https://df5sj8f594cdx.cloudfront.net/images/npc-characters/"
echo "   • CSS/JS: https://df5sj8f594cdx.cloudfront.net/css/ & /js/"
echo ""
echo "ℹ️  Note: Assets are served via CloudFront CDN"
echo ""
