# CloudFront Distribution Reconfiguration Guide

## Current Issue
Your CloudFront distribution `df5sj8f594cdx.cloudfront.net` is configured for the old `/static/` path structure, but your YAML files now use direct paths like `/images/`.

## Required Changes

### 1. Add Cache Behaviors for New Paths

You need to add the following cache behaviors to your CloudFront distribution:

#### A. Images Cache Behavior
```
Path Pattern: /images/*
Origin: Your existing S3 origin
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD
Cache Based on Selected Request Headers: None
Object Caching: Use Origin Cache Headers or Custom (24 hours default)
Forward Cookies: None
Query String Forwarding: No
Compress Objects Automatically: No (images are already compressed)
```

#### B. CSS Cache Behavior
```
Path Pattern: /css/*
Origin: Your existing S3 origin
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD
Cache Based on Selected Request Headers: None
Object Caching: Use Origin Cache Headers or Custom (24 hours default)
Forward Cookies: None
Query String Forwarding: No
Compress Objects Automatically: Yes
```

#### C. JavaScript Cache Behavior
```
Path Pattern: /js/*
Origin: Your existing S3 origin
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD
Cache Based on Selected Request Headers: None
Object Caching: Use Origin Cache Headers or Custom (24 hours default)
Forward Cookies: None
Query String Forwarding: No
Compress Objects Automatically: Yes
```

### 2. Methods to Update CloudFront

#### Option A: AWS Management Console
1. Go to AWS CloudFront Console
2. Find distribution `df5sj8f594cdx`
3. Go to "Behaviors" tab
4. Click "Create Behavior"
5. Add each of the three behaviors above
6. Deploy the distribution (15-20 minutes)

#### Option B: AWS CLI Commands

First, get the current configuration:
```bash
aws cloudfront get-distribution-config --id df5sj8f594cdx > current-config.json
```

Then update with the new behaviors and apply:
```bash
aws cloudfront update-distribution --id df5sj8f594cdx --distribution-config file://updated-config.json --if-match [ETAG]
```

#### Option C: Terraform (if you use IaC)
```hcl
resource "aws_cloudfront_distribution" "wavelength_cdn" {
  # ... existing configuration ...
  
  # Add these ordered cache behaviors
  ordered_cache_behavior {
    path_pattern           = "/images/*"
    target_origin_id       = "your-s3-origin-id"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = false
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  ordered_cache_behavior {
    path_pattern           = "/css/*"
    target_origin_id       = "your-s3-origin-id"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  ordered_cache_behavior {
    path_pattern           = "/js/*"
    target_origin_id       = "your-s3-origin-id"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
}
```

### 3. S3 Origin Configuration

Ensure your S3 bucket is configured to serve files from the root:
- Origin Path should be empty (not `/static`)
- Or if you use Origin Path, make sure it matches your file structure

### 4. File Upload Requirements

After CloudFront is configured, ensure your S3 bucket has files at the correct paths:
```
s3://your-bucket/images/characters/lucky/lucky_profile.jpg
s3://your-bucket/css/styles.css
s3://your-bucket/js/map-modal-fix.js
```

NOT:
```
s3://your-bucket/static/images/characters/lucky/lucky_profile.jpg
```

### 5. Testing After Changes

Once CloudFront is updated and deployed:
1. Wait 15-20 minutes for propagation
2. Test these URLs directly:
   - `https://df5sj8f594cdx.cloudfront.net/images/characters/lucky/lucky_profile.jpg`
   - `https://df5sj8f594cdx.cloudfront.net/css/styles.css`
   - `https://df5sj8f594cdx.cloudfront.net/js/map-modal-fix.js`

### 6. Validation

Run our validation script after changes:
```bash
node scripts/test-cdn-paths.js
```

## Timeline
- Configuration changes: 5-10 minutes
- CloudFront deployment: 15-20 minutes
- Total: ~30 minutes

## Rollback Plan
If issues occur, you can:
1. Switch back to localhost CDN: `CDN_URL=http://localhost:3001`
2. Remove the new cache behaviors from CloudFront
3. Or revert YAML files to use `/static/` paths