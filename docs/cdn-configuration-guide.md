# CDN Configuration Guide

This document provides information about the CloudFront CDN setup for Wavelength Lore and how to configure it properly, especially for CORS support.

## Current Configuration

The project uses AWS CloudFront as the CDN for serving gallery images and other static content. The CloudFront distribution is configured with:

- Distribution URL: `https://d3ohg9sf8htmwk.cloudfront.net`
- Origin: S3 bucket for Wavelength Lore
- Cache behavior: Optimized for image content
- Current CORS status: Limited CORS headers available

## CORS Configuration

Our CDN integration tests have shown that CORS headers are currently missing in the CloudFront responses. While this doesn't affect the basic functionality of the gallery feature, it could cause issues for cross-origin requests in certain scenarios.

### Why CORS is Important

CORS (Cross-Origin Resource Sharing) is essential when:
- The application loads resources from a different domain
- Client-side JavaScript needs to make requests to the CDN
- External sites need to embed or reference our CDN content

### How to Configure CORS

1. **Update S3 Bucket CORS Configuration**:
   ```bash
   aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://aws-policies/cloudfront-cors-config.json
   ```

2. **Configure CloudFront to Forward CORS Headers**:
   - Edit the CloudFront distribution
   - Under the cache behavior settings, set "Origin Request Policy" to include all origin headers
   - Create or select a response headers policy that includes CORS headers
   - Update the distribution

3. **Verify CORS Configuration**:
   ```bash
   curl -I -H "Origin: http://example.com" https://d3ohg9sf8htmwk.cloudfront.net/sample-image.jpg
   ```
   The response should include headers like `Access-Control-Allow-Origin` and other CORS-related headers.

## Troubleshooting CORS Issues

If CORS issues persist after configuration:

1. **Check CloudFront Cache**: Invalidate the cache to ensure new headers are served
   ```bash
   aws cloudfront create-invalidation --distribution-id E2QFR8E7I4A6ZT --paths "/*"
   ```

2. **Verify S3 CORS Settings**: Make a direct request to the S3 bucket to confirm CORS headers are set correctly

3. **Review CloudFront Response Headers Policy**: Ensure the distribution is configured to forward and include the necessary CORS headers

4. **Test with Browser Network Tools**: Use browser developer tools to monitor CORS-related issues in the network requests

## Recommended CORS Settings

The provided `cloudfront-cors-config.json` includes sensible defaults for most use cases:

- Allows requests from any origin (`*`) - Can be restricted to specific domains
- Permits common HTTP methods (GET, PUT, POST, DELETE, HEAD)
- Exposes necessary headers like ETag and Content-Type
- Sets a reasonable cache time with MaxAgeSeconds

For production, consider restricting AllowedOrigins to only your application domains.