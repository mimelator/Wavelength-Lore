/**
 * Vendor Preview Helper
 * 
 * Reusable helper functions for storing and retrieving vendor preview products.
 * Used by both API preview builder and merchandise UI to ensure consistent behavior.
 */

const RuntimeDiagnostics = require('./runtime-diagnostics');

class VendorPreviewHelper {
  constructor() {
    this.diagnostics = new RuntimeDiagnostics('VendorPreviewHelper');
    this.merchandiseDB = require('../services/merchandise-database');
  }

  /**
   * Store a vendor preview product in the cache
   * @param {Object} productData - Product data from Printify service
   * @param {Object} metadata - Additional metadata for the preview
   * @returns {Object} Storage result with success status
   */
  async storeVendorPreview(productData, metadata = {}) {
    // ENHANCED DIAGNOSTICS: Parameter validation
    const paramValidation = this.diagnostics.validateMethodParameters('storeVendorPreview', {
      productData,
      metadata
    }, {
      productData: 'object',
      metadata: 'object'
    });

    try {
      console.log('💾 VENDOR PREVIEW STORAGE: Storing preview in cache...');
      
      // Validate required product data
      if (!productData?.product?.productId) {
        throw new Error('Invalid productData: missing product.productId');
      }

      const productId = productData.product.productId;
      console.log(`   Product ID: ${productId}`);
      console.log(`   Title: ${productData.product.title || 'N/A'}`);
      console.log(`   Source: ${metadata.sourceImage || metadata.imageUrl || 'N/A'}`);

      // Create standardized vendor preview data structure
      const vendorPreviewData = {
        productId: productId,
        title: productData.product.title,
        sourceImage: metadata.sourceImage || metadata.title || 'Unknown Source',
        blueprintId: metadata.blueprintId || productData.product.blueprint_id,
        providerId: metadata.providerId || productData.product.print_provider_id,
        createdAt: new Date().toISOString(),
        runId: metadata.runId || `vendor-preview-${Date.now()}`,
        imageUrl: metadata.imageUrl || metadata.originalUrl,
        isVendorPreview: true,
        createdBy: metadata.createdBy || 'system',
        tags: metadata.tags || ['vendor-preview'],
        
        // Store full product data for UI access (filter out undefined values)
        printifyProduct: {
          id: productData.product.id || null,
          title: productData.product.title || null,
          description: productData.product.description || null,
          tags: productData.product.tags || [],
          images: productData.product.images || [],
          variants: productData.product.variants || [],
          blueprint_id: productData.product.blueprint_id || null,
          print_provider_id: productData.product.print_provider_id || null,
          print_areas: productData.product.print_areas || []
        }
      };

      console.log('📊 Vendor preview data structure:');
      console.log(`   Product ID: ${vendorPreviewData.productId}`);
      console.log(`   Blueprint: ${vendorPreviewData.blueprintId}`);
      console.log(`   Provider: ${vendorPreviewData.providerId}`);
      console.log(`   Created By: ${vendorPreviewData.createdBy}`);

      // Store in cache using the product ID as key
      const cacheStored = await this.merchandiseDB.setCachedPreview(
        productId, 
        vendorPreviewData
      );

      if (cacheStored) {
        console.log('   ✅ Vendor preview stored successfully');
        return {
          success: true,
          productId: productId,
          cacheKey: productId,
          vendorPreviewData: vendorPreviewData
        };
      } else {
        console.error('   ❌ Failed to store vendor preview');
        return {
          success: false,
          error: 'Cache storage failed',
          productId: productId
        };
      }

    } catch (error) {
      console.error('❌ VENDOR PREVIEW STORAGE ERROR:', error.message);
      return {
        success: false,
        error: error.message,
        productId: productData?.product?.productId || 'unknown'
      };
    }
  }

