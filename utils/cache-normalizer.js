/**
 * Cache Response Standardization
 * Ensures cache hits and misses return identical data structures
 */

const DefensiveWrappers = require('./defensive-wrappers');
const { ServiceResponse } = require('./service-patterns');

class CacheResponseNormalizer {
  /**
   * Normalize upscaling result to standard format
   * Handles both cache hits and fresh generations
   */
  static normalizeUpscalingResult(rawResult, context = 'upscaling') {
    if (!rawResult || !rawResult.success) {
      return ServiceResponse.error('Invalid upscaling result', { context });
    }

    const normalized = {
      success: true,
      method: rawResult.method || 'unknown',
      cached: rawResult.cached || false,
      
      // CRITICAL: Always ensure buffer is available
      imageBuffer: null,
      upscaledBuffer: null, // Legacy compatibility
      printOptimized: null, // Legacy compatibility
      
      // URLs and keys
      upscaledUrl: rawResult.upscaledUrl || rawResult.enhancedUrl,
      enhancedUrl: rawResult.enhancedUrl || rawResult.upscaledUrl,
      s3Key: rawResult.s3Key,
      
      // Metadata normalization
      metadata: this.normalizeMetadata(rawResult.metadata || rawResult, context)
    };

    // Handle buffer presence/absence
    if (rawResult.upscaledBuffer && Buffer.isBuffer(rawResult.upscaledBuffer)) {
      normalized.imageBuffer = rawResult.upscaledBuffer;
      normalized.upscaledBuffer = rawResult.upscaledBuffer;
      normalized.printOptimized = rawResult.printOptimized || rawResult.upscaledBuffer;
    } else if (rawResult.cached && (rawResult.upscaledUrl || rawResult.enhancedUrl)) {
      // Cache hit case - mark that buffer needs to be downloaded
      normalized.needsBufferDownload = true;
      normalized.downloadUrl = rawResult.upscaledUrl || rawResult.enhancedUrl;
      console.log(`⚠️ ${context}: Cache hit requires buffer download from ${normalized.downloadUrl}`);
    }

    return ServiceResponse.success(normalized, { 
      context, 
      method: normalized.method,
      cached: normalized.cached,
      hasBuffer: !!normalized.imageBuffer,
      needsDownload: !!normalized.needsBufferDownload
    });
  }

  /**
   * Normalize metadata to prevent signature mismatches
   */
  static normalizeMetadata(metadata, context = 'metadata') {
    if (!metadata) {
      console.warn(`⚠️ ${context}: No metadata provided, using defaults`);
      return {
        url: null,
        s3Key: null,
        enhancementMethod: 'unknown',
        dimensions: { width: 1024, height: 1024 },
        processedDimensions: '1024x1024',
        enhancedDimensions: { width: 1024, height: 1024 },
        scaleFactor: 1.0,
        fileSize: 0
      };
    }

    const normalized = { ...metadata };

    // Normalize dimensions to both formats
    const dimensions = DefensiveWrappers.safeParseDimensions(
      metadata.processedDimensions || metadata.enhancedDimensions,
      context
    );

    normalized.enhancedDimensions = { width: dimensions.width, height: dimensions.height };
    normalized.processedDimensions = dimensions.string;

    // Ensure required fields exist
    normalized.url = normalized.url || normalized.enhancedUrl || normalized.upscaledUrl;
    normalized.enhancementMethod = normalized.enhancementMethod || normalized.method || 'unknown';
    normalized.scaleFactor = normalized.scaleFactor || 1.0;
    normalized.fileSize = normalized.fileSize || 0;

    console.log(`✅ ${context}: Metadata normalized with dimensions ${dimensions.string}`);
    return normalized;
  }

  /**
   * Ensure cache result has proper buffer available
   * This is the critical fix for cache signature mismatches
   */
  static async ensureBufferAvailable(normalizedResult, downloadFn, context = 'cache') {
    if (normalizedResult.data.imageBuffer) {
      console.log(`✅ ${context}: Buffer already available (${normalizedResult.data.imageBuffer.length} bytes)`);
      return normalizedResult;
    }

    if (normalizedResult.data.needsBufferDownload && normalizedResult.data.downloadUrl) {
      try {
        console.log(`📥 ${context}: Downloading buffer from cache URL`);
        const buffer = await downloadFn(normalizedResult.data.downloadUrl);
        
        const validation = DefensiveWrappers.safeValidateBuffer(buffer, context);
        if (!validation.valid) {
          throw new Error(`Downloaded buffer validation failed: ${validation.error}`);
        }

        // Update normalized result with buffer
        normalizedResult.data.imageBuffer = buffer;
        normalizedResult.data.upscaledBuffer = buffer;
        normalizedResult.data.printOptimized = buffer;
        normalizedResult.data.needsBufferDownload = false;
        
        console.log(`✅ ${context}: Buffer downloaded and validated (${validation.size} bytes)`);
        return normalizedResult;
        
      } catch (error) {
        console.error(`🚨 ${context}: Failed to download buffer:`, error.message);
        return ServiceResponse.error(`Cache buffer download failed: ${error.message}`, { context });
      }
    }

    console.error(`🚨 ${context}: No buffer available and no download URL`);
    return ServiceResponse.error('No image buffer available from cache', { context });
  }
}

module.exports = CacheResponseNormalizer;