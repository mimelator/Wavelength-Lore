# 🎭 Character Extractor - Cheatsheet

## One-Liner Commands

```bash
# Extract focal character
npm run wavelength:extract-character -- --image=scene.jpg --description="main character"

# Extract background character (cropped)
npm run wavelength:extract-character -- --image=scene.jpg --description="goblin hiding" --crop

# Extract with custom name
npm run wavelength:extract-character -- --image=scene.jpg --description="elf" --output=my_elf.png --character-id=elf-1

# Create batch config template
npm run wavelength:extract-batch-sample

# Run batch extraction
npm run wavelength:extract-batch -- --config=character-extractions.csv
```

## CSV Format (Batch Processing)

```
imagePath,description,characterId,outputName,crop
scene.jpg,main elf,focal-elf,elf_main.png,false
scene.jpg,hidden goblin,bg-goblin,goblin_hidden.png,true
```

## Key Options

| Flag | Purpose | Example |
|------|---------|---------|
| `-i, --image` | Source image path | `--image=scene.jpg` |
| `-d, --description` | What to extract | `--description="goblin"` |
| `-o, --output` | Output filename | `--output=my_char.png` |
| `-c, --character-id` | Character identifier | `--character-id=goblin-1` |
| `--crop` | Crop before extraction (for background chars) | `--crop` |
| `--silent` | No verbose output | `--silent` |

## Output Locations

- **Extracted characters**: `wavelength-tools/assets/extracted-characters/`
- **Batch results**: `batch-manifest.json`
- **Masks (reference)**: `wavelength-tools/assets/extraction-masks/`

## Common Workflows

### Extract One Character
```bash
npm run wavelength:extract-character -- \
  --image=my_image.jpg \
  --description="character description" \
  --crop \
  --character-id=my-char-name
```

### Extract Multiple (Batch)
```bash
# 1. Create config
npm run wavelength:extract-batch-sample

# 2. Edit character-extractions.csv

# 3. Run
npm run wavelength:extract-batch -- --config=character-extractions.csv

# 4. Check results
cat batch-manifest.json
```

### Extract from Group Scene
```bash
# Left character
npm run wavelength:extract-character -- --image=group.jpg --description="left elf" --crop --character-id=left-elf

# Right character
npm run wavelength:extract-character -- --image=group.jpg --description="right dwarf" --crop --character-id=right-dwarf
```

## When to Use `--crop`

✅ **Use `--crop` if:**
- Character is background/not focal point
- Character is small in the image
- Character is partially hidden (like goblin in tree)
- Character is on the side of a group scene

❌ **Don't use `--crop` if:**
- Character is main focal point
- Character fills most of the image
- Character is centered

## Tips & Tricks

1. **Descriptive names matter**: `"goblin peeking from tree"` > `"goblin"`
2. **Always test with one character first**: Before batch, test single extraction
3. **Save working CSV files**: Reuse successful configs
4. **Check manifest**: `batch-manifest.json` shows what succeeded/failed
5. **Use different CSV files per scene**: `chars-scene1.csv`, `chars-scene2.csv`

## Help Commands

```bash
npm run wavelength:extract-character-help        # Single char help
npm run wavelength:extract-character-examples    # Usage examples
npm run wavelength:extract-batch-sample          # Batch template
```

## File Reference

- **Core**: `wavelength-tools/character-extractor/CharacterExtractor.js`
- **CLI**: `wavelength-tools/character-extractor/cli.js`
- **Batch**: `wavelength-tools/character-extractor/batch-cli.js`
- **Batch Processor**: `wavelength-tools/character-extractor/batch-extractor.js`
- **Guides**:
  - `wavelength-tools/character-extractor/QUICK_START.md`
  - `wavelength-tools/character-extractor/CONVENIENCE_FEATURES.md`
- **Profiles**: `wavelength-tools/character-extractor/profiles.json`

## Real Examples

### Goblin from IceBlueGreed-19.png
```bash
npm run wavelength:extract-character -- \
  --image=IceBlueGreed-19.png \
  --description="goblin peeking from tree right side" \
  --crop \
  --character-id=sneaky-goblin
```

### Elf from upscaled image
```bash
npm run wavelength:extract-character -- \
  --image=public/upscaled-images/upscaled-4fdbYxJHjEP4xksk9sgFE3lgYUs2-1761592747982.jpg \
  --description="elf character singing with guitar" \
  --character-id=focal-elf
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Character not detected" | Try more specific description |
| Small/blurry result | Use `--crop` to isolate character |
| Background not removed | Try different wording in description |
| CSV not found | Check path is relative to project root |

## Results

Each extraction produces:
- ✅ Transparent PNG with alpha channel
- ✅ Auto-cropped to remove excess transparency
- ✅ True RGBA color mode
- ✅ Ready to use as asset

## Performance

- Single: ~10-30 seconds
- Batch (10 chars): ~2-5 minutes
- No API costs (rembg is local)
- All processing on your machine

---

**Ready to extract? Start with:**
```bash
npm run wavelength:extract-character -- --image=your_image.jpg --description="your character" --crop
```
