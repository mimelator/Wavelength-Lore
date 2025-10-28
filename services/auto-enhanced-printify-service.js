/**
 * Refactored Printify Service
 * 
 * Single service with clear separation of concerns using composition over inheritance
 */

const PrintifyService = require('./printify-service');
const ImageUpscalingService = require('./image-upscaling-service');

class AutoEnhancedPrintifyService extends PrintifyService {
  constructor() {
    super();
    
    // Composition over inheritance
    this.upscaler = new ImageUpscalingService();
    this.merchandiseDB = require('./merchandise-database');
    
    // Configuration
    this.cacheEnabled = true;
    this.autoEnhancementEnabled = true;
  }
  
  /**
   * Upload image with automatic enhancement
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Filename
   * @param {string} title - Display title
   * @param {Object} options - Upload options including effectParams
   * @returns {Object} Upload result
   */
  async uploadImage(imageBuffer, fileName, title, options = {}) {
    try {
      console.log('🔄 Auto-enhancement upload for:', fileName);

      // 🔄 STEP 1: Check initial image quality
      let qualityCheck = await this.validateImageQualityForPrintify(imageBuffer, fileName);
      let finalBuffer = imageBuffer;
      let enhancementInfo = { autoEnhanced: false };
      let effectsAppliedAfterUpscaling = false;

      // 🚀 STEP 2: If image is too small or low-quality, UPSCALE immediately
      if (!qualityCheck.passedValidation) {
        console.log(`⚠️ Image quality insufficient: ${qualityCheck.reason}`);
        console.log('🚀 Upscaling image to Printify standards...');

        try {
          const upscaledBuffer = await this.upscaler.upscaleImageForPrintify(imageBuffer, fileName);
          if (upscaledBuffer) {
            console.log('✅ Image successfully upscaled');

            // For upscaled images, we're more lenient with compression check since we're upscaling web images
            // Just verify the dimensions are sufficient
            const sharp = require('sharp');
            const upscaledMetadata = await sharp(upscaledBuffer).metadata();
            const isUpscaledSizeSufficient = upscaledMetadata.width >= 1800 && upscaledMetadata.height >= 1800;

            if (isUpscaledSizeSufficient) {
              console.log(`✅ Upscaled image dimensions sufficient: ${upscaledMetadata.width}x${upscaledMetadata.height}`);
              finalBuffer = upscaledBuffer;
              enhancementInfo = {
                autoEnhanced: true,
                enhancementSource: 'upscaling',
                reason: 'Original image was too small and was upscaled to meet Printify requirements'
              };

              // 🔥 FIX FOR GITHUB ISSUE #96: Apply effects AFTER upscaling (not before)
              // This ensures effects are applied to the final quality image, not lost during upscaling
              if (options.effectParams && Object.keys(options.effectParams).length > 0) {
                console.log('\n🔥 APPLYING EFFECTS AFTER UPSCALING (Issue #96 Fix)');
                console.log('   Effects to apply:', options.effectParams);

                try {
                  const EffectsProcessor = require('./EffectsProcessor');
                  const effectsProcessor = new EffectsProcessor();

                  const effectsModifiedBuffer = await effectsProcessor.processImage(finalBuffer, options.effectParams);
                  if (effectsModifiedBuffer && effectsModifiedBuffer.length > 0) {
                    console.log('✅ Effects applied to upscaled image');
                    console.log('   Upscaled buffer size:', (finalBuffer.length / 1024).toFixed(2), 'KB');
                    console.log('   Effects-modified size:', (effectsModifiedBuffer.length / 1024).toFixed(2), 'KB');
                    finalBuffer = effectsModifiedBuffer;
                    effectsAppliedAfterUpscaling = true;
                    console.log('   ✅ finalBuffer updated with effects-modified version');
                  } else {
                    console.warn('⚠️ Effects processing returned empty buffer, keeping upscaled version');
                  }
                } catch (effectsError) {
                  console.error('❌ Failed to apply effects after upscaling:', effectsError.message);
                  console.warn('⚠️ Continuing with upscaled image (effects not applied)');
                }
              }
            } else {
              throw new Error(`Upscaled image dimensions still insufficient: ${upscaledMetadata.width}x${upscaledMetadata.height}. Printify requires minimum 1800x1800.`);
            }
          }
        } catch (upscaleError) {
          console.error('❌ Upscaling failed:', upscaleError);
          throw new Error(`Cannot upload image to Printify: ${qualityCheck.reason}. Upscaling also failed: ${upscaleError.message}`);
        }
      }

      // 🎨 STEP 3: Auto-enhance if image quality is good
      if (this.autoEnhancementEnabled && qualityCheck.passedValidation) {
        const preview = await this.previewImageEnhancement(finalBuffer, fileName, options);

        if (preview.success && !preview.originalImageSuitable) {
          // Download enhanced image
          const enhancedBuffer = await this.downloadImageBuffer(preview.enhancedImageUrl);
          if (enhancedBuffer) {
            finalBuffer = enhancedBuffer;
            enhancementInfo = {
              autoEnhanced: true,
              enhancementSource: 'generated',
              qualityEnhancement: {
                metadata: {
                  method: preview.enhancementMethod,
                  scaleFactor: preview.scaleFactor
                }
              }
            };

            // 🚨 RE-VALIDATE enhanced image quality
            const enhancedQualityCheck = await this.validateImageQualityForPrintify(finalBuffer, `enhanced-${fileName}`);
            if (!enhancedQualityCheck.passedValidation) {
              throw new Error(`ENHANCED IMAGE QUALITY VALIDATION FAILED: ${enhancedQualityCheck.reason}. Enhancement did not produce Printify-quality image.`);
            }
            console.log('✅ Enhanced image passed Printify quality validation');
          }
        }
      }

      // ✅ STEP 4: Final validation before Printify upload
      // For upscaled images, only check dimensions (they may still have compression artifacts)
      let canProceedWithUpload = true;

      if (enhancementInfo.enhancementSource === 'upscaling') {
        // For upscaled images, just verify dimensions
        const sharp = require('sharp');
        const finalMetadata = await sharp(finalBuffer).metadata();
        canProceedWithUpload = finalMetadata.width >= 1800 && finalMetadata.height >= 1800;

        if (!canProceedWithUpload) {
          throw new Error(`Upscaled image dimensions insufficient: ${finalMetadata.width}x${finalMetadata.height}. Printify requires 1800x1800.`);
        }
        console.log(`✅ Upscaled image dimensions verified: ${finalMetadata.width}x${finalMetadata.height} - proceeding with upload`);
      } else {
        // For non-upscaled images, do full validation
        const finalQualityCheck = await this.validateImageQualityForPrintify(finalBuffer, fileName);
        if (!finalQualityCheck.passedValidation) {
          throw new Error(`FINAL QUALITY VALIDATION FAILED: ${finalQualityCheck.reason}. Cannot upload to Printify.`);
        }
        console.log('✅ Image passed all quality validations - uploading to Printify');
      }

      // 📤 STEP 5: Upload to Printify
      const uploadResult = await super.uploadImage(finalBuffer, fileName, title);

      return {
        ...uploadResult,
        ...enhancementInfo,
        effectsAppliedAfterUpscaling: effectsAppliedAfterUpscaling
      };

    } catch (error) {
      console.error('❌ Auto-enhancement upload failed:', error.message);
      throw new Error(`Cannot upload image to Printify: ${error.message}`);
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
        originalImageId,
        effectParams  // 🔥 GITHUB ISSUE #96: Pass effect parameters to apply AFTER upscaling
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
        { userId, originalImageId, effectParams }  // 🔥 Pass effectParams for post-upscaling application
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
      console.log('🔍 generateEnhancement called with:', {
        fileName,
        bufferLength: imageBuffer.length,
        analysisKeys: Object.keys(analysis),
        optionsKeys: Object.keys(options)
      });
      
      const upscaleOptions = {
        fileName,
        contentType: this.detectContentType(fileName),
        targetDimensions: analysis.targetDimensions,
        ...options
      };
      
      console.log('🔍 Calling upscaler.upscaleImage with options:', {
        fileName: upscaleOptions.fileName,
        contentType: upscaleOptions.contentType,
        hasTargetDimensions: !!upscaleOptions.targetDimensions
      });
      
      const result = await this.upscaler.upscaleImage(imageBuffer, upscaleOptions);
      
      console.log('🔍 Upscaler result:', {
        success: result.success,
        error: result.error,
        method: result.method,
        hasPrintOptimized: !!result.printOptimized,
        hasUpscaledBuffer: !!result.upscaledBuffer,
        hasMetadata: !!result.metadata,
        resultKeys: Object.keys(result)
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Enhancement failed');
      }
      
      // Handle cache hit case where buffer is not provided
      let enhancedBuffer = result.printOptimized || result.upscaledBuffer;
      const imageUrl = result.upscaledUrl || result.enhancedUrl;
      
      console.log('🔍 Buffer validation:', {
        method: result.method,
        cached: result.cached,
        printOptimized: !!result.printOptimized,
        upscaledBuffer: !!result.upscaledBuffer,
        enhancedBuffer: !!enhancedBuffer,
        isBuffer: Buffer.isBuffer(enhancedBuffer),
        bufferLength: enhancedBuffer?.length,
        hasUrl: !!imageUrl,
        imageUrl: imageUrl
      });
      
      // If no buffer but we have a URL (cache hit), download the buffer
      console.log('🔍 DOWNLOAD CHECK: isBuffer=', Buffer.isBuffer(enhancedBuffer), 'hasUrl=', !!imageUrl, 'url=', imageUrl);
      if (!Buffer.isBuffer(enhancedBuffer) && imageUrl) {
        console.log('🔍 Cache hit detected, downloading buffer from URL:', imageUrl);
        try {
          enhancedBuffer = await this.downloadImageBuffer(imageUrl);
          console.log('✅ Successfully downloaded cached image buffer:', enhancedBuffer?.length, 'bytes');
        } catch (downloadError) {
          console.error('❌ Failed to download cached image:', downloadError.message);
          throw new Error('Failed to download cached enhanced image');
        }
      }
      
      if (!Buffer.isBuffer(enhancedBuffer)) {
        console.error('❌ BUFFER VALIDATION FAILED:', {
          printOptimized: result.printOptimized,
          upscaledBuffer: result.upscaledBuffer,
          enhancedBuffer: enhancedBuffer,
          typeOfEnhancedBuffer: typeof enhancedBuffer,
          method: result.method,
          cached: result.cached,
          upscaledUrl: result.upscaledUrl,
          enhancedUrl: result.enhancedUrl,
          imageUrl: imageUrl,
          downloadAttempted: !!imageUrl && !Buffer.isBuffer(result.printOptimized || result.upscaledBuffer)
        });
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

  formatCachedResult(cached) {
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

  formatOriginalResult(analysis) {
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
  
  setCacheEnabled(enabled = true) {
    this.cacheEnabled = enabled;
    console.log(`🔧 Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  setAutoEnhancementEnabled(enabled = true) {
    this.autoEnhancementEnabled = enabled;
    console.log(`🔧 Auto-enhancement ${enabled ? 'enabled' : 'disabled'}`);
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
          return this.formatCachedResult(cached);
        }
      }
      
      // Analyze image quality
      console.log('🔍 Analyzing image quality...');
      const analysis = await this.upscaler.analyzeImageQuality(imageBuffer);
      
      console.log('🔍 Quality analysis result:', {
        suitableForPrint: analysis.suitableForPrint,
        originalWidth: analysis.originalWidth,
        originalHeight: analysis.originalHeight,
        recommendedAction: analysis.recommendedAction
      });
      
      // If already suitable, return original
      if (analysis.suitableForPrint) {
        console.log('🔍 Image already suitable, returning original result');
        return this.formatOriginalResult(analysis);
      }
      
      // Generate enhancement
      console.log('🔍 Image needs enhancement, generating...');
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
  
  /**
   * 🚨 CRITICAL VALIDATION: Ensure image meets Printify quality requirements
   * Printify requires high-quality 300DPI images, not compressed web images
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @param {string} fileName - Image filename for logging
   * @returns {Object} Validation result with pass/fail and reason
   */
  async validateImageQualityForPrintify(imageBuffer, fileName) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      
      const width = metadata.width;
      const height = metadata.height;
      const format = metadata.format;
      const density = metadata.density || 72; // Default web DPI
      
      console.log(`🔍 PRINTIFY QUALITY CHECK: ${fileName}`);
      console.log(`   📐 Dimensions: ${width}x${height}`);
      console.log(`   🎨 Format: ${format}`);
      console.log(`   📊 Density: ${density} DPI`);
      
      // MINIMUM REQUIREMENTS FOR PRINTIFY
      const MIN_WIDTH = 1800;   // Minimum width for quality printing
      const MIN_HEIGHT = 1800;  // Minimum height for quality printing  
      const MIN_DPI = 200;      // Minimum DPI (prefer 300+)
      const MAX_COMPRESSION_FORMATS = ['webp', 'jpeg']; // Formats that are often too compressed
      
      // Check 1: Minimum dimensions
      if (width < MIN_WIDTH || height < MIN_HEIGHT) {
        return {
          passedValidation: false,
          reason: `Image too small: ${width}x${height}. Printify needs minimum ${MIN_WIDTH}x${MIN_HEIGHT} for quality printing.`,
          metadata: { width, height, format, density }
        };
      }
      
      // Check 2: DPI/Quality check  
      if (density < MIN_DPI) {
        return {
          passedValidation: false,
          reason: `Image DPI too low: ${density}. Printify needs minimum ${MIN_DPI} DPI (prefer 300+) for quality printing.`,
          metadata: { width, height, format, density }
        };
      }
      
      // Check 3: Format quality concerns
      if (format === 'webp') {
        return {
          passedValidation: false,
          reason: `WebP format not suitable for Printify. WebP is highly compressed for web use. Printify needs high-quality uncompressed images.`,
          metadata: { width, height, format, density }
        };
      }
      
      // Check 4: File size too small (indicates over-compression)
      const fileSizeKB = imageBuffer.length / 1024;
      const pixelCount = width * height;
      const bytesPerPixel = imageBuffer.length / pixelCount;
      
      if (bytesPerPixel < 2) { // Very compressed
        return {
          passedValidation: false,
          reason: `Image appears over-compressed: ${bytesPerPixel.toFixed(2)} bytes/pixel. Printify needs high-quality uncompressed images.`,
          metadata: { width, height, format, density, fileSizeKB, bytesPerPixel }
        };
      }
      
      // ✅ PASSED ALL VALIDATIONS
      console.log('✅ Image meets Printify quality requirements');
      return {
        passedValidation: true,
        reason: 'Image meets all Printify quality requirements',
        metadata: { width, height, format, density, fileSizeKB, bytesPerPixel }
      };
      
    } catch (error) {
      console.error('❌ Quality validation error:', error);
      return {
        passedValidation: false,
        reason: `Quality validation failed: ${error.message}`,
        metadata: {}
      };
    }
  }
}

module.exports = AutoEnhancedPrintifyService;