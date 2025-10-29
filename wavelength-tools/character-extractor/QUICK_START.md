# 🎭 Wavelength Character Extractor - Quick Start

## Single Character Extraction

### Focal Character (main subject)
```bash
npm run wavelength:extract-character -- \
  --image=your_image.jpg \
  --description="main character description"
```

### Background Character (small, hidden, or side character)
```bash
npm run wavelength:extract-character -- \
  --image=your_image.jpg \
  --description="character in background" \
  --crop
```

## With Custom Output Names

```bash
npm run wavelength:extract-character -- \
  --image=gallery/character.png \
  --description="elf with sword" \
  --character-id=elf-warrior \
  --output=elf_warrior.png
```

## Batch Processing

### Create Sample Config File
```bash
npm run wavelength:extract-batch-sample
```

This creates `character-extractions.csv` with examples

### Edit the CSV file
Format: `imagePath,description,characterId,outputName,crop`

Example:
```csv
# Focal characters
public/gallery/scene1.jpg,main elf character,focal-elf,elf_main.png,false

# Background characters
public/gallery/scene1.jpg,goblin hiding in tree,sneaky-goblin,goblin_hidden.png,true
public/gallery/scene1.jpg,wizard in distance,bg-wizard,wizard_bg.png,true
```

### Run Batch Extraction
```bash
npm run wavelength:extract-batch -- --config=character-extractions.csv
```

This will:
- Extract all characters listed in CSV
- Save results to `batch-manifest.json`
- Show summary of successes/failures

### Custom Manifest Location
```bash
npm run wavelength:extract-batch -- \
  --config=extractions.csv \
  --manifest=my-results.json
```

## Real-World Examples

### Extract focal elf from upscaled image
```bash
npm run wavelength:extract-character -- \
  --image=public/upscaled-images/upscaled-4fdbYxJHjEP4xksk9sgFE3lgYUs2-1761592747982.jpg \
  --description="elf character singing with guitar" \
  --character-id=focal-elf
```

### Extract sneaky goblin from tree
```bash
npm run wavelength:extract-character -- \
  --image=IceBlueGreed-19.png \
  --description="goblin peeking from tree" \
  --crop \
  --character-id=sneaky-goblin
```

### Extract multiple characters from scene
```bash
npm run wavelength:extract-character -- \
  --image=party_scene.jpg \
  --description="elf on left" \
  --crop \
  --character-id=left-elf

npm run wavelength:extract-character -- \
  --image=party_scene.jpg \
  --description="dwarf on right" \
  --crop \
  --character-id=right-dwarf
```

## Output Locations

- **Characters**: `wavelength-tools/assets/extracted-characters/`
- **Batch Results**: `batch-manifest.json` (in project root or custom path)

## Tips

1. **Use descriptive names** - "elf with sword" works better than just "elf"
2. **Always use `--crop` for background characters** - Makes extraction cleaner
3. **Test with `--silent` for scripts** - Reduces console spam
4. **Check batch-manifest.json** - See what succeeded/failed
5. **Reuse CSV configs** - Save configs for repeated character sets

## Help Commands

```bash
# Single character help
npm run wavelength:extract-character-help

# Single character examples
npm run wavelength:extract-character-examples

# Create batch sample
npm run wavelength:extract-batch-sample
```

## Troubleshooting

### "Character not detected"
- Try a more specific description
- Make sure image has the character visible
- Try without `--crop` first to see if it finds anything

### Small/blurry extraction
- Character is too small in original image
- Use `--crop` to focus on that region
- Or zoom/enhance the source image first

### Background not fully removed
- Description might be matching background elements
- Try different wording
- Use `--crop` to isolate character better

## Performance

- Single extraction: ~10-30 seconds
- Batch (10 characters): ~2-5 minutes
- No per-use costs (rembg is local)
- All processing happens on your machine
