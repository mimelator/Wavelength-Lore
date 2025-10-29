# 🎭 Wavelength NPC Icon Extractor

**Automatically extract character assets from images to create transparent PNG icons for the Wavelength Lore universe.**

> **Addresses GitHub Issue:** [#103 - NPC Icon Extraction](https://github.com/mimelator/Wavelength-Lore/issues/103)

## 🚀 Quick Start

```bash
# Show usage guide
npm run wavelength:extract-icons-help

# Show sample configuration
npm run wavelength:extract-icons-sample

# Run extraction tool
npm run wavelength:extract-icons
```

## 📁 Directory Structure

```
assets/
├── source-images/          ← Place original character images here
├── segmentation-masks/     ← Binary masks (simulation mode)
└── extracted-icons/        ← Output: transparent PNG icons
```

## 🧪 Simulation Mode (Current)

The tool currently runs in **simulation mode** using pre-created masks:

1. **Add source image:** `assets/source-images/goblin_king.png`
2. **Create binary mask:** `assets/segmentation-masks/goblin-king_mask.png`
   - **White pixels** = keep (character)
   - **Black pixels** = remove (background)
3. **Run extraction:** `npm run wavelength:extract-icons`
4. **Output:** `assets/extracted-icons/goblin_king_icon.png` (transparent PNG)

## 🤖 Production Mode (Future)

When you integrate with AI segmentation APIs:

1. Set environment variable: `SEGMENTATION_API_KEY`
2. Update API endpoint in `getSegmentationMask()` method
3. Only source images needed (masks generated automatically)

## 💡 Character Extraction Examples

### Goblin King
```json
{
  "sourceImage": "goblin_king.png",
  "characterId": "goblin-king", 
  "assetPrompt": "goblin head with crown",
  "outputName": "goblin_king_icon.png"
}
```

### Wavelength Hero
```json
{
  "sourceImage": "wavelength_hero.png",
  "characterId": "wavelength-hero",
  "assetPrompt": "main character face", 
  "outputName": "wavelength_hero_icon.png"
}
```

## 🔧 API Integration Points

### Segment Anything Model (SAM)
```javascript
// Replace simulation with real SAM API call
const response = await fetch('https://api.your-sam-service.com/segment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SAM_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image_data: base64Image,
    prompt: assetPrompt
  })
});
```

### Custom Computer Vision API
```javascript
// Generic CV API integration
const segmentationResult = await cvApi.segment({
  image: imageBuffer,
  prompt: 'extract goblin head',
  format: 'binary_mask'
});
```

## 🎨 Output Features

- ✅ **Transparent backgrounds** using alpha channels
- ✅ **Auto-cropping** to remove transparent borders  
- ✅ **High-quality PNG** output with compression
- ✅ **Batch processing** for multiple characters
- ✅ **Naming conventions** for Wavelength Lore assets

## 🛠️ Technical Details

- **Image Processing:** Sharp.js (already in dependencies)
- **Formats Supported:** PNG, JPG, JPEG input
- **Output Format:** PNG with transparency
- **Node.js Integration:** Ready for existing workflow
- **Modular Design:** Easy API integration

## 📊 Usage Scenarios

### Character Icon Creation
Extract clean character portraits for:
- Episode thumbnails
- Character gallery pages  
- Navigation icons
- Merchandise design templates

### Batch Asset Processing
Process multiple characters at once:
```bash
# Processes all configured characters
npm run wavelength:extract-icons
```

### Quality Control
- Preview extracted assets before deployment
- Adjust masks for perfect extraction
- Test different prompts for optimal results

## 🎯 Integration with Wavelength Lore

This tool integrates seamlessly with your existing:
- **Character Database:** Auto-generate icons for character profiles
- **Episode System:** Create thumbnails from episode screenshots  
- **Merchandise Pipeline:** Extract assets for print-on-demand products
- **Content Management:** Streamline asset creation workflow

---

**Ready to extract professional character icons for the Wavelength universe!** 🌊✨