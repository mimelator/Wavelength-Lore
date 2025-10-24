/**
 * Refactored Printify Service Architecture
 * 
 * Single service with clear separation of concerns using composition over inheritance
 */

const PrintifyService = require('./printify-service');
const ImageUpscalingService = require('./image-upscaling-service');
const GlobalImageCache = require('./global-image-cache');

class PrintifyServiceRefactored extends PrintifyService {
  constructor() {
    super();
    
    // Composition over inheritance
    this.upscaler = new ImageUpscalingService();
    this.cache = new GlobalImageCache();
    this.merchandiseDB = require('./merchandise-database');
    
    // Configuration
    this.cacheEnabled = true;
    this.autoEnhancementEnabled = true;
  }

  /**
   * Single method for image enhancement preview
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Original filename
   * @param {Object} options - Enhancement options
   * @returns {Object} Preview result
   */
  async previewImageEnhancement(imageBuffer, fileName, options = {}) {
    try {
      console.log('🔍 Generating enhancement preview for:', fileName);
      
      // Validate inputs
      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer');
      }
      
      // Check cache first if enabled
      if (this.cacheEnabled && options.originalImageId) {
        const cached = await this.getCachedEnhancement(options.originalImageId);
        if (cached) {
          return this.formatCachedResult(cached, imageBuffer);
        }
      }
      
      // Analyze image quality
      const analysis = await this.upscaler.analyzeImageQuality(imageBuffer);
      
      // If already suitable, return original
      if (analysis.suitableForPrint) {
        return this.formatOriginalResult(imageBuffer, analysis);
      }
      
      // Generate enhancement
      const enhancement = await this.generateEnhancement(imageBuffer, fileName, options, analysis);
      
      // Store in cache if enabled
      if (this.cacheEnabled && options.originalImageId && enhancement.success) {
        await this.storeEnhancementInCache(options.originalImageId, enhancement);
      }
      
      return enhancement;
      
    } catch (error) {
      console.error('Enhancement preview failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload image with automatic enhancement
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Filename
   * @param {Object} options - Upload options
   * @returns {Object} Upload result
   */
  async uploadImageWithAutoEnhancement(imageBuffer, fileName, options = {}) {
    try {
      console.log('🔄 Auto-enhancement upload for:', fileName);
      
      let finalBuffer = imageBuffer;
      let enhancementInfo = { autoEnhanced: false };
      
      // Auto-enhance if enabled
      if (this.autoEnhancementEnabled) {
        const preview = await this.previewImageEnhancement(imageBuffer, fileName, options);
        
        if (preview.success && !preview.originalImageSuitable) {
          // Download enhanced image
          const enhancedBuffer = await this.downloadImageBuffer(preview.enhancedImageUrl);
          if (enhancedBuffer) {
            finalBuffer = enhancedBuffer;
            enhancementInfo = {
              autoEnhanced: true,
              enhancementSource: 'generated',
              method: preview.enhancementMethod,
              scaleFactor: preview.scaleFactor
            };
          }
        }
      }
      
      // Upload to Printify
      const uploadResult = await this.uploadImage(finalBuffer, fileName, options.title);
      
      return {
        ...uploadResult,
        ...enhancementInfo
      };
      
    } catch (error) {
      console.error('Auto-enhancement upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods with clear responsibilities
  
  async getCachedEnhancement(imageId) {
    try {
      const sanitized = this.sanitizeFirebaseKey(imageId);
      return await this.merchandiseDB.getEnhancedImage(sanitized);
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  async generateEnhancement(imageBuffer, fileName, options, analysis) {
    try {
      const upscaleOptions = {
        fileName,
        contentType: this.detectContentType(fileName),
        targetDimensions: analysis.targetDimensions,
        ...options
      };
      
      const result = await this.upscaler.upscaleImage(imageBuffer, upscaleOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Enhancement failed');
      }
      
      const enhancedBuffer = result.printOptimized || result.upscaledBuffer;
      if (!Buffer.isBuffer(enhancedBuffer)) {
        throw new Error('Enhancement result missing valid image buffer');
      }
      
      // Store enhanced image in S3
      const storeResult = await this.upscaler.storeUpscaledImage(
        options.userId || 'preview-user',
        options.originalImageId || 'preview-image',
        enhancedBuffer,
        result.metadata
      );
      
      if (!storeResult?.url) {
        throw new Error('Failed to store enhanced image');
      }
      
      const originalDims = await this.getImageDimensions(imageBuffer);
      const enhancedDims = await this.getImageDimensions(enhancedBuffer);
      
      return {
        success: true,
        originalImageSuitable: false,
        originalDimensions: originalDims,
        enhancedDimensions: enhancedDims,
        enhancedImageUrl: storeResult.url,
        enhancementMethod: result.metadata?.method || 'AI Upscaling',
        scaleFactor: Math.round((enhancedDims.width / originalDims.width) * 10) / 10,
        improvementDescription: `Enhanced from ${originalDims.width}×${originalDims.height} to ${enhancedDims.width}×${enhancedDims.height}`
      };
      
    } catch (error) {
      console.error('Enhancement generation failed:', error);
      throw error;
    }
  }

  formatCachedResult(cached, originalBuffer) {
    return {
      success: true,
      originalImageSuitable: false,
      originalDimensions: cached.originalDimensions || { width: 1024, height: 1024 },
      enhancedDimensions: cached.enhancedDimensions || { width: 2048, height: 2048 },
      enhancedImageUrl: cached.enhancedImageUrl,
      enhancementMethod: cached.enhancementMethod || 'Cached Enhancement',
      scaleFactor: cached.scaleFactor || 2.0,
      improvementDescription: cached.improvementDescription || 'Quality enhanced for printing',
      cached: true
    };
  }

  formatOriginalResult(imageBuffer, analysis) {
    const dims = { width: analysis.originalWidth, height: analysis.originalHeight };
    return {
      success: true,
      originalImageSuitable: true,
      originalDimensions: dims,
      enhancedDimensions: dims,
      enhancedImageUrl: '', // Use original
      enhancementMethod: 'Not needed',
      scaleFactor: 1.0,
      improvementDescription: 'Image quality is already suitable for printing'
    };
  }

  async storeEnhancementInCache(imageId, enhancement) {
    try {
      const data = {
        enhancedImageUrl: enhancement.enhancedImageUrl,
        enhancementMethod: enhancement.enhancementMethod,
        originalDimensions: enhancement.originalDimensions,
        enhancedDimensions: enhancement.enhancedDimensions,
        scaleFactor: enhancement.scaleFactor,
        improvementDescription: enhancement.improvementDescription
      };
      
      const sanitized = this.sanitizeFirebaseKey(imageId);
      await this.merchandiseDB.storeEnhancedImage(sanitized, data);
      console.log('✅ Stored enhancement in cache');
    } catch (error) {
      console.warn('Failed to store in cache:', error);
    }
  }

  // Utility methods
  
  sanitizeFirebaseKey(key) {
    return key.replace(/[.#$\[\]\/]/g, '_');
  }

  detectContentType(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('photo') || name.includes('portrait')) return 'photo';
    if (name.includes('art') || name.includes('draw')) return 'artwork';
    if (name.includes('character')) return 'character';
    return 'illustration';
  }

  async getImageDimensions(imageBuffer) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      return { width: metadata.width, height: metadata.height };
    } catch (error) {
      console.error('Error getting dimensions:', error);
      return { width: 0, height: 0 };
    }
  }

  async downloadImageBuffer(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image from URL');
    }
  }

  // Configuration methods
  
  enableCache(enabled = true) {
    this.cacheEnabled = enabled;
    console.log(`🔧 Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  enableAutoEnhancement(enabled = true) {
    this.autoEnhancementEnabled = enabled;
    console.log(`🔧 Auto-enhancement ${enabled ? 'enabled' : 'disabled'}`);
  }
}

module.exports = PrintifyServiceRefactored;