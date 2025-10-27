# PERFECT PRINTING Test Harness

## Overview

The PERFECT PRINTING Test Harness is a development tool designed to validate and test the complete image optimization and product creation pipeline. It automatically:

1. ✅ Randomly selects a gallery image from your account
2. ✅ Randomly chooses a product type from the catalog
3. ✅ Optimizes the image for that specific product's requirements
4. ✅ Creates a test product with the optimized image
5. ✅ Records real analytics data to track cache performance

This is essential for iterating on the image optimization algorithm and verifying that the PERFECT PRINTING system produces print-ready images across all product types.

## Quick Start

### 1. Open the Test Harness UI

Navigate to:
```
http://localhost:3001/merchandise/test-harness
```

You must be:
- Logged in to your Wavelength Lore account
- Have the `game_access` permission (VIP users)
- Have at least one image in your gallery

### 2. Run Tests

#### Single Test Run
Click **"▶️ Run Single Test"** to:
- Randomly select 1 gallery image
- Randomly select 1 product type
- Run the optimization pipeline once
- View detailed results and logs

#### Multiple Test Runs
Click **"▶️ Run 5 Tests"** to:
- Repeat the single test process 5 times
- Each run is independent and sequential
- Tests run with 1-second delays between them
- Generates comprehensive data for validation

### 3. Monitor Results

The UI displays in real-time:
- ✅ Test success/failure status
- 📊 Selected image and product information
- 🎨 Optimization details (strategy, scale factor, processing time)
- 📈 Cumulative statistics (total runs, successes, failures)
- 🔴 Live console logs for debugging

## API Endpoints

### Status Check
```
GET /api/merchandise/test-harness/status
```

**Response:**
```json
{
  "success": true,
  "message": "Test harness is available",
  "endpoints": {
    "POST /api/merchandise/test-harness/optimize-random": {
      "description": "Run one test cycle",
      "requires": "Authentication + game_access permission"
    }
  }
}
```

### Run Test
```
POST /api/merchandise/test-harness/optimize-random
```

**Headers:**
```
Authorization: Bearer <auth-token>
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Test harness completed successfully",
  "test_run_details": {
    "timestamp": "2025-10-27T13:45:00.000Z",
    "userId": "user123",
    "userName": "Test User",
    "selected_image": {
      "name": "character-design.png",
      "url": "https://...",
      "size": 2500000,
      "dimensions": { "width": 2000, "height": 2000 }
    },
    "selected_product": {
      "id": "validated-48",
      "name": "Premium T-Shirt",
      "category": "apparel",
      "blueprint": 48
    },
    "created_product": {
      "productKey": "validated-48-1698412800000-test",
      "title": "[TEST] Premium T-Shirt - character-design.png",
      "status": "test"
    },
    "optimization_result": {
      "message": "Image optimized for Premium T-Shirt",
      "strategy": "OPTIMIZE",
      "scaleFactor": 1.0,
      "processingTime": 245,
      "originalSize": 2500000,
      "optimizedSize": 1800000,
      "estimatedCost": 0
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No gallery images found",
  "details": "User has no images in their gallery"
}
```

## Test Data Flow

```
┌─────────────────────────────────────────────────┐
│ TEST HARNESS START                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Random Gallery Image │
        │ Selection           │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Random Product Type │
        │ Selection           │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Download Image      │
        │ Buffer              │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Create Test Product │
        │ in Database         │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────────────┐
        │ Optimize Image for Product  │
        │ - Analyze dimensions        │
        │ - Determine scale strategy  │
        │ - Apply enhancements        │
        └──────────┬──────────────────┘
                   │
                   ▼
        ┌─────────────────────────────┐
        │ Record Analytics Data       │
        │ - timesOptimized++          │
        │ - avgProcessingTime update  │
        │ - Write to Firebase         │
        └──────────┬──────────────────┘
                   │
                   ▼
        ┌─────────────────────────────┐
        │ Return Results to Client    │
        │ with detailed metrics       │
        └─────────────────────────────┘
```

## What Gets Tested

### Image Optimization Pipeline
- ✅ Image buffer download and processing
- ✅ Product specification matching
- ✅ Intelligent sizing logic (upscale/downscale/optimize)
- ✅ Image enhancement application
- ✅ Cost estimation for upscaling

### Product Creation
- ✅ Database storage of new products
- ✅ Image data persistence
- ✅ Product metadata (title, description, specs)
- ✅ Test product marking

### Analytics Recording
- ✅ Cache metrics writing to Firebase
- ✅ Optimization count tracking
- ✅ Processing time averaging
- ✅ Cost calculation accuracy

