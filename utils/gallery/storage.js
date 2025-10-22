/**
 * Gallery Storage Utility
 * 
 * Handles S3 storage operations for user gallery images with quota management
 * based on user group membership.
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Import gallery config with proper environment variables
const config = require('./config');

// Initialize S3 client - using app user credentials (ACCESS_KEY_ID)
const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.ACCESS_KEY_ID,
    secretAccessKey: config.SECRET_ACCESS_KEY
  }
});

const bucketName = config.GALLERY_S3_BUCKET || 'wavelength-lore-bucket';
console.log('🪣 Gallery S3 Bucket configured as:', bucketName);
console.log('🔑 Using credentials with Access Key ID:', config.ACCESS_KEY_ID ? config.ACCESS_KEY_ID.substring(0, 5) + '...' : 'undefined');
const cdnUrl = config.CDN_URL || `https://${bucketName}.s3.amazonaws.com`;
console.log('🌐 Gallery CDN URL configured as:', cdnUrl);

// User group storage quotas in bytes
const GROUP_QUOTAS = {
  // Anonymous users cannot store gallery images
  anonymous: 0,
  // Default registered user (5MB)
  default: 5 * 1024 * 1024, 
  // Silver tier (25MB)
  silver_member: 25 * 1024 * 1024,
  // Gold tier (100MB)
  gold_member: 100 * 1024 * 1024,
  // Premium tier (250MB)
  premium_member: 250 * 1024 * 1024,
  // Content creators (500MB)
  content_creator: 500 * 1024 * 1024,
  // Content managers (1GB)
  content_manager: 1024 * 1024 * 1024,
  // Admins and super admins (unlimited)
  admin: -1,
  super_admin: -1
};

/**
 * Get storage quota for a user based on their group membership
 * 
 * @param {Array<string>} userGroups - Array of user group names
 * @returns {number} Storage quota in bytes (-1 for unlimited)
 */
function getQuotaForUser(userGroups) {
  if (!userGroups || !Array.isArray(userGroups) || userGroups.length === 0) {
    return GROUP_QUOTAS.anonymous;
  }

  // Find highest quota among user's groups
  let highestQuota = GROUP_QUOTAS.default;
  
  // Check for unlimited quota first (admin, super_admin)
  if (userGroups.includes('admin') || userGroups.includes('super_admin')) {
    return -1; // Unlimited quota
  }
  
  // Check other group quotas
  for (const group of userGroups) {
    const groupQuota = GROUP_QUOTAS[group] || 0;
    if (groupQuota > highestQuota) {
      highestQuota = groupQuota;
    }
  }
  
  return highestQuota;
}

/**
 * Calculate total storage used by a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total bytes used
 */
