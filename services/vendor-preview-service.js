/**
 * Vendor Preview Generation Service
 * 
 * Creates product mockups from different vendors using the same artwork
 * to allow visual comparison of quality, placement, and appearance
 */

const AutoEnhancedPrintifyService = require('./auto-enhanced-printify-service');
const merchandiseDB = require('./merchandise-database'); // Import singleton instance

class VendorPreviewService extends AutoEnhancedPrintifyService {
  constructor() {
    super();
    this.merchandiseDB = merchandiseDB; // Use singleton instance
  }

  /**
   * Generate preview products from multiple vendors for comparison
   */
  async generateVendorPreviews(imageId, productType, vendorIds, options = {}) {
    console.log('🎨 Generating vendor previews:', {
      imageId,
      productType,
      vendorIds,
      previewMode: true
    });

    // RUNTIME VALIDATION: Validate input parameters
    if (!imageId || typeof imageId !== 'string') {
      throw new Error('Invalid imageId: must be a non-empty string');
    }
    
    if (!productType || typeof productType !== 'string') {
      throw new Error('Invalid productType: must be a non-empty string');
    }
    
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      throw new Error('Invalid vendorIds: must be a non-empty array');
    }
    
    // RUNTIME VALIDATION: Check for valid vendor IDs
    const invalidVendors = vendorIds.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidVendors.length > 0) {
      throw new Error(`Invalid vendor IDs: ${invalidVendors.join(', ')} - must be positive integers`);
    }
    
    console.log('✅ Input validation passed for vendor preview generation');

    // Add cache performance tracking
    const cachePerformance = {
      startTime: Date.now(),
      totalVendors: vendorIds.length,
      cacheHits: 0,
      cacheMisses: 0,
      enhancementsReused: 0,
      enhancementsCreated: 0,
      totalProcessingTime: 0,
      previewCacheHits: 0,
      previewCacheMisses: 0
    };

    const previews = [];
    const errors = [];

    for (const vendorId of vendorIds) {
      try {
        const vendorStartTime = Date.now();
        
        // Check if we have a cached preview for this combination
        const cachedPreview = options.bypassCache ? null : await this.getCachedPreview(imageId, productType, vendorId);
        
        let preview;
        if (cachedPreview && !options.forceRegenerate && !options.bypassCache) {
          console.log(`🎯 Using cached preview for vendor ${vendorId}`);
          preview = cachedPreview;
          cachePerformance.previewCacheHits++;
        } else {
          console.log(`🆕 Generating new preview for vendor ${vendorId}`);
          
          // RUNTIME DIAGNOSTICS: Log vendor preview generation attempt
          console.log(`🔍 RUNTIME DIAGNOSTIC: Attempting vendor preview generation`);
          console.log(`   Image ID: ${imageId}`);
          console.log(`   Product Type: ${productType}`);
          console.log(`   Vendor ID: ${vendorId}`);
          console.log(`   Options: ${JSON.stringify(options, null, 2)}`);
          
          try {
            preview = await this.createVendorPreview(imageId, productType, vendorId, options);
            cachePerformance.previewCacheMisses++;
            
            // RUNTIME VALIDATION: Validate preview result
            if (!preview || typeof preview !== 'object') {
              throw new Error('createVendorPreview returned invalid result');
            }
            
            if (!preview.vendorId || preview.vendorId !== vendorId) {
              console.warn(`⚠️ Preview vendor ID mismatch: expected ${vendorId}, got ${preview.vendorId}`);
            }
            
            console.log(`✅ RUNTIME DIAGNOSTIC: Vendor preview generated successfully`);
            console.log(`   Status: ${preview.status}`);
            console.log(`   Mockup Images: ${preview.mockupImages?.length || 0}`);
            console.log(`   Variants: ${preview.variants?.length || 0}`);
            
            // Cache the preview for future use
            await this.cachePreview(imageId, productType, vendorId, preview);
            
          } catch (previewError) {
            console.error(`❌ RUNTIME DIAGNOSTIC: Vendor preview generation failed`);
            console.error(`   Vendor ID: ${vendorId}`);
            console.error(`   Error: ${previewError.message}`);
            console.error(`   Stack: ${previewError.stack}`);
            
            // Re-throw to be handled by the outer catch block
            throw previewError;
          }
        }
        
        // Skip cache performance tracking since cacheOptimization is removed
        
        const vendorProcessingTime = Date.now() - vendorStartTime;
        preview.processingTime = vendorProcessingTime;
        cachePerformance.totalProcessingTime += vendorProcessingTime;
        
        previews.push(preview);
        
        console.log(`✅ Vendor ${vendorId} preview generated in ${vendorProcessingTime}ms`);
        
      } catch (error) {
        console.error(`❌ Failed to create preview for vendor ${vendorId}:`, error);
        
        // ENHANCED ERROR LOGGING: Capture detailed error information
        const errorDetails = {
          vendorId,
          error: error.message,
          errorType: error.constructor.name,
          timestamp: new Date().toISOString(),
          productType,
          imageId,
          httpStatus: error.response?.status,
          httpStatusText: error.response?.statusText,
          apiErrorData: error.response?.data
        };
        
        console.error('📊 DETAILED ERROR REPORT:', JSON.stringify(errorDetails, null, 2));
        
        // RUNTIME DIAGNOSTICS: Log specific error patterns
        if (error.response?.status === 404) {
          console.error('🚫 BLUEPRINT-PROVIDER COMPATIBILITY ERROR DETECTED!');
          console.error(`   This indicates blueprint-provider combination is not supported`);
          console.error(`   Vendor ${vendorId} may not support the selected product type`);
          console.error(`   Consider updating getCompatibleBlueprintForVendor method`);
        }
        
        if (error.message.includes('No compatible blueprint')) {
          console.error('🚫 COMPATIBILITY CONFIGURATION ERROR!');
          console.error(`   The compatibility matrix needs to be updated for:`);
          console.error(`   Product Type: ${productType}`);
          console.error(`   Vendor ID: ${vendorId}`);
        }
        
        errors.push(errorDetails);
      }
    }

    cachePerformance.endTime = Date.now();
    cachePerformance.totalTime = cachePerformance.endTime - cachePerformance.startTime;
    cachePerformance.averageTimePerVendor = cachePerformance.totalTime / vendorIds.length;
    cachePerformance.cacheHitRate = (cachePerformance.cacheHits / vendorIds.length) * 100;

    console.log('📊 Vendor Preview Cache Performance:', {
      totalVendors: cachePerformance.totalVendors,
      globalCacheHits: cachePerformance.cacheHits,
      globalCacheMisses: cachePerformance.cacheMisses,
      globalCacheHitRate: `${cachePerformance.cacheHitRate.toFixed(1)}%`,
      previewCacheHits: cachePerformance.previewCacheHits,
      previewCacheMisses: cachePerformance.previewCacheMisses,
      previewCacheHitRate: `${((cachePerformance.previewCacheHits / vendorIds.length) * 100).toFixed(1)}%`,
      enhancementsReused: cachePerformance.enhancementsReused,
      enhancementsCreated: cachePerformance.enhancementsCreated,
      totalTime: `${cachePerformance.totalTime}ms`,
      averageTimePerVendor: `${cachePerformance.averageTimePerVendor.toFixed(0)}ms`
    });

    return {
      success: previews.length > 0,
      previews,
      errors,
      imageId,
      productType,
      cachePerformance,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Create a vendor-specific preview for a product
   */
  async createVendorPreview(imageId, productType, vendorId, options = {}) {
    console.log(`🏭 Creating preview for vendor ${vendorId} with ${productType}`);
    
    // Get compatible blueprint-provider combination
    const preferredBlueprintId = options.blueprintId || null;
    const vendorConfig = await this.getCompatibleBlueprintForVendor(productType, vendorId, preferredBlueprintId);
    
    if (!vendorConfig) {
      throw new Error(`No compatible blueprint found for product type ${productType} with vendor ${vendorId}`);
    }
    
    console.log(`✅ Using blueprint ${vendorConfig.blueprintId} for vendor ${vendorId}`);
    
    // VALIDATION: Verify we got the requested blueprint
    if (preferredBlueprintId && vendorConfig.blueprintId !== preferredBlueprintId) {
      console.error(`❌ CRITICAL: Requested blueprint ${preferredBlueprintId} but got ${vendorConfig.blueprintId}`);
      console.error(`   This will cause all products to use the same blueprint!`);
    } else if (preferredBlueprintId) {
      console.log(`✅ VALIDATION PASSED: Using requested blueprint ${preferredBlueprintId}`);
    }

    try {
      console.log(`📥 Downloading original image ${imageId} to ensure 300DPI quality for vendor ${vendorId}`);
      
      // Step 1: Download the original image from gallery (like merchandise page)
      const originalImageBuffer = await this.downloadImageFromGallery(imageId, options.userId);
      if (!originalImageBuffer) {
        throw new Error(`Failed to download gallery image ${imageId}`);
      }
      
      console.log(`✨ Processing image through auto-enhancement for 300DPI print quality`);
      
      // Step 2: Process through auto-enhancement to ensure 300DPI quality
      const enhancedImageResult = await this.previewImageEnhancement(
        originalImageBuffer,
        `vendor-preview-${vendorId}-${Date.now()}.png`,
        {
          title: `${vendorConfig.name} Preview - Vendor ${vendorId}`,
          originalImageId: imageId,
          userId: options.userId || 'vendor-preview',
          contentType: 'illustration'
        }
      );
      
      if (!enhancedImageResult.success) {
        throw new Error(`Failed to enhance image for vendor ${vendorId}: ${enhancedImageResult.error}`);
      }
      
      console.log(`🎯 Using ${!enhancedImageResult.originalImageSuitable ? 'enhanced' : 'original'} image for vendor ${vendorId} (300DPI ensured)`);
      
      // Step 3: Upload the enhanced image to Printify
      let printifyImageId;
      if (enhancedImageResult.enhancedImageUrl && !enhancedImageResult.originalImageSuitable) {
        // Download enhanced image and upload to Printify
        const enhancedBuffer = await this.downloadImageBuffer(enhancedImageResult.enhancedImageUrl);
        const uploadResult = await this.uploadImage(enhancedBuffer, `enhanced-${vendorId}.png`, `Enhanced image for vendor ${vendorId}`);
        if (!uploadResult.success) {
          throw new Error('Failed to upload enhanced image to Printify');
        }
        printifyImageId = uploadResult.imageId;
      } else {
        // Use original image
        const uploadResult = await this.uploadImage(originalImageBuffer, `original-${vendorId}.png`, `Original image for vendor ${vendorId}`);
        if (!uploadResult.success) {
          throw new Error('Failed to upload original image to Printify');
        }
        printifyImageId = uploadResult.imageId;
      }
      
      // Step 4: Create product using the uploaded image
      const productResult = await this.createCustomProductWithBlueprint(printifyImageId, {
        title: `${vendorConfig.name} Preview - Vendor ${vendorId}`,
        description: `Preview mockup for vendor comparison - ${vendorConfig.description}`,
        tags: [...(vendorConfig.tags || []), 'preview', 'vendor-comparison'],
        blueprintId: vendorConfig.blueprintId,
        printProviderId: vendorId,
        basePrice: vendorConfig.basePrice,
        // Remove previewOnly flag to create actual products and get mockups
      });

      // Get additional vendor information
      const vendorInfo = await this.getVendorInfo(vendorId);
      
      return {
        vendorId,
        vendorName: vendorInfo?.title || `Vendor ${vendorId}`,
        vendorLocation: vendorInfo?.location || null,
        productId: productResult.productId || `preview-${vendorId}-${Date.now()}`,
        mockupImages: productResult.images || [],
        variants: productResult.variants || [],
        pricing: this.extractPricingInfo(productResult.variants),
        qualityMetrics: this.calculateQualityMetrics(productResult),
        printDetails: {
          blueprint: vendorConfig.blueprintId,
          provider: vendorId,
          printAreas: productResult.printAreas || []
        },
        imageEnhancement: {
          autoEnhanced: !enhancedImageResult.originalImageSuitable,
          enhancementSource: enhancedImageResult.enhancementMethod || 'preview',
          qualityInfo: {
            originalDimensions: enhancedImageResult.originalDimensions,
            enhancedDimensions: enhancedImageResult.enhancedDimensions,
            scaleFactor: enhancedImageResult.scaleFactor
          },
          printQualityEnsured: true, // Always true since we process through enhancement
          dpiOptimized: true // 300DPI optimization applied
        },
        // Don't include cacheOptimization in preview results to avoid Firebase errors
        generatedAt: new Date().toISOString(),
        status: productResult.productId ? 'success' : 'partial'
      };

    } catch (error) {
      console.error(`Failed to create vendor preview for ${vendorId}:`, error);
      
      // Return a partial result for failed vendors instead of throwing
      const vendorInfo = await this.getVendorInfo(vendorId).catch(() => null);
      
      return {
        vendorId,
        vendorName: vendorInfo?.title || `Vendor ${vendorId}`,
        vendorLocation: vendorInfo?.location || null,
        productId: `failed-${vendorId}-${Date.now()}`,
        mockupImages: [],
        variants: [],
        pricing: { min: 0, max: 0, range: 'N/A' },
        qualityMetrics: { overall: 0, details: {} },
        printDetails: {
          blueprint: vendorConfig?.blueprintId || null,
          provider: vendorId,
          printAreas: []
        },
        error: error.message,
        status: 'failed',
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Sanitize cache optimization data to prevent undefined values in Firebase
   */
  sanitizeCacheOptimization(cacheData) {
    if (!cacheData || typeof cacheData !== 'object') {
      return {
        globalCacheUsed: false,
        newEnhancementStored: false,
        contentHash: null,
        isFirstOccurrence: true
      };
    }

    return {
      globalCacheUsed: Boolean(cacheData.globalCacheUsed),
      newEnhancementStored: Boolean(cacheData.newEnhancementStored),
      contentHash: cacheData.contentHash || null,
      isFirstOccurrence: Boolean(cacheData.isFirstOccurrence)
    };
  }

  /**
   * Download image buffer from URL
   */
  async downloadImageBuffer(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Failed to download image from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Download image from user's gallery using proper API authentication
   * CRITICAL: This method MUST use gallery APIs and respect user permissions
   */
  async downloadImageFromGallery(imageId, userId) {
    try {
      console.log(`📥 Downloading image ${imageId} for user ${userId} via Gallery API`);
      
      if (!userId || userId === 'vendor-preview' || userId.startsWith('test-')) {
        throw new Error(`Invalid userId for gallery access: ${userId}. Gallery images require valid user authentication.`);
      }
      
      // CRITICAL: Use gallery API instead of direct S3 access
      const axios = require('axios');
      const baseUrl = process.env.CDN_URL || 'http://localhost:3001';
      
      // Check if imageId is a URL (bookmark) or a path/filename (uploaded)
      const isUrl = imageId.startsWith('http://') || imageId.startsWith('https://');
      
      if (isUrl) {
        // BOOKMARK: Download directly from original URL
        console.log(`🔖 Detected bookmark URL, downloading directly: ${imageId}`);
        
        try {
          const response = await axios.get(imageId, {
            responseType: 'arraybuffer',
            timeout: 15000
          });
          
          if (response.status === 200 && response.data) {
            const imageBuffer = Buffer.from(response.data);
            console.log(`✅ Downloaded bookmark image: ${Math.round(imageBuffer.length / 1024)}KB`);
            return imageBuffer;
          } else {
            throw new Error(`Failed to download bookmark: status ${response.status}`);
          }
        } catch (error) {
          throw new Error(`Failed to download bookmark image from ${imageId}: ${error.message}`);
        }
      }
      
      // UPLOADED IMAGE: Use gallery API endpoints
      // Step 1: Get image metadata from gallery API to verify user has access
      const path = require('path');
      const imageFilename = path.basename(imageId);
      console.log(`🔍 Verifying user ${userId} has access to image ${imageFilename}`);
      
      const metadataResponse = await axios.get(`${baseUrl}/api/gallery/image/${imageFilename}`, {
        headers: {
          'X-User-ID': userId,
          'X-API-Request': 'merchandise-service'
        },
        timeout: 10000
      });
      
      if (!metadataResponse.data.success) {
        throw new Error(`User ${userId} does not have access to image ${imageId}`);
      }
      
      const imageMetadata = metadataResponse.data.image;
      console.log(`✅ User ${userId} has access to image ${imageId}`);
      
      // Step 2: Try to get enhanced/upscaled version first
      console.log(`🔍 Checking for enhanced version of ${imageFilename}`);
      
      try {
        const enhancedResponse = await axios.get(`${baseUrl}/api/gallery/image/${imageFilename}/enhanced`, {
          headers: {
            'X-User-ID': userId,
            'X-API-Request': 'merchandise-service'
          },
          responseType: 'arraybuffer',
          timeout: 15000
        });
        
        if (enhancedResponse.status === 200 && enhancedResponse.data) {
          const imageBuffer = Buffer.from(enhancedResponse.data);
          console.log(`✅ Downloaded enhanced image: ${Math.round(imageBuffer.length / 1024)}KB`);
          return imageBuffer;
        }
      } catch (enhancedError) {
        console.log(`ℹ️ No enhanced version available for ${imageId}, using original`);
      }
      
      // Step 3: Download original image via gallery API
      console.log(`📥 Downloading original image ${imageFilename} via Gallery API`);
      
      const originalResponse = await axios.get(`${baseUrl}/api/gallery/image/${imageFilename}/download`, {
        headers: {
          'X-User-ID': userId,
          'X-API-Request': 'merchandise-service'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      if (originalResponse.status === 200 && originalResponse.data) {
        const imageBuffer = Buffer.from(originalResponse.data);
        console.log(`✅ Downloaded original image via Gallery API: ${Math.round(imageBuffer.length / 1024)}KB`);
        return imageBuffer;
      } else {
        throw new Error(`Gallery API returned status ${originalResponse.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to download image ${imageId} for user ${userId} via Gallery API:`, error.message);
      
      // CRITICAL: Do not fallback to direct S3 access - this would bypass security
      if (error.response?.status === 403) {
        throw new Error(`Access denied: User ${userId} does not have permission to access image ${imageId}`);
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Image ${imageId} not found in user ${userId}'s gallery`);
      }
      
      throw new Error(`Gallery API error: ${error.message}`);
    }
  }

  /**
   * Get vendor information from Printify API
   */
  async getVendorInfo(vendorId) {
    try {
      const response = await this.api.get(`/catalog/print_providers/${vendorId}.json`);
      return response.data;
    } catch (error) {
      console.warn(`Could not fetch vendor info for ${vendorId}:`, error);
      return null;
    }
  }

  /**
   * Extract pricing information from variants
   */
  extractPricingInfo(variants) {
    if (!variants || variants.length === 0) {
      return { min: 0, max: 0, range: 'N/A' };
    }

    const costs = variants.map(v => v.cost || 0).filter(c => c > 0);
    if (costs.length === 0) {
      return { min: 0, max: 0, range: 'N/A' };
    }

    const min = Math.min(...costs) / 100;
    const max = Math.max(...costs) / 100;
    
    return {
      min,
      max,
      range: min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`,
      currency: 'USD'
    };
  }

  /**
   * Calculate quality metrics based on product result
   */
  calculateQualityMetrics(productResult) {
    const metrics = {
      imageQuality: 'N/A',
      printResolution: 'N/A',
      enhancementApplied: false,
      suitabilityScore: 0
    };

    if (productResult.imageEnhancement) {
      metrics.enhancementApplied = productResult.imageEnhancement.autoEnhanced || false;
      metrics.imageQuality = productResult.imageEnhancement.autoEnhanced ? 'Enhanced' : 'Original';
      
      if (productResult.imageEnhancement.qualityInfo) {
        metrics.suitabilityScore = productResult.imageEnhancement.originalImageSuitable ? 5 : 3;
      }
    }

    return metrics;
  }

  /**
   * Generate comparison report for vendor previews
   */
  async generateComparisonReport(previews, originalImageInfo = {}) {
    console.log('📊 Generating vendor comparison report...');

    // Validate input
    if (!previews || !Array.isArray(previews)) {
      console.warn('Invalid previews data for comparison report');
      return {
        imageInfo: originalImageInfo,
        vendorCount: 0,
        comparisons: [],
        recommendations: [],
        error: 'No valid preview data provided',
        generatedAt: new Date().toISOString()
      };
    }

    const report = {
      imageInfo: originalImageInfo,
      vendorCount: previews.length,
      comparisons: [],
      recommendations: [],
      generatedAt: new Date().toISOString()
    };

    // Create detailed comparisons
    previews.forEach((preview, index) => {
      console.log(`🔍 Processing preview ${index}:`, {
        hasPreview: !!preview,
        vendorId: preview?.vendorId,
        hasMockupImages: !!preview?.mockupImages,
        mockupImagesType: typeof preview?.mockupImages,
        mockupImagesLength: preview?.mockupImages?.length,
        hasVariants: !!preview?.variants,
        variantsType: typeof preview?.variants,
        variantsLength: preview?.variants?.length
      });
      
      if (!preview) {
        console.warn(`⚠️ Skipping null/undefined preview at index ${index}`);
        return;
      }
      
      const comparison = {
        vendorId: preview.vendorId,
        vendorName: preview.vendorName || `Vendor ${preview.vendorId}`,
        location: preview.vendorLocation || null,
        pricing: preview.pricing || { min: 0, max: 0, range: 'N/A' },
        mockupCount: Array.isArray(preview.mockupImages) ? preview.mockupImages.length : 0,
        variantCount: Array.isArray(preview.variants) ? preview.variants.length : 0,
        qualityScore: this.calculateQualityScore(preview),
        strengths: this.identifyStrengths(preview),
        concerns: this.identifyConcerns(preview)
      };

      report.comparisons.push(comparison);
    });

    // Generate recommendations only if we have valid comparisons
    if (report.comparisons.length > 0) {
      report.recommendations = this.generateRecommendations(report.comparisons);
    }

    return report;
  }

  /**
   * Calculate overall quality score for a preview
   */
  calculateQualityScore(preview) {
    let score = 0;
    
    if (!preview) return score;
    
    const mockupCount = Array.isArray(preview.mockupImages) ? preview.mockupImages.length : 0;
    const variantCount = Array.isArray(preview.variants) ? preview.variants.length : 0;
    const qualityMetrics = preview.qualityMetrics || {};
    
    // Base score from mockup availability
    if (mockupCount > 0) score += 2;
    if (mockupCount > 3) score += 1;
    
    // Enhancement quality
    if (qualityMetrics.enhancementApplied) score += 2;
    score += qualityMetrics.suitabilityScore || 0;
    
    // Variant availability
    if (variantCount > 5) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Identify vendor strengths
   */
  identifyStrengths(preview) {
    const strengths = [];
    
    if (!preview) return strengths;
    
    const mockupCount = Array.isArray(preview.mockupImages) ? preview.mockupImages.length : 0;
    const variantCount = Array.isArray(preview.variants) ? preview.variants.length : 0;
    const pricing = preview.pricing || {};
    const qualityMetrics = preview.qualityMetrics || {};
    
    if (mockupCount > 4) {
      strengths.push('Comprehensive mockup gallery');
    }
    
    if (variantCount > 10) {
      strengths.push('Wide variety of options');
    }
    
    if (pricing.min && pricing.min < 5) {
      strengths.push('Competitive pricing');
    }
    
    if (qualityMetrics.enhancementApplied) {
      strengths.push('Automatic quality enhancement');
    }
    
    return strengths;
  }

  /**
   * Identify potential concerns
   */
  identifyConcerns(preview) {
    const concerns = [];
    
    if (!preview) return concerns;
    
    const mockupCount = Array.isArray(preview.mockupImages) ? preview.mockupImages.length : 0;
    const variantCount = Array.isArray(preview.variants) ? preview.variants.length : 0;
    const pricing = preview.pricing || {};
    const qualityMetrics = preview.qualityMetrics || {};
    
    if (mockupCount < 2) {
      concerns.push('Limited mockup options');
    }
    
    if (variantCount < 5) {
      concerns.push('Few size/color options');
    }
    
    if (pricing.min && pricing.min > 10) {
      concerns.push('Higher pricing');
    }
    
    if (!qualityMetrics.enhancementApplied && qualityMetrics.suitabilityScore < 4) {
      concerns.push('Image quality concerns');
    }
    
    return concerns;
  }

  /**
   * Generate vendor recommendations
   */
  generateRecommendations(comparisons) {
    const recommendations = [];
    
    // Validate input
    if (!comparisons || !Array.isArray(comparisons) || comparisons.length === 0) {
      return recommendations;
    }
    
    // Filter out invalid comparisons
    const validComparisons = comparisons.filter(comp => comp && comp.pricing && typeof comp.qualityScore === 'number');
    
    if (validComparisons.length === 0) {
      return recommendations;
    }
    
    try {
      // Find best pricing
      const cheapest = validComparisons.reduce((min, comp) => {
        const minPrice = min.pricing?.min || Infinity;
        const compPrice = comp.pricing?.min || Infinity;
        return compPrice < minPrice ? comp : min;
      });
      
      if (cheapest && cheapest.pricing?.range) {
        recommendations.push({
          type: 'cost',
          title: 'Most Cost-Effective',
          vendor: cheapest.vendorName || 'Unknown Vendor',
          reason: `Lowest pricing at ${cheapest.pricing.range}`
        });
      }
      
      // Find highest quality
      const highestQuality = validComparisons.reduce((max, comp) => 
        comp.qualityScore > max.qualityScore ? comp : max
      );
      
      if (highestQuality) {
        recommendations.push({
          type: 'quality',
          title: 'Highest Quality',
          vendor: highestQuality.vendorName || 'Unknown Vendor',
          reason: `Best quality score: ${highestQuality.qualityScore}/10`
        });
      }
      
      // Find most versatile
      const mostVersatile = validComparisons.reduce((max, comp) => 
        comp.variantCount > max.variantCount ? comp : max
      );
      
      if (mostVersatile) {
        recommendations.push({
          type: 'versatility',
          title: 'Most Options',
          vendor: mostVersatile.vendorName || 'Unknown Vendor',
          reason: `${mostVersatile.variantCount} variants available`
        });
      }
    } catch (error) {
      console.warn('Error generating recommendations:', error);
    }
    
    return recommendations;
  }

  /**
   * Store vendor preview comparison for future reference
   */
  async storePreviewComparison(userId, comparisonData) {
    try {
      console.log('🔄 Sanitizing comparison data for Firebase storage...');
      
      // Deep sanitize the comparison data to remove all undefined values
      const sanitizedData = this.sanitizeForFirebase({
        id: `comparison-${Date.now()}`,
        ...comparisonData,
        storedAt: new Date().toISOString()
      });
      
      console.log('✅ Data sanitized, storing to Firebase...');
      await this.merchandiseDB.storeVendorComparison(userId, sanitizedData);
      
      console.log('✅ Vendor comparison stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to store vendor comparison:', error);
      throw error; // Re-throw to see the full error in the calling code
    }
  }

  /**
   * Recursively sanitize data for Firebase storage
   */
  sanitizeForFirebase(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirebase(item)).filter(item => item !== null && item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedValue = this.sanitizeForFirebase(value);
        if (sanitizedValue !== undefined && sanitizedValue !== null) {
          sanitized[key] = sanitizedValue;
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Get cached preview for specific image, product type, and vendor combination
   */
  async getCachedPreview(imageId, productType, vendorId) {
    try {
      const cacheKey = this.generatePreviewCacheKey(imageId, productType, vendorId);
      const cached = await this.merchandiseDB.getCachedPreview(cacheKey);
      
      if (cached) {
        // Check if cache is still valid (e.g., not older than 7 days)
        const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();
        const maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (cacheAge < maxCacheAge) {
          console.log(`🎯 Found valid cached preview: ${cacheKey}`);
          // Ensure cached data has all required properties
          const previewData = cached.previewData || {};
          const cachedPreview = {
            vendorId: previewData.vendorId,
            vendorName: previewData.vendorName || `Vendor ${previewData.vendorId}`,
            vendorLocation: previewData.vendorLocation || null,
            productId: previewData.productId || `cached-${previewData.vendorId}-${Date.now()}`,
            mockupImages: Array.isArray(previewData.mockupImages) ? previewData.mockupImages : [],
            variants: Array.isArray(previewData.variants) ? previewData.variants : [],
            pricing: previewData.pricing || { min: 0, max: 0, range: 'N/A' },
            qualityMetrics: previewData.qualityMetrics || { 
              imageQuality: 'N/A',
              printResolution: 'N/A',
              enhancementApplied: false,
              suitabilityScore: 0
            },
            printDetails: previewData.printDetails || {
              blueprint: null,
              provider: previewData.vendorId,
              printAreas: []
            },
            status: previewData.status || 'cached',
            error: previewData.error || null,
            imageEnhancement: previewData.imageEnhancement || {
              autoEnhanced: false,
              enhancementSource: 'cached',
              printQualityEnsured: false,
              dpiOptimized: false
            },
            generatedAt: previewData.generatedAt || cached.cachedAt,
            fromCache: true,
            cachedAt: cached.cachedAt
          };
          return cachedPreview;
        } else {
          console.log(`⏰ Cache expired for ${cacheKey}, will regenerate`);
          // Clean up expired cache
          await this.merchandiseDB.deleteCachedPreview(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get cached preview:', error);
      return null;
    }
  }

  /**
   * Cache a generated preview for future reuse
   */
  async cachePreview(imageId, productType, vendorId, previewData) {
    try {
      const cacheKey = this.generatePreviewCacheKey(imageId, productType, vendorId);
      
      // Store the preview data without sensitive information and sanitize undefined values
      const cacheData = {
        vendorId: previewData.vendorId,
        vendorName: previewData.vendorName || `Vendor ${vendorId}`,
        vendorLocation: previewData.vendorLocation || null,
        mockupImages: previewData.mockupImages || [],
        variants: previewData.variants || [],
        pricing: previewData.pricing || { min: 0, max: 0, range: 'N/A' },
        qualityMetrics: previewData.qualityMetrics || { overall: 0, details: {} },
        printDetails: previewData.printDetails || {
          blueprint: null,
          provider: vendorId,
          printAreas: []
        },
        status: previewData.status || 'unknown',
        error: previewData.error || null,
        imageEnhancement: previewData.imageEnhancement || {
          autoEnhanced: false,
          enhancementSource: 'none',
          printQualityEnsured: false,
          dpiOptimized: false
        },
        // Don't cache productId as it may be temporary
        // Don't cache cacheOptimization as it can contain undefined values
        cachedAt: new Date().toISOString()
      };
      
      await this.merchandiseDB.setCachedPreview(cacheKey, {
        previewData: cacheData,
        cachedAt: new Date().toISOString(),
        imageId,
        productType,
        vendorId
      });
      
      console.log(`💾 Cached preview: ${cacheKey}`);
      return true;
    } catch (error) {
      console.warn('Failed to cache preview:', error);
      return false;
    }
  }

  /**
   * Generate cache key for preview storage
   */
  generatePreviewCacheKey(imageId, productType, vendorId) {
    // Use a hash of the image content + product type + vendor for consistency
    const crypto = require('crypto');
    const keyData = `${imageId}-${productType}-${vendorId}`;
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  /**
   * Get compatible blueprint-provider combination for a product type and vendor
   * This prevents 404 errors by ensuring the combination is valid
   */
  async getCompatibleBlueprintForVendor(productType, vendorId, preferredBlueprintId = null) {
    // If specific blueprint requested, try to use it
    if (preferredBlueprintId) {
      console.log(`🎯 Attempting to use preferred blueprint ${preferredBlueprintId} with vendor ${vendorId}`);
    }
    
    // Known working combinations based on Printify API testing
    // Updated based on environment validation test results
    const compatibleCombinations = {
      'mug': [
        // Blueprint 68 is NOT compatible with provider 3 (detected by test)
        { blueprintId: 68, vendorIds: [1, 7], name: 'Mug 11oz' },
      ],
      'premium-tshirt': [
        // Blueprint 5 IS compatible with provider 3 (confirmed by test)
        { blueprintId: 5, vendorIds: [1, 3, 7], name: 'Unisex Cotton Crew Tee' },
        { blueprintId: 6, vendorIds: [1, 3, 7], name: 'Unisex Heavy Cotton Tee' },
        { blueprintId: 9, vendorIds: [1, 3, 7], name: "Women's Favorite Tee" },
      ],
      'poster': [
        { blueprintId: 97, vendorIds: [1], name: 'Satin Posters (210gsm)' },
        { blueprintId: 282, vendorIds: [1], name: 'Matte Vertical Posters' },
      ],
      'hoodie': [
        { blueprintId: 77, vendorIds: [1, 7], name: 'Unisex Heavy Blend™ Hooded Sweatshirt' }, // Conservative: remove provider 3 until tested
        { blueprintId: 49, vendorIds: [1, 7], name: 'Unisex Heavy Blend™ Crewneck Sweatshirt' }, // Conservative: remove provider 3 until tested
      ]
    };

    const productCombinations = compatibleCombinations[productType] || [];
    
    // VALIDATION: Log what blueprints are available for this product type
    console.log(`📋 Available blueprints for ${productType}:`, productCombinations.map(c => `${c.blueprintId} (${c.name})`).join(', '));
    
    // If preferred blueprint specified, try to use it first
    if (preferredBlueprintId) {
      const preferredCombo = productCombinations.find(c => c.blueprintId === preferredBlueprintId && c.vendorIds.includes(vendorId));
      if (preferredCombo) {
        console.log(`✅ USING PREFERRED BLUEPRINT ${preferredBlueprintId}: ${preferredCombo.name} with Vendor ${vendorId}`);
        return {
          name: preferredCombo.name,
          blueprintId: preferredCombo.blueprintId,
          printProviderId: vendorId,
          basePrice: 1500,
          tags: [productType, 'preview'],
          description: `Vendor preview ${preferredCombo.name}`
        };
      } else {
        console.warn(`⚠️ PREFERRED BLUEPRINT ${preferredBlueprintId} NOT COMPATIBLE with vendor ${vendorId}, falling back...`);
      }
    }
    
    // Find a combination that supports this vendor
    for (const combo of productCombinations) {
      if (combo.vendorIds.includes(vendorId)) {
        console.log(`✅ Found compatible combination: ${combo.name} (Blueprint ${combo.blueprintId}) with Vendor ${vendorId}`);
        if (preferredBlueprintId && combo.blueprintId !== preferredBlueprintId) {
          console.warn(`⚠️ BLUEPRINT MISMATCH: Requested ${preferredBlueprintId}, using ${combo.blueprintId} instead`);
        }
        return {
          name: combo.name,
          blueprintId: combo.blueprintId,
          printProviderId: vendorId,
          basePrice: 1500,
          tags: [productType, 'preview'],
          description: `Vendor preview ${combo.name}`
        };
      }
    }

    // If no exact match, try to find any working combination for this vendor
    console.warn(`⚠️ No specific combination found for ${productType} with vendor ${vendorId}, trying fallback...`);
    
    // Fallback to known working combinations for this vendor
    // Updated based on test results - removed invalid vendor 4
    const fallbackCombinations = {
      1: { blueprintId: 5, name: 'Unisex Cotton Crew Tee' }, // Vendor 1 works with t-shirts
      3: { blueprintId: 5, name: 'Unisex Cotton Crew Tee' }, // Vendor 3 works with blueprint 5 (confirmed by test)
      7: { blueprintId: 5, name: 'Unisex Cotton Crew Tee' }, // Vendor 7 works with t-shirts
    };

    const fallback = fallbackCombinations[vendorId];
    if (fallback) {
      console.log(`✅ Using fallback combination: ${fallback.name} (Blueprint ${fallback.blueprintId}) with Vendor ${vendorId}`);
      return {
        name: fallback.name,
        blueprintId: fallback.blueprintId,
        printProviderId: vendorId,
        basePrice: 1500,
        tags: [productType, 'preview', 'fallback'],
        description: `Vendor preview ${fallback.name} (fallback)`
      };
    }

    console.error(`❌ No compatible blueprint found for product type ${productType} with vendor ${vendorId}`);
    return null;
  }

  /**
   * Generate a single vendor preview (used by API routes)
   * @param {string} imageId - Gallery image ID
   * @param {string} productType - Type of product to create
   * @param {string} userId - User creating the preview
   * @returns {Object} Result with success status and product info
   */
  async generateVendorPreview(imageId, productType, userId, options = {}) {
    console.log('🎨 Generating single vendor preview:', { imageId, productType, userId, blueprintId: options.blueprintId });

    try {
      // ENHANCED VALIDATION: Prevent orphaned entries and validate users
      const TestUserValidator = require('../utils/test-user-validator');
      
      if (!imageId || typeof imageId !== 'string' || imageId.trim() === '') {
        throw new Error('Invalid imageId: must be a non-empty string');
      }
      
      if (!productType || typeof productType !== 'string' || productType.trim() === '') {
        throw new Error('Invalid productType: must be a non-empty string');
      }
      
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid userId: must be a non-empty string');
      }

      // CRITICAL: Validate user for product creation
      const userValidation = await TestUserValidator.validateUserForProductCreation(userId, {
        testMode: process.env.NODE_ENV === 'test',
        validateUserExists: false // Skip Firebase Auth check for now
      });

      if (!userValidation.valid) {
        throw new Error(`User validation failed: ${userValidation.errors.join(', ')}`);
      }

      // Log warnings about test users in production
      if (userValidation.warnings.length > 0) {
        console.warn('⚠️ User validation warnings:', userValidation.warnings);
      }

      // Use test database prefix if needed
      if (userValidation.shouldUseTestDatabase) {
        console.log('🧪 Using test database isolation for test user');
      }

      // Use default vendor for single preview generation
      const defaultVendorId = 3; // Known working vendor
      const vendorIds = [defaultVendorId];

      console.log(`✅ Validation passed - generating preview with vendor ${defaultVendorId}`);

      // Call the existing generateVendorPreviews method
      const result = await this.generateVendorPreviews(imageId, productType, vendorIds, {
        previewMode: true,
        createdBy: userId,
        blueprintId: options.blueprintId,
        runId: `single-preview-${Date.now()}`,
        isTestUser: userValidation.isTestUser,
        useTestDatabase: userValidation.shouldUseTestDatabase,
        bypassCache: true,
        userId: userId
      });

      if (result.success && result.previews && result.previews.length > 0) {
        const preview = result.previews[0];
        
        // Additional validation of the generated preview
        if (!preview.productId || preview.productId === 'undefined' || preview.productId.startsWith('cached-') || preview.productId.startsWith('failed-')) {
          throw new Error(`Generated preview has invalid productId: ${preview.productId}`);
        }

        // Store in database with productId as key
        await this.merchandiseDB.setCachedPreview(preview.productId, {
          productId: preview.productId,
          sourceImage: imageId,
          productType: productType,
          vendorId: preview.vendorId,
          blueprintId: preview.printDetails?.blueprint,
          providerId: preview.printDetails?.provider,
          imageUrl: preview.mockupImages?.[0]?.src || null,
          createdBy: userId,
          createdAt: new Date().toISOString()
        });

        return {
          success: true,
          productId: preview.productId,
          vendorId: preview.vendorId,
          message: 'Single vendor preview generated successfully',
          userValidation: {
            isTestUser: userValidation.isTestUser,
            warnings: userValidation.warnings
          }
        };
      } else {
        throw new Error('Failed to generate vendor preview - no valid previews returned');
      }

    } catch (error) {
      console.error('❌ Single vendor preview generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = VendorPreviewService;