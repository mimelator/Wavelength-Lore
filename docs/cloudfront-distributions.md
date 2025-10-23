# Managing Multiple CloudFront Distributions

This guide explains how to work with multiple CloudFront distributions in the Wavelength Lore project.

## CloudFront Distributions

The project now uses two CloudFront distributions:

1. **Primary Distribution** (`CLOUDFRONT_DISTRIBUTION_ID`)
   - This is the main CloudFront distribution for the Wavelength Lore website
   - Distribution ID: `E2QFR8E7I4A6ZT`

2. **Gallery Distribution** (`GALLERY_CLOUDFRONT_DISTRIBUTION_ID`)
   - This is the CloudFront distribution for the photo gallery
   - Distribution ID: `E27178HG3YCIMO`

## CloudFront Helper

The new CloudFront helper tool simplifies working with multiple distributions:

```bash
# List all configured distributions and their status
node scripts/cloudfront-helper.js list

# Get detailed information about a specific distribution
node scripts/cloudfront-helper.js details primary
node scripts/cloudfront-helper.js details gallery

# Run a script against a specific distribution
node scripts/cloudfront-helper.js run fix-orb-errors primary
node scripts/cloudfront-helper.js run update-cloudfront-distribution gallery
```

## Working with CloudFront Distributions

### Cache Invalidation

To invalidate the CloudFront cache:

```bash
# Invalidate primary distribution (default)
node scripts/cloudfront-cache-bust.js

# Invalidate gallery distribution 
node scripts/cloudfront-cache-bust.js --distribution gallery

# Invalidate specific paths
node scripts/cloudfront-cache-bust.js --paths "/,/images/*" --distribution gallery
```

### Fixing ORB Errors

To fix ERR_BLOCKED_BY_ORB errors in Chrome:

```bash
# Fix primary distribution
node scripts/fix-orb-errors.js primary

# Fix gallery distribution
node scripts/fix-orb-errors.js gallery
```

### Updating Distribution Configuration

To update a CloudFront distribution's configuration:

```bash
# Update primary distribution
node scripts/update-cloudfront-distribution.js primary

# Update gallery distribution
node scripts/update-cloudfront-distribution.js gallery
```

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```
# CloudFront Distribution IDs
CLOUDFRONT_DISTRIBUTION_ID=E2QFR8E7I4A6ZT
GALLERY_CLOUDFRONT_DISTRIBUTION_ID=E27178HG3YCIMO
```

## Configuration Structure

The CloudFront distributions are configured in `config/aws-resources.js` like this:

```javascript
cloudFront: {
  // Primary distribution (main site)
  primary: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    distributionDomain: '...',
    etag: '...'
  },
  // Gallery distribution (photo gallery)
  gallery: {
    distributionId: process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID,
    distributionDomain: 'd3ohg9sf8htmwk.cloudfront.net',
    etag: '...'
  },
  // Legacy field for backward compatibility
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID
}
```