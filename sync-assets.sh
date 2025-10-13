#!/bin/bash

# Define variables
BUCKET_NAME="wavelength-lore-bucket"
PUBLIC_DIR="public"
AWS_REGION="us-east-1"

# Sync the public directory to the S3 bucket
aws s3 sync $PUBLIC_DIR s3://$BUCKET_NAME/static/ --region $AWS_REGION

# Confirm the sync
if [ $? -eq 0 ]; then
  echo "Assets successfully synchronized to S3 bucket: $BUCKET_NAME/static/"
else
  echo "Failed to synchronize assets to S3 bucket."
fi