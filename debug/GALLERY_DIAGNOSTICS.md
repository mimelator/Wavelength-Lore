# Gallery Diagnostics Tools

This directory contains diagnostics tools to troubleshoot issues with the photo gallery feature.

## Overview of the Issue

**Problem:** Users are receiving "successfully saved to gallery" confirmations, but the images are not appearing in their gallery and don't seem to be uploading properly to S3.

## Diagnostic Tools Available

### 1. Server-side Diagnostics

#### S3 Connection Test (`debug/gallery-upload-diagnostics.js`)

This comprehensive diagnostic script checks all aspects of S3 integration:
- Verifies AWS credentials
- Tests bucket existence and permissions
- Tests image upload capability
- Validates the user directory creation 
- Tests CDN access to uploaded images

To run:
```bash
node debug/gallery-upload-diagnostics.js
```

#### Environment Checker (`scripts/check-gallery-env.js`)

This tool checks if all necessary environment variables are set properly:
- Verifies required AWS variables
- Offers to update .env file with missing settings
- Tests S3 connectivity with current settings

To run:
```bash
node scripts/check-gallery-env.js
```

#### End-to-End Upload Test (`scripts/test-gallery-upload-e2e.js`)

This script tests the entire upload flow from start to finish:
- Creates test images of known dimensions
- Uploads via the API
- Verifies they appear in the user's gallery
- Can clean up after the test

To run:
```bash
node scripts/test-gallery-upload-e2e.js
```

### 2. Client-side Diagnostics

#### Gallery Debug Tools (`static/js/gallery-debug-tools.js`)

These are client-side diagnostics that enhance browser debugging:
- Adds detailed console logging for gallery operations
- Monitors AJAX calls related to gallery functionality
- Shows visual debugging information for uploads
- Tests CDN connectivity

The debug tools are automatically included in development mode and accessible via the "Debug Gallery" button in the bottom left corner.

## Enhanced Logging

We've added enhanced logging to the following files:

1. `utils/gallery/storage.js`
   - More detailed error handling for S3 operations
   - Verification after uploading files
   - Diagnostics for AWS credentials and permissions

2. `utils/gallery/helpers.js`
   - Improved validation for image downloads
   - Better error handling for the URL fetching process
   - Detailed logging throughout the process

## Common Issues and Solutions

### 1. Missing AWS Credentials

**Symptoms:**
- "successfully saved" message appears
- No images appear in gallery
- Server logs show credential errors

**Solution:**
- Run `node scripts/check-gallery-env.js` to verify AWS credentials
- Make sure `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` are properly set in your `.env` file
- AWS credentials should have S3 read/write permissions

### 2. S3 Bucket Issues

**Symptoms:**
- Upload seems to work but images don't appear
- S3 connection errors in logs

**Solution:**
- Verify the S3 bucket exists
- Ensure the bucket name in `.env` matches exactly
- Check the bucket policy allows the configured IAM user to write objects

### 3. CORS Configuration Issues

**Symptoms:**
- Images upload but don't load in the browser
- Console shows CORS errors when accessing images

**Solution:**
- Verify that your S3 bucket has proper CORS settings
- If using CloudFront, ensure it passes the CORS headers from S3
- Use the client-side Debug Gallery tool to test CORS configuration

### 4. File Permissions Issues

**Symptoms:**
- Some images upload but others fail
- Permission denied errors in logs

**Solution:**
- Check the IAM policy attached to your AWS credentials
- Ensure the policy allows `s3:PutObject` and `s3:GetObject` actions
- Review any bucket policies that might restrict uploads

## Next Steps

If you're still experiencing issues after using these tools, collect the following information for further debugging:

1. Output from `node debug/gallery-upload-diagnostics.js`
2. Screenshots of the Debug Gallery tool (all tabs)
3. Relevant server logs showing any errors
4. Environment details (OS, browser, Node.js version)

## Implementation Details

This diagnostic suite covers all aspects of the gallery system:

1. **Environment Configuration** - Verifies AWS credentials, bucket names, and environment setup
2. **Network Connectivity** - Tests connections to S3, API endpoints, and CDN
3. **Authentication** - Verifies user authentication is working properly
4. **Storage Operations** - Tests file uploads and downloads directly
5. **API Integration** - Checks all gallery API endpoints

## Advanced Debugging

For more advanced debugging options:

1. Enable AWS S3 access logging on your bucket
2. Check CloudWatch Logs if using AWS services
3. Use the AWS CLI to test operations directly:

```bash
aws s3 ls s3://your-bucket-name/images/gallery/ --profile your-profile
```

4. Monitor network traffic using browser dev tools for more insights