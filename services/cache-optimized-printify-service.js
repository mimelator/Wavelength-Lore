/**
 * Cache-Optimized Enhanced Printify Service
 * 
 * Extension that integrates with the Global Image Cache to minimize
 * redundant image enhancement processing across all users
 */

const EnhancedPrintifyService = require('./enhanced-printify-service');
const enhancedMerchandiseDB = require('./enhanced-merchandise-database');
const GlobalImageCache = require('./global-image-cache');

class CacheOptimizedPrintifyService extends EnhancedPrintifyService {
  constructor() {
    super();
    this.enhancedDB = enhancedMerchandiseDB; // Use the singleton instance
    this.globalCache = new GlobalImageCache();
    this.cacheEnabled = true;
  }

  /**
   * Cache-optimized image upload with automatic enhancement
   * Checks global cache first to avoid redundant processing
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Original filename
   * @param {Object} options - Enhancement options
   * @returns {Object} Upload result with cache optimization info
   */
  async uploadImageWithAutoEnhancement(imageBuffer, fileName, options = {}) {
    try {
      console.log('🔍 Cache-optimized auto-enhancement starting...');
      
      // Step 1: Check global cache for existing enhancement
      if (this.cacheEnabled) {
        const cacheResult = await this.checkGlobalCacheForEnhancement(imageBuffer, options);
        
        if (cacheResult.found) {
          console.log(`🎯 Global cache HIT! Using existing enhancement`);
          return await this.uploadCachedEnhancement(cacheResult, fileName, options);
        }
        
        console.log(`❌ Global cache MISS - proceeding with enhancement`);
      }
      
      // Step 2: Process image through fingerprinting system
      const imageProcessResult = await this.globalCache.processImageUpload(
        imageBuffer, 
        fileName, 
        {
          size: imageBuffer.length,
          mimeType: this.detectMimeType(fileName)
        }
      );
      
      console.log('📍 Image fingerprint result:', {
        contentHash: imageProcessResult.contentHash,
        isFirstOccurrence: imageProcessResult.isFirstOccurrence,
        hasEnhancement: imageProcessResult.hasEnhancement
      });
      
      // Step 3: If fingerprinting found existing enhancement, use it
      if (imageProcessResult.hasEnhancement) {
        console.log(`♻️ Fingerprint system found existing enhancement`);
        return await this.uploadCachedEnhancement({
          found: true,
          enhancementData: imageProcessResult.enhancementData,
          contentHash: imageProcessResult.contentHash,
          source: 'fingerprint_cache'
        }, fileName, options);
      }
      
      // Step 4: No existing enhancement - proceed with standard processing
      console.log('🆕 No cached enhancement found, generating new one...');
      
      const enhancementResult = await super.uploadImageWithAutoEnhancement(imageBuffer, fileName, options);
      
      // Step 5: If enhancement was successful, store in global cache
      if (enhancementResult.success && enhancementResult.autoEnhanced && this.cacheEnabled) {
        await this.storeEnhancementInGlobalCache(
          imageBuffer,
          enhancementResult,
          imageProcessResult.contentHash
        );
      }
      
      // Add cache metadata to result
      return {
        ...enhancementResult,
        cacheOptimization: {
          contentHash: imageProcessResult.contentHash,
          isFirstOccurrence: imageProcessResult.isFirstOccurrence,
          globalCacheUsed: false,
          newEnhancementStored: enhancementResult.autoEnhanced
        }
      };
      
    } catch (error) {
      console.error('Error in cache-optimized enhancement:', error);
      
      // Fallback to standard enhancement if cache system fails
      console.log('🔄 Cache system failed, falling back to standard enhancement...');
      return await super.uploadImageWithAutoEnhancement(imageBuffer, fileName, options);
    }
  }

