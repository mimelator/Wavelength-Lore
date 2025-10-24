/**
 * Admin Vendor Catalog Interface
 * 
 * Displays ALL vendor preview products in a comprehensive catalog view
 * Shows products created by both api-product-preview-builder.js and vendor comparison system
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireAdmin } = require('../middleware/auth');
const VendorPreviewHelper = require('../utils/vendor-preview-helper');

/**
 * GET /admin/vendor-catalog
 * Display complete catalog of all vendor preview products
 */
router.get('/vendor-catalog', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    console.log('📋 Loading complete vendor preview catalog...');
    
    const previewHelper = new VendorPreviewHelper();
    
    // Get all vendor preview products from the cache system
    const allPreviews = await previewHelper.getAllVendorPreviews();
    
    console.log(`📊 Found ${allPreviews.length} vendor preview products`);
    
    // Organize previews by blueprint/product type for better display
    const catalogData = {
      totalProducts: allPreviews.length,
      byBlueprint: {},
      byProvider: {},
      recentProducts: allPreviews.slice(0, 20), // Most recent 20
      allProducts: allPreviews
    };
    
    // Group by blueprint ID
    allPreviews.forEach(preview => {
      const blueprint = preview.blueprintId || 'unknown';
      if (!catalogData.byBlueprint[blueprint]) {
        catalogData.byBlueprint[blueprint] = [];
      }
      catalogData.byBlueprint[blueprint].push(preview);
    });
    
    // Group by provider ID
    allPreviews.forEach(preview => {
      const provider = preview.providerId || 'unknown';
      if (!catalogData.byProvider[provider]) {
        catalogData.byProvider[provider] = [];
      }
      catalogData.byProvider[provider].push(preview);
    });
    
    res.render('admin/vendor-catalog', {
      title: 'Complete Vendor Preview Catalog',
      catalog: catalogData,
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading vendor catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load vendor catalog'
    });
  }
});

/**
 * GET /admin/vendor-catalog/api
 * API endpoint for catalog data (for AJAX loading)
 */
router.get('/vendor-catalog/api', ensureAuthenticated, requireAdmin, async (req, res) => {
  try {
    const previewHelper = new VendorPreviewHelper();
    const allPreviews = await previewHelper.getAllVendorPreviews();
    
    res.json({
      success: true,
      totalProducts: allPreviews.length,
      products: allPreviews
    });
    
  } catch (error) {
    console.error('Error loading catalog API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load catalog data'
    });
  }
});

module.exports = router;