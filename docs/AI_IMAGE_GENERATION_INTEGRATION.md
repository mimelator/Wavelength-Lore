# AI Image Generation Integration

## Overview

Integrated AI image generation directly into the content editing workflow, allowing content managers to generate images from prompts and add them to content galleries with a simple UI.

## Features Implemented

### 1. **Generate Images from Prompts**
- Click "👁️ View" on any prompt in the edit interface
- Click "🎨 Generate Images" button
- Select count (1-4 images)
- Uses Google Gemini AI (gemini-2.5-flash-image model)
- Images generate in 10-30 seconds

### 2. **Preview & Select**
- Generated images display in a grid
- Checkbox selection interface
- All images selected by default
- Click image to toggle selection
- Hover effects for visual feedback

### 3. **Add to Gallery**
- Click "➕ Add Selected to Gallery" 
- Selected images added to appropriate gallery:
  - Episodes → `carouselImages`
  - Characters/Lore → `image_gallery`
- Confirmation with refresh option
- Images immediately available in content

## Technical Implementation

### API Endpoints

#### POST `/api/generate/image`
Generate images using Google Gemini AI.

**Request:**
```json
{
  "promptId": "andrew-golden-hour",
  "promptText": "A hyper-detailed, photorealistic...",
  "count": 2,
  "width": 1024,
  "height": 1024,
  "style": "photorealistic"
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "abc123...",
      "dataUrl": "data:image/png;base64,...",
      "mimeType": "image/png",
      "metadata": {...}
    }
  ],
  "count": 2
}
```

#### POST `/api/generate/add-to-gallery`
Add generated images to content gallery.

**Request:**
```json
{
  "contentType": "character",
  "contentId": "andrew",
  "firebasePath": "characters/andrew",
  "images": [
    {
      "id": "abc123",
      "dataUrl": "data:image/png;base64,..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imagesAdded": 2
}
```

### Files Modified

1. **`routes/aiGenerationApi.js`** (NEW)
   - AI generation endpoint
   - Gallery integration endpoint
   - Google Gemini SDK integration
   - Base64 image handling

2. **`app.js`**
   - Mounted `/api/generate` routes
   - Added authentication middleware

3. **`views/edit-content.ejs`**
   - Enhanced View Modal with generation UI
   - Image count selector
   - Generated images grid
   - Selection interface
   - Add to gallery button
   - JavaScript functions for generation workflow

### Configuration

Uses existing `.env` configuration:
```properties
GEMINI_API_KEY=your_api_key_here
AI_MODEL_KEY=gemini-2.5-flash-image
AI_PROVIDER=google-genai
```

## User Workflow

### Step-by-Step Usage

1. **Navigate to edit page**
   ```
   http://localhost:3001/edit/character/andrew
   ```

2. **View prompt**
   - Scroll to "AI Generation Prompts" section
   - Click "👁️ View" on a linked prompt
   - Modal opens showing prompt details

3. **Generate images**
   - Select count (1-4)
   - Click "🎨 Generate Images"
   - Wait 10-30 seconds
   - Images appear in grid below

4. **Select images**
   - All images checked by default
   - Click image or checkbox to toggle
   - Select only images you want to keep

5. **Add to gallery**
   - Click "➕ Add Selected to Gallery"
   - Confirmation message appears
   - Optionally refresh page to see images
   - Images now in content gallery

## UI Components

### View Modal Layout
```
┌────────────── Prompt Details ───────────────┐
│ Title                                        │
│ [category] [tag1] [tag2]                    │
│                                              │
│ Prompt Text: ...                            │
│ Keywords: ...                                │
│ Linked Content: ...                          │
│                                              │
│ ─────────────────────────────────────────   │
│ 🎨 AI Image Generation                      │
│                                              │
│ [🎨 Generate Images] Count: [2 ▼]           │
│                                              │
│ Generated Images:                            │
│ ┌───────┐ ┌───────┐                        │
│ │ [✓]   │ │ [✓]   │                        │
│ │ img1  │ │ img2  │                        │
│ └───────┘ └───────┘                        │
│                                              │
│ [➕ Add 2 Selected to Gallery]              │
│                                              │
│ [Close]                                      │
└──────────────────────────────────────────────┘
```

## Security & Permissions

- **Required Role**: content_manager, admin, or moderator
- **Authentication**: Firebase ID token required
- **Rate Limiting**: Inherits from admin rate limits
- **Quota**: Limited by Google Gemini API quotas

## Image Storage

Currently stores as base64 data URLs directly in Firebase.

**Future Enhancements:**
- Upload to S3/CDN for better performance
- Image optimization (compression, resizing)
- Thumbnail generation
- Lazy loading

## Performance Notes

- **Generation Time**: 10-30 seconds per batch
- **Image Size**: ~200KB-500KB per image (base64)
- **Concurrent Generations**: Sequential (one at a time)
- **Browser Memory**: ~2-4MB per generated image

## Error Handling

- API key validation
- Generation failures (quota, content filtering)
- Network errors
- User-friendly error messages
- Console logging for debugging

## Example Prompts

### Character Portrait
```
Portrait of Andrew, half-elf bard with snow white hair and 
lavender eyes, wearing a long tunic with crow pin, fantasy 
character design, detailed facial features, professional 
studio lighting, photorealistic
```

### Location Scene
```
The Shire at golden hour, quaint halfling houses with smoking 
chimneys, towering oak trees with bioluminescent mushrooms, 
streaming golden sunlight through canopy, magical atmosphere, 
fantasy landscape
```

### Magical Object
```
Ancient lute-guitar glowing with vivid energy waves, intricate 
carvings and runes, magical instrument, detailed textures, 
fantasy item, dramatic lighting
```

## Future Enhancements

### Phase 2
- [ ] Style presets (fantasy-art, anime, oil-painting)
- [ ] Image editing (crop, adjust, filters)
- [ ] Batch generation (multiple prompts)
- [ ] Generation history tracking
- [ ] Cost tracking per user

### Phase 3
- [ ] Upload to S3/CDN automatically
- [ ] Multiple AI providers (DALL-E, Midjourney)
- [ ] Image variations from existing images
- [ ] Prompt engineering assistance
- [ ] Gallery management (reorder, delete)

### Phase 4
- [ ] AI-powered prompt suggestions
- [ ] Character consistency across images
- [ ] Style transfer
- [ ] Background removal
- [ ] Automatic asset tagging

## Troubleshooting

### Images not generating
- Check `GEMINI_API_KEY` in `.env`
- Verify API quota not exceeded
- Check console for error messages
- Try simpler prompt

### Slow generation
- Normal: 10-30 seconds per batch
- Network speed affects download
- Generating 4 images slower than 1

### Images not appearing in gallery
- Check Firebase permissions
- Verify content path correct
- Refresh page after adding
- Check browser console

## Testing URLs

- Character: http://localhost:3001/edit/character/andrew
- Episode: http://localhost:3001/edit/episode/2/2
- Lore: http://localhost:3001/edit/lore/the-shire

---

**Status**: ✅ Fully Implemented and Ready for Use

**Last Updated**: October 20, 2025
