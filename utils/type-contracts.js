/**
 * Type Contracts and Interface Definitions
 * Prevents signature mismatches by defining standard interfaces
 */

class TypeContracts {
  /**
   * Standard Image Processing Result Interface
   * All image processing methods must return this structure
   */
  static ImageProcessingResult = {
    success: 'boolean',
    method: 'string', // 'cache', 'openai', 'replicate', etc.
    imageBuffer: 'Buffer|null', // ALWAYS provide buffer or explicit null
    metadata: {
      url: 'string',
      s3Key: 'string',
      dimensions: {
        width: 'number',
        height: 'number'
      },
      fileSize: 'number',
      contentHash: 'string',
      enhancementMethod: 'string'
    },
    cached: 'boolean'
  };

  /**
   * Validate image processing result matches contract
   */
  static validateImageProcessingResult(result, context = 'unknown') {
    const errors = [];
    
    if (typeof result.success !== 'boolean') {
      errors.push('success must be boolean');
    }
    
    if (typeof result.method !== 'string') {
      errors.push('method must be string');
    }
    
    // Critical: Buffer validation
    if (result.imageBuffer !== null && !Buffer.isBuffer(result.imageBuffer)) {
      errors.push('imageBuffer must be Buffer or explicit null');
    }
    
    if (!result.metadata || typeof result.metadata !== 'object') {
      errors.push('metadata must be object');
    } else {
      if (!result.metadata.url) errors.push('metadata.url required');
      if (!result.metadata.s3Key) errors.push('metadata.s3Key required');
    }
    
    if (errors.length > 0) {
      console.error(`🚨 CONTRACT VIOLATION in ${context}:`, errors);
      return { valid: false, errors };
    }
    
    console.log(`✅ CONTRACT VALIDATION PASSED for ${context}`);
    return { valid: true, errors: [] };
  }

  /**
   * Standard Enhancement Metadata Interface
   */
  static EnhancementMetadata = {
    url: 'string',
    s3Key: 'string',
    enhancementMethod: 'string',
    dimensions: 'string|object', // Accept both "1024x1024" and {width: 1024, height: 1024}
    scaleFactor: 'number',
    fileSize: 'number'
  };

  /**
   * Normalize enhancement metadata to standard format
   */
  static normalizeEnhancementMetadata(metadata) {
    if (!metadata) return null;
    
    const normalized = { ...metadata };
    
    // Normalize dimensions to both formats for compatibility
    if (metadata.processedDimensions && typeof metadata.processedDimensions === 'string') {
      const [width, height] = metadata.processedDimensions.split('x').map(d => parseInt(d));
      normalized.enhancedDimensions = { width, height };
    }
    
    if (metadata.enhancedDimensions && !metadata.processedDimensions) {
      normalized.processedDimensions = `${metadata.enhancedDimensions.width}x${metadata.enhancedDimensions.height}`;
    }
    
    return normalized;
  }
}

module.exports = TypeContracts;