/**
 * Gallery API Routes
 * 
 * Handles API endpoints for user gallery operations
 * including image upload, retrieval, and deletion with S3 storage
 */

const express = require('express');
const router = express.Router();
// const multer = require('multer'); // Commented out - upload functionality disabled
const path = require('path');
// Use consistent authentication for all environments
const { ensureAuthenticated } = require('../middleware/auth');
const galleryStorage = require('../utils/gallery/storage');

// Configure multer for memory storage - DISABLED for upload removal
/*
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    console.log(`📸 Processing uploaded file:`, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size || 'unknown'
    });
    
    // Accept only images with more permissive mime type checking
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // More permissive mime type check to handle various browser implementations
    const mimetype = file.mimetype && (
      file.mimetype.includes('image/') || 
      allowedTypes.test(file.mimetype.toLowerCase())
    );
    
    if (mimetype || extname) {
      console.log('✅ File type validation passed');
      return cb(null, true);
    } else {
      console.log('❌ File type validation failed:', {
        allowedTypes: allowedTypes.toString(),
        extension: path.extname(file.originalname).toLowerCase(),
        mimetype: file.mimetype
      });
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});
*/

/**


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
    console.log(`🔑 Auth header:`, req.headers.authorization ? 'Present' : 'Not present');
    console.log(`🍪 Session cookie:`, req.cookies && (req.cookies.__session || req.cookies.session) ? 'Present' : 'Not present');
    
    // Debug test user info for local development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Development mode detected, checking test user setup`);
      console.log(`💡 If you're seeing incorrect user IDs, check that you're properly authenticated with Google SSO`);
      console.log(`📝 Tip: Use /debug/gallery-auth endpoint to diagnose authentication issues`);
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
router.post('/api/gallery/user/upload', ensureAuthenticated, async (req, res) => {
  // Upload functionality is disabled
  return res.status(501).json({
    success: false,
    error: 'Upload functionality is disabled. Use "Save to Gallery" buttons throughout the site to add images.'
  });
  
  try {
    console.log('🔍 Gallery upload initiated');
    
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
    
    // Handle file upload with improved error handling
    upload.single('file')(req, res, async (uploadError) => {
      if (uploadError) {
        console.error('❌ Multer upload error:', uploadError);
        
        // Check for file size limits
        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File too large. Maximum file size is 10MB.'
          });
        }
        
        return res.status(400).json({
          success: false,
          error: uploadError.message || 'Error processing upload'
        });
      }
      
      try {
        if (!req.file) {
          console.warn('⚠️ No file in request');
          console.log('Request body:', req.body);
          console.log('Request headers:', req.headers);
          
          return res.status(400).json({
            success: false,
            error: 'No file uploaded. Please ensure you selected an image file.'
          });
        }
        
        // Verify file buffer integrity
        if (!req.file.buffer || req.file.buffer.length === 0) {
          console.error('❌ Empty file buffer received');
          return res.status(400).json({
            success: false,
            error: 'Received empty file. Please try again with a valid image file.'
          });
        }
        
        const userId = req.user.uid;
        const userGroups = res.locals.userGroups || [];
        
        console.log(`📤 Uploading gallery image for user ${userId}`);
        console.log(`👤 Full user info:`, req.user);
        console.log(`🔑 Auth method:`, req.headers.authorization ? 'Bearer token' : 
                                      (req.cookies && (req.cookies.__session || req.cookies.session)) ? 'Session cookie' : 'Unknown');
        console.log(`   File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Original name: ${req.file.originalname}`);
        console.log(`   MIME type: ${req.file.mimetype}`);
        console.log(`   Buffer size: ${req.file.buffer.length} bytes`);
        
        // Extract title and tags from the request
        const title = req.body.title || req.file.originalname;
        const tags = req.body.tags || '';
        
        console.log(`   Title: ${title}`);
        console.log(`   Tags: ${tags}`);
        
        // Upload to S3 with additional diagnostics
        console.log('🚀 Calling uploadGalleryImage...');
        const result = await galleryStorage.uploadGalleryImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          userId,
          userGroups,
          title,
          tags.split(',').map(tag => tag.trim())
        );
        
        console.log('📥 Upload result:', result);
        
        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: result.error
          });
        }
        
        console.log(`✅ Image successfully uploaded to S3`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Path: ${result.relativePath}`);
        
        res.json({
          success: true,
          image: {
            id: result.fileName,
            url: result.url,
            thumbnailUrl: result.url,
            title: result.originalName || title,
            size: result.size,
            sizeFormatted: formatBytes(result.size),
            uploadedAt: new Date().toISOString(),
            relativePath: result.relativePath
          }
        });
      } catch (processingError) {
        console.error('Error processing upload:', processingError);
        res.status(500).json({
          success: false,
          error: processingError.message || 'Failed to process uploaded image',
          stack: process.env.NODE_ENV === 'development' ? processingError.stack : undefined
        });
      }
    });
  } catch (outerError) {
    console.error('Error in upload route:', outerError);
    res.status(500).json({
      success: false,
      error: outerError.message || 'Failed to upload image',
      stack: process.env.NODE_ENV === 'development' ? outerError.stack : undefined
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
 * Middleware to support both session and header-based auth for service calls
 */
