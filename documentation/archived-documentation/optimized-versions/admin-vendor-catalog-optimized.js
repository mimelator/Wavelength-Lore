/**
 * Optimized Admin Vendor Catalog Interface
 * 
 * Performance optimizations:
 * - Lazy loading with pagination
 * - Cached data with minimal API calls
 * - Separate user/admin code paths
 * - Background image enrichment
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireAdmin } = require('../middleware/auth');

/**
 * GET /admin/vendor-catalog-optimized
 * Fast-loading catalog with pagination and lazy loading
 */
router.get('/vendor-catalog-optimized', (req, res, next) => {
  // For local development, bypass authentication
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  // For production, require authentication
  return ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    console.log('⚡ Loading optimized vendor catalog...');
    
    res.render('admin/vendor-catalog-optimized', {
      title: 'Optimized Vendor Catalog',
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading optimized catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load catalog'
    });
  }
});

/**
 * GET /admin/vendor-catalog-optimized/api
 * Fast API endpoint with pagination and minimal data
 */
router.get('/vendor-catalog-optimized/api', (req, res, next) => {
  // For local development, bypass authentication
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  // For production, require authentication
  return ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log(`⚡ Fast API: Loading page ${page}, limit ${limit}`);
    
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
    
    console.log(`✅ Fast API: Returning ${paginatedPreviews.length}/${totalCount} products`);
    
    res.json({
      success: true,
      products: paginatedPreviews,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error in fast catalog API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load catalog data'
    });
  }
});

/**
 * GET /admin/vendor-catalog-optimized/image/:productId
 * On-demand image loading for specific products
 */
router.get('/vendor-catalog-optimized/image/:productId', (req, res, next) => {
  // For local development, bypass authentication
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  // For production, require authentication
  return ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`🖼️ Loading images for product: ${productId}`);
    
    const EnhancedPrintifyService = require('../services/enhanced-printify-service');
    const printifyService = new EnhancedPrintifyService();
    
    const productResult = await printifyService.getProduct(productId);
    
    if (productResult.success && productResult.product?.images) {
      res.json({
        success: true,
        productId: productId,
        images: productResult.product.images
      });
    } else {
      res.json({
        success: false,
        productId: productId,
        images: []
      });
    }
    
  } catch (error) {
    console.error(`Error loading images for ${req.params.productId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load product images'
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