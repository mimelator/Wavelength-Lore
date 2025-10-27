#!/bin/bash

# Navigate to project root (1 level up from scripts/)
cd "$(dirname "$0")/.."

# Load environment variables safely
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Define variables - Use environment variables with fallbacks
BUCKET_NAME="${S3_BUCKET_NAME:-wavelength-lore-bucket}"
STATIC_DIR="static"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Use app user credentials for main bucket access
if [ -n "$ACCESS_KEY_ID" ] && [ -n "$SECRET_ACCESS_KEY" ]; then
    # Explicitly export the credentials from .env to override any default AWS config
    export AWS_ACCESS_KEY_ID="$ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
    echo "Using AWS app user credentials for asset sync..."
else
    echo "Using default AWS credentials for asset sync..."
fi

# Sync the static directory contents to the S3 bucket root, ignoring '.DS_Store' files
# This uploads css/, images/, js/, icons/, etc. directly to bucket root (not under /static/)
# Using cp --recursive instead of sync to avoid ListBucket requirement
aws s3 cp $STATIC_DIR s3://$BUCKET_NAME/ --region $AWS_REGION --recursive --exclude ".DS_Store"

# Confirm the sync
if [ $? -eq 0 ]; then
  echo "Assets successfully synchronized to S3 bucket root: $BUCKET_NAME/"
  echo "Files uploaded:"
  echo "  - css/ → s3://$BUCKET_NAME/css/"
  echo "  - images/ → s3://$BUCKET_NAME/images/"
  echo "  - js/ → s3://$BUCKET_NAME/js/"
  echo "  - icons/ → s3://$BUCKET_NAME/icons/"
  echo "  - fonts/ → s3://$BUCKET_NAME/fonts/"
else
  echo "Failed to synchronize assets to S3 bucket."
fi