  /**
   * Retrieve a vendor preview or user product by ID
   * @param {string} productId - Product ID to lookup
   * @param {string} userId - User ID (optional, for user product lookup)
   * @returns {Object} Product data with source information
   */
  async getProductByIdWithFallback(productId, userId = null) {
    console.log(`🔍 PRODUCT LOOKUP: Searching for product ${productId}`);
    console.log(`   User ID: ${userId || 'N/A (vendor preview only)'}`);

    try {
      let userProduct = null;
      let vendorPreview = null;

      // Step 1: Check user products if userId provided
      if (userId) {
        console.log('   🔍 Checking user products...');
        userProduct = await this.merchandiseDB.getUserProduct(userId, productId);
        console.log(`   User Product Found: ${userProduct ? '✅' : '❌'}`);
      }

      // Step 2: Check vendor preview cache
      console.log('   🔍 Checking vendor preview cache...');
      vendorPreview = await this.merchandiseDB.getCachedPreview(productId);
      console.log(`   Vendor Preview Found: ${vendorPreview ? '✅' : '❌'}`);

      if (vendorPreview) {
        console.log('   📊 Vendor Preview Details:', {
          title: vendorPreview.title,
          sourceImage: vendorPreview.sourceImage,
          createdBy: vendorPreview.createdBy,
          blueprintId: vendorPreview.blueprintId
        });
      }

      // Step 3: Return result with metadata
      if (userProduct) {
        console.log('   ✅ RESULT: Using user product data');
        return {
          found: true,
          source: 'user-product',
          productData: userProduct,
          isVendorPreview: false
        };
      } else if (vendorPreview) {
        console.log('   ✅ RESULT: Using vendor preview data');
        return {
          found: true,
          source: 'vendor-preview',
          productData: vendorPreview,
          isVendorPreview: true
        };
      } else {
        console.log('   ❌ RESULT: Product not found in user products OR vendor previews');
        return {
          found: false,
          source: null,
          productData: null,
          isVendorPreview: false
        };
      }

    } catch (error) {
      console.error('❌ PRODUCT LOOKUP ERROR:', error.message);
      return {
        found: false,
        source: 'error',
        productData: null,
        isVendorPreview: false,
        error: error.message
      };
    }
  }

  /**
   * Store a user-created product (when user creates from gallery)
   * @param {string} userId - User ID
   * @param {Object} productData - Product data from Printify service
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Storage result
   */
  async storeUserProduct(userId, productData, metadata = {}) {
    console.log(`💾 USER PRODUCT STORAGE: Storing product for user ${userId}`);
    
    try {
      const productId = productData.product.productId;
      
      // Create user product data structure
      const userProductData = {
        productId: productId,
        title: productData.product.title,
        sourceImage: metadata.sourceImage || metadata.imageUrl,
        createdAt: new Date().toISOString(),
        blueprintId: metadata.blueprintId || productData.product.blueprint_id,
        providerId: metadata.providerId || productData.product.print_provider_id,
        isUserCreated: true,
        originalImageUrl: metadata.originalImageUrl,
        enhancedImageUrl: metadata.enhancedImageUrl
      };

      // Store as user product (this will use the existing storeProduct method)
      const stored = await this.merchandiseDB.storeProduct(userId, userProductData);
      
      if (stored) {
        console.log('   ✅ User product stored successfully');
        return {
          success: true,
          productId: productId,
          userId: userId,
          userProductData: userProductData
        };
      } else {
        console.error('   ❌ Failed to store user product');
        return {
          success: false,
          error: 'User product storage failed',
          productId: productId
        };
      }

    } catch (error) {
      console.error('❌ USER PRODUCT STORAGE ERROR:', error.message);
      return {
        success: false,
        error: error.message,
        productId: productData?.product?.productId || 'unknown'
      };
    }
  }

  /**
   * Get all vendor preview products from cache
   * @returns {Array} Array of all vendor preview products
   */
  async getAllVendorPreviews() {
    try {
      console.log('📋 Fetching all vendor preview products...');
      
      // Get all cached vendor previews
      const previews = await this.merchandiseDB.getAllVendorPreviews();
      
      console.log(`✅ Found ${previews.length} vendor preview products`);
      return previews;
    } catch (error) {
      console.error('❌ ERROR FETCHING VENDOR PREVIEWS:', error.message);
      return [];
    }
  }

  /**
   * Generate a product view URL
   * @param {string} productId - Product ID
   * @param {string} baseUrl - Base URL for the application
   * @returns {string} Complete product URL
   */
  generateProductUrl(productId, baseUrl = 'http://localhost:3001') {
    return `${baseUrl}/merchandise/product/${productId}`;
  }

  /**
   * Get a specific vendor preview product by ID
   * @param {string} productId - Product ID to lookup
   * @returns {Object|null} Vendor preview data or null if not found
   */
  async getVendorPreviewById(productId) {
    try {
      console.log(`🔍 Looking up vendor preview: ${productId}`);
      
      // Get all vendor previews and find the matching one
      const allPreviews = await this.getAllVendorPreviews();
      const preview = allPreviews.find(p => p.productId === productId);
      
      if (preview) {
        console.log(`✅ Found vendor preview: ${preview.title}`);
        return preview;
      } else {
        console.log(`❌ Vendor preview not found: ${productId}`);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR LOOKING UP VENDOR PREVIEW:', error.message);
      return null;
    }
  }
}

module.exports = VendorPreviewHelper;