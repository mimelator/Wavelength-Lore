# Export Firebase to YAML - Quick Reference

## Quick Commands

```bash
# Export all content
npm run export:yaml

# Export specific types
npm run export:seasons
npm run export:characters
npm run export:lore
npm run export:prompts

# Using shell script
./scripts/export-to-yaml.sh [all|seasons|characters|lore|prompts]
```

## When to Export

Export your Firebase data to YAML files whenever you:

- ✅ Add/edit content via the web interface
- ✅ Generate AI images and add them to galleries
- ✅ Update character descriptions or keywords
- ✅ Modify episode details, lyrics, or carousel images
- ✅ Create or edit AI generation prompts
- ✅ Update lore items

## What Gets Exported

| Type | Files | Content |
|------|-------|---------|
| **Seasons** | `content/seasons/season{N}.yaml` | Episodes with all metadata, images, audio, lyrics |
| **Characters** | `content/characters/{category}/{category}.yaml` | Character profiles with galleries (including AI-generated images) |
| **Lore** | `content/lore/wavelength-lore.yaml` | Lore items grouped by type |
| **Prompts** | `content/prompts/prompts.yaml` | AI generation prompts with linked content |

## Workflow Example

### After Editing Content

```bash
# 1. Edit content via web UI at http://localhost:3001/edit/character/andrew
# 2. Generate and add AI images
# 3. Click Save

# 4. Export to YAML
npm run export:yaml

# 5. Check what changed
git diff content/

# 6. Commit changes
git add content/
git commit -m "feat: Add AI-generated images to Andrew's gallery"
git push
```

## Features

✅ **Preserves Structure** - YAML files maintain original formatting
✅ **Handles Arrays** - Properly exports image galleries, keywords, carousel images
✅ **Multi-line Text** - Preserves lyrics and story formatting
✅ **Selective Export** - Export only what you need
✅ **Safe Operation** - Backs up existing YAML before overwriting
✅ **CDN URLs** - Includes AI-generated image URLs from S3/CloudFront

## File Locations

All exported files are in the `content/` directory:

```
content/
├── seasons/
│   ├── season1.yaml
│   ├── season2.yaml
│   ├── season3.yaml
│   └── season4.yaml
├── characters/
│   └── wavelength/
│       └── wavelength.yaml
├── lore/
│   └── wavelength-lore.yaml
└── prompts/
    └── prompts.yaml
```

## See Full Documentation

For detailed information, see [FIREBASE_YAML_SYNC.md](./FIREBASE_YAML_SYNC.md)
