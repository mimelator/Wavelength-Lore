# Firebase ↔️ YAML Synchronization

This document explains how to keep your Firebase database and YAML content files in sync.

## Overview

The Wavelength Lore system uses a dual-storage approach:
- **Firebase Realtime Database**: Live data used by the web application
- **YAML Files**: Source of truth for version control and backups

## Workflow

### 1. Editing Content (Firebase → YAML)

When you edit content through the web interface:

1. **Edit in Web UI** → Changes are saved to Firebase
2. **Export to YAML** → Run export script to update YAML files
3. **Commit to Git** → Version control your changes

```bash
# Export all content types
./scripts/export-to-yaml.sh

# Or export specific types
./scripts/export-to-yaml.sh seasons
./scripts/export-to-yaml.sh characters
./scripts/export-to-yaml.sh lore
./scripts/export-to-yaml.sh prompts
```

### 2. Importing Content (YAML → Firebase)

When YAML files are updated (manually or via pull):

```bash
# Import all YAML files to Firebase
npm run import-yaml

# Or use the direct script
node scripts/import-yaml-to-firebase.js
```

## Export Script

### Usage

```bash
# Export everything
node scripts/export-firebase-to-yaml.js

# Export specific type
node scripts/export-firebase-to-yaml.js --type=seasons
node scripts/export-firebase-to-yaml.js --type=characters
node scripts/export-firebase-to-yaml.js --type=lore
node scripts/export-firebase-to-yaml.js --type=prompts
```

### What Gets Exported

#### Seasons
- **Location**: `content/seasons/season{N}.yaml`
- **Data**: Episodes with titles, descriptions, keywords, images, audio, lyrics, carousel images

#### Characters
- **Location**: `content/characters/{category}/{category}.yaml`
- **Data**: Character profiles with descriptions, keywords, images, image galleries

#### Lore
- **Location**: `content/lore/wavelength-lore.yaml`
- **Data**: Lore items grouped by type (locations, objects, events, etc.)

#### Prompts
- **Location**: `content/prompts/prompts.yaml`
- **Data**: AI generation prompts with categories, keywords, tags, linked content

## Best Practices

### After Editing Content

1. **Test Changes** - Verify content appears correctly on the website
2. **Export to YAML** - Run `./scripts/export-to-yaml.sh`
3. **Review Changes** - Check git diff to see what changed
4. **Commit** - Add meaningful commit message

```bash
# After editing content via web UI
./scripts/export-to-yaml.sh

# Review changes
git diff content/

# Commit changes
git add content/
git commit -m "feat: Update Andrew's character with AI-generated images"
git push
```

### When Pulling Changes

1. **Pull Latest** - Get updates from git
2. **Import to Firebase** - Sync Firebase with YAML files
3. **Verify** - Check website for updates

```bash
git pull
npm run import-yaml
```

## Automation Ideas

### Git Hooks

Add a post-commit hook to remind you to export:

```bash
# .git/hooks/post-commit
#!/bin/bash
echo "💡 Remember to export changes to YAML if you edited via web UI"
echo "   Run: ./scripts/export-to-yaml.sh"
```

### Cron Jobs

Schedule regular exports to keep YAML files in sync:

```bash
# Export every hour
0 * * * * cd /path/to/Wavelength-Lore && node scripts/export-firebase-to-yaml.js >> logs/export.log 2>&1
```

### CI/CD Integration

In your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Import YAML to Firebase
  run: npm run import-yaml
  
- name: Export Firebase to YAML
  run: npm run export-yaml
  
- name: Commit Changes
  run: |
    git config user.name "CI Bot"
    git config user.email "ci@wavelength-lore.com"
    git add content/
    git commit -m "chore: Sync Firebase to YAML [skip ci]" || true
    git push
```

## Troubleshooting

### Export Fails

```bash
# Check Firebase credentials
echo $FIREBASE_SERVICE_ACCOUNT | jq .

# Verify database URL
echo $FIREBASE_DATABASE_URL

# Run with more verbose output
NODE_ENV=development node scripts/export-firebase-to-yaml.js
```

### Missing Data

If exported YAML is missing data:
1. Check Firebase database in console
2. Verify field names match expected schema
3. Check for permission issues (use admin utils)

### Merge Conflicts

When YAML files have conflicts:
1. Resolve conflicts in YAML files
2. Import resolved YAML to Firebase
3. Export again to ensure consistency

## Data Structure Reference

### Character Schema
```yaml
- id: character-id
  title: Character Name
  description: Character description
  keywords:
    - keyword1
    - keyword2
  image: /path/to/main/image.webp
  image_gallery:
    - /path/to/gallery/image1.webp
    - /path/to/gallery/image2.webp
```

### Episode Schema
```yaml
episode1:
  title: Episode Title
  description: Brief description
  keywords: [keyword1, keyword2]
  youtubeLink: https://youtu.be/...
  image: /path/to/image.webp
  audio: /path/to/audio.mp3
  carouselImages:
    - /path/to/image1.webp
    - /path/to/image2.webp
  story: |
    Multi-line story text
  lyrics: |
    Multi-line lyrics
```

### Lore Schema
```yaml
locations:
  - id: location-id
    title: Location Name
    type: place
    keywords: [keyword1, keyword2]
    description: Location description
    image: /path/to/image.webp
    image_gallery:
      - /path/to/image1.webp
```

### Prompt Schema
```yaml
- id: prompt-id
  title: Prompt Title
  content: Prompt text
  category: character|location|scene
  keywords: [keyword1, keyword2]
  tags: [tag1, tag2]
  active: true
  linkedContent:
    characters: [character-id]
    episodes: [episode-id]
  createdAt: 2025-01-01T00:00:00.000Z
  updatedAt: 2025-01-01T00:00:00.000Z
```

## See Also

- [AI Image Generation Integration](./AI_IMAGE_GENERATION_INTEGRATION.md)
- [Content Management Quick Start](../content-management/QUICK_START.md)
- [Prompt CRUD UI Documentation](./PROMPT_CRUD_UI.md)
