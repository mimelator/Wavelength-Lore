/**
 * WAVELENGTH Product Card Renderer
 * 
 * Handles rendering of product cards in different states:
 * - Complete products with full functionality
 * - Incomplete products with processing status
 * - Broken products with repair options
 * - Empty states
 */

class MerchandiseProductCardRenderer {
  constructor(options = {}) {
    this.validationService = options.validationService;
    this.eventBus = options.eventBus;
    this.merchandiseStore = options.merchandiseStore; // For accessing helper methods
  }
  
  /**
   * Render all products with proper categorization
   * @param {Array} products - Array of product objects
   * @param {Object} selectedImage - Currently selected image for empty state
   * @returns {string} HTML string for products display
   */
  renderProductsGrid(products, selectedImage = null) {
    try {
      if (!products || products.length === 0) {
        return this.renderEmptyState(selectedImage);
      }
      
      // Separate products by status using validation service
      const validProducts = products.filter(p => p.id || p.productId);
      const completeProducts = validProducts.filter(p => this.validationService.isProductComplete(p));
      const incompleteProducts = validProducts.filter(p => !this.validationService.isProductComplete(p));
      const brokenProducts = validProducts.filter(p => this.validationService.isProductBroken(p));
      
      let html = '';
      
      // Render complete products first
      if (completeProducts.length > 0) {
        html += this.renderCompleteProducts(completeProducts);
      }
      
      // Render incomplete products with status indicators
      if (incompleteProducts.length > 0) {
        html += this.renderIncompleteProducts(incompleteProducts);
      }
      
      // Render broken products with repair options
      if (brokenProducts.length > 0) {
        html += this.renderBrokenProducts(brokenProducts);
      }
      
      return html;
      
    } catch (error) {
      console.error('Error rendering products grid:', error);
      return this.renderErrorState();
    }
  }
  
  /**
   * Render complete products that are ready for use
   * @param {Array} products - Array of complete products
   * @returns {string} HTML string for complete products
   */
  renderCompleteProducts(products) {
    return products.map(product => this.renderCompleteProductCard(product)).join('');
  }
  
