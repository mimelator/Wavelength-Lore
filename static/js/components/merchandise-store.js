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
    
    // Check for pre-selected image from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const preselectImageId = urlParams.get('preselect');
    
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
    
    // Pre-select image AFTER rendering if specified in URL
    if (preselectImageId) {
      console.log('🎯 Pre-selecting image after render:', preselectImageId);
      this.preSelectImage(preselectImageId);
      // Re-render to show the selection
      this.render();
    }
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
      // Start with progress feedback for product creation
      this.setLoading(true, 'Preparing your image for product creation...');
      
      // Show progressive updates during the product creation process with technical details
      const productProgressMessages = [
        '🔍 Analyzing your image: Checking resolution and print compatibility...',
        '📏 Quality Check: Ensuring optimal dimensions for professional printing',
        '🎨 AI Enhancement: Upscaling to 300 DPI print resolution for crisp details',
        '🎽 Creating premium product variants: T-shirts, hoodies, mugs & more!',
        '✅ Finalizing your AMAZING custom merchandise - Ready for purchase!'
      ];
      
      let currentStep = 0;
      const productProgressInterval = setInterval(() => {
        if (currentStep < productProgressMessages.length - 1) {
          currentStep++;
          this.setLoading(true, productProgressMessages[currentStep]);
        }
      }, 5000); // Update every 5 seconds for longer process
      
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
      
      clearInterval(productProgressInterval);
      
      const data = await response.json();
      
      if (data.success) {
        this.setLoading(true, 'Product created! Preparing final details...');
        
        setTimeout(() => {
          this.products.push(data.product);
          
          // Show enhancement feedback
          let message = data.message || 'Custom product created successfully!';
          if (data.enhancement?.autoEnhanced) {
            message += ' ✨ Your image was automatically enhanced for better print quality!';
          }
          
          this.showSuccess(message);
          this.render();
          this.setLoading(false);
        }, 800);
        
        return data.product;
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
      
    } catch (error) {
      clearInterval(productProgressInterval);
      console.error('Error creating product:', error);
      this.showError('Failed to create product: ' + error.message);
      this.setLoading(false);
      return null;
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
        loadingMessage = `🎨 Preparing your image for premium print quality...`;
        this.setLoading(true, loadingMessage);
        
        // Show progressive loading messages with more detail and encouragement
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🔍 Analyzing image resolution and quality...`);
          }
        }, 1000);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🚀 AI enhancement in progress - making your image print-perfect...`);
          }
        }, 2500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `✨ Enhancing details and sharpening for crystal-clear printing...`);
          }
        }, 4500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🎯 Optimizing colors and contrast for vibrant merchandise...`);
          }
        }, 6500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🎽 Almost ready! Creating your beautiful ${productType}...`);
          }
        }, 8500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🏁 Final touches - your ${productType} will be amazing!`);
          }
        }, 10500);
      } else {
        this.setLoading(true, `🎽 Creating your ${productType} with your high-quality image...`);
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
        
        // Show detailed enhancement feedback with celebration
        let message = data.message || `🎉 Your ${productType} has been created successfully!`;
        if (data.enhancement?.autoEnhanced) {
          if (data.enhancement.enhancementSource === 'generated') {
            message += '\n\n🌟 Amazing! Your image was automatically enhanced using AI to ensure stunning print quality! The colors are more vibrant, details are sharper, and it\'s perfectly optimized for professional printing.';
          } else if (data.enhancement.enhancementSource === 'cached') {
            message += '\n\n⚡ Fantastic! We used your previously optimized image that was enhanced for premium print quality. Your ${productType} will look absolutely incredible!';
          }
          
          if (data.enhancement.qualityImproved) {
            message += '\n\n🎨 Your original image has been transformed into a high-resolution masterpiece that will make your merchandise stand out!';
          }
        } else {
          message += '\n\n✨ Your image was already perfect for printing - no enhancement needed! Your ${productType} will look amazing.';
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
      // Handle select button click
      if (e.target.classList.contains('gallery-image-select')) {
        const imageId = e.target.dataset.imageId;
        this.selectImage(imageId);
        return;
      }
      
      // Handle click on image itself or gallery card
      const galleryCard = e.target.closest('.gallery-image-card');
      if (galleryCard) {
        // Don't select if clicking on action buttons
        if (e.target.closest('.image-actions')) {
          // Let button handlers deal with it
          return;
        }
        
        // Find the select button to get the image ID
        const selectBtn = galleryCard.querySelector('.gallery-image-select');
        if (selectBtn) {
          const imageId = selectBtn.dataset.imageId;
          this.selectImage(imageId);
          return;
        }
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
    let progressInterval;
    try {
      console.log('🎨 Starting preview enhancement for imageId:', imageId);
      
      if (!imageId) {
        throw new Error('Image ID is required');
      }
      
      // Start with progress feedback
      this.setLoading(true, 'Analyzing image for print quality...');
      
      // Show progressive updates during the enhancement process with technical details
      const progressMessages = [
        'Analyzing image for print quality and optimal dimensions...',
        '🎨 AI Enhancement: Targeting 2048×2048px at 300 DPI for premium print quality',
        '✨ Optimizing colors, contrast, and fine details for merchandise printing',
        '🖼️ Generating high-resolution artwork - Perfect for t-shirts, mugs & more!',
        '🎯 Finalizing your professional-grade custom artwork preview...'
      ];
      
      let currentStep = 0;
      progressInterval = setInterval(() => {
        if (currentStep < progressMessages.length - 1) {
          currentStep++;
          this.setLoading(true, progressMessages[currentStep]);
        }
      }, 4000); // Update every 4 seconds for ~20 second process
      
      console.log('🌐 Making API request to /api/merchandise/preview-enhancement');
      
      const response = await fetch('/api/merchandise/preview-enhancement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ imageId })
      });
      
      clearInterval(progressInterval);
      progressInterval = null;
      
      console.log('📡 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ API error response:', errorData);
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('📦 API response data:', data);
      
      if (data.success) {
        console.log('✅ Enhancement preview successful');
        this.setLoading(true, 'Enhancement complete! Loading preview...');
        setTimeout(() => {
          // Transform the backend response to match the expected frontend structure
          const transformedData = {
            original: data.original || {
              url: data.originalImageUrl || '',
              width: data.originalDimensions?.width || 1024,
              height: data.originalDimensions?.height || 1024,
              suitableForPrint: data.originalImageSuitable || false
            },
            enhanced: data.enhanced || {
              url: data.enhancedImageUrl || '',
              width: data.enhancedDimensions?.width || 2048,
              height: data.enhancedDimensions?.height || 2048
            },
            analysis: data.analysis || {
              method: data.enhancementMethod || 'AI Enhancement',
              scaleFactor: data.scaleFactor || 2.0,
              improvementDescription: data.improvementDescription || 'Image enhanced for printing',
              processingTime: data.processingTime || 0,
              cached: data.cached || false
            }
          };
          
          this.showEnhancementPreview(transformedData.original, transformedData.enhanced, transformedData.analysis);
          this.setLoading(false);
        }, 500);
      } else {
        console.error('❌ API returned success: false', data);
        throw new Error(data.error || 'Failed to generate preview');
      }
      
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('❌ Error previewing enhancement:', error);
      console.error('Error stack:', error.stack);
      this.showError('Failed to preview enhancement: ' + error.message);
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
              <li><strong>Improvement:</strong> ${analysis.improvementDescription || 'Enhanced for printing'}</li>
              <li><strong>Scale Factor:</strong> ${analysis.scaleFactor || 'Auto'}x</li>
              ${analysis.processingTime ? `<li><strong>Processing Time:</strong> ${analysis.processingTime}ms</li>` : ''}
              ${analysis.cached ? '<li><strong>Source:</strong> Cached (Previously Enhanced)</li>' : ''}
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
          <div class="store-section" id="choose-product-section">
            <h2>🎽 Choose Your Product</h2>
            <div class="selected-image-preview">
              ${this.renderSelectedImagePreview()}
            </div>
            <p class="section-description">Choose Your Merch!</p>
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
        <img src="${image.thumbnailUrl}" alt="${this.cleanImageTitle(image.title)}" />
        <div class="image-info">
          <h4>${this.cleanImageTitle(image.title)}</h4>
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
            <h3 id="loading-title">Processing Your Request</h3>
          </div>
          <p id="loading-message">Loading...</p>
          <div class="loading-note">
            <small>This may take a moment while we process your request.</small>
          </div>
        </div>
      </div>
    `;
  }
  
  selectImage(imageId) {
    this.selectedImage = imageId;
    this.render();
    
    // Auto-scroll to the Choose Product section for better UX (same as preselection)
    setTimeout(() => {
      const chooseProductSection = document.getElementById('choose-product-section');
      if (chooseProductSection) {
        chooseProductSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        console.log('📍 Auto-scrolled to Choose Product section after image selection');
      }
    }, 300); // Shorter delay since DOM is already rendered
  }
  
  async selectProductType(productType) {
    if (!this.selectedImage) {
      this.showError('Please select an image first');
      return;
    }
    
    // Find product configuration
    const productConfig = this.findProductConfig(productType);
    if (!productConfig) {
      this.showError('Product configuration not found');
      return;
    }
    
    // Get selected image data
    const selectedImageData = this.galleryImages.find(img => img.id === this.selectedImage);
    const imageContext = this.extractImageContext(selectedImageData);
    
    // Show customization modal
    this.showProductCustomizationModal(productType, productConfig, selectedImageData, imageContext);
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
  
  findProductConfig(productTypeId) {
    // Search through all product type categories
    for (const category of Object.values(this.productTypes)) {
      const product = category.products.find(p => p.id === productTypeId);
      if (product) {
        return product;
      }
    }
    return null;
  }
  
  showProductCustomizationModal(productType, productConfig, imageData, imageContext) {
    // Generate default product name
    const defaultName = this.generateProductName(productType, imageContext, imageData);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal product-customization-modal';
    modal.id = 'productCustomizationModal';
    modal.innerHTML = `
      <div class="modal-content customization-content">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        
        <h2>✨ Customize Your ${productConfig.name}</h2>
        
        <div class="customization-layout">
          <!-- Left side: Live Preview -->
          <div class="preview-section">
            <h3>Live Preview</h3>
            <div class="preview-container">
              <div class="product-mockup">
                <img id="mockupPreview" src="${imageData.thumbnailUrl}" alt="Product Preview" />
                <div class="mockup-overlay">
                  <span class="preview-label">${productConfig.name}</span>
                </div>
              </div>
              
              <div class="image-preview-with-border">
                <h4>Your Image with Border</h4>
                <img id="borderedImagePreview" src="${imageData.thumbnailUrl}" alt="Bordered Image" />
                <div id="borderLoadingSpinner" class="loading-spinner" style="display: none;"></div>
              </div>
            </div>
          </div>
          
          <!-- Right side: Customization Options -->
          <div class="options-section">
            <div class="option-group">
              <h3>🎨 Border Style</h3>
              <select id="borderStyleSelect" class="border-style-select">
                <option value="none">No Border</option>
                <option value="solid-thin">Thin Black Border</option>
                <option value="solid-medium" selected>Medium Black Border</option>
                <option value="solid-thick">Thick Black Border</option>
                <option value="solid-white">White Border</option>
                <option value="gradient-fade">Gradient Fade</option>
                <option value="wavelength-theme">Wavelength Theme</option>
              </select>
              <p class="option-description">Choose a border style to enhance your image</p>
            </div>
            
            <div class="option-group">
              <h3>📝 Product Details</h3>
              <label for="productName">Product Name</label>
              <input type="text" id="productName" class="product-name-input" value="${defaultName}" />
              
              <label for="productDescription">Description (Optional)</label>
              <textarea id="productDescription" class="product-description-input" rows="3" placeholder="Add a personal description..."></textarea>
            </div>
            
            <div class="option-group">
              <h3>👕 Default Options</h3>
              <div class="size-color-grid">
                <div class="option-item">
                  <label for="defaultSize">Size</label>
                  <select id="defaultSize" class="option-select">
                    ${productConfig.popularSizes.map(size => `
                      <option value="${size}" ${size === 'M' ? 'selected' : ''}>${size}</option>
                    `).join('')}
                  </select>
                </div>
                
                <div class="option-item">
                  <label for="defaultColor">Color</label>
                  <select id="defaultColor" class="option-select">
                    ${productConfig.availableColors.map(color => `
                      <option value="${color}" ${color === 'Black' ? 'selected' : ''}>${color}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <p class="option-note">All sizes and colors will be available after creation</p>
            </div>
            
            <div class="pricing-section">
              <div class="price-display">
                <span class="price-label">Starting Price:</span>
                <span class="price-value">$${(productConfig.basePrice / 100).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
              <button class="btn-primary" id="createProductBtn">
                Create Product
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Setup event listeners
    this.setupCustomizationModalListeners(modal, productType, productConfig, imageData, imageContext);
  }
  
  generateProductName(productType, imageContext, imageData) {
    const productConfig = this.findProductConfig(productType);
    if (!productConfig || !productConfig.nameTemplates) {
      return 'Custom Wavelength Product';
    }
    
    // Pick a template based on available context
    let template = productConfig.nameTemplates[0]; // Default to first template
    
    if (imageContext.characterName && productConfig.nameTemplates.some(t => t.includes('{characterName}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{characterName}'));
    } else if (imageContext.episodeNumber && productConfig.nameTemplates.some(t => t.includes('{episodeNumber}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{episodeNumber}'));
    } else if (imageContext.seasonName && productConfig.nameTemplates.some(t => t.includes('{seasonName}'))) {
      template = productConfig.nameTemplates.find(t => t.includes('{seasonName}'));
    }
    
    // Replace placeholders
    let name = template
      .replace('{characterName}', imageContext.characterName || 'Character')
      .replace('{episodeNumber}', imageContext.episodeNumber || 'X')
      .replace('{seasonName}', imageContext.seasonName || 'Season')
      .replace('{locationName}', imageContext.locationName || 'Adventure');
    
    return name;
  }
  
  setupCustomizationModalListeners(modal, productType, productConfig, imageData, imageContext) {
    const borderSelect = modal.querySelector('#borderStyleSelect');
    const createBtn = modal.querySelector('#createProductBtn');
    
    // Border style change listener
    let borderUpdateTimeout = null;
    borderSelect.addEventListener('change', async () => {
      // Clear existing timeout
      if (borderUpdateTimeout) {
        clearTimeout(borderUpdateTimeout);
      }
      
      // Debounce border preview updates
      borderUpdateTimeout = setTimeout(async () => {
        await this.updateBorderPreview(modal, imageData, borderSelect.value);
      }, 300);
    });
    
    // Initial border preview
    this.updateBorderPreview(modal, imageData, borderSelect.value);
    
    // Create product button
    createBtn.addEventListener('click', async () => {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      
      const customization = {
        productName: modal.querySelector('#productName').value,
        productDescription: modal.querySelector('#productDescription').value,
        borderStyle: borderSelect.value,
        defaultSize: modal.querySelector('#defaultSize').value,
        defaultColor: modal.querySelector('#defaultColor').value
      };
      
      await this.createCustomizedProduct(productType, imageData, imageContext, customization);
      
      modal.remove();
    });
  }
  
  async updateBorderPreview(modal, imageData, borderStyle) {
    const previewImg = modal.querySelector('#borderedImagePreview');
    const spinner = modal.querySelector('#borderLoadingSpinner');
    
    if (borderStyle === 'none') {
      previewImg.src = imageData.thumbnailUrl;
      return;
    }
    
    // Show loading spinner
    spinner.style.display = 'block';
    
    try {
      // Map border style to configuration
      const borderConfig = this.getBorderConfig(borderStyle);
      
      // Call border preview API
      const response = await fetch('/api/merchandise/border-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          sourceImageUrl: imageData.url,
          borderConfig: borderConfig,
          options: {
            format: 'webp',
            quality: 85
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.borderedImageUrl) {
          previewImg.src = data.borderedImageUrl;
        } else {
          console.error('Failed to generate border preview:', data.error);
          previewImg.src = imageData.thumbnailUrl;
        }
      } else {
        console.error('Failed to generate border preview');
        previewImg.src = imageData.thumbnailUrl;
      }
    } catch (error) {
      console.error('Error generating border preview:', error);
      previewImg.src = imageData.thumbnailUrl;
    } finally {
      spinner.style.display = 'none';
    }
  }
  
  getBorderConfig(borderStyle) {
    const configs = {
      'solid-thin': {
        type: 'solid',
        color: '#000000',
        width: 5,
        opacity: 1
      },
      'solid-medium': {
        type: 'solid',
        color: '#000000',
        width: 15,
        opacity: 1
      },
      'solid-thick': {
        type: 'solid',
        color: '#000000',
        width: 30,
        opacity: 1
      },
      'solid-white': {
        type: 'solid',
        color: '#FFFFFF',
        width: 15,
        opacity: 1
      },
      'gradient-fade': {
        type: 'gradient',
        gradientType: 'linear',
        colors: ['#000000', '#ffffff'],
        width: 20,
        direction: '45deg'
      },
      'wavelength-theme': {
        type: 'wavelength-theme',
        theme: 'goblin-king',
        elements: ['crowns', 'gems'],
        density: 'medium',
        colorScheme: 'dark',
        width: 20
      }
    };
    
    return configs[borderStyle] || configs['solid-medium'];
  }
  
  async createCustomizedProduct(productType, imageData, imageContext, customization) {
    try {
      this.setLoading(true, 'Creating your custom product...');
      
      // Prepare product options
      const productOptions = {
        ...imageContext,
        title: customization.productName,
        description: customization.productDescription,
        borderConfig: customization.borderStyle !== 'none' ? this.getBorderConfig(customization.borderStyle) : null,
        defaultVariant: {
          size: customization.defaultSize,
          color: customization.defaultColor
        }
      };
      
      // Call the existing createGuidedProduct but with border config
      const product = await this.createGuidedProduct(
        this.selectedImage,
        productType,
        productOptions
      );
      
      if (product) {
        this.showSuccess('Product created successfully!');
        this.selectedImage = null;
        this.render();
      }
      
    } catch (error) {
      console.error('Error creating customized product:', error);
      this.showError('Failed to create product: ' + error.message);
    } finally {
      this.setLoading(false);
    }
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
      
      modal.style.display = 'block';
    } else {
      modal.style.display = 'none';
    }
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

  /**
   * Pre-select an image based on ID from URL parameter
   * @param {string} imageId - The image ID to pre-select
   */
  preSelectImage(imageId) {
    if (!this.galleryImages || this.galleryImages.length === 0) {
      console.warn('Cannot pre-select image: Gallery not loaded yet');
      return;
    }

    // Debug: Log all gallery images to see their structure
    console.log('🔍 Debug: Available gallery images:');
    this.galleryImages.forEach((img, index) => {
      console.log(`  ${index + 1}:`, {
        id: img.id,
        relativePath: img.relativePath,
        fileName: img.fileName,
        title: img.title,
        url: img.url
      });
    });
    
    console.log('🔍 Debug: Looking for imageId:', imageId);

    // Find the image by relativePath, id, or fileName
    const image = this.galleryImages.find(img => {
      // Extract filename from the full S3 path for comparison
      const imgFilename = img.id ? img.id.split('/').pop() : null;
      
      console.log(`🔍 Checking image: ${img.title} (filename: ${imgFilename}) against ${imageId}`);
      
      return (
        img.relativePath === imageId || 
        img.id === imageId || 
        img.fileName === imageId ||
        img.relativePath?.includes(imageId) ||
        img.title === imageId ||
        imgFilename === imageId ||
        (img.relativePath && img.relativePath.endsWith(imageId)) ||
        (img.id && img.id.endsWith(imageId))
      );
    });

    if (image) {
      this.selectedImage = image.id;
      console.log('🎯 Pre-selected image for merchandise:', image.title, 'ID:', image.id);
      
      // Update the UI to show the selection - with longer delay for rendering
      setTimeout(() => {
        // Try multiple selectors to find the image element
        let imageElement = document.querySelector(`.gallery-image[data-image-id="${image.id}"]`);
        
        if (!imageElement) {
          // Try with the filename instead
          const filename = image.id.split('/').pop();
          imageElement = document.querySelector(`.gallery-image[data-image-id*="${filename}"]`);
        }
        
        if (!imageElement) {
          // Try finding by image URL or any data attribute containing the filename
          const filename = image.id.split('/').pop();
          imageElement = document.querySelector(`[data-image-id="${filename}"], [data-id="${filename}"], img[src*="${filename}"]`);
        }
        
        if (imageElement) {
          // Remove previous selections
          document.querySelectorAll('.gallery-image.selected').forEach(el => {
            el.classList.remove('selected');
          });
          
          // Add selection to the preselected image
          imageElement.classList.add('selected');
          
          // Scroll to the selected image
          imageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          console.log('✅ Pre-selected image UI updated successfully');
        } else {
          console.warn('Pre-selected image element not found in DOM. Available elements:', 
            document.querySelectorAll('.gallery-image, [data-image-id], [data-id]').length);
          
          // Try to find and log what elements are actually available
          const allImages = document.querySelectorAll('img, [data-image-id], [data-id]');
          console.log('Available image elements:', Array.from(allImages).map(el => ({
            tagName: el.tagName,
            dataImageId: el.getAttribute('data-image-id'),
            dataId: el.getAttribute('data-id'),
            src: el.src
          })));
        }
      }, 500); // Increased delay to ensure DOM is fully rendered
      
      // Clear the URL parameter to clean up the URL
      const url = new URL(window.location);
      url.searchParams.delete('preselect');
      window.history.replaceState({}, '', url);
      
      // Auto-scroll to the Choose Product section for better UX
      setTimeout(() => {
        const chooseProductSection = document.getElementById('choose-product-section');
        if (chooseProductSection) {
          chooseProductSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          console.log('📍 Auto-scrolled to Choose Product section');
        }
      }, 800); // Delay to ensure DOM updates and previous scrolling completes
    } else {
      console.warn('Pre-select image not found:', imageId);
    }
  }
  
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Content Image';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Render a preview of the selected image in the Choose Product section
   * @returns {string} HTML for the selected image preview
   */
  renderSelectedImagePreview() {
    if (!this.selectedImage) return '';
    
    const selectedImg = this.galleryImages.find(img => img.id === this.selectedImage);
    if (!selectedImg) return '';
    
    return `
      <div class="selected-image-preview-container">
        <div class="preview-image">
          <img src="${selectedImg.thumbnailUrl || selectedImg.url}" 
               alt="${this.cleanImageTitle(selectedImg.title)}"
               class="preview-thumbnail">
        </div>
        <div class="preview-info">
          <h3 class="preview-title">Selected Image: ${this.cleanImageTitle(selectedImg.title)}</h3>
          <p class="preview-details">
            <span class="preview-size">${this.formatFileSize(selectedImg.size || 0)}</span>
            ${selectedImg.suitableForPrint ? 
              '<span class="print-ready">✅ Print Ready</span>' : 
              '<span class="enhancement-needed">🎨 Will be enhanced for printing</span>'
            }
          </p>
          <button class="change-image-btn" onclick="document.querySelector('.gallery-section').scrollIntoView({behavior: 'smooth'})">
            Change Image
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Clean up image title by removing file extensions
   * @param {string} title - Original title/filename
   * @returns {string} Clean title without extension
   */
  cleanImageTitle(title) {
    if (!title) return 'Untitled';
    
    // Remove file extensions like .webp, .jpg, .png, etc.
    return title.replace(/\.(webp|jpg|jpeg|png|gif|svg)$/i, '')
                .replace(/^image-\d+-/, '') // Remove image-timestamp- prefix
                .replace(/-/g, ' ')        // Replace hyphens with spaces
                .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
                .trim();
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