/**
 * MerchandiseApiService
 * 
 * Handles all API communications for the merchandise store.
 * Extracted from MerchandiseStore class to improve separation of concerns.
 * 
 * Responsibilities:
 * - Product CRUD operations
 * - Gallery image loading
 * - Cart operations  
 * - Enhancement status checks
 * - Product type/catalog loading
 */

class MerchandiseApiService {
  constructor() {
    this.baseUrl = '';  // Relative URLs work fine
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generic API request handler with error handling
   * @private
   */
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: { ...this.defaultHeaders, ...(options.headers || {}) },
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  // ========================================
  // PRODUCT API METHODS
  // ========================================

  /**
   * Load user's existing products
   */
  async loadUserProducts() {
    console.log('🔍 MerchandiseApiService: Loading user products...');
    return await this.makeRequest('/api/merchandise/products');
  }

  /**
   * Create a new product
   */
  async createProduct(imageId, productOptions) {
    console.log('🎨 MerchandiseApiService: Creating product for image:', imageId);
    
    const payload = {
      imageId: imageId,
      ...productOptions
    };

    return await this.makeRequest('/api/merchandise/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId) {
    console.log('🗑️ MerchandiseApiService: Deleting product:', productId);
    
    return await this.makeRequest(`/api/merchandise/products/${productId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId, updates) {
    console.log('✏️ MerchandiseApiService: Updating product:', productId);
    
    return await this.makeRequest(`/api/merchandise/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Get product details by ID
   */
  async getProduct(productId) {
    console.log('🔍 MerchandiseApiService: Getting product:', productId);
    
    return await this.makeRequest(`/api/merchandise/products/${productId}`);
  }

  // ========================================
  // PRODUCT CATALOG API METHODS  
  // ========================================

  /**
   * Load available product types/categories
   */
  async loadProductTypes() {
    console.log('📂 MerchandiseApiService: Loading product types...');
    return await this.makeRequest('/api/merchandise/product-catalog');
  }

  /**
   * Load blueprint previews for products
   */
  async loadBlueprintPreviews(blueprintIds = []) {
    console.log('🖼️ MerchandiseApiService: Loading blueprint previews...');
    
    if (blueprintIds.length === 0) {
      return await this.makeRequest('/api/merchandise/blueprint-previews');
    } else {
      return await this.makeRequest('/api/merchandise/blueprint-previews', {
        method: 'POST',
        body: JSON.stringify({ blueprintIds })
      });
    }
  }

  // ========================================
  // GALLERY API METHODS
  // ========================================

  /**
   * Load gallery images
   */
  async loadGalleryImages() {
    console.log('🖼️ MerchandiseApiService: Loading gallery images...');
    return await this.makeRequest('/api/merchandise/gallery');
  }

  /**
   * Get specific gallery image details
   */
  async getGalleryImage(imageId) {
    console.log('🔍 MerchandiseApiService: Getting gallery image:', imageId);
    return await this.makeRequest(`/api/merchandise/gallery/${imageId}`);
  }

  // ========================================
  // ENHANCEMENT API METHODS
  // ========================================

  /**
   * Load enhancement status/availability
   */
  async loadEnhancementStatus() {
    console.log('⚡ MerchandiseApiService: Loading enhancement status...');

    try {
      return await this.makeRequest('/api/merchandise/enhancement/status');
    } catch (error) {
      console.warn('Enhancement API not available, returning default status');
      return { available: false, reason: 'Service unavailable' };
    }
  }

  /**
   * Check if an image needs enhancement
   */
  async checkIfImageNeedsEnhancement(imageId) {
    console.log('🔍 MerchandiseApiService: Checking enhancement needs for:', imageId);
    
    return await this.makeRequest('/api/merchandise/check-enhancement-status', {
      method: 'POST',
      body: JSON.stringify({ imageId })
    });
  }

  /**
   * Request image enhancement
   */
  async enhanceImage(imageId, options = {}) {
    console.log('✨ MerchandiseApiService: Requesting image enhancement:', imageId);
    
    return await this.makeRequest('/api/enhancement/enhance', {
      method: 'POST', 
      body: JSON.stringify({
        imageId: imageId,
        ...options
      })
    });
  }

  // ========================================
  // CART API METHODS
  // ========================================

  /**
   * Add item to cart
   */
  async addToCart(productId, variantId, quantity = 1) {
    console.log('🛒 MerchandiseApiService: Adding to cart:', { productId, variantId, quantity });
    
    return await this.makeRequest('/api/merchandise/cart', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        variantId, 
        quantity
      })
    });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId, variantId) {
    console.log('🗑️ MerchandiseApiService: Removing from cart:', { productId, variantId });
    
    return await this.makeRequest('/api/merchandise/cart', {
      method: 'DELETE',
      body: JSON.stringify({
        productId,
        variantId
      })
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartQuantity(productId, variantId, quantity) {
    console.log('📝 MerchandiseApiService: Updating cart quantity:', { productId, variantId, quantity });
    
    return await this.makeRequest('/api/merchandise/cart', {
      method: 'PUT',
      body: JSON.stringify({
        productId,
        variantId,
        quantity
      })
    });
  }

  /**
   * Get current cart
   */
  async getCart() {
    console.log('🛒 MerchandiseApiService: Loading cart...');
    return await this.makeRequest('/api/merchandise/cart');
  }

  /**
   * Clear entire cart
   */
  async clearCart() {
    console.log('🧹 MerchandiseApiService: Clearing cart...');
    return await this.makeRequest('/api/merchandise/cart/clear', {
      method: 'DELETE'
    });
  }

  // ========================================
  // GUIDED PRODUCT CREATION
  // ========================================

  /**
   * Create a guided product with full customization
   */
  async createGuidedProduct(imageId, productType, customOptions = {}) {
    console.log('🎯 MerchandiseApiService: Creating guided product:', { imageId, productType });
    
    return await this.makeRequest('/api/merchandise/products/guided', {
      method: 'POST',
      body: JSON.stringify({
        imageId,
        productType,
        ...customOptions
      })
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Health check for the API service
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/api/health');
      console.log('✅ MerchandiseApiService: Health check passed');
      return true;
    } catch (error) {
      console.error('❌ MerchandiseApiService: Health check failed:', error);
      return false;
    }
  }

  /**
   * Get API status and version info
   */
  async getApiInfo() {
    try {
      return await this.makeRequest('/api/info');
    } catch (error) {
      console.warn('API info not available');
      return { version: 'unknown', status: 'unknown' };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseApiService;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseApiService = MerchandiseApiService;
}