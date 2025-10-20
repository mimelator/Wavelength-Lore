# Quick Start: AI Image Generation

## 🚀 How to Generate AI Images for Your Content

### 1. Open Edit Page
Navigate to any content edit page:
- Character: `/edit/character/andrew`
- Episode: `/edit/episode/2/2`
- Lore: `/edit/lore/the-shire`

### 2. Find or Create a Prompt
Scroll to "🤖 AI Generation Prompts" section:
- Use existing prompt: Click "👁️ View"
- Or create new: Click "➕ Create New Prompt"

### 3. Generate Images
In the View Modal:
```
┌─────────────────────────────────┐
│ 🎨 AI Image Generation          │
│                                  │
│ [🎨 Generate Images] Count: [2▼]│
│                                  │
└─────────────────────────────────┘
```
- Select how many images (1-4)
- Click "🎨 Generate Images"
- Wait 10-30 seconds ⏳

### 4. Select Images
Once generated, images appear in a grid:
```
┌────────┐ ┌────────┐
│ [✓]    │ │ [✓]    │
│ Image1 │ │ Image2 │
└────────┘ └────────┘
```
- All selected by default ✓
- Click image to deselect
- Pick only the ones you want

### 5. Add to Gallery
```
[➕ Add 2 Selected to Gallery]
```
- Click button
- Images added to content
- Refresh to see in gallery ✅

## 📝 Example: Generate Portrait for Andrew

**Step 1:** Go to http://localhost:3001/edit/character/andrew

**Step 2:** Click "👁️ View" on "Andrew at Golden Hour" prompt

**Step 3:** Modal shows prompt text:
> "A hyper-detailed, photorealistic spring forest at golden hour..."

**Step 4:** Select Count: 2, Click "Generate"

**Step 5:** Two images appear after ~20 seconds

**Step 6:** Keep both (✓✓), Click "Add to Gallery"

**Step 7:** Done! Images now in Andrew's character gallery

## 💡 Tips

- **Better Prompts** = Better Images
  - Be specific and detailed
  - Include style, lighting, mood
  - Reference existing art styles

- **Multiple Generations**
  - Generate 2-3 images at once
  - Pick the best one(s)
  - Delete unwanted generations

- **Iterate**
  - Generate → Review → Regenerate
  - Adjust prompt if needed
  - Edit prompt before generating

## ⚙️ Settings

**Image Count**: 1-4 images per generation
- 1 image: ~10 seconds
- 2 images: ~20 seconds
- 4 images: ~40 seconds

**Image Size**: 1024x1024 pixels (fixed for now)

**Style**: Uses prompt category
- character → fantasy-art style
- location → fantasy-art style  
- general → photorealistic

## 🎨 Prompt Examples

### Character Portrait
```
Portrait of [Name], [description], detailed facial 
features, fantasy character design, professional 
studio lighting, high quality digital art
```

### Location Scene
```
[Place name], [description], atmospheric lighting, 
epic fantasy landscape, detailed environment, 
cinematic composition
```

### Magical Item
```
[Item name], [description], intricate details, 
magical glow, fantasy item design, dramatic 
lighting, high resolution
```

## ❓ Troubleshooting

**"No images generated"**
- Check internet connection
- API may have filtered content
- Try simpler, less detailed prompt

**"Generation failed"**
- API quota may be exceeded
- Check console for errors
- Wait a few minutes and retry

**"Images not in gallery"**
- Click "Refresh" button when prompted
- Or manually refresh browser (⌘+R / Ctrl+R)
- Check Firebase permissions

**"Slow generation"**
- Normal: 10-30 seconds
- More images = longer wait
- Be patient! ⏳

## 🔐 Permissions

Only users with these roles can generate:
- ✅ content_manager
- ✅ admin
- ✅ moderator

Regular users cannot access edit pages or generate images.

## 📊 Current Limitations

- ⚠️ Base64 storage (temporary solution)
- ⚠️ No image editing yet
- ⚠️ Sequential generation only
- ⚠️ Fixed 1024x1024 size
- ⚠️ Limited to 4 images per batch

## 🎯 Coming Soon

- 📤 S3/CDN upload
- ✂️ Image editing tools
- 🎨 Style presets
- 📝 Generation history
- 🔄 Image variations

---

**Need Help?** Check the full documentation: `docs/AI_IMAGE_GENERATION_INTEGRATION.md`
