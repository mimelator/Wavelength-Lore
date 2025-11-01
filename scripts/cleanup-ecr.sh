#!/bin/bash

# ECR Cleanup Script for wavelength-lore repository
# Safely removes old Docker images while preserving recent ones

set -e

# Configuration
REPOSITORY_NAME="wavelength-lore"
REGION="us-east-1"
ACCOUNT_ID="170023515523"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 ECR Cleanup Script for wavelength-lore${NC}"
echo "Repository: $REPOSITORY_NAME"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured or no valid credentials${NC}"
    echo "Please run 'aws configure' first"
    exit 1
fi

# Function to get image count
get_image_count() {
    aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query 'length(imageDetails)' \
        --output text 2>/dev/null || echo "0"
}

# Function to list images by age
list_images_by_age() {
    echo -e "${BLUE}📊 Current image inventory:${NC}"
    
    # Get total count
    TOTAL_IMAGES=$(get_image_count)
    echo "Total images: $TOTAL_IMAGES"
    
    if [ "$TOTAL_IMAGES" -eq 0 ]; then
        echo -e "${YELLOW}No images found in repository${NC}"
        return
    fi
    
    # Get images pushed in last 7 days
    WEEK_AGO=$(date -d '7 days ago' '+%Y-%m-%d')
    RECENT_COUNT=$(aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query "length(imageDetails[?imagePushedAt>=\`$WEEK_AGO\`])" \
        --output text)
    
    # Get images pushed in last 30 days  
    MONTH_AGO=$(date -d '30 days ago' '+%Y-%m-%d')
    MONTH_COUNT=$(aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query "length(imageDetails[?imagePushedAt>=\`$MONTH_AGO\`])" \
        --output text)
    
    # Calculate old images
    OLD_COUNT=$((TOTAL_IMAGES - MONTH_COUNT))
    
    echo "📅 Images from last 7 days: $RECENT_COUNT"
    echo "📅 Images from last 30 days: $MONTH_COUNT"  
    echo "🗑️  Images older than 30 days: $OLD_COUNT"
    echo ""
    
    # Calculate storage cost (approximate)
    # ECR charges $0.10 per GB per month
    # Average Docker image ~200MB
    ESTIMATED_GB=$((TOTAL_IMAGES * 200 / 1024))
    ESTIMATED_COST=$(echo "scale=2; $ESTIMATED_GB * 0.10" | bc -l)
    echo -e "${YELLOW}💰 Estimated monthly storage cost: \$${ESTIMATED_COST}${NC}"
    echo ""
}