  /**
   * Check global cache for existing enhancement
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Options for context
   * @returns {Promise<Object>} Cache check result
   */
  async checkGlobalCacheForEnhancement(imageBuffer, options = {}) {
    try {
      const result = await this.globalCache.checkForExistingEnhancement(imageBuffer);
      
      if (result.hasEnhancement) {
        console.log(`🌍 Global cache contains enhancement for this image`);
        return {
          found: true,
          enhancementData: result.enhancementData,
          contentHash: result.contentHash,
          source: 'global_cache'
        };
      }
      
      // Also check enhanced merchandise database for legacy entries
      if (options.originalImageId) {
        const legacyResult = await this.enhancedDB.getEnhancedImageWithGlobalCache(imageBuffer, options.originalImageId);
        
        if (legacyResult) {
          console.log(`📦 Found enhancement in legacy cache`);
          return {
            found: true,
            enhancementData: legacyResult,
            contentHash: result.contentHash,
            source: 'legacy_cache'
          };
        }
      }
      
      return {
        found: false,
        contentHash: result.contentHash,
        source: 'none'
      };
      
    } catch (error) {
      console.error('Error checking global cache:', error);
      return {
        found: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Upload cached enhancement to Printify
   * @param {Object} cacheResult - Cache result containing enhancement data
   * @param {string} fileName - Original filename
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadCachedEnhancement(cacheResult, fileName, options = {}) {
    try {
      const { enhancementData, contentHash, source } = cacheResult;
      
      console.log(`📤 Uploading cached enhancement from ${source}...`);
      
      // Download the enhanced image from S3
      const enhancedImageBuffer = await this.downloadImageBuffer(enhancementData.enhancedImageUrl);
      
      if (!enhancedImageBuffer) {
        throw new Error('Failed to download cached enhanced image from S3');
      }
      
      // Upload to Printify using the enhanced image
      const uploadResult = await this.uploadImage(enhancedImageBuffer, fileName, options.title);
      
      if (uploadResult.success) {
        return {
          ...uploadResult,
          autoEnhanced: true,
          enhancementSource: 'cached',
          cacheSource: source,
          qualityEnhancement: {
            analysis: { suitableForPrint: true, enhanced: true, cached: true },
            enhanced: true,
            metadata: {
              method: enhancementData.enhancementMethod || 'cached',
              cached: true,
              contentHash: contentHash,
              scaleFactor: enhancementData.scaleFactor,
              originalDimensions: enhancementData.originalDimensions,
              enhancedDimensions: enhancementData.enhancedDimensions,
              cacheSource: source
            }
          },
          cacheOptimization: {
            contentHash: contentHash,
            isFirstOccurrence: false,
            globalCacheUsed: true,
            newEnhancementStored: false,
            cacheSource: source
          }
        };
      } else {
        throw new Error('Failed to upload cached enhanced image to Printify');
      }
      
    } catch (error) {
      console.error('Error uploading cached enhancement:', error);
      
      // If cached upload fails, we could fall back to generating a new enhancement
      console.log('🔄 Cached enhancement upload failed, this would trigger fallback to new generation');
      
      return {
        success: false,
        error: 'Cached enhancement upload failed: ' + error.message,
        fallbackRequired: true
      };
    }
  }

  /**
   * Store new enhancement in global cache
   * @param {Buffer} originalImageBuffer - Original image buffer
   * @param {Object} enhancementResult - Enhancement result from processing
   * @param {string} contentHash - Content hash of original image
   * @returns {Promise<void>}
   */
  async storeEnhancementInGlobalCache(originalImageBuffer, enhancementResult, contentHash) {
    try {
      if (!enhancementResult.qualityEnhancement?.metadata) {
        console.warn('⚠️ No enhancement metadata to store in global cache');
        return;
      }
      
      const metadata = enhancementResult.qualityEnhancement.metadata;
      
      // Extract S3 key from Printify response if available
      const s3Key = this.extractS3KeyFromPrintifyResponse(enhancementResult);
      
      const globalEnhancementData = {
        enhancedImageUrl: metadata.enhancedImageUrl || metadata.url,
        s3Key: s3Key,
        enhancementMethod: metadata.method || 'AI Upscaling',
        originalDimensions: metadata.originalDimensions || {
          width: metadata.originalWidth,
          height: metadata.originalHeight
        },
        enhancedDimensions: metadata.enhancedDimensions || {
          width: metadata.enhancedWidth,
          height: metadata.enhancedHeight
        },
        scaleFactor: metadata.scaleFactor || 4,
        qualityMetrics: {
          originalSuitableForPrint: enhancementResult.qualityEnhancement?.analysis?.suitableForPrint || false,
          enhancementApplied: true,
          processingTime: metadata.processingTime || null,
          fileSize: metadata.enhancedSize || null
        }
      };
      
      const storeResult = await this.globalCache.storeGlobalEnhancedImage(contentHash, globalEnhancementData);
      
      if (storeResult.success) {
        console.log(`✅ Stored new enhancement in global cache: ${contentHash}`);
        await this.globalCache.updateCacheStats('enhancements_created', 1);
      } else {
        console.warn('⚠️ Failed to store enhancement in global cache:', storeResult.error);
      }
      
    } catch (error) {
      console.error('Error storing enhancement in global cache:', error);
      // Don't fail the main process if cache storage fails
    }
  }

  /**
   * Extract S3 key from Printify upload response
   * @param {Object} printifyResponse - Response from Printify upload
   * @returns {string|null} S3 key if found
   */
  extractS3KeyFromPrintifyResponse(printifyResponse) {
    try {
      // Printify responses may contain S3 URLs - extract the key portion
      if (printifyResponse.imageUrl) {
        const url = printifyResponse.imageUrl;
        const s3Match = url.match(/amazonaws\.com\/(.+)$/);
        return s3Match ? s3Match[1] : null;
      }
      
      return null;
      
    } catch (error) {
      console.warn('Could not extract S3 key from Printify response:', error);
      return null;
    }
  }

  /**
   * Detect MIME type from filename
   * @param {string} fileName - File name
   * @returns {string} MIME type
   */
  detectMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff'
    };
    
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Get cache performance metrics for this service
   * @returns {Promise<Object>} Performance metrics
   */
  async getCachePerformanceMetrics() {
    try {
    // Get cache performance metrics
    const globalStats = await this.globalCache.getCacheStatistics();
    const merchandiseStats = await this.enhancedDB.getCachePerformanceMetrics();      return {
        summary: {
          globalCacheEnabled: this.cacheEnabled,
          totalCacheHits: globalStats.cacheHits,
          totalCacheMisses: globalStats.cacheMisses,
          hitRate: globalStats.hitRate,
          enhancementsCreated: globalStats.enhancementsCreated,
          enhancementsReused: globalStats.enhancementsReused,
          estimatedProcessingSaved: this.calculateProcessingSavings(globalStats)
        },
        detailed: {
          globalCache: globalStats,
          merchandiseDB: merchandiseStats
        }
      };
      
    } catch (error) {
      console.error('Error getting cache performance metrics:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Calculate estimated processing time and cost savings
   * @param {Object} globalStats - Global cache statistics
   * @returns {Object} Savings estimate
   */
  calculateProcessingSavings(globalStats) {
    // Rough estimates based on typical enhancement processing times
    const avgEnhancementTimeSeconds = 30; // Average time to enhance an image
    const avgEnhancementCostUSD = 0.05; // Estimated cost per enhancement
    
    const timesSaved = globalStats.enhancementsReused * avgEnhancementTimeSeconds;
    const costSaved = globalStats.enhancementsReused * avgEnhancementCostUSD;
    
    return {
      processingTimesSaved: globalStats.enhancementsReused,
      estimatedTimeSavedSeconds: timesSaved,
      estimatedTimeSavedMinutes: Math.round(timesSaved / 60),
      estimatedCostSavedUSD: Math.round(costSaved * 100) / 100,
      percentageOptimization: globalStats.totalRequests > 0 ? 
        Math.round((globalStats.enhancementsReused / globalStats.totalRequests) * 100) : 0
    };
  }

  /**
   * Enable or disable cache optimization
   * @param {boolean} enabled - Whether to enable cache optimization
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    console.log(`🔧 Cache optimization ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Clear cache for testing or maintenance
   * @param {Object} options - Clear options
   * @returns {Promise<Object>} Clear result
   */
  async clearCache(options = {}) {
    try {
      console.log('🧹 Cache clearing requested...');
      
      if (options.confirmAdminAction !== 'CLEAR_CACHE_CONFIRMED') {
        return {
          success: false,
          error: 'Cache clearing requires admin confirmation'
        };
      }
      
      // This would typically be implemented as an admin-only operation
      return {
        success: true,
        message: 'Cache clear would be implemented as admin operation',
        recommendation: 'Use Firebase console or admin script for cache management'
      };
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CacheOptimizedPrintifyService;