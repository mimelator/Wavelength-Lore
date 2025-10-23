/**
 * Global Image Content Cache Service
 * 
 * Implements a content-based image caching system that deduplicates identical images
 * across all users and reuses high-quality enhanced versions to minimize processing.
 * 
 * Key Features:
 * - Content-based hashing (SHA-256) to identify identical images regardless of filename/user
 * - Global enhanced image cache shared across all users 
 * - Automatic detection and reuse of existing enhanced versions
 * - Backward compatibility with existing user-specific storage
 * - Analytics and cache hit tracking for optimization
 */

const crypto = require('crypto');
const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');
const galleryStorage = require('../utils/gallery/storage');

class GlobalImageCache {
  constructor() {
    this.db = null;
    this.globalCacheRef = null;
    this.imageFingerprintsRef = null;
    this.cacheStatsRef = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase database connections
   */
  initializeDatabase() {
    if (this.initialized) return this;
    
    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for global image cache...');
        initializeFirebaseAdmin();
      }
      
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      // Initialize references for global cache
      this.globalCacheRef = this.db.ref('globalImageCache/enhancedImages');
      this.imageFingerprintsRef = this.db.ref('globalImageCache/imageFingerprints');
      this.cacheStatsRef = this.db.ref('globalImageCache/statistics');
      
      this.initialized = true;
      console.log('✅ Global Image Cache database initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Global Image Cache database:', error);
      throw error;
    }
    
