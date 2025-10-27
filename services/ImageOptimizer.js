/**
 * ImageOptimizer Service - PERFECT PRINTING
 *
 * Handles intelligent image optimization for each product type:
 * - Validates dimensions against product specifications
 * - Upscales low-resolution images using AI (ESRGAN)
 * - Downscales oversized images efficiently
 * - Maintains transparency and quality
 * - Reports progress transparently to user
 *
 * PRINCIPLE: All processing is transparent to user with clear messaging
 * about what's happening and why.
 */

const Sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const productSpecifications = require('../config/productSpecifications');
const productTemplates = require('../config/productTemplates');
const GlobalImageCache = require('./global-image-cache');

class ImageOptimizer {
  constructor() {
    this.maxProcessingTime = 180000; // 3 minutes max
    this.progressCallbacks = [];
    this.globalCache = new GlobalImageCache();
  }

  /**
   * Generate content-based fingerprint for image
   * @param {Buffer} imageBuffer - Image data
   * @returns {string} SHA-256 hash
   */
  generateImageFingerprint(imageBuffer) {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Generate product-specific cache key
   * Enables separate cache entries for each product type
   * @param {string} contentHash - Image content hash
   * @param {string} productKey - Product identifier
   * @returns {string} Product-specific cache key
   */
  generateProductCacheKey(contentHash, productKey) {
    return `${contentHash}-${productKey}`;
  }

  /**
   * Check if optimized version exists in cache for this product
   * @param {Buffer} imageBuffer - Original image
   * @param {string} productKey - Product identifier
   * @returns {Promise<Object>} Cache result with optimized buffer or null
   */
  async checkProductCache(imageBuffer, productKey) {
    try {
      const contentHash = this.generateImageFingerprint(imageBuffer);
      const productCacheKey = this.generateProductCacheKey(contentHash, productKey);

      this.emitProgress('CACHE_CHECK', `Checking cache for optimized version...`);

      // Check if we have this exact optimization cached
      const cachedEnhancedData = await this.globalCache.getGlobalEnhancedImage(productCacheKey);

      if (cachedEnhancedData && cachedEnhancedData.enhancedImageUrl) {
        console.log(`⚡ CACHE HIT: Found optimized image for ${productKey}`);
        console.log(`   Previously optimized ${cachedEnhancedData.usageCount} times`);
        console.log(`   Original enhancement took ${cachedEnhancedData.processingTime}ms`);

        this.emitProgress('CACHE_HIT', `✨ Using cached optimization from ${cachedEnhancedData.usageCount} other users!`, 100);

        return {
          cached: true,
          enhancedImageUrl: cachedEnhancedData.enhancedImageUrl,
          s3Key: cachedEnhancedData.s3Key,
          metadata: {
            originalDimensions: cachedEnhancedData.originalDimensions,
            enhancedDimensions: cachedEnhancedData.enhancedDimensions,
            scaleFactor: cachedEnhancedData.scaleFactor,
            processingTime: cachedEnhancedData.processingTime,
            usageCount: cachedEnhancedData.usageCount,
            enhancementMethod: cachedEnhancedData.enhancementMethod,
            createdAt: cachedEnhancedData.createdAt
          }
        };
      }

      console.log(`📦 CACHE MISS: No optimization found for ${productKey}, will process...`);
      return { cached: false };

    } catch (error) {
      console.warn('Cache check error (proceeding with optimization):', error.message);
      return { cached: false, error: error.message };
    }
  }

  /**
   * Register callback for progress updates
   * Used for real-time frontend updates
   */
  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }

  /**
   * Emit progress event
   */
  emitProgress(stage, status, percentage = null) {
    const event = { stage, status, percentage, timestamp: new Date().toISOString() };
    this.progressCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
    console.log(`📊 [${stage}] ${status}${percentage ? ` (${percentage}%)` : ''}`);
  }

