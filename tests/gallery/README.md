# Gallery Storage Testing Suite

This directory contains a comprehensive testing suite for validating the gallery storage functionality, including:

1. S3 storage integration
2. API endpoints for gallery operations
3. End-to-end workflow testing

## Test Types

### S3 Storage Tests (`s3-storage-tests.js`)

Tests direct interaction with S3 for gallery image storage:

- Image upload to S3
- CDN access verification
- Quota enforcement
- Image listing
- Image deletion
- Saving content images to gallery

### API Integration Tests (`api-integration-tests.js`)

Tests the API endpoints that handle gallery operations:

- Storage stats API
- Image upload API
- Image listing API
- Image deletion API

### End-to-End Tests (`end-to-end-tests.js`)

Tests the complete user workflow:

1. Upload an image through the API
2. Verify it was stored in S3
3. Verify it can be accessed via the CDN
4. Verify it appears in the user's gallery list
5. Delete the image via the API
6. Verify it was removed from S3

## Running the Tests

Each test type has a dedicated runner script in the `scripts/` directory:

### S3 Storage Tests

```bash
node scripts/test-gallery-s3-storage.js
```

Required environment variables:
- `AWS_REGION`: The AWS region of your S3 bucket
- `ACCESS_KEY_ID`: AWS access key with S3 permissions
- `SECRET_ACCESS_KEY`: AWS secret key with S3 permissions
- `S3_BUCKET_NAME`: The S3 bucket name used for gallery storage
- `CDN_URL`: The domain of your CDN serving the images

### API Integration Tests

```bash
node scripts/test-gallery-api-integration.js
```

Required environment variables:
- `API_BASE_URL`: The base URL of the API (default: http://localhost:3001)
- `SESSION_COOKIE`: A valid Firebase auth session token

### End-to-End Tests

```bash
node scripts/test-gallery-end-to-end.js
```

Required environment variables:
- `API_BASE_URL`: The base URL of the API (default: http://localhost:3001)
- `SESSION_COOKIE`: A valid Firebase auth session token
- `AWS_REGION`: The AWS region of your S3 bucket
- `ACCESS_KEY_ID`: AWS access key with S3 permissions
- `SECRET_ACCESS_KEY`: AWS secret key with S3 permissions
- `S3_BUCKET_NAME`: The S3 bucket name used for gallery storage
- `CDN_URL`: The domain of your CDN serving the images

## Environment Setup

The tests use the project's main `.env` file for AWS credentials and other common settings. 
However, you'll need to create a test-specific `.env.test` file in the project root with the following variables:

```
# Test-specific environment variables
# This file contains variables needed for the gallery test suite

# API endpoint (default: http://localhost:3001)
API_BASE_URL=http://localhost:3001

# Authentication
SESSION_COOKIE=your_firebase_session_token_here

# S3 Storage (if not already defined in main .env)
S3_BUCKET_NAME=your_gallery_bucket_name
CDN_URL=your_cdn_url
```

A template for this file is provided as `.env.test.example` in the project root.

### Getting a Session Cookie

To obtain a valid session cookie for testing:

1. Log in to your application in a browser
2. Open the developer tools (F12)
3. Go to the Application tab
4. Under Cookies, find the `__session` cookie
5. Copy the value and use it as `SESSION_COOKIE`

## Test Fixtures

The tests will automatically create any necessary test files in the `tests/fixtures/` directory.

## Best Practices

- Run tests in a development environment first
- Never run tests against production data without backup
- Run the end-to-end tests less frequently as they create and delete real resources

## Understanding CDN Integration

The gallery uses AWS CloudFront as a CDN for serving images. Here's how the integration works:

1. **Architecture**:
   - S3 bucket (`wavelength-gallery-346923`) stores the actual image files
   - CloudFront (`d3ohg9sf8htmwk.cloudfront.net`) serves as a content delivery network in front of this bucket
   - Origin Access Control (OAC) restricts direct S3 access, requiring requests to go through CloudFront

2. **Expected Behavior**:
   - In production, users access images through the application UI
   - The application shows only images users have permission to see
   - Images are served via CloudFront for performance and caching benefits
   - Direct access to CloudFront URLs may be restricted based on configuration

3. **Test Environment Considerations**:
   - Direct CDN access returns 403 Forbidden in test environment due to CloudFront OAC settings
   - This is expected and doesn't indicate a problem with the gallery functionality
   - Tests focus on verifying proper S3 storage and URL structure

## Troubleshooting

If tests fail, check:

1. AWS credentials and permissions
2. S3 bucket existence and access
3. CDN configuration 
   - Note: 403 Forbidden errors when accessing CDN URLs directly are expected and don't indicate a failure
   - The CDN is secured with Origin Access Control (OAC)
4. API server is running (for API and E2E tests)
5. Session cookie validity
6. API endpoint consistency (some endpoints use `/api/gallery/*` while others use `/gallery/api/*`)

## Extending the Tests

To add new tests:

1. Add test functions to the appropriate test file
2. Export the new functions
3. Update the corresponding runner script if necessary