  /**
   * Render a single complete product card
   * @param {Object} product - Product object
   * @returns {string} HTML string for product card
   */
  renderCompleteProductCard(product) {
    const productId = product.id || product.productId;
    const productTitle = product.title || 'Untitled Product';
    const productImage = this.getProductImage(product);
    const productType = this.getProductType(product);
    const productIcon = this.getProductIcon(productType);
    const productDetails = this.getProductDetails(product);
    const variantInfo = this.getVariantInfo(product);
    
    return `
      <div class="product-card complete-product" data-product-id="${productId}">
        <div class="product-type-header">
          <span class="product-type-icon">${productIcon}</span>
          <span class="product-type-name">${this.getProductTypeName(productType)}</span>
        </div>
        
        <div class="product-image">
          <img src="${productImage}" alt="${productTitle}" loading="lazy" />
          <div class="product-actions">
            <button class="action-btn view-product-btn" 
                    data-product-id="${productId}" 
                    title="View Product Details">
              <span>👁️</span>
            </button>
            <button class="action-btn edit-product-btn" 
                    data-product-id="${productId}" 
                    title="Edit Product">
              <span>✏️</span>
            </button>
            <button class="action-btn delete-product-btn" 
                    data-product-id="${productId}" 
                    title="Remove Product">
              <span>🗑️</span>
            </button>
          </div>
        </div>
        
        <div class="product-info">
          <h4 class="product-title">${productTitle}</h4>
          <div class="product-details">
            ${productDetails}
          </div>
          <div class="product-variants">
            <div class="variant-summary">
              <span class="variant-count">${variantInfo.count} variants available</span>
              <span class="price-range">${variantInfo.priceRange}</span>
              <button class="view-variants-btn btn-secondary" 
                      data-product-id="${productId}">
                View Options
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render incomplete products that are being processed
   * @param {Array} products - Array of incomplete products
   * @returns {string} HTML string for incomplete products
   */
  renderIncompleteProducts(products) {
    return `
      <div class="incomplete-products-section">
        <h3 class="section-divider">
          <span class="section-icon">🚧</span>
          Products Being Processed
        </h3>
        <div class="products-grid incomplete-grid">
          ${products.map(product => this.renderIncompleteProductCard(product)).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Render a single incomplete product card
   * @param {Object} product - Incomplete product object
   * @returns {string} HTML string for incomplete product card
   */
  renderIncompleteProductCard(product) {
    const productId = product.id || product.productId;
    const productTitle = product.title || 'Processing Product';
    const productImage = this.getProductImage(product);
    const productType = this.getProductType(product);
    const productIcon = this.getProductIcon(productType);
    const status = this.validationService.getProductStatus(product);
    
    return `
      <div class="product-card incomplete-product" data-product-id="${productId}">
        <div class="product-type-header">
          <span class="product-type-icon">${productIcon}</span>
          <span class="product-type-name">${this.getProductTypeName(productType)}</span>
          <span class="product-status processing">${status.message}</span>
        </div>
        
        <div class="product-image processing">
          ${productImage ? `<img src="${productImage}" alt="${productTitle}" loading="lazy" />` : ''}
          <div class="processing-overlay">
            <div class="processing-spinner"></div>
            <span class="processing-text">Creating product...</span>
          </div>
        </div>
        
        <div class="product-info">
          <h4 class="product-title">${productTitle}</h4>
          <div class="product-status-details">
            <p class="status-message">${status.message}</p>
            ${status.issues.length > 0 ? `
              <ul class="status-issues">
                ${status.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          <div class="product-actions">
            <button class="refresh-status-btn btn-secondary" 
                    data-product-id="${productId}">
              <span>🔄</span> Check Status
            </button>
            ${status.canEdit ? `
              <button class="retry-setup-btn btn-primary" 
                      data-product-id="${productId}">
                <span>🔧</span> Retry Setup
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render broken products that need repair
   * @param {Array} products - Array of broken products
   * @returns {string} HTML string for broken products
   */
  renderBrokenProducts(products) {
    return `
      <div class="broken-products-section">
        <h3 class="section-divider">
          <span class="section-icon">🔧</span>
          Products Needing Repair
        </h3>
        <div class="products-grid broken-grid">
          ${products.map(product => this.renderBrokenProductCard(product)).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Render a single broken product card
   * @param {Object} product - Broken product object
   * @returns {string} HTML string for broken product card
   */
  renderBrokenProductCard(product) {
    const productId = product.id || product.productId;
    const productTitle = product.title || 'Broken Product';
    const productImage = this.getProductImage(product);
    const productType = this.getProductType(product);
    const productIcon = this.getProductIcon(productType);
    const status = this.validationService.getProductStatus(product);
    
    return `
      <div class="product-card broken-product" data-product-id="${productId}">
        <div class="product-type-header">
          <span class="product-type-icon">${productIcon}</span>
          <span class="product-type-name">${this.getProductTypeName(productType)}</span>
          <span class="product-status broken">Needs Repair</span>
        </div>
        
        <div class="product-image broken">
          ${productImage ? `<img src="${productImage}" alt="${productTitle}" loading="lazy" />` : ''}
          <div class="broken-overlay">
            <span class="broken-icon">⚠️</span>
            <span class="broken-text">Repair Needed</span>
          </div>
        </div>
        
        <div class="product-info">
          <h4 class="product-title">${productTitle}</h4>
          <div class="product-status-details">
            <p class="status-message error">${status.message}</p>
            ${status.issues.length > 0 ? `
              <ul class="status-issues">
                ${status.issues.map(issue => `<li class="error">${issue}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          <div class="product-actions">
            <button class="repair-product-btn btn-primary" 
                    data-product-id="${productId}">
              <span>🔧</span> Repair Product
            </button>
            <button class="delete-product-btn btn-danger" 
                    data-product-id="${productId}">
              <span>🗑️</span> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render empty state when no products exist
   * @param {Object} selectedImage - Currently selected image
   * @returns {string} HTML string for empty state
   */
  renderEmptyState(selectedImage) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🎨</div>
        <h3>No Custom Products Yet</h3>
        <p>Select an image from your gallery to design your first product!</p>
        ${selectedImage ? `
          <button class="create-product-btn btn-primary">
            <span>✨</span> Design Product from Selected Image
          </button>
        ` : `
          <p class="help-text">
            <span>💡</span> Tip: Choose an image from the gallery above to get started
          </p>
        `}
      </div>
    `;
  }
  
  /**
   * Render error state when products fail to load
   * @returns {string} HTML string for error state
   */
  renderErrorState() {
    return `
      <div class="error-state">
        <div class="error-state-icon">⚠️</div>
        <h3>Error Loading Products</h3>
        <p>There was a problem loading your products. Please try again.</p>
        <button class="retry-load-btn btn-primary">
          <span>🔄</span> Retry Loading
        </button>
      </div>
    `;
  }
  
  /**
   * Helper method to get product image with fallbacks
   * @param {Object} product - Product object
   * @returns {string} Image URL
   */
  getProductImage(product) {
    if (product.images && product.images.length > 0) {
      return product.images[0].src || product.images[0].url;
    }
    
    if (product.sourceImage && product.sourceImage.url) {
      return product.sourceImage.url;
    }
    
    return '/images/previews/generic-product-preview.svg';
  }
  
  /**
   * Helper method to extract product type
   * @param {Object} product - Product object
   * @returns {string} Product type
   */
  getProductType(product) {
    if (this.merchandiseStore && typeof this.merchandiseStore.extractProductTypeFromProduct === 'function') {
      return this.merchandiseStore.extractProductTypeFromProduct(product);
    }
    
    // Fallback extraction logic
    return product.productType || product.type || 'custom-product';
  }
  
  /**
   * Helper method to get product icon
   * @param {string} productType - Product type
   * @returns {string} Product icon
   */
  getProductIcon(productType) {
    if (this.merchandiseStore && typeof this.merchandiseStore.getProductIcon === 'function') {
      return this.merchandiseStore.getProductIcon(productType);
    }
    
    // Fallback icon mapping
    const iconMap = {
      'apparel': '👕',
      'accessories': '🎒',
      'home-decor': '🏠',
      'stickers': '📌',
      'mugs': '☕',
      'default': '🛍️'
    };
    
    return iconMap[productType] || iconMap.default;
  }
  
  /**
   * Helper method to get product type name
   * @param {string} productType - Product type
   * @returns {string} Human-readable product type name
   */
  getProductTypeName(productType) {
    if (this.merchandiseStore && typeof this.merchandiseStore.getProductTypeName === 'function') {
      return this.merchandiseStore.getProductTypeName(productType);
    }
    
    // Fallback name mapping
    return productType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Helper method to get product details
   * @param {Object} product - Product object
   * @returns {string} Product details HTML
   */
  getProductDetails(product) {
    if (this.merchandiseStore && typeof this.merchandiseStore.getProductDetails === 'function') {
      return this.merchandiseStore.getProductDetails(product);
    }
    
    // Fallback details
    return product.description || 'Custom merchandise product';
  }
  
  /**
   * Helper method to get variant information
   * @param {Object} product - Product object
   * @returns {Object} Variant count and price range
   */
  getVariantInfo(product) {
    const variants = product.variants || [];
    const count = variants.length;
    
    let priceRange = 'Price varies';
    if (variants.length > 0) {
      const prices = variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        priceRange = min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
      }
    }
    
    return { count, priceRange };
  }
  
  /**
   * Set up event listeners for product card interactions
   * @param {HTMLElement} container - Container element with product cards
   */
  setupEventListeners(container) {
    if (!container) return;
    
    // Delegate event handling to container
    container.addEventListener('click', (e) => {
      const productId = e.target.closest('[data-product-id]')?.dataset.productId;
      if (!productId) return;
      
      // Handle different button clicks
      if (e.target.closest('.view-product-btn')) {
        this.handleViewProduct(productId);
      } else if (e.target.closest('.edit-product-btn')) {
        this.handleEditProduct(productId);
      } else if (e.target.closest('.delete-product-btn')) {
        this.handleDeleteProduct(productId);
      } else if (e.target.closest('.view-variants-btn')) {
        this.handleViewVariants(productId);
      } else if (e.target.closest('.refresh-status-btn')) {
        this.handleRefreshStatus(productId);
      } else if (e.target.closest('.retry-setup-btn')) {
        this.handleRetrySetup(productId);
      } else if (e.target.closest('.repair-product-btn')) {
        this.handleRepairProduct(productId);
      }
    });
  }
  
  /**
   * Handle view product action
   * @param {string} productId - Product ID
   */
  handleViewProduct(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.view', { productId });
    }
  }
  
  /**
   * Handle edit product action
   * @param {string} productId - Product ID
   */
  handleEditProduct(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.edit', { productId });
    }
  }
  
  /**
   * Handle delete product action
   * @param {string} productId - Product ID
   */
  handleDeleteProduct(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.delete', { productId });
    }
  }
  
  /**
   * Handle view variants action
   * @param {string} productId - Product ID
   */
  handleViewVariants(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.viewVariants', { productId });
    }
  }
  
  /**
   * Handle refresh status action
   * @param {string} productId - Product ID
   */
  handleRefreshStatus(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.refreshStatus', { productId });
    }
  }
  
  /**
   * Handle retry setup action
   * @param {string} productId - Product ID
   */
  handleRetrySetup(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.retrySetup', { productId });
    }
  }
  
  /**
   * Handle repair product action
   * @param {string} productId - Product ID
   */
  handleRepairProduct(productId) {
    if (this.eventBus) {
      this.eventBus.emit('product.repair', { productId });
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseProductCardRenderer;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseProductCardRenderer = MerchandiseProductCardRenderer;
}