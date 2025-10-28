# Image Flow - Quick Reference Guide

## One-Liner Summary
User selects gallery image → Product type selected → API validates & downloads image → Auto-enhancement service upscales/enhances → Effects applied → Uploaded to Printify → Product created → Stored in Firebase → Success response

---

## Critical File Locations

```
FRONTEND:
  static/js/components/merchandise-store.js (line 2503) - selectImage() entry point
  static/js/components/merchandise-modal-renderer.js - Customization UI
  static/js/services/MerchandiseApiService.js - API communication

BACKEND API:
  routes/merchandise.js (line 398) - POST /api/merchandise/create-guided-product

SERVICES:
  services/auto-enhanced-printify-service.js - Main pipeline controller
  services/image-upscaling-service.js - AI upscaling to 1800x1800
  services/EffectsProcessor.js - Visual effects (color, lighting, borders)
  services/printify-service.js - Raw Printify API integration
  services/merchandise-database.js - Firebase storage

UTILITIES:
  routes/merchandise.js (line 1885) - downloadImageFromS3()
  routes/merchandise.js (line 2199) - downloadImageBuffer()
```

---

## Key Console Log Markers (for debugging)

Search console for these emoji markers to track progress:

1. **🖼️ Image selected** - User selected gallery image
2. **🔥 DIAGNOSTIC: Product selection** - User chose product type
3. **📥 Downloading image from** - Starting S3 download
4. **✅ Image downloaded successfully** - S3 download complete
5. **🔄 Auto-enhancement upload for** - Starting enhancement pipeline
6. **🚀 Upscaling image to** - AI upscaling in progress
7. **📝 PROACTIVE FORMAT TRACKING** - Format conversion logged
8. **�� APPLYING EFFECTS AFTER UPSCALING** - Effects application
9. **✅ PROACTIVE UPLOAD: fileName matches** - Ready for Printify
10. **🖨️ [PRINTIFY API] Creating product** - Printify request
11. **✅ [PRINTIFY API] PRODUCT CREATED** - Printify success
12. **💾 Storing product in Firebase** - Database storage
13. **✅ [OPERATION COMPLETE]** - Full completion

---

## Data Flow: Image Buffer Transformations

```
ORIGINAL (S3)          SIZE             FORMAT    VALIDATION
    ↓                  1-2 MB           WebP      Downloaded
FORMAT CONVERT         1-2 MB           PNG       <4MB for upscaler
    ↓
QUALITY CHECK          -                -         Min 1800x1800?
    ↓
UPSCALING (if needed)  2-5 MB           PNG       >=1800x1800
    ↓
EFFECTS (if selected)  2-5 MB           WebP      Custom effects applied
    ↓
PRINTIFY UPLOAD        2-5 MB           PNG/WebP  Success=200 OK
    ↓
PRODUCT CREATED        -                -         Printify ID assigned
    ↓
DATABASE STORED        JSON             -         Firebase stored
```

---

## Parameter Validation Checklist

API Endpoint checks in this order:

- [ ] User authenticated (req.user.uid exists)
- [ ] imageId provided and non-empty
- [ ] imageUrl provided and accessible
- [ ] productType provided and matches "validated-*" pattern
- [ ] Product configuration found in database
- [ ] blueprintId matches config (if provided)
- [ ] printProviderId matches config (if provided)
- [ ] Image downloads successfully from S3
- [ ] Image buffer is valid (Buffer object, >0 bytes)
- [ ] Effect parameters (if provided) are valid JSON

---

## Key Architectural Decisions

