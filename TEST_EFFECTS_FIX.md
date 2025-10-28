# Test Plan: Image Effects FX Applied to Edited Products

## Overview
This test validates that when users edit an existing merchandise product and apply image effects, those effects are properly applied and persisted to the Printify product.

## Prerequisites
- Server must be restarted with latest code changes
- User must be logged in
- At least one existing product in the merchandise store

## Test Steps

### Step 1: Restart Server
- [ ] Stop the server
- [ ] Verify latest code is deployed
- [ ] Start the server
- [ ] Confirm server is running without errors

**Expected**: Server starts successfully with no critical errors

---

### Step 2: Open Merchandise Store
- [ ] Navigate to merchandise store page
- [ ] Wait for products to load
- [ ] Confirm you can see existing products

**Expected**: Products load successfully

---

### Step 3: Edit an Existing Product
- [ ] Click the "Edit" button (pencil icon) on an existing product
- [ ] Verify the customization modal opens
- [ ] Check browser console for: `✅ Initialized with default customization state`

**Expected**: Modal opens with original product image displayed

---

### Step 4: Select Effects
- [ ] In the modal, expand "🎨 Color Effects" section
- [ ] **Select "Enhanced Vibrancy"** checkbox
- [ ] Expand "✨ Atmospheric Effects" section
- [ ] **Select "Dramatic Focus"** checkbox
- [ ] Verify checkboxes show as checked

**Expected**: Both effect checkboxes are visually checked

---

### Step 5: Update Preview
- [ ] Click **"🔄 Update Preview"** button
- [ ] Wait for preview image to update (should take a few seconds)
- [ ] Observe the preview image - should look more vibrant/dramatic
- [ ] Check browser console for:
  ```
  📋 Selected effects from modal: {vibrancy: true, dramatic: true}
  ✅ Has any effect selected? true
  ```

**Expected**: Preview image changes visually with effects applied

---

### Step 6: Create Product with Effects
- [ ] Click **"✨ Preview Finished Product"** button
- [ ] Wait for loading to complete (watch for success message)
- [ ] Check browser console for:
  ```
  🔍 DEBUG: customization.effects BEFORE payload building:
  🔥 DIAGNOSTIC: API payload details
     imageContext: {effects: {…}, borderEnabled: false, ...}
     🔥 imageContext.effects: {vibrancy: true, dramatic: true}
  ```

**Expected**: No errors, success message appears

---

### Step 7: Check Server Logs
Look for this sequence in server logs:

```
🔥 DIAGNOSTIC: CREATE GUIDED PRODUCT API CALLED
   imageContext keys: [ 'effects', 'borderEnabled', 'borderColor' ]

🎨 Applying user customizations before upscaling...
   imageContext.effects: {vibrancy: true, dramatic: true}

🔍 Converting effect selections to numeric parameters:
   ✅ vibrancy selected - merging preset: {saturation: 1.4, colorTemperature: 3800, ...}
   ✅ dramatic selected - merging preset: {vignette: 0.5, contrast: 1.2, ...}

✅ Final effect parameters to apply:
   {saturation: 1.568, colorTemperature: 3800, bloom: 0, vignette: 0.5, blur: 2, brightness: 1.0864, contrast: 1.38, lightning: 0, ...}

✅ Effects processing returned buffer
   Original buffer size: 219.92 KB
   Customized buffer size: 194.02 KB

🔍 IMAGE BUFFER DIAGNOSTIC BEFORE PRINTIFY:
   Buffer size being sent to Printify: 194.02 KB

✅ [PRINTIFY API] PRODUCT CREATED SUCCESSFULLY!
```

**Expected**: See the effect conversion and confirm modified image buffer is sent to Printify

---

### Step 8: Verify Product Created
- [ ] Wait for page to re-render
- [ ] Scroll down to products list
- [ ] Locate the newly created product (should be at the bottom)
- [ ] Check the product card image

**Expected**: New product appears in the products list

---

### Step 9: Compare Visual Effects
- [ ] Take a screenshot of the **new product with effects**
- [ ] Compare with the **original product** (should look different)
- [ ] Look for visible differences:
  - Vibrancy: More saturated colors, warmer tones
  - Dramatic: Darker edges/vignette, higher contrast

**Expected**: New product shows visible effect changes compared to original

---

### Step 10: Edit NEW Product and Apply Different Effects
- [ ] Click Edit on the newly created product with effects
- [ ] Modal should restore the previous effects (vibrancy + dramatic)
- [ ] Browser console should show:
  ```
  ✅ Found previous customization for product: [productId]
  ✅ Restored customization state from product.customization
    customization object: {effects: {vibrancy: true, dramatic: true}, borderEnabled: false, ...}
  ```
- [ ] Uncheck "Enhanced Vibrancy"
- [ ] Check "Golden Warmth" instead
- [ ] Click "Update Preview" and observe new effect
- [ ] Click "Preview Finished Product"

**Expected**:
- Previous effects are restored when editing
- Can change effects for same product
- New product created with new effect combo (warmth + dramatic instead of vibrancy + dramatic)

---

## Success Criteria

✅ All of the following must be true:

1. **Effects captured correctly** - Browser logs show selected effects
2. **Effects converted to numeric values** - Server logs show preset merging
3. **Modified image buffer sent** - Buffer size changes before/after effects
4. **Product created** - API returns success
5. **Visual differences visible** - New product looks different from original
6. **Effects persist** - Editing product shows previously selected effects
7. **Effects composable** - Can change effects and create new product with different FX

---

## Troubleshooting

### Effects not visible in preview
- Check browser console for errors in `/api/merchandise/openai-upscaler/apply-effects`
- Verify effects were selected (checkboxes should be checked)
- Try refreshing the page and selecting effects again

### Server logs don't show effect conversion
- Confirm server was restarted after code changes
- Check if `effectsConfig` is properly loaded
- Verify `imageContext.effects` is not empty in initial logs

### Product created but no visual differences
- Confirm buffer sizes changed in logs (should be smaller after effects)
- Check if upscaling is overwriting the effects (cache hit issue)
- Verify effects were actually applied in `EffectsProcessor.processImage()`

### Modal doesn't close after product creation
- Check browser console for errors in `hideModal`
- Verify `customizationModalId` is correctly extracted
- Check if CSS animation is preventing DOM removal

---

## Test Results Template

```
TEST DATE: [DATE]
TESTER: [NAME]

Step 1 (Restart): ✅ / ❌
Step 2 (Load): ✅ / ❌
Step 3 (Edit): ✅ / ❌
Step 4 (Select): ✅ / ❌
Step 5 (Preview): ✅ / ❌
Step 6 (Create): ✅ / ❌
Step 7 (Logs): ✅ / ❌
Step 8 (Product): ✅ / ❌
Step 9 (Visual): ✅ / ❌
Step 10 (Edit New): ✅ / ❌

OVERALL: ✅ PASS / ❌ FAIL

NOTES:
[Any observations or issues]
```
