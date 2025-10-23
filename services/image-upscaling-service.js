/**
 * AI Image Upscaling Service
 * 
 * Provides high-quality image upscaling for print merchandise
 * using multiple AI services with fallback options
 */

const axios = require('axios');
const sharp = require('sharp');
const { OpenAI } = require('openai');
const { toFile, File } = require('openai/uploads');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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
    this.galleryBucket = galleryConfig.GALLERY_S3_BUCKET || 'wavelength-lore-bucket';
    this.upscaledFolder = 'upscaled'; // Subfolder for enhanced images
    this.cdnUrl = galleryConfig.CDN_URL || `https://${this.galleryBucket}.s3.amazonaws.com`;
    
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
   * Upscale image using AI service
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Upscaling options
   * @returns {Object} Upscaling result
   */
  async upscaleImage(imageBuffer, options = {}) {
    const {
      method = 'openai', // 'openai', 'replicate', 'auto'
      scaleFactor = 4,
      enhanceDetails = true,
      preserveStyle = true,
      contentType = 'illustration' // 'photo', 'illustration', 'artwork'
    } = options;
    
    try {
      const upscaleMethod = method === 'auto' ? this.chooseUpscaleMethod(contentType) : method;
      
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
      
      // Post-process for print optimization
      result.printOptimized = await this.optimizeForPrint(result.upscaledBuffer);
      
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

      // 2. Process the image to meet OpenAI requirements (square PNG, <4MB).
      // The 'edit' endpoint also requires a square PNG.
      const processedBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'cover' }) // Crop to be square
        .ensureAlpha() // Ensure image has an alpha channel (RGBA) for OpenAI
        .png() // Convert to PNG
        .toBuffer();

      console.log(`🖼️  Image processed for OpenAI. Buffer size: ${(processedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

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
          size: '1024x1024',
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

      const upscaledBuffer = Buffer.from(response.data[0].b64_json, 'base64');
      
      return {
        success: true,
        method: 'openai-edit',
        upscaledBuffer,
        metadata: {
          prompt: prompt,
          model: 'dall-e-2', // The 'edit' endpoint uses DALL-E 2
          originalSize: imageBuffer.length,
          upscaledSize: upscaledBuffer.length,
          inputDimensions: (await sharp(imageBuffer).metadata()).width + 'x' + (await sharp(imageBuffer).metadata()).height,
          processedDimensions: '1024x1024'
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
}

module.exports = ImageUpscalingService;