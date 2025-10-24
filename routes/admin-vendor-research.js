/**
 * Admin Vendor Research Interface
 * 
 * Admin-only tool for researching and evaluating print vendors
 * Allows comparison of different providers for each product category
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireAdmin } = require('../middleware/auth');
const VendorPreviewService = require('../services/vendor-preview-service');
const galleryStorage = require('../utils/gallery/storage');
const AutoEnhancedPrintifyService = require('../services/auto-enhanced-printify-service');
const GlobalImageCache = require('../services/global-image-cache');
const enhancedMerchandiseDB = require('../services/enhanced-merchandise-database');

// Sample vendor research data (to be populated with real API data)
const VendorResearchData = {
  tshirts: {
    blueprintId: 5,
    currentProvider: 3,
    alternatives: [
      {
        id: 1,
        name: "Print Provider A",
        location: "California, USA",
        priceRange: "$8.50 - $12.50",
        handlingTime: "3-5 business days",
        pros: ["Fast shipping", "High quality cotton", "Good color options"],
        cons: ["Higher cost", "Limited sizes"],
        qualityRating: 4.5,
        costRating: 3.0,
        speedRating: 4.8,
        notes: "Premium quality but more expensive"
      },
      {
        id: 3,
        name: "Print Provider B (Current)",
        location: "North Carolina, USA", 
        priceRange: "$6.80 - $9.20",
        handlingTime: "4-7 business days",
        pros: ["Competitive pricing", "Good quality", "Wide size range"],
        cons: ["Slower shipping", "Limited color options"],
        qualityRating: 4.2,
        costRating: 4.5,
        speedRating: 3.8,
        notes: "Current provider - good balance of quality and cost"
      },
      {
        id: 7,
        name: "Print Provider C",
        location: "Florida, USA",
        priceRange: "$5.50 - $8.00",
        handlingTime: "5-8 business days",
        pros: ["Lowest cost", "Eco-friendly options", "Large capacity"],
        cons: ["Slower fulfillment", "Quality concerns"],
        qualityRating: 3.8,
        costRating: 5.0,
        speedRating: 3.2,
        notes: "Budget option but quality may vary"
      }
    ]
  },
  mugs: {
    blueprintId: 17,
    currentProvider: 3, // Use valid vendor ID
    alternatives: [
      {
        id: 1,
        name: "Premium Mug Provider",
        location: "California, USA",
        priceRange: "$8.99 - $12.99",
        handlingTime: "3-5 business days",
        pros: ["High quality ceramic", "Dishwasher safe", "Vibrant colors"],
        cons: ["Higher cost", "Limited designs"],
        qualityRating: 4.7,
        costRating: 3.2,
        speedRating: 4.5,
        notes: "Premium ceramic mugs with excellent durability"
      },
      {
        id: 3,
        name: "Standard Mug Provider (Current)",
        location: "North Carolina, USA",
        priceRange: "$6.49 - $9.99",
        handlingTime: "4-7 business days",
        pros: ["Good quality", "Competitive pricing", "Reliable"],
        cons: ["Standard quality", "Limited options"],
        qualityRating: 4.1,
        costRating: 4.3,
        speedRating: 3.9,
        notes: "Current provider - good balance of quality and cost"
      },
      {
        id: 7,
        name: "Economy Mug Provider",
        location: "Texas, USA",
        priceRange: "$4.99 - $7.49",
        handlingTime: "5-8 business days",
        pros: ["Budget friendly", "Large volume", "Quick setup"],
        cons: ["Basic quality", "Limited colors"],
        qualityRating: 3.6,
        costRating: 4.8,
        speedRating: 3.4,
        notes: "Budget option for high volume orders"
      }
    ]
  },
  posters: {
    blueprintId: 7,
    currentProvider: 1,
    alternatives: [
      {
        id: 1,
        name: "Premium Prints (Current)",
        location: "California, USA",
        priceRange: "$3.50 - $8.00",
        handlingTime: "2-4 business days",
        pros: ["Museum quality paper", "Color accuracy", "Fast turnaround"],
        cons: ["Premium pricing", "Limited size options"],
        qualityRating: 4.9,
        costRating: 3.2,
        speedRating: 4.7,
        notes: "Excellent for high-quality art prints"
      },
      {
        id: 4,
        name: "Standard Print Co",
        location: "Michigan, USA",
        priceRange: "$2.20 - $5.50",
        handlingTime: "3-7 business days",
        pros: ["Good value", "Multiple paper types", "Reliable"],
        cons: ["Average quality", "Slower shipping"],
        qualityRating: 4.0,
        costRating: 4.3,
        speedRating: 3.8,
        notes: "Solid middle-ground option"
      }
    ]
  }
};

/**
 * GET /admin/vendor-research/preview-generator
 * Interface for generating vendor previews with user artwork
 */
