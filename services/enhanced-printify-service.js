/**
 * Enhanced Printify Service with AI Upscaling Integration
 * 
 * Extends the base PrintifyService with intelligent image quality analysis
 * and automatic upscaling for optimal print merchandise quality
 */

const PrintifyService = require('./printify-service');
const { ServiceResponse, EnhancedServiceBase } = require('../utils/service-patterns');
const RuntimeDiagnostics = require('../utils/runtime-diagnostics');
const ImageUpscalingService = require('./image-upscaling-service');

class EnhancedPrintifyService extends PrintifyService {
  constructor() {
    super();
    this.upscalingService = new ImageUpscalingService();
    
    // Import and initialize merchandise database for enhanced image associations
    // Use the singleton instance of the MerchandiseDatabase
    this.merchandiseDatabase = require('./merchandise-database');
  }
  
  /**
   * Sanitizes a string to be used as a valid Firebase Realtime Database key.
   * Replaces illegal characters ('.', '#', '$', '[', ']', '/') with an underscore.
   * @param {string} key - The string to sanitize.
   * @returns {string} A valid Firebase key.
   */
  _sanitizeFirebaseKey(key) {
    return key.replace(/[.#$\[\]\/]/g, '_');
  }
  /**
   * Enhanced image upload with automatic quality analysis and upscaling
   * This method automatically enhances images when needed - no user intervention required
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} fileName - Original filename
   * @param {Object} options - Enhancement options
   * @returns {Object} Upload result with quality enhancements
   */
  async uploadImageWithAutoEnhancement(imageBuffer, fileName, options = {}) {
    // ENHANCED DIAGNOSTICS: Pre-execution validation
    const diagnostics = new RuntimeDiagnostics('EnhancedPrintifyService');
    const paramDiagnostics = diagnostics.validateMethodParameters('uploadImageWithAutoEnhancement', {
      imageBuffer,
      fileName,
      options
    }, {
      imageBuffer: 'buffer',
      fileName: 'string',
      options: 'object'
    });
    
    try {
      // RUNTIME VALIDATION: Method entry point validation
      console.log('🔍 PARAMETER VALIDATION: uploadImageWithAutoEnhancement called with parameters');
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        const error = new Error('Invalid imageBuffer: must be a Buffer object');
        console.error('🚨 ENTRY VALIDATION FAILED:', error.message);
        throw error;
      }
      if (!fileName || typeof fileName !== 'string') {
        const error = new Error('Invalid fileName: must be a non-empty string');
        console.error('🚨 ENTRY VALIDATION FAILED:', error.message);
        throw error;
      }
      console.log(`   Image Buffer: ${imageBuffer.length} bytes`);
      console.log(`   File Name: ${fileName}`);
      console.log(`   Options: ${Object.keys(options).length} properties`);
      
      console.log('🔍 Auto-analyzing image quality for print suitability...');
      
      // Step 1: Check if we already have an enhanced version stored in database
      let existingEnhanced = null;
      if (options.originalImageId) {
        try {
          const sanitizedImageId = this._sanitizeFirebaseKey(options.originalImageId);
          existingEnhanced = await this.merchandiseDatabase.getEnhancedImage(sanitizedImageId);
          
          if (existingEnhanced && existingEnhanced.enhancedImageUrl) {
            console.log(`♻️ Found existing enhanced version for ${options.originalImageId}, using cached image via S3 key: ${existingEnhanced.s3Key}`);
            
            // Download the cached enhanced image
            const enhancedImageBuffer = await this.downloadImageBuffer(existingEnhanced.enhancedImageUrl);
            if (enhancedImageBuffer) {
              // Upload the cached enhanced image to Printify
              const uploadResult = await this.uploadImage(
                enhancedImageBuffer, 
                fileName, 
                options.title
              );
              
              // If the upload of the cached image to Printify is successful,
              // construct a complete response object that mirrors the structure
              // of a newly generated enhancement. This is the critical fix.
              if (uploadResult.success) {
                return {
                  ...uploadResult,
                  autoEnhanced: true,
                  enhancementSource: 'cached', // Explicitly set the source
                  qualityEnhancement: {
                    analysis: { suitableForPrint: true, enhanced: true, cached: true },
                    s3Key: existingEnhanced.s3Key,
                    enhanced: true,
                    metadata: { 
                      method: existingEnhanced.enhancementMethod || 'cached', 
                      cached: true,
                      scaleFactor: existingEnhanced.scaleFactor,
                      ...existingEnhanced // Include all other cached metadata
                    },
                  },
                };
              }
            } else {
              console.warn('⚠️ Failed to download cached enhanced image, will generate new one');
            }
          }
        } catch (dbError) {
          console.warn('⚠️ Error checking for cached enhanced image:', dbError.message);
          // Continue with normal enhancement process
        }
      }
      
      // Step 2: Analyze image quality
      const qualityAnalysis = await this.upscalingService.analyzeImageQuality(imageBuffer);
      
      console.log('📊 Auto Quality Analysis:', {
        originalDimensions: `${qualityAnalysis.originalWidth}x${qualityAnalysis.originalHeight}`,
        estimatedDPI: qualityAnalysis.estimatedDPI,
        suitableForPrint: qualityAnalysis.suitableForPrint,
        recommendedAction: qualityAnalysis.recommendedAction
      });
      
      let finalImageBuffer = imageBuffer;
      let enhancementMetadata = null;
      let autoEnhanced = false;
      
      // Step 3: Automatically enhance if quality is insufficient
      if (!qualityAnalysis.suitableForPrint && qualityAnalysis.recommendedAction !== 'none') {
        console.log('🚀 Auto-enhancing image for optimal print quality...');
        autoEnhanced = true;
        
        const upscalingOptions = {
          method: options.upscaleMethod || 'auto',
          scaleFactor: qualityAnalysis.targetDimensions?.scaleFactor || 4,
          fileName: fileName, // Pass the fileName for content type detection
          enhanceDetails: true,
          preserveStyle: true,
          contentType: this.detectContentType(fileName, options),
          character: options.character,
          style: options.style,
          originalImageId: options.originalImageId, // Pass originalImageId for storage key
          userId: options.userId // Pass userId for S3 storage
        };
        
        try {
          const upscalingResult = await this.upscalingService.upscaleImage(imageBuffer, upscalingOptions);
          
          // ENHANCED DIAGNOSTICS: Validate upscaling result signature
          const resultDiagnostics = diagnostics.validateCacheResponse(upscalingResult, 'upscaling-result');
          console.log(`🔍 UPSCALING RESULT DIAGNOSTICS:`, {
            method: upscalingResult.method,
            cached: upscalingResult.cached,
            hasBuffer: !!upscalingResult.upscaledBuffer,
            needsDownload: resultDiagnostics.validation.needsDownload
          });
          
          if (upscalingResult.success) {
            // Handle cache hit case where buffer needs to be downloaded
            if (upscalingResult.method === 'cache' && !upscalingResult.upscaledBuffer && upscalingResult.upscaledUrl) {
              console.log('🎯 Cache hit detected, downloading buffer from:', upscalingResult.upscaledUrl);
              finalImageBuffer = await this.downloadImageBuffer(upscalingResult.upscaledUrl);
              if (!finalImageBuffer) {
                throw new Error('Failed to download cached image buffer');
              }
            } else {
              finalImageBuffer = upscalingResult.printOptimized || upscalingResult.upscaledBuffer;
            }
            
            enhancementMetadata = upscalingResult.metadata;
            
            console.log('✨ Auto-enhancement successful:', {
              method: upscalingResult.method,
              originalSize: `${Math.round((upscalingResult.metadata.originalSize || imageBuffer.length) / 1024)}KB`,
              enhancedSize: `${Math.round((upscalingResult.metadata.upscaledSize || finalImageBuffer?.length || 0) / 1024)}KB`,
              scaleFactor: upscalingResult.metadata.scaleFactor
            });
            
            // Store enhanced image association in database for future use
            // This is now the single source of truth for writing to the cache.
            if (options.originalImageId && enhancementMetadata.url) {
              try {
                // Validate processedDimensions before parsing
                let enhancedWidth, enhancedHeight, calculatedScaleFactor;
                
                if (enhancementMetadata.processedDimensions && 
                    typeof enhancementMetadata.processedDimensions === 'string' &&
                    enhancementMetadata.processedDimensions.includes('x')) {
                  // Calculate scale factor from actual dimensions
                  enhancedWidth = parseInt(enhancementMetadata.processedDimensions.split('x')[0]);
                  enhancedHeight = parseInt(enhancementMetadata.processedDimensions.split('x')[1]);
                  calculatedScaleFactor = Math.round((enhancedWidth / qualityAnalysis.originalWidth) * 10) / 10;
                } else {
                  console.warn('⚠️ processedDimensions not available or invalid format:', enhancementMetadata.processedDimensions);
                  // Fallback to provided dimensions or use defaults
                  enhancedWidth = enhancementMetadata.enhancedDimensions?.width || 1024;
                  enhancedHeight = enhancementMetadata.enhancedDimensions?.height || 1024;
                  calculatedScaleFactor = enhancementMetadata.scaleFactor || 1.0;
                }
                
                const enhancementData = {
                  s3Key: enhancementMetadata.s3Key,
                  enhancedImageUrl: enhancementMetadata.url,
                  enhancementMethod: upscalingResult.method || 'AI Upscaling',
                  originalDimensions: {
                    width: qualityAnalysis.originalWidth,
                    height: qualityAnalysis.originalHeight
                  },
                  enhancedDimensions: {
                    width: enhancedWidth,
                    height: enhancedHeight
                  },
                  scaleFactor: enhancementMetadata.scaleFactor || calculatedScaleFactor,
                  improvementDescription: `Enhanced from ${qualityAnalysis.originalWidth}×${qualityAnalysis.originalHeight} to ${enhancedWidth}x${enhancedHeight}`
                };
                
                // Log the exact record being sent to Firebase for debugging
                console.log(`\x1b[33m📝 DEBUG: Writing the following record to Firebase cache under key:\x1b[0m '${this._sanitizeFirebaseKey(options.originalImageId)}'`);
                console.log(JSON.stringify(enhancementData, null, 2));

                const sanitizedImageId = this._sanitizeFirebaseKey(options.originalImageId);
                const storeResult = await this.merchandiseDatabase.storeEnhancedImage(sanitizedImageId, enhancementData);
                if (storeResult.success) {
                  console.log(`💾 Stored enhanced image association for ${options.originalImageId}`);
                } else {
                  console.warn(`⚠️ Failed to store enhanced image association: ${storeResult.error}`);
                }
              } catch (storeError) {
                console.error('Error storing enhanced image association:', storeError);
                // Don't fail the whole process if storage fails
              }
            }
          } else {
            console.log('⚠️ Auto-enhancement failed, using original image');
            autoEnhanced = false;
          }
        } catch (enhancementError) {
          console.log('⚠️ Auto-enhancement error, falling back to original:', enhancementError.message);
          autoEnhanced = false;
        }
      } else {
        console.log('✅ Image already suitable for print quality - no enhancement needed');
      }
      
      // Step 4: Upload to Printify using base class method
      console.log('🚀 Uploading final image to Printify...');
      
      // Ensure filename has proper extension for Printify validation
      let uploadFileName = fileName;
      if (!fileName.includes('.')) {
        uploadFileName = `${fileName}.png`;
        console.log(`🔧 Fixed filename: ${fileName} → ${uploadFileName}`);
      }
      
      const uploadResult = await this.uploadImage(finalImageBuffer, uploadFileName, options.title);
      
      if (uploadResult.success) {
        // Ensure metadata includes original dimensions for global cache
        const enrichedMetadata = enhancementMetadata ? {
          ...enhancementMetadata,
          originalWidth: qualityAnalysis.originalWidth,
          originalHeight: qualityAnalysis.originalHeight,
          originalDimensions: {
            width: qualityAnalysis.originalWidth,
            height: qualityAnalysis.originalHeight
          }
        } : null;

        // Also add enhanced dimensions if we have them from the enhancement process
        if (enrichedMetadata && enhancementMetadata.processedDimensions) {
          let enhancedWidth, enhancedHeight;
          
          // Validate processedDimensions before parsing
          if (typeof enhancementMetadata.processedDimensions === 'string' &&
              enhancementMetadata.processedDimensions.includes('x')) {
            [enhancedWidth, enhancedHeight] = enhancementMetadata.processedDimensions.split('x').map(d => parseInt(d));
            enrichedMetadata.enhancedWidth = enhancedWidth;
            enrichedMetadata.enhancedHeight = enhancedHeight;
            enrichedMetadata.enhancedDimensions = {
              width: enhancedWidth,
              height: enhancedHeight
            };
          } else {
            console.warn('⚠️ Invalid processedDimensions format, using fallback:', enhancementMetadata.processedDimensions);
            // Use existing dimensions or defaults
            enhancedWidth = enhancementMetadata.enhancedDimensions?.width || 1024;
            enhancedHeight = enhancementMetadata.enhancedDimensions?.height || 1024;
            enrichedMetadata.enhancedDimensions = {
              width: enhancedWidth,
              height: enhancedHeight
            };
          }
          
          // Calculate scale factor if not present
          if (!enrichedMetadata.scaleFactor && enhancedWidth && qualityAnalysis.originalWidth) {
            enrichedMetadata.scaleFactor = Math.round((enhancedWidth / qualityAnalysis.originalWidth) * 10) / 10;
          }
        }
        
        return {
          ...uploadResult,
          autoEnhanced,
          enhancementSource: autoEnhanced ? 'generated' : 'none',
          qualityEnhancement: {
            analysis: qualityAnalysis,
            enhanced: !!enhancementMetadata,
            metadata: enrichedMetadata,
          }
        };
      }
      return uploadResult; // Return the raw upload result if it failed
      
    } catch (error) {
      console.error('Error in auto-enhancement upload:', error);
      
      // If enhancement fails completely, try with original image
      console.log('🔄 Enhancement failed, attempting upload with original image...');
      try {
        const fallbackResult = await this.uploadImage(imageBuffer, fileName, options.title);
        return {
          ...fallbackResult,
          autoEnhanced: false,
          enhancementSource: 'failed',
          enhancementError: error.message,
          qualityEnhancement: {
            enhanced: false,
            error: error.message,
            automatic: true
          }
        };
      } catch (fallbackError) {
        throw new Error('Failed to upload image even with fallback: ' + fallbackError.message);
      }
    }
  }
  
  // Keep the original method for manual enhancement (legacy support)
  async uploadImageWithQualityEnhancement(imageBuffer, fileName, options = {}) {
    return this.uploadImageWithAutoEnhancement(imageBuffer, fileName, options);
  }
  
  /**
   * Create product with enhanced image quality
   * @param {Object} productData - Product configuration
   * @returns {Object} Created product with enhancement details
   */
  async createEnhancedProduct(productData) {
    try {
      const {
        imageBuffer,
        fileName,
        blueprintId,
        printProviderId,
        title,
        description,
        basePrice = 2099,
        userId,
        originalImageId,
        upscaleOptions = {}
      } = productData;
      
      // Upload image with quality enhancement
      const imageUploadResult = await this.uploadImageWithQualityEnhancement(
        imageBuffer,
        fileName,
        {
          userId,
          originalImageId,
          title,
          ...upscaleOptions
        }
      );
      
      if (!imageUploadResult.success) {
        throw new Error('Failed to upload enhanced image: ' + imageUploadResult.error);
      }
      
      // Create product using base class method with enhanced image
      const productResult = await this.createCustomProductWithBlueprint(
        imageUploadResult.imageId,
        {
          title,
          description,
          blueprintId,
          printProviderId,
          basePrice
        }
      );
      
      if (!productResult.success) {
        throw new Error('Failed to create product: ' + productResult.error);
      }
      
      console.log('🎯 Enhanced product created successfully:', productResult.productId);
      
      return {
        success: true,
        product: productResult,
        imageEnhancement: imageUploadResult.qualityEnhancement,
        printQualityOptimized: imageUploadResult.qualityEnhancement.enhanced
      };
      
    } catch (error) {
      console.error('Error creating enhanced product:', error);
      return {
        success: false,
        error: error.message || 'Failed to create enhanced product'
      };
    }
  }
  
  /**
   * Batch create products with quality enhancement for multiple product types
   * @param {Object} batchData - Batch creation configuration
   * @returns {Object} Batch creation results
   */
  async createEnhancedProductBatch(batchData) {
    try {
      const {
        imageBuffer,
        fileName,
        productTypes, // Array of { blueprintId, printProviderId, title, description }
        baseTitle,
        userId,
        originalImageId,
        upscaleOptions = {}
      } = batchData;
      
      console.log('🚀 Starting batch product creation with enhancement...');
      
      // Upload image once with enhancement
      const imageUploadResult = await this.uploadImageWithQualityEnhancement(
        imageBuffer,
        fileName,
        {
          userId,
          originalImageId,
          title: baseTitle,
          ...upscaleOptions
        }
      );
      
      if (!imageUploadResult.success) {
        throw new Error('Failed to upload enhanced image: ' + imageUploadResult.error);
      }
      
      // Create products for each type
      const productResults = [];
      
      for (const productType of productTypes) {
        try {
          console.log(`📦 Creating ${productType.title}...`);
          
          const productResult = await this.createCustomProductWithBlueprint(
            imageUploadResult.imageId,
            {
              title: productType.title,
              description: productType.description,
              blueprintId: productType.blueprintId,
              printProviderId: productType.printProviderId,
              basePrice: productType.basePrice || 2099
            }
          );
          
          productResults.push({
            productType: productType.title,
            success: productResult.success,
            productId: productResult.productId,
            error: productResult.error
          });
          
        } catch (error) {
          console.error(`Error creating ${productType.title}:`, error);
          productResults.push({
            productType: productType.title,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = productResults.filter(r => r.success).length;
      console.log(`✅ Batch creation completed: ${successCount}/${productTypes.length} products created`);
      
      return {
        success: true,
        imageEnhancement: imageUploadResult.qualityEnhancement,
        productResults,
        successCount,
        totalCount: productTypes.length
      };
      
    } catch (error) {
      console.error('Error in batch product creation:', error);
      return {
        success: false,
        error: error.message || 'Failed to create product batch'
      };
    }
  }
  
  /**
   * Get quality recommendations for image
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Object} Quality recommendations
   */
  async getQualityRecommendations(imageBuffer) {
    try {
      const analysis = await this.upscalingService.analyzeImageQuality(imageBuffer);
      
      const recommendations = {
        printSuitability: analysis.suitableForPrint ? 'excellent' : 'needs-enhancement',
        recommendations: [],
        estimatedPrintQuality: 'unknown'
      };
      
      if (!analysis.suitableForPrint) {
        if (analysis.recommendedAction === 'upscale') {
          recommendations.recommendations.push({
            type: 'upscale',
            priority: 'high',
            description: 'Image resolution too low for high-quality printing. AI upscaling recommended.',
            benefit: 'Significantly improved print quality and detail sharpness'
          });
        }
        
        if (analysis.estimatedDPI < 200) {
          recommendations.recommendations.push({
            type: 'dpi-enhancement',
            priority: 'medium',
            description: 'Low DPI detected. Enhancement will improve print clarity.',
            benefit: 'Sharper text and cleaner edges in printed output'
          });
        }
        
        recommendations.estimatedPrintQuality = analysis.estimatedDPI < 150 ? 'poor' : 'fair';
      } else {
        recommendations.estimatedPrintQuality = 'excellent';
        recommendations.recommendations.push({
          type: 'optimization',
          priority: 'low',
          description: 'Image quality is already suitable for printing. Optional enhancement available.',
          benefit: 'Minor improvements in detail and color vibrancy'
        });
      }
      
      return {
        success: true,
        analysis,
        recommendations
      };
      
    } catch (error) {
      console.error('Error getting quality recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Preview enhancement without uploading
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} options - Enhancement options
   * @returns {Object} Enhancement preview
   */
  async previewEnhancement(imageBuffer, options = {}) {
    try {
      const analysis = await this.upscalingService.analyzeImageQuality(imageBuffer);
      
      if (analysis.suitableForPrint) {
        return {
          success: true,
          enhancementNeeded: false,
          analysis,
          message: 'Image is already suitable for high-quality printing'
        };
      }
      
      // Simulate enhancement without actually processing
      const enhancementPreview = {
        currentDimensions: `${analysis.originalWidth}x${analysis.originalHeight}`,
        targetDimensions: analysis.targetDimensions ? 
          `${analysis.targetDimensions.width}x${analysis.targetDimensions.height}` : 'Auto',
        scaleFactor: analysis.targetDimensions?.scaleFactor || 'Auto',
        method: options.method || this.upscalingService.chooseUpscaleMethod(options.contentType || 'illustration'),
        estimatedSizeIncrease: analysis.targetDimensions ? 
          Math.round(analysis.targetDimensions.scaleFactor * analysis.targetDimensions.scaleFactor) : 'Auto',
        printQualityImprovement: analysis.estimatedDPI < 150 ? 'Significant' : 'Moderate'
      };
      
      return {
        success: true,
        enhancementNeeded: true,
        analysis,
        preview: enhancementPreview,
        recommendations: await this.getQualityRecommendations(imageBuffer)
      };
      
    } catch (error) {
      console.error('Error previewing enhancement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Detect content type for optimal upscaling method selection
   */
  detectContentType(fileName, options = {}) {
    if (options.character) return 'character';
    if (options.contentType) return options.contentType;
    
    // Analyze filename for hints
    const name = fileName.toLowerCase();
    if (name.includes('photo') || name.includes('portrait')) return 'photo';
    if (name.includes('art') || name.includes('draw') || name.includes('paint')) return 'artwork';
    if (name.includes('character') || name.includes('avatar')) return 'character';
    
    return 'illustration'; // default
  }
  
  /**
   * Preview enhancement results without uploading to Printify
   * Generates enhanced image and returns comparison data
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} fileName - Original filename
   * @param {Object} options - Enhancement options
   * @returns {Object} Preview result with original and enhanced image info
   */
  async previewEnhancement(imageBuffer, fileName, options = {}) {
    try {
      console.log('🔍 Creating enhancement preview for:', fileName);
      
      // Analyze the original image
      const analysis = await this.upscalingService.analyzeImageQuality(imageBuffer);
      
      // If already suitable, return original with note
      if (analysis.suitableForPrint) {
        const originalDimensions = await this.getImageDimensions(imageBuffer);
        return {
          originalImageSuitable: true,
          originalDimensions,
          enhancedDimensions: originalDimensions,
          enhancedImageUrl: options.originalUrl || '', // Use original
          enhancementMethod: 'Not needed',
          improvementDescription: 'Image quality is already suitable for printing'
        };
      }
      
      // Generate enhanced version
      console.log('🎨 Generating enhanced version for preview...');
      const enhancementResult = await this.upscalingService.upscaleImage(
        imageBuffer,
        // Pass fileName in the options object
        {
          targetDimensions: analysis.targetDimensions,
          fileName: fileName, // Pass the fileName for content type detection
          contentType: this.detectContentType(fileName),
          originalImageId: options.originalImageId, // Pass originalImageId for storage key
          ...options
        }
      );
      
      console.log('🔍 Enhancement result:', {
        success: enhancementResult.success,
        error: enhancementResult.error,
        hasPrintOptimized: !!enhancementResult.printOptimized,
        hasUpscaledBuffer: !!enhancementResult.upscaledBuffer,
        hasMetadata: !!enhancementResult.metadata
      });
      
      if (!enhancementResult.success) {
        throw new Error(enhancementResult.error || 'Enhancement failed');
      }
      
      // Validate enhancement result has a buffer
      const enhancedBuffer = enhancementResult.printOptimized || enhancementResult.upscaledBuffer;
      console.log('🔍 Buffer validation:', {
        printOptimized: !!enhancementResult.printOptimized,
        upscaledBuffer: !!enhancementResult.upscaledBuffer,
        enhancedBuffer: !!enhancedBuffer,
        isBuffer: Buffer.isBuffer(enhancedBuffer),
        bufferLength: enhancedBuffer?.length
      });
      
      if (!enhancedBuffer || !Buffer.isBuffer(enhancedBuffer)) {
        throw new Error('Enhancement result missing valid image buffer');
      }
      
      // Store the enhanced image in S3 to get a URL
      const storeResult = await this.upscalingService.storeUpscaledImage(
        options.userId || 'preview-user',
        options.originalImageId || 'preview-image',
        enhancedBuffer,
        enhancementResult.metadata
      );

      if (!storeResult || !storeResult.url) {
        throw new Error('Failed to store enhanced image in S3');
      }

      const originalDimensions = await this.getImageDimensions(imageBuffer);
      const enhancedDimensions = await this.getImageDimensions(enhancedBuffer);
      
      return {
        originalImageSuitable: false,
        originalDimensions,
        enhancedDimensions,
        s3Key: storeResult.s3Key, // Return the S3 key
        enhancedImageUrl: storeResult.url,
        enhancementMethod: enhancementResult.metadata?.method || 'AI Upscaling',
        improvementDescription: `Enhanced from ${originalDimensions.width}×${originalDimensions.height} to ${enhancedDimensions.width}×${enhancedDimensions.height}`,
        scaleFactor: Math.round((enhancedDimensions.width / originalDimensions.width) * 10) / 10
      };
      
    } catch (error) {
      console.error('Enhancement preview failed:', error);
      throw new Error('Failed to generate enhancement preview: ' + error.message);
    }
  }
  
  /**
   * Get image dimensions from buffer
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Object} Dimensions {width, height}
   */
  async getImageDimensions(imageBuffer) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }
  
  /**
   * Download image buffer from URL (for cached upscaled images)
   */
  async downloadImageBuffer(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image buffer:', error);
      throw new Error('Failed to download image from URL');
    }
  }
  /**
   * Create product with specific blueprint configuration
   */
  async createProductWithBlueprint(imageBuffer, fileName, blueprintId, options = {}) {
    try {
      // RUNTIME VALIDATION: Method entry point validation
      console.log('🔍 PARAMETER VALIDATION: createProductWithBlueprint called with parameters');
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        const error = new Error('Invalid imageBuffer: must be a Buffer object');
        console.error('🚨 ENTRY VALIDATION FAILED:', error.message);
        throw error;
      }
      if (!fileName || typeof fileName !== 'string') {
        const error = new Error('Invalid fileName: must be a non-empty string');
        console.error('🚨 ENTRY VALIDATION FAILED:', error.message);
        throw error;
      }
      if (!blueprintId || (typeof blueprintId !== 'number' && typeof blueprintId !== 'string')) {
        const error = new Error('Invalid blueprintId: must be a number or string');
        console.error('🚨 ENTRY VALIDATION FAILED:', error.message);
        throw error;
      }
      console.log(`   Image Buffer: ${imageBuffer.length} bytes`);
      console.log(`   File Name: ${fileName}`);
      console.log(`   Blueprint ID: ${blueprintId}`);
      console.log(`   Options: ${Object.keys(options).length} properties`);
      
      const {
        title = `Custom Product - ${fileName}`,
        description = 'Custom product created with enhanced image',
        tags = ['custom', 'enhanced'],
        providerId,
        basePrice = 2099,
        runId
      } = options;

      console.log(`🔨 Creating product with blueprint ${blueprintId}...`);
      
      // Use the existing createEnhancedProduct method
      const productData = {
        imageBuffer,
        fileName,
        blueprintId,
        printProviderId: providerId,
        title,
        description,
        basePrice,
        userId: 'admin-preview-generator',
        originalImageId: `blueprint-${blueprintId}-${Date.now()}`,
        upscaleOptions: {
          forceAnalysis: false,
          printOptimized: true,
          runId
        }
      };

      const result = await this.createEnhancedProduct(productData);
      
      console.log(`   ${result.success ? '✅' : '❌'} Blueprint ${blueprintId} product creation ${result.success ? 'successful' : 'failed'}`);
      
      return {
        ...result,
        blueprintId,
        providerId,
        metadata: {
          blueprintId,
          providerId,
          fileName,
          title,
          runId,
          createdAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ Error creating product with blueprint ${blueprintId}:`, error.message);
      return {
        success: false,
        error: error.message,
        blueprintId,
        fileName
      };
    }
  }

  async deleteProduct(productId) {
    console.log(`🗑️ Deleting product from Printify: ${productId}`);
    
    try {
      await this.api.delete(`/shops/${this.shopId}/products/${productId}.json`);
      console.log(`✅ Product ${productId} deleted from Printify`);
      return { success: true, productId };
    } catch (error) {
      console.error(`❌ Failed to delete product ${productId}:`, error.message);
      throw error;
    }
  }

  /**
   * Test blueprint-provider compatibility by fetching variants
   * This is the most reliable way to test if a combination works
   */
  async getBlueprintVariants(blueprintId, providerId) {
    const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`;
    
    try {
      const response = await this.api.get(endpoint);
      return response.data.variants || response.data || [];
    } catch (error) {
      // Handle specific 404 errors for non-existent blueprints
      if (error.response?.status === 404) {
        return null; // Clearly indicates blueprint doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get detailed blueprint information
   */
  async getBlueprintDetails(blueprintId, providerId) {
    const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}.json`;
    const response = await this.api.get(endpoint);
    return response.data;
  }

  /**
   * Get all available print providers
   */
  async getAllPrintProviders() {
    const endpoint = '/catalog/print_providers.json';
    const response = await this.api.get(endpoint);
    return response.data;
  }

  /**
   * Test basic API connectivity
   */
  async testConnection() {
    try {
      const endpoint = `/shops/${this.shopId}.json`;
      const response = await this.api.get(endpoint);
      return {
        success: true,
        shopName: response.data.title,
        shopId: response.data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch validate multiple blueprint-provider combinations
   * with rate limiting and progress tracking
   */
  async batchValidateCombinations(combinations, options = {}) {
    const {
      batchSize = 10,
      delayMs = 500,
      onProgress = () => {},
      onBatchComplete = () => {}
    } = options;

    const results = [];
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < combinations.length; i += batchSize) {
      batches.push(combinations.slice(i, i + batchSize));
    }

    console.log(`🔄 Processing ${combinations.length} combinations in ${batches.length} batches`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchResults = [];

      for (const combo of batch) {
        try {
          const variants = await this.getBlueprintVariants(combo.blueprintId, combo.providerId);
          
          batchResults.push({
            blueprintId: combo.blueprintId,
            providerId: combo.providerId,
            success: variants !== null && variants.length > 0,
            variants: variants ? variants.length : 0,
            metadata: combo.metadata || {}
          });
          
          onProgress({
            current: results.length + batchResults.length,
            total: combinations.length,
            batch: batchIndex + 1,
            totalBatches: batches.length
          });

        } catch (error) {
          batchResults.push({
            blueprintId: combo.blueprintId,
            providerId: combo.providerId,
            success: false,
            error: error.message,
            statusCode: error.response?.status,
            metadata: combo.metadata || {}
          });
        }

        // Rate limiting within batch
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      results.push(...batchResults);
      onBatchComplete({
        batchIndex: batchIndex + 1,
        batchSize: batch.length,
        completed: results.length,
        total: combinations.length
      });

      // Longer delay between batches
      if (batchIndex < batches.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * 2));
      }
    }

    return results;
  }

  /**
   * Get comprehensive catalog summary
   */
  async getCatalogSummary() {
    try {
      const [providers, shipping] = await Promise.all([
        this.getAllPrintProviders(),
        this.api.get('/catalog/shipping.json').catch(() => ({ data: { profiles: [] } }))
      ]);

      return {
        providers: providers.print_providers || providers || [],
        shippingProfiles: shipping.data.profiles || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = EnhancedPrintifyService;