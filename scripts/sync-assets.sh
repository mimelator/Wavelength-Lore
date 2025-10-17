#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

# Define variables
BUCKET_NAME="wavelength-lore-bucket"
STATIC_DIR="static"
AWS_REGION="us-east-1"

# Sync the public directory to the S3 bucket, ignoring '.DS_Store' files
aws s3 sync $STATIC_DIR s3://$BUCKET_NAME/static/ --region $AWS_REGION --exact-timestamps --exclude ".DS_Store"

# Confirm the sync
if [ $? -eq 0 ]; then
  echo "Assets successfully synchronized to S3 bucket: $BUCKET_NAME/static/"
else
  echo "Failed to synchronize assets to S3 bucket."
fi