router.get('/vendor-research/preview-generator', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user's gallery images for preview generation
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    
    // Get recent vendor comparisons
    const vendorPreviewService = new VendorPreviewService();
    const recentComparisons = await vendorPreviewService.merchandiseDB.getVendorComparisons(userId, 5);
    
    res.render('admin/vendor-preview-generator', {
      title: 'Vendor Preview Generator',
      userImages: userImages.slice(0, 20), // Limit to recent 20 images
      vendorData: VendorResearchData,
      recentComparisons,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading vendor preview generator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load vendor preview generator'
    });
  }
});

/**
 * POST /admin/vendor-research/generate-previews
 * Generate product previews from multiple vendors using selected artwork
 */
router.post('/vendor-research/generate-previews', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { imageId, productType, vendorIds } = req.body;
    const userId = req.user.uid;
    
    console.log('🎨 Admin preview generation request:', {
      imageId,
      productType,
      vendorIds,
      admin: req.user.email
    });
    
    if (!imageId || !productType || !vendorIds || vendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: imageId, productType, or vendorIds'
      });
    }
    
    const vendorPreviewService = new VendorPreviewService();
    
    // Generate previews from all selected vendors
    const previewResult = await vendorPreviewService.generateVendorPreviews(
      imageId, 
      productType, 
      vendorIds,
      { previewMode: true }
    );
    
    // Generate comparison report
    console.log('🔍 Debug: About to generate comparison report with previews:', previewResult.previews?.length || 'undefined');
    let comparisonReport;
    try {
      comparisonReport = await vendorPreviewService.generateComparisonReport(
        previewResult.previews,
        { imageId, productType }
      );
      console.log('✅ Comparison report generated successfully');
    } catch (reportError) {
      console.error('❌ Error generating comparison report:', reportError);
      comparisonReport = {
        error: 'Failed to generate comparison report',
        imageInfo: { imageId, productType },
        vendorCount: 0,
        comparisons: [],
        recommendations: [],
        generatedAt: new Date().toISOString()
      };
    }
    
    // Store the comparison for future reference
    const comparisonData = {
      id: `preview-${Date.now()}`,
      imageId,
      productType,
      vendorIds,
      previews: previewResult.previews.map(preview => {
        const { cacheOptimization, ...cleanPreview } = preview;
        return cleanPreview;
      }),
      report: comparisonReport,
      requestedBy: req.user.email
    };
    
    await vendorPreviewService.storePreviewComparison(userId, comparisonData);
    
    res.json({
      success: true,
      message: `Generated ${previewResult.previews.length} vendor previews`,
      data: {
        previews: previewResult.previews,
        report: comparisonReport,
        cachePerformance: previewResult.cachePerformance, // Include cache metrics
        errors: previewResult.errors
      }
    });
    
  } catch (error) {
    console.error('Error generating vendor previews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate vendor previews: ' + error.message
    });
  }
});

/**
 * GET /admin/vendor-research/comparison/:comparisonId
 * View a specific vendor comparison
 */
router.get('/vendor-research/comparison/:comparisonId', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { comparisonId } = req.params;
    const userId = req.user.uid;
    
    const vendorPreviewService = new VendorPreviewService();
    const comparisons = await vendorPreviewService.merchandiseDB.getVendorComparisons(userId);
    
    const comparison = comparisons.find(c => c.id === comparisonId);
    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'Comparison not found'
      });
    }
    
    res.render('admin/vendor-comparison-view', {
      title: 'Vendor Comparison Results',
      comparison,
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading vendor comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load vendor comparison'
    });
  }
});

