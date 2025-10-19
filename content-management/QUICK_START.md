# Quick Start Guide: Adding Content to Wavelength Lore

## 🚀 One-Command Setup

First time? Run this to set up the content management system:

```bash
chmod +x scripts/content-manager.js
chmod +x scripts/asset-manager.js  
chmod +x scripts/deploy-workflow.js
```

## 📺 Adding a New Season

```bash
# Interactive season creation
./scripts/content-manager.js add season

# Example workflow:
# 1. Enter season title: "Battle Chronicles"
# 2. Enter description: "The epic tales of the great battles..."
# 3. Enter YouTube playlist (optional)
# 4. Season files created automatically
```

Creates:
- `content/seasons/seasonX.yaml` with proper structure
- Auto-generated image URLs
- Empty episodes object ready for content

## 🎵 Adding Episodes to a Season

```bash
# Add episode to specific season
./scripts/content-manager.js add episode --season=2

# Interactive prompts for:
# - Episode title
# - Description
# - Keywords (comma-separated)
# - YouTube link
# - Story narrative
# - Song lyrics
```

Auto-generates:
- Episode numbers (episode1, episode2, etc.)
- Asset URLs for images and audio
- Proper YAML structure

## 👤 Adding Characters

```bash
# Create new character
./scripts/content-manager.js add character

# Prompts for:
# - Character ID (kebab-case)
# - Character name
# - Description
# - Type (hero/villain/neutral)
# - Keywords
```

Creates:
- `content/characters/character-name/character.yaml`
- Auto-generated image URLs
- Directory structure for assets

## 🗺️ Adding Locations

```bash
# Add new location to lore
./scripts/content-manager.js add location

# Automatically added to wavelength-lore.yaml
```

## 📚 Adding Lore (Objects, Villains, Concepts)

```bash
# Add lore items
./scripts/content-manager.js add lore

# Choose type: object/villain/concept
# Added to appropriate section in lore file
```

## 🖼️ Managing Assets

### Upload Images for an Episode

```bash
# Upload images from local directory
./scripts/asset-manager.js upload --type=images --path=./my-episode-images --target=season2/episode3

# What it does:
# - Creates multiple sizes (thumbnail, medium, large, hero)
# - Generates WebP and JPG formats
# - Optimizes quality and compression
# - Creates asset manifest
```

### Upload Audio Files

```bash
# Upload audio files
./scripts/asset-manager.js upload --type=audio --path=./my-audio --target=season2/episode3
```

### Generate Asset URLs for YAML

```bash
# Get URLs to copy into your content files
./scripts/asset-manager.js generate-urls --target=season2/episode3

# Outputs ready-to-copy YAML:
# carouselImages:
#   - https://df5sj8f594cdx.cloudfront.net/images/season2/episode3/image1.jpg
#   - https://df5sj8f594cdx.cloudfront.net/images/season2/episode3/image2.jpg
```

### Validate Assets

```bash
# Check for missing or orphaned assets
./scripts/asset-manager.js validate
```

## 🎨 AI Image Generation

### Generate Character Portraits
```bash
# AI-generated character portraits
./scripts/ai-image-generator.js character "Lucky" "mischievous leprechaun with green hat and twinkling eyes"

# Generate multiple variations
./scripts/ai-image-generator.js variations "Lucky the leprechaun portrait" --count=5 --style=fantasy-art
```

### Generate Location Scenes
```bash
# AI-generated location artwork
./scripts/ai-image-generator.js location "Emerald Grove" "mystical forest with glowing trees and fairy lights"

# Generate and upload automatically
./scripts/ai-image-generator.js workflow "magical crystal cave" "locations/crystal-cave" --count=3
```

### Custom AI Generation
```bash
# Generate any concept from text prompts
./scripts/ai-image-generator.js generate "magical sword glowing with ancient runes"

# High-quality artwork with custom settings
./scripts/ai-image-generator.js generate "epic dragon battle scene" --width=1920 --height=1080 --steps=60 --style=concept-art
```

## 🚀 Deploying Everything

### Quick Content-Only Deployment

```bash
# Deploy content changes (no assets)
./scripts/deploy-workflow.js --content
```

### Full Deployment with Assets

```bash
# Complete deployment pipeline
./scripts/deploy-workflow.js --full

# What it does:
# 1. Validates all content against schemas
# 2. Processes and syncs assets to CloudFront
# 3. Updates Firebase database
# 4. Commits and pushes to git
# 5. Triggers GitHub Actions build
# 6. Monitors deployment to production
```

### Custom Deployment

```bash
# Deploy with custom commit message
./scripts/deploy-workflow.js --full --message="Added Season 3 episodes"

# Skip git operations
./scripts/deploy-workflow.js --content --no-git

# Deploy assets only
./scripts/deploy-workflow.js --assets --sync
```

## 📋 Listing and Validation

```bash
# List all content
./scripts/content-manager.js list

# List specific type
./scripts/content-manager.js list seasons

# Validate all content
./scripts/content-manager.js validate
```

## 🔄 Typical Workflow

### 1. Create New Episode
```bash
# Add to existing season
./scripts/content-manager.js add episode --season=2
```

### 2. Prepare Assets
```bash
# Create local directory with images/audio
mkdir ./episode-assets
# Copy your files to ./episode-assets

# Upload and process
./scripts/asset-manager.js upload --type=images --path=./episode-assets --target=season2/episode4
```

### 3. Update Content with Asset URLs
```bash
# Get the URLs
./scripts/asset-manager.js generate-urls --target=season2/episode4

# Copy URLs into your season2.yaml file
# Edit content/seasons/season2.yaml and paste URLs
```

### 4. Deploy
```bash
# Full deployment
./scripts/deploy-workflow.js --full --message="Added Episode 4 to Season 2"
```

## 🆘 Troubleshooting

### Validation Errors
```bash
# See detailed validation errors
./scripts/content-manager.js validate
```

### Asset Issues
```bash
# Check for missing/orphaned assets
./scripts/asset-manager.js validate
```

### Git Issues
```bash
# Deploy without git operations
./scripts/deploy-workflow.js --content --no-git
```

### Deployment Issues
```bash
# Deploy without triggering production
./scripts/deploy-workflow.js --content --no-deploy
```

## 📁 File Structure Reference

```
content/
├── seasons/
│   ├── season1.yaml                 # Season with episodes
│   └── season2.yaml
├── characters/
│   ├── character-name/
│   │   └── character.yaml          # Individual character
│   └── another-character/
├── lore/
│   └── wavelength-lore.yaml        # All lore items
└── maps/

static/
├── images/
│   ├── seasons/season1/episode1/    # Episode images
│   ├── characters/character-name/   # Character images
│   └── locations/location-name/     # Location images
├── audio/
└── video/
```

## 🎯 Best Practices

1. **Always validate before deploying**
   ```bash
   ./scripts/content-manager.js validate
   ```

2. **Use descriptive commit messages**
   ```bash
   --message="Added Lucky the Leprechaun character with full gallery"
   ```

3. **Upload assets before updating content**
   - Upload images/audio first
   - Generate URLs second
   - Update YAML files third

4. **Test in staging first** (when available)
   ```bash
   ./scripts/deploy-workflow.js --staging
   ```

5. **Backup before major changes**
   ```bash
   git branch backup-before-season3
   ```

This system makes adding new content as simple as running a few commands and following the interactive prompts!