#!/bin/bash

# Define variables
DISTRIBUTION_ID="E2QFR8E7I4A6ZT"
AWS_REGION="us-east-1"

# Invalidate the CloudFront cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Confirm the invalidation
if [ $? -eq 0 ]; then
  echo "Assets successfully create-invalidation to CloudFront distribution: $DISTRIBUTION_ID"
else
  echo "Failed to create-invalidation to CloudFront distribution."
fi