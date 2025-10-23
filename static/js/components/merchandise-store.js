/**
 * Merchandise Store Frontend Component
 * 
 * Interactive interface for creating custom merchandise from gallery images
 */

class MerchandiseStore {
  constructor() {
    this.selectedImage = null;
    this.cart = [];
    this.products = [];
    this.productTypes = {};
    this.availableProducts = [];
    this.isLoading = false;
    
    this.init();
  }
  
  async init() {
    console.log('🛍️ Initializing Merchandise Store');
    
    // Check enhancement capabilities
    await this.loadEnhancementStatus();
    
    // Load product types first
    await this.loadProductTypes();
    
    // Load user's gallery images
    await this.loadGalleryImages();
    
    // Load existing products
    await this.loadUserProducts();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Render initial state
    this.render();
  }
  
  async loadEnhancementStatus() {
    try {
      const response = await fetch('/api/merchandise/enhancement-status');
      const data = await response.json();
      
      if (data.success) {
        this.enhancementStatus = data.enhancement;
        console.log('🎨 Enhancement status:', this.enhancementStatus);
      } else {
        this.enhancementStatus = { available: false };
      }
    } catch (error) {
      console.error('Error loading enhancement status:', error);
      this.enhancementStatus = { available: false };
    }
  }
  
  async loadGalleryImages() {
    try {
      this.setLoading(true, 'Loading your gallery images...');
      
      const response = await fetch('/api/merchandise/gallery-images', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.galleryImages = data.images;
        console.log(`📸 Loaded ${this.galleryImages.length} gallery images`);
      } else {
        throw new Error(data.error || 'Failed to load gallery images');
      }
      
    } catch (error) {
      console.error('Error loading gallery images:', error);
      this.showError('Failed to load gallery images: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }
  
  async loadProductTypes() {
    try {
      this.setLoading(true, 'Loading product options...');
      
      const response = await fetch('/api/merchandise/product-types');
      
      const data = await response.json();
      
      if (data.success) {
        this.productTypes = data.productTypes;
        this.availableProducts = data.allProducts;
        console.log(`📋 Loaded ${this.availableProducts.length} product types`);
      } else {
        throw new Error(data.error || 'Failed to load product types');
      }
      
    } catch (error) {
      console.error('Error loading product types:', error);
      this.showError('Failed to load product options: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }
  
  async loadUserProducts() {
    try {
      const response = await fetch('/api/merchandise/products', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.products = data.products;
        console.log(`📦 Loaded ${this.products.length} user products`);
      } else {
        console.warn('No existing products found');
      }
      
    } catch (error) {
      console.error('Error loading user products:', error);
    }
  }
  
  async createProduct(imageId, productOptions) {
    try {
      this.setLoading(true, 'Creating your custom product...');
      
      const response = await fetch('/api/merchandise/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          imageId,
          productOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.products.push(data.product);
        
        // Show enhancement feedback
        let message = data.message || 'Custom product created successfully!';
        if (data.enhancement?.autoEnhanced) {
          message += ' ✨ Your image was automatically enhanced for better print quality!';
        }
        
        this.showSuccess(message);
        this.render();
        return data.product;
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
      
    } catch (error) {
      console.error('Error creating product:', error);
      this.showError('Failed to create product: ' + error.message);
      return null;
    } finally {
      this.setLoading(false);
    }
  }
  
  /**
   * Check if an image needs enhancement by seeing if we have a cached version
   * @param {string} imageId - Gallery image ID
   * @returns {Promise<boolean>} True if enhancement will be needed
   */
  async checkIfImageNeedsEnhancement(imageId) {
    try {
      const response = await fetch('/api/merchandise/check-enhancement-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ imageId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // If there's no cached enhanced version, enhancement will be needed
        return !data.hasEnhancedVersion;
      }
      
      // If we can't check, assume enhancement might be needed
      return true;
      
    } catch (error) {
      console.warn('Could not check enhancement status:', error);
      // If we can't check, assume enhancement might be needed
      return true;
    }
  }

  async createGuidedProduct(imageId, productType, customOptions = {}) {
    try {
      // First, check if the image needs enhancement to show appropriate loading message
      const needsEnhancement = await this.checkIfImageNeedsEnhancement(imageId);
      
      let loadingMessage = `Creating your ${productType}...`;
      if (needsEnhancement) {
        loadingMessage = `🎨 Preparing image for print quality...`;
        this.setLoading(true, loadingMessage);
        
        // Show progressive loading messages
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🔍 Analyzing image quality...`);
          }
        }, 1000);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `✨ Enhancing image for optimal printing...`);
          }
        }, 3000);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🎽 Creating your ${productType}...`);
          }
        }, 8000);
      } else {
        this.setLoading(true, loadingMessage);
      }
      
      const response = await fetch('/api/merchandise/create-guided-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          imageId,
          productType,
          customOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.products.push(data.product);
        
        // Show enhancement feedback
        let message = data.message || `${productType} created successfully!`;
        if (data.enhancement?.autoEnhanced) {
          if (data.enhancement.enhancementSource === 'generated') {
            message += ' ✨ Your image was automatically enhanced for optimal print quality!';
          } else if (data.enhancement.enhancementSource === 'cached') {
            message += ' ♻️ Used your previously optimized image for the best print quality!';
          }
        }
        
        this.showSuccess(message);
        this.render();
        return data.product;
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
      
    } catch (error) {
      console.error('Error creating guided product:', error);
      this.showError('Failed to create product: ' + error.message);
      return null;
    } finally {
      this.setLoading(false);
    }
  }
  
  async addToCart(productId, variantId, quantity = 1) {
    try {
      // Find the product
      const product = this.products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Find the variant
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        throw new Error('Product variant not found');
      }
      
      // Add to cart
      const cartItem = {
        productId,
        variantId,
        quantity,
        product: product,
        variant: variant,
        price: variant.price
      };
      
      // Check if item already in cart
      const existingItemIndex = this.cart.findIndex(
        item => item.productId === productId && item.variantId === variantId
      );
      
      if (existingItemIndex >= 0) {
        this.cart[existingItemIndex].quantity += quantity;
      } else {
        this.cart.push(cartItem);
      }
      
      this.saveCartToStorage();
      this.renderCart();
      this.showSuccess('Added to cart!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showError('Failed to add to cart: ' + error.message);
    }
  }
  
  removeFromCart(productId, variantId) {
    this.cart = this.cart.filter(
      item => !(item.productId === productId && item.variantId === variantId)
    );
    
    this.saveCartToStorage();
    this.renderCart();
  }
  
  updateCartQuantity(productId, variantId, quantity) {
    const item = this.cart.find(
      item => item.productId === productId && item.variantId === variantId
    );
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId, variantId);
      } else {
        item.quantity = quantity;
        this.saveCartToStorage();
        this.renderCart();
      }
    }
  }
  
  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  
  async checkout() {
    try {
      if (this.cart.length === 0) {
        this.showError('Your cart is empty');
        return;
      }
      
      // Show checkout modal
      this.showCheckoutModal();
      
    } catch (error) {
      console.error('Error during checkout:', error);
      this.showError('Checkout failed: ' + error.message);
    }
  }
  
  setupEventListeners() {
    // Image selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('gallery-image-select')) {
        const imageId = e.target.dataset.imageId;
        this.selectImage(imageId);
      }
      
      // Preview enhancement
      if (e.target.classList.contains('btn-preview-enhancement')) {
        const imageId = e.target.dataset.imageId;
        this.previewEnhancement(imageId);
      }
    });
    
    // Product creation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('create-product-btn')) {
        this.showProductCreationModal();
      }
      
      // Guided product creation
      if (e.target.classList.contains('create-guided-product-btn')) {
        this.showGuidedProductCreationModal();
      }
      
      // Product type selection
      if (e.target.classList.contains('select-product-type-btn')) {
        const productType = e.target.dataset.productType;
        this.selectProductType(productType);
      }
    });
    
    // Add to cart
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = e.target.dataset.productId;
        const variantId = e.target.dataset.variantId;
        this.addToCart(productId, variantId);
      }
    });
    
    // Cart management
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-from-cart')) {
        const productId = e.target.dataset.productId;
        const variantId = e.target.dataset.variantId;
        this.removeFromCart(productId, variantId);
      }
    });
    
    // Checkout
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('checkout-btn')) {
        this.checkout();
      }
    });
  }
  
  async previewEnhancement(imageId) {
    try {
      this.setLoading(true, 'Generating enhancement preview...');
      
      const response = await fetch('/api/merchandise/preview-enhancement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ imageId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showEnhancementPreview(data.original, data.enhanced, data.analysis);
      } else {
        throw new Error(data.error || 'Failed to generate preview');
      }
      
    } catch (error) {
      console.error('Error previewing enhancement:', error);
      this.showError('Failed to preview enhancement: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }
  
  showEnhancementPreview(original, enhanced, analysis) {
    const modal = document.createElement('div');
    modal.className = 'modal enhancement-preview-modal';
    modal.innerHTML = `
      <div class="modal-content enhancement-preview-content">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>🎨 Print Quality Preview</h2>
        <p class="preview-note">This shows how your image will be automatically optimized for high-quality printing.</p>
        
        <div class="enhancement-comparison">
          <div class="image-comparison">
            <div class="comparison-side">
              <h3>Original Image</h3>
              <img src="${original.url}" alt="Original" class="comparison-image" />
              <div class="image-stats">
                <p><strong>Size:</strong> ${original.width}×${original.height}</p>
                <p><strong>Quality:</strong> ${original.suitableForPrint ? '✅ Print Ready' : '⚠️ Low Quality'}</p>
              </div>
            </div>
            
            <div class="comparison-side">
              <h3>Enhanced Image</h3>
              <img src="${enhanced.url}" alt="Enhanced" class="comparison-image" />
              <div class="image-stats">
                <p><strong>Size:</strong> ${enhanced.width}×${enhanced.height}</p>
                <p><strong>Quality:</strong> ✅ Print Ready</p>
                <p><strong>Method:</strong> ${analysis.method}</p>
              </div>
            </div>
          </div>
          
          <div class="enhancement-analysis">
            <h3>Print Optimization Details</h3>
            <p class="optimization-note">When you create merchandise, the enhanced version will be automatically used for the best print quality.</p>
            <ul>
              <li><strong>Improvement:</strong> ${analysis.improvementDescription}</li>
              <li><strong>Scale Factor:</strong> ${analysis.scaleFactor}x</li>
              <li><strong>Processing Time:</strong> ${analysis.processingTime}ms</li>
            </ul>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
            Close Preview
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
  }
  
  render() {
    const container = document.getElementById('merchandise-store');
    if (!container) return;
    
    container.innerHTML = `
      <div class="merchandise-store">
        <div class="store-header">
          <h1>🛍️ Create Custom Merchandise</h1>
          <p>Turn your favorite Wavelength moments into premium merchandise</p>
        </div>
        
        <div class="store-content">
          <div class="store-section">
            <h2>📸 Select Your Image</h2>
            <div class="gallery-grid">
              ${this.renderGalleryImages()}
            </div>
          </div>
          
          ${this.selectedImage ? `
          <div class="store-section">
            <h2>🎽 Choose Your Product</h2>
            <p class="section-description">Pick what you'd like to create - we'll handle the naming and details!</p>
            <div class="product-types-grid">
              ${this.renderProductTypes()}
            </div>
          </div>
          ` : ''}
          
          <div class="store-section">
            <h2>📦 Your Created Products</h2>
            <div class="products-grid">
              ${this.renderProducts()}
            </div>
          </div>
          
          <div class="store-section">
            <h2>🛒 Shopping Cart</h2>
            <div class="cart-container">
              ${this.renderCart()}
            </div>
          </div>
        </div>
      </div>
      
      ${this.renderModals()}
    `;
  }
  
  renderGalleryImages() {
    if (!this.galleryImages || this.galleryImages.length === 0) {
      return `
        <div class="empty-state">
          <p>No images in your gallery yet.</p>
          <p>Save images from episodes and content pages to get started!</p>
        </div>
      `;
    }
    
    return this.galleryImages.map(image => `
      <div class="gallery-image-card ${this.selectedImage === image.id ? 'selected' : ''}">
        <img src="${image.thumbnailUrl}" alt="${image.title}" />
        <div class="image-info">
          <h4>${image.title}</h4>
          <p class="image-size">${this.formatFileSize(image.size)}</p>
          <div class="image-actions">
            <button class="gallery-image-select" data-image-id="${image.id}">
              ${this.selectedImage === image.id ? 'Selected' : 'Select'}
            </button>
            <button class="btn-preview-enhancement" data-image-id="${image.id}">
              🔍 View Printable Image
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderProductTypes() {
    if (!this.productTypes || Object.keys(this.productTypes).length === 0) {
      return `
        <div class="loading-state">
          <p>Loading product options...</p>
        </div>
      `;
    }
    
    return Object.entries(this.productTypes).map(([categoryKey, category]) => `
      <div class="product-category">
        <h3 class="category-title">
          <span class="category-icon">${category.icon}</span>
          ${category.name}
        </h3>
        <p class="category-description">${category.description}</p>
        <div class="category-products">
          ${category.products.map(product => `
            <div class="product-type-card">
              <div class="product-type-icon">${product.icon}</div>
              <div class="product-type-info">
                <h4>${product.name}</h4>
                <p class="product-type-description">${product.description}</p>
                <div class="product-type-details">
                  <span class="price">Starting at $${(product.basePrice / 100).toFixed(2)}</span>
                  <span class="colors">${product.availableColors.length} colors</span>
                </div>
                <button class="select-product-type-btn btn-primary" 
                        data-product-type="${product.id}">
                  Create ${product.name}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
  
  renderProducts() {
    if (this.products.length === 0) {
      return `
        <div class="empty-state">
          <p>No custom products created yet.</p>
          <p>Select an image from your gallery to create your first product!</p>
          ${this.selectedImage ? `
            <button class="create-product-btn btn-primary">
              Create Product from Selected Image
            </button>
          ` : ''}
        </div>
      `;
    }
    
    return this.products.map(product => `
      <div class="product-card">
        <div class="product-image">
          <img src="${product.images[0]?.src || product.sourceImage.url}" alt="${product.title}" />
        </div>
        <div class="product-info">
          <h4>${product.title}</h4>
          <p class="product-description">${product.description}</p>
          <div class="product-variants">
            ${product.variants.map(variant => `
              <div class="variant-option">
                <span class="variant-details">${variant.title}</span>
                <span class="variant-price">$${(variant.price / 100).toFixed(2)}</span>
                <button class="add-to-cart-btn" 
                        data-product-id="${product.id}" 
                        data-variant-id="${variant.id}">
                  Add to Cart
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderCart() {
    if (this.cart.length === 0) {
      return `
        <div class="empty-cart">
          <p>Your cart is empty</p>
        </div>
      `;
    }
    
    const total = this.getCartTotal();
    
    return `
      <div class="cart-items">
        ${this.cart.map(item => `
          <div class="cart-item">
            <img src="${item.product.images[0]?.src || item.product.sourceImage.url}" alt="${item.product.title}" />
            <div class="item-details">
              <h4>${item.product.title}</h4>
              <p>${item.variant.title}</p>
              <div class="quantity-controls">
                <button onclick="merchandiseStore.updateCartQuantity('${item.productId}', '${item.variantId}', ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="merchandiseStore.updateCartQuantity('${item.productId}', '${item.variantId}', ${item.quantity + 1})">+</button>
              </div>
            </div>
            <div class="item-price">
              <span>$${((item.price * item.quantity) / 100).toFixed(2)}</span>
              <button class="remove-from-cart" 
                      data-product-id="${item.productId}" 
                      data-variant-id="${item.variantId}">
                Remove
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-total">
        <div class="total-line">
          <strong>Total: $${(total / 100).toFixed(2)}</strong>
        </div>
        <button class="checkout-btn btn-primary">Proceed to Checkout</button>
      </div>
    `;
  }
  
  renderModals() {
    return `
      <!-- Product Creation Modal -->
      <div id="product-creation-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Create Custom Product</h2>
          <form id="product-creation-form">
            <div class="form-group">
              <label for="product-title">Product Title</label>
              <input type="text" id="product-title" required />
            </div>
            <div class="form-group">
              <label for="product-description">Description</label>
              <textarea id="product-description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label for="product-tags">Tags (comma-separated)</label>
              <input type="text" id="product-tags" placeholder="custom, art, wavelength" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Create Product</button>
              <button type="button" class="btn-secondary cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Checkout Modal -->
      <div id="checkout-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Checkout</h2>
          <div id="checkout-content">
            <!-- Checkout form will be populated here -->
          </div>
        </div>
      </div>
      
      <!-- Loading Modal -->
      <div id="loading-modal" class="modal" style="display: none;">
        <div class="modal-content loading-modal-content">
          <div class="loading-header">
            <div class="loading-spinner"></div>
            <h3 id="loading-title">Creating Your Product</h3>
          </div>
          <div class="loading-progress">
            <div class="progress-steps">
              <div class="progress-step active" id="step-1">
                <div class="step-icon">🎨</div>
                <span class="step-label">Preparing Image</span>
              </div>
              <div class="progress-step" id="step-2">
                <div class="step-icon">🔍</div>
                <span class="step-label">Analyzing Quality</span>
              </div>
              <div class="progress-step" id="step-3">
                <div class="step-icon">✨</div>
                <span class="step-label">Enhancing</span>
              </div>
              <div class="progress-step" id="step-4">
                <div class="step-icon">🎽</div>
                <span class="step-label">Creating Product</span>
              </div>
            </div>
          </div>
          <p id="loading-message">Processing...</p>
          <div class="loading-note">
            <small>This may take a moment while we optimize your image for the best print quality.</small>
          </div>
        </div>
      </div>
    `;
  }
  
  selectImage(imageId) {
    this.selectedImage = imageId;
    this.render();
  }
  
  async selectProductType(productType) {
    if (!this.selectedImage) {
      this.showError('Please select an image first');
      return;
    }
    
    // Auto-generate context from the selected image
    const selectedImageData = this.galleryImages.find(img => img.id === this.selectedImage);
    const imageContext = this.extractImageContext(selectedImageData);
    
    // Create the product directly (no modal needed)
    const product = await this.createGuidedProduct(this.selectedImage, productType, imageContext);
    
    if (product) {
      // Clear selection to allow creating another product
      this.selectedImage = null;
      this.render();
    }
  }
  
  extractImageContext(imageData) {
    if (!imageData || !imageData.title) {
      return {};
    }
    
    const title = imageData.title.toLowerCase();
    const context = {};
    
    // Try to extract character names
    const characters = ['daphne', 'lucky', 'felix', 'goblin-king'];
    for (const character of characters) {
      if (title.includes(character.replace('-', ' ')) || title.includes(character)) {
        context.characterName = character.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        break;
      }
    }
    
    // Try to extract episode numbers
    const episodeMatch = title.match(/episode[\s\-]?(\d+)/i);
    if (episodeMatch) {
      context.episodeNumber = episodeMatch[1];
    }
    
    // Try to extract seasonal context
    const seasons = ['spring', 'summer', 'autumn', 'fall', 'winter'];
    for (const season of seasons) {
      if (title.includes(season)) {
        context.seasonName = season.charAt(0).toUpperCase() + season.slice(1);
        break;
      }
    }
    
    // Try to extract location
    const locations = ['forest', 'castle', 'garden', 'mountain', 'cave', 'town', 'village'];
    for (const location of locations) {
      if (title.includes(location)) {
        context.locationName = location.charAt(0).toUpperCase() + location.slice(1);
        break;
      }
    }
    
    return context;
  }
  
  showProductCreationModal() {
    if (!this.selectedImage) {
      this.showError('Please select an image first');
      return;
    }
    
    const modal = document.getElementById('product-creation-modal');
    modal.style.display = 'block';
    
    // Setup form submission
    const form = document.getElementById('product-creation-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const productOptions = {
        title: formData.get('product-title'),
        description: formData.get('product-description'),
        tags: formData.get('product-tags').split(',').map(tag => tag.trim())
      };
      
      const product = await this.createProduct(this.selectedImage, productOptions);
      if (product) {
        modal.style.display = 'none';
        form.reset();
      }
    };
    
    // Setup close handlers
    modal.querySelector('.close').onclick = () => modal.style.display = 'none';
    modal.querySelector('.cancel-btn').onclick = () => modal.style.display = 'none';
  }
  
  showCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const content = document.getElementById('checkout-content');
    
    content.innerHTML = `
      <div class="checkout-form">
        <h3>Shipping Information</h3>
        <form id="checkout-form">
          <div class="form-row">
            <div class="form-group">
              <label for="first-name">First Name</label>
              <input type="text" id="first-name" required />
            </div>
            <div class="form-group">
              <label for="last-name">Last Name</label>
              <input type="text" id="last-name" required />
            </div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required />
          </div>
          <div class="form-group">
            <label for="address1">Address Line 1</label>
            <input type="text" id="address1" required />
          </div>
          <div class="form-group">
            <label for="address2">Address Line 2 (Optional)</label>
            <input type="text" id="address2" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" required />
            </div>
            <div class="form-group">
              <label for="state">State</label>
              <input type="text" id="state" required />
            </div>
            <div class="form-group">
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" required />
            </div>
          </div>
          <div class="form-group">
            <label for="country">Country</label>
            <select id="country" required>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <!-- Add more countries as needed -->
            </select>
          </div>
          
          <h3>Payment Information</h3>
          <div id="payment-element">
            <!-- Stripe payment element will be mounted here -->
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">Place Order</button>
            <button type="button" class="btn-secondary cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;
    
    modal.style.display = 'block';
    
    // Setup close handlers
    modal.querySelector('.close').onclick = () => modal.style.display = 'none';
    modal.querySelector('.cancel-btn').onclick = () => modal.style.display = 'none';
  }
  
  setLoading(isLoading, message = 'Loading...') {
    this.isLoading = isLoading;
    const modal = document.getElementById('loading-modal');
    const messageEl = document.getElementById('loading-message');
    
    // If loading modal doesn't exist, use the basic loading container
    if (!modal) {
      const loadingContainer = document.querySelector('.loading-container');
      if (loadingContainer) {
        loadingContainer.style.display = isLoading ? 'block' : 'none';
        const loadingText = loadingContainer.querySelector('p');
        if (loadingText) {
          loadingText.textContent = message;
        }
      }
      return;
    }
    
    if (isLoading) {
      if (messageEl) messageEl.textContent = message;
      
      // Update progress steps based on message
      this.updateProgressSteps(message);
      
      modal.style.display = 'block';
    } else {
      modal.style.display = 'none';
      
      // Reset progress steps
      this.resetProgressSteps();
    }
  }
  
  updateProgressSteps(message) {
    // Reset all steps
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach(step => step.classList.remove('active', 'completed'));
    
    // Activate appropriate step based on message
    if (message.includes('Preparing image') || message.includes('🎨')) {
      document.getElementById('step-1')?.classList.add('active');
    } else if (message.includes('Analyzing') || message.includes('🔍')) {
      document.getElementById('step-1')?.classList.add('completed');
      document.getElementById('step-2')?.classList.add('active');
    } else if (message.includes('Enhancing') || message.includes('✨')) {
      document.getElementById('step-1')?.classList.add('completed');
      document.getElementById('step-2')?.classList.add('completed');
      document.getElementById('step-3')?.classList.add('active');
    } else if (message.includes('Creating') || message.includes('🎽')) {
      document.getElementById('step-1')?.classList.add('completed');
      document.getElementById('step-2')?.classList.add('completed');
      document.getElementById('step-3')?.classList.add('completed');
      document.getElementById('step-4')?.classList.add('active');
    } else {
      // Default to first step
      document.getElementById('step-1')?.classList.add('active');
    }
  }
  
  resetProgressSteps() {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach(step => step.classList.remove('active', 'completed'));
    document.getElementById('step-1')?.classList.add('active');
  }
  
  showSuccess(message) {
    // Implement success notification
    console.log('✅', message);
    this.showToast(message, 'success');
  }
  
  showError(message) {
    // Implement error notification
    console.error('❌', message);
    this.showToast(message, 'error');
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  getAuthToken() {
    // Get authentication token from your auth system
    return localStorage.getItem('authToken') || '';
  }
  
  saveCartToStorage() {
    localStorage.setItem('merchandise-cart', JSON.stringify(this.cart));
  }
  
  loadCartFromStorage() {
    const saved = localStorage.getItem('merchandise-cart');
    if (saved) {
      this.cart = JSON.parse(saved);
    }
  }
}

// Initialize when DOM is ready
// Auto-initialization is now controlled by the template
// The component will be instantiated when user authentication is confirmed

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseStore;
}