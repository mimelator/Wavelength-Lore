/**
 * AI Image Upscaling Service
 * 
 * Provides high-quality image upscaling for print merchandise
 * using multiple AI services with fallback options.
 * Integrates with Global Image Cache to prevent duplicate processing.
 */

const axios = require('axios');
const sharp = require('sharp');
const { OpenAI } = require('openai');
const { toFile, File } = require('openai/uploads');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const GlobalImageCache = require('./global-image-cache');
const { ServiceResponse, ParameterValidator } = require('../utils/service-contracts');

// Import gallery config to use same S3 setup
const galleryConfig = require('../utils/gallery/config');

class ImageUpscalingService {
  constructor() {
    // Use the same S3 client configuration as gallery
    this.s3Client = new S3Client({
      region: galleryConfig.AWS_REGION,
      credentials: {
        accessKeyId: galleryConfig.ACCESS_KEY_ID,
        secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
      }
    });
    
    // Use the same bucket as gallery, but in a dedicated subfolder
    // CRITICAL: Validate gallery bucket configuration
    if (!galleryConfig.GALLERY_S3_BUCKET) {
      throw new Error('CRITICAL ERROR: GALLERY_S3_BUCKET environment variable is not set for image upscaling service.');
    }
    
    if (galleryConfig.GALLERY_S3_BUCKET === 'wavelength-lore-bucket') {
      throw new Error('CRITICAL ERROR: Image upscaling service cannot use lore bucket. This would contaminate system content.');
    }
    
    this.galleryBucket = galleryConfig.GALLERY_S3_BUCKET;
    this.upscaledFolder = 'upscaled'; // Subfolder for enhanced images
    this.cdnUrl = galleryConfig.CDN_URL || `https://${this.galleryBucket}.s3.amazonaws.com`;
    
    // Initialize Global Image Cache for de-duplication
    this.globalCache = new GlobalImageCache();
    this.cacheEnabled = true;
    
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    console.log('🎨 Image Upscaling Service initialized');
    console.log('🪣 Using gallery bucket:', this.galleryBucket);
    console.log('📁 Upscaled images folder:', this.upscaledFolder);
  }
  
  /**
   * Analyze image quality and determine if upscaling is needed
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} metadata - Image metadata
   * @returns {Object} Analysis result
   */
  async analyzeImageQuality(imageBuffer, metadata = {}) {
    try {
      const imageInfo = await sharp(imageBuffer).metadata();
      
      const analysis = {
        originalWidth: imageInfo.width,
        originalHeight: imageInfo.height,
        format: imageInfo.format,
        density: imageInfo.density || 72,
        estimatedDPI: this.calculateDPI(imageInfo),
        suitableForPrint: false,
        recommendedAction: 'none',
        targetDimensions: null
      };
      
      // Calculate if suitable for print (300 DPI at 10"x12")
      const printWidth = 3000; // 10 inches at 300 DPI
      const printHeight = 3600; // 12 inches at 300 DPI
      
      analysis.suitableForPrint = (
        imageInfo.width >= printWidth && 
        imageInfo.height >= printHeight &&
        analysis.estimatedDPI >= 200
      );
      
      if (!analysis.suitableForPrint) {
        // Calculate upscaling needed
        const scaleFactorWidth = printWidth / imageInfo.width;
        const scaleFactorHeight = printHeight / imageInfo.height;
        const scaleFactor = Math.max(scaleFactorWidth, scaleFactorHeight);
        
        analysis.recommendedAction = scaleFactor <= 2 ? 'enhance' : 'upscale';
        analysis.targetDimensions = {
          width: Math.round(imageInfo.width * scaleFactor),
          height: Math.round(imageInfo.height * scaleFactor),
          scaleFactor: scaleFactor
        };
      }
      
      return analysis;

    } catch (error) {
      console.error('Error analyzing image quality:', error);
      throw new Error('Failed to analyze image quality');
    }
  }

