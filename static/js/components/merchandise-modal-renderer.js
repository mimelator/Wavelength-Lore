/**
 * WAVELENGTH Modal Renderer
 * 
 * Handles rendering of all modal dialogs including:
 * - Product customization modals
 * - Product preview modals
 * - Shopping cart modal
 * - Confirmation dialogs
 * - Error notifications
 */

class MerchandiseModalRenderer {
  constructor(options = {}) {
    this.validationService = options.validationService;
    this.eventBus = options.eventBus;
    this.merchandiseStore = options.merchandiseStore; // For accessing helper methods
    this.activeModals = new Set(); // Track active modals
  }
  
  /**
   * Render product customization modal
   * @param {Object} product - Product object
   * @param {Object} options - Modal options
   * @returns {string} HTML string for customization modal
   */
  renderCustomizationModal(product, options = {}) {
    try {
      const modalId = `customize-modal-${product.id}`;
      
      return `
        <div class="modal-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog customization-modal" role="dialog" aria-labelledby="${modalId}-title">
            <div class="modal-header">
              <h3 id="${modalId}-title">
                <span class="modal-icon">🎨</span>
                Customize ${product.title}
              </h3>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="customization-content">
                <div class="product-preview-section">
                  ${this.renderProductPreview(product)}
                </div>
                
                <div class="customization-options-section">
                  ${this.renderCustomizationOptions(product)}
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <div class="customization-summary">
                ${this.renderCustomizationSummary(product)}
              </div>
              <div class="modal-actions">
                <button class="btn-secondary cancel-customization-btn" data-modal-id="${modalId}">
                  Cancel
                </button>
                <button class="btn-primary save-customization-btn" data-product-id="${product.id}">
                  <span>💾</span> Save Design
                </button>
                <button class="btn-primary add-to-cart-customized-btn" data-product-id="${product.id}">
                  <span>🛒</span> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering customization modal:', error);
      return this.renderModalError('customization');
    }
  }
  
  /**
   * Render product preview modal
   * @param {Object} product - Product object
   * @returns {string} HTML string for preview modal
   */
  renderPreviewModal(product) {
    try {
      const modalId = `preview-modal-${product.id}`;
      const productStatus = this.validationService ? 
        this.validationService.getProductStatus(product) : 
        { isComplete: true, isValid: true };
      
      return `
        <div class="modal-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog preview-modal" role="dialog" aria-labelledby="${modalId}-title">
            <div class="modal-header">
              <h3 id="${modalId}-title">
                <span class="modal-icon">👁️</span>
                ${product.title}
              </h3>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="preview-content">
                <div class="preview-image-section">
                  <div class="preview-image-container">
                    <img src="${product.previewImage || '/images/previews/generic-product-preview.svg'}" 
                         alt="${product.title}" 
                         class="preview-main-image" />
                    <div class="preview-status-overlay">
                      ${this.renderProductStatusBadge(productStatus)}
                    </div>
                  </div>
                  
                  ${product.additionalImages && product.additionalImages.length > 0 ? `
                    <div class="preview-thumbnail-strip">
                      ${product.additionalImages.map((img, index) => `
                        <img src="${img}" 
                             alt="${product.title} view ${index + 1}" 
                             class="preview-thumbnail"
                             data-main-image="${img}" />
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
                
                <div class="preview-details-section">
                  <div class="preview-info">
                    <h4>Product Details</h4>
                    <p class="preview-description">
                      ${product.description || 'Custom Wavelength merchandise product'}
                    </p>
                    
                    <div class="preview-specifications">
                      ${this.renderProductSpecifications(product)}
                    </div>
                    
                    <div class="preview-pricing">
                      <span class="preview-price">
                        ${product.price ? `$${product.price.toFixed(2)}` : 'Price varies by options'}
                      </span>
                    </div>
                  </div>
                  
                  <div class="preview-validation">
                    ${this.renderProductValidationDetails(productStatus, product)}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <div class="modal-actions">
                <button class="btn-secondary close-preview-btn" data-modal-id="${modalId}">
                  Close
                </button>
                <button class="btn-primary customize-from-preview-btn" data-product-id="${product.id}">
                  <span>🎨</span> Customize This
                </button>
                ${productStatus.isComplete ? `
                  <button class="btn-primary add-to-cart-from-preview-btn" data-product-id="${product.id}">
                    <span>🛒</span> Add to Cart
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering preview modal:', error);
      return this.renderModalError('preview');
    }
  }
  
  /**
   * Render shopping cart modal
   * @param {Object} cartSummary - Cart summary object
   * @returns {string} HTML string for cart modal
   */
  renderCartModal(cartSummary) {
    try {
      const modalId = 'cart-modal';
      
      return `
        <div class="modal-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog cart-modal" role="dialog" aria-labelledby="${modalId}-title">
            <div class="modal-header">
              <h3 id="${modalId}-title">
                <span class="modal-icon">🛒</span>
                Shopping Cart
                <span class="cart-count-badge">${cartSummary.totalQuantity}</span>
              </h3>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="cart-modal-content">
                ${cartSummary.isEmpty ? 
                  this.renderEmptyCartInModal() :
                  this.renderCartContentInModal(cartSummary)
                }
              </div>
            </div>
            
            ${!cartSummary.isEmpty ? `
              <div class="modal-footer">
                <div class="cart-modal-summary">
                  <div class="cart-total">
                    Total: <span class="total-amount">$${cartSummary.total.toFixed(2)}</span>
                  </div>
                </div>
                <div class="modal-actions">
                  <button class="btn-secondary continue-shopping-modal-btn" data-modal-id="${modalId}">
                    Continue Shopping
                  </button>
                  <button class="btn-primary checkout-modal-btn">
                    <span>💳</span> Checkout Now
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering cart modal:', error);
      return this.renderModalError('cart');
    }
  }
  
  /**
   * Render confirmation dialog
   * @param {Object} options - Confirmation options
   * @returns {string} HTML string for confirmation dialog
   */
  renderConfirmationDialog(options = {}) {
    const {
      title = 'Confirm Action',
      message = 'Are you sure you want to continue?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      type = 'warning', // warning, danger, info
      onConfirm = null,
      onCancel = null
    } = options;
    
    const modalId = `confirm-dialog-${Date.now()}`;
    const icon = type === 'danger' ? '⚠️' : type === 'info' ? 'ℹ️' : '❓';
    
    return `
      <div class="modal-overlay" data-modal-id="${modalId}">
        <div class="modal-dialog confirmation-dialog ${type}" role="dialog" aria-labelledby="${modalId}-title">
          <div class="modal-header">
            <h3 id="${modalId}-title">
              <span class="modal-icon">${icon}</span>
              ${title}
            </h3>
          </div>
          
          <div class="modal-body">
            <div class="confirmation-content">
              <p class="confirmation-message">${message}</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <div class="modal-actions">
              <button class="btn-secondary confirmation-cancel-btn" 
                      data-modal-id="${modalId}"
                      data-action="cancel">
                ${cancelText}
              </button>
              <button class="btn-${type === 'danger' ? 'danger' : 'primary'} confirmation-confirm-btn" 
                      data-modal-id="${modalId}"
                      data-action="confirm">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render notification toast
   * @param {Object} options - Notification options
   * @returns {string} HTML string for notification
   */
  renderNotification(options = {}) {
    const {
      message = 'Notification',
      type = 'info', // success, error, warning, info
      duration = 5000,
      persistent = false
    } = options;
    
    const notificationId = `notification-${Date.now()}`;
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 'ℹ️';
    
    return `
      <div class="notification-toast ${type}" 
           data-notification-id="${notificationId}"
           data-duration="${duration}"
           data-persistent="${persistent}">
        <div class="notification-content">
          <span class="notification-icon">${icon}</span>
          <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close-btn" data-notification-id="${notificationId}">
          <span>✕</span>
        </button>
      </div>
    `;
  }
  
  /**
   * Render product preview section for customization modal
   * @param {Object} product - Product object
   * @returns {string} HTML string for product preview
   */
  renderProductPreview(product) {
    return `
      <div class="customization-preview">
        <div class="preview-image-container">
          <img src="${product.previewImage || '/images/previews/generic-product-preview.svg'}" 
               alt="${product.title}" 
               class="customization-preview-image" 
               id="customization-preview-main" />
          <div class="preview-loading-overlay" style="display: none;">
            <div class="preview-spinner">🔄</div>
            <p>Updating preview...</p>
          </div>
        </div>
        
        <div class="preview-controls">
          <button class="preview-zoom-btn" title="Zoom preview">
            <span>🔍</span>
          </button>
          <button class="preview-fullscreen-btn" title="View fullscreen">
            <span>⛶</span>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render customization options
   * @param {Object} product - Product object
   * @returns {string} HTML string for customization options
   */
  renderCustomizationOptions(product) {
    return `
      <div class="customization-options">
        <div class="options-tabs">
          <button class="options-tab active" data-tab="design">
            <span>🎨</span> Design
          </button>
          <button class="options-tab" data-tab="colors">
            <span>🌈</span> Colors
          </button>
          <button class="options-tab" data-tab="text">
            <span>📝</span> Text
          </button>
          <button class="options-tab" data-tab="size">
            <span>📏</span> Size
          </button>
        </div>
        
        <div class="options-content">
          <div class="option-panel active" data-panel="design">
            ${this.renderDesignOptions(product)}
          </div>
          
          <div class="option-panel" data-panel="colors">
            ${this.renderColorOptions(product)}
          </div>
          
          <div class="option-panel" data-panel="text">
            ${this.renderTextOptions(product)}
          </div>
          
          <div class="option-panel" data-panel="size">
            ${this.renderSizeOptions(product)}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render design options
   * @param {Object} product - Product object
   * @returns {string} HTML string for design options
   */
  renderDesignOptions(product) {
    const designs = [
      { id: 'logo', name: 'Wavelength Logo', preview: '/images/designs/wavelength-logo.svg' },
      { id: 'wave', name: 'Wave Pattern', preview: '/images/designs/wave-pattern.svg' },
      { id: 'frequency', name: 'Frequency Lines', preview: '/images/designs/frequency-lines.svg' },
      { id: 'custom', name: 'Upload Custom', preview: '/images/designs/custom-upload.svg' }
    ];
    
    return `
      <div class="design-options">
        <h4>Choose a Design</h4>
        <div class="design-grid">
          ${designs.map(design => `
            <div class="design-option" data-design-id="${design.id}">
              <img src="${design.preview}" alt="${design.name}" class="design-preview" />
              <span class="design-name">${design.name}</span>
              <input type="radio" name="design" value="${design.id}" class="design-radio" />
            </div>
          `).join('')}
        </div>
        
        <div class="custom-upload-section" style="display: none;">
          <div class="upload-area">
            <input type="file" id="custom-design-upload" accept="image/*" class="upload-input" />
            <label for="custom-design-upload" class="upload-label">
              <span>📁</span> Upload Your Design
              <small>PNG, JPG, SVG up to 10MB</small>
            </label>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render color options
   * @param {Object} product - Product object
   * @returns {string} HTML string for color options
   */
  renderColorOptions(product) {
    const colors = [
      { id: 'black', name: 'Black', hex: '#000000' },
      { id: 'white', name: 'White', hex: '#FFFFFF' },
      { id: 'navy', name: 'Navy Blue', hex: '#1a237e' },
      { id: 'red', name: 'Red', hex: '#d32f2f' },
      { id: 'green', name: 'Forest Green', hex: '#388e3c' },
      { id: 'purple', name: 'Purple', hex: '#7b1fa2' }
    ];
    
    return `
      <div class="color-options">
        <h4>Base Color</h4>
        <div class="color-grid">
          ${colors.map(color => `
            <div class="color-option" data-color-id="${color.id}">
              <div class="color-swatch" style="background-color: ${color.hex}"></div>
              <span class="color-name">${color.name}</span>
              <input type="radio" name="baseColor" value="${color.id}" class="color-radio" />
            </div>
          `).join('')}
        </div>
        
        <h4>Design Color</h4>
        <div class="design-color-options">
          <input type="color" id="design-color-picker" class="color-picker" value="#ffffff" />
          <label for="design-color-picker">Custom Design Color</label>
        </div>
      </div>
    `;
  }
  
  /**
   * Render text options
   * @param {Object} product - Product object  
   * @returns {string} HTML string for text options
   */
  renderTextOptions(product) {
    return `
      <div class="text-options">
        <h4>Add Custom Text</h4>
        
        <div class="text-input-section">
          <label for="custom-text-input">Your Text:</label>
          <textarea id="custom-text-input" 
                    class="custom-text-input" 
                    placeholder="Enter your custom text here..."
                    maxlength="100"></textarea>
          <small>Maximum 100 characters</small>
        </div>
        
        <div class="text-style-section">
          <div class="font-options">
            <label>Font:</label>
            <select class="font-select">
              <option value="arial">Arial</option>
              <option value="helvetica">Helvetica</option>
              <option value="times">Times New Roman</option>
              <option value="courier">Courier</option>
              <option value="impact">Impact</option>
            </select>
          </div>
          
          <div class="text-size-section">
            <label>Size:</label>
            <input type="range" class="text-size-slider" min="12" max="72" value="24" />
            <span class="text-size-display">24px</span>
          </div>
          
          <div class="text-style-buttons">
            <button class="text-style-btn" data-style="bold" title="Bold">
              <strong>B</strong>
            </button>
            <button class="text-style-btn" data-style="italic" title="Italic">
              <em>I</em>
            </button>
            <button class="text-style-btn" data-style="underline" title="Underline">
              <u>U</u>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render size options
   * @param {Object} product - Product object
   * @returns {string} HTML string for size options
   */
  renderSizeOptions(product) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    return `
      <div class="size-options">
        <h4>Select Size</h4>
        <div class="size-grid">
          ${sizes.map(size => `
            <div class="size-option" data-size="${size}">
              <span class="size-label">${size}</span>
              <input type="radio" name="size" value="${size}" class="size-radio" />
            </div>
          `).join('')}
        </div>
        
        <div class="size-guide-section">
          <button class="size-guide-btn" type="button">
            <span>📏</span> View Size Guide
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render customization summary
   * @param {Object} product - Product object
   * @returns {string} HTML string for customization summary
   */
  renderCustomizationSummary(product) {
    return `
      <div class="customization-summary">
        <h4>Customization Summary</h4>
        <div class="summary-details">
          <div class="summary-item">
            <span class="summary-label">Product:</span>
            <span class="summary-value">${product.title}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Design:</span>
            <span class="summary-value" id="selected-design">Not selected</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Colors:</span>
            <span class="summary-value" id="selected-colors">Not selected</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Size:</span>
            <span class="summary-value" id="selected-size">Not selected</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Price:</span>
            <span class="summary-value price-value" id="customization-price">
              ${product.price ? `$${product.price.toFixed(2)}` : 'Calculate'}
            </span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render product specifications
   * @param {Object} product - Product object
   * @returns {string} HTML string for specifications
   */
  renderProductSpecifications(product) {
    return `
      <div class="product-specifications">
        <h5>Specifications</h5>
        <ul class="spec-list">
          <li><strong>Material:</strong> ${product.material || 'Premium cotton blend'}</li>
          <li><strong>Print Method:</strong> ${product.printMethod || 'High-quality digital printing'}</li>
          <li><strong>Care Instructions:</strong> ${product.careInstructions || 'Machine wash cold, tumble dry low'}</li>
          <li><strong>Origin:</strong> ${product.origin || 'Printed on demand'}</li>
        </ul>
      </div>
    `;
  }
  
  /**
   * Render product validation details
   * @param {Object} productStatus - Product status object
   * @param {Object} product - Product object
   * @returns {string} HTML string for validation details
   */
  renderProductValidationDetails(productStatus, product) {
    if (productStatus.isComplete) {
      return `
        <div class="validation-details success">
          <h5>✅ Product Ready</h5>
          <p>This product is fully configured and ready to order.</p>
        </div>
      `;
    } else {
      return `
        <div class="validation-details ${productStatus.isValid ? 'warning' : 'error'}">
          <h5>${productStatus.isValid ? '⚠️ Incomplete Setup' : '❌ Configuration Issues'}</h5>
          <ul class="validation-issues">
            ${(productStatus.issues || ['Product needs additional configuration']).map(issue => 
              `<li>${issue}</li>`
            ).join('')}
          </ul>
          <p>
            ${productStatus.isValid ? 
              'Complete the configuration to enable ordering.' :
              'Fix these issues before this product can be ordered.'
            }
          </p>
        </div>
      `;
    }
  }
  
  /**
   * Render product status badge
   * @param {Object} productStatus - Product status object
   * @returns {string} HTML string for status badge
   */
  renderProductStatusBadge(productStatus) {
    if (productStatus.isComplete) {
      return '<span class="status-badge complete">✅ Ready to Order</span>';
    } else if (productStatus.isValid) {
      return '<span class="status-badge incomplete">⚠️ Needs Configuration</span>';
    } else {
      return '<span class="status-badge broken">❌ Has Issues</span>';
    }
  }
  
  /**
   * Render empty cart content in modal
   * @returns {string} HTML string for empty cart
   */
  renderEmptyCartInModal() {
    return `
      <div class="empty-cart-modal">
        <div class="empty-cart-icon">🛒</div>
        <h4>Your Cart is Empty</h4>
        <p>Browse our products and add some custom items to your cart!</p>
        <button class="browse-products-modal-btn btn-primary">
          <span>🎨</span> Start Shopping
        </button>
      </div>
    `;
  }
  
  /**
   * Render cart content in modal
   * @param {Object} cartSummary - Cart summary object
   * @returns {string} HTML string for cart content
   */
  renderCartContentInModal(cartSummary) {
    return `
      <div class="cart-modal-items">
        ${cartSummary.items.map(item => this.renderCartModalItem(item)).join('')}
      </div>
    `;
  }
  
  /**
   * Render cart item in modal
   * @param {Object} item - Cart item
   * @returns {string} HTML string for cart modal item
   */
  renderCartModalItem(item) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    
    return `
      <div class="cart-modal-item" data-product-id="${item.productId}">
        <img src="${item.image || '/images/previews/generic-product-preview.svg'}" 
             alt="${item.title}" 
             class="cart-modal-item-image" />
        
        <div class="cart-modal-item-details">
          <h5>${item.title}</h5>
          <p class="item-variant">${item.variantId || 'Standard'}</p>
          <p class="item-price">$${(item.price || 0).toFixed(2)} × ${item.quantity}</p>
        </div>
        
        <div class="cart-modal-item-total">
          $${itemTotal.toFixed(2)}
        </div>
        
        <button class="remove-from-cart-modal-btn" 
                data-product-id="${item.productId}" 
                data-variant-id="${item.variantId}"
                title="Remove from cart">
          <span>🗑️</span>
        </button>
      </div>
    `;
  }
  
  /**
   * Render modal error state
   * @param {string} modalType - Type of modal that errored
   * @returns {string} HTML string for modal error
   */
  renderModalError(modalType) {
    const modalId = `error-modal-${modalType}`;
    
    return `
      <div class="modal-overlay" data-modal-id="${modalId}">
        <div class="modal-dialog error-modal" role="dialog">
          <div class="modal-header">
            <h3>⚠️ Error</h3>
            <button class="modal-close-btn" data-modal-id="${modalId}">
              <span>✕</span>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="error-content">
              <p>There was an error loading the ${modalType} modal. Please try again.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <div class="modal-actions">
              <button class="btn-primary" data-modal-id="${modalId}">
                <span>🔄</span> Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Show modal (add to DOM and handle display)
   * @param {string} modalHtml - Modal HTML string
   * @param {Object} options - Display options
   */
  showModal(modalHtml, options = {}) {
    const { appendTo = document.body, focus = true } = options;
    
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    const modal = modalElement.firstElementChild;
    
    // Add to DOM
    appendTo.appendChild(modal);
    
    // Track active modal
    const modalId = modal.dataset.modalId;
    this.activeModals.add(modalId);
    
    // Setup event listeners
    this.setupModalEventListeners(modal);
    
    // Focus management
    if (focus) {
      const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
    
    // Add show class for animation
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
    
    // Prevent body scroll
    document.body.classList.add('modal-open');
    
    return modal;
  }
  
  /**
   * Hide modal
   * @param {string} modalId - Modal ID to hide
   */
  hideModal(modalId) {
    const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
    if (!modal) return;
    
    // Remove from active modals
    this.activeModals.delete(modalId);
    
    // Hide with animation
    modal.classList.add('hiding');
    
    setTimeout(() => {
      modal.remove();
      
      // Re-enable body scroll if no more modals
      if (this.activeModals.size === 0) {
        document.body.classList.remove('modal-open');
      }
    }, 300); // Match CSS transition duration
  }
  
  /**
   * Setup modal event listeners
   * @param {HTMLElement} modal - Modal element
   */
  setupModalEventListeners(modal) {
    const modalId = modal.dataset.modalId;
    
    // Close button handlers
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-close-btn') ||
          e.target.closest('.modal-close-btn')) {
        this.hideModal(modalId);
      }
      
      // Close on overlay click
      if (e.target.classList.contains('modal-overlay')) {
        this.hideModal(modalId);
      }
    });
    
    // Escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideModal(modalId);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Custom event handlers based on modal type
    this.setupCustomModalHandlers(modal);
  }
  
  /**
   * Setup custom modal handlers
   * @param {HTMLElement} modal - Modal element
   */
  setupCustomModalHandlers(modal) {
    if (modal.classList.contains('customization-modal')) {
      this.setupCustomizationModalHandlers(modal);
    } else if (modal.classList.contains('cart-modal')) {
      this.setupCartModalHandlers(modal);
    } else if (modal.classList.contains('confirmation-dialog')) {
      this.setupConfirmationDialogHandlers(modal);
    }
  }
  
  /**
   * Setup customization modal handlers
   * @param {HTMLElement} modal - Customization modal element
   */
  setupCustomizationModalHandlers(modal) {
    // Tab switching
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('options-tab')) {
        const tabName = e.target.dataset.tab;
        
        // Update active tab
        modal.querySelectorAll('.options-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update active panel
        modal.querySelectorAll('.option-panel').forEach(panel => panel.classList.remove('active'));
        modal.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
      }
    });
    
    // Option changes
    modal.addEventListener('change', (e) => {
      this.handleCustomizationOptionChange(e, modal);
    });
  }
  
  /**
   * Setup cart modal handlers
   * @param {HTMLElement} modal - Cart modal element
   */
  setupCartModalHandlers(modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-from-cart-modal-btn')) {
        const productId = e.target.dataset.productId;
        const variantId = e.target.dataset.variantId;
        
        if (this.eventBus) {
          this.eventBus.emit('cart.removeItem', { productId, variantId });
        }
      }
    });
  }
  
  /**
   * Setup confirmation dialog handlers
   * @param {HTMLElement} modal - Confirmation dialog element
   */
  setupConfirmationDialogHandlers(modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'confirm') {
        if (this.eventBus) {
          this.eventBus.emit('dialog.confirmed', { modalId: modal.dataset.modalId });
        }
        this.hideModal(modal.dataset.modalId);
      } else if (e.target.dataset.action === 'cancel') {
        if (this.eventBus) {
          this.eventBus.emit('dialog.cancelled', { modalId: modal.dataset.modalId });
        }
        this.hideModal(modal.dataset.modalId);
      }
    });
  }
  
  /**
   * Handle customization option changes
   * @param {Event} event - Change event
   * @param {HTMLElement} modal - Modal element
   */
  handleCustomizationOptionChange(event, modal) {
    const target = event.target;
    
    // Update customization summary
    this.updateCustomizationSummary(modal);
    
    // Trigger preview update
    if (this.eventBus) {
      this.eventBus.emit('customization.optionChanged', {
        option: target.name,
        value: target.value,
        modal: modal
      });
    }
  }
  
  /**
   * Update customization summary
   * @param {HTMLElement} modal - Modal element
   */
  updateCustomizationSummary(modal) {
    // This would be implemented to update the summary section
    // based on current selections
    console.log('Updating customization summary...');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseModalRenderer;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseModalRenderer = MerchandiseModalRenderer;
}