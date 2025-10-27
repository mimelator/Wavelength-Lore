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
    this.debugMode = options.debugMode || false; // Enable debug panel
    this.debugLogs = []; // Store debug logs
  }

  /**
   * Toggle debug panel visibility
   */
  toggleDebugPanel() {
    const panel = document.getElementById('border-debug-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Add debug log entry
   * @param {string} message - Log message
   * @param {string} type - Log type: 'info', 'warning', 'error', 'success'
   * @param {Object} data - Additional data to log
   */
  debugLog(message, type = 'info', data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type,
      data
    };

    this.debugLogs.push(logEntry);

    // Keep only last 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs.shift();
    }

    // Update debug panel if visible
    this.updateDebugPanel(logEntry);

    // Also log to console
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`, data || '');
  }

  /**
   * Update debug panel with new log entry
   * @param {Object} logEntry - Log entry object
   */
  updateDebugPanel(logEntry) {
    const debugPanel = document.getElementById('border-debug-panel');
    if (!debugPanel) return;

    const logContainer = debugPanel.querySelector('.debug-logs');
    if (!logContainer) return;

    const logEl = document.createElement('div');
    logEl.className = `debug-log-entry log-${logEntry.type}`;
    logEl.innerHTML = `
      <span class="log-time">${logEntry.timestamp}</span>
      <span class="log-type">[${logEntry.type.toUpperCase()}]</span>
      <span class="log-message">${logEntry.message}</span>
      ${logEntry.data ? `<pre class="log-data">${JSON.stringify(logEntry.data, null, 2)}</pre>` : ''}
    `;

    logContainer.appendChild(logEl);

    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  /**
   * Render debug panel for border customization
   * @returns {string} HTML string for debug panel
   */
  renderDebugPanel() {
    return `
      <div id="border-debug-panel" style="display: ${this.debugMode ? 'block' : 'none'};" class="border-debug-panel">
        <div class="debug-header">
          <h4>🐛 Border Customization Debug Panel</h4>
          <button id="debug-panel-toggle" class="debug-toggle-btn" title="Collapse/Expand">−</button>
          <button id="debug-panel-close" class="debug-close-btn" title="Close">✕</button>
        </div>
        <div class="debug-content">
          <div class="debug-section">
            <h5>State</h5>
            <div class="debug-state">
              <div class="state-item">
                <span class="state-label">Border Enabled:</span>
                <span class="state-value" id="debug-border-enabled">false</span>
              </div>
              <div class="state-item">
                <span class="state-label">Border Width:</span>
                <span class="state-value" id="debug-border-width">None</span>
              </div>
              <div class="state-item">
                <span class="state-label">Border Color:</span>
                <span class="state-value" id="debug-border-color">None</span>
              </div>
              <div class="state-item">
                <span class="state-label">Selected Image URL:</span>
                <span class="state-value" id="debug-image-url" style="word-break: break-all; font-size: 0.85em;">None</span>
              </div>
            </div>
          </div>

          <div class="debug-section">
            <h5>API Calls</h5>
            <div class="debug-api-section">
              <button id="debug-simulate-border" class="debug-action-btn">📤 Simulate Border API Call</button>
              <button id="debug-clear-logs" class="debug-action-btn">🗑️ Clear Logs</button>
            </div>
          </div>

          <div class="debug-section">
            <h5>Logs (Last 50)</h5>
            <div class="debug-logs"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update debug state display
   * @param {Object} state - Current state object
   */
  updateDebugState(state) {
    const borderEnabled = document.getElementById('debug-border-enabled');
    const borderWidth = document.getElementById('debug-border-width');
    const borderColor = document.getElementById('debug-border-color');
    const imageUrl = document.getElementById('debug-image-url');

    if (borderEnabled) borderEnabled.textContent = state.borderEnabled ? 'true' : 'false';
    if (borderWidth) borderWidth.textContent = state.borderWidth || 'None';
    if (borderColor) borderColor.textContent = state.borderColor || 'None';
    if (imageUrl) imageUrl.textContent = state.imageUrl || 'None';
  }

  /**
   * Setup debug panel event listeners
   */
  setupDebugPanelListeners() {
    const toggleBtn = document.getElementById('debug-panel-toggle');
    const closeBtn = document.getElementById('debug-panel-close');
    const simulateBtn = document.getElementById('debug-simulate-border');
    const clearBtn = document.getElementById('debug-clear-logs');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const content = document.querySelector('.border-debug-panel .debug-content');
        if (content) {
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
          toggleBtn.textContent = content.style.display === 'none' ? '+' : '−';
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.toggleDebugPanel();
      });
    }

    if (simulateBtn) {
      simulateBtn.addEventListener('click', () => {
        this.debugLog('Simulating border API call...', 'info');
        this.debugLog('API call would be sent to /api/merchandise/openai-upscaler/apply-effects', 'info', {
          upscaledImageUrl: document.getElementById('debug-image-url').textContent,
          effectParams: {
            borderEnabled: document.getElementById('debug-border-enabled').textContent === 'true',
            borderWidth: document.getElementById('debug-border-width').textContent,
            borderColor: document.getElementById('debug-border-color').textContent
          }
        });
        this.debugLog('API call simulation complete', 'success');
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const logContainer = document.querySelector('.border-debug-panel .debug-logs');
        if (logContainer) {
          logContainer.innerHTML = '';
          this.debugLogs = [];
          this.debugLog('Logs cleared', 'info');
        }
      });
    }
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
        <div class="modal-overlay fullscreen-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog customization-modal fullscreen-customization" role="dialog" aria-labelledby="${modalId}-title">
            <!-- Header -->
            <div class="customization-header">
              <div class="header-content">
                <h2 id="${modalId}-title">
                  <span class="modal-icon">🎨</span>
                  Design Your Custom ${product.title}
                </h2>
                <p class="header-subtitle">Choose your effects, colors, and production options</p>
              </div>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>

            <!-- Main Content: Split Screen -->
            <div class="customization-split-screen">
              <!-- LEFT: Large Live Preview -->
              <div class="preview-panel">
                <div class="preview-container">
                  <img
                    id="customization-preview-image-${product.id}"
                    src="${product.previewImage || product.image || '/images/previews/generic-product-preview.svg'}"
                    alt="${product.title}"
                    class="preview-image"
                  />
                  <div class="preview-overlay">
                    <div class="preview-info">
                      <span class="info-label">Preview</span>
                    </div>
                  </div>
                </div>
                <div class="preview-status">
                  <small id="preview-status-text-${product.id}">Original image</small>
                </div>
              </div>

              <!-- RIGHT: Compact Options Panel -->
              <div class="options-panel">
                <!-- Update Preview Button -->
                <div class="update-preview-section">
                  <button class="btn-primary update-preview-btn" data-product-id="${product.id}">
                    <span>🔄</span> Update Preview
                  </button>
                  <small>Click to apply selected effects</small>
                </div>

                <!-- Customization Options (Collapsible Sections) -->
                <div class="customization-sections">
                  <!-- Color Effects Section -->
                  ${this.renderCompactEffectsSection('color', product)}

                  <!-- Atmospheric Effects Section -->
                  ${this.renderCompactEffectsSection('atmospheric', product)}

                  <!-- Border Customization Section -->
                  ${this.renderCompactBorderSection(product)}

                  <!-- Production Options Section -->
                  ${this.renderCompactProductionOptions(product)}
                </div>
              </div>
            </div>

            <!-- Footer: Actions -->
            <div class="customization-footer">
              <div class="footer-summary">
                <span class="summary-text" id="customization-summary-${product.id}">
                  No effects selected
                </span>
              </div>
              <div class="footer-actions">
                <button class="btn-secondary cancel-customization-btn" data-modal-id="${modalId}">
                  Cancel
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
   * Render compact effects section (Color or Atmospheric)
   * @param {string} type - 'color' or 'atmospheric'
   * @param {Object} product - Product object
   * @returns {string} HTML for compact effects section
   */
  renderCompactEffectsSection(type, product) {
    const sections = {
      color: {
        title: '🎨 Color Effects',
        effects: [
          { key: 'vibrancy', label: 'Enhanced Vibrancy', emoji: '🌈' },
          { key: 'warmth', label: 'Golden Warmth', emoji: '🔥' },
          { key: 'coolness', label: 'Cool Elegance', emoji: '❄️' }
        ]
      },
      atmospheric: {
        title: '✨ Atmospheric Effects',
        effects: [
          { key: 'glow', label: 'Luminous Glow', emoji: '✨' },
          { key: 'dramatic', label: 'Dramatic Focus', emoji: '🎭' },
          { key: 'lightning', label: 'Lightning Strike', emoji: '⚡' }
        ]
      }
    };

    const section = sections[type];
    if (!section) return '';

    return `
      <div class="compact-section effects-section" data-section="${type}">
        <div class="section-header" data-toggle="${type}-effects">
          <span class="section-title">${section.title}</span>
          <span class="section-toggle">▼</span>
        </div>
        <div class="section-content" id="${type}-effects-content">
          <div class="effects-grid">
            ${section.effects.map(effect => `
              <label class="effect-checkbox-label">
                <input
                  type="checkbox"
                  class="effect-toggle"
                  data-effect="${effect.key}"
                  data-section="${type}"
                />
                <span class="checkbox-custom"></span>
                <span class="effect-name">${effect.emoji} ${effect.label}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render compact border customization section
   * @param {Object} product - Product object
   * @returns {string} HTML for compact border section
   */
  renderCompactBorderSection(product) {
    const widths = [
      { value: 0, label: 'None', pixels: 0 },
      { value: 1, label: 'Thin', pixels: 10 },
      { value: 2, label: 'Medium', pixels: 20 },
      { value: 3, label: 'Thick', pixels: 30 },
      { value: 4, label: 'Extra Thick', pixels: 40 }
    ];

    const colors = [
      // Primary Colors (6)
      { name: 'Red', hex: '#FF0000' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Yellow', hex: '#FFFF00' },
      { name: 'Green', hex: '#00AA00' },
      { name: 'Purple', hex: '#AA00AA' },
      { name: 'Orange', hex: '#FF8800' },
      // Pastel Colors (6)
      { name: 'Soft Pink', hex: '#FFB6C1' },
      { name: 'Soft Blue', hex: '#ADD8E6' },
      { name: 'Soft Yellow', hex: '#FFFFE0' },
      { name: 'Soft Green', hex: '#90EE90' },
      { name: 'Soft Purple', hex: '#DDA0DD' },
      { name: 'Soft Peach', hex: '#FFDAB9' },
      // Dark/Deep Colors (6)
      { name: 'Dark Red', hex: '#8B0000' },
      { name: 'Dark Blue', hex: '#00008B' },
      { name: 'Dark Green', hex: '#006400' },
      { name: 'Dark Purple', hex: '#4B0082' },
      { name: 'Dark Brown', hex: '#654321' },
      { name: 'Dark Gray', hex: '#404040' },
      // Metallic Colors (6)
      { name: 'Gold', hex: '#FFD700' },
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Rose Gold', hex: '#B76E79' },
      { name: 'Bronze', hex: '#CD7F32' },
      { name: 'Copper', hex: '#B87333' },
      { name: 'Platinum', hex: '#E5E4E2' },
      // Vibrant/Neon Colors (6)
      { name: 'Hot Pink', hex: '#FF1493' },
      { name: 'Neon Green', hex: '#39FF14' },
      { name: 'Neon Blue', hex: '#0080FF' },
      { name: 'Electric Purple', hex: '#BF00FF' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Lime', hex: '#BFFF00' },
      // Neutral Colors (6)
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Light Gray', hex: '#D3D3D3' },
      { name: 'Medium Gray', hex: '#808080' },
      { name: 'Cream', hex: '#FFFDD0' },
      { name: 'Beige', hex: '#F5F5DC' }
    ];

    return `
      <div class="compact-section border-section" data-section="border">
        <div class="section-header" data-toggle="border">
          <span class="section-title">🖼️ Border</span>
          <span class="section-toggle">▼</span>
        </div>
        <div class="section-content" id="border-content">
          <!-- Enable Border Toggle -->
          <label class="border-enable-label">
            <input
              type="checkbox"
              id="border-enable-checkbox"
              class="border-enable-toggle"
            />
            <span class="checkbox-custom"></span>
            <span>Add Border</span>
          </label>

          <!-- Border Width & Color (Hidden until enabled) -->
          <div id="border-options-container" style="display: none;">
            <!-- Width Buttons -->
            <div class="border-width-section">
              <label class="section-label">Width:</label>
              <div class="width-buttons-grid compact-grid">
                ${widths.map(width => `
                  <button
                    class="width-btn compact-btn"
                    data-border-width="${width.value}"
                    data-border-pixels="${width.pixels}"
                    title="${width.label} (${width.pixels}px)"
                  >
                    ${width.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Color Palette -->
            <div class="border-color-section">
              <label class="section-label">Color:</label>
              <div class="color-palette-grid compact-grid">
                ${colors.map(color => `
                  <button
                    class="color-palette-btn compact-btn"
                    data-border-color="${color.hex}"
                    title="${color.name}"
                    style="background-color: ${color.hex};"
                  ></button>
                `).join('')}
              </div>
            </div>

            <!-- Selection Display -->
            <div class="border-preview compact-preview">
              <small>Selected: <span id="border-selection-display">None</span></small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render compact production options section
   * @param {Object} product - Product object
   * @returns {string} HTML for production options
   */
  renderCompactProductionOptions(product) {
    // Build size options (common sizes)
    const sizes = [
      { value: 'xs', label: 'Extra Small' },
      { value: 's', label: 'Small' },
      { value: 'm', label: 'Medium' },
      { value: 'l', label: 'Large' },
      { value: 'xl', label: 'Extra Large' }
    ];

    return `
      <div class="compact-section production-section" data-section="production">
        <div class="section-header" data-toggle="production">
          <span class="section-title">📦 Product Options</span>
          <span class="section-toggle">▼</span>
        </div>
        <div class="section-content" id="production-content">
          <!-- Size Selection -->
          <div class="production-option">
            <label class="option-label" for="product-size-select">Size:</label>
            <select id="product-size-select" class="product-size-select">
              <option value="">Choose a size...</option>
              ${sizes.map(size => `
                <option value="${size.value}">${size.label}</option>
              `).join('')}
            </select>
          </div>

          <!-- Quantity Selection -->
          <div class="production-option">
            <label class="option-label" for="product-quantity-input">Quantity:</label>
            <div class="quantity-selector">
              <button class="qty-btn qty-minus" data-action="decrease">−</button>
              <input
                id="product-quantity-input"
                type="number"
                class="qty-input"
                value="1"
                min="1"
                max="99"
              />
              <button class="qty-btn qty-plus" data-action="increase">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
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
          <button class="options-tab" data-tab="border">
            <span>🖼️</span> Border
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

          <div class="option-panel" data-panel="border">
            ${this.renderBorderCustomizationOptions(product)}
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
   * Render border customization options
   * @param {Object} product - Product object
   * @returns {string} HTML string for border customization options
   */
  renderBorderCustomizationOptions(product) {
    // Border width options
    const widths = [
      { value: 0, label: 'None', pixels: 0 },
      { value: 1, label: 'Thin', pixels: 10 },
      { value: 2, label: 'Medium', pixels: 20 },
      { value: 3, label: 'Thick', pixels: 30 },
      { value: 4, label: 'Extra Thick', pixels: 40 }
    ];

    // 36-color palette for borders
    const colors = [
      // Primary Colors (6)
      { name: 'Red', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
      { name: 'Blue', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } },
      { name: 'Yellow', hex: '#FFFF00', rgb: { r: 255, g: 255, b: 0 } },
      { name: 'Green', hex: '#00AA00', rgb: { r: 0, g: 170, b: 0 } },
      { name: 'Purple', hex: '#AA00AA', rgb: { r: 170, g: 0, b: 170 } },
      { name: 'Orange', hex: '#FF8800', rgb: { r: 255, g: 136, b: 0 } },
      // Pastel Colors (6)
      { name: 'Soft Pink', hex: '#FFB6C1', rgb: { r: 255, g: 182, b: 193 } },
      { name: 'Soft Blue', hex: '#ADD8E6', rgb: { r: 173, g: 216, b: 230 } },
      { name: 'Soft Yellow', hex: '#FFFFE0', rgb: { r: 255, g: 255, b: 224 } },
      { name: 'Soft Green', hex: '#90EE90', rgb: { r: 144, g: 238, b: 144 } },
      { name: 'Soft Purple', hex: '#DDA0DD', rgb: { r: 221, g: 160, b: 221 } },
      { name: 'Soft Peach', hex: '#FFDAB9', rgb: { r: 255, g: 218, b: 185 } },
      // Dark/Deep Colors (6)
      { name: 'Dark Red', hex: '#8B0000', rgb: { r: 139, g: 0, b: 0 } },
      { name: 'Dark Blue', hex: '#00008B', rgb: { r: 0, g: 0, b: 139 } },
      { name: 'Dark Green', hex: '#006400', rgb: { r: 0, g: 100, b: 0 } },
      { name: 'Dark Purple', hex: '#4B0082', rgb: { r: 75, g: 0, b: 130 } },
      { name: 'Dark Brown', hex: '#654321', rgb: { r: 101, g: 67, b: 33 } },
      { name: 'Dark Gray', hex: '#404040', rgb: { r: 64, g: 64, b: 64 } },
      // Metallic Colors (6)
      { name: 'Gold', hex: '#FFD700', rgb: { r: 255, g: 215, b: 0 } },
      { name: 'Silver', hex: '#C0C0C0', rgb: { r: 192, g: 192, b: 192 } },
      { name: 'Rose Gold', hex: '#B76E79', rgb: { r: 183, g: 110, b: 121 } },
      { name: 'Bronze', hex: '#CD7F32', rgb: { r: 205, g: 127, b: 50 } },
      { name: 'Copper', hex: '#B87333', rgb: { r: 184, g: 115, b: 51 } },
      { name: 'Platinum', hex: '#E5E4E2', rgb: { r: 229, g: 228, b: 226 } },
      // Vibrant/Neon Colors (6)
      { name: 'Hot Pink', hex: '#FF1493', rgb: { r: 255, g: 20, b: 147 } },
      { name: 'Neon Green', hex: '#39FF14', rgb: { r: 57, g: 255, b: 20 } },
      { name: 'Neon Blue', hex: '#0080FF', rgb: { r: 0, g: 128, b: 255 } },
      { name: 'Electric Purple', hex: '#BF00FF', rgb: { r: 191, g: 0, b: 255 } },
      { name: 'Cyan', hex: '#00FFFF', rgb: { r: 0, g: 255, b: 255 } },
      { name: 'Lime', hex: '#BFFF00', rgb: { r: 191, g: 255, b: 0 } },
      // Neutral Colors (6)
      { name: 'White', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'Black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
      { name: 'Light Gray', hex: '#D3D3D3', rgb: { r: 211, g: 211, b: 211 } },
      { name: 'Medium Gray', hex: '#808080', rgb: { r: 128, g: 128, b: 128 } },
      { name: 'Cream', hex: '#FFFDD0', rgb: { r: 255, g: 253, b: 208 } },
      { name: 'Beige', hex: '#F5F5DC', rgb: { r: 245, g: 245, b: 220 } }
    ];

    return `
      <div class="border-customization-options">
        <h4>Add a Border (Optional)</h4>

        <div class="border-width-section">
          <label>Border Width:</label>
          <div class="width-buttons-grid">
            ${widths.map(width => `
              <button class="width-btn" data-border-width="${width.value}" data-border-pixels="${width.pixels}" title="${width.label} (${width.pixels}px)">
                ${width.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="border-color-section">
          <label>Border Color (36 Options):</label>
          <div class="color-palette-grid">
            ${colors.map(color => `
              <button class="color-palette-btn"
                      data-border-color="${color.hex}"
                      title="${color.name}"
                      style="background-color: ${color.hex};">
              </button>
            `).join('')}
          </div>
        </div>

        <div class="border-preview">
          <small>Selected: <span id="border-selection-display">None</span></small>
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
   * Show effect application feedback dialog
   * @param {Object} options - Dialog options
   */
  showEffectFeedbackDialog(options = {}) {
    const {
      title = '⏳ Applying Border Customization...',
      message = 'Please wait while your customization is being applied.',
      type = 'loading', // 'loading', 'success', 'error'
      duration = 0, // 0 = stay until closed, otherwise auto-close after milliseconds
      onClose = null
    } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'effect-feedback-overlay';
    overlay.id = 'effect-feedback-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'effect-feedback-dialog';
    dialog.id = 'effect-feedback-dialog';

    // Build dialog content
    let dialogContent = `<h3>${title}</h3><p>${message}</p>`;

    if (type === 'loading') {
      dialogContent += '<div class="effect-feedback-loading"></div>';
    } else if (type === 'success') {
      dialogContent += '<p class="effect-feedback-success">✅ Success!</p>';
    } else if (type === 'error') {
      dialogContent += '<p class="effect-feedback-error">❌ Error occurred</p>';
    }

    if (duration === 0 || type !== 'loading') {
      dialogContent += '<button class="effect-feedback-button" id="effect-feedback-close">Close</button>';
    }

    dialog.innerHTML = dialogContent;

    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    // Setup close handler
    const closeBtn = dialog.querySelector('#effect-feedback-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeEffectFeedbackDialog();
        if (onClose) onClose();
      });
    }

    // Auto-close after duration
    if (duration > 0) {
      setTimeout(() => {
        this.closeEffectFeedbackDialog();
        if (onClose) onClose();
      }, duration);
    }

    // Allow overlay click to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeEffectFeedbackDialog();
        if (onClose) onClose();
      }
    });

    return { overlay, dialog };
  }

  /**
   * Close effect feedback dialog
   */
  closeEffectFeedbackDialog() {
    const dialog = document.getElementById('effect-feedback-dialog');
    const overlay = document.getElementById('effect-feedback-overlay');

    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
  }

  /**
   * Update effect feedback dialog status
   * @param {Object} options - Update options
   */
  updateEffectFeedbackDialog(options = {}) {
    const {
      title = null,
      message = null,
      type = null
    } = options;

    const dialog = document.getElementById('effect-feedback-dialog');
    if (!dialog) return;

    if (title) {
      const titleEl = dialog.querySelector('h3');
      if (titleEl) titleEl.textContent = title;
    }

    if (message) {
      const messageEls = dialog.querySelectorAll('p:not(.effect-feedback-success):not(.effect-feedback-error)');
      if (messageEls.length > 0) {
        messageEls[0].textContent = message;
      }
    }

    if (type) {
      // Update icon/spinner visibility
      const spinner = dialog.querySelector('.effect-feedback-loading');
      const successMsg = dialog.querySelector('.effect-feedback-success');
      const errorMsg = dialog.querySelector('.effect-feedback-error');

      if (spinner) spinner.style.display = type === 'loading' ? 'block' : 'none';
      if (successMsg) successMsg.style.display = type === 'success' ? 'block' : 'none';
      if (errorMsg) errorMsg.style.display = type === 'error' ? 'block' : 'none';
    }
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
    console.log('📋 setupModalEventListeners called for modal:', modal.dataset.modalId);
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
    console.log('⚙️ setupCustomModalHandlers called, modal classes:', modal.className);
    if (modal.classList.contains('customization-modal')) {
      console.log('✅ Detected customization-modal - calling setupCustomizationModalHandlers');
      this.setupCustomizationModalHandlers(modal);
    } else if (modal.classList.contains('cart-modal')) {
      console.log('🛒 Detected cart-modal');
      this.setupCartModalHandlers(modal);
    } else if (modal.classList.contains('confirmation-dialog')) {
      console.log('⚠️ Detected confirmation-dialog');
      this.setupConfirmationDialogHandlers(modal);
    } else {
      console.warn('❌ Unknown modal type:', modal.className);
    }
  }
  
  /**
   * Setup customization modal handlers
   * @param {HTMLElement} modal - Customization modal element
   */
  setupCustomizationModalHandlers(modal) {
    console.log('🎯 setupCustomizationModalHandlers called');
    // Initialize modal state for tracking selections
    modal.dataset.selectedEffects = JSON.stringify({});
    modal.dataset.selectedBorderWidth = '0';
    modal.dataset.selectedBorderPixels = '0';
    modal.dataset.selectedBorderColor = '#000000';
    modal.dataset.selectedSize = '';
    modal.dataset.selectedQuantity = '1';

    // Click event delegation
    modal.addEventListener('click', (e) => {
      console.log('🖱️ Modal click detected on:', e.target.className, e.target.tagName);
      // Section toggle (collapse/expand)
      if (e.target.closest('.section-header')) {
        const section = e.target.closest('.compact-section');
        const content = section.querySelector('.section-content');
        const toggle = section.querySelector('.section-toggle');

        if (content) {
          content.classList.toggle('collapsed');
          section.classList.toggle('collapsed');
          toggle.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
        }
      }

      // Effect toggle checkboxes
      if (e.target.classList.contains('effect-toggle')) {
        const effectKey = e.target.dataset.effect;
        const isChecked = e.target.checked;

        // Store effect selection in modal state
        const effects = JSON.parse(modal.dataset.selectedEffects || '{}');
        effects[effectKey] = isChecked;
        modal.dataset.selectedEffects = JSON.stringify(effects);

        if (this.debugMode) {
          this.debugLog(`Effect ${effectKey} ${isChecked ? 'enabled' : 'disabled'}`, 'info', effects);
        }

        this.updateCustomizationSummary(modal);
      }

      // Border enable toggle
      if (e.target.classList.contains('border-enable-toggle')) {
        const isChecked = e.target.checked;
        const optionsContainer = modal.querySelector('#border-options-container');
        if (optionsContainer) {
          optionsContainer.style.display = isChecked ? 'block' : 'none';
        }

        modal.dataset.borderEnabled = isChecked;
        if (!isChecked) {
          modal.dataset.selectedBorderWidth = '0';
          modal.dataset.selectedBorderPixels = '0';
          modal.dataset.selectedBorderColor = '#000000';
          modal.querySelector('#border-selection-display').textContent = 'None';
        }

        if (this.debugMode) {
          this.debugLog(`Border ${isChecked ? 'enabled' : 'disabled'}`, 'info');
        }

        this.updateCustomizationSummary(modal);
      }

      // Border width button clicks
      if (e.target.classList.contains('width-btn')) {
        this.handleBorderWidthSelection(e.target, modal);
        this.updateCustomizationSummary(modal);
      }

      // Border color button clicks
      if (e.target.classList.contains('color-palette-btn')) {
        this.handleBorderColorSelection(e.target, modal);
        this.updateCustomizationSummary(modal);
      }

      // Update preview button
      if (e.target.classList.contains('update-preview-btn')) {
        const productId = e.target.dataset.productId;
        console.log('🔄 Update Preview button clicked:', productId);
        if (this.debugMode) {
          this.debugLog(`Update preview clicked for product: ${productId}`, 'info');
        }
        this.handleUpdatePreview(productId, modal);
      }

      // Add to cart with customization button
      if (e.target.classList.contains('add-to-cart-customized-btn')) {
        const productId = e.target.dataset.productId;
        this.handleAddToCartFullscreen(productId, modal);
      }

      // Cancel customization button
      if (e.target.classList.contains('cancel-customization-btn')) {
        const modalId = e.target.dataset.modalId;
        this.hideModal(modalId);
      }

      // Quantity +/- buttons
      if (e.target.classList.contains('qty-btn')) {
        const action = e.target.dataset.action;
        const input = modal.querySelector('#product-quantity-input');
        if (input) {
          let val = parseInt(input.value) || 1;
          if (action === 'increase') val++;
          else if (action === 'decrease' && val > 1) val--;
          input.value = Math.min(Math.max(val, 1), 99);
          modal.dataset.selectedQuantity = input.value;

          if (this.debugMode) {
            this.debugLog(`Quantity changed to: ${input.value}`, 'info');
          }
        }
      }
    });

    // Change event delegation (for selects and inputs)
    modal.addEventListener('change', (e) => {
      // Size dropdown
      if (e.target.classList.contains('product-size-select')) {
        modal.dataset.selectedSize = e.target.value;

        if (this.debugMode) {
          this.debugLog(`Size selected: ${e.target.value}`, 'info');
        }

        this.updateCustomizationSummary(modal);
      }
    });

    // Input event (for quantity)
    modal.addEventListener('input', (e) => {
      if (e.target.classList.contains('qty-input')) {
        const val = parseInt(e.target.value) || 1;
        modal.dataset.selectedQuantity = Math.min(Math.max(val, 1), 99);
      }
    });
  }
  
  /**
   * Handle border width selection
   * @param {HTMLElement} button - Width button element
   * @param {HTMLElement} modal - Modal element
   */
  handleBorderWidthSelection(button, modal) {
    const borderWidth = button.dataset.borderWidth;
    const borderPixels = button.dataset.borderPixels;

    // Update UI - show selection
    modal.querySelectorAll('.width-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');

    // Update display
    this.updateBorderSelectionDisplay(modal);

    // Store in modal state
    modal.dataset.selectedBorderWidth = borderWidth;
    modal.dataset.selectedBorderPixels = borderPixels;

    // Debug logging
    if (this.debugMode) {
      this.debugLog(`Border width selected: ${button.textContent.trim()} (${borderPixels}px)`, 'info', {
        value: borderWidth,
        pixels: borderPixels
      });
    }
  }

  /**
   * Handle border color selection
   * @param {HTMLElement} button - Color button element
   * @param {HTMLElement} modal - Modal element
   */
  handleBorderColorSelection(button, modal) {
    const borderColor = button.dataset.borderColor;

    // Update UI - show selection
    modal.querySelectorAll('.color-palette-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');

    // Update display
    this.updateBorderSelectionDisplay(modal);

    // Store in modal state
    modal.dataset.selectedBorderColor = borderColor;

    // Debug logging
    if (this.debugMode) {
      this.debugLog(`Border color selected: ${borderColor}`, 'info', {
        color: borderColor
      });
    }
  }

  /**
   * Update border selection display
   * @param {HTMLElement} modal - Modal element
   */
  updateBorderSelectionDisplay(modal) {
    const displayEl = modal.querySelector('#border-selection-display');
    if (!displayEl) return;

    const width = modal.dataset.selectedBorderWidth;
    const color = modal.dataset.selectedBorderColor;

    const widthLabels = {
      '0': 'None',
      '1': 'Thin',
      '2': 'Medium',
      '3': 'Thick',
      '4': 'Extra Thick'
    };

    let displayText = 'None';
    if (width && width !== '0' && color) {
      displayText = `${widthLabels[width]} border (${color})`;
    } else if (width && width !== '0') {
      displayText = `${widthLabels[width]} border (color not selected)`;
    }

    displayEl.textContent = displayText;
  }

  /**
   * Gather border customization data from modal
   * @param {HTMLElement} modal - Modal element
   * @returns {Object} Border customization object
   */
  gatherBorderCustomization(modal) {
    const width = modal.dataset.selectedBorderWidth || '0';
    const pixels = modal.dataset.selectedBorderPixels || '0';
    const color = modal.dataset.selectedBorderColor || '#000000';

    return {
      borderEnabled: width !== '0',
      borderWidth: parseInt(width),
      borderWidthPixels: parseInt(pixels),
      borderColor: color
    };
  }

  /**
   * Handle save customization button click
   * @param {string} productId - Product ID
   * @param {HTMLElement} modal - Modal element
   */
  handleSaveCustomization(productId, modal) {
    if (this.debugMode) {
      this.debugLog(`Save customization for product: ${productId}`, 'info');
    }

    // Gather customization data including border options
    const borderCustomization = this.gatherBorderCustomization(modal);

    const customization = {
      borderEnabled: borderCustomization.borderEnabled,
      borderWidth: borderCustomization.borderWidth,
      borderWidthPixels: borderCustomization.borderWidthPixels,
      borderColor: borderCustomization.borderColor,
      timestamp: new Date().toISOString()
    };

    if (this.debugMode) {
      this.debugLog(`Customization data gathered`, 'info', customization);
    }

    // Emit event to merchandise store
    if (this.eventBus) {
      this.eventBus.emit('modal.customizationSaved', {
        productId: productId,
        customization: customization
      });
    }

    // Close modal
    const modalId = modal.dataset.modalId;
    this.hideModal(modalId);

    if (this.debugMode) {
      this.debugLog(`Customization saved and modal closed`, 'success');
    }
  }

  /**
   * Handle add to cart with customization button click
   * @param {string} productId - Product ID
   * @param {HTMLElement} modal - Modal element
   */
  handleAddToCartCustomized(productId, modal) {
    if (this.debugMode) {
      this.debugLog(`Add to cart with customization: ${productId}`, 'info');
    }

    // Gather customization data including border options
    const borderCustomization = this.gatherBorderCustomization(modal);

    const customization = {
      borderEnabled: borderCustomization.borderEnabled,
      borderWidth: borderCustomization.borderWidth,
      borderWidthPixels: borderCustomization.borderWidthPixels,
      borderColor: borderCustomization.borderColor,
      timestamp: new Date().toISOString()
    };

    if (this.debugMode) {
      this.debugLog(`Customization data gathered for cart`, 'info', customization);
    }

    // Check if border customization is enabled
    if (customization.borderEnabled) {
      // Show loading dialog while applying border effects
      this.showEffectFeedbackDialog({
        title: '🖼️ Applying Border Customization...',
        message: `Applying ${customization.borderColor} border...`,
        type: 'loading'
      });

      if (this.debugMode) {
        this.debugLog(`Border effects will be applied via API`, 'info', {
          borderWidth: customization.borderWidthPixels,
          borderColor: customization.borderColor
        });
      }

      // Apply border effects via API if needed
      this.applyBorderEffects(productId, customization, modal);
    } else {
      // No border effects, add directly to cart
      if (this.eventBus) {
        this.eventBus.emit('product.addToCart', {
          productId: productId,
          customization: customization
        });
      }

      if (this.debugMode) {
        this.debugLog(`Product added to cart without border effects`, 'success');
      }

      // Close modal
      const modalId = modal.dataset.modalId;
      this.hideModal(modalId);
    }
  }

  /**
   * Apply border effects via API
   * @param {string} productId - Product ID
   * @param {Object} customization - Customization data
   * @param {HTMLElement} modal - Modal element
   */
  async applyBorderEffects(productId, customization, modal) {
    try {
      if (this.debugMode) {
        this.debugLog(`Starting border effects API call...`, 'info');
      }

      // Build effect parameters for API
      const effectParams = {
        borderEnabled: customization.borderEnabled,
        borderWidth: customization.borderWidth,
        borderWidthPixels: customization.borderWidthPixels,
        borderColor: customization.borderColor
      };

      // Call effects API
      const response = await fetch('/api/merchandise/openai-upscaler/apply-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          effectParams: effectParams
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (this.debugMode) {
        this.debugLog(`Border effects applied successfully`, 'success', result);
      }

      // Update feedback dialog
      this.updateEffectFeedbackDialog({
        title: '✅ Border Applied!',
        message: 'Your border customization has been applied successfully.',
        type: 'success'
      });

      // Set timeout to close dialog and add to cart
      setTimeout(() => {
        // Emit add to cart event
        if (this.eventBus) {
          this.eventBus.emit('product.addToCart', {
            productId: productId,
            customization: customization,
            effectsApplied: result
          });
        }

        if (this.debugMode) {
          this.debugLog(`Product added to cart with border effects`, 'success');
        }

        // Close dialogs
        this.closeEffectFeedbackDialog();
        const modalId = modal.dataset.modalId;
        this.hideModal(modalId);
      }, 2000);

    } catch (error) {
      console.error('Error applying border effects:', error);

      if (this.debugMode) {
        this.debugLog(`Error applying border effects: ${error.message}`, 'error', error);
      }

      // Update feedback dialog to show error
      this.updateEffectFeedbackDialog({
        title: '⚠️ Border Application Failed',
        message: `Error: ${error.message}. Adding to cart anyway.`,
        type: 'error'
      });

      // Still add to cart without effects after a delay
      setTimeout(() => {
        if (this.eventBus) {
          this.eventBus.emit('product.addToCart', {
            productId: productId,
            customization: customization
          });
        }

        this.closeEffectFeedbackDialog();
        const modalId = modal.dataset.modalId;
        this.hideModal(modalId);
      }, 3000);
    }
  }

  /**
   * Handle update preview button click
   * Applies all selected effects and updates the live preview image
   * @param {string} productId - Product ID
   * @param {HTMLElement} modal - Modal element
   */
  async handleUpdatePreview(productId, modal) {
    console.log('📝 handleUpdatePreview called with productId:', productId);
    if (this.debugMode) {
      this.debugLog(`Update preview for product: ${productId}`, 'info');
    }

    // Gather all selected effects from modal state
    const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}');
    console.log('📋 Selected effects from modal:', selectedEffects);

    const borderCustomization = this.gatherBorderCustomization(modal);
    console.log('🎨 Border customization:', borderCustomization);

    const effectParams = {
      ...selectedEffects,
      borderEnabled: borderCustomization.borderEnabled,
      borderWidth: borderCustomization.borderWidth,
      borderWidthPixels: borderCustomization.borderWidthPixels,
      borderColor: borderCustomization.borderColor
    };

    // Check if any effects are actually selected
    const hasAnyEffect = Object.values(selectedEffects).some(v => v === true) || borderCustomization.borderEnabled;
    console.log('✅ Has any effect selected?', hasAnyEffect, 'Selected effects:', Object.values(selectedEffects), 'Border enabled:', borderCustomization.borderEnabled);

    if (!hasAnyEffect) {
      console.warn('⚠️ No effects selected - showing alert');
      alert('Please select at least one effect to apply.');
      return;
    }

    if (this.debugMode) {
      this.debugLog(`Applying effects to preview`, 'info', effectParams);
    }

    // Show loading state
    const previewImage = modal.querySelector(`#customization-preview-image-${productId}`);
    const statusText = modal.querySelector(`#preview-status-text-${productId}`);

    console.log('🖼️ Preview image element found:', !!previewImage);
    console.log('📝 Status text element found:', !!statusText);

    if (previewImage && statusText) {
      previewImage.style.opacity = '0.5';
      statusText.textContent = 'Applying effects...';
    }

    try {
      // Call effects API
      console.log('🌐 Making API call to /api/merchandise/openai-upscaler/apply-effects');
      console.log('📦 Request payload:', { productId, effectParams });

      const response = await fetch('/api/merchandise/openai-upscaler/apply-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          effectParams: effectParams
        })
      });

      console.log('✅ API response received:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✨ API result:', result);

      if (this.debugMode) {
        this.debugLog(`Preview effects applied successfully`, 'success', result);
      }

      // Update preview image
      if (previewImage && result.metadata && result.metadata.customizedImageUrl) {
        previewImage.src = result.metadata.customizedImageUrl;
        previewImage.style.opacity = '1';
        statusText.textContent = '✅ Effects applied!';

        // Store the customized image URL in modal state
        modal.dataset.customizedImageUrl = result.metadata.customizedImageUrl;
      }

    } catch (error) {
      console.error('Error updating preview:', error);

      if (this.debugMode) {
        this.debugLog(`Error updating preview: ${error.message}`, 'error', error);
      }

      if (previewImage && statusText) {
        previewImage.style.opacity = '1';
        statusText.textContent = `❌ Error: ${error.message}`;
      }
    }
  }

  /**
   * Handle add to cart from fullscreen customization modal
   * Gathers all customization options and adds to cart
   * @param {string} productId - Product ID
   * @param {HTMLElement} modal - Modal element
   */
  handleAddToCartFullscreen(productId, modal) {
    if (this.debugMode) {
      this.debugLog(`Add to cart from fullscreen: ${productId}`, 'info');
    }

    // Gather all customization data
    const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}');
    const borderCustomization = this.gatherBorderCustomization(modal);
    const selectedSize = modal.dataset.selectedSize || '';
    const selectedQuantity = parseInt(modal.dataset.selectedQuantity || '1');

    const fullCustomization = {
      effects: selectedEffects,
      borderEnabled: borderCustomization.borderEnabled,
      borderWidth: borderCustomization.borderWidth,
      borderWidthPixels: borderCustomization.borderWidthPixels,
      borderColor: borderCustomization.borderColor,
      size: selectedSize,
      quantity: selectedQuantity,
      customizedImageUrl: modal.dataset.customizedImageUrl || null,
      timestamp: new Date().toISOString()
    };

    if (this.debugMode) {
      this.debugLog(`Full customization data`, 'info', fullCustomization);
    }

    // Validate required fields
    if (!selectedSize) {
      alert('Please select a size before adding to cart.');
      return;
    }

    // Emit event to merchandise store with full customization
    if (this.eventBus) {
      this.eventBus.emit('product.addToCart', {
        productId: productId,
        customization: fullCustomization,
        quantity: selectedQuantity
      });
    }

    if (this.debugMode) {
      this.debugLog(`Product added to cart with full customization`, 'success');
    }

    // Close modal
    const modalId = modal.dataset.modalId;
    this.hideModal(modalId);
  }

  /**
   * Update customization summary text
   * @param {HTMLElement} modal - Modal element
   */
  updateCustomizationSummary(modal) {
    const summaryEl = modal.querySelector('[id$="-summary"]');
    if (!summaryEl) return;

    const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}');
    const selectedSize = modal.dataset.selectedSize;
    const borderEnabled = modal.dataset.borderEnabled === 'true';

    const effectCount = Object.values(selectedEffects).filter(v => v === true).length;
    const parts = [];

    if (effectCount > 0) {
      parts.push(`${effectCount} effect${effectCount !== 1 ? 's' : ''}`);
    }

    if (borderEnabled) {
      const borderWidth = modal.dataset.selectedBorderWidth || '0';
      if (borderWidth !== '0') {
        parts.push('border');
      }
    }

    if (selectedSize) {
      parts.push(`size: ${selectedSize}`);
    }

    const summary = parts.length > 0 ? `Selected: ${parts.join(', ')}` : 'No customizations selected';
    summaryEl.textContent = summary;
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