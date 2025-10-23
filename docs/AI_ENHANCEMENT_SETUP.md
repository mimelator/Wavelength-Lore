# AI-Enhanced Merchandise Setup Guide

## 🚀 Automatic Print Quality Enhancement with AI

Your Wavelength Lore merchandise system now includes intelligent AI upscaling that automatically detects and enhances low-quality images for optimal print output.

## ✨ Automatic Enhancement Features

### **Transparent Quality Detection**
- Automatically analyzes image quality during merchandise creation
- Detects when images need enhancement for print quality
- Applies AI enhancement seamlessly without user intervention
- Provides feedback when images are automatically enhanced

### **User Experience**
- No manual enhancement selection required
- Users receive notification when their images are improved
- Enhancement happens behind the scenes during product creation
- Original images remain unchanged in gallery

## 🔧 Required Environment Variables

Add these to your `.env` file:

```bash
# AI Upscaling Services
OPENAI_API_KEY=sk-your-openai-api-key-here
REPLICATE_API_TOKEN=r8_your-replicate-token-here

# Uses existing gallery S3 configuration
# No additional S3 setup needed - upscaled images stored in gallery bucket subfolder
```

## 📁 Storage Structure

The AI enhancement system uses your existing gallery S3 bucket with organized subfolders:

```
your-gallery-bucket/
├── gallery/                  # Original gallery images
│   └── userId/
│       ├── image1.jpg
│       └── image2.png
└── upscaled/                 # AI-enhanced images
    └── userId/
        ├── image1-enhanced-timestamp.png
        └── image2-enhanced-timestamp.png
```

**Benefits of this approach:**
- ✅ No additional S3 bucket needed
- ✅ Uses existing CDN configuration
- ✅ Simplified permissions management
- ✅ Automatic caching of enhanced images
- ✅ Easy cleanup and organization

## 🎯 How Automatic Enhancement Works

### 1. **Transparent Quality Detection**
- Analyzes image quality automatically during merchandise creation
- Detects when images fall below print quality thresholds
- Triggers enhancement seamlessly without user intervention

### 2. **Automatic AI Enhancement**
- **OpenAI DALL-E 3**: Best for artwork, illustrations, character portraits
- **Replicate Real-ESRGAN**: Optimal for photographs and realistic images
- **Sharp Fallback**: High-quality traditional upscaling when AI services unavailable

### 3. **User Feedback**
- Automatic success message when enhancement is applied: "✨ Your image was automatically enhanced for better print quality!"
- No action required from users - enhancement happens behind the scenes
- Original images remain unchanged in gallery

### 4. **Print Optimization**
- Target: 3000×3600px (10"×12" at 300 DPI)
- Minimum: 1200×1200px for acceptable quality
- Automatic format conversion to uncompressed PNG for print

## 📊 Automatic Enhancement Triggers

| Original Quality | Auto Enhancement | User Notification |
|-----------------|------------------|-------------------|
| **Excellent** (300+ DPI, 3000×3600+) | Not triggered | Standard success message |
| **Good** (200-299 DPI, 2000×2400+) | Applied automatically | Enhancement notification shown |
| **Fair** (150-199 DPI, 1200×1440+) | Applied automatically | Enhancement notification shown |
| **Poor** (<150 DPI, <1200×1200) | Required upscaling | Dramatic quality enhancement |

## 🔌 Service Setup Instructions

### OpenAI API Setup
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env` as `OPENAI_API_KEY=sk-...`

**Cost**: ~$0.04 per image enhancement (recommended for artwork/illustrations)

### Replicate API Setup
1. Go to [Replicate](https://replicate.com/)
2. Create an account
3. Go to Account → API Tokens
4. Create a new token
5. Add to `.env` as `REPLICATE_API_TOKEN=r8_...`

**Cost**: ~$0.02 per image enhancement (recommended for photos)

### AWS S3 Setup for Upscaled Images
**No additional setup required!** The system uses your existing gallery S3 bucket with a dedicated `upscaled/` subfolder. Enhanced images are automatically organized by user ID and include cache-friendly headers for optimal CDN performance.

**Folder structure:**
- Original images: `gallery/{userId}/{imageFile}`
- Enhanced images: `upscaled/{userId}/{originalId}-enhanced-{timestamp}.png`

**Automatic features:**
- 🔄 **Smart Caching**: Reuses previously enhanced images to save processing time and costs
- 🌐 **CDN Optimized**: Enhanced images use your existing CloudFront distribution
- 🏷️ **Metadata Tracking**: Stores enhancement method, scale factor, and creation time
- 🗑️ **Easy Cleanup**: All enhanced images in organized subfolders for maintenance

## 🎨 Usage Guide

### For Users (Frontend)
1. **Select Image**: Choose any image from your gallery
2. **Quality Analysis**: System automatically analyzes print suitability
3. **Review Recommendations**: See enhancement suggestions and preview
4. **Choose Products**: Select merchandise types (t-shirt, mug, poster, etc.)
5. **Enhancement Options**: Configure AI method and style preferences
6. **Create Products**: AI enhances image and creates Printify products

### For Developers (API)
```javascript
// Analyze image quality
GET /api/enhanced-merchandise/preview-quality?imageId=123

