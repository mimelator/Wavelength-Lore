/**
 * Test Catalog Route - No Authentication Required
 * Simple route to test the optimized catalog functionality
 */

const express = require('express');
const router = express.Router();

/**
 * GET /test-catalog
 * Test route for optimized catalog without authentication
 */
router.get('/test-catalog', async (req, res) => {
  try {
    console.log('⚡ Loading test catalog...');
    
    res.render('admin/vendor-catalog-optimized', {
      title: 'Test Optimized Vendor Catalog',
      user: { uid: 'test-user', name: 'Test User' }
    });
    
  } catch (error) {
    console.error('Error loading test catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load catalog'
    });
  }
});

/**
 * GET /test-catalog/api
 * Test API endpoint for catalog data
 */
router.get('/test-catalog/api', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log(`⚡ Test API: Loading page ${page}, limit ${limit}`);
    
    const merchandiseDB = require('../services/merchandise-database');
    
    // Get minimal data without expensive enrichment
    const allPreviews = await getMinimalVendorPreviews(merchandiseDB);
    
    // Apply pagination
    const totalCount = allPreviews.length;
    const paginatedPreviews = allPreviews.slice(skip, skip + limit);
    
    // Add basic stats
    const stats = {
      totalProducts: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + limit < totalCount
    };
    
    console.log(`✅ Test API: Returning ${paginatedPreviews.length}/${totalCount} products`);
    
    res.json({
      success: true,
      products: paginatedPreviews,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error in test catalog API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load catalog data'
    });
  }
});

/**
 * Fast minimal data fetcher - no expensive operations
 */
async function getMinimalVendorPreviews(merchandiseDB) {
  try {
    merchandiseDB.initializeDatabase();
    
    const previewRef = merchandiseDB.db.ref('merchandise/previewCache');
    const snapshot = await previewRef.once('value');
    const cacheData = snapshot.val() || {};
    
    const previews = [];
    const friendlyNames = require('../utils/printify-friendly-names');
    
    Object.keys(cacheData).forEach(cacheKey => {
      const preview = cacheData[cacheKey];
      if (preview?.productId) {
        const providerBlueprintInfo = friendlyNames.formatProviderBlueprintDisplay(
          preview.blueprintId,
          preview.providerId
        );
        
        // Minimal data only - no expensive operations
        previews.push({
          productId: preview.productId,
          title: preview.title || 'Vendor Preview',
          sourceImage: preview.sourceImage || 'Unknown',
          blueprintId: preview.blueprintId,
          providerId: preview.providerId,
          createdAt: preview.createdAt,
          cacheKey: cacheKey,
          blueprintName: providerBlueprintInfo.blueprint.display,
          providerName: providerBlueprintInfo.provider.display,
          // Placeholder for lazy-loaded images
          hasImages: false,
          imageCount: 0
        });
      }
    });
    
    // Sort by creation date (newest first)
    previews.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    return previews;
  } catch (error) {
    console.error('Error getting minimal vendor previews:', error);
    return [];
  }
}

module.exports = router;