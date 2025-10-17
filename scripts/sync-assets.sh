#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

# Load environment variables safely
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Define variables
BUCKET_NAME="wavelength-lore-bucket"
STATIC_DIR="static"
AWS_REGION="us-east-1"

# Use app user credentials for main bucket access
if [ -n "$ACCESS_KEY_ID" ] && [ -n "$SECRET_ACCESS_KEY" ]; then
    # Explicitly export the credentials from .env to override any default AWS config
    export AWS_ACCESS_KEY_ID="$ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
    echo "Using AWS app user credentials for asset sync..."
else
    echo "Using default AWS credentials for asset sync..."
fi

# Sync the public directory to the S3 bucket, ignoring '.DS_Store' files
# Using cp --recursive instead of sync to avoid ListBucket requirement
aws s3 cp $STATIC_DIR s3://$BUCKET_NAME/static/ --region $AWS_REGION --recursive --exclude ".DS_Store"

# Confirm the sync
if [ $? -eq 0 ]; then
  echo "Assets successfully synchronized to S3 bucket: $BUCKET_NAME/static/"
else
  echo "Failed to synchronize assets to S3 bucket."
fi