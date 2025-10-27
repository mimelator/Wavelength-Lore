/**
 * WAVELENGTH Product Validation Service
 * 
 * Handles all product validation logic including:
 * - Completeness checks
 * - Broken product detection
 * - Status determination
 * - Validation rules
 */

class MerchandiseProductValidationService {
  constructor() {
    this.validationRules = {
      minImages: 1,
      minVariants: 1,
      requiredFields: ['id', 'title'],
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      minTitleLength: 3,
      maxTitleLength: 200
    };
  }
  
  /**
   * Check if a product is complete and ready for use
   * @param {Object} product - Product object to validate
   * @returns {boolean} True if product is complete
   */
  isProductComplete(product) {
    if (!product) {
      return false;
    }
    
    try {
      const hasVariants = product.variants && product.variants.length > 0;
      const hasImages = product.images && product.images.length > 0;
      const hasSourceImage = product.sourceImage && product.sourceImage.url;
      const hasTitle = product.title && product.title.length >= this.validationRules.minTitleLength;
      
      // A product is complete if it has:
      // 1. Variants AND images (normal case for clothing)
      // 2. OR just images with source image (some products like mugs might work differently)
      // 3. OR has at least source image and some processing data (minimum viable)
      return (hasVariants && hasImages && hasTitle) || 
             (hasImages && hasSourceImage && hasTitle) ||
             (hasSourceImage && hasTitle && !this.isProductBroken(product));
             
    } catch (error) {
      console.error('Error checking product completeness:', error);
      return false;
    }
  }
  
  /**
   * Check if a product is broken (completely unusable)
   * @param {Object} product - Product object to validate
   * @returns {boolean} True if product is broken
   */
  isProductBroken(product) {
    if (!product) {
      return true;
    }
    
    try {
      const hasVariants = product.variants && product.variants.length > 0;
      const hasImages = product.images && product.images.length > 0;
      const hasSourceImage = product.sourceImage && product.sourceImage.url;
      const hasTitle = product.title && product.title.trim().length > 0;
      const hasId = product.id || product.productId;
      
      // Check if completely empty
      const isCompletelyEmpty = !hasVariants && !hasImages && !hasSourceImage && !hasTitle;
      
      // Check if old and incomplete (created more than 30 days ago without essential data)
      const createdDate = product.createdAt ? new Date(product.createdAt) : new Date();
      const isOld = Date.now() - createdDate.getTime() > this.validationRules.maxAge;
      const isOldAndIncomplete = isOld && (!hasVariants && !hasImages);
      
      // Check if missing critical fields
      const missingCriticalFields = !hasId || !hasTitle;
      
      return isCompletelyEmpty || isOldAndIncomplete || missingCriticalFields;
      
    } catch (error) {
      console.error('Error checking if product is broken:', error);
      return true; // Assume broken if we can't validate
    }
  }
  