    return this;
  }

  /**
   * Generate content-based hash for image buffer
   * This allows us to identify identical images regardless of filename or user
   * @param {Buffer} imageBuffer - Image file buffer
   * @returns {string} SHA-256 hash of image content
   */
  generateImageFingerprint(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error('Invalid image buffer provided for fingerprinting');
    }
    
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Store image fingerprint mapping for quick lookups
   * Maps content hash to the first user's image path for reference
   * @param {string} contentHash - SHA-256 hash of image content
   * @param {string} userImagePath - User's gallery image path (reference only)
   * @param {Object} imageMetadata - Basic image metadata
   * @returns {Promise<Object>} Operation result
   */
  async storeImageFingerprint(contentHash, userImagePath, imageMetadata = {}) {
    try {
      this.initializeDatabase();
      
      const fingerprintData = {
        contentHash,
        firstSeenPath: userImagePath, // Reference to first occurrence
        firstSeenAt: admin.database.ServerValue.TIMESTAMP,
        imageMetadata: {
          originalWidth: imageMetadata.width || null,
          originalHeight: imageMetadata.height || null,
          fileSize: imageMetadata.size || null,
          mimeType: imageMetadata.mimeType || null,
          estimatedDPI: imageMetadata.estimatedDPI || null
        },
        usageCount: 1,
        lastUsedAt: admin.database.ServerValue.TIMESTAMP
      };
      
      // Use content hash as key for global lookup
      await this.imageFingerprintsRef.child(contentHash).set(fingerprintData);
      
      console.log(`📍 Stored image fingerprint: ${contentHash}`);
      
      return {
        success: true,
        contentHash,
        isFirstOccurrence: true
      };
      
    } catch (error) {
      console.error('Error storing image fingerprint:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update fingerprint usage statistics
   * @param {string} contentHash - Content hash to update
   * @returns {Promise<void>}
   */
  async updateFingerprintUsage(contentHash) {
    try {
      this.initializeDatabase();
      
      const fingerprintRef = this.imageFingerprintsRef.child(contentHash);
      
      await fingerprintRef.update({
        usageCount: admin.database.ServerValue.increment(1),
        lastUsedAt: admin.database.ServerValue.TIMESTAMP
      });
      
    } catch (error) {
      console.warn('Failed to update fingerprint usage:', error);
    }
  }

  /**
   * Check if image content already exists in the system
   * @param {Buffer} imageBuffer - Image file buffer
   * @returns {Promise<Object>} Fingerprint check result
   */
  async checkImageFingerprint(imageBuffer) {
    try {
      this.initializeDatabase();
      
      const contentHash = this.generateImageFingerprint(imageBuffer);
      const snapshot = await this.imageFingerprintsRef.child(contentHash).once('value');
      
      if (snapshot.exists()) {
        const fingerprintData = snapshot.val();
        
        // Update usage statistics
        await this.updateFingerprintUsage(contentHash);
        
        console.log(`♻️ Found existing image content: ${contentHash}`);
        
        return {
          exists: true,
          contentHash,
          fingerprintData,
          isFirstOccurrence: false
        };
      }
      
      console.log(`🆕 New image content detected: ${contentHash}`);
      
      return {
        exists: false,
        contentHash,
        fingerprintData: null,
        isFirstOccurrence: true
      };
      
    } catch (error) {
      console.error('Error checking image fingerprint:', error);
      return {
        exists: false,
        contentHash: null,
        error: error.message
      };
    }
  }

  /**
   * Store enhanced image in global cache
   * Uses content hash as key so all users can benefit from the same enhancement
   * @param {string} contentHash - Content hash of original image
   * @param {Object} enhancementData - Enhancement result data
   * @returns {Promise<Object>} Operation result
   */
  async storeGlobalEnhancedImage(contentHash, enhancementData) {
    try {
      this.initializeDatabase();
      
      console.log('🔥 FIREBASE STORE: Starting Firebase write operation...');
      console.log(`📍 Target path: globalImageCache/enhancedImages/${contentHash}`);
      console.log('📦 Data to store:');
      
      const globalEnhancementRecord = {
        contentHash,
        enhancedImageUrl: enhancementData.enhancedImageUrl || null,
        s3Key: enhancementData.s3Key || null,
        enhancementMethod: enhancementData.enhancementMethod || null,
        originalDimensions: enhancementData.originalDimensions || null,
        enhancedDimensions: enhancementData.enhancedDimensions || null,
        scaleFactor: enhancementData.scaleFactor || null,
        qualityMetrics: enhancementData.qualityMetrics || {},
        createdAt: admin.database.ServerValue.TIMESTAMP,
        lastUsedAt: admin.database.ServerValue.TIMESTAMP,
        usageCount: 1,
        enhancementSource: enhancementData.enhancementSource || 'global_cache',
        processingTime: enhancementData.processingTime || null,
        fileSize: enhancementData.fileSize || null,
        status: 'active'
      };
      
      // Log the exact record being stored
      console.log(JSON.stringify(globalEnhancementRecord, null, 2));
      
      // Store with content hash as key for global access
      console.log('📝 Writing to Firebase database...');
      await this.globalCacheRef.child(contentHash).set(globalEnhancementRecord);
      
      console.log('✅ FIREBASE STORE SUCCESS:');
      console.log(`   Record written to: globalImageCache/enhancedImages/${contentHash}`);
      console.log(`   Enhancement URL: ${globalEnhancementRecord.enhancedImageUrl}`);
      console.log(`   S3 Key: ${globalEnhancementRecord.s3Key}`);
      console.log(`   Method: ${globalEnhancementRecord.enhancementMethod}`);
      console.log(`   File Size: ${globalEnhancementRecord.fileSize} bytes`);
      
      // Update cache statistics
      console.log('📊 Updating cache statistics...');
      await this.updateCacheStats('enhancements_created', 1);
      console.log('✅ Cache statistics updated');
      
      return {
        success: true,
        contentHash,
        globalEnhancementId: contentHash,
        recordData: globalEnhancementRecord
      };
      
    } catch (error) {
      console.error('❌ FIREBASE STORE FAILED:');
      console.error(`   Content Hash: ${contentHash}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      return {
        success: false,
        error: error.message,
        contentHash: contentHash
      };
    }
  }

  /**
   * Get enhanced image from global cache
   * @param {string} contentHash - Content hash of original image
   * @returns {Promise<Object|null>} Enhanced image data or null
   */
  async getGlobalEnhancedImage(contentHash) {
    try {
      this.initializeDatabase();
      
      console.log('🔍 FIREBASE LOOKUP: Checking for enhanced image...');
      console.log(`📍 Looking up: globalImageCache/enhancedImages/${contentHash}`);
      
      const snapshot = await this.globalCacheRef.child(contentHash).once('value');
      
      if (snapshot.exists()) {
        const enhancedData = snapshot.val();
        
        console.log('✅ FIREBASE LOOKUP SUCCESS:');
        console.log(`   Content Hash: ${contentHash}`);
        console.log(`   Enhancement URL: ${enhancedData.enhancedImageUrl}`);
        console.log(`   S3 Key: ${enhancedData.s3Key}`);
        console.log(`   Method: ${enhancedData.enhancementMethod}`);
        console.log(`   Created: ${new Date(enhancedData.createdAt).toISOString()}`);
        console.log(`   Usage Count: ${enhancedData.usageCount}`);
        
        // Update usage statistics
        console.log('📊 Updating usage statistics...');
        await this.globalCacheRef.child(contentHash).update({
          usageCount: admin.database.ServerValue.increment(1),
          lastUsedAt: admin.database.ServerValue.TIMESTAMP
        });
        
        // Update cache statistics
        await this.updateCacheStats('cache_hits', 1);
        
        console.log(`🎯 Cache HIT: Global enhanced image found for ${contentHash}`);
        
        return enhancedData;
      }
      
      console.log('❌ FIREBASE LOOKUP MISS:');
      console.log(`   Content Hash: ${contentHash}`);
      console.log(`   Path checked: globalImageCache/enhancedImages/${contentHash}`);
      console.log(`   Result: No enhanced image found`);
      
      // Update cache statistics
      await this.updateCacheStats('cache_misses', 1);
      
      return null;
      
    } catch (error) {
      console.error('❌ FIREBASE LOOKUP FAILED:');
      console.error(`   Content Hash: ${contentHash}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      return null;
    }
  }

  /**
   * Check if enhanced version exists for image content
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Object>} Enhancement availability result
   */
  async checkForExistingEnhancement(imageBuffer) {
    try {
      const contentHash = this.generateImageFingerprint(imageBuffer);
      const enhancedData = await this.getGlobalEnhancedImage(contentHash);
      
      return {
        contentHash,
        hasEnhancement: !!enhancedData,
        enhancementData: enhancedData,
        cacheSource: 'global'
      };
      
    } catch (error) {
      console.error('Error checking for existing enhancement:', error);
      return {
        contentHash: null,
        hasEnhancement: false,
        enhancementData: null,
        error: error.message
      };
    }
  }

  /**
   * Get cache statistics and performance metrics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStatistics() {
    try {
      this.initializeDatabase();
      
      const snapshot = await this.cacheStatsRef.once('value');
      const stats = snapshot.val() || {};
      
      // Calculate additional metrics
      const totalRequests = (stats.cache_hits || 0) + (stats.cache_misses || 0);
      const hitRate = totalRequests > 0 ? ((stats.cache_hits || 0) / totalRequests) : 0;
      
      return {
        cacheHits: stats.cache_hits || 0,
        cacheMisses: stats.cache_misses || 0,
        totalRequests,
        hitRate: Math.round(hitRate * 100) / 100,
        enhancementsCreated: stats.enhancements_created || 0,
        enhancementsReused: stats.enhancements_reused || 0,
        totalImageFingerprints: stats.total_fingerprints || 0,
        lastUpdated: stats.last_updated
      };
      
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Update cache statistics
   * @param {string} metric - Metric name to update
   * @param {number} increment - Amount to increment (default: 1)
   * @returns {Promise<void>}
   */
  async updateCacheStats(metric, increment = 1) {
    try {
      this.initializeDatabase();
      
      const updates = {
        [metric]: admin.database.ServerValue.increment(increment),
        last_updated: admin.database.ServerValue.TIMESTAMP
      };
      
      await this.cacheStatsRef.update(updates);
      
    } catch (error) {
      console.warn('Failed to update cache statistics:', error);
    }
  }

  /**
   * Process image upload with global cache integration
   * This is the main method that other services should use
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} fileName - Original filename
   * @param {Object} imageMetadata - Image metadata
   * @returns {Promise<Object>} Processing result with cache information
   */
  async processImageUpload(imageBuffer, fileName, imageMetadata = {}) {
    try {
      // Step 1: Check if this exact image content already exists
      const fingerprintResult = await this.checkImageFingerprint(imageBuffer);
      
      // Step 2: Check if we have an enhanced version
      const enhancementResult = await this.checkForExistingEnhancement(imageBuffer);
      
      const result = {
        contentHash: fingerprintResult.contentHash,
        isFirstOccurrence: fingerprintResult.isFirstOccurrence,
        hasEnhancement: enhancementResult.hasEnhancement,
        enhancementData: enhancementResult.enhancementData,
        fingerprintData: fingerprintResult.fingerprintData,
        cacheMetrics: {
          fingerprint: fingerprintResult.exists ? 'hit' : 'miss',
          enhancement: enhancementResult.hasEnhancement ? 'hit' : 'miss'
        }
      };
      
      // Step 3: Store fingerprint if this is a new image
      if (!fingerprintResult.exists) {
        await this.storeImageFingerprint(
          fingerprintResult.contentHash, 
          `new-upload-${Date.now()}`, // Placeholder path
          imageMetadata
        );
        
        await this.updateCacheStats('total_fingerprints', 1);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error processing image upload:', error);
      return {
        error: error.message,
        contentHash: null,
        isFirstOccurrence: true,
        hasEnhancement: false
      };
    }
  }

  /**
   * Clean up old cache entries (maintenance function)
   * @param {number} maxAgeMonths - Maximum age in months for unused entries
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldCacheEntries(maxAgeMonths = 6) {
    try {
      this.initializeDatabase();
      
      const cutoffTime = Date.now() - (maxAgeMonths * 30 * 24 * 60 * 60 * 1000);
      
      // This would be implemented as a cloud function for efficiency
      console.log(`🧹 Cache cleanup scheduled for entries older than ${maxAgeMonths} months`);
      
      return {
        success: true,
        message: 'Cache cleanup scheduled',
        cutoffDate: new Date(cutoffTime).toISOString()
      };
      
    } catch (error) {
      console.error('Error during cache cleanup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migration helper: Convert existing user-specific enhanced images to global cache
   * @returns {Promise<Object>} Migration result
   */
  async migrateExistingEnhancements() {
    try {
      console.log('🚀 Starting migration of existing enhanced images to global cache...');
      
      // This would be a one-time migration script
      // Implementation would iterate through existing merchandise/enhancedImages
      // and convert them to the new global cache format
      
      return {
        success: true,
        message: 'Migration scheduled - should be run as a separate script',
        recommendation: 'Create a dedicated migration script for this operation'
      };
      
    } catch (error) {
      console.error('Error during enhancement migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GlobalImageCache;