/**
 * Banner Helpers
 * Manages sitewide banners for announcements, alerts, and messages
 */

const { fetchDataAsAdmin, writeDataAsAdmin, deleteDataAsAdmin } = require('./firebase-admin-utils');

/**
 * Banner Status Types
 */
const BannerStatus = {
  INFO: 'info',           // Blue - General information
  SUCCESS: 'success',     // Green - Positive updates
  WARNING: 'warning',     // Orange - Important notices
  ALERT: 'alert',         // Red - Critical alerts
  ANNOUNCEMENT: 'announcement' // Purple - Special announcements
};

/**
 * Get all active banners
 * @returns {Promise<Array>} Array of active banner objects
 */
async function getActiveBanners() {
  try {
    const banners = await fetchDataAsAdmin('banners');
    
    if (!banners) {
      return [];
    }
    
    const now = Date.now();
    const activeBanners = [];
    
    // Convert to array and filter active banners
    Object.keys(banners).forEach(id => {
      const banner = banners[id];
      
      // Check if banner is active
      if (banner.active !== false) {
        // Check if within date range (if specified)
        const startValid = !banner.startDate || now >= banner.startDate;
        const endValid = !banner.endDate || now <= banner.endDate;
        
        if (startValid && endValid) {
          activeBanners.push({
            id,
            ...banner
          });
        }
      }
    });
    
    // Sort by priority (higher first), then by creation date
    activeBanners.sort((a, b) => {
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    
    return activeBanners;
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return [];
  }
}

/**
 * Get all banners (for admin panel)
 * @returns {Promise<Array>} Array of all banner objects
 */
async function getAllBanners() {
  try {
    const banners = await fetchDataAsAdmin('banners');
    
    if (!banners) {
      return [];
    }
    
    const bannerArray = Object.keys(banners).map(id => ({
      id,
      ...banners[id]
    }));
    
    // Sort by creation date (newest first)
    bannerArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return bannerArray;
  } catch (error) {
    console.error('Error fetching all banners:', error);
    return [];
  }
}

/**
 * Get a specific banner by ID
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object|null>} Banner object or null
 */
async function getBanner(bannerId) {
  try {
    const banner = await fetchDataAsAdmin(`banners/${bannerId}`);
    
    if (!banner) {
      return null;
    }
    
    return {
      id: bannerId,
      ...banner
    };
  } catch (error) {
    console.error('Error fetching banner:', error);
    return null;
  }
}

/**
 * Create a new banner
 * @param {Object} bannerData - Banner data
 * @returns {Promise<Object>} Created banner with ID
 */
async function createBanner(bannerData) {
  try {
    const bannerId = `banner_${Date.now()}`;
    const banner = {
      message: bannerData.message || '',
      status: bannerData.status || BannerStatus.INFO,
      active: bannerData.active !== false,
      priority: bannerData.priority || 0,
      dismissible: bannerData.dismissible !== false,
      link: bannerData.link || null,
      linkText: bannerData.linkText || null,
      startDate: bannerData.startDate || null,
      endDate: bannerData.endDate || null,
      createdAt: Date.now(),
      createdBy: bannerData.createdBy || 'system'
    };
    
    await writeDataAsAdmin(`banners/${bannerId}`, banner);
    
    return {
      id: bannerId,
      ...banner
    };
  } catch (error) {
    console.error('Error creating banner:', error);
    throw error;
  }
}

/**
 * Update an existing banner
 * @param {string} bannerId - Banner ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated banner
 */
async function updateBanner(bannerId, updates) {
  try {
    const existingBanner = await getBanner(bannerId);
    
    if (!existingBanner) {
      throw new Error('Banner not found');
    }
    
    const updatedBanner = {
      ...existingBanner,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Remove the id field before saving (it's the key)
    const { id, ...bannerData } = updatedBanner;
    
    await writeDataAsAdmin(`banners/${bannerId}`, bannerData);
    
    return updatedBanner;
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
}

/**
 * Delete a banner
 * @param {string} bannerId - Banner ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteBanner(bannerId) {
  try {
    await deleteDataAsAdmin(`banners/${bannerId}`);
    return true;
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
}

/**
 * Toggle banner active status
 * @param {string} bannerId - Banner ID
 * @returns {Promise<Object>} Updated banner
 */
async function toggleBannerStatus(bannerId) {
  try {
    const banner = await getBanner(bannerId);
    
    if (!banner) {
      throw new Error('Banner not found');
    }
    
    return await updateBanner(bannerId, {
      active: !banner.active
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    throw error;
  }
}

module.exports = {
  BannerStatus,
  getActiveBanners,
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
};
