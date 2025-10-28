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
    
    // Make this instance globally available for direct onclick handlers
    window.modalRenderer = this;
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

      // CRITICAL: Determine product type explicitly - no inline OR operators in templates
      const productType = product.type || product.productType || product.category || 't-shirt';
      console.log('📝 renderCustomizationModal - Product Type Determination:');
      console.log('   product.type:', product.type);
      console.log('   product.productType:', product.productType);
      console.log('   product.category:', product.category);
      console.log('   Final productType:', productType);

      // 🔍 DIAGNOSTIC: Check what image URLs we're using in the modal
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 MODAL INITIALIZATION IMAGE DIAGNOSTIC:');
      console.log('  product.previewImage:', product.previewImage?.substring(0, 80));
      console.log('  product.image:', product.image?.substring(0, 80));
      console.log('  product.sourceImage?.url:', product.sourceImage?.url?.substring(0, 80));
      console.log('  Final src being rendered:', (product.previewImage || product.image || '/images/previews/generic-product-preview.svg').substring(0, 80));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return `
        <div class="modal-overlay fullscreen-overlay" data-modal-id="${modalId}" data-product-id="${product.id}" data-product-title="${product.title}" data-product-type="${productType}" data-product-image="${product.previewImage || product.image || ''}" data-blueprint-id="${product.blueprintId || ''}" data-print-provider-id="${product.printProviderId || ''}">
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
                    data-original-image-url="${product.previewImage || product.image || '/images/previews/generic-product-preview.svg'}"
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
                <button class="btn-primary preview-finished-product-btn" data-product-id="${product.id}">
                  <span>✨</span> Preview Finished Product
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
    // 🔥 CRITICAL FIX: Remove "None" from width options
    // When a border is enabled, users must select an actual width (Thin, Medium, Thick, Extra Thick)
    // There's no "border with None width" - either you have a border or you don't
    // The "Add Border" checkbox controls whether borders are enabled
    const widths = [
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
            <!-- Width Buttons - Radio Style (Single Line) -->
            <div class="border-width-section">
              <label class="section-label">Width:</label>
              <div class="width-buttons-grid radio-grid">
                ${widths.map((width, index) => `
                  <label class="width-radio-label">
                    <input
                      type="radio"
                      name="border-width"
                      class="width-radio-input"
                      data-border-width="${width.value}"
                      data-border-pixels="${width.pixels}"
                      value="${width.value}"
                      ${index === 0 ? 'checked' : ''}
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">${width.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Color Palette - Dropdown Select with Optgroups -->
            <div class="border-color-section">
              <label class="section-label">Color:</label>
              <div class="color-select-wrapper">
                <select class="border-color-select" id="border-color-select">
                  <optgroup label="Primary Colors">
                    <option value="#FF0000">Red</option>
                    <option value="#0000FF">Blue</option>
                    <option value="#FFFF00">Yellow</option>
                    <option value="#00AA00">Green</option>
                    <option value="#AA00AA">Purple</option>
                    <option value="#FF8800">Orange</option>
                  </optgroup>
                  <optgroup label="Pastel Colors">
                    <option value="#FFB6C1">Soft Pink</option>
                    <option value="#ADD8E6">Soft Blue</option>
                    <option value="#FFFFE0">Soft Yellow</option>
                    <option value="#90EE90">Soft Green</option>
                    <option value="#DDA0DD">Soft Purple</option>
                    <option value="#FFDAB9">Soft Peach</option>
                  </optgroup>
                  <optgroup label="Dark Colors">
                    <option value="#8B0000">Dark Red</option>
                    <option value="#00008B">Dark Blue</option>
                    <option value="#006400">Dark Green</option>
                    <option value="#4B0082">Dark Purple</option>
                    <option value="#654321">Dark Brown</option>
                    <option value="#404040">Dark Gray</option>
                  </optgroup>
                  <optgroup label="Metallic Colors">
                    <option value="#FFD700">Gold</option>
                    <option value="#C0C0C0">Silver</option>
                    <option value="#B76E79">Rose Gold</option>
                    <option value="#CD7F32">Bronze</option>
                    <option value="#B87333">Copper</option>
                    <option value="#E5E4E2">Platinum</option>
                  </optgroup>
                  <optgroup label="Vibrant/Neon Colors">
                    <option value="#FF1493">Hot Pink</option>
                    <option value="#39FF14">Neon Green</option>
                    <option value="#0080FF">Neon Blue</option>
                    <option value="#BF00FF">Electric Purple</option>
                    <option value="#00FFFF">Cyan</option>
                    <option value="#BFFF00">Lime</option>
                  </optgroup>
                  <optgroup label="Neutral Colors">
                    <option value="#FFFFFF">White</option>
                    <option value="#000000" selected>Black</option>
                    <option value="#D3D3D3">Light Gray</option>
                    <option value="#808080">Medium Gray</option>
                    <option value="#FFFDD0">Cream</option>
                    <option value="#F5F5DC">Beige</option>
                  </optgroup>
                </select>
                <div class="selected-color-preview">
                  <span class="color-swatch" id="border-color-swatch" style="background-color: #000000;"></span>
                  <span class="color-label" id="border-color-label">Black</span>
                </div>
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

    return ``;
    // Production options (size, quantity) are now handled on the main product page, not in this customization modal
    // Users will choose these after seeing the product preview
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
   * Render finished product preview - Shows merchandise mockup with personalized artwork
   * @param {Object} product - Product object with customization data
   * @param {Object} customization - Customization object with effects and customizedImageUrl
   * @returns {string} HTML string for finished product preview modal
   */
  renderFinishedProductPreview(product, customization) {
    try {
      const modalId = `finished-product-preview-${product.id}`;
      const customizedImageUrl = customization?.customizedImageUrl || product.previewImage;

      return `
        <div class="modal-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog finished-product-preview" role="dialog" aria-labelledby="${modalId}-title">
            <div class="modal-header">
              <h3 id="${modalId}-title">
                <span class="modal-icon">✨</span>
                Your Finished ${product.title}
              </h3>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>

            <div class="modal-body finished-product-body">
              <div class="finished-product-content">
                <!-- Merchandise Mockup Section -->
                <div class="merchandise-mockup-section">
                  <div class="mockup-container">
                    <img src="${product.mockupImage || product.previewImage}"
                         alt="${product.title} mockup"
                         class="mockup-base-image" />
                    <div class="custom-artwork-overlay">
                      <img src="${customizedImageUrl}"
                           alt="Your custom artwork"
                           class="custom-artwork" />
                    </div>
                  </div>
                </div>

                <!-- Product Info Section -->
                <div class="finished-product-info">
                  <div class="product-name">
                    <h2>${product.title}</h2>
                  </div>

                  <div class="customization-summary">
                    <h4>Your Customizations:</h4>
                    <div class="customization-details" id="finished-product-customization-${product.id}">
                      <!-- Will be populated by JavaScript -->
                      <p class="loading-text">Loading customization details...</p>
                    </div>
                  </div>

                  <!-- Size/Variant Selection -->
                  <div class="product-options-section">
                    <h4>Select Size:</h4>
                    <div class="variant-options" id="variant-options-${product.id}" data-product-id="${product.id}">
                      ${(product.variants || []).length > 0 ? this.renderVariantOptions(product) : '<p class="text-muted">Size options loading...</p>'}
                    </div>
                  </div>

                  <!-- Quantity Selection -->
                  <div class="quantity-section">
                    <label for="finished-quantity-${product.id}">Quantity:</label>
                    <div class="quantity-controls">
                      <button class="qty-btn" data-action="decrease">−</button>
                      <input type="number" id="finished-quantity-${product.id}" class="qty-input" value="1" min="1" max="99" />
                      <button class="qty-btn" data-action="increase">+</button>
                    </div>
                  </div>

                  <div class="product-actions-info">
                    <p class="friendly-message">
                      ✨ Love what you see? Select your size and add to cart!
                    </p>
                    <p class="edit-message">
                      Want to change something? Go back and customize again - we'll save your choices!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <div class="modal-actions finished-product-actions">
                <button class="btn-secondary back-to-customize-btn" data-product-id="${product.id}">
                  ← Back to Customize
                </button>
                <button class="btn-primary add-to-cart-from-finished-btn" data-product-id="${product.id}" disabled>
                  <span>🛒</span> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

    } catch (error) {
      console.error('Error rendering finished product preview:', error);
      return this.renderModalError('finishedProduct');
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
   * Render checkout modal with payment form
   * @param {Object} cartSummary - Cart summary object
   * @returns {string} HTML string for checkout modal
   */
  renderCheckoutModal(cartSummary) {
    try {
      const modalId = 'checkout-modal';
      
      return `
        <div class="modal-overlay" data-modal-id="${modalId}">
          <div class="modal-dialog checkout-modal" role="dialog" aria-labelledby="${modalId}-title">
            <div class="modal-header">
              <h3 id="${modalId}-title">
                <span class="modal-icon">💳</span>
                Secure Checkout
              </h3>
              <button class="modal-close-btn" data-modal-id="${modalId}" aria-label="Close modal">
                <span>✕</span>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="checkout-container">
                <!-- Order Summary Section -->
                <div class="checkout-order-summary">
                  <h4>Order Summary</h4>
                  <div class="checkout-items">
                    ${cartSummary.items.map(item => this.renderCheckoutItem(item)).join('')}
                  </div>
                  <div class="checkout-totals">
                    <div class="total-row">
                      <span>Subtotal:</span>
                      <span>$${cartSummary.total.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                      <span>Shipping:</span>
                      <span>FREE</span>
                    </div>
                    <div class="total-row total">
                      <span>Total:</span>
                      <span>$${cartSummary.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <!-- Customer Details & Payment Section -->
                <div class="checkout-payment-section">
                  <form id="checkout-form" class="checkout-form">
                    <!-- Customer Information -->
                    <div class="form-section">
                      <h4>Contact Information</h4>
                      <div class="form-row">
                        <div class="form-group">
                          <label for="customer-email">Email Address *</label>
                          <input type="email" id="customer-email" name="email" required placeholder="your@email.com">
                        </div>
                      </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="form-section">
                      <h4>Shipping Address</h4>
                      <div class="form-row">
                        <div class="form-group half">
                          <label for="shipping-first-name">First Name *</label>
                          <input type="text" id="shipping-first-name" name="firstName" required>
                        </div>
                        <div class="form-group half">
                          <label for="shipping-last-name">Last Name *</label>
                          <input type="text" id="shipping-last-name" name="lastName" required>
                        </div>
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label for="shipping-address">Address *</label>
                          <input type="text" id="shipping-address" name="address" required>
                        </div>
                      </div>
                      <div class="form-row">
                        <div class="form-group half">
                          <label for="shipping-city">City *</label>
                          <input type="text" id="shipping-city" name="city" required>
                        </div>
                        <div class="form-group quarter">
                          <label for="shipping-state">State *</label>
                          <input type="text" id="shipping-state" name="state" required>
                        </div>
                        <div class="form-group quarter">
                          <label for="shipping-zip">ZIP Code *</label>
                          <input type="text" id="shipping-zip" name="zip" required>
                        </div>
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label for="shipping-country">Country *</label>
                          <select id="shipping-country" name="country" required>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <!-- Payment Information -->
                    <div class="form-section">
                      <h4>Payment Information</h4>
                      <div class="payment-security-notice">
                        <span>🔒</span> Your payment information is secure and encrypted
                      </div>
                      
                      <!-- Stripe Elements will be inserted here -->
                      <div id="stripe-card-element" class="stripe-element">
                        <!-- Stripe card element placeholder -->
                      </div>
                      <div id="stripe-card-errors" class="stripe-errors" role="alert"></div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="form-section">
                      <div class="checkbox-group">
                        <input type="checkbox" id="terms-agreement" name="terms" required>
                        <label for="terms-agreement">
                          I agree to the <a href="#" target="_blank">Terms of Service</a> and <a href="#" target="_blank">Privacy Policy</a>
                        </label>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <div class="modal-actions">
                <button class="btn-secondary back-to-cart-btn" data-modal-id="${modalId}">
                  ← Back to Cart
                </button>
                <button class="btn-primary complete-order-btn" form="checkout-form">
                  <span>💳</span> Complete Order ($${cartSummary.total.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering checkout modal:', error);
      return this.renderModalError('checkout');
    }
  }

  /**
   * Render individual checkout item
   * @param {Object} item - Cart item
   * @returns {string} HTML string for checkout item
   */
  renderCheckoutItem(item) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const itemImage = this.getItemImage(item);
    
    return `
      <div class="checkout-item">
        <div class="checkout-item-image">
          <img src="${itemImage}" alt="${item.title}" loading="lazy">
        </div>
        <div class="checkout-item-details">
          <h5>${item.title}</h5>
          <p class="checkout-item-variant">${this.getVariantDescription(item)}</p>
          <p class="checkout-item-quantity">Qty: ${item.quantity}</p>
        </div>
        <div class="checkout-item-price">
          $${itemTotal.toFixed(2)}
        </div>
      </div>
    `;
  }

  /**
   * Get item image for display
   * @param {Object} item - Cart item
   * @returns {string} Image URL
   */
  getItemImage(item) {
    return item.image || '/images/previews/generic-product-preview.svg';
  }
  
  /**
   * Get variant description for display
   * @param {Object} item - Cart item
   * @returns {string} Variant description
   */
  getVariantDescription(item) {
    // This would typically show size, color, etc.
    // For now, return a placeholder
    return item.variantId ? `Variant: ${item.variantId}` : 'Standard';
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
    // 🔥 CRITICAL FIX: Remove "None" from width options (consistent with renderCompactBorderSection)
    // Border width options - no "None" since border is controlled by the enable checkbox
    const widths = [
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
    const overlay = modalElement.firstElementChild;

    // The actual modal dialog might be inside the overlay (for fullscreen modals)
    // Try to find modal-dialog inside the overlay, otherwise use overlay itself
    let modal = overlay.querySelector('.modal-dialog') || overlay;

    // Track active modal using the overlay's modal ID
    const modalId = overlay.dataset.modalId;

    // Check if a modal with this ID already exists and remove it
    // This prevents duplicate modals when showModal is called multiple times
    const existingModal = document.querySelector(`[data-modal-id="${modalId}"]`);
    if (existingModal) {
      existingModal.remove();
    }

    // Add overlay to DOM (contains the modal-dialog)
    appendTo.appendChild(overlay);

    this.activeModals.add(modalId);

    // Setup event listeners on the modal dialog (not the overlay)
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

    // 🔥 FEATURE: Push browser history so back button closes modal instead of navigating away
    // This allows users to press browser back button to dismiss the modal and stay on /merch
    const historyState = { modalOpen: true, modalId: modalId };
    window.history.pushState(historyState, '', window.location.href);
    console.log('📜 Browser history pushed for modal:', modalId);

    // Handle back button to close this modal
    const backHandler = (event) => {
      if (event.state && event.state.modalOpen && event.state.modalId === modalId) {
        // This is our modal history state, close the modal
        this.hideModal(modalId);
        // Remove this specific handler
        window.removeEventListener('popstate', backHandler);
      }
    };
    window.addEventListener('popstate', backHandler);

    return modal;
  }
  
  /**
   * Hide modal
   * @param {string} modalId - Modal ID to hide
   */
  hideModal(modalId) {
    const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
    if (!modal) {
      return;
    }

    // Remove from active modals
    this.activeModals.delete(modalId);

    // Hide with animation
    modal.classList.add('hiding');

    // Remove after animation completes
    setTimeout(() => {
      const stillExists = document.querySelector(`[data-modal-id="${modalId}"]`);
      if (stillExists) {
        stillExists.remove();
      }

      // Re-enable body scroll if no more modals
      if (this.activeModals.size === 0) {
        document.body.classList.remove('modal-open');
      }
    }, 300); // Match CSS transition duration
  }
  
  /**
   * Setup modal event listeners
   * @param {HTMLElement} modal - Modal element (the dialog, not the overlay)
   */
  setupModalEventListeners(modal) {
    // Get modalId from the overlay (parent of modal-dialog)
    const overlay = modal.classList.contains('modal-overlay') ? modal : modal.closest('.modal-overlay');
    const modalId = overlay?.dataset.modalId;

    console.log('📋 setupModalEventListeners called for modal:', modalId);
    console.log('📋 Modal element classes:', modal.className);
    console.log('📋 Overlay element classes:', overlay?.className);

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
    } else if (modal.classList.contains('checkout-modal')) {
      console.log('💳 Detected checkout-modal');
      this.setupCheckoutModalHandlers(modal);
    } else if (modal.classList.contains('confirmation-dialog')) {
      console.log('⚠️ Detected confirmation-dialog');
      this.setupConfirmationDialogHandlers(modal);
    } else if (modal.classList.contains('finished-product-preview')) {
      console.log('🖼️ Detected finished-product-preview - custom handlers already set up');
      // Custom handlers are set up in setupFinishedProductPreviewHandlers
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

    // 🔥 CRITICAL FIX: Restore previous customization preferences if they exist
    // Get the overlay to access product customization data
    const overlay = modal.closest('.modal-overlay');
    const productId = overlay?.dataset.productId;

    console.log('🔍 DEBUG: Looking for product customization');
    console.log('  productId from modal:', productId);
    console.log('  merchandiseStore available:', !!window.merchandiseStore);

    // Try to get the product from the store to restore customization
    let previousCustomization = null;
    if (window.merchandiseStore) {
      console.log('  🔍 Searching in products array, length:', window.merchandiseStore.products?.length || 0);
      const product = window.merchandiseStore.products.find(p => (p.id || p.productId) === productId);
      console.log('  ✅ Product found:', !!product);
      if (product) {
        console.log('    - Product has customization property:', !!product.customization);
        console.log('    - Customization data:', product.customization);
      }
      if (product && product.customization) {
        previousCustomization = product.customization;
        console.log('✅ Found previous customization for product:', productId, previousCustomization);
      } else if (product) {
        console.log('⚠️ Product found but no customization data on it');
      }
    } else {
      console.log('❌ window.merchandiseStore not available');
    }

    // Initialize modal state - either from previous customization or with defaults
    if (previousCustomization) {
      // Restore previous state
      modal.dataset.selectedEffects = JSON.stringify(previousCustomization.effects || {});
      modal.dataset.selectedBorderWidth = String(previousCustomization.borderWidth || '0');
      modal.dataset.selectedBorderPixels = String(previousCustomization.borderWidthPixels || '0');
      modal.dataset.selectedBorderColor = previousCustomization.borderColor || '#000000';
      modal.dataset.borderEnabled = previousCustomization.borderEnabled ? 'true' : 'false';
      modal.dataset.customizedImageUrl = previousCustomization.customizedImageUrl || '';

      // 🔍 DIAGNOSTIC: Deep inspection of restored customization
      console.log('✅ Restored customization state from product.customization');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 CUSTOMIZATION DATA DIAGNOSTIC:');
      console.log('  Product ID:', productId);
      console.log('  Full customization object:', JSON.stringify(previousCustomization, null, 2));
      console.log('  - borderEnabled:', previousCustomization.borderEnabled);
      console.log('  - borderWidth:', previousCustomization.borderWidth);
      console.log('  - borderWidthPixels:', previousCustomization.borderWidthPixels);
      console.log('  - borderColor:', previousCustomization.borderColor);
      console.log('  - effects object:', JSON.stringify(previousCustomization.effects || {}, null, 2));
      console.log('  - customizedImageUrl length:', previousCustomization.customizedImageUrl?.length || 0);
      console.log('  - customizedImageUrl first 100 chars:', previousCustomization.customizedImageUrl?.substring(0, 100) || 'none');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      // Initialize with defaults
      modal.dataset.selectedEffects = JSON.stringify({});
      modal.dataset.selectedBorderWidth = '0';
      modal.dataset.selectedBorderPixels = '0';
      modal.dataset.selectedBorderColor = '#000000';
      modal.dataset.borderEnabled = 'false';

      console.log('✅ Initialized with default customization state');
    }

    modal.dataset.selectedSize = '';
    modal.dataset.selectedQuantity = '1';

    // 🔥 CRITICAL FIX: Restore UI state from saved customization
    // Check/uncheck effect checkboxes and border checkbox based on previousCustomization
    if (previousCustomization) {
      // Restore effect checkboxes
      const savedEffects = previousCustomization.effects || {};
      Object.entries(savedEffects).forEach(([effectKey, isEnabled]) => {
        const checkbox = modal.querySelector(`.effect-toggle[data-effect="${effectKey}"]`);
        if (checkbox) {
          checkbox.checked = isEnabled;
          console.log(`  ✅ Effect "${effectKey}" restored to ${isEnabled}`);
        }
      });

      // Restore border enable checkbox and settings
      if (previousCustomization.borderEnabled) {
        const borderCheckbox = modal.querySelector('#border-enable-checkbox');
        if (borderCheckbox) {
          borderCheckbox.checked = true;
          console.log('  ✅ Border enabled checkbox restored');

          // Show border options
          const optionsContainer = modal.querySelector('#border-options-container');
          if (optionsContainer) {
            optionsContainer.style.display = 'block';
          }

          // Restore border width
          const borderWidth = previousCustomization.borderWidth || 1;
          const widthRadio = modal.querySelector(`input[name="border-width"][value="${borderWidth}"]`);
          if (widthRadio) {
            modal.querySelectorAll('input[name="border-width"]').forEach(r => r.checked = false);
            widthRadio.checked = true;
            console.log(`  ✅ Border width restored to ${borderWidth}`);
          }

          // Restore border color
          const borderColor = previousCustomization.borderColor || '#000000';
          const colorSelect = modal.querySelector('#border-color-select');
          if (colorSelect) {
            colorSelect.value = borderColor;
            const colorSwatch = modal.querySelector('#border-color-swatch');
            if (colorSwatch) {
              colorSwatch.style.backgroundColor = borderColor;
            }
            console.log(`  ✅ Border color restored to ${borderColor}`);
          }
        }
      }

      console.log('✅ UI state restored from previous customization');

      // 🔍 DIAGNOSTIC: Check the preview image that was restored
      const previewImage = modal.querySelector('.preview-image');
      if (previewImage) {
        console.log('🖼️  PREVIEW IMAGE DIAGNOSTIC:');
        console.log('  - src attribute:', previewImage.src?.substring(0, 100) || 'none');
        console.log('  - data-original-image-url:', previewImage.dataset.originalImageUrl?.substring(0, 100) || 'none');
        console.log('  - Image complete:', previewImage.complete);
        console.log('  - Natural width/height:', previewImage.naturalWidth, 'x', previewImage.naturalHeight);
        console.log('  - Current width/height:', previewImage.width, 'x', previewImage.height);

        // Check if this is a customized image with nested borders
        if (previousCustomization.customizedImageUrl && previewImage.src.includes(previousCustomization.customizedImageUrl)) {
          console.warn('⚠️  WARNING: Preview is showing CUSTOMIZED image URL, not original!');
          console.warn('  - Customized URL:', previousCustomization.customizedImageUrl?.substring(0, 100));
          console.warn('  - This may cause border stacking if effects are reapplied');

          // 🔥 CRITICAL FIX: Reset preview to original image to prevent border stacking
          // When editing a product with existing customization, we must reset the preview
          // to the original gallery image. Otherwise, "Update Preview" applies effects
          // on top of the previously customized image, causing nested/stacked borders.
          const originalImageUrl = previewImage.dataset.originalImageUrl;
          if (originalImageUrl) {
            console.log('🔄 RESETTING preview image to original to prevent nested borders:');
            console.log('  - From (customized):', previewImage.src?.substring(0, 80));
            console.log('  - To (original):', originalImageUrl?.substring(0, 80));
            previewImage.src = originalImageUrl;
            console.log('✅ Preview image reset - nested borders will now be prevented');
          }
        }
      }
    }

    // Click event delegation
    modal.addEventListener('click', (e) => {
      console.log('🖱️ Modal click detected on:', e.target.className, e.target.tagName);

      // 🖼️ VARIANT CHIP: Update preview when chip is clicked
      if (e.target.closest('.variant-chip')) {
        const chip = e.target.closest('.variant-chip');
        const variantId = chip.dataset.variantId;
        const variantImageUrl = chip.dataset.imageUrl;
        console.log(`🔵 [CHIP-CLICK] Variant ID: ${variantId} | Image URL: ${variantImageUrl ? '✅ Found' : '❌ Missing'}`);
        if (variantImageUrl) {
          console.log(`🔄 [CHIP-CLICK] Updating preview with: ${variantImageUrl}`);
          this.updatePreviewImage(modal, variantImageUrl);
        } else {
          console.warn(`⚠️ [CHIP-CLICK] No image URL found for variant ${variantId}`);
        }
      }

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

        // 🔥 CRITICAL FIX: Explicitly set the checkbox's checked state on the DOM
        // This ensures the visual state (checkmark) matches the internal state
        e.target.checked = isChecked;

        if (optionsContainer) {
          optionsContainer.style.display = isChecked ? 'block' : 'none';
        }

        modal.dataset.borderEnabled = isChecked;

        if (isChecked) {
          // When border is enabled, set default width to "Thin" (value 1, 10 pixels)
          modal.dataset.selectedBorderWidth = '1';
          modal.dataset.selectedBorderPixels = '10';
          // Set the default width radio button to checked
          const defaultWidthRadio = modal.querySelector('input[name="border-width"][value="1"]');
          if (defaultWidthRadio) {
            modal.querySelectorAll('input[name="border-width"]').forEach(radio => {
              radio.checked = false;
            });
            defaultWidthRadio.checked = true;
          }
          modal.querySelector('#border-selection-display').textContent = 'Thin, Black';
        } else {
          // When border is disabled, clear the border settings
          modal.dataset.selectedBorderWidth = '';
          modal.dataset.selectedBorderPixels = '';
          modal.dataset.selectedBorderColor = '';
          modal.querySelector('#border-selection-display').textContent = 'None';
        }

        if (this.debugMode) {
          this.debugLog(`Border ${isChecked ? 'enabled' : 'disabled'}`, 'info');
        }

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

      // Preview finished product button
      if (e.target.classList.contains('preview-finished-product-btn')) {
        console.log('🚨🚨🚨 BUTTON CLICKED!!! 🚨🚨🚨');
        const productId = e.target.dataset.productId;
        console.log('✨ Preview Finished Product button clicked, productId:', productId);
        console.log('📋 Modal element:', modal);
        this.handlePreviewFinishedProduct(productId, modal);
      }

      // Cancel customization button
      if (e.target.classList.contains('cancel-customization-btn')) {
        const modalId = e.target.dataset.modalId;
        this.hideModal(modalId);
      }

      // Back to customize button (from preview modal)
      if (e.target.classList.contains('back-to-customize-btn')) {
        const customizationModalId = e.target.dataset.backTo;
        console.log('🔙 Back to customize clicked, restoring modal:', customizationModalId);
        
        // Hide preview modal
        const previewModal = e.target.closest('.modal-overlay');
        if (previewModal) {
          previewModal.remove();
        }
        
        // Show customization modal again
        const customizationModal = document.querySelector(`[data-modal-id="${customizationModalId}"]`);
        if (customizationModal) {
          customizationModal.style.display = 'flex';
          console.log('✅ Customization modal restored');
        }
      }

      // Add to cart button (from preview modal) 
      if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = e.target.dataset.productId;
        console.log('🛒 Add to cart clicked for product:', productId);
        // This would integrate with cart functionality
        alert('🛒 Product added to cart! (Cart integration not yet implemented)');
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
      // 🖼️ VARIANT SELECTOR: Update preview image when variant changes
      if (e.target.classList.contains('variant-selector')) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const variantId = selectedOption.value;
        const imageUrl = selectedOption.dataset.imageUrl;
        console.log(`🔴 [DROPDOWN-CHANGE] Variant ID: ${variantId} | Image URL: ${imageUrl ? '✅ Found' : '❌ Missing'}`);
        this.handleVariantSelection(e.target, modal);
      }

      // Border width radio inputs
      if (e.target.classList.contains('width-radio-input')) {
        this.handleBorderWidthSelection(e.target, modal);
        this.updateCustomizationSummary(modal);
      }

      // Border color dropdown
      if (e.target.classList.contains('border-color-select')) {
        this.handleBorderColorDropdown(e.target, modal);
        this.updateCustomizationSummary(modal);
      }

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
   * 🖼️ Handle variant selector dropdown change - Update preview image
   * @param {HTMLElement} selector - Variant selector element
   * @param {HTMLElement} modal - Modal element
   */
  handleVariantSelection(selector, modal) {
    const selectedOption = selector.options[selector.selectedIndex];
    const variantImageUrl = selectedOption.dataset.imageUrl;
    const variantId = selectedOption.value;
    const variantTitle = selectedOption.textContent;

    console.log(`📦 [HANDLE-VARIANT] Selected: "${variantTitle}" (ID: ${variantId})`);
    console.log(`   ├─ Image URL: ${variantImageUrl ? `✅ Present` : '❌ Missing'} ${variantImageUrl || ''}`);
    console.log(`   └─ Price: ${selectedOption.dataset.price || 'N/A'}`);

    if (this.debugMode) {
      this.debugLog(`Variant selected: ${variantTitle} (ID: ${variantId})`, 'info', {
        imageUrl: variantImageUrl
      });
    }

    // Store selected variant in modal data
    modal.dataset.selectedVariantId = variantId;
    modal.dataset.selectedVariantTitle = variantTitle;
    console.log(`   ✅ Variant data stored in modal.dataset`);

    // Update preview image if variant has an image
    if (variantImageUrl) {
      console.log(`   🖼️ Updating preview image: ${variantImageUrl}`);
      this.updatePreviewImage(modal, variantImageUrl);
    } else {
      console.warn(`   ⚠️ [WARN] No image URL found - preview WILL NOT UPDATE`);
    }

    // Update price display if present
    const priceValue = selectedOption.dataset.price;
    if (priceValue) {
      const priceDisplay = modal.querySelector('.selected-variant-price');
      const priceElement = priceDisplay?.querySelector('.price-value');
      if (priceElement) {
        priceElement.textContent = `$${priceValue}`;
        if (priceDisplay) {
          priceDisplay.style.display = 'block';
          console.log(`   💵 Price updated to: $${priceValue}`);
        }
      } else {
        console.warn(`   ⚠️ [WARN] Price element not found in DOM`);
      }
    } else {
      console.warn(`   ⚠️ [WARN] No price data available`);
    }

    // Enable the add to cart button
    const addBtn = modal.querySelector('.unified-cart-btn');
    if (addBtn) {
      addBtn.dataset.variantId = variantId;
      addBtn.disabled = false;
      addBtn.title = `Add ${variantTitle} to cart`;
      console.log(`   🛒 Add button enabled with variantId: ${variantId}`);
    } else {
      console.warn(`   ⚠️ [WARN] Add to cart button not found`);
    }

    this.updateCustomizationSummary(modal);
    console.log(`✅ [HANDLE-VARIANT] Complete\n`);
  }

  /**
   * 🖼️ Update preview image with smooth fade transition
   * @param {HTMLElement} modal - Modal element
   * @param {string} imageUrl - Image URL to display
   */
  updatePreviewImage(modal, imageUrl) {
    console.log(`🖼️ [UPDATE-PREVIEW] Called with imageUrl: ${imageUrl ? '✅ Present' : '❌ Missing'}`);

    if (!imageUrl) {
      console.warn(`❌ [UPDATE-PREVIEW] No imageUrl provided - ABORTING`);
      return;
    }

    const previewImg = modal.querySelector('.preview-image');
    if (!previewImg) {
      console.warn(`❌ [UPDATE-PREVIEW] .preview-image element NOT FOUND in DOM - ABORTING`);
      return;
    }

    console.log(`✅ [UPDATE-PREVIEW] Found preview image element`);
    console.log(`   ├─ Current src: ${previewImg.src}`);
    console.log(`   └─ Will change to: ${imageUrl}`);

    // Store the selected variant image
    modal.dataset.selectedVariantImage = imageUrl;

    // Fade out
    previewImg.style.transition = 'opacity 0.2s ease-in-out';
    previewImg.style.opacity = '0.5';
    console.log(`   ⏳ Starting fade-out (0.2s to opacity 0.5)`);

    // Update image source
    setTimeout(() => {
      console.log(`   🔄 (150ms later) Updating image src to: ${imageUrl}`);
      previewImg.src = imageUrl;

      // Fade back in
      setTimeout(() => {
        previewImg.style.opacity = '1';
        console.log(`   ✅ Fade-in complete (back to opacity 1.0)`);
      }, 50);
    }, 150);

    console.log(`🖼️ [UPDATE-PREVIEW] Transition complete (total ~550ms)\n`);

    if (this.debugMode) {
      this.debugLog(`Preview image updated: ${imageUrl}`, 'info');
    }
  }

  /**
   * Handle border width selection
   * @param {HTMLElement} button - Width button element
   * @param {HTMLElement} modal - Modal element
   */
  handleBorderWidthSelection(input, modal) {
    const borderWidth = input.dataset.borderWidth;
    const borderPixels = input.dataset.borderPixels;

    // Get the label text for debugging
    const label = input.closest('.width-radio-label')?.querySelector('.radio-label')?.textContent || borderWidth;

    // CRITICAL: Update the checked state of all width radio buttons
    // Remove checked from all width radios
    modal.querySelectorAll('input[name="border-width"]').forEach(radio => {
      radio.checked = false;
    });
    // Set checked on the selected one
    input.checked = true;

    // Store in modal state
    modal.dataset.selectedBorderWidth = borderWidth;
    modal.dataset.selectedBorderPixels = borderPixels;

    // Update display
    this.updateBorderSelectionDisplay(modal);

    // Debug logging
    if (this.debugMode) {
      this.debugLog(`Border width selected: ${label} (${borderPixels}px)`, 'info', {
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
    modal.querySelectorAll('.compact-color-btn').forEach(btn => btn.classList.remove('selected'));
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
   * Handle border color dropdown selection
   * @param {HTMLElement} select - Select element
   * @param {HTMLElement} modal - Modal element
   */
  handleBorderColorDropdown(select, modal) {
    const borderColor = select.value;
    const selectedText = select.options[select.selectedIndex].text;

    // Update color swatch preview
    const swatch = modal.querySelector('#border-color-swatch');
    const label = modal.querySelector('#border-color-label');

    if (swatch) {
      swatch.style.backgroundColor = borderColor;
    }
    if (label) {
      label.textContent = selectedText;
    }

    // Update display
    this.updateBorderSelectionDisplay(modal);

    // Store in modal state
    modal.dataset.selectedBorderColor = borderColor;

    // Debug logging
    if (this.debugMode) {
      this.debugLog(`Border color selected: ${selectedText} (${borderColor})`, 'info', {
        color: borderColor,
        name: selectedText
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

    // Gather all selected effects from modal state
    const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}');

    // Gather customization data including border options
    const borderCustomization = this.gatherBorderCustomization(modal);

    const customization = {
      effects: selectedEffects,
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

    // Safety check for modal parameter
    if (!modal || !modal.dataset) {
      console.error('❌ handleUpdatePreview: Invalid modal parameter', { productId, modal });
      throw new Error('Modal element is required and must have dataset property');
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

    // 🔍 DIAGNOSTIC: Check for potential nested borders or effect duplication
    if (borderCustomization.borderEnabled && borderCustomization.borderWidthPixels > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  BORDER APPLICATION DIAGNOSTIC:');
      console.log('  borderEnabled:', borderCustomization.borderEnabled);
      console.log('  borderWidth (option):', borderCustomization.borderWidth);
      console.log('  borderWidthPixels (actual):', borderCustomization.borderWidthPixels);
      console.log('  borderColor:', borderCustomization.borderColor);
      console.log('  Current modal dataset.borderEnabled:', modal.dataset.borderEnabled);
      console.log('  Full effectParams being sent to API:', JSON.stringify(effectParams, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

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
      // 🔥 CRITICAL FIX: Always use the ORIGINAL image URL, not the current preview src
      // The current preview.src may contain a previously customized image (with old borders/effects)
      // We need to always start from the original gallery image and apply fresh effects each time
      const imageUrl = previewImage?.dataset?.originalImageUrl || previewImage?.src || '/images/previews/generic-product-preview.svg';

      // Call effects API
      console.log('🌐 Making API call to /api/merchandise/openai-upscaler/apply-effects');
      console.log('📦 Image URL:', imageUrl);
      console.log('📦 effectParams:', effectParams);
      console.log('📦 Full request payload:', JSON.stringify({ upscaledImageUrl: imageUrl, effectParams }, null, 2));

      const response = await fetch('/api/merchandise/openai-upscaler/apply-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upscaledImageUrl: imageUrl,
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
      console.error('❌ Error updating preview:', error);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);

      // Try to get API error response
      try {
        if (error.response && error.response.data) {
          console.error('API error response:', error.response.data);
        }
      } catch (e) {
        // Ignore
      }

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
   * Handle preview finished product - Show merchandise mockup with custom artwork
   * @param {string} productId - Product ID
   * @param {HTMLElement} modal - Customization modal element
   */
  async handlePreviewFinishedProduct(productId, modal) {
    console.log('🚨🚨🚨 HANDLEPREVIEWFINISHEDPRODUCT CALLED!!! 🚨🚨🚨');
    console.log('🎬 🔥 UPDATED: handlePreviewFinishedProduct - Creating REAL product via Printify API!');

    if (this.debugMode) {
      this.debugLog(`Create finished product: ${productId}`, 'info');
    }

    try {
      console.log('📊 Step 1: Gathering customization data');
      // Gather all customization data
      const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}');
      const borderCustomization = this.gatherBorderCustomization(modal);
      let customizedImageUrl = modal.dataset.customizedImageUrl;
      console.log('✅ Customization data gathered:', { customizedImageUrl, borderCustomization });

      // CRITICAL FIX: Automatically update preview if not done yet
      if (!customizedImageUrl) {
        console.log('⚙️ Preview not updated yet - automatically triggering update...');
        // Automatically trigger the update preview action with correct parameters
        await this.handleUpdatePreview(productId, modal);

        // Get the newly generated customized image URL
        customizedImageUrl = modal.dataset.customizedImageUrl;
        if (customizedImageUrl) {
          console.log('✅ Auto-generated preview image:', customizedImageUrl);
        } else {
          alert('Unable to generate preview. Please try clicking "Update Preview" manually.');
          return;
        }
      }

      console.log('📊 Step 2: Building customization object');
      // Build customization object
      const customization = {
        effects: selectedEffects,
        borderEnabled: borderCustomization.borderEnabled,
        borderWidth: borderCustomization.borderWidth,
        borderWidthPixels: borderCustomization.borderWidthPixels,
        borderColor: borderCustomization.borderColor,
        customizedImageUrl: customizedImageUrl,
        timestamp: new Date().toISOString()
      };
      console.log('✅ Customization object built:', customization);

      console.log('📊 Step 3: Getting product data from modal');
      console.log('   modal element:', modal);
      console.log('   modal className:', modal?.className);
      console.log('   modal tag:', modal?.tagName);
      // Get product data from modal attributes
      const customizationOverlay = modal.closest('.modal-overlay');
      console.log('   customizationOverlay found:', !!customizationOverlay);
      if (customizationOverlay) {
        console.log('   customizationOverlay className:', customizationOverlay.className);
        console.log('   customizationOverlay data-modal-id:', customizationOverlay.dataset.modalId);
      }
      const customizationModalId = customizationOverlay?.dataset.modalId;
      const productTitle = customizationOverlay?.dataset.productTitle || 'Product';
      const productType = customizationOverlay?.dataset.productType; // CRITICAL: Must be present
      const productImage = customizationOverlay?.dataset.productImage || '/images/previews/generic-product-preview.svg';
      // 🔥 CRITICAL: Extract blueprintId and printProviderId from modal
      const blueprintId = customizationOverlay?.dataset.blueprintId ? parseInt(customizationOverlay.dataset.blueprintId, 10) : null;
      const printProviderId = customizationOverlay?.dataset.printProviderId ? parseInt(customizationOverlay.dataset.printProviderId, 10) : null;

      console.log('✅ Product data retrieved:', { productTitle, productType, productImage, blueprintId, printProviderId, customizationModalId });

      // CRITICAL VALIDATION: Product type must be explicitly set
      if (!productType || productType === '') {
        console.error('❌ CRITICAL ERROR: productType is empty or missing from modal data');
        throw new Error('Product type is missing. The product object must have type, productType, or category field. Got: "' + productType + '"');
      }

      // Create product object for Printify API
      const product = {
        id: productId,
        title: productTitle,
        type: productType,
        productType: productType,
        blueprintId: blueprintId,
        printProviderId: printProviderId,
        previewImage: productImage
      };
      console.log('✅ Product object created for API:', product);

      if (!product.id) {
        console.error(`Product ID not found`);
        alert('Product information missing. Please try again.');
        return;
      }

      console.log('📊 Step 4: 🚀 CALLING PRINTIFY API TO CREATE REAL PRODUCT!');

      // Show loading with product details while API call happens
      const productName = product.title || 'Custom Product';
      const provider = product.provider || 'Printify';
      const category = product.category || 'merchandise';
      this.showLoadingOverlay(`Creating your amazing ${productName}...`, {
        productName,
        provider,
        category,
        blueprintId: product.blueprintId,
        printProviderId: product.printProviderId
      });

      // 🔥 CALL THE MERCHANDISE STORE'S generatePrintifyMockup METHOD
      console.log('🔍 Checking for merchandise store instance...');
      console.log('📊 Available on window:', Object.keys(window).filter(k => k.toLowerCase().includes('merch')));
      console.log('📊 window.merchandiseStore:', window.merchandiseStore);
      console.log('📊 window.MerchandiseStore:', window.MerchandiseStore);

      const merchandiseStore = window.merchandiseStore; // Get reference to the main store
      console.log('📊 merchandiseStore found:', !!merchandiseStore);
      console.log('📊 generatePrintifyMockup method available:', !!(merchandiseStore && typeof merchandiseStore.generatePrintifyMockup === 'function'));

      if (!merchandiseStore) {
        console.error('❌ window.merchandiseStore is not available');
        console.error('📊 Trying window.store...');
        console.log('📊 window.store:', window.store);

        // Try to use window.store as fallback
        const fallbackStore = window.store;
        if (fallbackStore && typeof fallbackStore.generatePrintifyMockup === 'function') {
          console.log('✅ Using fallback store');
          // Use fallback instead of throwing error immediately
          try {
            await fallbackStore.generatePrintifyMockup(product, customization);
            console.log('✅ PRINTIFY API CALL COMPLETED via FALLBACK!');
            this.hideLoadingOverlay();
            return; // Early return to skip the rest
          } catch (fallbackError) {
            console.error('❌ Fallback store call failed:', fallbackError);
            this.hideLoadingOverlay();
            throw fallbackError;
          }
        }

        alert('❌ DEBUG: Merchandise store not available. Check console for details.');
        throw new Error('Merchandise store not available. Please refresh the page.');
      }

      if (typeof merchandiseStore.generatePrintifyMockup !== 'function') {
        console.error('❌ generatePrintifyMockup method not found on store');
        console.error('📊 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(merchandiseStore)).filter(name => typeof merchandiseStore[name] === 'function'));
        throw new Error('Printify API method not available. Please refresh the page.');
      }

      console.log('✅ All checks passed, calling Printify API...');

      // Call the actual Printify API via the merchandise store
      try {
        await merchandiseStore.generatePrintifyMockup(product, customization);
        console.log('✅ PRINTIFY API CALL COMPLETED!');
      } catch (apiError) {
        console.error('❌ Printify API call threw error:', apiError);
        this.hideLoadingOverlay();
        throw apiError;
      }

      // 🔥 CRITICAL FIX: Save customization back to the product in the store
      // This is essential so that when users click Edit again, their previous
      // customizations (effects, borders, colors) are restored
      console.log('📊 Step 4.5: Saving customization to product in store');
      if (merchandiseStore && merchandiseStore.products) {
        const productInStore = merchandiseStore.products.find(p => (p.id || p.productId) === productId);
        if (productInStore) {
          productInStore.customization = customization;
          console.log('✅ Customization saved to product:', productInStore.id || productInStore.productId);
          console.log('  Saved customization:', customization);
        } else {
          console.warn('⚠️ Product not found in store to save customization');
        }
      }

      // Hide loading
      this.hideLoadingOverlay();

      console.log('📊 Step 5: Close customization modal and show success');
      console.log('   customizationOverlay available:', !!customizationOverlay);
      console.log('   customizationModalId available:', !!customizationModalId);
      console.log('   customizationModalId value:', customizationModalId);

      // Close the customization modal completely (reuse existing variables)
      if (customizationOverlay && customizationModalId) {
        console.log('🔄 Attempting to close modal:', customizationModalId);
        this.hideModal(customizationModalId);
        console.log('✅ Customization modal closed (hideModal called)');
      } else {
        console.warn('⚠️ Could not find customization modal to close');
        console.warn('   customizationOverlay:', customizationOverlay);
        console.warn('   customizationModalId:', customizationModalId);
        // Fallback: remove the modal overlay directly
        if (customizationOverlay) {
          console.log('🔄 Using fallback: removing overlay directly');
          customizationOverlay.remove();
          console.log('✅ Customization modal removed directly');
        }
      }

      // Show success message to user (no useless preview modal)
      if (merchandiseStore && typeof merchandiseStore.showSuccess === 'function') {
        merchandiseStore.showSuccess('✅ Your custom product has been created successfully!');
        console.log('✅ Success message shown');
      }

      // Trigger page re-render to show the new product
      if (merchandiseStore && typeof merchandiseStore.render === 'function') {
        merchandiseStore.render();
        console.log('✅ Merchandise store re-rendered with new product');

        // 🔥 CRITICAL: Focus on newly created product so user doesn't have to search
        // After render completes, find and scroll to the most recently created product
        setTimeout(() => {
          const productCards = document.querySelectorAll('.product-card');
          if (productCards.length > 0) {
            // Get the last product card (most recently created)
            const newestProductCard = productCards[productCards.length - 1];

            // Scroll into view with smooth animation
            newestProductCard.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // Focus on the card for accessibility
            newestProductCard.focus();

            // Add a highlight animation to draw attention
            newestProductCard.style.animation = 'highlight-pulse 2s ease-in-out';

            console.log('✅ Scrolled to newly created product and set focus');
          }
        }, 300); // Small delay to ensure DOM is fully updated
      }

      if (this.debugMode) {
        this.debugLog(`Real product created via Printify API!`, 'success');
      }

    } catch (error) {
      console.error('💥 Error in handlePreviewFinishedProduct:', error);
      console.error('💥 Error stack:', error.stack);
      console.error('💥 Error name:', error.name);
      console.error('💥 Error message:', error.message);
      
      // Hide loading overlay in case it's showing
      this.hideLoadingOverlay();
      
      if (this.debugMode) {
        this.debugLog(`Error in handlePreviewFinishedProduct: ${error.message}`, 'error', error);
      }
      
      // Show more detailed error to user
      alert(`❌ DEBUG ERROR: ${error.message}\n\nCheck browser console for details.`);
    }
  }

  /**
   * Setup event handlers for finished product preview modal
   * @param {HTMLElement} modal - Preview modal element
   * @param {string} productId - Product ID
   * @param {Object} customization - Customization object
   * @param {string} customizationModalId - ID of the customization modal to restore on back
   */
  setupFinishedProductPreviewHandlers(modal, productId, customization, customizationModalId) {
    // Get preview modal ID from the modal itself (it may be the overlay or a wrapper)
    let previewModalId = modal.dataset.modalId;
    if (!previewModalId && modal.querySelector('.modal-overlay')) {
      previewModalId = modal.querySelector('.modal-overlay').dataset.modalId;
    }
    if (!previewModalId) {
      console.error('❌ Could not find preview modal ID');
      return;
    }

    // Back to customize button
    const backBtn = modal.querySelector('.back-to-customize-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        console.log('🔙 Back to customize clicked');

        // Hide the preview modal
        this.hideModal(previewModalId);

        // Restore the customization modal that was hidden
        if (customizationModalId) {
          const customizationOverlay = document.querySelector(
            `[data-modal-id="${customizationModalId}"]`
          );
          if (customizationOverlay) {
            console.log('✅ Restoring customization modal:', customizationModalId);
            customizationOverlay.style.display = '';
            customizationOverlay.classList.remove('hidden-by-preview');
            customizationOverlay.classList.add('show');

            // Restore focus
            const firstFocusable = customizationOverlay.querySelector(
              'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
              firstFocusable.focus();
            }
          } else {
            console.warn('⚠️ Customization modal not found:', customizationModalId);
          }
        }

        if (this.debugMode) {
          this.debugLog('Returned to customization', 'info');
        }
      });
    }

    // 🔥 FEATURE: Variant/Size selection
    // Handle variant option button clicks
    const variantBtns = modal.querySelectorAll('.variant-option-btn');
    variantBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const variantId = btn.dataset.variantId;
        const variantTitle = btn.dataset.variantTitle;

        console.log('📦 Variant selected:', { variantId, variantTitle });

        // Update button styling to show selected state
        variantBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Store selected variant in modal dataset for later use
        modal.dataset.selectedVariantId = variantId;
        modal.dataset.selectedVariantTitle = variantTitle;

        // Enable add to cart button now that size is selected
        const addToCartBtn = modal.querySelector('.add-to-cart-from-finished-btn');
        if (addToCartBtn) {
          addToCartBtn.disabled = false;
          addToCartBtn.style.opacity = '1';
          addToCartBtn.style.cursor = 'pointer';
        }

        if (this.debugMode) {
          this.debugLog(`Size selected: ${variantTitle}`, 'info');
        }
      });
    });

    // 🔥 FEATURE: Quantity controls in finished product modal
    const quantityInput = modal.querySelector('[id^="finished-quantity-"]');
    if (quantityInput) {
      // Handle +/- buttons
      const qtyBtns = modal.querySelectorAll('.quantity-controls .qty-btn');
      qtyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          let currentQty = parseInt(quantityInput.value) || 1;

          if (action === 'increase') {
            currentQty = Math.min(currentQty + 1, 99);
          } else if (action === 'decrease') {
            currentQty = Math.max(currentQty - 1, 1);
          }

          quantityInput.value = currentQty;
          modal.dataset.selectedQuantity = currentQty;

          if (this.debugMode) {
            this.debugLog(`Quantity: ${currentQty}`, 'info');
          }
        });
      });

      // Handle direct input
      quantityInput.addEventListener('input', () => {
        let qty = parseInt(quantityInput.value) || 1;
        qty = Math.min(Math.max(qty, 1), 99);
        quantityInput.value = qty;
        modal.dataset.selectedQuantity = qty;
      });
    }

    // Add to cart from finished product button
    const addToCartBtn = modal.querySelector('.add-to-cart-from-finished-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        console.log('🛒 Add to cart from finished product');
        this.handleAddToCartFromFinishedProduct(
          productId,
          customization,
          modal.dataset.selectedVariantId,
          parseInt(modal.dataset.selectedQuantity || '1')
        );
      });
    }

    // Close button is already handled by setupModalEventListeners
    // No need to add duplicate listeners here
    console.log('🔍 Close button handling already set up in setupModalEventListeners');
  }

  /**
   * Update customization summary in finished product preview
   * @param {HTMLElement} modal - Preview modal element
   * @param {Object} customization - Customization object
   */
  updateFinishedProductCustomizationSummary(modal, customization) {
    const summaryDiv = modal.querySelector('[id^="finished-product-customization-"]');
    if (!summaryDiv) return;

    const details = [];

    // Effects
    const enabledEffects = Object.entries(customization.effects || {})
      .filter(([key, value]) => value)
      .map(([key]) => this.formatEffectName(key));

    if (enabledEffects.length > 0) {
      details.push(`<strong>Effects:</strong> ${enabledEffects.join(', ')}`);
    } else {
      details.push('<strong>Effects:</strong> None');
    }

    // Border
    if (customization.borderEnabled) {
      details.push(`<strong>Border:</strong> ${customization.borderWidth} (${customization.borderColor})`);
    } else {
      details.push('<strong>Border:</strong> None');
    }

    if (details.length > 0) {
      summaryDiv.innerHTML = details.map(detail => `<p>${detail}</p>`).join('');
    }
  }

  /**
   * Handle add to cart from finished product preview
   * Transitions to main page's product options (size, quantity)
   * @param {string} productId - Product ID
   * @param {Object} customization - Customization object
   */
  handleAddToCartFromFinishedProduct(productId, customization, variantId = null, quantity = 1) {
    if (this.debugMode) {
      this.debugLog(`Add to cart from finished product preview`, 'info');
    }

    // Validate that variant was selected
    if (!variantId) {
      alert('Please select a size before adding to cart.');
      return;
    }

    // Close the preview modal
    const previewModal = document.querySelector(`[data-modal-id="finished-product-preview-${productId}"]`);
    const customizationModal = document.querySelector('[data-modal-id^="customization-modal-"]');

    if (previewModal) {
      previewModal.parentElement.remove();
    }
    if (customizationModal) {
      customizationModal.parentElement.remove();
    }

    // 🔥 CRITICAL: Extract product data from the customization modal's parent overlay
    const customizationOverlay = customizationModal?.closest('.modal-overlay');
    const productType = customizationOverlay?.dataset.productType;
    const blueprintId = customizationOverlay?.dataset.blueprintId ? parseInt(customizationOverlay.dataset.blueprintId, 10) : null;
    const printProviderId = customizationOverlay?.dataset.printProviderId ? parseInt(customizationOverlay.dataset.printProviderId, 10) : null;

    console.log('🎯 handleAddToCartFromFinishedProduct - Extracted data:');
    console.log('   productId:', productId);
    console.log('   variantId:', variantId);
    console.log('   quantity:', quantity);
    console.log('   productType:', productType);
    console.log('   blueprintId:', blueprintId);
    console.log('   printProviderId:', printProviderId);

    // 🔥 FEATURE: Emit product.addToCart event with full cart data
    // This will be handled by merchandise-store.js handleAddToCart()
    if (this.eventBus) {
      this.eventBus.emit('product.addToCart', {
        productId: productId,
        variantId: variantId,
        customization: customization,
        quantity: quantity,
        // Also include product metadata for commerce operations
        productType: productType,
        blueprintId: blueprintId,
        printProviderId: printProviderId
      });

      console.log('✅ Add to cart event emitted');
    }

    if (this.debugMode) {
      this.debugLog(`Product added to cart with variant ${variantId} (qty: ${quantity})`, 'success');
    }
  }

  /**
   * Helper: Format effect name for display
   * @param {string} effectKey - Effect key (e.g., 'colorGrade')
   * @returns {string} Formatted effect name
   */
  formatEffectName(effectKey) {
    const effectNames = {
      'colorGrade': 'Color Grade',
      'bloom': 'Bloom',
      'vignette': 'Vignette',
      'lightning': 'Lightning',
      'edgeBlur': 'Edge Blur',
      'filmGrain': 'Film Grain'
    };
    return effectNames[effectKey] || effectKey;
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
      } else if (e.target.classList.contains('checkout-modal-btn')) {
        // Handle checkout from cart modal
        console.log('💳 Checkout button clicked from cart modal');
        if (this.eventBus) {
          this.eventBus.emit('checkout.initiate');
        }
        this.hideModal('cart-modal'); // Close cart modal
      } else if (e.target.classList.contains('continue-shopping-modal-btn')) {
        // Handle continue shopping from cart modal
        console.log('🛍️ Continue shopping from cart modal');
        this.hideModal('cart-modal'); // Close cart modal
      }
    });
  }

  /**
   * Setup checkout modal handlers
   * @param {HTMLElement} modal - Checkout modal element
   */
  setupCheckoutModalHandlers(modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('back-to-cart-btn')) {
        // Handle back to cart from checkout modal
        console.log('🔙 Back to cart from checkout modal');
        this.hideModal('checkout-modal'); // Close checkout modal
        
        // Show cart modal again
        setTimeout(() => {
          if (this.eventBus) {
            this.eventBus.emit('cart.checkout'); // This will show cart modal
          }
        }, 100);
        
      }
      // Note: complete-order-btn handler is attached separately in merchandise store
      // because it needs access to Stripe and payment processing logic
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

  /**
   * Show finished product preview modal
   * @param {Object} product - Product object
   * @param {Object} customization - Customization object  
   * @param {string} customizationModalId - ID of customization modal to restore
   */
  // REMOVED: showFinishedProductPreview - useless modal that just shows the same image user already customized

  /**
   * Show loading overlay during API calls
   */
  showLoadingOverlay(message = 'Loading...', productDetails = null) {
    // Remove existing overlay if any
    this.hideLoadingOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'printify-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-size: 18px;
      text-align: center;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    `;

    // Build product details section if available
    const productDetailsHTML = productDetails ? `
      <div style="
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 30px;
        border-left: 4px solid rgba(100, 200, 255, 0.6);
      ">
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
          📦 ${productDetails.productName || 'Product'}
        </div>
        <div style="
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          text-align: left;
        ">
          <div>🏢 Provider: <strong>${productDetails.provider || 'N/A'}</strong></div>
          <div>📂 Category: <strong>${productDetails.category || 'N/A'}</strong></div>
        </div>
      </div>
    ` : '';

    // 🔥 ENHANCED: Multi-step progress overlay with product details and better visual feedback
    overlay.innerHTML = `
      <div style="
        background: rgba(0, 0, 0, 0.5);
        border-radius: 24px;
        padding: 60px 80px;
        max-width: 700px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.1);
      ">
        <!-- Animated Spinner -->
        <div style="
          font-size: 64px;
          margin-bottom: 40px;
          animation: spin 2s linear infinite;
          display: inline-block;
        ">✨</div>

        <!-- Main Message -->
        <div style="
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 30px;
          color: #ffffff;
          letter-spacing: 0.5px;
        ">${message}</div>

        <!-- Product Details -->
        ${productDetailsHTML}

        <!-- Progress Steps -->
        <div style="
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
          margin-top: 40px;
          text-align: left;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        ">
          <div class="progress-step" data-step="upscale" style="opacity: 0.7; transition: opacity 0.3s ease;">
            <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; margin-right: 12px;">📸</span>
            Auto-upscaling your artwork for crisp, beautiful output
          </div>
          <div class="progress-step" data-step="customize" style="opacity: 0.7; transition: opacity 0.3s ease;">
            <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; margin-right: 12px;">🎨</span>
            Applying your custom effects and borders
          </div>
          <div class="progress-step" data-step="create" style="opacity: 0.7; transition: opacity 0.3s ease;">
            <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; margin-right: 12px;">🛍️</span>
            Creating your bespoke product with precision
          </div>
        </div>

        <!-- Encouraging Message -->
        <div style="
          margin-top: 40px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        ">
          This usually takes 10-15 seconds... crafting something special just for you ✨
        </div>
      </div>

      <style>
        @keyframes spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .progress-step {
          animation: pulse 2s ease-in-out infinite;
        }
      </style>
    `;
    document.body.appendChild(overlay);

    // Animate progress steps sequentially
    setTimeout(() => {
      const upscaleStep = overlay.querySelector('[data-step="upscale"]');
      if (upscaleStep) upscaleStep.style.opacity = '1';
    }, 500);

    setTimeout(() => {
      const customizeStep = overlay.querySelector('[data-step="customize"]');
      if (customizeStep) customizeStep.style.opacity = '1';
    }, 3000);

    setTimeout(() => {
      const createStep = overlay.querySelector('[data-step="create"]');
      if (createStep) createStep.style.opacity = '1';
    }, 6000);
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('printify-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Render variant/size options for finished product modal
   * Maps Printify variants to user-friendly size labels
   * @param {Object} product - Product object with variants array
   * @returns {string} HTML for variant selection buttons
   */
  renderVariantOptions(product) {
    if (!product.variants || product.variants.length === 0) {
      return '<p class="text-muted">No size options available</p>';
    }

    // Map variant properties to user-friendly labels
    // Variants have: id, title, options (which include size), price, etc.
    return product.variants.map(variant => {
      // Extract size from variant title or options
      let sizeLabel = 'Size';
      if (variant.title) {
        // Try to extract size from title (e.g., "Mug 11oz" or "T-Shirt - M")
        const titleParts = variant.title.split(' - ');
        if (titleParts.length > 1) {
          sizeLabel = titleParts[1];
        } else if (variant.title.includes('11oz')) {
          sizeLabel = '11oz';
        } else if (variant.title.includes('20oz')) {
          sizeLabel = '20oz';
        }
      }

      // Use variant ID as the value (for adding to cart)
      return `
        <button class="variant-option-btn" data-variant-id="${variant.id}" data-variant-title="${variant.title || sizeLabel}">
          ${sizeLabel}
        </button>
      `;
    }).join('');
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