// Preview enhancement
POST /api/enhanced-merchandise/preview-enhancement
{
  "imageId": "123",
  "enhancementOptions": {
    "contentType": "illustration",
    "style": "anime"
  }
}

// Create enhanced product
POST /api/enhanced-merchandise/create-enhanced
{
  "imageId": "123",
  "productType": "t-shirt",
  "enhancementOptions": {
    "method": "openai",
    "contentType": "character"
  }
}

// Batch create multiple products
POST /api/enhanced-merchandise/create-enhanced-batch
{
  "imageId": "123",
  "productTypes": ["t-shirt", "mug", "poster"],
  "enhancementOptions": {
    "method": "auto"
  }
}
```

### Performance Optimizations

### Intelligent Caching Strategy
- **Reuse Enhanced Images**: Once an image is enhanced, it's cached for future use
- **Smart Detection**: System automatically finds existing enhanced versions
- **Subfolder Organization**: Enhanced images stored in dedicated `upscaled/` folder
- **Metadata Tracking**: Tracks enhancement method, scale factor, and timestamps

### Fallback Handling
- Auto-fallback from OpenAI → Replicate → Sharp
- Graceful degradation when AI services unavailable
- Original image used if all enhancement methods fail

### Batch Processing
- Single image enhancement reused for multiple products
- Parallel product creation after image enhancement
- Progress tracking for large batches

## 🔍 Monitoring & Debugging

### Success Indicators
- ✅ Quality analysis shows "suitable for print"
- ✅ Enhancement metadata includes scale factor and method
- ✅ Printify upload succeeds with enhanced image
- ✅ Product creation returns success status

### Common Issues & Solutions

**Issue**: OpenAI API key invalid
**Solution**: Verify API key format (starts with `sk-`) and account billing

**Issue**: Replicate token expired
**Solution**: Generate new token in Replicate dashboard

**Issue**: S3 upload fails
**Solution**: Check AWS credentials and bucket permissions

**Issue**: Enhancement takes too long
**Solution**: Use `method: "sharp"` for faster processing

### Debug Logging
```javascript
// Enable debug logging in Printify config
process.env.PRINTIFY_DEBUG_LOG = 'true'

// Check enhancement logs
console.log('Enhancement result:', result.imageEnhancement);
```

## 🚀 Deployment Considerations

### Production Checklist
- [ ] OpenAI API key configured with sufficient credits
- [ ] Replicate API token active and funded
- [ ] Existing gallery S3 bucket accessible (no new bucket needed)
- [ ] AWS credentials have S3 write permissions for gallery bucket
- [ ] Sharp image processing dependencies installed
- [ ] Error handling and user feedback implemented
- [ ] Rate limiting configured for API calls

### Performance Recommendations
- Use OpenAI for character/artwork images (better quality)
- Use Replicate for photographs (faster, cheaper)
- System automatically caches enhanced images to reduce costs
- Enhanced images use existing CDN for fast delivery
- Monitor API usage and costs through service dashboards

## 💡 Advanced Features

### Custom Enhancement Profiles
```javascript
const enhancementProfiles = {
  character: {
    method: 'openai',
    contentType: 'character',
    enhanceDetails: true,
    style: 'anime'
  },
  landscape: {
    method: 'replicate',
    contentType: 'photo',
    scaleFactor: 4
  },
  artwork: {
    method: 'openai',
    contentType: 'artwork',
    preserveStyle: true
  }
};
```

### Bulk Enhancement
```javascript
// Enhance entire gallery for a user
const enhanceAllUserImages = async (userId) => {
  const images = await getUserGalleryImages(userId);
  const results = await Promise.all(
    images.map(img => enhancedPrintifyService.uploadImageWithQualityEnhancement(img.buffer, img.fileName, { userId }))
  );
  return results;
};
```

## 📞 Support

If you encounter issues with the AI enhancement system:

1. Check the console logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test individual API services (OpenAI, Replicate) separately
4. Review the enhancement preview before creating products
5. Use fallback methods if primary AI services fail

The system is designed to gracefully handle failures and provide the best possible print quality with available resources.

---

**🎯 Result**: Your gallery images are now automatically optimized for professional-quality print merchandise, ensuring crisp, vibrant results regardless of original image quality!