  /**
   * Analyze image and determine optimization strategy
   * @param {Buffer} imageBuffer - Raw image data
   * @param {string} productKey - Product identifier
   * @returns {Promise<object>} Analysis results with recommendations
   */
  async analyzeImage(imageBuffer, productKey) {
    try {
      this.emitProgress('ANALYSIS', 'Analyzing image...');

      const spec = productSpecifications.getSpecsByProductKey(productKey);
      if (!spec) {
        throw new Error(`Product "${productKey}" not found in specifications`);
      }

      // Get image metadata
      const metadata = await Sharp(imageBuffer).metadata();

      const analysis = {
        currentDimensions: {
          width: metadata.width,
          height: metadata.height
        },
        currentSize: {
          bytes: imageBuffer.length,
          megabytes: (imageBuffer.length / 1024 / 1024).toFixed(2)
        },
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        colorSpace: metadata.space,
        product: spec.name,
        productKey: productKey
      };

      // Get optimal dimensions
      const optimal = spec.imageSpec.optimalDimensions;
      const min = spec.imageSpec.minDimensions;
      const max = spec.imageSpec.maxDimensions;

      analysis.targetDimensions = optimal;
      analysis.minDimensions = min;
      analysis.maxDimensions = max;
      analysis.targetDpi = spec.imageSpec.recommendedDpi;

      // Calculate scale factor
      const scaleX = optimal.width / analysis.currentDimensions.width;
      const scaleY = optimal.height / analysis.currentDimensions.height;
      analysis.scaleFactor = Math.max(scaleX, scaleY);

      // Determine optimization strategy
      const isBelowMin =
        analysis.currentDimensions.width < min.width ||
        analysis.currentDimensions.height < min.height;

      const isAboveMax =
        analysis.currentDimensions.width > max.width ||
        analysis.currentDimensions.height > max.height;

      if (isBelowMin) {
        analysis.strategy = 'UPSCALE';
        analysis.action = 'upscale';
        analysis.estimatedTime = this.estimateUpscaleTime(analysis.scaleFactor);
      } else if (isAboveMax) {
        analysis.strategy = 'DOWNSCALE';
        analysis.action = 'downscale';
        analysis.estimatedTime = 5000; // Quick operation
      } else if (
        analysis.currentDimensions.width !== optimal.width ||
        analysis.currentDimensions.height !== optimal.height
      ) {
        analysis.strategy = 'OPTIMIZE';
        analysis.action = 'resize';
        analysis.estimatedTime = 3000;
      } else {
        analysis.strategy = 'PERFECT';
        analysis.action = 'none';
        analysis.estimatedTime = 0;
      }

      // Generate user-friendly message
      analysis.message = this.generateOptimizationMessage(analysis);

      this.emitProgress('ANALYSIS', 'Analysis complete', 100);
      return analysis;

    } catch (error) {
      this.emitProgress('ANALYSIS', `Error: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Estimate upscaling time based on scale factor
   */
  estimateUpscaleTime(scaleFactor) {
    if (scaleFactor <= 1.5) return 30000;   // 30 seconds
    if (scaleFactor <= 2.0) return 60000;   // 60 seconds
    if (scaleFactor <= 2.5) return 90000;   // 90 seconds
    return 120000;                          // 120 seconds
  }

  /**
   * Generate user-friendly optimization message
   */
  generateOptimizationMessage(analysis) {
    const current = `${analysis.currentDimensions.width}x${analysis.currentDimensions.height}`;
    const target = `${analysis.targetDimensions.width}x${analysis.targetDimensions.height}`;

    switch (analysis.strategy) {
      case 'PERFECT':
        return `✅ Perfect! Your image (${current}) is already optimized for ${analysis.product}.`;

      case 'OPTIMIZE':
        return `🎨 Your image will be optimized from ${current} to ${target} (${analysis.targetDpi} DPI) for perfect quality.`;

      case 'DOWNSCALE':
        return `📉 Your image (${current}) is larger than needed. Will optimize to ${target} for this product.`;

      case 'UPSCALE':
        const timeSeconds = Math.round(analysis.estimatedTime / 1000);
        return `✨ Enhancing image quality from ${current} to ${target}. This will take about ${timeSeconds} seconds...`;

      default:
        return 'Processing image...';
    }
  }

  /**
   * Optimize image according to product specifications
   * Main entry point for image processing
   *
   * @param {Buffer} imageBuffer - Raw image data
   * @param {string} productKey - Product identifier
   * @returns {Promise<object>} { optimizedBuffer, metadata, analysis }
   */
  async optimizeForProduct(imageBuffer, productKey) {
    try {
      const startTime = Date.now();

      // Step 1: Analyze image
      this.emitProgress('STEP_1_ANALYSIS', 'Analyzing image dimensions and quality...');
      const analysis = await this.analyzeImage(imageBuffer, productKey);

      if (analysis.action === 'none') {
        this.emitProgress('STEP_5_COMPLETE', 'Image is already perfect!', 100);
        return {
          optimizedBuffer: imageBuffer,
          analysis: analysis,
          optimized: false,
          processingTime: Date.now() - startTime
        };
      }

      // Step 2: Perform optimization based on strategy
      let optimizedBuffer = imageBuffer;

      if (analysis.action === 'upscale') {
        this.emitProgress('STEP_2_UPSCALE', 'Upscaling image with AI enhancement...', 25);
        optimizedBuffer = await this.upscaleImage(imageBuffer, analysis);
      } else if (analysis.action === 'downscale') {
        this.emitProgress('STEP_2_DOWNSCALE', 'Optimizing image size...', 25);
        optimizedBuffer = await this.downscaleImage(imageBuffer, analysis);
      } else if (analysis.action === 'resize') {
        this.emitProgress('STEP_2_RESIZE', 'Resizing image to optimal dimensions...', 25);
        optimizedBuffer = await this.resizeImage(imageBuffer, analysis);
      }

      // Step 3: Validate result
      this.emitProgress('STEP_3_VALIDATE', 'Validating optimized image...', 50);
      const resultMetadata = await Sharp(optimizedBuffer).metadata();

      const validationPassed =
        resultMetadata.width === analysis.targetDimensions.width &&
        resultMetadata.height === analysis.targetDimensions.height;

      if (!validationPassed) {
        throw new Error(
          `Optimization failed: Expected ${analysis.targetDimensions.width}x${analysis.targetDimensions.height}, ` +
          `got ${resultMetadata.width}x${resultMetadata.height}`
        );
      }

      // Step 4: Optimize file size
      this.emitProgress('STEP_4_COMPRESS', 'Optimizing file size...', 75);
      optimizedBuffer = await this.compressImage(optimizedBuffer, analysis);

      // Step 5: Complete
      const processingTime = Date.now() - startTime;
      this.emitProgress('STEP_5_COMPLETE', 'Image optimization complete!', 100);

      return {
        optimizedBuffer: optimizedBuffer,
        analysis: analysis,
        resultMetadata: await Sharp(optimizedBuffer).metadata(),
        optimized: true,
        processingTime: processingTime,
        success: true,
        message: `✅ Image optimized successfully in ${Math.round(processingTime / 1000)}s`
      };

    } catch (error) {
      this.emitProgress('ERROR', `Optimization failed: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Upscale image using AI (ESRGAN via Replicate API)
   * This provides superior quality compared to standard interpolation
   */
  async upscaleImage(imageBuffer, analysis) {
    try {
      // Check if we have Replicate API key for AI upscaling
      const hasReplicateKey = !!process.env.REPLICATE_API_TOKEN;

      if (!hasReplicateKey) {
        // Fallback to Sharp bicubic upscaling if no API key
        console.warn('⚠️ REPLICATE_API_TOKEN not set, using standard upscaling');
        return await this.upscaleWithSharp(imageBuffer, analysis);
      }

      // Use ESRGAN upscaling via Replicate
      return await this.upscaleWithReplicate(imageBuffer, analysis);

    } catch (error) {
      console.warn(`AI upscaling failed, falling back to standard upscaling: ${error.message}`);
      return await this.upscaleWithSharp(imageBuffer, analysis);
    }
  }

  /**
   * Upscale using Sharp library (standard method)
   * Fallback option when AI upscaling is unavailable
   */
  async upscaleWithSharp(imageBuffer, analysis) {
    this.emitProgress('UPSCALE_SHARP', 'Upscaling image with standard bicubic interpolation...', 30);

    return await Sharp(imageBuffer)
      .resize(
        analysis.targetDimensions.width,
        analysis.targetDimensions.height,
        {
          fit: 'fill',
          kernel: Sharp.kernel.cubic,
          withoutEnlargement: false
        }
      )
      .toBuffer();
  }

  /**
   * Upscale using Replicate API (ESRGAN - AI upscaling)
   * Superior quality for low-resolution images
   */
  async upscaleWithReplicate(imageBuffer, analysis) {
    try {
      this.emitProgress('UPSCALE_AI', 'Sending image to AI upscaler...', 30);

      // Convert image buffer to base64 for API
      const base64 = imageBuffer.toString('base64');
      const mimeType = `image/${analysis.currentFormat || 'jpeg'}`;

      // Call Replicate API for ESRGAN upscaling
      const response = await axios.post('https://api.replicate.com/v1/predictions', {
        version: process.env.REPLICATE_ESRGAN_VERSION_ID || 'd0ee3d908c9b779173af603311d9f51e65d1109ce6e8f5dc460d94f048529f18',
        input: {
          image: `data:${mimeType};base64,${base64}`
        }
      }, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        },
        timeout: 300000 // 5 minutes
      });

      const predictionId = response.data.id;
      this.emitProgress('UPSCALE_AI', 'Waiting for AI upscaling...', 40);

      // Poll for completion
      let completed = false;
      let pollCount = 0;
      const maxPolls = 60; // 5 minutes with 5-second intervals

      while (!completed && pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        pollCount++;

        const statusResponse = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        });

        const status = statusResponse.data.status;
        const progress = Math.round((pollCount / maxPolls) * 30) + 40; // 40-70%

        if (status === 'succeeded') {
          completed = true;
          this.emitProgress('UPSCALE_AI', 'AI upscaling complete, downloading result...', 70);

          const outputUrl = statusResponse.data.output;
          const upscaledResponse = await axios.get(outputUrl, { responseType: 'arraybuffer' });
          return Buffer.from(upscaledResponse.data);

        } else if (status === 'failed') {
          throw new Error(`AI upscaling failed: ${statusResponse.data.error}`);
        }

        this.emitProgress('UPSCALE_AI', `Processing... (${pollCount * 5}s elapsed)`, progress);
      }

      throw new Error('AI upscaling timed out after 5 minutes');

    } catch (error) {
      console.error('Replicate upscaling error:', error.message);
      // Fallback to Sharp
      console.log('Falling back to standard upscaling...');
      return await this.upscaleWithSharp(imageBuffer, analysis);
    }
  }

  /**
   * Downscale oversized image
   */
  async downscaleImage(imageBuffer, analysis) {
    this.emitProgress('DOWNSCALE', 'Optimizing oversized image...', 30);

    return await Sharp(imageBuffer)
      .resize(
        analysis.targetDimensions.width,
        analysis.targetDimensions.height,
        {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
      )
      .toBuffer();
  }

  /**
   * Resize image to exact target dimensions
   */
  async resizeImage(imageBuffer, analysis) {
    this.emitProgress('RESIZE', 'Resizing image to optimal dimensions...', 30);

    return await Sharp(imageBuffer)
      .resize(
        analysis.targetDimensions.width,
        analysis.targetDimensions.height,
        {
          fit: 'cover',
          position: 'center'
        }
      )
      .toBuffer();
  }

  /**
   * Compress image for optimal file size while maintaining quality
   */
  async compressImage(imageBuffer, analysis) {
    this.emitProgress('COMPRESS', 'Optimizing file size...', 80);

    const metadata = await Sharp(imageBuffer).metadata();

    if (metadata.format === 'png') {
      return await Sharp(imageBuffer)
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer();
    } else if (metadata.format === 'jpeg') {
      return await Sharp(imageBuffer)
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();
    } else if (metadata.format === 'webp') {
      return await Sharp(imageBuffer)
        .webp({ quality: 90 })
        .toBuffer();
    }

    // Default: convert to JPEG for best compression
    return await Sharp(imageBuffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
  }

  /**
   * Store optimized image in cache for reuse across users/products
   * @param {Buffer} originalBuffer - Original image
   * @param {Buffer} optimizedBuffer - Optimized image
   * @param {string} productKey - Product identifier
   * @param {Object} analysis - Image analysis result
   * @param {number} processingTime - Time taken to optimize
   * @param {string} enhancedImageUrl - S3 URL of optimized image
   * @param {string} s3Key - S3 storage key
   * @returns {Promise<Object>} Cache storage result
   */
  async storeCachedOptimization(originalBuffer, optimizedBuffer, productKey, analysis, processingTime, enhancedImageUrl, s3Key) {
    try {
      const contentHash = this.generateImageFingerprint(originalBuffer);
      const productCacheKey = this.generateProductCacheKey(contentHash, productKey);

      const enhancementData = {
        enhancedImageUrl,
        s3Key,
        enhancementMethod: 'ImageOptimizer-product-specific',
        originalDimensions: {
          width: analysis.currentDimensions.width,
          height: analysis.currentDimensions.height
        },
        enhancedDimensions: {
          width: analysis.targetDimensions.width,
          height: analysis.targetDimensions.height
        },
        scaleFactor: analysis.scaleFactor,
        qualityMetrics: {
          targetDpi: analysis.targetDpi,
          strategy: analysis.strategy,
          compressionApplied: true
        },
        processingTime,
        fileSize: optimizedBuffer.length
      };

      console.log(`💾 Storing optimized image in cache...`);
      console.log(`   Cache Key: ${productCacheKey}`);
      console.log(`   Product: ${analysis.product}`);

      const result = await this.globalCache.storeGlobalEnhancedImage(productCacheKey, enhancementData);

      if (result.success) {
        console.log(`✅ Cache storage successful`);
        console.log(`   Future users will benefit from this optimization!`);
        return { success: true, cacheKey: productCacheKey };
      } else {
        console.warn(`⚠️ Cache storage failed: ${result.error}`);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.warn('Cache storage error (optimization still successful):', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get optimization stats
   */
  getStats(originalBuffer, optimizedBuffer) {
    const originalSize = originalBuffer.length;
    const optimizedSize = optimizedBuffer.length;
    const saved = originalSize - optimizedSize;
    const percentSaved = Math.round((saved / originalSize) * 100);

    return {
      originalSize: {
        bytes: originalSize,
        megabytes: (originalSize / 1024 / 1024).toFixed(2)
      },
      optimizedSize: {
        bytes: optimizedSize,
        megabytes: (optimizedSize / 1024 / 1024).toFixed(2)
      },
      saved: {
        bytes: saved,
        megabytes: (saved / 1024 / 1024).toFixed(2),
        percent: percentSaved
      }
    };
  }
}

module.exports = ImageOptimizer;
