# Wavelength Lore Content Management System

A comprehensive system for easily adding and managing seasons, episodes, characters, locations, lore, and media assets.

## Quick Start

### Adding New Content

```bash
# Add a new season
./scripts/content-manager.js add season

# Add a new episode to existing season
./scripts/content-manager.js add episode --season=2

# Add a new character
./scripts/content-manager.js add character

# Add a new location
./scripts/content-manager.js add location

# Add lore (object, villain, concept)
./scripts/content-manager.js add lore

# Upload and optimize assets
./scripts/asset-manager.js upload --type=images --episode=season2/episode1
./scripts/asset-manager.js upload --type=audio --episode=season2/episode1
```

### Content Types

1. **Seasons** - Contains multiple episodes and metadata
2. **Episodes** - Individual songs/stories with media assets
3. **Characters** - People, creatures, entities in the story
4. **Locations** - Places in the world (Shire, Ice Fortress, etc.)
5. **Lore** - Objects, concepts, and world-building elements
6. **Assets** - Images, audio, video files

### Directory Structure

```
content/
├── seasons/
│   ├── season1.yaml            # Season metadata and episodes
│   ├── season2.yaml
│   └── templates/
│       ├── season-template.yaml
│       └── episode-template.yaml
├── characters/
│   ├── character-schema.yaml   # Schema definition
│   ├── wavelength/            # Individual character files
│   │   ├── character.yaml
│   │   └── images/
│   └── templates/
│       └── character-template.yaml
├── locations/
│   ├── location-schema.yaml
│   ├── the-shire.yaml
│   ├── ice-fortress.yaml
│   └── templates/
├── lore/
│   ├── wavelength-lore.yaml   # Combined lore file
│   ├── objects/               # Individual lore objects
│   ├── villains/
│   ├── concepts/
│   └── templates/
└── assets/
    ├── images/
    │   ├── seasons/
    │   ├── characters/
    │   └── locations/
    ├── audio/
    └── video/
```

## Automated Workflows

### 1. Content Creation
- Interactive prompts for all required fields
- Automatic ID generation and validation
- Template-based content generation
- Schema validation before saving

### 2. Asset Management
- Automatic image optimization and resizing
- CDN upload and URL generation
- Asset validation and format checking
- Batch upload capabilities

### 3. Database Sync
- Automatic Firebase population
- Content validation before deployment
- Rollback capabilities
- Environment-specific deployments

### 4. Deployment Pipeline
- Git integration with automatic commits
- Build validation and testing
- Staging deployment for review
- Production deployment with monitoring

## Content Validation

All content is validated against JSON schemas to ensure:
- Required fields are present
- Data types are correct
- Relationships between content are valid
- Asset URLs are accessible
- Keywords are properly formatted

## Asset Optimization

- **Images**: Auto-resize, format conversion (WebP), compression
- **Audio**: Format standardization, quality optimization
- **Video**: Compression, thumbnail generation
- **CDN**: Automatic upload to CloudFront with cache invalidation