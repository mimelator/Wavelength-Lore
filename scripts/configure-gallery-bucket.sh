#!/bin/bash

# Configure Gallery S3 Bucket Permissions and CORS
#
# This script updates the bucket policy and CORS configuration for the gallery bucket
# using the AWS CLI. It ensures proper permissions for gallery functionality.

# Set default AWS profile if not specified
AWS_PROFILE=${AWS_PROFILE:-"default"}
BUCKET_NAME=${BUCKET_NAME:-"wavelength-gallery-346923"}

echo "🔧 Configuring gallery S3 bucket: $BUCKET_NAME"
echo "⚙️ Using AWS profile: $AWS_PROFILE"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed or not in PATH"
    echo "Please install AWS CLI using: pip install awscli"
    exit 1
fi

# Verify bucket exists
echo "🔍 Verifying bucket exists..."
if ! aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "❌ Error: Bucket $BUCKET_NAME does not exist or you don't have access to it"
    echo "Please create the bucket first or check your credentials"
    exit 1
fi

echo "✅ Bucket verified"

# Apply bucket policy
echo "📝 Applying bucket policy..."
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://aws-policies/gallery-bucket-policy.json

if [ $? -eq 0 ]; then
    echo "✅ Bucket policy applied successfully"
else
    echo "❌ Failed to apply bucket policy"
fi

# Apply CORS configuration
echo "🌐 Applying CORS configuration..."
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://aws-policies/gallery-bucket-cors.json

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully"
else
    echo "❌ Failed to apply CORS configuration"
fi

# Set public access block settings
echo "🔒 Configuring public access settings..."
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if [ $? -eq 0 ]; then
    echo "✅ Public access settings configured"
else
    echo "❌ Failed to configure public access settings"
fi

echo ""
echo "🎉 Gallery S3 bucket configuration complete!"
echo "📄 Policy file: aws-policies/gallery-bucket-policy.json"
echo "📄 CORS configuration: aws-policies/gallery-bucket-cors.json"
echo ""
echo "Test your configuration with:"
echo "aws s3 ls s3://$BUCKET_NAME"
echo ""