# Function to cleanup old images
cleanup_old_images() {
    local DAYS_TO_KEEP=$1
    local DRY_RUN=$2
    
    if [ -z "$DAYS_TO_KEEP" ]; then
        DAYS_TO_KEEP=30
    fi
    
    echo -e "${BLUE}🗑️  Cleaning up images older than $DAYS_TO_KEEP days${NC}"
    
    # Get cutoff date
    CUTOFF_DATE=$(date -d "$DAYS_TO_KEEP days ago" '+%Y-%m-%d')
    
    # Get images to delete
    IMAGES_TO_DELETE=$(aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query "imageDetails[?imagePushedAt<\`$CUTOFF_DATE\`].imageDigest" \
        --output text)
    
    if [ -z "$IMAGES_TO_DELETE" ] || [ "$IMAGES_TO_DELETE" == "None" ]; then
        echo -e "${GREEN}✅ No images older than $DAYS_TO_KEEP days found${NC}"
        return
    fi
    
    # Convert to array
    IFS=$'\t' read -ra DIGEST_ARRAY <<< "$IMAGES_TO_DELETE"
    DELETE_COUNT=${#DIGEST_ARRAY[@]}
    
    echo "Found $DELETE_COUNT images to delete"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN - Would delete $DELETE_COUNT images${NC}"
        return
    fi
    
    # Confirm deletion
    echo -e "${RED}⚠️  This will permanently delete $DELETE_COUNT images${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleanup cancelled${NC}"
        return
    fi
    
    # Delete images in batches (ECR has limits)
    BATCH_SIZE=10
    DELETED_COUNT=0
    
    for ((i=0; i<${#DIGEST_ARRAY[@]}; i+=BATCH_SIZE)); do
        BATCH=(${DIGEST_ARRAY[@]:$i:$BATCH_SIZE})
        
        # Build imageIds JSON for batch
        IMAGE_IDS=""
        for digest in "${BATCH[@]}"; do
            if [ -n "$IMAGE_IDS" ]; then
                IMAGE_IDS="$IMAGE_IDS,"
            fi
            IMAGE_IDS="$IMAGE_IDS{\"imageDigest\":\"$digest\"}"
        done
        
        echo "Deleting batch of ${#BATCH[@]} images..."
        
        aws ecr batch-delete-image \
            --repository-name $REPOSITORY_NAME \
            --region $REGION \
            --image-ids "[$IMAGE_IDS]" \
            --output table
        
        DELETED_COUNT=$((DELETED_COUNT + ${#BATCH[@]}))
        echo "Progress: $DELETED_COUNT/$DELETE_COUNT deleted"
        
        # Small delay to avoid rate limits
        sleep 1
    done
    
    echo -e "${GREEN}✅ Successfully deleted $DELETED_COUNT images${NC}"
}

# Function to cleanup untagged images
cleanup_untagged() {
    local DRY_RUN=$1
    
    echo -e "${BLUE}🏷️  Finding untagged images${NC}"
    
    # Get untagged images
    UNTAGGED_IMAGES=$(aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query 'imageDetails[?imageDigest != null && (imageTags == null || length(imageTags) == `0`)].imageDigest' \
        --output text)
    
    if [ -z "$UNTAGGED_IMAGES" ] || [ "$UNTAGGED_IMAGES" == "None" ]; then
        echo -e "${GREEN}✅ No untagged images found${NC}"
        return
    fi
    
    # Convert to array
    IFS=$'\t' read -ra DIGEST_ARRAY <<< "$UNTAGGED_IMAGES"
    UNTAGGED_COUNT=${#DIGEST_ARRAY[@]}
    
    echo "Found $UNTAGGED_COUNT untagged images"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN - Would delete $UNTAGGED_COUNT untagged images${NC}"
        return
    fi
    
    # Confirm deletion
    echo -e "${RED}⚠️  This will permanently delete $UNTAGGED_COUNT untagged images${NC}"
    read -p "Delete untagged images? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleanup cancelled${NC}"
        return
    fi
    
    # Delete in batches
    BATCH_SIZE=10
    DELETED_COUNT=0
    
    for ((i=0; i<${#DIGEST_ARRAY[@]}; i+=BATCH_SIZE)); do
        BATCH=(${DIGEST_ARRAY[@]:$i:$BATCH_SIZE})
        
        # Build imageIds JSON
        IMAGE_IDS=""
        for digest in "${BATCH[@]}"; do
            if [ -n "$IMAGE_IDS" ]; then
                IMAGE_IDS="$IMAGE_IDS,"
            fi
            IMAGE_IDS="$IMAGE_IDS{\"imageDigest\":\"$digest\"}"
        done
        
        echo "Deleting batch of ${#BATCH[@]} untagged images..."
        
        aws ecr batch-delete-image \
            --repository-name $REPOSITORY_NAME \
            --region $REGION \
            --image-ids "[$IMAGE_IDS]" \
            --output table
        
        DELETED_COUNT=$((DELETED_COUNT + ${#BATCH[@]}))
        echo "Progress: $DELETED_COUNT/$UNTAGGED_COUNT deleted"
        
        sleep 1
    done
    
    echo -e "${GREEN}✅ Successfully deleted $DELETED_COUNT untagged images${NC}"
}

# Function to keep only N most recent images
keep_recent_only() {
    local KEEP_COUNT=$1
    local DRY_RUN=$2
    
    if [ -z "$KEEP_COUNT" ]; then
        KEEP_COUNT=10
    fi
    
    echo -e "${BLUE}📦 Keeping only $KEEP_COUNT most recent images${NC}"
    
    # Get all images sorted by push date (newest first)
    TOTAL_COUNT=$(get_image_count)
    
    if [ "$TOTAL_COUNT" -le "$KEEP_COUNT" ]; then
        echo -e "${GREEN}✅ Only $TOTAL_COUNT images exist, nothing to delete${NC}"
        return
    fi
    
    DELETE_COUNT=$((TOTAL_COUNT - KEEP_COUNT))
    
    # Get images to delete (oldest ones)
    IMAGES_TO_DELETE=$(aws ecr describe-images \
        --repository-name $REPOSITORY_NAME \
        --region $REGION \
        --query "sort_by(imageDetails, &imagePushedAt)[0:$DELETE_COUNT].imageDigest" \
        --output text)
    
    if [ -z "$IMAGES_TO_DELETE" ] || [ "$IMAGES_TO_DELETE" == "None" ]; then
        echo -e "${GREEN}✅ No images to delete${NC}"
        return
    fi
    
    echo "Will delete $DELETE_COUNT oldest images, keeping $KEEP_COUNT newest"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN - Would delete $DELETE_COUNT images${NC}"
        return
    fi
    
    # Confirm deletion
    echo -e "${RED}⚠️  This will permanently delete $DELETE_COUNT images${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleanup cancelled${NC}"
        return
    fi
    
    # Delete in batches
    IFS=$'\t' read -ra DIGEST_ARRAY <<< "$IMAGES_TO_DELETE"
    BATCH_SIZE=10
    DELETED_COUNT=0
    
    for ((i=0; i<${#DIGEST_ARRAY[@]}; i+=BATCH_SIZE)); do
        BATCH=(${DIGEST_ARRAY[@]:$i:$BATCH_SIZE})
        
        IMAGE_IDS=""
        for digest in "${BATCH[@]}"; do
            if [ -n "$IMAGE_IDS" ]; then
                IMAGE_IDS="$IMAGE_IDS,"
            fi
            IMAGE_IDS="$IMAGE_IDS{\"imageDigest\":\"$digest\"}"
        done
        
        echo "Deleting batch of ${#BATCH[@]} images..."
        
        aws ecr batch-delete-image \
            --repository-name $REPOSITORY_NAME \
            --region $REGION \
            --image-ids "[$IMAGE_IDS]" \
            --output table
        
        DELETED_COUNT=$((DELETED_COUNT + ${#BATCH[@]}))
        echo "Progress: $DELETED_COUNT/$DELETE_COUNT deleted"
        
        sleep 1
    done
    
    echo -e "${GREEN}✅ Successfully deleted $DELETE_COUNT images, kept $KEEP_COUNT newest${NC}"
}

# Main menu
show_menu() {
    echo -e "${BLUE}🧹 ECR Cleanup Options:${NC}"
    echo "1. 📊 Show current inventory"
    echo "2. 🗑️  Delete images older than 30 days (SAFE)"
    echo "3. 🗑️  Delete images older than 7 days (AGGRESSIVE)"  
    echo "4. 🏷️  Delete untagged images only"
    echo "5. 📦 Keep only 10 most recent images"
    echo "6. 📦 Keep only 5 most recent images"
    echo "7. 🔍 Dry run - show what would be deleted (30 days)"
    echo "8. ❌ Exit"
    echo ""
}

# Main execution
main() {
    # Check for bc command (for cost calculation)
    if ! command -v bc &> /dev/null; then
        echo -e "${YELLOW}⚠️  'bc' command not found. Install with: sudo apt-get install bc${NC}"
    fi
    
    while true; do
        list_images_by_age
        show_menu
        
        read -p "Choose an option (1-8): " choice
        echo ""
        
        case $choice in
            1)
                # Already shown above
                ;;
            2)
                cleanup_old_images 30 false
                ;;
            3)
                cleanup_old_images 7 false
                ;;
            4)
                cleanup_untagged false
                ;;
            5)
                keep_recent_only 10 false
                ;;
            6)
                keep_recent_only 5 false
                ;;
            7)
                cleanup_old_images 30 true
                cleanup_untagged true
                ;;
            8)
                echo -e "${GREEN}👋 Cleanup complete!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option${NC}"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Run main function
main