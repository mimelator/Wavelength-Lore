# Gallery S3 Storage Setup Guide

This guide explains how to set up and configure AWS S3 storage for the gallery feature with CloudFront CDN integration.

## Prerequisites

- AWS account with appropriate permissions
- AWS Access Key ID and Secret Access Key with S3 and CloudFront permissions
- Node.js installed

## Setup Process

### 1. Configure AWS Credentials

Ensure your AWS credentials are set in the `.env` file:

```
ACCESS_KEY_ID=your_aws_access_key_id
SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_preferred_region (e.g., us-west-2)
```

### 2. Run the Setup Script

The setup script will create and configure an S3 bucket and optionally set up a CloudFront distribution:

```bash
node scripts/setup-gallery-s3.js
```

The script will:
1. Create an S3 bucket with a unique name (or use an existing one)
2. Configure CORS settings to allow cross-origin requests
3. Set up a public access policy for the bucket
4. Optionally create a CloudFront distribution for CDN
5. Update your environment files with the bucket name and CDN URL

### 3. Verify the Configuration

After setup is complete, verify that everything is working correctly:

```bash
node scripts/verify-gallery-s3.js
```

This will run a series of tests to ensure:
- The S3 bucket exists and is accessible
- CORS is properly configured
- Public access is correctly set up
- Files can be uploaded and accessed via S3
- If CloudFront is configured, CDN access is working

## Configuration Details

### S3 Bucket Configuration

The S3 bucket is configured with:

#### CORS Policy
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

#### Public Access Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::bucket-name/*"]
    }
  ]
}
```

### CloudFront Configuration

The CloudFront distribution is configured with:

- Origin: Your S3 bucket
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Caching: Optimized for static content
- Price Class: 100 (Uses only North America and Europe edge locations)
- TLS/SSL: CloudFront default certificate

## Troubleshooting

### CloudFront Propagation Delays

After creating a new CloudFront distribution, it can take 10-30 minutes for it to fully deploy. During this time, the CDN URL may not work properly.

### CORS Issues

If you're experiencing CORS issues when accessing gallery images, verify the CORS configuration with:

```bash
node scripts/verify-gallery-s3.js
```

### Security Considerations

- The current setup allows public read access to the bucket for gallery images
- Make sure your S3 bucket name does not contain sensitive information
- Regularly review your AWS costs to ensure you're within budget

## Cleanup

To remove resources if needed, you'll need to:

1. Delete the CloudFront distribution (if created)
2. Delete the S3 bucket and its contents

These operations need to be done manually in the AWS console or using the AWS CLI to prevent accidental data loss.