1. **Strict Validation**: No fallbacks, fail fast on invalid inputs
2. **Proactive Format Tracking**: Track filename changes at transformation source (not reactive detection)
3. **Effects After Upscaling**: Apply effects AFTER upscaling for quality preservation (Issue #96 Fix)
4. **Auto-Enhancement**: Automatically upscale if dimensions insufficient
5. **Database Persistence**: Store enhancement metadata (autoEnhanced, enhancementSource, etc.)

---

## Common Error Scenarios

| Error | Cause | Location | Fix |
|-------|-------|----------|-----|
| "Missing required parameters" | imageId/imageUrl/productType empty | merchandise.js line 423 | Check request body |
| "Product configuration not found" | Invalid productType format | merchandise.js line 440 | Must start with "validated-" |
| "Blueprint ID mismatch" | Frontend/config mismatch | merchandise.js line 487 | Verify product-types.js |
| "Failed to process image" | S3 download failed | merchandise.js line 535 | Check S3 URL/permissions |
| "Upscaling failed" | Image too large (>4MB) or invalid | image-upscaling-service.js | Reduce compression level |
| "FINAL QUALITY VALIDATION FAILED" | Image still too small after upscaling | auto-enhanced-printify-service.js line 140 | Image too low res to salvage |
| "Product not found in database" | Firebase storage failed | merchandise.js line 657 | Check Firebase connection |

---

## Enhancement Source Values

When product creation completes, enhancement.enhancementSource can be:

- **'upscaling'** - Image was upscaled from <1800x1800 to 1800x1800+
- **'generated'** - Image was enhanced using AI generation (high quality)
- **'none'** - Image already met quality standards, no enhancement needed

Check response for: `productResult.imageEnhancement.enhancementSource`

---

## Testing the Flow

```bash
# Monitor backend logs
tail -f ~/.pm2/logs/wavelength-err.log | grep -E '🖼️|🔄|✅|❌'

# Check console in browser dev tools for frontend logs
# Filter by emoji: 🖼️, 🔥, 📥, 🚀, 🎨, 💾, ✅

# Verify database storage
firebase database:get /users/{uid}/products --token {TOKEN}

# Check Printify product created
curl https://api.printify.com/v1/shops/{SHOP_ID}/products/{PRODUCT_ID} \
  -H "Authorization: Bearer {API_TOKEN}"
```

---

## Enhancement Status Indicators

After product creation, check the response for:

```javascript
{
  success: true,
  product: {
    enhancement: {
      autoEnhanced: boolean,              // Was image enhanced?
      enhancementSource: string,          // 'upscaling', 'generated', or 'none'
      originalImageSuitable: boolean      // Was original good enough?
    }
  }
}
```

---

## API Endpoints Reference

```
POST /api/merchandise/create-guided-product
  Input:  { imageId, imageUrl, imageTitle, productType, blueprintId, 
            printProviderId, imageContext }
  Output: { success, product: { id, title, description, enhancement } }
  Status: 200 on success, 400 on validation failure

GET /api/merchandise/gallery-images
  Output: { success, images: [{ id, url, title, ... }] }

GET /api/merchandise/product-types
  Output: { success, allProducts: [...] }

POST /api/merchandise/preview-enhancement
  Input:  { imageId }
  Output: { success, original, enhanced, analysis }
```

---

## Image Buffer Size Expectations

| Stage | Size Range | Format | Notes |
|-------|-----------|--------|-------|
| Downloaded | 500 KB - 2 MB | WebP/PNG | Original gallery quality |
| Converted | 1 - 2.5 MB | PNG | WebP→PNG conversion |
| Upscaled | 1.5 - 5 MB | PNG | 1800x1800+ resolution |
| With Effects | 2 - 5 MB | WebP | After effect application |
| On Printify CDN | 2 - 5 MB | PNG/WebP | Uploaded and stored |

---

## Firebase Data Structure

```javascript
// User products stored at:
/users/{userId}/products/{productId}/

{
  productId: "123456789",
  imageId: "gallery_image_key",
  printifyImageId: "printify_upload_id",
  title: "Generated product title",
  description: "Auto-generated description",
  productType: "validated-tshirt",
  productConfig: { /* full config object */ },
  sourceImage: {
    id: "original_image_id",
    title: "Original title",
    url: "s3-url"
  },
  variants: [ /* printify variants */ ],
  images: [ /* printify images */ ],
  enhancement: {
    autoEnhanced: true|false,
    enhancementSource: "upscaling|generated|none",
    originalSuitable: true|false
  },
  generatedAt: "2024-10-28T14:45:30.123Z"
}
```

---

## Performance Notes

- **Image Download**: ~100-500ms (depends on S3 latency)
- **Upscaling** (if needed): ~5-30 seconds (uses AI service)
- **Effects Application**: ~1-2 seconds (Sharp processing)
- **Printify Upload**: ~2-5 seconds (network latency)
- **Product Creation**: ~2-3 seconds (Printify API)
- **Database Storage**: ~500-1000ms (Firebase write)
- **Total**: ~10-45 seconds (depends on enhancement needed)

---

## Files You'll Need to Modify

If adding new features:

1. **New effects?** → `services/EffectsProcessor.js` + `config/effectsConfig.js`
2. **New product types?** → `config/product-types.js` + `config/productSpecifications.js`
3. **New validation rules?** → `routes/merchandise.js` + service classes
4. **New API endpoints?** → `routes/merchandise.js`
5. **New UI customization?** → `static/js/components/merchandise-modal-renderer.js`

---

**Quick Navigation**: Full details in WAVELENGTH_IMAGE_FLOW_MAP.md
