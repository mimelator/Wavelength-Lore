/**
 * Banner API Routes
 * Admin endpoints for managing sitewide banners
 */

const express = require('express');
const router = express.Router();
const { requireGroup } = require('../middleware/groupAuth');
const bannerHelpers = require('../helpers/banner-helpers');

/**
 * Get all banners (admin only)
 */
router.get('/api/banners', requireGroup(['admin', 'content_manager']), async (req, res) => {
  try {
    const banners = await bannerHelpers.getAllBanners();
    res.json({ success: true, banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get active banners (public)
 */
router.get('/api/banners/active', async (req, res) => {
  try {
    const banners = await bannerHelpers.getActiveBanners();
    res.json({ success: true, banners });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get a specific banner
 */
router.get('/api/banners/:bannerId', requireGroup(['admin', 'content_manager']), async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await bannerHelpers.getBanner(bannerId);
    
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a new banner
 */
router.post('/api/banners', requireGroup(['admin', 'content_manager']), async (req, res) => {
  try {
    const bannerData = {
      ...req.body,
      createdBy: req.user?.uid || 'system'
    };
    
    const banner = await bannerHelpers.createBanner(bannerData);
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update a banner
 */
router.put('/api/banners/:bannerId', requireGroup(['admin', 'content_manager']), async (req, res) => {
  try {
    const { bannerId } = req.params;
    const updates = req.body;
    
    const banner = await bannerHelpers.updateBanner(bannerId, updates);
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Toggle banner active status
 */
router.patch('/api/banners/:bannerId/toggle', requireGroup(['admin', 'content_manager']), async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await bannerHelpers.toggleBannerStatus(bannerId);
    res.json({ success: true, banner });
  } catch (error) {
    console.error('Error toggling banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete a banner
 */
router.delete('/api/banners/:bannerId', requireGroup(['admin']), async (req, res) => {
  try {
    const { bannerId } = req.params;
    await bannerHelpers.deleteBanner(bannerId);
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