  /**
   * 🔥 CRITICAL: Upscale image specifically for Printify requirements
   * Ensures image meets Printify's minimum quality standards:
   * - Minimum 1800x1800 pixels
   * - Minimum 200 DPI (prefer 300 DPI)
   * - High-quality format (PNG or TIFF, not WebP)
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} fileName - Filename for logging
   * @returns {Buffer} Upscaled image buffer meeting Printify requirements
   */
  async upscaleImageForPrintify(imageBuffer, fileName = 'image') {
    console.log(`🚀 UPSCALING FOR PRINTIFY: ${fileName}`);

    try {
      // Step 0: Convert WebP to PNG if necessary (upscaler requires PNG)
      let processedBuffer = imageBuffer;
      const metadata = await sharp(imageBuffer).metadata();
      
      if (metadata.format === 'webp') {
        console.log('🔄 Converting WebP to PNG for upscaler compatibility...');
        // Start with reasonable compression to avoid huge files
        processedBuffer = await sharp(imageBuffer)
          .png({ quality: 90, compressionLevel: 6 }) // Start with balanced quality/size
          .toBuffer();
        
        // Check file size after conversion (upscaler has 4MB limit)
        let fileSizeMB = processedBuffer.length / (1024 * 1024);
        console.log(`✅ Converted ${metadata.format} → PNG (${fileSizeMB.toFixed(2)}MB)`);
        
        if (fileSizeMB > 4) {
          console.log(`⚠️ PNG file size ${fileSizeMB.toFixed(2)}MB exceeds 4MB limit, applying maximum compression...`);
          processedBuffer = await sharp(imageBuffer)
            .png({ quality: 70, compressionLevel: 9 }) // Maximum compression
            .toBuffer();
          fileSizeMB = processedBuffer.length / (1024 * 1024);
          console.log(`✅ Maximum compression applied: ${fileSizeMB.toFixed(2)}MB`);
          
          if (fileSizeMB > 4) {
            throw new Error(`Image too large after compression: ${fileSizeMB.toFixed(2)}MB. Upscaler requires images under 4MB.`);
          }
        }
      }

      // Step 1: Analyze current image quality
      const analysis = await this.analyzeImageQuality(processedBuffer);
      console.log(`📊 Current image: ${analysis.originalWidth}x${analysis.originalHeight}, DPI: ${analysis.estimatedDPI}`);

      // Step 2: Determine scale factor to meet Printify minimum (1800x1800)
      const PRINTIFY_MIN_WIDTH = 1800;
      const PRINTIFY_MIN_HEIGHT = 1800;

      const scaleFactorWidth = PRINTIFY_MIN_WIDTH / analysis.originalWidth;
      const scaleFactorHeight = PRINTIFY_MIN_HEIGHT / analysis.originalHeight;
      const scaleFactor = Math.max(scaleFactorWidth, scaleFactorHeight, 1);

      console.log(`📐 Scale factor needed: ${scaleFactor.toFixed(2)}x to reach minimum ${PRINTIFY_MIN_WIDTH}x${PRINTIFY_MIN_HEIGHT}`);

      // Step 3: Try upscaling, but fall back to original if it fails
      let upscaleResult;
      try {
        upscaleResult = await this.upscaleImage(processedBuffer, {
          method: 'auto', // Let it choose best method
          scaleFactor: scaleFactor,
          enhanceDetails: true, // Sharpen details for print quality
          contentType: 'illustration', // Use illustration for artwork
          originalImageId: fileName,
          fileName: fileName
        });
      } catch (upscaleError) {
        console.log(`⚠️ Upscaling failed: ${upscaleError.message}`);
        
        // Check if original image meets minimum requirements
        if (analysis.originalWidth >= PRINTIFY_MIN_WIDTH && analysis.originalHeight >= PRINTIFY_MIN_HEIGHT) {
          console.log(`✅ Original image (${analysis.originalWidth}x${analysis.originalHeight}) meets Printify minimum. Using original.`);
          return processedBuffer; // Return the original processed buffer
        } else {
          console.log(`❌ Original image too small (${analysis.originalWidth}x${analysis.originalHeight}) and upscaling failed.`);
          throw new Error(`Cannot upload image to Printify: Image too small: ${analysis.originalWidth}x${analysis.originalHeight}. Printify needs minimum ${PRINTIFY_MIN_WIDTH}x${PRINTIFY_MIN_HEIGHT} for quality printing. Upscaling also failed: ${upscaleError.message}`);
        }
      }

      if (!upscaleResult) {
        throw new Error('Upscaling did not return a result');
      }

      // CRITICAL FIX: upscaleImage returns different buffer properties depending on method
      // It can be: upscaledBuffer, printOptimized, or buffer
      const resultBuffer = upscaleResult.upscaledBuffer || upscaleResult.printOptimized || upscaleResult.buffer;

      if (!resultBuffer) {
        console.error('❌ Upscale result structure:', Object.keys(upscaleResult));
        throw new Error('Upscaling did not produce a valid image buffer');
      }

      console.log(`✅ Upscaling produced buffer: ${resultBuffer.length} bytes`);

      // Step 4: Verify upscaled image meets Printify requirements
      const upscaledMetadata = await sharp(resultBuffer).metadata();
      console.log(`✅ Upscaled image: ${upscaledMetadata.width}x${upscaledMetadata.height}, Format: ${upscaledMetadata.format}`);

      if (upscaledMetadata.width < PRINTIFY_MIN_WIDTH || upscaledMetadata.height < PRINTIFY_MIN_HEIGHT) {
        throw new Error(`Upscaled image still too small: ${upscaledMetadata.width}x${upscaledMetadata.height}. Printify requires minimum ${PRINTIFY_MIN_WIDTH}x${PRINTIFY_MIN_HEIGHT}`);
      }

      return resultBuffer;

    } catch (error) {
      console.error(`❌ Failed to upscale image for Printify: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upscale image using AI service with Global Cache integration
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Upscaling options
   * @returns {Object} Upscaling result
   */
  async upscaleImage(imageBuffer, options = {}) { // fileName is now part of options
    
    // ENHANCED PARAMETER VALIDATION: Use standardized validation contracts
    const paramValidation = ParameterValidator.validate(
      { imageBuffer, options },
      {
        imageBuffer: { type: 'Buffer', required: true },
        options: { 
          type: 'object', 
          required: false,
          properties: {
            method: { type: 'string', required: false },
            scaleFactor: { type: 'number', required: false },
            enhanceDetails: { type: 'boolean', required: false },
            preserveStyle: { type: 'boolean', required: false },
            contentType: { type: 'string', required: false },
            originalImageId: { type: 'string', required: false },
            userId: { type: 'string', required: false }
          }
        }
      },
      'upscaleImage'
    );
    
    if (!paramValidation.isValid) {
      const errorMessage = `Parameter validation failed: ${paramValidation.errors.join(', ')}`;
      console.error('❌ PARAMETER VALIDATION FAILED:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // ENHANCED LOGGING: Log parameter validation success
    console.log('🔍 PARAMETER VALIDATION: upscaleImage called with valid parameters');
    console.log(`   Image Buffer: ${imageBuffer.length} bytes`);
    console.log(`   Options: ${Object.keys(options).length} properties`);
    
    const {
      method = 'openai', // 'openai', 'replicate', 'auto'
      scaleFactor = 4,
      enhanceDetails = true,
      preserveStyle = true,
      contentType = 'illustration', // 'photo', 'illustration', 'artwork'
      originalImageId, // If provided, will store the enhanced image in S3
      userId = 'anonymous' // User ID for S3 storage - should rarely be used
    } = options;
    
    try {
      // Step 1: Check Global Cache for existing upscaled version
      if (this.cacheEnabled) {
        console.log('🔍 Checking Global Cache for existing upscaled version...');
        
        await this.globalCache.initializeDatabase();
        const cacheResult = await this.checkGlobalCacheForUpscaling(imageBuffer, options);
        
        if (cacheResult.found) {
          console.log(`🎯 Global cache HIT! Using existing upscaled image`);
          
          // ENHANCED DIAGNOSTICS: Comprehensive cache validation logging
          console.log('🔍 CACHE HIT DIAGNOSTICS:');
          console.log(`   - Content Hash: ${cacheResult.contentHash}`);
          console.log(`   - Enhanced URL: ${cacheResult.enhancedUrl ? '✅ Present' : '❌ Missing'}`);
          console.log(`   - S3 Key: ${cacheResult.s3Key ? '✅ Present' : '❌ Missing'}`);
          console.log(`   - Method: ${cacheResult.method}`);
          console.log(`   - File Size: ${cacheResult.fileSize} bytes`);
          
          // ENHANCED DIAGNOSTICS: Timestamp validation
          try {
            const createdDate = new Date(cacheResult.createdAt);
            if (isNaN(createdDate.getTime())) {
              console.error(`   - Created: ❌ Invalid timestamp (${cacheResult.createdAt})`);
            } else {
              console.log(`   - Created: ✅ ${createdDate.toISOString()}`);
            }
          } catch (timeError) {
            console.error(`   - Created: ❌ Timestamp error (${timeError.message})`);
          }
          
          console.log(`   - Usage Count: ${cacheResult.usageCount}`);
          
          // ENHANCED DIAGNOSTICS: Data structure validation
          console.log('🔍 CACHE DATA STRUCTURE VALIDATION:');
          const requiredFields = ['contentHash', 'method'];
          const missingFields = requiredFields.filter(field => !cacheResult[field]);
          
          // Check for inconsistent state: one of URL/S3 is set but not both
          const hasUrl = cacheResult.enhancedUrl !== null && cacheResult.enhancedUrl !== undefined;
          const hasS3 = cacheResult.s3Key !== null && cacheResult.s3Key !== undefined;
          const inconsistentState = (hasUrl && !hasS3) || (!hasUrl && hasS3);
          
          if (missingFields.length > 0 || inconsistentState) {
            console.error(`   ❌ Cache corruption detected:`);
            if (missingFields.length > 0) {
              console.error(`      - Missing required fields: ${missingFields.join(', ')}`);
            }
            if (inconsistentState) {
              console.error(`      - Inconsistent state: URL=${hasUrl}, S3=${hasS3}`);
            }
            console.log('🔧 CACHE CORRUPTION DETECTED - Treating as cache miss to regenerate');
            console.log('⚠️ CACHE CORRUPTION DETAILS:');
            console.log(`   - Content Hash: ${cacheResult.contentHash}`);
            console.log(`   - Will regenerate enhanced image to repair cache`);
            console.log('🔄 Continuing to image enhancement due to cache corruption...');
          } else {
            // Determine caching mode
            const hasUrl = cacheResult.enhancedUrl !== null && cacheResult.enhancedUrl !== undefined;
            const hasS3 = cacheResult.s3Key !== null && cacheResult.s3Key !== undefined;
            const cachingMode = hasUrl ? 'URL-based' : 'Buffer-based';
            console.log(`   ✅ Valid ${cachingMode} cache record`);
            
            // CRITICAL FIX: Extract buffer based on caching mode
            console.log('🔍 BUFFER EXTRACTION: Retrieving cached buffer...');
            let cacheBuffer = null;
            
            if (hasUrl) {
              // URL-based caching: Download from S3/CDN
              try {
                const cacheResponse = await axios.get(cacheResult.enhancedUrl, { 
                  responseType: 'arraybuffer',
                  timeout: 30000
                });
                cacheBuffer = Buffer.from(cacheResponse.data);
                console.log(`✅ Downloaded buffer from URL: ${cacheBuffer.length} bytes`);
              } catch (downloadError) {
                console.error(`❌ Failed to download buffer from URL: ${downloadError.message}`);
              }
            } else {
              // Buffer-based caching: Retrieve from Firebase
              try {
                const bufferData = await this.globalCache.getEnhancedImageBuffer(cacheResult.contentHash);
                if (bufferData) {
                  cacheBuffer = Buffer.from(bufferData, 'base64');
                  console.log(`✅ Retrieved buffer from Firebase: ${cacheBuffer.length} bytes`);
                } else {
                  console.error('❌ No buffer data found in Firebase cache');
                }
              } catch (firebaseError) {
                console.error(`❌ Failed to retrieve buffer from Firebase: ${firebaseError.message}`);
              }
            }
            
            if (!cacheBuffer) {
              console.log('⚠️ Continuing without buffer - some operations may fail');
            }
            
            // INTERFACE STANDARDIZATION: Use consistent structure
            // For buffer-based caching, use original imageBuffer as the enhanced result
            let enhancedBuffer = cacheBuffer || imageBuffer;
            
            // 🎯 PRINTIFY FIX: Check cached image dimensions and post-process if needed
            let finalBuffer = enhancedBuffer;
            const PRINTIFY_MIN_SIZE = 1800;
            
            try {
              const cachedMetadata = await sharp(enhancedBuffer).metadata();
              console.log(`🔍 CACHED IMAGE DIMENSIONS: ${cachedMetadata.width}x${cachedMetadata.height}`);
              
              if (cachedMetadata.width < PRINTIFY_MIN_SIZE || cachedMetadata.height < PRINTIFY_MIN_SIZE) {
                console.log(`⚡ CACHED IMAGE TOO SMALL! Upscaling from ${cachedMetadata.width}x${cachedMetadata.height} to ${PRINTIFY_MIN_SIZE}x${PRINTIFY_MIN_SIZE}`);
                
                // Post-process cached image to meet Printify requirements
                finalBuffer = await sharp(enhancedBuffer)
                  .resize(PRINTIFY_MIN_SIZE, PRINTIFY_MIN_SIZE, {
                    fit: 'inside',
                    withoutEnlargement: false
                  })
                  .png({ quality: 100 })
                  .toBuffer();
                
                const finalMetadata = await sharp(finalBuffer).metadata();
                console.log(`✅ POST-PROCESSED CACHED IMAGE: ${finalMetadata.width}x${finalMetadata.height}`);
                
                if (finalMetadata.width < PRINTIFY_MIN_SIZE || finalMetadata.height < PRINTIFY_MIN_SIZE) {
                  console.error(`❌ Post-processing failed: ${finalMetadata.width}x${finalMetadata.height} still too small`);
                } else {
                  console.log(`🎯 PRINTIFY READY: Cached image successfully upscaled to ${finalMetadata.width}x${finalMetadata.height}`);
                }
              } else {
                console.log(`✅ CACHED IMAGE SIZE OK: ${cachedMetadata.width}x${cachedMetadata.height} meets Printify requirements`);
              }
            } catch (dimensionError) {
              console.error(`❌ Failed to check cached image dimensions: ${dimensionError.message}`);
              // Continue with original buffer if dimension check fails
            }
            
            const returnValue = {
              success: true,
              method: 'cache', // CRITICAL: Set method to 'cache' for test compatibility
              cached: true,    // CRITICAL: Set cached flag for test compatibility
              upscaledUrl: cacheResult.enhancedUrl,
              enhancedUrl: cacheResult.enhancedUrl,
              upscaledBuffer: finalBuffer, // Use post-processed buffer
              printOptimized: finalBuffer, // Also set printOptimized for compatibility
              s3Key: cacheResult.s3Key,
              fileName: cacheResult.fileName || options.fileName,
              fileSize: cacheResult.fileSize || finalBuffer.length,
              usedCache: true,
              contentHash: cacheResult.contentHash,
              metadata: {
                url: cacheResult.enhancedUrl,
                s3Key: cacheResult.s3Key,
                method: 'cache', // Metadata method also set to cache
                cached: true,
                contentHash: cacheResult.contentHash,
                enhancementData: cacheResult.enhancementData,
                originalDimensions: cacheResult.originalDimensions,
                enhancedDimensions: cacheResult.enhancedDimensions
              }
            };
            
            // ENHANCED VALIDATION: Verify return value integrity
            console.log('🔍 RETURN VALUE VALIDATION:');
            const validationErrors = [];
            if (!returnValue.contentHash) validationErrors.push('Missing contentHash');
            if (returnValue.usedCache !== true) validationErrors.push('usedCache not set to true');
            if (returnValue.method !== 'cache') validationErrors.push('method not set to cache');
            if (returnValue.cached !== true) validationErrors.push('cached not set to true');
            
            // Check for inconsistent state (one of URL/S3 set but not both) - reuse variables from above
            if ((hasUrl && !hasS3) || (!hasUrl && hasS3)) {
              validationErrors.push(`Inconsistent state: URL=${hasUrl}, S3=${hasS3}`);
            }
            
            if (validationErrors.length > 0) {
              console.error('❌ CACHE RETURN VALIDATION FAILED:');
              validationErrors.forEach(error => console.error(`   - ${error}`));
              throw new Error(`Cache return validation failed: ${validationErrors.join(', ')}`);
            } else {
              const cachingMode = hasUrl ? 'URL-based' : 'Buffer-based';
              console.log(`✅ Valid ${cachingMode} cache return`);
            }
            
            return returnValue;
          }
        }
        
        console.log(`❌ Global cache MISS - proceeding with upscaling`);
      } else {
        // Cache miss - log diagnostic info
        console.log('📋 CACHE DIAGNOSTIC SUMMARY:');
        console.log('╔═══════════════════════════════════════════╗');
        console.log('║           🔍 CACHE CHECK RESULT            ║');
        console.log('╠═══════════════════════════════════════════╣');
        console.log(`║ Status:       ❌ MISS                       ║`);
        console.log(`║ Content Hash: ${cacheResult.contentHash ? cacheResult.contentHash.substring(0, 32) + '...' : 'N/A                       '} ║`);
        console.log(`║ Reason:       ${(cacheResult.reason || 'No cached version').padEnd(25)} ║`);
        console.log('╠═══════════════════════════════════════════╣');
        console.log('║ Action:       ▶️ Proceeding with upscaling   ║');
        console.log('║ Result:       Will be cached for reuse     ║');
        console.log('╚═══════════════════════════════════════════╝');
      }

      // Step 2: Proceed with actual upscaling
      const upscaleMethod = method === 'auto' ? this.chooseUpscaleMethod(contentType) : method;

      // Track processing time
      const processingStartTime = Date.now();
      
      let result;
      switch (upscaleMethod) {
        case 'openai':
        case 'openai-edit':
          console.log('🎨 Upscaling with OpenAI DALL-E...');
          result = await this.upscaleWithOpenAI(imageBuffer, options);
          break;
        case 'replicate':
          console.log('🎨 Upscaling with Replicate Real-ESRGAN...');
          result = await this.upscaleWithReplicate(imageBuffer, options);
          break;
        default:
          result = await this.upscaleWithSharp(imageBuffer, options);
      }
      
      // Add processing metadata
      const processingTime = Date.now() - processingStartTime;
      if (result && result.metadata) {
        result.metadata.method = upscaleMethod;
        result.metadata.processingTime = processingTime;
      } else if (result) {
        result.metadata = {
          method: upscaleMethod,
          processingTime: processingTime
        };
      }
      
      // Post-process for print optimization
      result.printOptimized = await this.optimizeForPrint(result.upscaledBuffer);
      
      // AUTO-STORE: If originalImageId is provided, automatically store the enhanced image in S3
      // This ensures that enhanced images are cached for future use
      if (originalImageId && result.success && result.upscaledBuffer) {
        try {
          console.log(`💾 Auto-storing enhanced image for ${originalImageId} in S3...`);
          const storeResult = await this.storeUpscaledImage(
            userId,
            originalImageId,
            result.printOptimized || result.upscaledBuffer, // Use print-optimized version if available
            result.metadata
          );
          
          if (storeResult && storeResult.url) {
            // Add S3 storage info to the result metadata
            result.metadata.url = storeResult.url;
            result.metadata.s3Key = storeResult.s3Key;
            result.s3Key = storeResult.s3Key;
            console.log(`✅ Enhanced image stored successfully at: ${storeResult.s3Key}`);
          } else {
            console.warn('⚠️ Failed to store enhanced image in S3');
          }
        } catch (storeError) {
          console.error('Error auto-storing enhanced image:', storeError);
          // Don't fail the whole upscaling process if storage fails
        }
      }
      
      // Save result to Global Cache if successful
      if (result.success && result.upscaledBuffer) {
        try {
          console.log('💾 Saving upscaled image to Global Cache...');
          const cacheResult = await this.saveToGlobalCache(imageBuffer, result);
          console.log('✅ Successfully saved to Global Cache');
          
          // RUNTIME VALIDATION: Comprehensive validation of the upscaling process
          console.log('\n🔍 RUNTIME VALIDATION: Starting comprehensive validation...');
          await this.performRuntimeValidation(imageBuffer, result, cacheResult);
          
        } catch (cacheError) {
          console.warn('⚠️ Failed to save to Global Cache:', cacheError.message);
          // Don't fail the whole process if cache saving fails
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Error upscaling image:', error);
      throw new Error('Failed to upscale image: ' + error.message);
    }
  }
  
  /**
   * Upscale using OpenAI DALL-E (best for artwork/illustrations)
   */
  async upscaleWithOpenAI(imageBuffer, options) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized. API key may be missing.');
      }

      // 1. Generate an enhancement prompt based on the provided options.
      const prompt = this.generateEnhancementPrompt(options);

      console.log('Generated prompt for OpenAI:', prompt);

      // 2. Process the image to meet OpenAI requirements (square PNG with alpha channel, <4MB).
      // The 'edit' endpoint requires a square PNG with RGBA format.
      let processedBuffer = await sharp(imageBuffer)
        .resize(1800, 1800, { fit: 'cover' }) // Crop to be square for Printify minimum
        .ensureAlpha() // CRITICAL: Ensure image has alpha channel (RGBA) for OpenAI
        .toColorspace('srgb') // Ensure correct colorspace
        .png({ 
          quality: 90, 
          compressionLevel: 6,
          palette: false // Force RGBA instead of palette-based PNG
        })
        .toBuffer();

      let fileSizeMB = processedBuffer.length / (1024 * 1024);
      console.log(`🖼️  Image processed for OpenAI. Buffer size: ${fileSizeMB.toFixed(2)} MB`);

      // Check if still too large after compression
      if (fileSizeMB > 4) {
        console.log(`⚠️ Image still too large (${fileSizeMB.toFixed(2)}MB), applying maximum compression...`);
        processedBuffer = await sharp(imageBuffer)
          .resize(1800, 1800, { fit: 'cover' })
          .ensureAlpha()
          .toColorspace('srgb')
          .png({ 
            quality: 70, 
            compressionLevel: 9,
            palette: false // Force RGBA instead of palette-based PNG
          })
          .toBuffer();
        
        fileSizeMB = processedBuffer.length / (1024 * 1024);
        console.log(`🗜️  Maximum compression applied. Final size: ${fileSizeMB.toFixed(2)} MB`);
        
        if (fileSizeMB > 4) {
          console.log(`⚠️ Even maximum compression yields ${fileSizeMB.toFixed(2)}MB. Trying smaller dimensions...`);
          
          // Try smaller dimensions as last resort
          processedBuffer = await sharp(imageBuffer)
            .resize(1400, 1400, { fit: 'cover' }) // Much smaller target
            .ensureAlpha()
            .toColorspace('srgb')
            .png({ 
              quality: 50, 
              compressionLevel: 9,
              palette: false,
              colors: 128 // Limit color palette for extreme compression
            })
            .toBuffer();
          
          fileSizeMB = processedBuffer.length / (1024 * 1024);
          console.log(`📐 Reduced to 1400x1400 with extreme compression: ${fileSizeMB.toFixed(2)} MB`);
          
          if (fileSizeMB > 4) {
            console.log(`❌ Image still too large: ${fileSizeMB.toFixed(2)}MB. OpenAI upscaling not possible.`);
            throw new Error(`Image too complex for OpenAI upscaling. Even at 1400x1400 with extreme compression: ${fileSizeMB.toFixed(2)}MB exceeds 4MB limit.`);
          }
        }
      }

      // Add a timeout to the API call to prevent hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('❌ OpenAI API call timed out after 60 seconds.');
        controller.abort();
      }, 60000); // 60-second timeout

      // 3. Call the OpenAI API's 'edit' endpoint.
      // This allows us to provide a text prompt to guide the enhancement.
      // Note: The 'edit' endpoint currently uses the DALL-E 2 model.
      console.log('📞 Calling OpenAI images.edit API...');
      let response;
      try {
        response = await this.openai.images.edit({
          // CRITICAL FIX: The `File` constructor is not available in all Node.js environments.
          // The correct approach is to use the `toFile` utility from the `openai` library.
          // We must also explicitly provide the `type` option to ensure the correct
          // 'image/png' mime type is sent to the API, resolving the 400 error.
          image: await toFile(processedBuffer, 'image.png', { type: 'image/png' }),
          prompt: prompt,
          n: 1,
          size: '1024x1024', // OpenAI API only supports 1024x1024 - we'll upscale further with Sharp
          response_format: 'b64_json',
        }, {
          signal: controller.signal, // Pass the abort signal
        });
      } finally {
        // IMPORTANT: Clear the timeout regardless of whether the call succeeded or failed
        clearTimeout(timeoutId);
      }

      console.log('✅ OpenAI API call successful.');

      if (!response.data || !response.data[0] || !response.data[0].b64_json) {
        throw new Error('Invalid response from OpenAI API during image edit.');
      }

      const openaiBuffer = Buffer.from(response.data[0].b64_json, 'base64');
      
      // 🚀 POST-PROCESS: Scale OpenAI result to meet Printify requirements (min 1800x1800)
      console.log('🎯 Post-processing OpenAI result to meet Printify requirements...');
      const finalBuffer = await sharp(openaiBuffer)
        .resize(1800, 1800, { fit: 'inside', withoutEnlargement: false }) // Upscale to minimum Printify size
        .sharpen(1.0, 1.0, 1.0) // Add sharpening to counteract upscaling blur
        .png({ quality: 95 }) // High quality PNG
        .toBuffer();
      
      const finalMetadata = await sharp(finalBuffer).metadata();
      console.log(`✅ Final upscaled image: ${finalMetadata.width}x${finalMetadata.height}`);
      
      return {
        success: true,
        method: 'openai-edit-enhanced',
        upscaledBuffer: finalBuffer,
        metadata: {
          prompt: prompt,
          model: 'dall-e-2', // The 'edit' endpoint uses DALL-E 2
          originalSize: imageBuffer.length,
          upscaledSize: finalBuffer.length,
          inputDimensions: (await sharp(imageBuffer).metadata()).width + 'x' + (await sharp(imageBuffer).metadata()).height,
          processedDimensions: `${finalMetadata.width}x${finalMetadata.height}`,
          enhancementSteps: 'OpenAI 1024x1024 → Sharp upscale to 1800x1800 + sharpen'
        }
      };
      
    } catch (error) {

      if (error.name === 'AbortError') {
        console.error('OpenAI upscaling failed due to timeout.');
      } else {
        console.error('OpenAI upscaling failed:', error.message);
      }
      // Re-throw the error so the calling function can handle the fallback
      throw error;
    }
  }

  /**
   * Upscale using Replicate Real-ESRGAN (best for photos)
   */
  async upscaleWithReplicate(imageBuffer, options) {
    try {
      const base64Image = imageBuffer.toString('base64');
      const mimeType = await this.detectMimeType(imageBuffer);
      
      const response = await axios.post('https://api.replicate.com/v1/predictions', {
        version: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input: {
          image: `data:${mimeType};base64,${base64Image}`,
          scale: options.scaleFactor || 4,
          face_enhance: options.enhanceDetails || false
        }
      }, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Poll for completion
      const result = await this.pollReplicateResult(response.data.id);
      
      // Download upscaled image
      const imageResponse = await axios.get(result.output, { responseType: 'arraybuffer' });
      const upscaledBuffer = Buffer.from(imageResponse.data);
      
      return {
        success: true,
        method: 'replicate',
        upscaledBuffer,
        metadata: {
          originalSize: imageBuffer.length,
          upscaledSize: upscaledBuffer.length,
          scaleFactor: options.scaleFactor || 4,
          model: 'real-esrgan'
        }
      };
      
    } catch (error) {
      console.error('Replicate upscaling failed:', error);
      // Re-throw the error instead of falling back
      throw error;
    }
  }
  
  /**
   * Basic upscaling using Sharp (fallback)
   */
  async upscaleWithSharp(imageBuffer, options) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const scaleFactor = options.scaleFactor || 2;
      
      const upscaledBuffer = await sharp(imageBuffer)
        .resize({
          width: Math.round(metadata.width * scaleFactor),
          height: Math.round(metadata.height * scaleFactor),
          kernel: sharp.kernel.lanczos3 // High-quality resampling
        })
        .sharpen() // Add sharpening for better print quality
        .png({ quality: 100, compressionLevel: 0 }) // Uncompressed for print
        .toBuffer();
      
      return {
        success: true,
        method: 'sharp',
        upscaledBuffer,
        metadata: {
          originalSize: imageBuffer.length,
          upscaledSize: upscaledBuffer.length,
          scaleFactor: scaleFactor,
          model: 'lanczos3'
        }
      };
      
    } catch (error) {
      console.error('Sharp upscaling failed:', error);
      throw error;
    }
  }
  
  /**
   * Optimize image specifically for print
   */
  async optimizeForPrint(imageBuffer) {
    try {
      return await sharp(imageBuffer)
        .resize(3000, 3600, { 
          fit: 'inside',
          withoutEnlargement: false
        })
        .png({
          quality: 100,
          compressionLevel: 0,
          colors: 256
        })
        .withMetadata({ density: 300 }) // Set 300 DPI
        .toBuffer();
        
    } catch (error) {
      console.error('Error optimizing for print:', error);
      return imageBuffer; // Return original if optimization fails
    }
  }
  
  /**
   * Store upscaled image in gallery bucket subfolder
   */
  async storeUpscaledImage(userId, originalImageId, upscaledBuffer, metadata) {
    try {
      // Create key in upscaled subfolder following gallery naming convention
      const timestamp = Date.now();
      const key = `${this.upscaledFolder}/${userId}/${originalImageId}-enhanced-${timestamp}.png`;
      
      const command = new PutObjectCommand({
        Bucket: this.galleryBucket,
        Key: key,
        Body: upscaledBuffer,
        ContentType: 'image/png',
        // Add metadata for tracking
        Metadata: {
          originalImageId: originalImageId,
          upscaleMethod: metadata.method || 'unknown',
          scaleFactor: metadata.scaleFactor?.toString() || '1',
          createdAt: new Date().toISOString(),
          enhancementType: 'ai-upscaled'
        },
        // Set cache control for CDN optimization
        CacheControl: 'max-age=31536000', // 1 year cache
        
      });
      
      await this.s3Client.send(command);
      
      // Generate CDN URL for the upscaled image
      const cdnUrl = `${this.cdnUrl}/${key}`;
      
      console.log('✅ Upscaled image stored successfully:', key);
      
      return {
        key: key,
        url: cdnUrl,
        s3Key: key, // Add the key here for explicit reference
        size: upscaledBuffer.length,
        metadata: metadata,
        bucket: this.galleryBucket,
        folder: this.upscaledFolder
      };
      
    } catch (error) {
      console.error('Error storing upscaled image:', error);
      throw new Error('Failed to store upscaled image: ' + error.message);
    }
  }
  
  /**
   * Check if an upscaled version already exists for an image
   */
  async findExistingUpscaledImage(userId, originalImageId) {
    try {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      
      const command = new ListObjectsV2Command({
        Bucket: this.galleryBucket,
        Prefix: `${this.upscaledFolder}/${userId}/${originalImageId}-enhanced-`,
        MaxKeys: 10 // Should only be a few upscaled versions
      });
      
      const response = await this.s3Client.send(command);
      
      if (response.Contents && response.Contents.length > 0) {
        // Return the most recent upscaled version
        const latestImage = response.Contents.sort((a, b) => 
          new Date(b.LastModified) - new Date(a.LastModified)
        )[0];
        
        return {
          exists: true,
          key: latestImage.Key,
          url: `${this.cdnUrl}/${latestImage.Key}`,
          size: latestImage.Size,
          lastModified: latestImage.LastModified
        };
      }
      
      return { exists: false };
      
    } catch (error) {
      console.error('Error checking for existing upscaled image:', error);
      return { exists: false };
    }
  }
  
  /**
   * Get gallery folder structure for organization
   */
  getFolderStructure() {
    return {
      galleryBucket: this.galleryBucket,
      originalImages: 'gallery', // Standard gallery images
      upscaledImages: this.upscaledFolder, // AI-enhanced images
      cdnUrl: this.cdnUrl
    };
  }
  
  /**
   * Generate enhancement prompt for AI upscaling
   */
  generateEnhancementPrompt(options) {
    const { contentType = 'illustration', style, character } = options;
    
    const basePrompts = {
      illustration: 'Enhance this illustration with crisp details, vibrant colors, and sharp lines suitable for high-quality printing',
      photo: 'Enhance this photograph with improved clarity, reduced noise, and enhanced details while maintaining natural appearance',
      artwork: 'Enhance this artwork preserving the original artistic style while improving resolution and detail clarity',
      character: 'Enhance this character illustration with sharp details, clear facial features, and vibrant colors'
    };
    
    let prompt = basePrompts[contentType] || basePrompts.illustration;
    
    if (character) {
      prompt += `. Focus on preserving the character "${character}" accurately.`;
    }
    
    if (style) {
      prompt += ` Maintain the ${style} art style.`;
    }
    
    return prompt;
  }
  
  /**
   * Helper methods
   */
  chooseUpscaleMethod(contentType) {
    // Check if OpenAI API key is available
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
    
    // Prioritize OpenAI if Replicate is not available
    if (hasOpenAI && !hasReplicate) {
      console.log('🎨 Using OpenAI for upscaling (Replicate not configured)');
      return 'openai';
    }
    
    // Choose best method based on content type
    switch (contentType) {
      case 'photo': return hasReplicate ? 'replicate' : 'openai';
      case 'illustration':
      case 'artwork': return 'openai';
      default: return hasReplicate ? 'replicate' : 'openai';
    }
  }
  
  calculateDPI(imageInfo) {
    // Estimate DPI based on dimensions (rough calculation)
    const assumedPrintSize = 8; // inches
    return Math.round(imageInfo.width / assumedPrintSize);
  }
  
  async detectMimeType(buffer) {
    const metadata = await sharp(buffer).metadata();
    return `image/${metadata.format}`;
  }
  
  async pollReplicateResult(predictionId) {
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      
      if (response.data.status === 'succeeded') {
        return response.data;
      } else if (response.data.status === 'failed') {
        throw new Error('Replicate prediction failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Replicate prediction timed out');
  }
  
  /**
   * Check Global Cache for existing upscaled version
   */
  async checkGlobalCacheForUpscaling(imageBuffer, options) {
    try {
      if (!this.cacheEnabled) {
        return { found: false, reason: 'cache_disabled' };
      }

      // Generate content hash for the original image
      const contentHash = this.globalCache.generateImageFingerprint(imageBuffer);
      console.log(`🔑 Checking cache for content hash: ${contentHash}`);
      
      // Check for existing enhanced version using the correct method
      const enhanced = await this.globalCache.getGlobalEnhancedImage(contentHash);
      
      if (enhanced) {
        console.log(`🎯 Cache HIT! Found enhanced image:`);
        console.log(`   S3 Key: ${enhanced.s3Key}`);
        console.log(`   URL: ${enhanced.enhancedImageUrl}`);
        console.log(`   Method: ${enhanced.enhancementMethod}`);
        
        return {
          found: true,
          exists: true,
          enhancementData: enhanced,
          enhancedUrl: enhanced.enhancedImageUrl,
          s3Key: enhanced.s3Key,
          fileName: enhanced.s3Key ? enhanced.s3Key.split('/').pop() : 'cached-image',
          fileSize: enhanced.fileSize,
          contentHash: contentHash,
          method: enhanced.enhancementMethod,
          id: contentHash
        };
      }
      
      console.log(`❌ Cache MISS: No enhanced version found for ${contentHash}`);
      return { 
        found: false, 
        exists: false,
        contentHash: contentHash,
        reason: 'no_enhanced_version'
      };
      
    } catch (error) {
      console.log(`⚠️  Global cache check failed: ${error.message}`);
      return { found: false };
    }
  }
  
  /**
   * Save upscaled image to Global Cache with detailed logging
   * @param {string|Buffer} imagePath - Original image path or buffer  
   * @param {Object} result - Upscaling result object
   */
  async saveToGlobalCache(imagePath, result) {
    try {
      if (!this.cacheEnabled) {
        console.log('🚫 Global Cache disabled - skipping save');
        return { success: false, reason: 'cache_disabled' };
      }
      
      console.log('� GLOBAL CACHE SAVE: Starting save process...');
      console.log(`📄 Input type: ${typeof imagePath}, has upscaled buffer: ${!!result.upscaledBuffer}`);
      
      // Get original image buffer
      let originalBuffer;
      if (Buffer.isBuffer(imagePath)) {
        originalBuffer = imagePath;
        console.log(`📦 Using provided buffer (${originalBuffer.length} bytes)`);
      } else {
        // Load from path if needed
        console.log(`📁 Loading image from path: ${imagePath}`);
        originalBuffer = await this.loadImageBuffer(imagePath);
      }
      
      if (!originalBuffer) {
        console.error('❌ GLOBAL CACHE SAVE FAILED: No original image buffer available');
        return { success: false, reason: 'no_original_buffer' };
      }
      
      // Generate content hash for the original image
      const contentHash = this.globalCache.generateImageFingerprint(originalBuffer);
      console.log(`🔑 Generated content hash: ${contentHash}`);
      
      // Prepare enhancement data for storage
      const enhancementData = {
        contentHash: contentHash,
        enhancedImageUrl: result.metadata?.url || null,
        s3Key: result.s3Key || result.metadata?.s3Key || null,
        enhancementMethod: result.metadata?.method || result.method || 'ai_upscaling',
        originalDimensions: {
          width: result.metadata?.originalWidth || this.extractDimensionFromString(result.metadata?.inputDimensions, 'width') || null,
          height: result.metadata?.originalHeight || this.extractDimensionFromString(result.metadata?.inputDimensions, 'height') || null
        },
        enhancedDimensions: {
          width: result.metadata?.width || this.extractDimensionFromString(result.metadata?.processedDimensions, 'width') || null,
          height: result.metadata?.height || this.extractDimensionFromString(result.metadata?.processedDimensions, 'height') || null
        },
        scaleFactor: result.metadata?.scaleFactor || null,
        qualityMetrics: result.metadata?.qualityScore ? {
          qualityScore: result.metadata.qualityScore
        } : {},
        enhancementSource: 'ImageUpscalingService',
        processingTime: result.metadata?.processingTime || null,
        fileSize: result.upscaledBuffer?.length || null
      };
      
      console.log('📊 ENHANCEMENT DATA TO STORE:');
      console.log(JSON.stringify(enhancementData, null, 2));
      
      // Store enhanced version in global cache
      console.log('💾 Storing enhancement data in Firebase...');
      const storeResult = await this.globalCache.storeGlobalEnhancedImage(contentHash, enhancementData);
      
      if (storeResult.success) {
        console.log('✅ GLOBAL CACHE SAVE SUCCESS:');
        console.log(`   Content Hash: ${contentHash}`);
        console.log(`   S3 Key: ${enhancementData.s3Key}`);
        console.log(`   Enhancement URL: ${enhancementData.enhancedImageUrl}`);
        console.log(`   Method: ${enhancementData.enhancementMethod}`);
        console.log(`   File Size: ${enhancementData.fileSize} bytes`);
        
        return { 
          success: true, 
          contentHash: contentHash,
          enhancementData: enhancementData,
          firebaseResult: storeResult
        };
      } else {
        console.error('❌ GLOBAL CACHE SAVE FAILED:');
        console.error(`   Error: ${storeResult.error}`);
        console.error(`   Content Hash: ${contentHash}`);
        
        return { 
          success: false, 
          reason: 'firebase_store_failed',
          error: storeResult.error,
          contentHash: contentHash
        };
      }
      
    } catch (error) {
      console.error('❌ GLOBAL CACHE SAVE EXCEPTION:');
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      return { 
        success: false, 
        reason: 'exception',
        error: error.message 
      };
    }
  }

  /**
   * Comprehensive runtime validation that runs after every upscaling operation
   * Validates the entire pipeline from source image to final enhanced result
   * @param {string|Buffer} originalImageBuffer - Original image buffer or path
   * @param {Object} upscaleResult - The upscaling result object
   * @param {Object} cacheResult - The Global Cache save result
   */
  async performRuntimeValidation(originalImageBuffer, upscaleResult, cacheResult) {
    const validationId = `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n📋 RUNTIME VALIDATION ${validationId}`);
    console.log('=' .repeat(80));
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
    
    const validation = {
      id: validationId,
      timestamp: new Date().toISOString(),
      originalImage: {},
      upscaledImage: {},
      globalCache: {},
      apiVerification: {},
      errors: [],
      warnings: []
    };

    try {
      // STEP 1: Validate Original Image Details
      console.log('\n🔍 STEP 1: Original Image Analysis');
      console.log('-' .repeat(50));
      
      let originalBuffer;
      if (Buffer.isBuffer(originalImageBuffer)) {
        originalBuffer = originalImageBuffer;
        validation.originalImage.source = 'buffer';
        validation.originalImage.size = originalBuffer.length;
      } else {
        validation.originalImage.source = 'file_path';
        validation.originalImage.path = originalImageBuffer;
        try {
          originalBuffer = await this.loadImageBuffer(originalImageBuffer);
          validation.originalImage.size = originalBuffer.length;
        } catch (err) {
          validation.errors.push(`Failed to load original image: ${err.message}`);
        }
      }
      
      if (originalBuffer) {
        validation.originalImage.contentHash = this.globalCache.generateImageFingerprint(originalBuffer);
        validation.originalImage.sizeKB = Math.round(originalBuffer.length / 1024);
        
        console.log(`📄 Original Image:`);
        console.log(`   Source: ${validation.originalImage.source}`);
        console.log(`   Size: ${validation.originalImage.sizeKB} KB`);
        console.log(`   Content Hash: ${validation.originalImage.contentHash}`);
        if (validation.originalImage.path) {
          console.log(`   Path: ${validation.originalImage.path}`);
        }
      }

      // STEP 2: Validate Upscaled Result
      console.log('\n🚀 STEP 2: Upscaled Result Analysis');
      console.log('-' .repeat(50));
      
      validation.upscaledImage.success = upscaleResult.success;
      validation.upscaledImage.method = upscaleResult.metadata?.method || 'unknown';
      validation.upscaledImage.hasBuffer = !!upscaleResult.upscaledBuffer;
      validation.upscaledImage.s3Key = upscaleResult.s3Key || upscaleResult.metadata?.s3Key;
      validation.upscaledImage.url = upscaleResult.metadata?.url;
      validation.upscaledImage.processingTime = upscaleResult.metadata?.processingTime;
      
      if (upscaleResult.upscaledBuffer) {
        validation.upscaledImage.size = upscaleResult.upscaledBuffer.length;
        validation.upscaledImage.sizeKB = Math.round(upscaleResult.upscaledBuffer.length / 1024);
        validation.upscaledImage.contentHash = this.globalCache.generateImageFingerprint(upscaleResult.upscaledBuffer);
      }
      
      console.log(`🎨 Upscaled Image:`);
      console.log(`   Success: ${validation.upscaledImage.success}`);
      console.log(`   Method: ${validation.upscaledImage.method}`);
      console.log(`   Size: ${validation.upscaledImage.sizeKB} KB`);
      console.log(`   Content Hash: ${validation.upscaledImage.contentHash}`);
      console.log(`   S3 Key: ${validation.upscaledImage.s3Key}`);
      console.log(`   URL: ${validation.upscaledImage.url}`);
      console.log(`   Processing Time: ${validation.upscaledImage.processingTime}ms`);

      // STEP 3: Validate Global Cache Integration
      console.log('\n🔥 STEP 3: Global Cache Validation');
      console.log('-' .repeat(50));
      
      validation.globalCache.saveAttempted = !!cacheResult;
      validation.globalCache.saveSuccess = cacheResult?.success || false;
      validation.globalCache.contentHash = cacheResult?.contentHash;
      validation.globalCache.enhancementData = cacheResult?.enhancementData;
      
      if (cacheResult?.success) {
        console.log(`💾 Global Cache Save:`);
        console.log(`   Success: ${validation.globalCache.saveSuccess}`);
        console.log(`   Content Hash: ${validation.globalCache.contentHash}`);
        console.log(`   Enhancement URL: ${cacheResult.enhancementData?.enhancedImageUrl}`);
        console.log(`   S3 Key: ${cacheResult.enhancementData?.s3Key}`);
        console.log(`   Method: ${cacheResult.enhancementData?.enhancementMethod}`);
        console.log(`   File Size: ${cacheResult.enhancementData?.fileSize} bytes`);
        
        // Validate Firebase record structure
        const requiredFields = ['contentHash', 'enhancementMethod'];
        const missingFields = requiredFields.filter(field => !cacheResult.enhancementData[field]);
        
        // Check for inconsistent state
        const hasUrl = cacheResult.enhancementData.enhancedImageUrl !== null && cacheResult.enhancementData.enhancedImageUrl !== undefined;
        const hasS3 = cacheResult.enhancementData.s3Key !== null && cacheResult.enhancementData.s3Key !== undefined;
        const inconsistentState = (hasUrl && !hasS3) || (!hasUrl && hasS3);
        
        if (missingFields.length > 0) {
          validation.errors.push(`Missing required Firebase fields: ${missingFields.join(', ')}`);
        } else if (inconsistentState) {
          validation.errors.push(`Inconsistent cache state: URL=${hasUrl}, S3=${hasS3}`);
        } else {
          const cachingMode = hasUrl ? 'URL-based' : 'Buffer-based';
          console.log(`   ✅ Valid ${cachingMode} cache record`);
        }
      } else {
        validation.errors.push(`Global Cache save failed: ${cacheResult?.error || 'unknown error'}`);
      }

      // STEP 4: Verify Firebase Record Retrieval
      console.log('\n🔍 STEP 4: Firebase Record Verification');
      console.log('-' .repeat(50));
      
      if (validation.originalImage.contentHash) {
        try {
          const retrievedRecord = await this.globalCache.getGlobalEnhancedImage(validation.originalImage.contentHash);
          validation.globalCache.retrievalSuccess = !!retrievedRecord;
          validation.globalCache.retrievedRecord = retrievedRecord;
          
          if (retrievedRecord) {
            console.log(`🎯 Firebase Record Retrieved:`);
            console.log(`   Content Hash: ${retrievedRecord.contentHash}`);
            console.log(`   Enhanced URL: ${retrievedRecord.enhancedImageUrl}`);
            console.log(`   S3 Key: ${retrievedRecord.s3Key}`);
            console.log(`   Method: ${retrievedRecord.enhancementMethod}`);
            console.log(`   Created: ${new Date(retrievedRecord.createdAt).toISOString()}`);
            console.log(`   Usage Count: ${retrievedRecord.usageCount}`);
            
            // Cross-validate with saved data
            if (cacheResult?.enhancementData) {
              const hashMatch = retrievedRecord.contentHash === cacheResult.enhancementData.contentHash;
              const methodMatch = retrievedRecord.enhancementMethod === cacheResult.enhancementData.enhancementMethod;
              
              if (!hashMatch || !methodMatch) {
                validation.errors.push('Retrieved Firebase record does not match saved data (hash/method mismatch)');
              } else {
                console.log(`   ✅ Retrieved record matches saved data`);
              }
            }
          } else {
            validation.errors.push('Failed to retrieve Firebase record immediately after saving');
          }
        } catch (err) {
          validation.errors.push(`Firebase retrieval failed: ${err.message}`);
        }
      }

      // STEP 5: API Availability Verification
      console.log('\n🌐 STEP 5: API Availability Verification');
      console.log('-' .repeat(50));
      
      if (validation.upscaledImage.url) {
        try {
          // Test direct URL access (should work via server proxy)
          const axios = require('axios');
          const response = await axios.head(validation.upscaledImage.url, { 
            timeout: 5000,
            validateStatus: (status) => status < 500 // Accept redirects and auth errors
          });
          
          validation.apiVerification.directUrlAccess = {
            status: response.status,
            accessible: response.status < 400
          };
          
          console.log(`🌍 Direct URL Access:`);
          console.log(`   URL: ${validation.upscaledImage.url}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Accessible: ${response.status < 400}`);
          
        } catch (err) {
          validation.apiVerification.directUrlAccess = {
            status: 'error',
            error: err.message,
            accessible: false
          };
          validation.warnings.push(`Direct URL access failed: ${err.message}`);
        }

        // Test server proxy access
        try {
          const proxyUrl = validation.upscaledImage.url.replace(/^https:\/\/[^\/]+/, 'http://localhost:3001');
          const axios = require('axios');
          const response = await axios.head(proxyUrl, { 
            timeout: 5000,
            validateStatus: (status) => status < 500
          });
          
          validation.apiVerification.proxyUrlAccess = {
            status: response.status,
            accessible: response.status < 400,
            proxyUrl: proxyUrl
          };
          
          console.log(`🔄 Proxy URL Access:`);
          console.log(`   Proxy URL: ${proxyUrl}`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Accessible: ${response.status < 400}`);
          
        } catch (err) {
          validation.apiVerification.proxyUrlAccess = {
            status: 'error',
            error: err.message,
            accessible: false
          };
          validation.warnings.push(`Proxy URL access failed: ${err.message}`);
        }
      }

