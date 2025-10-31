# 🎨 Asset Extraction Pipeline - Complete Guide

**GitHub Issue:** [#132](https://github.com/mimelator/Wavelength-Lore/issues/132) - Milestone 3.1  
**Status:** ✅ Complete and Ready to Use

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What Gets Extracted](#what-gets-extracted)
3. [Quick Start](#quick-start)
4. [Detailed Usage](#detailed-usage)
5. [Episode Creation Pipeline Integration](#episode-creation-pipeline-integration)
6. [Understanding the Asset Manifest](#understanding-the-asset-manifest)
7. [Use Cases & Examples](#use-cases--examples)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Topics](#advanced-topics)

---

## Overview

The Asset Extraction Pipeline automatically generates multiple sizes and formats of assets from your episode images. This saves you hours of manual image processing by creating:

- **Navigation Icons** - Multiple sizes for menus and headers
- **Badges** - Achievement and profile badges
- **Game Assets** - Sprites and backgrounds for Wavelength games

All assets are automatically uploaded to S3, organized by episode, and tracked in a comprehensive manifest.

---

## What Gets Extracted

### 📐 Navigation Icons

Three sizes are generated from your primary episode image:

| Size | Format | Usage |
|------|--------|-------|
| 64x64 | PNG | Menu items, small thumbnails |
| 128x128 | PNG | Header icons, medium displays |
| 256x256 | PNG | Feature displays, large previews |

### 🏆 Badges

Two badge variants are created:

| Size | Format | Usage |
|------|--------|-------|
| 512x512 | PNG | Achievement badges, high-quality displays |
| 128x128 | WebP | Profile badges, optimized for web |

### 🎮 Game Assets

Multiple game assets are extracted:

| Type | Size | Format | Usage |
|------|------|--------|-------|
| Sprite | 256x256 | PNG | Game character sprites (up to 3) |
| Background | 1920x1080 | JPG | Game level backgrounds |

---

## Quick Start

### Prerequisites

1. **Episode with Images**: Your episode must have at least one image
   - Images can be in `images`, `carouselImages`, or `approvedImages` fields
   - Images can be URLs (CloudFront/CDN), local paths, or data URLs

2. **S3 Configuration**: Ensure your `.env` has:
   ```bash
   AWS_REGION=us-east-1
   ACCESS_KEY_ID=your_key
   SECRET_ACCESS_KEY=your_secret
   S3_BUCKET_NAME=wavelength-lore-bucket
   ```

### Basic Usage

```bash
# Start the CLI
npm run cli

# Extract assets for an episode (with approval workflow)
wavelength> episodes extract s5e1
```

The pipeline will:
1. ✅ Load your episode and find all images
2. ✅ Generate all asset variants (stored temporarily)
3. ✅ Open a preview page in your browser showing all assets
4. ✅ Prompt you to approve/reject each asset in the CLI
5. ✅ Upload only approved assets to S3
6. ✅ Create an asset manifest with approved assets only
7. ✅ Show you a summary

**Important**: Asset extraction uses an **approval workflow** by default. You review and approve each extracted asset before it's saved. This ensures quality control and allows you to iterate on extractions.

---

## Detailed Usage

### Command Options

```bash
# Standard extraction (with approval workflow)
episodes extract <episode-id>

# Auto-approve all assets (skip approval step)
episodes extract <episode-id> --skip-approval
episodes extract <episode-id> --auto-approve

# Alternative command names
episodes assets <episode-id>
episodes extract-assets <episode-id>
```

### Episode ID Formats

The system accepts various episode ID formats:

```bash
# Season 5, Episode 1
episodes extract s5e1
episodes extract season-5-episode-1

# Season 4, Episode 9
episodes extract s4e9
```

### What Happens During Extraction

```
🎨 ASSET EXTRACTION PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Episode: S5E1 (s5e1)
Source images: 3
⚠️  Preview mode: Assets will NOT be uploaded until approved

📸 Processing primary image: /images/episodes/season-5/episode-1/image-1.png

[1/3] Extracting navigation icons...
   Generating 64x64 png icon (menu)...
   ✓ Generated 64x64 icon
   Generating 128x128 png icon (header)...
   ✓ Generated 128x128 icon
   Generating 256x256 png icon (feature)...
   ✓ Generated 256x256 icon

[2/3] Generating badges...
   Generating 512x512 png badge (achievement)...
   ✓ Generated 512x512 badge
   Generating 128x128 webp badge (profile)...
   ✓ Generated 128x128 badge

[3/3] Extracting game assets...
   Extracting sprite 1/3...
   ✓ Extracted sprite 1
   Extracting sprite 2/3...
   ✓ Extracted sprite 2
   Extracting background (1920x1080)...
   ✓ Extracted background

✅ 8 assets extracted and ready for review!

📋 Review & Approval Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖼️  Generating preview page...
✅ Preview opened in browser

💡 Review assets in the browser, then return here to approve/reject.

📋 Asset Approval (8 total)
You can:
  - Approve all: type "all" or "a"
  - Reject all: type "reject all" or "r"
  - Approve individually: type asset number or "y"
  - Reject: type "n"
  - Skip to save: type "save" or "done"

[1/8] Icon 64x64 (menu) - Approve? (y/n/all/r, default: y): y
✅ Approved: Icon 64x64 (menu)

[2/8] Icon 128x128 (header) - Approve? (y/n/all/r, default: y): y
✅ Approved: Icon 128x128 (header)

... (continue for all assets) ...

📊 Approval Summary:
   ✅ Approved: 6
   ❌ Rejected: 2

💾 Save 6 approved asset(s)? (y/n, default: y): y

💾 Saving approved assets...

✅ Approved assets saved!
   Navigation icons: 3
   Badges: 1
   Game assets: 2
   Manifest: /images/episodes/season-5/episode-1/assets/manifest.json

💡 You can run extraction again to regenerate rejected assets.
```

---

## Episode Creation Pipeline Integration

The asset extraction is **Step 6** of the 10-step episode creation pipeline.

### Using in Episode Creation Workflow

1. **Start Episode Creation**:
   ```bash
   npm run episode:create
   # OR
   npm run episode:cli
   ```

2. **Complete Steps 1-5**:
   - Step 1: Episode Metadata
   - Step 2: Song Upload
   - Step 3: Image Generation
   - Step 4: Video Generation (optional)
   - Step 5: Radio Player Integration

3. **Step 6: Asset Extraction** (Automatic)
   - The system will prompt you when ready
   - Uses images from Step 3 (approved images)
   - Confirmation required before extraction

4. **Continue with Steps 7-10**:
   - Step 7: Lore Registration
   - Step 8: Game Level Generation
   - Step 9: CTA Integration
   - Step 10: Social Media

### Manual Step Execution

If you want to run asset extraction independently:

```bash
npm run cli
wavelength> episodes extract s5e1
```

---

## Approval Workflow

The asset extraction pipeline uses an **approval workflow** to ensure quality control. Here's how it works:

### Step 1: Asset Extraction (Preview Mode)

When you run `episodes extract`, assets are generated but **not uploaded to S3**. Instead:
- All assets are stored in memory as image buffers
- A preview HTML page is generated with all assets
- The preview page opens in your browser automatically

### Step 2: Visual Review

The preview page shows:
- All extracted assets in a grid layout
- Asset type, size, and format information
- Click-to-toggle approval status (visual feedback)
- Summary counters for total, approved, and rejected assets

### Step 3: Interactive Approval

After reviewing in the browser, return to the CLI to approve/reject:

**Approval Options:**
- `y` or Enter: Approve the current asset
- `n`: Reject the current asset
- `all` or `a`: Approve all remaining assets
- `reject all` or `r`: Reject all remaining assets
- `save` or `done`: Skip remaining assets and save current approvals

### Step 4: Save Approved Assets

Only approved assets are:
- Uploaded to S3
- Added to the manifest
- Saved to the episode record

### Iterating on Extractions

Since extraction isn't 100% reliable, you can iterate:

```bash
# First attempt - approve what you like
wavelength> episodes extract s5e1
# Review and approve 3 out of 8 assets

# Second attempt - regenerate rejected assets
wavelength> episodes extract s5e1
# Review and approve 2 more assets

# Continue until you're satisfied
```

**Note**: Each extraction regenerates ALL assets. You can approve different combinations on each run.

### Auto-Approve Mode

If you want to skip approval and auto-approve everything:

```bash
episodes extract s5e1 --skip-approval
```

This is useful for:
- Automated workflows
- Testing
- When you're confident in the extraction quality

## Understanding the Asset Manifest

Every extraction creates a manifest file that tracks all generated assets.

### Manifest Location

```
/images/episodes/season-{N}/episode-{N}/assets/manifest.json
```

### Manifest Structure

```json
{
  "episodeId": "s5e1",
  "season": 5,
  "episodeNumber": 1,
  "extractedAt": "2025-01-15T10:30:00.000Z",
  "assets": {
    "navigationIcons": [
      {
        "size": "64x64",
        "format": "png",
        "usage": "menu",
        "path": "/images/episodes/season-5/episode-1/assets/icons/icon-64x64.png",
        "url": "https://df5sj8f594cdx.cloudfront.net/images/episodes/season-5/episode-1/assets/icons/icon-64x64.png",
        "s3Key": "images/episodes/season-5/episode-1/assets/icons/icon-64x64.png"
      },
      // ... more icons
    ],
    "badges": [
      {
        "size": "512x512",
        "format": "png",
        "usage": "achievement",
        "path": "/images/episodes/season-5/episode-1/assets/badges/badge-512x512.png",
        "url": "https://df5sj8f594cdx.cloudfront.net/images/episodes/season-5/episode-1/assets/badges/badge-512x512.png",
        "s3Key": "images/episodes/season-5/episode-1/assets/badges/badge-512x512.png"
      },
      // ... more badges
    ],
    "gameAssets": [
      {
        "type": "sprite",
        "index": 1,
        "size": "256x256",
        "format": "png",
        "path": "/images/episodes/season-5/episode-1/assets/game/sprites/sprite-1.png",
        "url": "https://df5sj8f594cdx.cloudfront.net/images/episodes/season-5/episode-1/assets/game/sprites/sprite-1.png",
        "s3Key": "images/episodes/season-5/episode-1/assets/game/sprites/sprite-1.png",
        "sourceImage": "/images/episodes/season-5/episode-1/image-1.png"
      },
      // ... more game assets
    ]
  },
  "sourceImages": [
    {
      "original": "/images/episodes/season-5/episode-1/image-1.png",
      "processed": true
    }
  ]
}
```

### Accessing the Manifest Programmatically

```javascript
const AssetExtractionService = require('./services/asset-extraction-service');

const service = new AssetExtractionService();
const manifest = await service.getManifest(5, 1);

console.log(`Found ${manifest.assets.navigationIcons.length} navigation icons`);
console.log(`Found ${manifest.assets.badges.length} badges`);
console.log(`Found ${manifest.assets.gameAssets.length} game assets`);
```

---

## Use Cases & Examples

### Use Case 1: New Episode Launch

**Scenario**: You've created a new episode and want all assets ready for publication.

```bash
# 1. Create episode
wavelength> episodes create "Frozen Peace"

# 2. Generate images (Step 3)
wavelength> edit s5e1
# Navigate to "Generate AI Image" option
# Generate 5-10 images and approve them

# 3. Extract assets
wavelength> episodes extract s5e1

# Result: All navigation icons, badges, and game assets ready!
```

### Use Case 2: Iterative Quality Improvement

**Scenario**: You want to extract assets multiple times, approving only the best results each time.

```bash
# 1. First extraction attempt
wavelength> episodes extract s5e1
# Review in browser, approve 4 out of 8 assets
# Save approved assets

# 2. Second extraction attempt (regenerates all assets)
wavelength> episodes extract s5e1
# Review in browser, approve 3 different assets
# Save approved assets

# 3. Third attempt if needed
wavelength> episodes extract s5e1
# Review and approve remaining assets you need

# Result: You've curated the best assets across multiple attempts!
```

### Use Case 3: Selective Asset Types

**Scenario**: You only want navigation icons, not badges or game assets.

```bash
# Extract assets
wavelength> episodes extract s5e1

# During approval:
# - Approve all navigation icons (3 assets)
# - Reject all badges (2 assets)
# - Reject all game assets (3 assets)

# Result: Only navigation icons saved to manifest!
```

### Use Case 4: Updating Existing Episode

**Scenario**: You've added new images to an existing episode and want fresh assets.

```bash
# 1. View current episode
wavelength> episodes view s4e9

# 2. Add new images (via image generation or upload)
wavelength> edit s4e9
# Navigate to "Manage Image Gallery"
# Add new approved images

# 3. Re-extract assets (this will regenerate all assets)
wavelength> episodes extract s4e9

# Result: New assets generated from updated images!
# Previous approved assets remain in manifest until you approve new ones
```

### Use Case 5: Batch Processing Multiple Episodes

**Scenario**: You want to extract assets for all episodes in a season.

```bash
# List all episodes in season 5
wavelength> episodes list --season=5

# For each episode:
wavelength> episodes extract s5e1
wavelength> episodes extract s5e2
wavelength> episodes extract s5e3
# ... and so on
```

### Use Case 6: Using Assets in Your Code

**Scenario**: You want to use extracted assets in your application.

```javascript
// Load manifest
const manifest = await assetService.getManifest(5, 1);

// Get navigation icon for menu
const menuIcon = manifest.assets.navigationIcons.find(
  icon => icon.usage === 'menu'
);
// menuIcon.url = "https://df5sj8f594cdx.cloudfront.net/..."

// Get achievement badge
const achievementBadge = manifest.assets.badges.find(
  badge => badge.usage === 'achievement'
);

// Get game sprites
const sprites = manifest.assets.gameAssets.filter(
  asset => asset.type === 'sprite'
);
```

---

## Troubleshooting

### Problem: "No images found in episode"

**Solution**: The episode needs images before extraction can work.

```bash
# Check if episode has images
wavelength> episodes view s5e1

# If no images, add them:
wavelength> edit s5e1
# Choose "Generate AI Image" or "Manage Image Gallery"
# Generate/upload images and approve them

# Then try extraction again
wavelength> episodes extract s5e1
```

### Problem: "S3 upload failed"

**Possible Causes**:
1. **Missing AWS credentials**: Check your `.env` file
2. **Incorrect bucket name**: Verify `S3_BUCKET_NAME` matches your actual bucket
3. **Permissions**: Ensure your AWS credentials have S3 write permissions

**Solution**:
```bash
# Verify environment variables
echo $S3_BUCKET_NAME
echo $AWS_REGION
echo $ACCESS_KEY_ID  # Should show first few characters

# Test S3 connection
# (Asset extraction will fail if S3 is not accessible)
```

### Problem: "Failed to load image"

**Possible Causes**:
1. Image URL is invalid or inaccessible
2. Image path is incorrect
3. Network issues preventing image download

**Solution**:
```bash
# Verify image URLs in episode
wavelength> episodes view s5e1
# Check the images array - URLs should be accessible

# For local paths, ensure they're absolute or relative to project root
# For URLs, ensure they're publicly accessible (CDN URLs work best)
```

### Problem: Assets generated but not visible on site

**Solution**: 
1. **Check if assets were approved**: Only approved assets are uploaded
2. **Check CloudFront cache**: Assets may be cached
3. **Verify paths**: Ensure CloudFront is configured to serve `/images/episodes/...`
4. **Check manifest**: Load manifest and verify asset URLs

```bash
# Verify assets exist in S3
# Check the manifest path shown after extraction

# Test a direct URL (from manifest)
curl https://df5sj8f594cdx.cloudfront.net/images/episodes/season-5/episode-1/assets/icons/icon-64x64.png
```

### Problem: Browser preview not opening

**Solution**: The preview file is created in your system temp directory. You can manually open it:

```bash
# On macOS/Linux, the path is shown in the CLI output
# Example: /var/folders/.../asset-preview-1234567890.html

# Open manually:
open /path/to/asset-preview-1234567890.html  # macOS
xdg-open /path/to/asset-preview-1234567890.html  # Linux
start /path/to/asset-preview-1234567890.html  # Windows
```

### Problem: Want to change approval after saving

**Solution**: Run extraction again and approve/reject different assets. The manifest will be updated with the new approved set.

```bash
# Re-run extraction
wavelength> episodes extract s5e1

# Approve different assets this time
# The manifest will be overwritten with new approved assets
```

### Problem: Image quality issues

**Solution**: 
- Use high-quality source images (at least 1024x1024)
- The system automatically maintains aspect ratios and uses center-fit cropping
- For best results, use square-ish images for icons/badges

---

## Advanced Topics

### Custom Asset Sizes

To add custom asset sizes, modify `services/asset-extraction-service.js`:

```javascript
// In constructor, modify assetSpecs:
this.assetSpecs = {
    navigationIcons: [
        { size: "64x64", format: "png", usage: "menu" },
        { size: "128x128", format: "png", usage: "header" },
        { size: "256x256", format: "png", usage: "feature" },
        // Add custom size:
        { size: "512x512", format: "png", usage: "hero" }
    ],
    // ... other specs
};
```

### Extracting from Specific Images

Currently, the pipeline uses:
- **Primary image** for navigation icons and badges
- **First 3 images** for sprites
- **Primary image** for background

To change this behavior, modify the `extractEpisodeAssets` method in `asset-extraction-service.js`.

### Output Directory Customization

By default, assets are uploaded to S3. To also save locally:

1. Modify `asset-extraction-service.js` to accept `outputDir` parameter
2. Add file system writes in addition to S3 uploads

### Integration with Game Systems

Extracted game assets can be integrated into:

- **Wavelength Gems** game engine
- **Screen Saver Mode** backgrounds
- **Game level generation** (Milestone 3.3)

Use the manifest to access asset URLs:

```javascript
const manifest = await assetService.getManifest(season, episodeNumber);
const background = manifest.assets.gameAssets.find(a => a.type === 'background');
// Use background.url in your game engine
```

---

## Best Practices

1. **Generate Images First**: Always have approved images before extracting assets
2. **Use High-Quality Sources**: Better source images = better extracted assets
3. **Check Manifest**: Always review the manifest after extraction to verify assets
4. **Organize by Episode**: Assets are automatically organized by season/episode - keep this structure
5. **Version Control**: If re-extracting, the system overwrites previous assets - back up manifests if needed

---

## Quick Reference

### CLI Commands

```bash
# Extract assets
episodes extract <episode-id>
episodes assets <episode-id>

# View episode (to check images)
episodes view <episode-id>

# List episodes
episodes list [--season=N]

# Help
episodes help
```

### Asset Locations in S3

```
images/episodes/season-{N}/episode-{N}/assets/
├── icons/          # Navigation icons
├── badges/         # Badge assets
├── game/           # Game assets
│   ├── sprites/
│   └── backgrounds/
└── manifest.json   # Asset manifest
```

### Manifest Access

```bash
# Via CloudFront URL
https://df5sj8f594cdx.cloudfront.net/images/episodes/season-{N}/episode-{N}/assets/manifest.json

# Via service
const manifest = await assetService.getManifest(season, episodeNumber);
```

---

## What's Next?

After asset extraction, you can:

1. **Use navigation icons** in your site menus and headers
2. **Display badges** in user profiles and achievements
3. **Integrate game assets** into Wavelength games
4. **Continue episode pipeline** to Step 7 (Lore Registration)

---

## Support

- **Issue Tracking**: [GitHub Issue #132](https://github.com/mimelator/Wavelength-Lore/issues/132)
- **Documentation**: See `docs/MILESTONE-3-IMPLEMENTATION-ASSESSMENT.md`
- **Code Location**: `services/asset-extraction-service.js`

---

**Happy Asset Extracting! 🎨✨**