async function calculateUserStorageUsed(userId) {
  try {
    // List all objects in the user's gallery folder
    const params = {
      Bucket: bucketName,
      Prefix: `images/gallery/${userId}/`
    };
    
    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);
    
    // Calculate total size
    let totalSize = 0;
    if (response.Contents) {
      for (const object of response.Contents) {
        totalSize += object.Size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error(`Error calculating storage for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if user has enough quota to upload a file
 * 
 * @param {string} userId - User ID
 * @param {Array<string>} userGroups - User's group memberships
 * @param {number} fileSize - Size of file to upload in bytes
 * @returns {Promise<{allowed: boolean, quotaRemaining: number, quota: number}>} Quota check result
 */
async function checkUserQuota(userId, userGroups, fileSize) {
  try {
    // Get user's quota
    const userQuota = getQuotaForUser(userGroups);
    
    // Unlimited quota for admins
    if (userQuota === -1) {
      return {
        allowed: true,
        quotaRemaining: -1,
        quota: -1
      };
    }
    
    // Calculate current storage used
    const storageUsed = await calculateUserStorageUsed(userId);
    
    // Check if user has enough quota
    const quotaRemaining = userQuota - storageUsed;
    const allowed = quotaRemaining >= fileSize;
    
    return {
      allowed,
      quotaRemaining,
      quota: userQuota,
      storageUsed
    };
  } catch (error) {
    console.error('Error checking user quota:', error);
    // On error, default to not allowed for safety
    return {
      allowed: false,
      error: error.message
    };
  }
}

/**
 * Upload an image to S3 for user gallery
 * 
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} userId - User ID
 * @param {Array<string>} userGroups - User's group memberships
 * @param {string} title - Optional title for the image
 * @param {Array<string>} tags - Optional tags for the image
 * @returns {Promise<{success: boolean, url?: string, relativePath?: string, error?: string}>}
 */
async function uploadGalleryImage(fileBuffer, fileName, mimeType, userId, userGroups, title = '', tags = []) {
  try {
    console.log(`⬆️ Starting upload to gallery for user: ${userId}`);
    console.log(`📄 File name: ${fileName}`);
    console.log(`📦 S3 bucket: ${bucketName}`);
    console.log(`🔗 CDN URL: ${cdnUrl}`);
    
    // Check file size
    const fileSize = fileBuffer.length;
    console.log(`📊 File size: ${fileSize} bytes`);
    
    // Check user's quota
    console.log(`⚖️ Checking user quota...`);
    const quotaCheck = await checkUserQuota(userId, userGroups, fileSize);
    console.log(`📊 Quota check result:`, quotaCheck);
    
    if (!quotaCheck.allowed) {
      console.log(`❌ Storage quota exceeded for user: ${userId}`);
      return {
        success: false,
        error: 'Storage quota exceeded',
        quotaRemaining: quotaCheck.quotaRemaining,
        quota: quotaCheck.quota,
        storageUsed: quotaCheck.storageUsed
      };
    }
    
    console.log(`✅ User has sufficient quota`)
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(fileName).toLowerCase();
    const isVideo = mimeType.startsWith('video/');
    const prefix = isVideo ? 'video' : 'image';
    const newFileName = `${prefix}-${timestamp}-${randomId}${extension}`;
    
    // Construct S3 key (path)
    const s3Key = `images/gallery/${userId}/${newFileName}`;
    
    // Sanitize metadata values
    const sanitizeMetadata = (value) => {
      if (!value) return 'unknown';
      return value
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[^\x20-\x7E]/g, '')
        .substring(0, 200)
        .trim();
    };
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'max-age=31536000', // 1 year cache
      Metadata: {
        'uploaded-by': userId,
        'original-name': sanitizeMetadata(fileName),
        'uploaded-at': new Date().toISOString(),
        'title': sanitizeMetadata(title || fileName),
        'tags': sanitizeMetadata(tags.join(','))
      }
    };

    const command = new PutObjectCommand(uploadParams);
    console.log(`🚀 Uploading to S3: ${s3Key}`);
    
    try {
      const result = await s3Client.send(command);
      console.log(`✅ S3 upload successful:`, result);
    } catch (s3Error) {
      console.error('❌ S3 upload error:', s3Error);
      throw s3Error;
    }

    // Construct the relative path and CDN URL
    const relativePath = `images/gallery/${userId}/${newFileName}`;
    const cdnPath = `${cdnUrl}/${relativePath}`;
    console.log(`🔗 Image CDN URL: ${cdnPath}`);

    return {
      success: true,
      url: cdnPath,
      relativePath,
      fileName: newFileName,
      originalName: fileName,
      size: fileSize,
      mimeType,
      title: title || fileName,
      tags: tags
    };
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
}

/**
 * Delete a user's gallery image from S3
 * 
 * @param {string} userId - User ID
 * @param {string} relativePath - Relative path of the image in S3
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteGalleryImage(userId, relativePath) {
  try {
    // Validate that the image belongs to this user
    // Extract userId from the path to ensure user can only delete their own images
    const pathParts = relativePath.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'images' || pathParts[1] !== 'gallery' || pathParts[2] !== userId) {
      return {
        success: false,
        error: 'Permission denied: You can only delete your own gallery images'
      };
    }
    
    // Delete from S3
    const params = {
      Bucket: bucketName,
      Key: relativePath
    };
    
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image'
    };
  }
}

/**
 * Get user's gallery storage statistics
 * 
 * @param {string} userId - User ID
 * @param {Array<string>} userGroups - User's group memberships
 * @returns {Promise<{used: number, quota: number, remaining: number, percentage: number}>}
 */
async function getUserStorageStats(userId, userGroups) {
  try {
    const userQuota = getQuotaForUser(userGroups);
    const storageUsed = await calculateUserStorageUsed(userId);
    
    // For unlimited quota
    if (userQuota === -1) {
      return {
        used: storageUsed,
        quota: -1,
        remaining: -1,
        percentage: 0
      };
    }
    
    const remaining = userQuota - storageUsed;
    const percentage = (storageUsed / userQuota) * 100;
    
    return {
      used: storageUsed,
      quota: userQuota,
      remaining: Math.max(0, remaining),
      percentage: Math.min(100, Math.max(0, percentage))
    };
  } catch (error) {
    console.error('Error getting user storage stats:', error);
    throw error;
  }
}

/**
 * List a user's gallery images
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<{url: string, relativePath: string, fileName: string, size: number, lastModified: Date}>>}
 */
async function listUserGalleryImages(userId) {
  try {
    console.log(`📋 Listing gallery images for user: ${userId}`);
    console.log(`📦 Using S3 bucket: ${bucketName}`);
    console.log(`🔍 Searching path: images/gallery/${userId}/`);

    const params = {
      Bucket: bucketName,
      Prefix: `images/gallery/${userId}/`
    };
    
    const command = new ListObjectsV2Command(params);
    let response;
    
    try {
      response = await s3Client.send(command);
      console.log(`📦 S3 response received: ${response.Contents ? response.Contents.length : 0} objects found`);
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log('⚠️ No images found in S3 for this user');
        return [];
      }
    } catch (s3Error) {
      console.error('❌ S3 error when listing objects:', s3Error);
      throw s3Error;
    }
    
    // Map S3 objects to gallery images
    const images = await Promise.all(response.Contents.map(async (object) => {
      // Get object metadata (to retrieve original name)
      const headParams = {
        Bucket: bucketName,
        Key: object.Key
      };
      
      const headCommand = new HeadObjectCommand(headParams);
      let metadata = {};
      
      try {
        const headResponse = await s3Client.send(headCommand);
        metadata = headResponse.Metadata || {};
      } catch (error) {
        console.error(`Error getting metadata for ${object.Key}:`, error);
      }
      
      // Extract file name from key
      const fileName = object.Key.split('/').pop();
      
      return {
        url: `${cdnUrl}/${object.Key}`,
        relativePath: object.Key,
        fileName,
        originalName: metadata['original-name'] || fileName,
        title: metadata['title'] || metadata['original-name'] || fileName,
        tags: metadata['tags'] ? metadata['tags'].split(',') : [],
        size: object.Size,
        lastModified: object.LastModified,
        uploadedAt: metadata['uploaded-at'] ? new Date(metadata['uploaded-at']) : object.LastModified
      };
    }));
    
    // Sort by uploadedAt/lastModified (newest first)
    return images.sort((a, b) => {
      const dateA = a.uploadedAt || a.lastModified;
      const dateB = b.uploadedAt || b.lastModified;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error listing user gallery images:', error);
    throw error;
  }
}

module.exports = {
  uploadGalleryImage,
  deleteGalleryImage,
  checkUserQuota,
  getUserStorageStats,
  listUserGalleryImages,
  GROUP_QUOTAS
};