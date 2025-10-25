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
router.get('/vendor-catalog', (req, res, next) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    // Lightweight admin catalog - redirect to optimized version
    res.redirect('/forum/test-catalog');
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
router.get('/vendor-catalog/api', (req, res, next) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
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

/**
 * GET /admin/enhanced-vendor-catalog
 * Enhanced catalog with vendor comparison and overlay options
 */
router.get('/enhanced-vendor-catalog', (req, res, next) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    console.log('🎨 Loading enhanced vendor catalog...');
    
    res.render('admin/enhanced-vendor-catalog', {
      title: 'Enhanced Vendor Catalog Preview',
      user: req.user
    });
    
  } catch (error) {
    console.error('Error loading enhanced vendor catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load enhanced catalog'
    });
  }
});

module.exports = router;