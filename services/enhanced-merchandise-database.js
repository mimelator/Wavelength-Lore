/**
 * Enhanced Merchandise Database Service
 * 
 * Extended version that integrates with the Global Image Cache system
 * to minimize redundant image enhancement processing
 */

const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');
const admin = require('firebase-admin');
const GlobalImageCache = require('./global-image-cache');

class EnhancedMerchandiseDatabase {
  constructor() {
    this.db = null;
    this.enhancedImagesRef = null;
    this.initialized = false;
    this.globalCache = new GlobalImageCache();
    this.migrationMode = false; // Set to true during migration period
  }

  /**
   * Initialize Firebase database connections (same pattern as base class)
   */
  initializeDatabase() {
    if (this.initialized) return this;
    
    try {
      // Ensure Firebase Admin is initialized first
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for enhanced merchandise database...');
        initializeFirebaseAdmin();
      }
      
      // Get the admin database instance
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      // Initialize references
      this.enhancedImagesRef = this.db.ref('merchandise/enhancedImages');
      
      this.initialized = true;
      console.log('✅ Enhanced Merchandise Database initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Merchandise Database:', error);
      throw error;
    }
    
    return this;
  }

  /**
   * Get enhanced image for original image ID (legacy compatibility)
   * @param {string} originalImageId - Original gallery image ID
   * @returns {Promise<Object|null>} Enhanced image data or null
   */
  async getEnhancedImage(originalImageId) {
    try {
      this.initializeDatabase();
      
      const snapshot = await this.enhancedImagesRef.child(originalImageId).once('value');
      
      if (snapshot.exists()) {
        const enhancedData = snapshot.val();
        console.log(`✅ Found legacy enhanced image for ${originalImageId}`);
        return enhancedData;
      }
      
      console.log(`ℹ️ No legacy enhanced image found for ${originalImageId}`);
      return null;
      
    } catch (error) {
      console.error('Error getting legacy enhanced image:', error);
      return null;
    }
  }

  /**
   * Store enhanced image association (legacy compatibility)
   * @param {string} originalImageId - Original gallery image ID
   * @param {Object} enhancementData - Enhancement data
   * @returns {Promise<Object>} Operation result
   */
  async storeEnhancedImage(originalImageId, enhancementData) {
    try {
      this.initializeDatabase();
      
      const enhancementRecord = {
        ...enhancementData,
        originalImageId,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        status: 'active'
      };
      
      await this.enhancedImagesRef.child(originalImageId).set(enhancementRecord);
      
      console.log(`✅ Stored legacy enhanced image association for ${originalImageId}`);
      
      return {
        success: true,
        enhancedImageId: originalImageId
      };
      
    } catch (error) {
      console.error('Error storing legacy enhanced image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Smart image enhancement with global cache integration
   * Checks global cache first, falls back to user-specific cache, then generates new enhancement
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} originalImageId - User's original image ID (for backward compatibility)
   * @param {Object} enhancementData - Enhancement data if generating new
   * @returns {Promise<Object>} Enhancement result with cache information
   */
  async getOrCreateEnhancement(imageBuffer, originalImageId, enhancementData = null) {
    try {
      console.log('🔍 Smart enhancement lookup for image...');
      
      // Step 1: Check global cache for this image content
      const globalResult = await this.globalCache.checkForExistingEnhancement(imageBuffer);
      
      if (globalResult.hasEnhancement) {
        console.log(`🌍 Global cache HIT - reusing existing enhancement`);
        
        return {
          success: true,
          source: 'global_cache',
          enhancementData: globalResult.enhancementData,
          contentHash: globalResult.contentHash,
          cacheHit: true,
          savings: {
            processing: true,
            storage: true,
            time: true
          }
        };
      }
      
      // Step 2: Check legacy user-specific cache (during migration period)
      if (this.migrationMode && originalImageId) {
        const legacyEnhancement = await this.getEnhancedImage(originalImageId);
        
        if (legacyEnhancement) {
          console.log(`📦 Legacy cache HIT - found user-specific enhancement`);
          
          // Optionally migrate this to global cache
          await this.migrateToGlobalCache(imageBuffer, legacyEnhancement);
          
          return {
            success: true,
            source: 'legacy_cache',
            enhancementData: legacyEnhancement,
            contentHash: globalResult.contentHash,
            cacheHit: true,
            migrated: true
          };
        }
      }
      
      // Step 3: No existing enhancement found
      if (!enhancementData) {
        console.log(`❌ No enhancement found and no data provided to create one`);
        
        return {
          success: false,
          source: 'none',
          contentHash: globalResult.contentHash,
          cacheHit: false,
          requiresGeneration: true
        };
      }
      
      // Step 4: Store new enhancement in global cache
      console.log(`🆕 Creating new enhancement and storing in global cache`);
      
      const storeResult = await this.globalCache.storeGlobalEnhancedImage(
        globalResult.contentHash,
        enhancementData
      );
      
      if (storeResult.success) {
        return {
          success: true,
          source: 'newly_created',
          enhancementData: enhancementData,
          contentHash: globalResult.contentHash,
          cacheHit: false,
          globalStored: true
        };
      } else {
        // Fallback to legacy storage if global cache fails
        if (originalImageId) {
          const legacyResult = await this.storeEnhancedImage(originalImageId, enhancementData);
          
          return {
            success: legacyResult.success,
            source: 'legacy_fallback',
            enhancementData: enhancementData,
            contentHash: globalResult.contentHash,
            cacheHit: false,
            fallback: true,
            error: storeResult.error
          };
        }
        
        throw new Error('Failed to store enhancement: ' + storeResult.error);
      }
      
    } catch (error) {
      console.error('Error in smart enhancement lookup:', error);
      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Migrate legacy enhancement to global cache
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} legacyEnhancementData - Legacy enhancement data
   * @returns {Promise<Object>} Migration result
   */
  async migrateToGlobalCache(imageBuffer, legacyEnhancementData) {
    try {
      const contentHash = this.globalCache.generateImageFingerprint(imageBuffer);
      
      // Check if global version already exists
      const existingGlobal = await this.globalCache.getGlobalEnhancedImage(contentHash);
      if (existingGlobal) {
        console.log(`♻️ Global version already exists for ${contentHash}`);
        return { success: true, alreadyExists: true };
      }
      
      // Transform legacy data to global format
      const globalEnhancementData = {
        enhancedImageUrl: legacyEnhancementData.enhancedImageUrl,
        s3Key: legacyEnhancementData.s3Key,
        enhancementMethod: legacyEnhancementData.enhancementMethod,
        originalDimensions: legacyEnhancementData.originalDimensions,
        enhancedDimensions: legacyEnhancementData.enhancedDimensions,
        scaleFactor: legacyEnhancementData.scaleFactor,
        qualityMetrics: legacyEnhancementData.qualityMetrics || {},
        migratedFrom: 'legacy_user_cache',
        originalCreatedAt: legacyEnhancementData.createdAt
      };
      
      const result = await this.globalCache.storeGlobalEnhancedImage(contentHash, globalEnhancementData);
      
      if (result.success) {
        console.log(`✅ Successfully migrated enhancement to global cache: ${contentHash}`);
        await this.globalCache.updateCacheStats('migrations_completed', 1);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error migrating to global cache:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enhanced version of storeEnhancedImage that uses global cache
   * @param {Buffer} imageBuffer - Original image buffer (new parameter)
   * @param {string} originalImageId - Original image ID (for backward compatibility)
   * @param {Object} enhancementData - Enhancement data
   * @returns {Promise<Object>} Storage result
   */
  async storeEnhancedImageWithGlobalCache(imageBuffer, originalImageId, enhancementData) {
    try {
      // Process through global cache system
      const result = await this.getOrCreateEnhancement(imageBuffer, originalImageId, enhancementData);
      
      if (result.success) {
        // Also store in legacy format during migration period for backward compatibility
        if (this.migrationMode && originalImageId) {
          await this.storeEnhancedImage(originalImageId, enhancementData);
        }
        
        return {
          success: true,
          enhancedImageId: result.contentHash,
          source: result.source,
          globalCacheUsed: true,
          cacheHit: result.cacheHit
        };
      }
      
      return result;
      
    } catch (error) {
      console.error('Error storing enhanced image with global cache:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get enhancement with global cache priority
   * @param {Buffer} imageBuffer - Original image buffer (preferred method)
   * @param {string} originalImageId - Original image ID (fallback for legacy)
   * @returns {Promise<Object|null>} Enhancement data or null
   */
  async getEnhancedImageWithGlobalCache(imageBuffer, originalImageId = null) {
    try {
      if (imageBuffer) {
        // Use global cache for content-based lookup
        const globalResult = await this.globalCache.checkForExistingEnhancement(imageBuffer);
        
        if (globalResult.hasEnhancement) {
          return {
            ...globalResult.enhancementData,
            source: 'global_cache',
            contentHash: globalResult.contentHash
          };
        }
      }
      
      // Fallback to legacy user-specific lookup
      if (originalImageId) {
        const legacyData = await this.getEnhancedImage(originalImageId);
        
        if (legacyData) {
          return {
            ...legacyData,
            source: 'legacy_cache',
            originalImageId: originalImageId
          };
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting enhanced image with global cache:', error);
      return null;
    }
  }

  /**
   * Get cache performance metrics
   * @returns {Promise<Object>} Cache performance data
   */
  async getCachePerformanceMetrics() {
    try {
      const globalStats = await this.globalCache.getCacheStatistics();
      
      // Get legacy cache statistics (count of user-specific enhancements)
      this.initializeDatabase();
      const legacySnapshot = await this.enhancedImagesRef.once('value');
      const legacyCount = legacySnapshot.exists() ? Object.keys(legacySnapshot.val()).length : 0;
      
      return {
        global: globalStats,
        legacy: {
          totalEnhancements: legacyCount,
          storageType: 'user_specific'
        },
        recommendations: this.generateCacheRecommendations(globalStats, legacyCount)
      };
      
    } catch (error) {
      console.error('Error getting cache performance metrics:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Generate optimization recommendations based on cache performance
   * @param {Object} globalStats - Global cache statistics
   * @param {number} legacyCount - Legacy cache count
   * @returns {Array} Array of recommendation objects
   */
  generateCacheRecommendations(globalStats, legacyCount) {
    const recommendations = [];
    
    if (globalStats.hitRate < 0.3) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Low cache hit rate detected. Consider migrating more legacy enhancements to global cache.',
        action: 'run_migration'
      });
    }
    
    if (legacyCount > 100 && globalStats.enhancementsCreated > 50) {
      recommendations.push({
        type: 'storage',
        priority: 'high',
        message: `${legacyCount} legacy enhancements found. Migration could reduce redundant storage significantly.`,
        action: 'schedule_migration',
        estimatedSavings: Math.round(legacyCount * 0.7) // Estimate 70% deduplication
      });
    }
    
    if (globalStats.enhancementsReused > globalStats.enhancementsCreated * 2) {
      recommendations.push({
        type: 'success',
        priority: 'info',
        message: 'Excellent cache performance! Global cache is providing significant processing savings.',
        action: 'continue_monitoring'
      });
    }
    
    return recommendations;
  }

  /**
   * Enable or disable migration mode
   * @param {boolean} enabled - Whether migration mode should be enabled
   */
  setMigrationMode(enabled) {
    this.migrationMode = enabled;
    console.log(`🔄 Migration mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Process bulk migration of existing enhancements
   * This should be run as a maintenance script
   * @param {number} batchSize - Number of enhancements to process per batch
   * @returns {Promise<Object>} Migration result
   */
  async runBulkMigration(batchSize = 10) {
    try {
      console.log('🚀 Starting bulk migration of enhanced images...');
      
      this.initializeDatabase();
      const snapshot = await this.enhancedImagesRef.limitToFirst(batchSize).once('value');
      
      if (!snapshot.exists()) {
        return {
          success: true,
          message: 'No more enhancements to migrate',
          completed: true
        };
      }
      
      const enhancements = snapshot.val();
      const migrationResults = [];
      
      for (const [originalImageId, enhancementData] of Object.entries(enhancements)) {
        try {
          // This would require downloading the original image to get the buffer
          // Implementation would depend on how we can reconstruct the original image
          console.log(`Processing migration for: ${originalImageId}`);
          
          migrationResults.push({
            originalImageId,
            status: 'queued_for_manual_review',
            note: 'Requires original image buffer for content hashing'
          });
          
        } catch (error) {
          migrationResults.push({
            originalImageId,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        processed: migrationResults.length,
        results: migrationResults,
        hasMore: Object.keys(enhancements).length === batchSize
      };
      
    } catch (error) {
      console.error('Error during bulk migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance like the base merchandise database
const instance = new EnhancedMerchandiseDatabase();
module.exports = instance;