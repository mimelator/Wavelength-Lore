/**
 * Auto-Enhanced Printify Service
 * 
 * Wrapper around PrintifyService that automatically applies AI enhancement
 * when needed. This makes enhancement completely transparent to users.
 */

const PrintifyService = require('./printify-service');
const EnhancedPrintifyService = require('./enhanced-printify-service');

class AutoEnhancedPrintifyService extends PrintifyService {
  constructor() {
    super();
    this.enhancedService = new EnhancedPrintifyService();
  }
  
  /**
   * Upload image with automatic enhancement detection and processing
   * Completely transparent to the user - low quality images are auto-enhanced
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} fileName - Original filename
   * @param {string} title - Display title for the image
   * @param {Object} options - Additional options for enhancement
   * @returns {Object} Upload result with automatic enhancement info
   */
  async uploadImage(imageBuffer, fileName, title, options = {}) {
    try {
      console.log('🔄 Auto-analyzing image for merchandise quality...');
      
      // Use the enhanced service's auto-enhancement method
      const result = await this.enhancedService.uploadImageWithAutoEnhancement(
        imageBuffer, 
        fileName, 
        { title, ...options }
      );
      
      if (result.autoEnhanced) {
        console.log(`✨ Image auto-enhanced using ${result.qualityEnhancement.metadata?.method} for better print quality`);
      } else if (result.qualityEnhancement?.originalSuitable) {
        console.log('✅ Image quality already suitable for professional printing');
      } else if (result.enhancementSource === 'failed') {
        console.log('⚠️ Enhancement failed, using original image quality');
      }
      
      return result;
      
    } catch (error) {
      console.error('Auto-enhancement failed, falling back to standard upload:', error);
      
      // Fallback to standard upload if enhancement system fails
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
          originalImageSuitable: imageUploadResult.qualityEnhancement?.originalSuitable
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
          originalImageSuitable: imageUploadResult.qualityEnhancement?.originalSuitable
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
      return await this.enhancedService.upscalingService.analyzeImageQuality(imageBuffer);
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