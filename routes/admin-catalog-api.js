/**
 * Lightweight Admin Catalog API
 * Non-graphical, fast-loading catalog endpoints
 */

const express = require('express');
const router = express.Router();

/**
 * GET /admin/catalog/stats
 * Quick statistics without loading full data
 */
router.get('/catalog/stats', async (req, res) => {
  try {
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    
    // Quick stats without heavy database operations
    const stats = {
      totalProducts: 0,
      lastUpdated: new Date().toISOString(),
      status: 'active',
      environment: isLocal ? 'local' : 'production'
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/catalog/list
 * Paginated product list (text-only)
 */
router.get('/catalog/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Mock data for now - replace with actual lightweight query
    const products = [];
    
    res.json({
      success: true,
      products,
      pagination: { page, limit, total: 0, hasMore: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;