/**
 * DELETE /admin/vendor-research/comparison/:comparisonId
 * Delete a vendor comparison
 */
router.delete('/vendor-research/comparison/:comparisonId', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { comparisonId } = req.params;
    const userId = req.user.uid;
    
    const vendorPreviewService = new VendorPreviewService();
    await vendorPreviewService.merchandiseDB.deleteVendorComparison(userId, comparisonId);
    
    res.json({
      success: true,
      message: 'Vendor comparison deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting vendor comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vendor comparison'
    });
  }
});
router.get('/vendor-research', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    res.render('admin/vendor-research', {
      title: 'Vendor Research Dashboard',
      vendorData: VendorResearchData,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading vendor research:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load vendor research dashboard'
    });
  }
});

/**
 * POST /admin/vendor-research/sample-order
 * Create a sample order for vendor evaluation
 */
router.post('/vendor-research/sample-order', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { productType, providerId, testImageId, shippingAddress } = req.body;
    
    console.log('🧪 Admin sample order request:', {
      productType,
      providerId,
      testImageId,
      admin: req.user.email
    });
    
    // Here you would create a sample order using the specified provider
    // For now, we'll simulate the process
    
    const orderData = {
      orderId: `SAMPLE-${Date.now()}`,
      productType,
      providerId,
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      purpose: 'vendor_evaluation',
      requestedBy: req.user.email,
      notes: 'Admin sample order for vendor quality evaluation'
    };
    
    res.json({
      success: true,
      message: 'Sample order created successfully',
      order: orderData
    });
    
  } catch (error) {
    console.error('Error creating sample order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sample order'
    });
  }
});

/**
 * POST /admin/vendor-research/update-provider
 * Update the preferred provider for a product category
 */
router.post('/vendor-research/update-provider', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { productType, newProviderId, reason } = req.body;
    
    console.log('⚙️ Admin provider update:', {
      productType,
      newProviderId,
      reason,
      admin: req.user.email
    });
    
    // Here you would update the product-types.js configuration
    // For now, we'll log the change and return success
    
    // In a real implementation, you might:
    // 1. Update the config file
    // 2. Restart the service or reload configuration
    // 3. Log the change for audit purposes
    // 4. Notify other admins of the change
    
    res.json({
      success: true,
      message: `Provider updated for ${productType}`,
      change: {
        productType,
        oldProvider: VendorResearchData[productType]?.currentProvider,
        newProvider: newProviderId,
        reason,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider'
    });
  }
});

/**
 * POST /admin/vendor-research/quality-assessment
 * Submit quality assessment for a vendor after receiving samples
 */
router.post('/vendor-research/quality-assessment', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { 
      providerId, 
      productType, 
      qualityRating, 
      costRating, 
      speedRating, 
      notes,
      images 
    } = req.body;
    
    console.log('📝 Admin quality assessment:', {
      providerId,
      productType,
      ratings: { qualityRating, costRating, speedRating },
      assessedBy: req.user.email
    });
    
    const assessment = {
      id: `ASSESS-${Date.now()}`,
      providerId,
      productType,
      ratings: {
        quality: parseFloat(qualityRating),
        cost: parseFloat(costRating),
        speed: parseFloat(speedRating)
      },
      notes,
      images: images || [],
      assessedBy: req.user.email,
      assessedAt: new Date().toISOString()
    };
    
    // In a real implementation, save this to a database
    // and update the vendor research data
    
    res.json({
      success: true,
      message: 'Quality assessment saved successfully',
      assessment
    });
    
  } catch (error) {
    console.error('Error saving quality assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save quality assessment'
    });
  }
});

/**
 * GET /admin/vendor-research/api/live-data
 * Fetch live vendor data from Printify API (when available)
 */
router.get('/vendor-research/api/live-data', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    // This would fetch live data from Printify API
    // For now, return cached/simulated data
    
    res.json({
      success: true,
      data: VendorResearchData,
      lastUpdated: new Date().toISOString(),
      note: 'Using cached vendor data - live API integration pending'
    });
    
  } catch (error) {
    console.error('Error fetching live vendor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live vendor data'
    });
  }
});

