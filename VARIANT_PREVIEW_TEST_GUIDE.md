# Variant Preview Image Update - Test Guide

## What Was Fixed
When a user clicks on different product variants (2+ options), the preview image should now update to show what that variant looks like.

## Testing Instructions

### 1. Open a Multi-Variant Product
- Navigate to Merchandise Store
- Find a product with multiple variants (e.g., Cotton Canvas Tote Bag with Natural & Black options)
- Click on the product to open the modal

### 2. Open Browser Console
- Press `F12` to open DevTools
- Click on the "Console" tab
- You should see initialization logs

### 3. Click on Different Variants
- Click on the first variant button (e.g., "Natural / 15" x 16"")
- Observe in the console:
  ```
  🎯 [VARIANT-SELECTED] Variant #0 clicked
     ├─ ID: 101409
     ├─ Title: Natural / 15" x 16"
     ├─ Has image data: ✅
     └─ Image URL: ✅ https://images-api.printify.com/mockup/...
  ```

### 4. Verify Preview Image Updates
When you click each variant, you should see:
- **Visual**: Preview image fades out → new image loads → fades back in
- **Console**: `🖼️ Attempting to update preview image...` followed by fade logs

### 5. Check for Success Indicators

Look for these console messages:
```
✅ Button styling updated (selected state applied)
✅ Variant data stored in modal.dataset
✅ Fade-in complete (back to opacity 1.0)
✅ Add-to-cart button enabled
```

## What If Something Goes Wrong?

### ❌ "Has image data: ❌"
- Variant doesn't have image data attached
- Check: Does the backend enrichment include image URLs?

### ❌ "Image URL: ❌ Missing"
- Button didn't receive image URL
- Check: Is variant.image.url being populated correctly?

### ❌ ".preview-image element NOT FOUND"
- Modal doesn't have a preview image element
- Check: Is the product modal rendering a preview image?

### ❌ Image doesn't fade or stays same
- updatePreviewImage() might not be being called
- Check: Click variant and watch console for fade logs

## Console Output Examples

### ✅ WORKING (Click variant Natural size)
```
🎯 [VARIANT-SELECTED] Variant #0 clicked
   ├─ ID: 101409
   ├─ Title: Natural / 15" x 16"
   ├─ Has image data: ✅
   └─ Image URL: ✅ https://images-api.printify.com/mockup/6901525aa3a4eef7b202ec2b/101409/...
   ✅ Button styling updated (selected state applied)
   ✅ Variant data stored in modal.dataset
   🖼️ Attempting to update preview image...
✅ [UPDATE-PREVIEW] Found preview image element
   ├─ Current src: https://...
   └─ Will change to: https://...
   ⏳ Starting fade-out (0.2s to opacity 0.5)
   🔄 (150ms later) Updating image src to: https://...
   ✅ Fade-in complete (back to opacity 1.0)
   ✅ Add-to-cart button enabled
```

### ✅ WORKING (Click variant Black size)
```
🎯 [VARIANT-SELECTED] Variant #1 clicked
   ├─ ID: 103598
   ├─ Title: Black / 15" x 16"
   ├─ Has image data: ✅
   └─ Image URL: ✅ https://images-api.printify.com/mockup/6901525aa3a4eef7b202ec2b/103598/...
   ✅ Button styling updated (selected state applied)
   ✅ Variant data stored in modal.dataset
   🖼️ Attempting to update preview image...
   ... (same fade/update sequence)
```

### ❌ BROKEN (Image data missing)
```
🎯 [VARIANT-SELECTED] Variant #0 clicked
   ├─ ID: 101409
   ├─ Title: Natural / 15" x 16"
   ├─ Has image data: ❌
   └─ Image URL: ❌ Missing
   ✅ Button styling updated (selected state applied)
   ✅ Variant data stored in modal.dataset
   ⚠️ [WARN] No image URL available for this variant - preview will NOT update
```

## How to Report Issues

When reporting an issue, please include:
1. Which product you were testing (name)
2. How many variants it has
3. The complete console output (from first click to last log message)
4. Whether the preview image actually changed visually or not

---

**Implementation Date**: 2025-10-28
**Files Modified**: `static/js/components/merchandise-modal-renderer.js`
**Changes**: Added image URL extraction and preview update on variant selection
