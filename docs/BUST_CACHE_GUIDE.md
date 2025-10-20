# Cache Busting Guide

## Overview

The Wavelength Lore application has two types of caches:
1. **Local Application Cache** - In-memory cache of characters, lore, and episodes
2. **CloudFront CDN Cache** - Cached static assets (images, CSS, JS)

## Quick Usage

### Clear Local Caches Only (Recommended)
```bash
./scripts/bust-cache.sh --local
```

This clears the application's in-memory caches without requiring CloudFront configuration.

### Clear All Caches (Local + CDN)
```bash
./scripts/bust-cache.sh
```

**Note**: Requires `CLOUDFRONT_DISTRIBUTION_ID` to be set in `.env` file.

## Detailed Usage

### Using the Shell Script (bust-cache.sh)

```bash
# Clear all local caches
./scripts/bust-cache.sh --local

# Clear specific caches
./scripts/bust-cache.sh --local --characters
./scripts/bust-cache.sh --local --lore
./scripts/bust-cache.sh --local --episodes

# Clear and refresh from database
./scripts/bust-cache.sh --local --all --refresh

# Clear CloudFront CDN cache only
./scripts/bust-cache.sh --cdn

# Clear both local and CDN caches
./scripts/bust-cache.sh --local --cdn
```

### Using the Node.js Script Directly

```bash
# Clear all caches
node scripts/bust-cache.js

# Clear specific caches
node scripts/bust-cache.js --characters
node scripts/bust-cache.js --lore
node scripts/bust-cache.js --episodes

# Clear and refresh
node scripts/bust-cache.js --all --refresh
```

## CloudFront Configuration

### Problem

If you see this error:
```
❌ Failed to create CloudFront cache invalidation: Empty value provided for input HTTP label: DistributionId.
```

This means `CLOUDFRONT_DISTRIBUTION_ID` is not set in your `.env` file.

### Solution

#### Option 1: Find and Set Distribution ID

Run the helper script:
```bash
./scripts/find-cloudfront-id.sh
```

This will attempt to find your CloudFront distribution ID automatically, or provide instructions for finding it manually.

#### Option 2: Use Local Cache Only

If you don't need to invalidate CloudFront cache:
```bash
./scripts/bust-cache.sh --local
```

This is perfectly fine for most development use cases.

### Adding CloudFront Distribution ID

Once you have the distribution ID (format: `E1234567890ABC`), add it to your `.env` file:

```bash
# .env
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
```

## When to Use Cache Busting

### Local Cache
Clear when:
- You've updated data in Firebase directly
- Characters/lore/episodes aren't reflecting recent changes
- Testing new data structures
- Debugging cache-related issues

### CloudFront CDN Cache
Clear when:
- You've updated static assets (images, CSS, JS files)
- Images aren't updating on the frontend
- Users are seeing old versions of static content
- You've changed CDN origin configurations

## Troubleshooting

### "CLOUDFRONT_DISTRIBUTION_ID is not set"

**Solution**: Either:
1. Add the distribution ID to `.env` (see CloudFront Configuration above)
2. Use `--local` flag to skip CloudFront cache busting

### "Access denied" errors for CloudFront

**Problem**: Your AWS IAM user doesn't have `cloudfront:CreateInvalidation` permission.

**Solution**:
1. Use `--local` flag to skip CloudFront
2. Or add CloudFront permissions to your IAM user

### Caches not clearing

**For local cache**:
- Verify the scripts are running without errors
- Check that you're testing on the same server/environment
- Try using `--refresh` flag to force reload from database

**For CloudFront cache**:
- Invalidations can take 5-15 minutes to propagate
- Check AWS Console → CloudFront → Invalidations tab
- Verify the distribution ID is correct

## Examples

### Development Workflow
```bash
# After updating Firebase data
./scripts/bust-cache.sh --local --refresh

# After deploying new images
./scripts/bust-cache.sh --cdn

# Complete refresh of everything
./scripts/bust-cache.sh --local --cdn --refresh
```

### Production Deployment
```bash
# In GitHub Actions (automatic)
# CloudFront cache is invalidated automatically after successful deployment
# See: .github/workflows/docker-ecr-deploy.yml

# Manual production cache bust
./scripts/bust-cache.sh --local --cdn
```

## Architecture Notes

### Local Cache
- Stored in-memory in Node.js process
- Cleared on server restart
- Improves Firebase read performance
- Reduces Firebase costs

### CloudFront Cache
- Edge-cached static assets
- Default TTL: varies by file type
- Invalidations cost $0 for first 1,000 paths/month
- Additional paths: $0.005 per path

## Related Scripts

- `scripts/bust-cache.js` - Node.js local cache busting
- `scripts/bust-cache.sh` - Wrapper for local + CDN cache busting
- `scripts/cloudfront-cache-bust.js` - CloudFront invalidation
- `scripts/find-cloudfront-id.sh` - Helper to find distribution ID

## Environment Variables

```bash
# Required for CloudFront cache busting
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# CloudFront domain (used for reference)
CDN_URL=https://df5sj8f594cdx.cloudfront.net

# AWS credentials (for CloudFront operations)
ACCESS_KEY_ID=your-access-key
SECRET_ACCESS_KEY=your-secret-key
```

---

**Last Updated**: October 20, 2025
**Maintainer**: Development Team