  /**
   * Get product status with detailed information
   * @param {Object} product - Product object to validate
   * @returns {Object} Status object with details
   */
  getProductStatus(product) {
    if (!product) {
      return {
        status: 'invalid',
        message: 'Product data is missing',
        issues: ['No product data provided'],
        canUse: false,
        canEdit: false
      };
    }
    
    try {
      const issues = [];
      const warnings = [];
      
      // Check basic fields
      if (!product.id && !product.productId) {
        issues.push('Missing product ID');
      }
      
      if (!product.title || product.title.trim().length === 0) {
        issues.push('Missing product title');
      } else if (product.title.length < this.validationRules.minTitleLength) {
        warnings.push(`Title too short (${product.title.length} chars, min ${this.validationRules.minTitleLength})`);
      }
      
      // Check images and variants
      const hasVariants = product.variants && product.variants.length > 0;
      const hasImages = product.images && product.images.length > 0;
      const hasSourceImage = product.sourceImage && product.sourceImage.url;
      
      if (!hasVariants) {
        issues.push('No product variants found');
      }
      
      if (!hasImages && !hasSourceImage) {
        issues.push('No product images found');
      }
      
      if (!hasSourceImage) {
        warnings.push('No source image available');
      }
      
      // Determine overall status
      let status, message, canUse, canEdit;
      
      if (this.isProductBroken(product)) {
        status = 'broken';
        message = 'Product is broken and cannot be used';
        canUse = false;
        canEdit = false;
      } else if (this.isProductComplete(product)) {
        status = 'complete';
        message = 'Product is ready to use';
        canUse = true;
        canEdit = true;
      } else if (issues.length === 0) {
        status = 'incomplete';
        message = 'Product is being processed';
        canUse = false;
        canEdit = true;
      } else {
        status = 'invalid';
        message = 'Product has validation errors';
        canUse = false;
        canEdit = true;
      }
      
      return {
        status,
        message,
        issues,
        warnings,
        canUse,
        canEdit,
        hasVariants,
        hasImages,
        hasSourceImage,
        variantCount: hasVariants ? product.variants.length : 0,
        imageCount: hasImages ? product.images.length : 0
      };
      
    } catch (error) {
      console.error('Error getting product status:', error);
      return {
        status: 'error',
        message: 'Error validating product',
        issues: ['Validation failed: ' + error.message],
        canUse: false,
        canEdit: false
      };
    }
  }
  
  /**
   * Validate product creation data
   * @param {Object} productData - Data for creating a product
   * @returns {Object} Validation result
   */
  validateProductCreationData(productData) {
    const errors = [];
    const warnings = [];
    
    try {
      // Required fields
      if (!productData.imageId) {
        errors.push('Image ID is required');
      }
      
      if (!productData.productType) {
        errors.push('Product type is required');
      }
      
      // Optional but recommended fields
      if (!productData.title || productData.title.trim().length === 0) {
        warnings.push('Product title not provided - will be auto-generated');
      }
      
      if (!productData.description) {
        warnings.push('Product description not provided - will be auto-generated');
      }
      
      // Validate title length if provided
      if (productData.title) {
        if (productData.title.length < this.validationRules.minTitleLength) {
          errors.push(`Title too short (minimum ${this.validationRules.minTitleLength} characters)`);
        }
        if (productData.title.length > this.validationRules.maxTitleLength) {
          errors.push(`Title too long (maximum ${this.validationRules.maxTitleLength} characters)`);
        }
      }
      
      // Validate customization options
      if (productData.customization) {
        if (productData.customization.borderStyle && 
            !['none', 'thin', 'medium', 'thick'].includes(productData.customization.borderStyle)) {
          warnings.push('Invalid border style - will use default');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0
      };
      
    } catch (error) {
      console.error('Error validating product creation data:', error);
      return {
        valid: false,
        errors: ['Validation failed: ' + error.message],
        warnings: [],
        canProceed: false
      };
    }
  }
  
  /**
   * Get validation rules
   * @returns {Object} Current validation rules
   */
  getValidationRules() {
    return { ...this.validationRules };
  }
  
  /**
   * Update validation rules
   * @param {Object} newRules - New rules to merge
   */
  updateValidationRules(newRules) {
    this.validationRules = { ...this.validationRules, ...newRules };
  }
  
  /**
   * Validate multiple products
   * @param {Array} products - Array of products to validate
   * @returns {Object} Batch validation results
   */
  validateProductBatch(products) {
    if (!Array.isArray(products)) {
      return {
        total: 0,
        complete: 0,
        broken: 0,
        incomplete: 0,
        results: []
      };
    }
    
    const results = products.map(product => ({
      product,
      ...this.getProductStatus(product)
    }));
    
    const summary = {
      total: products.length,
      complete: results.filter(r => r.status === 'complete').length,
      broken: results.filter(r => r.status === 'broken').length,
      incomplete: results.filter(r => r.status === 'incomplete').length,
      invalid: results.filter(r => r.status === 'invalid').length,
      results
    };
    
    return summary;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseProductValidationService;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseProductValidationService = MerchandiseProductValidationService;
}