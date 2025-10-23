/**
 * Auto-Enhanced Printify Service
 * 
 * Wrapper around PrintifyService that automatically applies AI enhancement
 * when needed with global cache optimization to minimize redundant processing.
 * This makes enhancement completely transparent to users while maximizing efficiency.
 */

const PrintifyService = require('./printify-service');
const CacheOptimizedPrintifyService = require('./cache-optimized-printify-service');

class AutoEnhancedPrintifyService extends PrintifyService {
  constructor() {
    super();
    this.cacheOptimizedService = new CacheOptimizedPrintifyService();
    this.cacheEnabled = true;
  }
  
  /**
   * Upload image with automatic enhancement detection and processing
   * Now with global cache optimization to minimize redundant enhancement
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @param {string} title - Display title for the image
   * @param {Object} options - Additional options for enhancement
   * @returns {Object} Upload result with automatic enhancement info
   */
  async uploadImage(imageBuffer, fileName, title, options = {}) {
    try {
      console.log('🔄 Auto-analyzing image for merchandise quality with cache optimization...');
      
      // Use the cache-optimized service's auto-enhancement method
      const result = await this.cacheOptimizedService.uploadImageWithAutoEnhancement(
        imageBuffer, 
        fileName, 
        { title, ...options }
      );
      
      if (result.autoEnhanced) {
        if (result.enhancementSource === 'cached') {
          console.log(`♻️ Image enhancement reused from ${result.cacheSource} - processing time saved!`);
        } else {
          console.log(`✨ Image auto-enhanced using ${result.qualityEnhancement.metadata?.method} for better print quality`);
        }
      } else if (result.qualityEnhancement?.originalSuitable) {
        console.log('✅ Image quality already suitable for professional printing');
      } else if (result.enhancementSource === 'failed') {
        console.log('⚠️ Enhancement failed, using original image quality');
      }
      
      // Add cache performance info to result
      if (result.cacheOptimization) {
        console.log('📊 Cache optimization result:', {
          contentHash: result.cacheOptimization.contentHash?.substring(0, 12) + '...',
          isFirstOccurrence: result.cacheOptimization.isFirstOccurrence,
          globalCacheUsed: result.cacheOptimization.globalCacheUsed,
          newEnhancementStored: result.cacheOptimization.newEnhancementStored
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Cache-optimized auto-enhancement failed, falling back to standard upload:', error);
      
      // Fallback to standard upload if cache-optimized enhancement system fails
      return super.uploadImage(imageBuffer, fileName, title);
    }
  }
  
  /**
   * Create custom product with automatic image enhancement
   * @param {Buffer} imageBuffer - Image buffer instead of imageId
   * @param {string} fileName - Image filename
   * @param {Object} productOptions - Product configuration
   * @returns {Object} Created product with enhancement info
   */
  async createCustomProductWithAutoEnhancement(imageBuffer, fileName, productOptions = {}) {
    try {
      const { title, description, tags = [], userId, originalImageId } = productOptions;
      
      console.log('🎯 Creating custom product with auto-enhancement...');
      
      // Upload image with auto-enhancement
      const imageUploadResult = await this.uploadImage(
        imageBuffer, 
        fileName, 
        title || 'Custom Merchandise Image',
        { userId, originalImageId }
      );
      
      if (!imageUploadResult.success) {
        throw new Error('Failed to upload image: ' + imageUploadResult.error);
      }
      
      // Create product using the uploaded (possibly enhanced) image
      const productResult = await this.createCustomProduct(imageUploadResult.imageId, {
        title,
        description,
        tags
      });
      
      // Add enhancement information to the result
      return {
        ...productResult,
        imageEnhancement: {
          autoEnhanced: imageUploadResult.autoEnhanced,
          enhancementSource: imageUploadResult.enhancementSource,
          qualityInfo: imageUploadResult.qualityEnhancement,
          originalImageSuitable: imageUploadResult.qualityEnhancement?.originalSuitable || false
        },
        uploadedImage: {
          id: imageUploadResult.imageId,
          url: imageUploadResult.url,
          dimensions: `${imageUploadResult.width}x${imageUploadResult.height}`
        }
      };
      
    } catch (error) {
      console.error('Error creating product with auto-enhancement:', error);
      return {
        success: false,
        error: error.message || 'Failed to create custom product'
      };
    }
  }
  
  /**
   * Create custom product with specific blueprint and auto-enhancement
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Image filename
   * @param {Object} productOptions - Product configuration including blueprint
   * @returns {Object} Created product with enhancement info
   */
  async createCustomProductWithBlueprintAndAutoEnhancement(imageBuffer, fileName, productOptions = {}) {
    try {
      const { 
        title, 
        description, 
        tags = [], 
        blueprintId, 
        printProviderId,
        basePrice = 2099,
        userId,
        originalImageId
      } = productOptions;
      
      if (!blueprintId || !printProviderId) {
        throw new Error('Blueprint ID and Print Provider ID are required');
      }
      
      console.log('🎯 Creating custom product with blueprint and auto-enhancement...');
      
      // Upload image with auto-enhancement
      const imageUploadResult = await this.uploadImage(
        imageBuffer, 
        fileName, 
        title || 'Custom Merchandise Image',
        { userId, originalImageId }
      );
      
      if (!imageUploadResult.success) {
        throw new Error('Failed to upload image: ' + imageUploadResult.error);
      }
      
      // Create product using the uploaded (possibly enhanced) image
      const productResult = await this.createCustomProductWithBlueprint(imageUploadResult.imageId, {
        title,
        description,
        tags,
        blueprintId,
        printProviderId,
        basePrice
      });
      
      // Add enhancement information to the result
      return {
        ...productResult,
        imageEnhancement: {
          autoEnhanced: imageUploadResult.autoEnhanced,
          enhancementSource: imageUploadResult.enhancementSource,
          qualityInfo: imageUploadResult.qualityEnhancement,
          originalImageSuitable: imageUploadResult.qualityEnhancement?.originalSuitable || false
        },
        uploadedImage: {
          id: imageUploadResult.imageId,
          url: imageUploadResult.url,
          dimensions: `${imageUploadResult.width}x${imageUploadResult.height}`
        }
      };
      
    } catch (error) {
      console.error('Error creating product with blueprint and auto-enhancement:', error);
      return {
        success: false,
        error: error.message || 'Failed to create custom product'
      };
    }
  }
  
  /**
   * Get enhancement status and recommendations for an image buffer
   * @param {Buffer} imageBuffer - Image buffer to analyze
   * @returns {Object} Enhancement analysis
   */
  async analyzeImageQuality(imageBuffer) {
    try {
      return await this.cacheOptimizedService.upscalingService.analyzeImageQuality(imageBuffer);
    } catch (error) {
      console.error('Error analyzing image quality:', error);
      return {
        error: error.message,
        suitableForPrint: null,
        recommendedAction: 'unknown'
      };
    }
  }

  /**
   * Get cache performance metrics
   * @returns {Promise<Object>} Cache performance data
   */
  async getCachePerformanceMetrics() {
    try {
      return await this.cacheOptimizedService.getCachePerformanceMetrics();
    } catch (error) {
      console.error('Error getting cache performance metrics:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Enable or disable cache optimization
   * @param {boolean} enabled - Whether to enable cache optimization
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    this.cacheOptimizedService.setCacheEnabled(enabled);
    console.log(`🔧 Auto-enhanced service cache optimization ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  /**
   * Preview image enhancement without actually uploading to Printify
   * Allows users to see enhancement results before committing to product creation
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @param {Object} options - Enhancement options
   * @returns {Object} Preview result with original and enhanced image info
   */
  async previewImageEnhancement(imageBuffer, fileName, options = {}) {
    try {
      console.log('🔍 Generating enhancement preview for:', fileName);
      
      // Use the enhanced service's preview method
      const result = await this.enhancedService.previewEnhancement(
        imageBuffer, 
        fileName, 
        options
      );
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      console.error('Enhancement preview failed:', error);
      return {
        success: false,
        error: error.message || 'Preview generation failed'
      };
    }
  }
  
  /**
   * Check if auto-enhancement is available
   * @returns {Object} Enhancement service status
   */
  getEnhancementStatus() {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
    
    return {
      available: hasOpenAI || hasReplicate,
      services: {
        openai: hasOpenAI,
        replicate: hasReplicate,
        sharp: true // Always available
      },
      recommendation: hasOpenAI && hasReplicate 
        ? 'Full AI enhancement available' 
        : hasOpenAI 
          ? 'AI enhancement available for artwork'
          : hasReplicate
            ? 'AI enhancement available for photos'
            : 'Basic upscaling only'
    };
  }
}

module.exports = AutoEnhancedPrintifyService;