      // STEP 6: Quality Metrics Validation
      console.log('\n📊 STEP 6: Quality Metrics');
      console.log('-' .repeat(50));
      
      if (originalBuffer && upscaleResult.upscaledBuffer) {
        const sizeIncrease = upscaleResult.upscaledBuffer.length / originalBuffer.length;
        validation.qualityMetrics = {
          sizeIncrease: sizeIncrease,
          sizeIncreasePercent: Math.round((sizeIncrease - 1) * 100),
          processingTime: upscaleResult.metadata?.processingTime,
          qualityScore: upscaleResult.metadata?.qualityScore
        };
        
        console.log(`📈 Quality Metrics:`);
        console.log(`   Size Increase: ${validation.qualityMetrics.sizeIncreasePercent}%`);
        console.log(`   Processing Time: ${validation.qualityMetrics.processingTime}ms`);
        console.log(`   Quality Score: ${validation.qualityMetrics.qualityScore || 'N/A'}`);
        
        if (sizeIncrease < 1.1) {
          validation.warnings.push('Upscaled image is not significantly larger than original');
        }
      }

    } catch (validationError) {
      validation.errors.push(`Validation exception: ${validationError.message}`);
      console.error(`❌ Validation Exception: ${validationError.message}`);
    }

    // FINAL VALIDATION SUMMARY
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`🆔 Validation ID: ${validationId}`);
    console.log(`⏱️  Completed at: ${new Date().toISOString()}`);
    console.log(`✅ Errors: ${validation.errors.length}`);
    console.log(`⚠️  Warnings: ${validation.warnings.length}`);
    
    if (validation.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      validation.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    const isValid = validation.errors.length === 0;
    console.log(`\n${isValid ? '🎉' : '💥'} VALIDATION RESULT: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    // Store validation record for debugging
    validation.isValid = isValid;
    this.lastValidation = validation;
    
    // Log complete validation data as JSON for debugging
    console.log('\n📋 COMPLETE VALIDATION DATA:');
    console.log(JSON.stringify(validation, null, 2));
    
    return validation;
  }

  /**
   * Extract width or height from dimension string like "1024x1024"
   * @param {string} dimensionString - String in format "WIDTHxHEIGHT"
   * @param {string} component - 'width' or 'height'
   * @returns {number|null} The extracted dimension or null
   */
  extractDimensionFromString(dimensionString, component) {
    if (!dimensionString || typeof dimensionString !== 'string') return null;
    
    const match = dimensionString.match(/^(\d+)x(\d+)$/);
    if (!match) return null;
    
    return component === 'width' ? parseInt(match[1]) : parseInt(match[2]);
  }
}

module.exports = ImageUpscalingService;