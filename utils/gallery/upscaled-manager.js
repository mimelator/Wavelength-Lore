/**
 * Upscaled Image Management Utility
 * 
 * Provides tools for managing AI-enhanced images in the gallery bucket
 * including cleanup, listing, and metadata operations
 */

const { S3Client, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const galleryConfig = require('./config');

class UpscaledImageManager {
  constructor() {
    this.s3Client = new S3Client({
      region: galleryConfig.AWS_REGION,
      credentials: {
        accessKeyId: galleryConfig.ACCESS_KEY_ID,
        secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
      }
    });
    
    this.galleryBucket = galleryConfig.GALLERY_S3_BUCKET || 'wavelength-lore-bucket';
    this.upscaledFolder = 'upscaled';
    this.cdnUrl = galleryConfig.CDN_URL || `https://${this.galleryBucket}.s3.amazonaws.com`;
  }
  
  /**
   * List all upscaled images for a user
   * @param {string} userId - User ID
   * @returns {Array} List of upscaled images
   */
  async listUserUpscaledImages(userId) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.galleryBucket,
        Prefix: `${this.upscaledFolder}/${userId}/`,
        MaxKeys: 1000
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }
      
      const images = await Promise.all(
        response.Contents.map(async (obj) => {
          // Get metadata for each image
          try {
            const headCommand = new HeadObjectCommand({
              Bucket: this.galleryBucket,
              Key: obj.Key
            });
            const headResponse = await this.s3Client.send(headCommand);
            
            return {
              key: obj.Key,
              url: `${this.cdnUrl}/${obj.Key}`,
              size: obj.Size,
              lastModified: obj.LastModified,
              originalImageId: headResponse.Metadata?.originalimageid,
              upscaleMethod: headResponse.Metadata?.upscalemethod,
              scaleFactor: headResponse.Metadata?.scalefactor,
              createdAt: headResponse.Metadata?.createdat,
              enhancementType: headResponse.Metadata?.enhancementtype
            };
          } catch (error) {
            console.warn(`Could not get metadata for ${obj.Key}:`, error.message);
            return {
              key: obj.Key,
              url: `${this.cdnUrl}/${obj.Key}`,
              size: obj.Size,
              lastModified: obj.LastModified
            };
          }
        })
      );
      
      return images.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
    } catch (error) {
      console.error('Error listing upscaled images:', error);
      throw new Error('Failed to list upscaled images');
    }
  }
  
  /**
   * Get upscaled images for a specific original image
   * @param {string} userId - User ID
   * @param {string} originalImageId - Original image ID
   * @returns {Array} List of upscaled versions
   */
  async getUpscaledVersions(userId, originalImageId) {
    try {
      const allUpscaled = await this.listUserUpscaledImages(userId);
      return allUpscaled.filter(img => 
        img.originalImageId === originalImageId || 
        img.key.includes(`${originalImageId}-enhanced-`)
      );
    } catch (error) {
      console.error('Error getting upscaled versions:', error);
      return [];
    }
  }
  
  /**
   * Clean up old upscaled images (keep only latest version per original)
   * @param {string} userId - User ID
   * @param {Object} options - Cleanup options
   * @returns {Object} Cleanup results
   */
  async cleanupOldUpscaledImages(userId, options = {}) {
    try {
      const { keepVersions = 2, olderThanDays = 30 } = options;
      
      const allUpscaled = await this.listUserUpscaledImages(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Group by original image ID
      const groupedByOriginal = {};
      allUpscaled.forEach(img => {
        const originalId = img.originalImageId || this.extractOriginalIdFromKey(img.key);
        if (!groupedByOriginal[originalId]) {
          groupedByOriginal[originalId] = [];
        }
        groupedByOriginal[originalId].push(img);
      });
      
      const toDelete = [];
      
      Object.values(groupedByOriginal).forEach(versions => {
        // Sort by creation date (newest first)
        versions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        // Mark old versions for deletion
        const versionsToDelete = versions.slice(keepVersions).filter(img => 
          new Date(img.lastModified) < cutoffDate
        );
        
        toDelete.push(...versionsToDelete);
      });
      
      // Delete marked images
      const deleteResults = await Promise.all(
        toDelete.map(async (img) => {
          try {
            const command = new DeleteObjectCommand({
              Bucket: this.galleryBucket,
              Key: img.key
            });
            await this.s3Client.send(command);
            return { key: img.key, success: true };
          } catch (error) {
            console.error(`Failed to delete ${img.key}:`, error);
            return { key: img.key, success: false, error: error.message };
          }
        })
      );
      
      const deletedCount = deleteResults.filter(r => r.success).length;
      const failedCount = deleteResults.filter(r => !r.success).length;
      
      console.log(`🧹 Cleanup completed: ${deletedCount} deleted, ${failedCount} failed`);
      
      return {
        total: toDelete.length,
        deleted: deletedCount,
        failed: failedCount,
        results: deleteResults
      };
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw new Error('Failed to cleanup upscaled images');
    }
  }
  
  /**
   * Get storage statistics for upscaled images
   * @param {string} userId - User ID (optional, for specific user stats)
   * @returns {Object} Storage statistics
   */
  async getStorageStats(userId = null) {
    try {
      const prefix = userId ? `${this.upscaledFolder}/${userId}/` : `${this.upscaledFolder}/`;
      
      const command = new ListObjectsV2Command({
        Bucket: this.galleryBucket,
        Prefix: prefix,
        MaxKeys: 10000
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return {
          totalImages: 0,
          totalSize: 0,
          totalSizeMB: 0,
          averageSize: 0
        };
      }
      
      const totalImages = response.Contents.length;
      const totalSize = response.Contents.reduce((sum, obj) => sum + obj.Size, 0);
      const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
      const averageSize = Math.round(totalSize / totalImages);
      
      return {
        totalImages,
        totalSize,
        totalSizeMB,
        averageSize,
        averageSizeKB: Math.round(averageSize / 1024)
      };
      
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics');
    }
  }
  
  /**
   * Extract original image ID from upscaled image key
   * @param {string} key - S3 object key
   * @returns {string} Original image ID
   */
  extractOriginalIdFromKey(key) {
    const match = key.match(/\/([^\/]+)-enhanced-\d+\.png$/);
    return match ? match[1] : 'unknown';
  }
  
  /**
   * Get folder information and structure
   * @returns {Object} Folder structure info
   */
  getFolderInfo() {
    return {
      bucket: this.galleryBucket,
      upscaledFolder: this.upscaledFolder,
      cdnUrl: this.cdnUrl,
      structure: {
        originalImages: 'gallery/{userId}/{imageFile}',
        upscaledImages: `${this.upscaledFolder}/{userId}/{originalId}-enhanced-{timestamp}.png`
      }
    };
  }
}

module.exports = UpscaledImageManager;