### Gallery Integration
- ✅ S3 image retrieval
- ✅ Gallery storage abstraction
- ✅ Image metadata extraction

## Troubleshooting

### "No gallery images found"
**Issue:** The test harness can't find any images in your gallery.

**Solution:**
1. Go to the Gallery section of Wavelength Lore
2. Upload at least one image to your gallery
3. Return to the test harness and try again

### "No product types available"
**Issue:** The product catalog is empty (shouldn't happen in normal usage).

**Solution:**
1. Restart the server: `npm start`
2. Check that `/api/merchandise/products` returns data
3. Verify `config/product-types.js` is loaded correctly

### "Failed to download image"
**Issue:** The test harness couldn't fetch the selected gallery image.

**Solution:**
1. Check that the image URL in your gallery is accessible
2. Verify the image is not corrupted
3. Try uploading a new image and running the test again

### "Test harness encountered an error"
**Issue:** An unexpected error occurred during optimization.

**Solution:**
1. Check the server logs for detailed error messages
2. Look for the error stack trace in the test response (development mode)
3. Verify ImageOptimizer service is working correctly
4. Restart the server and try again

## Server Logs

When running tests, watch the server console for detailed logging:

```
🧪 TEST HARNESS: optimize-random endpoint called
🖼️  Fetching gallery images for user: user123
✅ Selected random image: character-design.png
✅ Selected random product: Premium T-Shirt (validated-48)
📥 Downloading image: https://...
✅ Image downloaded: 2500000 bytes
🎨 Creating product: [TEST] Premium T-Shirt - character-design.png
✅ Product created: validated-48-1698412800000-test
🎨 Optimizing image for product: Premium T-Shirt
✅ Optimization complete: Image optimized for Premium T-Shirt
📊 Recording optimization analytics...
📊 recordOptimization called for validated-48
📊 Database initialized, writing to ref...
✅ Analytics recorded: {success: true, message: "Recorded optimization for validated-48"}
```

## Monitoring Cache Analytics

After running tests, check the cache analytics dashboard:

1. Go to **Forum Admin** (http://localhost:3001/forum/admin)
2. Click the **🎨 PERFECT PRINTING Cache** tab
3. You should see:
   - Metrics for tested products showing in the grid
   - Product rankings updated with test data
   - Real cache hit/miss statistics

## Iterating on Image Optimization

The test harness is designed to support iterative improvement of the image optimization algorithm:

### Workflow for Image Enhancement Improvements

1. **Run Initial Tests**
   - Click "Run 5 Tests" to generate baseline data
   - Note the optimization metrics (scale factors, processing times)

2. **Analyze Results**
   - Review which products are being optimized
   - Check the scale factors and strategies being applied
   - Look for patterns in the optimization results

3. **Enhance ImageOptimizer Service**
   - Modify `/services/ImageOptimizer.js` to improve algorithm
   - Add new image enhancement techniques
   - Fine-tune scale factors or strategy detection

4. **Test Again**
   - Run tests with updated code
   - Compare metrics to baseline
   - Validate improvements in image quality (visual inspection)

5. **Add New Features**
   - When ready to add advanced features (color correction, detail enhancement, etc.)
   - Use test harness to validate with diverse product types
   - Monitor analytics to track performance impact

## Future Enhancements

Potential additions to the test harness:

- [ ] Batch test scheduling (run tests at regular intervals)
- [ ] Image quality metrics comparison (original vs. optimized)
- [ ] Performance profiling (track optimization algorithm speed)
- [ ] Product variant testing (test multiple variants of same product)
- [ ] A/B testing framework (compare different optimization strategies)
- [ ] Export test results (CSV, JSON for analysis)
- [ ] Visual comparison viewer (see before/after optimized images)
- [ ] Regression testing (ensure previous optimizations still work)

## Key Files

- **Endpoint:** `routes/merchandise.js` - Test harness API endpoints
- **UI Page:** `views/test-harness.ejs` - Test harness UI
- **Optimizer:** `services/ImageOptimizer.js` - Image optimization logic
- **Analytics:** `services/cache-analytics-service.js` - Metrics recording
- **Product Types:** `config/product-types.js` - Product catalog

## Support

For issues or questions about the test harness:

1. Check this documentation first
2. Review server console logs for detailed error information
3. Check the test response JSON for specific error details
4. Restart the server if experiencing strange behavior

---

**Last Updated:** October 27, 2025
**Version:** 1.0
**Status:** Production Ready
