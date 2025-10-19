# Wavelength Lore Content Management System

## 🎯 Overview

A complete, automated content management system designed to make adding seasons, episodes, characters, locations, lore, and media assets as easy as possible. This system provides:

- **Interactive CLI tools** for guided content creation
- **Automated asset processing** with optimization and CDN upload
- **Schema validation** to ensure data consistency
- **One-command deployment** with full pipeline automation
- **Git integration** with automated commits and deployment monitoring

## 🏗️ System Architecture

### Core Components

1. **Content Manager** (`scripts/content-manager.js`)
   - Interactive CLI for adding seasons, episodes, characters, locations, lore
   - Auto-generates proper IDs, file structures, and asset URLs
   - Template-based content creation with validation

2. **Asset Manager** (`scripts/asset-manager.js`)
   - Automated image optimization (multiple sizes, WebP conversion)
   - Audio/video processing and upload
   - CDN sync with CloudFront
   - Asset validation and orphan detection

3. **Deployment Workflow** (`scripts/deploy-workflow.js`)
   - Complete CI/CD pipeline automation
   - Content validation against JSON schemas
   - Firebase database updates
   - Git operations and GitHub Actions monitoring

4. **Validation Schemas** (`content-management/schemas/`)
   - JSON Schema validation for all content types
   - Ensures required fields, proper formats, and data consistency
   - Prevents deployment of invalid content

### Directory Structure

```
content-management/
├── README.md              # System overview
├── QUICK_START.md         # Quick start guide
├── schemas/               # Validation schemas
│   ├── season-schema.json
│   ├── character-schema.json
│   └── lore-schema.json
└── templates/             # Content templates
    ├── season-template.yaml
    ├── episode-template.yaml
    └── character-template.yaml

scripts/
├── content-manager.js     # Content creation CLI
├── asset-manager.js       # Asset processing CLI
└── deploy-workflow.js     # Deployment automation
```

## 🚀 Quick Commands Reference

### Adding Content
```bash
# New season
./scripts/content-manager.js add season

# New episode
./scripts/content-manager.js add episode --season=2

# New character
./scripts/content-manager.js add character

# New location
./scripts/content-manager.js add location

# New lore item
./scripts/content-manager.js add lore
```

### Managing Assets
```bash
# Upload images
./scripts/asset-manager.js upload --type=images --path=./images --target=season2/episode3

# Generate URLs for YAML
./scripts/asset-manager.js generate-urls --target=season2/episode3

# Validate assets
./scripts/asset-manager.js validate

# Sync to CloudFront
./scripts/asset-manager.js sync
```

### Deployment
```bash
# Content-only deployment
./scripts/deploy-workflow.js --content

# Full deployment with assets
./scripts/deploy-workflow.js --full

# Custom deployment
./scripts/deploy-workflow.js --full --message="Added Season 3"
```

## 🔄 Typical Workflow

1. **Create Content Structure**
   ```bash
   ./scripts/content-manager.js add episode --season=2
   ```

2. **Prepare and Upload Assets**
   ```bash
   # Organize your images/audio in a local folder
   ./scripts/asset-manager.js upload --type=images --path=./my-assets --target=season2/episode4
   ```

3. **Update Content with Asset URLs**
   ```bash
   # Get generated URLs
   ./scripts/asset-manager.js generate-urls --target=season2/episode4
   
   # Edit your season YAML file and paste the URLs
   ```

4. **Deploy Everything**
   ```bash
   ./scripts/deploy-workflow.js --full --message="Added Episode 4 with full media gallery"
   ```

## 📊 Features & Benefits

### Automated Content Creation
- **Interactive prompts** guide you through all required fields
- **Auto-generated IDs** ensure consistency and prevent conflicts
- **Template-based** creation maintains proper structure
- **Schema validation** catches errors before deployment

### Asset Management
- **Multi-format optimization** (WebP, JPG, multiple sizes)
- **CDN integration** with automatic URL generation
- **Batch processing** for multiple files
- **Validation tools** to catch missing or orphaned assets

### Deployment Automation
- **One-command deployment** handles the entire pipeline
- **Git integration** with automated commits and pushes
- **Build monitoring** with GitHub Actions integration
- **Production deployment** with App Runner monitoring

### Data Consistency
- **JSON Schema validation** for all content types
- **Relationship validation** between episodes, characters, locations
- **Required field enforcement** prevents incomplete content
- **Format validation** for URLs, dates, and other structured data

## 🛡️ Validation & Quality Assurance

The system includes comprehensive validation:

1. **Schema Validation**
   - All content validated against JSON schemas
   - Required fields enforced
   - Data types and formats checked

2. **Asset Validation**
   - Missing asset detection
   - Orphaned asset identification
   - URL accessibility checks

3. **Relationship Validation**
   - Episode-to-season relationships
   - Character-to-episode references
   - Location-to-content mappings

## 🔧 Customization

### Adding New Content Types
1. Create schema in `content-management/schemas/`
2. Add validation to `deploy-workflow.js`
3. Add creation command to `content-manager.js`
4. Create template in `content-management/templates/`

### Modifying Asset Processing
1. Update settings in `asset-manager.js`
2. Modify optimization parameters
3. Add new formats or sizes as needed

### Customizing Deployment
1. Modify workflow steps in `deploy-workflow.js`
2. Add environment-specific configurations
3. Integrate with additional services

## 📚 Documentation

- **README.md** - System overview and architecture
- **QUICK_START.md** - Step-by-step usage guide
- **Schema files** - Complete validation rules
- **Template files** - Content structure examples

## 🚀 Getting Started

1. **Set up permissions**
   ```bash
   chmod +x scripts/content-manager.js scripts/asset-manager.js scripts/deploy-workflow.js
   ```

2. **Create your first content**
   ```bash
   ./scripts/content-manager.js add episode --season=1
   ```

3. **Deploy when ready**
   ```bash
   ./scripts/deploy-workflow.js --content
   ```

This system transforms content management from a complex, error-prone process into a simple, guided workflow that ensures consistency and quality while saving significant time and effort.