function ensureAuthenticatedOrHeaders(req, res, next) {
  // Check for header-based auth first (for service-to-service calls)
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId && req.headers['x-api-request']) {
    req.user = { uid: headerUserId };
    return next();
  }
  // Fall back to session auth
  return ensureAuthenticated(req, res, next);
}

/**
 * GET /api/gallery/image/:imageId
 * Get image metadata and verify user access
 * Used by merchandise services to validate user permissions
 */
router.get('/api/gallery/image/:imageId', ensureAuthenticatedOrHeaders, async (req, res) => {
  try {
    const userId = req.user.uid;
    let { imageId } = req.params;
    
    // Handle URL-encoded paths
    imageId = decodeURIComponent(imageId);
    
    console.log(`🔍 Gallery API: Getting metadata for image ${imageId} for user ${userId}`);
    
    // Check if user has access to this image
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    const image = userImages.find(img => 
      path.basename(img.relativePath) === imageId ||
      img.relativePath === imageId ||
      img.relativePath.includes(imageId)
    );
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Image ${imageId} not found in user ${userId}'s gallery`
      });
    }
    
    res.json({
      success: true,
      image: {
        id: path.basename(image.relativePath),
        url: image.url,
        title: image.originalName || image.fileName,
        size: image.size,
        uploadedAt: image.uploadedAt || image.lastModified,
        relativePath: image.relativePath
      }
    });
  } catch (error) {
    console.error('Error getting image metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image metadata'
    });
  }
});

/**
 * GET /api/gallery/image/:imageId/download
 * Download image buffer for authenticated user
 * Used by merchandise services to get image data
 */
router.get('/api/gallery/image/:imageId/download', ensureAuthenticatedOrHeaders, async (req, res) => {
  try {
    const userId = req.user.uid;
    let { imageId } = req.params;
    
    // Handle URL-encoded paths
    imageId = decodeURIComponent(imageId);
    
    console.log(`📥 Gallery API: Downloading image ${imageId} for user ${userId}`);
    
    // Check if user has access to this image
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    const image = userImages.find(img => 
      path.basename(img.relativePath) === imageId ||
      img.relativePath === imageId ||
      img.relativePath.includes(imageId)
    );
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: `Image ${imageId} not found in user ${userId}'s gallery`
      });
    }
    
    // Download the image buffer from S3
    const imageBuffer = await galleryStorage.downloadImageBuffer(image.relativePath);
    
    if (!imageBuffer) {
      return res.status(500).json({
        success: false,
        error: 'Failed to download image from storage'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${imageId}"`);
    
    // Send the image buffer
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download image'
    });
  }
});

/**
 * GET /api/gallery/image/:imageId/enhanced
 * Download enhanced/upscaled version if available
 * Used by merchandise services to get high-quality images
 */
router.get('/api/gallery/image/:imageId/enhanced', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { imageId } = req.params;
    
    console.log(`🔍 Gallery API: Looking for enhanced version of ${imageId} for user ${userId}`);
    
    // Check if user has access to the original image first
    const userImages = await galleryStorage.listUserGalleryImages(userId);
    const originalImage = userImages.find(img => 
      path.basename(img.relativePath) === imageId ||
      img.relativePath.includes(imageId)
    );
    
    if (!originalImage) {
      return res.status(404).json({
        success: false,
        error: `Original image ${imageId} not found in user ${userId}'s gallery`
      });
    }
    
    // Look for enhanced version in upscaled folder
    const enhancedPath = `upscaled/${imageId.replace('.webp', '')}_enhanced.png`;
    
    try {
      const enhancedBuffer = await galleryStorage.downloadImageBuffer(enhancedPath);
      
      if (enhancedBuffer) {
        console.log(`✅ Found enhanced version: ${enhancedPath}`);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', enhancedBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="enhanced_${imageId}"`);
        
        // Send the enhanced image buffer
        res.send(enhancedBuffer);
      } else {
        res.status(404).json({
          success: false,
          error: 'Enhanced version not available'
        });
      }
    } catch (enhancedError) {
      res.status(404).json({
        success: false,
        error: 'Enhanced version not available'
      });
    }
  } catch (error) {
    console.error('Error getting enhanced image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced image'
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