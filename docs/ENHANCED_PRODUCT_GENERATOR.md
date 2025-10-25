# Enhanced Product Generator

Advanced product catalog builder with restart capability, image variety, and overlay system integration.

## 🚀 Features

### **Restart Capability**
- **State Persistence**: Automatically saves progress to prevent data loss
- **Skip Existing Products**: Avoids recreating already generated products
- **Continue Previous Runs**: Resume interrupted generation sessions
- **Progress Tracking**: Real-time completion percentage and status

### **Image Variety System**
- **Smart Categorization**: Automatically sorts images by type (characters, locations, items)
- **Rotation Algorithm**: Uses different images for each product type
- **Balanced Selection**: Takes 2-3 images from each category for diversity
- **Fallback Safety**: Uses available images if categories are empty

### **Overlay System Integration**
- **Blueprint-Specific Overlays**: Different overlay types per product category
  - **Apparel**: Center overlay with solid borders
  - **Drinkware**: Wrap overlay with rounded borders  
  - **Wall Art**: Full overlay with gradient borders
- **Automatic Enhancement**: Applies overlays before product creation
- **Graceful Fallback**: Uses original image if overlay application fails

## 📋 Product Types Generated

| Blueprint ID | Product Type | Category | Overlay Type |
|--------------|--------------|----------|--------------|
| 5 | Unisex Heavy Cotton Tee | apparel | center |
| 6 | Women's Favorite Tee | apparel | center |
| 9 | Unisex Cotton Crew Tee | apparel | center |
| 17 | Coffee Mug | drinkware | wrap |
| 7 | Poster | wall-art | full |
| 77 | Unisex Heavy Blend Hoodie | apparel | center |
| 49 | Unisex Pullover Hoodie | apparel | center |
| 282 | Premium Poster | wall-art | full |
| 97 | Canvas Print | wall-art | full |
| 46 | Unisex Tank Top | apparel | center |
| 71 | Premium Pillow | home | center |

## 🎯 Usage

### **Basic Usage**
```bash
# Standard enhanced generation (recommended)
node scripts/generate-all-product-types.js
```

### **Advanced Options**
```bash
# Recreate all products (ignores existing)
node scripts/generate-all-product-types.js --recreate

# Continue a previous run
node scripts/generate-all-product-types.js --continue --run-id=enhanced-products-1234567890

# Use single image for all products
node scripts/generate-all-product-types.js --single-image

# Skip overlay system
node scripts/generate-all-product-types.js --no-overlays

# Minimal mode (single image, no overlays, recreate)
node scripts/generate-all-product-types.js --recreate --single-image --no-overlays
```

## 🔧 Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--recreate` | false | Recreate existing products instead of skipping |
| `--single-image` | false | Use same image for all products |
| `--no-overlays` | false | Skip overlay system integration |
| `--continue` | false | Continue a previous generation run |
| `--run-id=ID` | auto | Specify run ID for continuation |

## 📊 Output & Reporting

### **Progress Tracking**
- Real-time completion percentage
- Product creation status (success/failure)
- Image selection details
- Overlay application results

### **Final Report**
- Total products created
- Products grouped by category
- Individual product IDs and details
- Direct link to admin catalog

### **State Management**
- Progress saved to `temp/generator-state-{runId}.json`
- Automatic recovery on restart
- Error-safe state persistence

## 🔍 Example Output

```
🏭 ENHANCED PRODUCT TYPES GENERATOR
===================================
🔄 Skip existing: true
🖼️ Image variety: true
🎨 Use overlays: true

📂 Loaded previous state: 3 products
🎯 Total blueprints: 11
📋 Remaining to process: 8
✅ Already completed: 3

🔨 [12%] Creating Coffee Mug...
   🖼️ Using: Lucky Portrait (bookmark)
   🎨 Applying wrap overlay...
   ✅ Overlay applied successfully
   ✅ Created: 68fd1234567890abcdef

🎉 GENERATION COMPLETE
📊 Created 11 products

📦 Products by Category:
  apparel: 6 products
    1. Unisex Heavy Cotton Tee - 68fd1751fe797abcae0e9b0d
    2. Women's Favorite Tee - 68fd1762ea1ebcb82508146f
    ...
  wall-art: 3 products
  drinkware: 1 products
  home: 1 products

🔗 View catalog: http://localhost:3001/admin/vendor-catalog
```

## 🛡️ Error Handling

- **API Rate Limiting**: Built-in delays between requests
- **Image Processing Failures**: Graceful fallback to original images
- **Network Issues**: Automatic retry with exponential backoff
- **State Corruption**: Validation and recovery mechanisms
- **Partial Failures**: Continue processing remaining products

## 🔗 Integration

### **Services Used**
- **VendorPreviewService**: Core product generation
- **BorderSelectionService**: Overlay application
- **Firebase Admin**: User management and state storage
- **Gallery API**: Image retrieval and management

### **Admin Catalog Integration**
- Products automatically appear in `/admin/vendor-catalog`
- Enhanced catalog interface with pagination and filtering
- Support for 90+ products with multiple view modes
- Real-time product management and deletion

## 📝 State File Format

```json
{
  "runId": "enhanced-products-1761417000000",
  "generatedProducts": [
    {
      "blueprintId": 5,
      "title": "Unisex Heavy Cotton Tee",
      "productId": "68fd1751fe797abcae0e9b0d",
      "category": "apparel",
      "imageUsed": "Lucky Portrait",
      "overlayApplied": true,
      "createdAt": "2025-01-25T12:00:00.000Z"
    }
  ],
  "lastUpdated": "2025-01-25T12:00:00.000Z"
}
```

## 🚨 Troubleshooting

### **Common Issues**

**Products not appearing in catalog:**
- Check server is running on localhost:3001
- Verify Firebase Admin SDK is properly configured
- Ensure user has proper permissions

**Overlay application failing:**
- Verify BorderSelectionService is available
- Check image format compatibility
- Review overlay service logs for specific errors

**State file corruption:**
- Delete `temp/generator-state-*.json` files
- Restart with `--recreate` flag
- Check file system permissions

### **Performance Optimization**

**For large catalogs (100+ products):**
- Use `--single-image` for faster generation
- Skip overlays with `--no-overlays` for speed
- Run during off-peak hours to avoid rate limits
- Monitor system resources during generation

## 🔄 Migration from Legacy Generator

```bash
# Old command
node scripts/generate-all-product-types.js

# New enhanced command (same result, better features)
node scripts/generate-all-product-types.js

# To recreate existing products with enhancements
node scripts/generate-all-product-types.js --recreate
```

The enhanced generator is fully backward compatible while providing significant improvements in reliability, variety, and visual quality.