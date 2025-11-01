#!/bin/bash

# Simple ECR Cleanup for macOS
# Cleans up wavelength-lore ECR repository

set -e

REPOSITORY_NAME="wavelength-lore"
REGION="us-east-1"

echo "🧹 ECR Cleanup for $REPOSITORY_NAME"
echo ""

# Get total image count
echo "📊 Getting current image count..."
TOTAL_IMAGES=$(aws ecr describe-images \
    --repository-name $REPOSITORY_NAME \
    --region $REGION \
    --query 'length(imageDetails)' \
    --output text)

echo "Total images: $TOTAL_IMAGES"

if [ "$TOTAL_IMAGES" -eq 0 ]; then
    echo "No images found!"
    exit 0
fi

# Estimate cost
ESTIMATED_GB=$((TOTAL_IMAGES * 200 / 1024))
ESTIMATED_COST=$(echo "scale=2; $ESTIMATED_GB * 0.10" | bc 2>/dev/null || echo "~$ESTIMATED_GB * 0.10")
echo "💰 Estimated monthly cost: ~\$$ESTIMATED_COST"
echo ""

echo "🎯 Cleanup options:"
echo "1. Keep only 10 most recent images (RECOMMENDED)"
echo "2. Keep only 5 most recent images (AGGRESSIVE)" 
echo "3. Delete untagged images only (SAFE)"
echo "4. Exit"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        KEEP_COUNT=10
        ;;
    2)
        KEEP_COUNT=5
        ;;
    3)
        echo "🏷️  Deleting untagged images..."
        aws ecr describe-images \
            --repository-name $REPOSITORY_NAME \
            --region $REGION \
            --query 'imageDetails[?imageDigest != null && (imageTags == null || length(imageTags) == `0`)].imageDigest' \
            --output text | tr '\t' '\n' | while read digest; do
                if [ ! -z "$digest" ]; then
                    echo "Deleting untagged image: $digest"
                    aws ecr batch-delete-image \
                        --repository-name $REPOSITORY_NAME \
                        --region $REGION \
                        --image-ids imageDigest=$digest
                fi
            done
        echo "✅ Untagged images cleanup complete"
        exit 0
        ;;
    4)
        echo "👋 Cleanup cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

if [ "$TOTAL_IMAGES" -le "$KEEP_COUNT" ]; then
    echo "✅ Only $TOTAL_IMAGES images exist, nothing to delete"
    exit 0
fi

DELETE_COUNT=$((TOTAL_IMAGES - KEEP_COUNT))
echo ""
echo "⚠️  This will delete $DELETE_COUNT images, keeping $KEEP_COUNT newest"
echo "💾 Current storage: ~$ESTIMATED_GB GB (~\$$ESTIMATED_COST/month)"

NEW_GB=$((KEEP_COUNT * 200 / 1024))
NEW_COST=$(echo "scale=2; $NEW_GB * 0.10" | bc 2>/dev/null || echo "~$NEW_GB * 0.10")
echo "💾 After cleanup: ~$NEW_GB GB (~\$$NEW_COST/month)"

echo ""
read -p "Continue with deletion? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "🗑️  Starting deletion of $DELETE_COUNT oldest images..."

# Get oldest images to delete
aws ecr describe-images \
    --repository-name $REPOSITORY_NAME \
    --region $REGION \
    --query "sort_by(imageDetails, &imagePushedAt)[0:$DELETE_COUNT].imageDigest" \
    --output text | tr '\t' '\n' | while read digest; do
        if [ ! -z "$digest" ]; then
            echo "Deleting: $digest"
            aws ecr batch-delete-image \
                --repository-name $REPOSITORY_NAME \
                --region $REGION \
                --image-ids imageDigest=$digest \
                --output text
        fi
    done

echo ""
echo "✅ Cleanup complete!"

# Show final count
FINAL_COUNT=$(aws ecr describe-images \
    --repository-name $REPOSITORY_NAME \
    --region $REGION \
    --query 'length(imageDetails)' \
    --output text)

echo "📊 Final image count: $FINAL_COUNT"
echo "💰 Estimated savings: ~\$$(echo "scale=2; ($ESTIMATED_GB - $NEW_GB) * 0.10" | bc 2>/dev/null || echo "significant")/month"