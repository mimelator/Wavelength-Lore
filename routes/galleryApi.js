/**
 * Gallery API Routes
 * 
 * Handles API endpoints for user gallery operations
 * including image upload, retrieval, and deletion with S3 storage
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');
const galleryStorage = require('../utils/gallery/storage');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * GET /api/gallery/user/storage-stats
 * Get user's gallery storage statistics
 */
router.get('/api/gallery/user/storage-stats', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userGroups = res.locals.userGroups || [];
    
    const stats = await galleryStorage.getUserStorageStats(userId, userGroups);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        // Format values for human-readable output
        usedFormatted: formatBytes(stats.used),
        quotaFormatted: stats.quota === -1 ? 'Unlimited' : formatBytes(stats.quota),
        remainingFormatted: stats.remaining === -1 ? 'Unlimited' : formatBytes(stats.remaining)
      }
    });
  } catch (error) {
    console.error('Error getting user storage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage statistics'
    });
  }
});

/**
 * GET /api/gallery/user/images
 * Get user's gallery images
 */
router.get('/api/gallery/user/images', ensureAuthenticated, async (req, res) => {
  try {
    // Check if S3 connection is available
    const s3Status = req.app.locals.galleryS3Status;
    if (s3Status && !s3Status.connected) {
      console.warn(`⚠️ Gallery API: S3 connection not available`);
      return res.status(503).json({
        success: false,
        error: 'Gallery storage currently unavailable',
        details: s3Status.error
      });
    }
    
    const userId = req.user.uid;
    console.log(`🔍 Gallery API: Fetching images for user ${userId}`);
    console.log(`👤 User info:`, req.user);
    
    // Debug test user info for local development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Development mode detected, checking test user setup`);
    }
    
    const images = await galleryStorage.listUserGalleryImages(userId);
    console.log(`📊 Gallery API: Found ${images.length} images for user ${userId}`);
    
    // Format the response for the frontend
    const formattedImages = images.map(image => ({
      id: path.basename(image.relativePath),
      url: image.url,
      thumbnailUrl: image.url, // Use the same URL for thumbnail
      title: image.originalName || image.fileName,
      size: image.size,
      sizeFormatted: formatBytes(image.size),
      uploadedAt: image.uploadedAt || image.lastModified,
      relativePath: image.relativePath
    }));
    
    console.log(`📤 Gallery API: Sending ${formattedImages.length} formatted images to client`);
    res.json({
      success: true,
      images: formattedImages
    });
  } catch (error) {
    console.error('Error getting user gallery images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gallery images'
    });
  }
});

/**
 * POST /api/gallery/user/upload
 * Upload an image to the user's gallery
 */
router.post('/api/gallery/user/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
  try {
    // Check if S3 connection is available
    const s3Status = req.app.locals.galleryS3Status;
    if (s3Status && !s3Status.connected) {
      console.warn(`⚠️ Gallery API: S3 connection not available`);
      return res.status(503).json({
        success: false,
        error: 'Gallery storage currently unavailable',
        details: s3Status.error
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const userId = req.user.uid;
    const userGroups = res.locals.userGroups || [];
    
    console.log(`📤 Uploading gallery image for user ${userId}`);
    console.log(`   File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Original name: ${req.file.originalname}`);
    
    // Extract title and tags from the request
    const title = req.body.title || req.file.originalname;
    const tags = req.body.tags || '';
    
    // Upload to S3
    const result = await galleryStorage.uploadGalleryImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      userGroups,
      title,
      tags.split(',').map(tag => tag.trim())
    );
    
    if (!result.success) {
      if (result.error === 'Storage quota exceeded') {
        return res.status(413).json({
          success: false,
          error: 'Storage quota exceeded',
          quota: {
            total: result.quota,
            used: result.storageUsed,
            remaining: result.quotaRemaining,
            totalFormatted: formatBytes(result.quota),
            usedFormatted: formatBytes(result.storageUsed),
            remainingFormatted: formatBytes(result.quotaRemaining)
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      image: {
        id: result.fileName,
        url: result.url,
        thumbnailUrl: result.url,
        title: result.originalName,
        size: result.size,
        sizeFormatted: formatBytes(result.size),
        uploadedAt: new Date().toISOString(),
        relativePath: result.relativePath
      }
    });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

/**
 * POST /api/gallery/user/delete
 * Delete an image from the user's gallery
 */
router.post('/api/gallery/user/delete', ensureAuthenticated, async (req, res) => {
  try {
    // Check if S3 connection is available
    const s3Status = req.app.locals.galleryS3Status;
    if (s3Status && !s3Status.connected) {
      console.warn(`⚠️ Gallery API: S3 connection not available`);
      return res.status(503).json({
        success: false,
        error: 'Gallery storage currently unavailable',
        details: s3Status.error
      });
    }
    
    const userId = req.user.uid;
    const { relativePath } = req.body;
    
    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Image path is required'
      });
    }
    
    console.log(`🗑️ Deleting gallery image for user ${userId}: ${relativePath}`);
    
    const result = await galleryStorage.deleteGalleryImage(userId, relativePath);
    
    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: result.error || 'Failed to delete image'
      });
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete image'
    });
  }
});

/**
 * POST /api/gallery/user/batch-delete
 * Delete multiple images from the user's gallery in a single request
 */
router.post('/api/gallery/user/batch-delete', ensureAuthenticated, async (req, res) => {
  try {
    // Check if S3 connection is available
    const s3Status = req.app.locals.galleryS3Status;
    if (s3Status && !s3Status.connected) {
      console.warn(`⚠️ Gallery API: S3 connection not available`);
      return res.status(503).json({
        success: false,
        error: 'Gallery storage currently unavailable',
        details: s3Status.error
      });
    }
    
    const userId = req.user.uid;
    const { relativePaths } = req.body;
    
    if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images selected for deletion'
      });
    }
    
    console.log(`🗑️ Batch deleting ${relativePaths.length} gallery images for user ${userId}`);
    
    const results = await Promise.all(
      relativePaths.map(path => galleryStorage.deleteGalleryImage(userId, path))
    );
    
    const successCount = results.filter(result => result.success).length;
    const failCount = results.length - successCount;
    
    res.json({
      success: successCount > 0,
      message: `${successCount} images deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });
  } catch (error) {
    console.error('Error batch deleting gallery images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete images'
    });
  }
});

/**
 * Utility function to format bytes into human-readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places to round to
 * @returns {string} - Formatted string (e.g. "1.5 KB")
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === -1) return 'Unlimited';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;