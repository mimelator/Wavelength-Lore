/**
 * Enhanced Printify Service with AI Upscaling Integration
 * 
 * Extends the base PrintifyService with intelligent image quality analysis
 * and automatic upscaling for optimal print merchandise quality
 */

const PrintifyService = require('./printify-service');
const ImageUpscalingService = require('./image-upscaling-service');

class EnhancedPrintifyService extends PrintifyService {
  constructor() {
    super();
    this.upscalingService = new ImageUpscalingService();
    
    // Import and initialize merchandise database for enhanced image associations
    const MerchandiseDatabase = require('./merchandise-database');
    this.merchandiseDatabase = new MerchandiseDatabase();
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
    try {
      console.log('🔍 Auto-analyzing image quality for print suitability...');
      
      // Step 1: Check if we already have an enhanced version stored in database
      let existingEnhanced = null;
      if (options.originalImageId) {
        try {
          existingEnhanced = await this.merchandiseDatabase.getEnhancedImage(options.originalImageId);
          
          if (existingEnhanced && existingEnhanced.enhancedImageUrl) {
            console.log(`♻️ Found existing enhanced version for ${options.originalImageId}, using cached image`);
            
            // Download the cached enhanced image
            const enhancedImageBuffer = await this.downloadImageBuffer(existingEnhanced.enhancedImageUrl);
            if (enhancedImageBuffer) {
              // Upload the cached enhanced image to Printify
              const uploadResult = await this.uploadImage(
                enhancedImageBuffer, 
                fileName, 
                options.title
              );
              
              return {
                ...uploadResult,
                autoEnhanced: true,
                enhancementSource: 'cached',
                qualityEnhancement: {
                  analysis: { suitableForPrint: true, enhanced: true },
                  enhanced: true,
                  metadata: { 
                    method: existingEnhanced.enhancementMethod || 'cached', 
                    cached: true,
                    scaleFactor: existingEnhanced.scaleFactor
                  },
                  originalSuitable: false,
                  existingEnhanced: existingEnhanced
                }
              };
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
          enhanceDetails: true,
          preserveStyle: true,
          contentType: this.detectContentType(fileName, options),
          character: options.character,
          style: options.style
        };
        
        try {
          const upscalingResult = await this.upscalingService.upscaleImage(imageBuffer, upscalingOptions);
          
          if (upscalingResult.success) {
            finalImageBuffer = upscalingResult.printOptimized || upscalingResult.upscaledBuffer;
            enhancementMetadata = upscalingResult.metadata;
            
            console.log('✨ Auto-enhancement successful:', {
              method: upscalingResult.method,
              originalSize: `${Math.round(upscalingResult.metadata.originalSize / 1024)}KB`,
              enhancedSize: `${Math.round(upscalingResult.metadata.upscaledSize / 1024)}KB`,
              scaleFactor: upscalingResult.metadata.scaleFactor
            });
            
            // Store enhanced image association in database for future use
            if (options.originalImageId && upscalingResult.url) {
              try {
                const enhancementData = {
                  enhancedImageUrl: upscalingResult.url,
                  enhancementMethod: upscalingResult.method || 'AI Upscaling',
                  originalDimensions: {
                    width: qualityAnalysis.originalWidth,
                    height: qualityAnalysis.originalHeight
                  },
                  enhancedDimensions: upscalingResult.metadata.dimensions || {
                    width: qualityAnalysis.originalWidth * (upscalingResult.metadata.scaleFactor || 2),
                    height: qualityAnalysis.originalHeight * (upscalingResult.metadata.scaleFactor || 2)
                  },
                  scaleFactor: upscalingResult.metadata.scaleFactor,
                  improvementDescription: `Enhanced from ${qualityAnalysis.originalWidth}×${qualityAnalysis.originalHeight} to higher resolution`
                };
                
                const storeResult = await this.merchandiseDatabase.storeEnhancedImage(options.originalImageId, enhancementData);
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
      const uploadResult = await this.uploadImage(finalImageBuffer, fileName, options.title);
      
      return {
        ...uploadResult,
        autoEnhanced,
        enhancementSource: autoEnhanced ? 'generated' : 'none',
        qualityEnhancement: {
          analysis: qualityAnalysis,
          enhanced: !!enhancementMetadata,
          metadata: enhancementMetadata,
          originalSuitable: qualityAnalysis.suitableForPrint,
          automatic: true
        }
      };
      
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
      const enhancementResult = await this.upscalingService.upscaleImage(
        imageBuffer,
        fileName,
        {
          targetDimensions: analysis.targetDimensions,
          contentType: this.detectContentType(fileName),
          ...options
        }
      );
      
      if (!enhancementResult.success) {
        throw new Error(enhancementResult.error || 'Enhancement failed');
      }
      
      // Store the enhanced image in S3 to get a URL
      const storeResult = await this.upscalingService.storeUpscaledImage(
        options.userId || 'preview-user',
        options.originalImageId || 'preview-image',
        enhancementResult.printOptimized,
        enhancementResult.metadata
      );

      if (!storeResult || !storeResult.url) {
        throw new Error('Failed to store enhanced image in S3');
      }

      const originalDimensions = await this.getImageDimensions(imageBuffer);
      const enhancedDimensions = await this.getImageDimensions(enhancementResult.printOptimized);
      
      return {
        originalImageSuitable: false,
        originalDimensions,
        enhancedDimensions,
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
}

module.exports = EnhancedPrintifyService;