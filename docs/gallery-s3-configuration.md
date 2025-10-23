# Gallery S3 Bucket Configuration

This document provides instructions for configuring the AWS S3 bucket used for the Wavelength Lore gallery feature.

## Prerequisites

- AWS CLI installed and configured
- Admin access to AWS account
- Access to the AWS Management Console

## Bucket Configuration

The gallery feature uses a dedicated S3 bucket named `wavelength-gallery-346923` for storing user gallery images.

### 1. Create the Bucket (if it doesn't exist)

```bash
# Create the bucket
aws s3 mb s3://wavelength-gallery-346923 --region us-east-1

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket wavelength-gallery-346923 \
  --versioning-configuration Status=Enabled
```

### 2. Configure Bucket Permissions

Use the provided script to configure the bucket policy and CORS settings:

```bash
# Run the configuration script
./scripts/configure-gallery-bucket.sh
```

This script will:
- Apply the bucket policy from `aws-policies/gallery-bucket-policy.json`
- Set up CORS configuration from `aws-policies/gallery-bucket-cors.json`
- Configure public access settings

### 3. Verify Bucket Configuration

Run the verification script to ensure the bucket is correctly configured:

```bash
# Run the verification script
node scripts/verify-gallery-bucket.js
```

This script performs a comprehensive test of bucket access including:
- Listing objects
- Uploading a test file
- Retrieving the test file
- Deleting the test file

### 4. IAM User Configuration

Ensure the IAM user has the appropriate permissions:

1. In the AWS Console, go to IAM → Users
2. Select the `wavelength-lore-app-user`
3. Add the policy from `aws-policies/gallery-user-policy.json` as an inline policy named "GalleryBucketAccess"

Alternatively, use the AWS CLI:

```bash
aws iam put-user-policy \
  --user-name wavelength-lore-app-user \
  --policy-name GalleryBucketAccess \
  --policy-document file://aws-policies/gallery-user-policy.json
```

## Environment Configuration

The application reads the following environment variables for gallery S3 access:

```
# Gallery S3 Configuration
GALLERY_S3_BUCKET=wavelength-gallery-346923
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
```

Note: The application will also check for `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` if the AWS-prefixed variables are not found.

## Troubleshooting

### Access Denied Errors

If you encounter "Access Denied" errors:

1. Verify the bucket policy allows access for your IAM user
2. Check that the IAM user has the appropriate permissions
3. Ensure the bucket's public access settings are correctly configured
4. Check that the correct AWS credentials are being used

### CORS Errors

If you encounter CORS errors when uploading or accessing files from the browser:

1. Verify that the CORS configuration has been applied
2. Check the browser's developer console for specific CORS error messages
3. Ensure the CORS configuration includes the appropriate origins, methods, and headers

### CDN Configuration

If using a CloudFront distribution in front of the S3 bucket:

1. Update the CDN URL in the .env file
2. Ensure the CloudFront distribution has the correct origin settings
3. Set the appropriate cache behaviors to forward headers and query strings

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/latest/userguide/Welcome.html)
- [S3 Bucket Policy Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html)