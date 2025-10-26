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
 * GET /admin/catalog
 * Display unified admin catalog explorer
 */
router.get('/catalog', (req, res, next) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  if (isLocal) {
    return next();
  }
  ensureAuthenticated(req, res, () => {
    requireAdmin(req, res, next);
  });
}, async (req, res) => {
  try {
    console.log('🛍️ Loading unified admin catalog explorer...');
    
    res.render('admin/unified-catalog-explorer', {
      title: 'Admin Product Catalog - Wavelength',
      user: req.user || { uid: 'admin', name: 'Admin User' }
    });
  } catch (error) {
    console.error('Error loading admin catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load admin catalog'
    });
  }
});

/**
 * Legacy redirect for old vendor-catalog route
 */
router.get('/vendor-catalog', (req, res) => {
  res.redirect('/admin/catalog');
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
 * Legacy redirects for old catalog routes
 */
router.get('/enhanced-vendor-catalog', (req, res) => {
  res.redirect('/admin/catalog');
});

router.get('/vendor-catalog-optimized', (req, res) => {
  res.redirect('/admin/catalog');
});

module.exports = router;