/**
 * GET /admin/vendor-research/cache-manager
 * Global image cache management interface
 */
router.get('/vendor-research/cache-manager', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const autoEnhancedService = new AutoEnhancedPrintifyService();
    const globalCache = new GlobalImageCache();
    
    // Get cache performance metrics
    const metrics = await autoEnhancedService.getCachePerformanceMetrics();
    
    // Get cache status
    const cacheStatus = {
      overall: metrics.summary?.hitRate > 0.5 ? 'healthy' : metrics.summary?.hitRate > 0.2 ? 'warning' : 'error',
      globalCache: true, // Assume cache is active
      lastUpdated: new Date()
    };
    
    // Generate recommendations
    const dbMetrics = await enhancedMerchandiseDB.getCachePerformanceMetrics();
    const recommendations = dbMetrics.recommendations || [];
    
    res.render('admin/global-cache-manager', {
      title: 'Global Cache Manager',
      metrics: metrics || { summary: {} },
      cacheStatus,
      recommendations,
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading cache manager:', error);
    res.status(500).render('error', { 
      message: 'Failed to load cache manager',
      error: error 
    });
  }
});

/**
 * GET /admin/vendor-research/cache-metrics
 * Get current cache performance metrics (API endpoint)
 */
router.get('/vendor-research/cache-metrics', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const autoEnhancedService = new AutoEnhancedPrintifyService();
    const metrics = await autoEnhancedService.getCachePerformanceMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting cache metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/vendor-research/cache-migration
 * Run cache migration from legacy to global cache
 */
router.post('/vendor-research/cache-migration', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { batchSize = 10 } = req.body;
    
    enhancedMerchandiseDB.setMigrationMode(true);
    
    const migrationResult = await enhancedMerchandiseDB.runBulkMigration(batchSize);
    
    res.json({
      success: migrationResult.success,
      processed: migrationResult.results?.length || 0,
      hasMore: migrationResult.hasMore,
      results: migrationResult.results,
      error: migrationResult.error
    });
    
  } catch (error) {
    console.error('Error running cache migration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/vendor-research/cache-report
 * Generate cache performance report
 */
router.get('/vendor-research/cache-report', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const autoEnhancedService = new AutoEnhancedPrintifyService();
    const metrics = await autoEnhancedService.getCachePerformanceMetrics();
    
    // Generate a simple text report (in production, this could be PDF)
    const report = `
GLOBAL IMAGE CACHE PERFORMANCE REPORT
Generated: ${new Date().toISOString()}

SUMMARY METRICS:
- Cache Hit Rate: ${(metrics.summary?.hitRate * 100 || 0).toFixed(1)}%
- Total Cache Hits: ${metrics.summary?.totalCacheHits || 0}
- Total Cache Misses: ${metrics.summary?.totalCacheMisses || 0}
- Enhancements Created: ${metrics.summary?.enhancementsCreated || 0}
- Enhancements Reused: ${metrics.summary?.enhancementsReused || 0}

PERFORMANCE SAVINGS:
- Processing Time Saved: ${metrics.summary?.estimatedProcessingSaved?.estimatedTimeSavedMinutes || 0} minutes
- Estimated Cost Saved: $${metrics.summary?.estimatedProcessingSaved?.estimatedCostSavedUSD || 0}
- Optimization Level: ${metrics.summary?.estimatedProcessingSaved?.percentageOptimization || 0}%

RECOMMENDATIONS:
${metrics.detailed?.merchandiseDB?.recommendations?.map(r => `- ${r.message}`).join('\n') || 'No recommendations at this time'}

END OF REPORT
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="cache-report-${new Date().toISOString().split('T')[0]}.txt"`);
    res.send(report);
    
  } catch (error) {
    console.error('Error generating cache report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/vendor-research/cache-cleanup
 * Clean up old cache entries
 */
router.post('/vendor-research/cache-cleanup', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { maxAgeMonths = 6, confirmAction } = req.body;
    
    if (confirmAction !== 'CLEANUP_CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Cleanup requires admin confirmation'
      });
    }
    
    const globalCache = new GlobalImageCache();
    const cleanupResult = await globalCache.cleanupOldCacheEntries(maxAgeMonths);
    
    res.json({
      success: cleanupResult.success,
      removed: cleanupResult.removed || 0,
      message: cleanupResult.message,
      error: cleanupResult.error
    });
    
  } catch (error) {
    console.error('Error running cache cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/vendor-research/catalog
 * Complete catalog of all vendor preview products with generation capability
 */
router.get('/vendor-research/catalog', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Loading vendor preview catalog for admin...');
    
    const userId = req.user.uid;
    
    // Get user's gallery images for new preview generation
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    
    // Get all existing vendor preview products
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const helper = new VendorPreviewHelper();
    const allPreviews = await helper.getAllVendorPreviews();
    
    console.log(`✅ Found ${allPreviews.length} existing vendor previews`);
    console.log(`✅ Found ${userImages.length} user gallery images`);
    
    res.render('admin/vendor-preview-catalog', {
      title: 'Vendor Preview Catalog',
      allPreviews: allPreviews,
      userImages: userImages.slice(0, 20), // Limit for UI performance
      vendorData: VendorResearchData,
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading vendor preview catalog:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load vendor preview catalog',
      error: error
    });
  }
});

// Route to generate a single vendor preview product
router.post('/vendor-research/generate-single-preview', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    console.log('🎨 Starting single preview generation...');
    const { imageId, productType } = req.body;
    
    if (!imageId || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: imageId and productType'
      });
    }
    
    const userId = req.user.uid;
    console.log(`📸 Generating preview for image: ${imageId}, type: ${productType}, user: ${userId}`);
    
    // Use the vendor preview service to generate
    const VendorPreviewService = require('../services/vendor-preview-service');
    const result = await VendorPreviewService.generateVendorPreview(
      imageId,
      productType,
      userId
    );
    
    if (result.success) {
      console.log(`✅ Successfully generated vendor preview: ${result.productId}`);
      res.json({
        success: true,
        productId: result.productId,
        message: 'Preview product generated successfully'
      });
    } else {
      console.error('❌ Failed to generate vendor preview:', result.error);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate preview'
      });
    }
    
  } catch (error) {
    console.error('❌ Error in single preview generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Route to delete a vendor preview product
router.delete('/vendor-research/delete-preview', ensureAuthenticated, requireAdmin, async (req, res) => {
  // Initialize enhanced diagnostics
  const VendorPreviewDiagnostics = require('../utils/vendor-preview-diagnostics');
  const diagnostics = new VendorPreviewDiagnostics();
  
  try {
    // Enhanced logging and route health check
    const routeHealth = diagnostics.validateRouteHealth(req, 'delete-preview');
    console.log('🗑️ Starting enhanced preview deletion...');
    
    // Validate delete request
    const validation = diagnostics.validateDeleteRequest(req);
    if (!validation.valid) {
      console.error('❌ Delete request validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        warnings: validation.warnings
      });
    }
    
    const { cacheKey } = req.body;
    console.log(`🗑️ Deleting preview with cache key: ${cacheKey} (validated)`);
    
    // Use enhanced delete operation with diagnostics
    const MerchandiseDatabase = require('../services/merchandise-database');
    const result = await diagnostics.enhancedDeletePreview(cacheKey, MerchandiseDatabase);
    
    if (result.success) {
      console.log(`✅ Successfully deleted vendor preview: ${cacheKey}`);
      console.log(`📊 Operation details:`, JSON.stringify(result.operation, null, 2));
      
      res.json({
        success: true,
        message: result.message,
        operation: result.operation,
        diagnostics: {
          validation,
          routeHealth
        }
      });
    } else {
      console.error('❌ Failed to delete vendor preview:', result.error);
      console.error('📊 Operation details:', JSON.stringify(result.operation, null, 2));
      
      res.status(500).json({
        success: false,
        error: result.error,
        operation: result.operation,
        suggestion: result.suggestion,
        diagnostics: {
          validation,
          routeHealth
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error in preview deletion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;