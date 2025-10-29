# 🎭 Character Extractor - Convenience Features

## Overview

Your character extractor now has several convenience features to make frequent extraction **fast and effortless**:

---

## 1. 🚀 Quick Start Guide

**File**: `QUICK_START.md`

Common commands and examples for everyday use:
- Single character extraction
- Batch processing
- Real-world examples
- Troubleshooting tips

```bash
cat wavelength-tools/character-extractor/QUICK_START.md
```

---

## 2. 📦 Batch Processing

Extract **multiple characters at once** using a CSV config file.

### Create Sample Config
```bash
npm run wavelength:extract-batch-sample
```

This creates `character-extractions.csv` with examples.

### CSV Format
```
imagePath,description,characterId,outputName,crop
public/gallery/scene.jpg,elf character,elf-1,elf_1.png,false
public/gallery/scene.jpg,goblin hidden,goblin-1,goblin_1.png,true
```

### Run Batch Extraction
```bash
npm run wavelength:extract-batch -- --config=character-extractions.csv
```

### Results Manifest
Automatically creates `batch-manifest.json` with:
- Total/successful/failed counts
- Success rate percentage
- Path to each extracted character
- Confidence levels

Example output:
```json
{
  "timestamp": "2025-10-29T08:24:37.435Z",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "successRate": "100.0%"
  },
  "characters": [
    {
      "characterId": "elf-1",
      "success": true,
      "outputPath": "...",
      "confidence": "high"
    }
  ]
}
```

---

## 3. 📋 Character Profiles

**File**: `profiles.json`

Pre-defined profiles for frequently-extracted characters:

```json
{
  "focal-elf": {
    "description": "Main elf character singing with guitar",
    "crop": false,
    "outputName": "focal_elf.png"
  },
  "sneaky-goblin": {
    "description": "Goblin peeking from tree right side",
    "crop": true,
    "outputName": "sneaky_goblin.png"
  }
}
```

**Use for**: Storing character metadata and quick reference.

---

## 4. 🎯 Quick Commands

Save frequently-used commands in `profiles.json`:

```json
{
  "quick-commands": {
    "extract-goblin": "npm run wavelength:extract-character -- --image=IceBlueGreed-19.png --description='goblin peeking from tree' --crop --character-id=sneaky-goblin",
    "extract-focal": "npm run wavelength:extract-character -- --image=scene.jpg --description='elf character' --character-id=elf-1",
    "batch-test": "npm run wavelength:extract-batch -- --config=character-extractions-test.csv"
  }
}
```

**Use for**: Copy-paste commands that you run frequently.

---

## 5. 📂 Output Organization

All extracted characters go to:
```
wavelength-tools/assets/extracted-characters/
```

**Batch results**: `batch-manifest.json` (configurable location)

---

## Typical Workflow

### First Time Setup
```bash
# Create sample batch config
npm run wavelength:extract-batch-sample

# Edit character-extractions.csv with your scenes
nano character-extractions.csv

# Run batch extraction
npm run wavelength:extract-batch -- --config=character-extractions.csv

# Check results
cat batch-manifest.json
```

### Regular Workflow
```bash
# Extract one character
npm run wavelength:extract-character -- \
  --image=scene.jpg \
  --description="character description" \
  --crop \
  --character-id=my-char

# Or batch extract (after CSV is set up)
npm run wavelength:extract-batch -- --config=character-extractions.csv
```

### Batch with Custom Output
```bash
npm run wavelength:extract-batch -- \
  --config=my-characters.csv \
  --manifest=my-results.json
```

---

## Available npm Commands

```bash
# Single extraction
npm run wavelength:extract-character

# Single extraction help
npm run wavelength:extract-character-help
npm run wavelength:extract-character-examples

# Batch extraction
npm run wavelength:extract-batch
npm run wavelength:extract-batch-sample  # Create sample CSV
```

---

## Pro Tips

### 1. Reuse CSV Configs
Save successful CSV configs for repeated extractions:
```bash
# Save working config
cp character-extractions.csv configs/wavelength-characters.csv

# Use later
npm run wavelength:extract-batch -- --config=configs/wavelength-characters.csv
```

### 2. Organize by Scene
Create separate CSV files per scene:
```bash
character-extractions-iceblue-greed.csv
character-extractions-party-scene.csv
character-extractions-forest.csv
```

### 3. Copy Profiles File
Edit `profiles.json` to document your characters:
```json
{
  "profiles": {
    "sneaky-goblin": {
      "description": "Goblin from IceBlueGreed-19.png",
      "crop": true,
      "notes": "Very small, needs crop mode"
    }
  }
}
```

### 4. Batch Dry-Run
Test CSV formatting without extraction:
```bash
# Just load and validate CSV (future feature)
npm run wavelength:extract-batch -- --config=test.csv --validate-only
```

### 5. Silent Mode for Scripts
Use `--silent` flag in automation:
```bash
npm run wavelength:extract-batch -- \
  --config=characters.csv \
  --silent
```

---

## Output Examples

### Single Extraction
```
🎭 WAVELENGTH CHARACTER EXTRACTOR
📸 Image: scene.jpg
📝 Description: goblin character
🎯 Character ID: sneaky-goblin
✂️  Crop mode: ENABLED

[0/4] Checking dependencies...
[1/4] Detecting character with OpenAI Vision...
[2/4] Cropping to character region...
[3/4] Removing background with rembg...
[4/4] Extraction complete!

✅ SUCCESS!
📦 Output: /path/to/sneaky_goblin.png
📊 Confidence: high
```

### Batch Extraction
```
🎭 BATCH CHARACTER EXTRACTION
📊 Processing 3 characters...

[1/3] Extracting: elf-1
[2/3] Extracting: goblin-1
[3/3] Extracting: wizard-1

📊 BATCH EXTRACTION COMPLETE
✅ Successful: 3/3
❌ Failed: 0/3
📈 Success rate: 100.0%
✅ Manifest saved: batch-manifest.json
```

---

## Future Enhancement Ideas

- [ ] Profile CLI to manage character profiles
- [ ] Gallery auto-scan with AI-powered character detection
- [ ] Extraction history database
- [ ] Watermark/signature on extracted characters
- [ ] Character preview thumbnails
- [ ] Batch extraction from URL list
- [ ] Integration with asset management system

---

## Getting Help

```bash
# Quick start guide
cat wavelength-tools/character-extractor/QUICK_START.md

# Single character help
npm run wavelength:extract-character-help

# Examples
npm run wavelength:extract-character-examples

# Sample batch config
npm run wavelength:extract-batch-sample
```
