/**
 * Merchandise Store Frontend Component
 * 
 * Interactive interface for creating custom merchandise from gallery images
 * REFACTORED: Now uses MerchandiseApiService for all API operations
 */

class MerchandiseStore {
  constructor() {
    // UI State
    this.selectedImage = null;
    this.products = [];
    this.productTypes = {};
    this.availableProducts = [];
    this.isLoading = false;
    this.galleryImages = [];
    this.enhancementStatus = { available: false };
    this.isInitializing = true;
    
    // REFACTOR: Initialize services for separated concerns
    this.apiService = new MerchandiseApiService();
    this.cartService = new MerchandiseCartService();
    this.validationService = new MerchandiseProductValidationService();
    this.eventBus = new WavelengthEventBus();
    
    // PHASE 2 REFACTOR: Initialize UI renderers for modular UI components
    this.productCardRenderer = new MerchandiseProductCardRenderer({
      validationService: this.validationService,
      eventBus: this.eventBus,
      merchandiseStore: this
    });
    
    this.cartRenderer = new MerchandiseCartRenderer({
      cartService: this.cartService,
      eventBus: this.eventBus,
      merchandiseStore: this
    });
    
    this.categoryGridRenderer = new MerchandiseCategoryGridRenderer({
      validationService: this.validationService,
      eventBus: this.eventBus,
      merchandiseStore: this
    });
    
    this.modalRenderer = new MerchandiseModalRenderer({
      validationService: this.validationService,
      eventBus: this.eventBus,
      merchandiseStore: this
    });
    
    // Configure services
    this.cartService.setEventBus(this.eventBus);
    this.eventBus.setDebugMode(false); // Enable for debugging
    
    // Set up event listeners for cross-component communication
    this.setupServiceEventListeners();
    
    console.log('🛍️ MerchandiseStore constructor called with refactored services');
    
    // Add a simple health check
    this.healthCheck();
    
    this.init();
  }
  
  /**
   * Set up event listeners for service communication
   */
  setupServiceEventListeners() {
    // Cart update events
    this.eventBus.on('cart.updated', (data) => {
      console.log('🛒 Cart updated:', data);
      this.updateCartUI();
    });
    
    // Product events
    this.eventBus.on('product.created', (data) => {
      console.log('📦 Product created:', data);
      this.refreshProducts();
    });
    
    this.eventBus.on('product.deleted', (data) => {
      console.log('🗑️ Product deleted:', data);
      this.refreshProducts();
    });
    
    // UI events
    this.eventBus.on('ui.loading', (isLoading) => {
      this.setLoading(isLoading);
    });
    
    this.eventBus.on('ui.error', (error) => {
      this.showError(error.message || error);
    });
    
    this.eventBus.on('ui.success', (message) => {
      this.showSuccess(message);
    });
    
    // PHASE 2: UI Renderer Events
    this.setupUIRendererEventListeners();
  }
  
  /**
   * Set up event listeners for UI renderer interactions
   */
  setupUIRendererEventListeners() {
    // Category Grid Renderer Events
    this.eventBus.on('category.selected', (data) => {
      this.handleCategorySelection(data.categoryId);
    });
    
    this.eventBus.on('grid.search', (data) => {
      this.handleProductSearch(data.searchTerm);
    });
    
    this.eventBus.on('grid.filterChanged', (data) => {
      this.handleFilterChange(data.filterType, data.filterValue);
    });
    
    this.eventBus.on('grid.sortChanged', (data) => {
      this.handleSortChange(data.sortBy);
    });
    
    this.eventBus.on('grid.viewChanged', (data) => {
      this.handleViewChange(data.viewType);
    });
    
    // Product Card Renderer Events
    this.eventBus.on('product.quickPreview', (data) => {
      this.showProductPreview(data.productId);
    });
    
    this.eventBus.on('product.customize', (data) => {
      // Handle both existing products (data.productId) and new blueprint selections (data.productConfig)
      if (data.productConfig) {
        this.showCustomizationModalForBlueprint(data.productConfig, data.blueprintId, data.providerId);
      } else if (data.productId) {
        this.showCustomizationModal(data.productId);
      }
    });
    
    this.eventBus.on('product.addToCart', (data) => {
      // Pass full data including customization
      this.handleAddToCart(data.productId, data.customization, data.quantity);
    });
    
    // Cart Renderer Events
    this.eventBus.on('cart.quantityChanged', (data) => {
      this.handleCartQuantityChange(data.productId, data.variantId, data.quantity);
    });
    
    this.eventBus.on('cart.itemRemoved', (data) => {
      this.handleCartItemRemoval(data.productId, data.variantId);  
    });
    
    this.eventBus.on('cart.cleared', () => {
      this.handleCartClear();
    });
    
    this.eventBus.on('cart.checkout', () => {
      this.handleCheckout();
    });
    
    // Modal Renderer Events
    this.eventBus.on('modal.customizationSaved', (data) => {
      this.handleCustomizationSave(data.productId, data.customization);
    });
    
    this.eventBus.on('modal.closed', (data) => {
      this.handleModalClosed(data.modalId);
    });
    
    this.eventBus.on('dialog.confirmed', (data) => {
      this.handleDialogConfirmed(data.modalId);
    });
    
    this.eventBus.on('dialog.cancelled', (data) => {
      this.handleDialogCancelled(data.modalId);
    });

    this.eventBus.on('product.goToProductOptions', async (data) => {
      // 🔥 CRITICAL: Pass blueprintId and printProviderId from event data
      await this.handleGoToProductOptions(data.productId, data.productType, data.customization, data.blueprintId, data.printProviderId);
    });
  }
  
  /**
   * Simple health check to verify basic functionality
   */
  healthCheck() {
    console.log('🌡️ Running merchandise store health check...');
    
    try {
      // Check if container exists
      const container = document.getElementById('merchandise-store');
      if (!container) {
        console.error('❌ Health check failed: Container not found');
        return false;
      }
      
      // Check if we can render basic content
      container.innerHTML = `
        <div class="merchandise-store">
          <div class="store-header">
            <h1>🛍️ Custom Merchandise Store</h1>
            <p>Initializing store...</p>
          </div>
        </div>
      `;
      
      console.log('✅ Health check passed: Basic rendering works');
      return true;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Get category icon synchronously for immediate UI rendering
   */
  getCategoryIcon(category) {
    console.log('🔍 getCategoryIcon called with category:', category);
    
    // Try to find matching product in catalog
    if (this.availableProducts && Array.isArray(this.availableProducts)) {
      const matchingProduct = this.availableProducts.find(product => {
        const productType = this.extractProductTypeFromProduct(product);
        return productType === category || 
               productType?.toLowerCase() === category?.toLowerCase() ||
               product.title?.toLowerCase().includes(category?.toLowerCase());
      });
      
      if (matchingProduct) {
        console.log('✅ Found matching product for icon:', matchingProduct.title);
        // Use cached blueprint data if available, otherwise default
        return this.getCachedIconForBlueprint(matchingProduct.blueprintId) || this.getBasicIconForCategory(category);
      }
    }
    
    // Basic fallback icon
    return this.getBasicIconForCategory(category);
  }
  
  /**
   * Get cached icon from blueprint if available
   */
  getCachedIconForBlueprint(blueprintId) {
    // This would check if we have cached blueprint data
    // For now, return null to use fallback
    return null;
  }
  
  /**
   * Get basic icon for category (minimal hardcoded fallbacks)
   */
  getBasicIconForCategory(category) {
    if (!category) return '📦';
    
    const type = category.toLowerCase();
    
    // Basic essential mappings only
    if (type.includes('mug')) return '☕';
    if (type.includes('travel') && type.includes('mug')) return '🥤';
    if (type.includes('shirt') || type.includes('tee')) return '👕';
    if (type.includes('hoodie')) return '🧥';
    if (type.includes('bag')) return '👜';
    if (type.includes('sticker')) return '🏷️';
    
    return '📦';
  }
  
  /**
   * Get icon from blueprint metadata API (eliminates all hardcoded patterns)
   */
  async getIconFromBlueprintId(blueprintId) {
    if (!blueprintId) return '📦';
    
    try {
      const response = await fetch(`/api/merchandise/blueprint-preview/${blueprintId}`);
      const data = await response.json();
      
      if (data.success && data.icon) {
        console.log(`✅ Got icon from blueprint API: ${blueprintId} → ${data.icon}`);
        return data.icon;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get icon from blueprint API:', error);
    }
    
    return '📦'; // Default fallback
  }
  
  /**
   * Infer appropriate icon using blueprint API first
   */
  async inferIconFromProductType(productType, blueprintId = null) {
    if (!productType) return '📦';
    
    const type = productType.toLowerCase();
    
    // Apparel patterns
    if (type.includes('shirt') || type.includes('tee')) return '�';
    if (type.includes('hoodie') || type.includes('sweatshirt')) return '🧥';
    if (type.includes('tank')) return '🎽';
    if (type.includes('women')) return '�';
    if (type.includes('premium')) return '�';
    
    // Accessories patterns
    if (type.includes('mug') || type.includes('cup')) return '☕';
    if (type.includes('travel') && type.includes('mug')) return '🥤';
    if (type.includes('bag') || type.includes('tote')) return '👜';
    if (type.includes('backpack')) return '🎒';
    if (type.includes('hat') || type.includes('cap')) return '🧢';
    if (type.includes('phone')) return '📱';
    if (type.includes('laptop')) return '💻';
    if (type.includes('fanny')) return '�';
    
    // Home decor patterns
    if (type.includes('pillow')) return '🛏️';
    if (type.includes('blanket')) return '�️';
    if (type.includes('canvas') || type.includes('art')) return '🖼️';
    
    // Other patterns
    if (type.includes('sticker')) return '🏷️';
    if (type.includes('notebook') || type.includes('journal')) return '�';
    if (type.includes('infant') || type.includes('baby')) return '👶';
    if (type.includes('special')) return '✨';
    
    return '📦'; // Default fallback
  }

  /**
   * Get estimated price using dynamic product catalog lookup
   */
  getEstimatedPrice(category) {
    console.log('🔍 getEstimatedPrice called with category:', category);
    
    // Try to find matching product in catalog for actual pricing
    if (this.availableProducts && Array.isArray(this.availableProducts)) {
      const matchingProduct = this.availableProducts.find(product => {
        const productType = this.extractProductTypeFromProduct(product);
        return productType === category || 
               productType?.toLowerCase() === category?.toLowerCase() ||
               product.title?.toLowerCase().includes(category?.toLowerCase());
      });
      
      if (matchingProduct && matchingProduct.variants && matchingProduct.variants.length > 0) {
        // Get the lowest price from actual variants
        const prices = matchingProduct.variants.map(variant => {
          const price = variant.price || 0;
          return typeof price === 'number' ? price / 100 : parseFloat(price) || 0;
        }).filter(price => price > 0);
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          console.log('✅ Found actual price from catalog:', `$${minPrice.toFixed(2)}`);
          return `$${minPrice.toFixed(2)}`;
        }
      }
    }
    
    // Fallback to basic default pricing
    return '$19.95';
  }
  
  /**
   * Estimate price using blueprint metadata API
   */
  async estimatePriceByBlueprint(blueprintId) {
    if (!blueprintId) return '$19.95';
    
    try {
      const response = await fetch(`/api/merchandise/blueprint-preview/${blueprintId}`);
      const data = await response.json();
      
      if (data.success && data.category) {
        // Basic price estimation based on category (can be enhanced with actual Printify pricing)
        const basePrices = {
          'sticker': '$4.95',
          'coffee-mug': '$14.95',
          'travel-mug': '$21.95',
          't-shirt': '$18.95',
          'heavy-cotton-tee': '$19.95',
          'premium-tshirt': '$22.95',
          'hoodie': '$34.95',
          'sweatshirt': '$28.95',
          'tote-bag': '$15.95',
          'backpack': '$34.95',
          'pillow': '$18.95',
          'blanket': '$49.95',
          'canvas': '$29.95',
          'phone-case': '$19.95',
          'laptop-sleeve': '$24.95',
          'notebook': '$16.95',
          'hat': '$19.95'
        };
        
        const price = basePrices[data.category] || '$19.95';
        console.log(`✅ Got price from blueprint API: ${blueprintId} → ${data.category} → ${price}`);
        return price;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get price from blueprint API:', error);
    }
    
    return '$19.95'; // Default fallback
  }
  
  /**
   * Convert technical provider names to user-friendly text
   */
  getUserFriendlyProvider(providerName) {
    if (!providerName) return '';
    
    // Convert technical provider names to user-friendly alternatives
    const providerMap = {
      'MWW On Demand': 'Print-on-Demand',
      'MWW': 'Print Service',
      'Printful': 'Printful',
      'Printify': 'Custom Print',
      'Gooten': 'Print Service',
      'SPOD': 'Print Service'
    };
    
    return providerMap[providerName] || 'Custom Print';
  }
  
  async init() {
    console.log('🛍️ Initializing Merchandise Store');
    
    try {
      // Check for pre-selected image from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const preselectImageId = urlParams.get('preselect') || urlParams.get('imageId');
      
      // Check enhancement capabilities
      console.log('🔍 Loading enhancement status...');
      await this.loadEnhancementStatus();
      console.log('✅ Enhancement status loaded:', this.enhancementStatus);
      
      // Load product types first
      console.log('🔍 Loading product types...');
      await this.loadProductTypes();
      console.log('✅ Product types loaded:', Object.keys(this.productTypes || {}).length, 'categories');
      console.log('🔍 Product types data:', this.productTypes);
      
      // Load user's gallery images
      console.log('🔍 Loading gallery images...');
      await this.loadGalleryImages();
      console.log('✅ Gallery images loaded:', this.galleryImages?.length || 0, 'images');
      
      // Pre-select image AFTER gallery images are loaded if specified in URL
      if (preselectImageId) {
        console.log('🎯 Pre-selecting image after gallery load:', preselectImageId);
        
        // For testing scenarios, create a mock image if gallery is empty
        if (this.galleryImages.length === 0) {
          console.log('🧪 Test mode: Creating mock gallery image for testing');
          this.galleryImages = [{
            id: preselectImageId,
            title: 'Test Image',
            url: 'http://localhost:3001/test-image.jpg',
            thumbnailUrl: 'http://localhost:3001/test-image.jpg',
            suitableForPrint: true
          }];
        }
        
        this.preSelectImage(preselectImageId);
      }
      
      // Load existing products
      console.log('🔍 Loading user products...');
      await this.loadUserProducts();
      console.log('✅ User products loaded:', this.products?.length || 0, 'products');
      
      // Setup event listeners
      console.log('🔧 Setting up event listeners...');
      this.setupEventListeners();
      console.log('✅ Event listeners setup complete');
      
      // Render initial state
      console.log('🎨 Rendering initial state...');
      this.render();
      console.log('✅ Initial render complete');
      
      // If image was pre-selected, re-render to show the selection and initialize navigator
      if (preselectImageId && this.selectedImage) {
        console.log('🔄 Re-rendering to show pre-selected image and initialize navigator');
        this.render();
        
        // Initialize product navigator for pre-selected image
        setTimeout(async () => {
          try {
            console.log('🚀 Initializing product navigator for pre-selected image...');
            
            // Category cards will be initialized when image is selected
            console.log('✅ Ready for image selection - category cards will appear after image selection');
          } catch (error) {
            console.error('❌ Error initializing product navigator for pre-selected image:', error);
          }
        }, 500);
      }
      
      console.log('🎉 Merchandise Store initialization complete!');
      this.isInitializing = false;
      
    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Error during merchandise store initialization:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Show error to user
      this.showError('Failed to initialize merchandise store: ' + error.message);
      
      // Try to render a basic error state
      const container = document.getElementById('merchandise-store');
      if (container) {
        container.innerHTML = `
          <div class="merchandise-store">
            <div class="store-header">
              <h1>🛍️ Merchandise Store</h1>
              <p style="color: #ff6b6b;">There was an error loading the store. Please refresh the page.</p>
              <p style="color: #ff6b6b; font-size: 0.9rem;">Error: ${error.message}</p>
            </div>
          </div>
        `;
      }
    }
  }
  
  async loadEnhancementStatus() {
    try {
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.loadEnhancementStatus();
      
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
      
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.loadGalleryImages();
      
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
      
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.loadProductTypes();
      console.log('📋 Product types API response:', data);
      
      if (data.success && data.allProducts) {
        // Use the same approach as admin catalog - simple allProducts array
        this.availableProducts = data.allProducts;
        
        // Group products by category for display (same as admin catalog approach)
        this.productCategories = {};
        data.allProducts.forEach(product => {
          const category = product.category || 'specialty';
          if (!this.productCategories[category]) {
            this.productCategories[category] = {
              name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
              products: []
            };
          }
          this.productCategories[category].products.push(product);
        });
        
        console.log(`📋 Loaded ${this.availableProducts.length} products`);
        console.log(`� Organized into ${Object.keys(this.productCategories).length} categories`);
      } else {
        throw new Error(data.error || 'Failed to load product types');
      }
      
    } catch (error) {
      console.error('Error loading product types:', error);
      this.showError('Failed to load product options: ' + error.message);
      
      // Fallback to prevent complete failure
      this.availableProducts = [];
      this.productCategories = {};
    } finally {
      this.setLoading(false);
    }
  }
  
  async loadUserProducts() {
    try {
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.loadUserProducts();
      
      if (data.success) {
        // Filter out any products that might be corrupted or invalid
        const validProducts = (data.products || []).filter(product => {
          const hasId = product.id || product.productId;
          const hasTitle = product.title;
          const hasSourceImage = product.sourceImage?.url;
          
          return hasId && (hasTitle || hasSourceImage);
        });
        
        this.products = validProducts;
        console.log(`📦 Loaded ${this.products.length} valid user products`);
        
        // Clean up broken products
        await this.cleanupBrokenProducts();
        
      } else {
        console.warn('No existing products found');
        this.products = [];
      }
      
    } catch (error) {
      console.error('Error loading user products:', error);
      this.products = [];
    }
  }
  
  /**
   * Detect and remove broken products (0 variants, 0 images)
   */
  async cleanupBrokenProducts() {
    const brokenProducts = this.products.filter(product => {
      const hasVariants = product.variants && product.variants.length > 0;
      const hasImages = product.images && product.images.length > 0;
      const hasSourceImage = product.sourceImage && product.sourceImage.url;
      
      // A product is broken if it has no variants, no images, AND no source image
      // OR if it's been more than 5 minutes since creation and still has no variants/images
      const isCompletelyEmpty = !hasVariants && !hasImages && !hasSourceImage;
      
      const createdAt = product.generatedAt || product.createdAt;
      const isOldAndIncomplete = createdAt && 
        (Date.now() - new Date(createdAt).getTime()) > 5 * 60 * 1000 && // 5 minutes
        !hasVariants && !hasImages;
      
      return isCompletelyEmpty || isOldAndIncomplete;
    });
    
    if (brokenProducts.length > 0) {
      console.log(`🧹 Found ${brokenProducts.length} broken products to clean up:`);
      brokenProducts.forEach(p => {
        console.log(`  - ${p.title} (${p.id || p.productId}): variants=${p.variants?.length || 0}, images=${p.images?.length || 0}`);
      });
      
      // Show immediate feedback to user
      this.showSuccess(`Cleaning up ${brokenProducts.length} corrupted products...`);
      
      let deletedCount = 0;
      for (const product of brokenProducts) {
        const productId = product.id || product.productId;
        console.log(`🗑️ Deleting broken product: ${product.title} (${productId})`);
        
        try {
          // Delete from database with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`/api/merchandise/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) {
            console.log(`✅ Successfully deleted product ${productId}`);
            deletedCount++;
          } else {
            console.warn(`⚠️ Failed to delete product ${productId}: ${response.status}`);
          }
          
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn(`⏰ Timeout deleting product ${productId}`);
          } else {
            console.warn(`⚠️ Error deleting product ${productId}:`, error.message);
          }
        }
        
        // Always remove from local array to prevent repeated cleanup attempts
        this.products = this.products.filter(p => (p.id || p.productId) !== productId);
      }
      
      console.log(`✅ Cleanup complete: ${deletedCount}/${brokenProducts.length} products deleted from database`);
      
      if (deletedCount > 0) {
        this.showSuccess(`Successfully removed ${deletedCount} corrupted products`);
      } else if (brokenProducts.length > 0) {
        this.showSuccess(`Removed ${brokenProducts.length} corrupted products from display`);
      }
    }
  }
  
  async createProduct(imageId, productOptions) {
    let productProgressInterval = null;
    
    try {
      // Get full image data from gallery
      const imageData = this.galleryImages.find(img => img.id === imageId);
      if (!imageData) {
        throw new Error('Image not found in gallery');
      }
      
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
      productProgressInterval = setInterval(() => {
        if (currentStep < productProgressMessages.length - 1) {
          currentStep++;
          this.setLoading(true, productProgressMessages[currentStep]);
        }
      }, 5000); // Update every 5 seconds for longer process
      
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.createProduct(imageId, {
        imageUrl: imageData.url,
        imageTitle: imageData.title || imageData.fileName,
        ...productOptions
      });
      
      clearInterval(productProgressInterval);
      
      if (data.success) {
        this.setLoading(true, 'Product created! Preparing final details...');
        
        setTimeout(() => {
          this.products.push(data.product);
          
          // Show simple success message
          this.showSuccess('Product created successfully!');
          this.render();
          this.setLoading(false);
        }, 800);
        
        return data.product;
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
      
    } catch (error) {
      if (productProgressInterval) {
        clearInterval(productProgressInterval);
      }
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
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.checkIfImageNeedsEnhancement(imageId);
      
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
      // Get full image data from gallery
      const imageData = this.galleryImages.find(img => img.id === imageId);
      if (!imageData) {
        throw new Error('Image not found in gallery');
      }
      
      // First, check if the image needs enhancement to show appropriate loading message
      const needsEnhancement = await this.checkIfImageNeedsEnhancement(imageId);
      
      let loadingMessage = `Creating your ${productType}...`;
      if (needsEnhancement) {
        loadingMessage = `🎨 Preparing your image for premium print quality...`;
        this.setLoading(true, loadingMessage, 10);
        
        // Show progressive loading messages with progress bar
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🔍 Analyzing image resolution and quality...`, 20);
          }
        }, 1000);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🚀 AI enhancement in progress - making your image print-perfect...`, 40);
          }
        }, 2500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `✨ Enhancing details and sharpening for crystal-clear printing...`, 60);
          }
        }, 4500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🎯 Optimizing colors and contrast for vibrant merchandise...`, 75);
          }
        }, 6500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🎽 Almost ready! Creating your beautiful ${productType}...`, 85);
          }
        }, 8500);
        
        setTimeout(() => {
          if (this.isLoading) {
            this.setLoading(true, `🏁 Final touches - your ${productType} will be amazing!`, 95);
          }
        }, 10500);
      } else {
        this.setLoading(true, `🎽 Creating your ${productType} with your high-quality image...`, 50);
      }
      
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.createGuidedProduct(imageId, productType, {
        imageUrl: imageData.url,
        imageTitle: imageData.title || imageData.fileName,
        ...customOptions
      });
      
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
      const product = this.products.find(p => (p.id || p.productId) === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // REFACTOR: Use cart service instead of direct cart manipulation
      const result = this.cartService.addItem(product, variantId, quantity);
      
      if (result.success) {
        this.showSuccess('Added to cart!');
        // Cart UI will be updated via event bus
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showError('Failed to add to cart: ' + error.message);
    }
  }
  
  removeFromCart(productId, variantId) {
    // REFACTOR: Use cart service instead of direct cart manipulation
    const result = this.cartService.removeItem(productId, variantId);
    
    if (!result.success) {
      this.showError(result.message);
    }
    // Cart UI will be updated via event bus
  }
  
  updateCartQuantity(productId, variantId, quantity) {
    // REFACTOR: Use cart service instead of direct cart manipulation
    const result = this.cartService.updateQuantity(productId, variantId, quantity);
    
    if (!result.success) {
      this.showError(result.message);
    }
    // Cart UI will be updated via event bus
  }
  
  viewProductDetails(productId) {
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (!product) {
      this.showError('Product not found');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal product-detail-modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${product.title}</h2>
        <div class="product-detail-content">
          <div class="detail-image">
            <img src="${(product.images && product.images.length > 0) ? product.images[0].src : (product.sourceImage?.url || '')}" alt="${product.title}" />
          </div>
          <div class="detail-info">
            <p>${product.description || ''}</p>
            <h3>Available Variants:</h3>
            <div class="variants-list">
              ${(product.variants || []).map(v => `
                <div class="variant-item">
                  <span>${v.title}</span>
                  <span>$${(v.price / 100).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.close').onclick = () => modal.remove();
  }
  
  editProduct(productId) {
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (!product) {
      this.showError('Product not found');
      return;
    }
    
    // Ensure gallery images are loaded
    if (!this.galleryImages || this.galleryImages.length === 0) {
      this.showError('Gallery images not loaded. Please refresh the page and try again.');
      return;
    }
    
    // Find the original image and product type
    // Try multiple ways to find the image data based on different product structures
    let imageData = null;
    
    // Method 1: Check sourceImage (older format)
    if (product.sourceImage?.id || product.sourceImage?.url) {
      imageData = this.galleryImages.find(img => 
        img.id === product.sourceImage?.id || 
        img.url === product.sourceImage?.url
      );
    }
    
    // Method 2: Check imageId (newer format)
    if (!imageData && product.imageId) {
      imageData = this.galleryImages.find(img => img.id === product.imageId);
    }
    
    // Method 3: Check if imageId is in the images array
    if (!imageData && product.images && product.images.length > 0) {
      const firstImageId = product.images[0]?.id || product.images[0];
      imageData = this.galleryImages.find(img => img.id === firstImageId);
    }
    
    if (!imageData) {
      console.warn('Edit Product Debug:', {
        productId,
        product,
        galleryImagesCount: this.galleryImages.length,
        searchedFor: {
          sourceImageId: product.sourceImage?.id,
          sourceImageUrl: product.sourceImage?.url,
          imageId: product.imageId,
          firstImage: product.images?.[0],
          productType: product.productType,
          blueprintIdFromProductType: product.productType && product.productType.startsWith('validated-') 
            ? product.productType.replace('validated-', '') : null
        },
        galleryImageIds: this.galleryImages.map(img => img.id),
        galleryImageSample: this.galleryImages.slice(0, 3)
      });
      
      // Let's also try a more flexible search
      console.warn('Attempting flexible image search...');
      
      // For validated products, try to use blueprint ID from productType
      let blueprintSearchId = null;
      if (product.productType && product.productType.startsWith('validated-')) {
        blueprintSearchId = product.productType.replace('validated-', '');
        console.warn('Extracted blueprint ID for image search:', blueprintSearchId);
      }
      
      const flexibleSearch = this.galleryImages.find(img => {
        return img.id === product.imageId ||
               img.id === product.sourceImage?.id ||
               img.url === product.sourceImage?.url ||
               (product.images && product.images.includes(img.id)) ||
               (typeof product.images?.[0] === 'string' && img.id === product.images[0]) ||
               (typeof product.images?.[0] === 'object' && img.id === product.images[0]?.id) ||
               // Try blueprint ID search for validated products
               (blueprintSearchId && (
                 img.id === blueprintSearchId ||
                 String(img.id) === String(blueprintSearchId) ||
                 parseInt(img.id) === parseInt(blueprintSearchId)
               ));
      });
      
      if (flexibleSearch) {
        console.warn('Found image with flexible search:', flexibleSearch);
        imageData = flexibleSearch;
      } else {
        this.showError('Original image not found. Please ensure the source image is still in your gallery.');
        return;
      }
    }
    
    // Extract product type from existing product
    const productType = this.extractProductTypeFromProduct(product);
    const productConfig = this.findProductConfig(productType);
    
    if (!productConfig) {
      this.showError('Product configuration not found');
      return;
    }
    
    // Extract current settings from product
    const currentSettings = this.extractCurrentSettings(product);
    
    // Show customization modal with current settings
    // Emit event for new fullscreen customization modal
    this.eventBus.emit("product.customize", { productId: product.id || product.productId });
  }
  

  

  
  async deleteProduct(productId) {
    if (!confirm('Are you sure you want to remove this product?')) {
      return;
    }
    
    try {
      this.setLoading(true, 'Deleting product from all systems...');
      
      // Step 1: Delete from database with comprehensive cleanup
      this.setLoading(true, '🗑️ Removing from database...', 25);
      
      // REFACTOR: Use API service instead of direct fetch
      try {
        await this.apiService.deleteProduct(productId);
      } catch (error) {
        // Handle 404 as success (product already gone)
        if (!error.message.includes('404')) {
          throw error;
        }
      }
      
      // Step 2: Verify deletion via API
      this.setLoading(true, '🔍 Verifying removal...', 50);
      
      // REFACTOR: Use API service instead of direct fetch
      try {
        await this.apiService.getProduct(productId);
        throw new Error('Product still exists after deletion attempt');
      } catch (error) {
        // 404 is expected - product successfully deleted
        if (!error.message.includes('404')) {
          throw error;
        }
      }
      
      // Step 3: Clear from cache and local storage
      this.setLoading(true, '💾 Clearing cache...', 75);
      
      // Remove from local products array
      this.products = this.products.filter(p => (p.id || p.productId) !== productId);
      
      // Clear any cached data
      if (typeof localStorage !== 'undefined') {
        // Clear any product-specific cache entries
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes(productId)) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Step 4: Force refresh products list to ensure consistency
      this.setLoading(true, '🔄 Refreshing product list...', 90);
      await this.loadUserProducts();
      
      // Step 5: Final verification
      this.setLoading(true, '✅ Finalizing deletion...', 100);
      const finalCheck = this.products.find(p => (p.id || p.productId) === productId);
      if (finalCheck) {
        throw new Error('Product still exists in local cache after deletion');
      }
      
      this.showSuccess('Product removed successfully!');
      this.render();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      this.showError('Failed to delete product: ' + error.message);
      
      // Force reload products to ensure UI consistency
      try {
        await this.loadUserProducts();
        this.render();
      } catch (reloadError) {
        console.error('Failed to reload products after delete error:', reloadError);
      }
    } finally {
      this.setLoading(false);
    }
  }
  
  getCartTotal() {
    // REFACTOR: Use cart service instead of direct cart calculation
    return this.cartService.getTotal();
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
    
    // Product actions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.preview-product-btn')) {
        const btn = e.target.closest('.preview-product-btn');
        const productId = btn.dataset.productId;
        this.previewProduct(productId);
      }
      
      if (e.target.closest('.edit-product-btn')) {
        const btn = e.target.closest('.edit-product-btn');
        const productId = btn.dataset.productId;
        this.editProduct(productId);
      }
      
      if (e.target.closest('.delete-product-btn')) {
        const btn = e.target.closest('.delete-product-btn');
        const productId = btn.dataset.productId;
        this.deleteProduct(productId);
      }
      
      if (e.target.closest('.refresh-status-btn')) {
        const btn = e.target.closest('.refresh-status-btn');
        const productId = btn.dataset.productId;
        this.refreshProductStatus(productId);
      }
      
      if (e.target.closest('.retry-setup-btn')) {
        const btn = e.target.closest('.retry-setup-btn');
        const productId = btn.dataset.productId;
        this.retryProductSetup(productId);
      }
    });
  }
  

  

  
  render() {
    const container = document.getElementById('merchandise-store');
    if (!container) {
      console.error('Merchandise store container not found!');
      return;
    }
    
    try {
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
              <div id="category-navigation-container">
                <!-- Category cards will be rendered here -->
              </div>
            </div>
            ` : ''}
            
            <div class="store-section">
              <h2>🎨 Your Designed Products</h2>
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
      
      console.log('✅ Merchandise store rendered successfully');
    } catch (error) {
      console.error('Error rendering merchandise store:', error);
      container.innerHTML = `
        <div class="merchandise-store">
          <div class="store-header">
            <h1>🛍️ Merchandise Store</h1>
            <p style="color: #ff6b6b;">There was an error loading the store. Please refresh the page.</p>
          </div>
        </div>
      `;
    }
  }
  
  renderGalleryImages() {
    try {
      if (!this.galleryImages || this.galleryImages.length === 0) {
        return `
          <div class="empty-state">
            <p>No images in your gallery yet.</p>
            <p>Save images from episodes and content pages to get started!</p>
          </div>
        `;
      }
      
      return this.galleryImages.map(image => {
        if (!image || !image.id) {
          console.warn('Invalid image data:', image);
          return '';
        }
        
        return `
          <div class="gallery-image-card ${this.selectedImage === image.id ? 'selected' : ''}">
            <img src="${image.thumbnailUrl || image.url || ''}" alt="${this.cleanImageTitle(image.title)}" 
                 onerror="this.src='/images/placeholder.jpg'" />
            <div class="image-info">
              <h4>${this.cleanImageTitle(image.title)}</h4>
              <div class="image-actions">
                <button class="gallery-image-select" data-image-id="${image.id}">
                  ${this.selectedImage === image.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).filter(html => html).join('');
    } catch (error) {
      console.error('Error rendering gallery images:', error);
      return `
        <div class="empty-state">
          <p>Error loading gallery images.</p>
          <p>Please refresh the page to try again.</p>
        </div>
      `;
    }
  }
  renderCategoryCards(container) {
    console.log('🎴 Rendering category cards');
    
    // Priority order for categories (most popular first)
    const categoryPriority = [
      't-shirt', 'hoodie', 'coffee-mug', 'premium-tshirt', 'women-tee',
      'canvas', 'tote-bag', 'pillow', 'hat', 'phone-case'
    ];
    
    // Sort categories by priority, then alphabetically
    const sortedCategories = Object.entries(this.productCategories).sort(([a], [b]) => {
      const aPriority = categoryPriority.indexOf(a);
      const bPriority = categoryPriority.indexOf(b);
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      return a.localeCompare(b);
    });

    const categoryCardsHTML = sortedCategories.map(([categoryKey, categoryData]) => {
      const stats = this.getCategoryStats(categoryData.products);
      const description = this.getCategoryDescription(categoryKey);
      
      return `
        <div class="category-card" data-category="${categoryKey}">
          <div class="category-card-header">
            <div class="category-icon-large">${this.getCategoryIcon(categoryKey)}</div>
            <div class="category-info">
              <h3 class="category-name">${categoryData.name}</h3>
              <p class="category-description">${description}</p>
            </div>
          </div>
          <div class="category-stats">
            <div class="stat-item">
              <span class="stat-number">${categoryData.products.length}</span>
              <span class="stat-label">Products</span>
            </div>
            <div class="stat-item">
              <span class="stat-price">${stats.priceRange}</span>
              <span class="stat-label">Price Range</span>
            </div>
          </div>
          <div class="category-card-footer">
            <button class="browse-category-btn">
              Browse ${categoryData.name} <span class="arrow">→</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="category-cards-view">
        <div class="catalog-header">
          <h2>🛍️ Choose Your Product Category</h2>
          <p>Explore ${Object.keys(this.productCategories).length} categories with ${this.availableProducts.length} total products</p>
        </div>
        <div class="category-cards-grid">
          ${categoryCardsHTML}
        </div>
      </div>
    `;
  }

  renderCategoryProducts(container) {
    // Initialize categoryView if it doesn't exist
    if (!this.categoryView) {
      console.error('❌ CategoryView not initialized when rendering products');
      return;
    }
    
    console.log('📦 Rendering products for category:', this.categoryView.selectedCategory);
    
    const categoryData = this.productCategories[this.categoryView.selectedCategory];
    if (!categoryData) {
      console.error('Category data not found:', this.categoryView.selectedCategory);
      return;
    }

    const productsHTML = categoryData.products.map(product => `
      <div class="product-item">
        <div class="product-preview">
          <div class="product-preview-image" data-blueprint-id="${product.blueprintId}">
            <img class="blueprint-preview-img" 
                 src="/images/previews/loading-preview.svg" 
                 alt="${product.name} Preview"
                 onerror="this.src='/images/previews/generic-product-preview.svg'"
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
            <div class="product-preview-text">${product.name}</div>
          </div>
        </div>
        <div class="product-info">
          <h4 class="product-name">${product.name}</h4>
          <p class="product-description">${product.description || 'Custom merchandise item'}</p>
          <div class="product-details">
            <span class="product-price">${this.getEstimatedPrice(product.category)}</span>
          </div>
        </div>
        <button class="select-simple-product product-select-btn" 
                data-product="${product.id}" 
                data-blueprint="${product.blueprintId}" 
                data-provider="${product.printProviderId}">
          Select This Product
        </button>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="category-products-view">
        <div class="category-header">
          <button class="back-to-categories">← Back to Categories</button>
          <div class="category-title-section">
            <h2>
              ${this.getCategoryIcon(this.categoryView.selectedCategory)} 
              ${categoryData.name}
            </h2>
            <p>${this.getCategoryDescription(this.categoryView.selectedCategory)}</p>
          </div>
        </div>
        <div class="products-grid">
          ${productsHTML}
        </div>
      </div>
    `;
  }

  getCategoryStats(products) {
    const providers = new Set(products.map(p => p.provider));
    // Parse price strings to numbers (remove $ and convert to float)
    const prices = products.map(p => {
      const priceStr = this.getEstimatedPrice(p.category);
      return parseFloat(priceStr.replace('$', ''));
    });
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      providerCount: providers.size,
      priceRange: minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}-${maxPrice.toFixed(2)}`
    };
  }

  async loadBlueprintPreviews() {
    console.log('🎨 Loading blueprint preview images...');
    
    // Find all product preview containers
    const previewContainers = document.querySelectorAll('.product-preview-image[data-blueprint-id]');
    
    if (previewContainers.length === 0) {
      console.log('📷 No blueprint previews to load');
      return;
    }
    
    console.log(`🔍 Found ${previewContainers.length} blueprint previews to load`);
    
    // Collect all unique blueprint IDs
    const blueprintIds = Array.from(previewContainers).map(container => 
      parseInt(container.dataset.blueprintId)
    ).filter(id => !isNaN(id));
    
    const uniqueBlueprintIds = [...new Set(blueprintIds)];
    
    try {
      // REFACTOR: Use API service instead of direct fetch
      const data = await this.apiService.loadBlueprintPreviews(uniqueBlueprintIds);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch blueprint previews');
      }
      
      console.log(`✅ Loaded ${data.previews.length} blueprint previews`);
      
      // Update each preview image
      data.previews.forEach(preview => {
        if (preview.success) {
          // Find all containers for this blueprint ID
          const containers = document.querySelectorAll(`.product-preview-image[data-blueprint-id="${preview.blueprintId}"]`);
          
          containers.forEach(container => {
            const img = container.querySelector('.blueprint-preview-img');
            if (img) {
              // Set the preview image source
              img.src = preview.previewImage;
              img.alt = `${preview.name} Preview`;
              
              console.log(`🖼️ Updated preview for blueprint ${preview.blueprintId}: ${preview.name}`);
            }
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Error loading blueprint previews:', error);
      
      // Fallback: Set all images to generic preview
      previewContainers.forEach(container => {
        const img = container.querySelector('.blueprint-preview-img');
        if (img && img.src.includes('loading-preview.svg')) {
          img.src = '/images/previews/generic-product-preview.svg';
        }
      });
    }
  }

  getCategoryDescription(categoryKey) {
    const descriptions = {
      't-shirt': 'Classic cotton t-shirts perfect for everyday wear',
      'hoodie': 'Comfortable hoodies for cool weather and casual style',
      'coffee-mug': 'Premium ceramic mugs for your morning coffee ritual',
      'premium-tshirt': 'High-quality premium t-shirts with superior materials',
      'women-tee': 'Stylish women\'s t-shirts with a flattering fit',
      'canvas': 'Beautiful canvas prints to decorate your space',
      'tote-bag': 'Practical and stylish tote bags for daily use',
      'pillow': 'Soft decorative pillows to enhance your home',
      'hat': 'Trendy hats and caps for sun protection and style',
      'phone-case': 'Protective phone cases with custom designs',
      'tank-top': 'Lightweight tank tops perfect for warm weather',
      'long-sleeve': 'Long-sleeve shirts for cooler days',
      'sweatshirt': 'Cozy sweatshirts for comfort and warmth'
    };
    
    return descriptions[categoryKey] || 'Custom merchandise items with your favorite designs';
  }

  showCategoryProducts(categoryKey) {
    // Initialize categoryView if it doesn't exist
    if (!this.categoryView) {
      this.categoryView = {
        currentView: 'categories',
        selectedCategory: null,
        categoryData: {}
      };
    }
    
    this.categoryView.currentView = 'products';
    this.categoryView.selectedCategory = categoryKey;
    
    // Re-render with new view
    const container = document.getElementById('category-navigation-container');
    if (container) {
      this.renderCategoryProducts(container);
      // Load blueprint preview images after rendering
      this.loadBlueprintPreviews();
    }
  }

  showCategoryCards() {
    // Initialize categoryView if it doesn't exist
    if (!this.categoryView) {
      this.categoryView = {
        currentView: 'categories',
        selectedCategory: null,
        categoryData: {}
      };
    }
    
    this.categoryView.currentView = 'categories';
    this.categoryView.selectedCategory = null;
    
    // Re-render with new view
    const container = document.getElementById('category-navigation-container');
    if (container) {
      this.renderCategoryCards(container);
    }
  }



  handleShowMoreProducts(categoryKey) {
    console.log(`🔄 Showing more products for category: ${categoryKey}`);
    
    const categoryData = this.productCategories[categoryKey];
    if (!categoryData) return;
    
    const container = document.getElementById(`products-${categoryKey}`);
    if (!container) return;
    
    const currentCount = container.children.length;
    const isExpanded = this.progressiveDisclosure.expandedCategories.has(categoryKey);
    
    if (isExpanded) {
      // Collapse to initial view
      this.progressiveDisclosure.expandedCategories.delete(categoryKey);
      this.animateProductsOut(container, this.progressiveDisclosure.initialShow);
      this.updateProgressiveControls(categoryKey, categoryData, false);
    } else {
      // Show more products
      const newCount = Math.min(currentCount + this.progressiveDisclosure.incrementBy, categoryData.products.length);
      this.addMoreProducts(categoryKey, categoryData, currentCount, newCount);
    }
  }

  handleShowAllProducts(categoryKey) {
    console.log(`🔄 Showing all products for category: ${categoryKey}`);
    
    const categoryData = this.productCategories[categoryKey];
    if (!categoryData) return;
    
    const container = document.getElementById(`products-${categoryKey}`);
    if (!container) return;
    
    const currentCount = container.children.length;
    this.progressiveDisclosure.expandedCategories.add(categoryKey);
    this.addMoreProducts(categoryKey, categoryData, currentCount, categoryData.products.length);
  }

  addMoreProducts(categoryKey, categoryData, fromIndex, toIndex) {
    const container = document.getElementById(`products-${categoryKey}`);
    if (!container) return;
    
    const newProducts = categoryData.products.slice(fromIndex, toIndex);
    
    newProducts.forEach((product, index) => {
      const productElement = document.createElement('div');
      productElement.className = 'simple-category progressive-item progressive-new';
      productElement.dataset.type = product.id;
      productElement.style.animationDelay = `${index * 0.1}s`;
      
      productElement.innerHTML = `
        <div class="category-icon">${this.getCategoryIcon(product.category)}</div>
        <h5>${product.name}</h5>
        <p class="product-desc">${product.description || 'Custom merchandise item'}</p>
        <div class="product-price">$${this.getEstimatedPrice(product.category)}</div>
        <button class="select-simple-product" 
                data-product="${product.id}" 
                data-blueprint="${product.blueprintId}" 
                data-provider="${product.printProviderId}">
          Select
        </button>
      `;
      
      container.appendChild(productElement);
      
      // Trigger animation
      setTimeout(() => {
        productElement.classList.add('progressive-visible');
      }, index * 50);
    });
    
    // Update controls
    const isFullyExpanded = toIndex >= categoryData.products.length;
    if (isFullyExpanded) {
      this.progressiveDisclosure.expandedCategories.add(categoryKey);
    }
    this.updateProgressiveControls(categoryKey, categoryData, isFullyExpanded);
  }

  animateProductsOut(container, keepCount) {
    const items = Array.from(container.children);
    const toRemove = items.slice(keepCount);
    
    toRemove.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('progressive-fade-out');
        setTimeout(() => {
          if (item.parentNode) {
            item.parentNode.removeChild(item);
          }
        }, 300);
      }, index * 50);
    });
  }

  updateProgressiveControls(categoryKey, categoryData, isFullyExpanded) {
    const categorySection = document.querySelector(`[data-category="${categoryKey}"]`);
    const controlsContainer = categorySection?.querySelector('.progressive-controls');
    
    if (!controlsContainer) return;
    
    const container = document.getElementById(`products-${categoryKey}`);
    const currentCount = container?.children.length || 0;
    const hasMore = currentCount < categoryData.products.length;
    
    if (!hasMore) {
      // Hide controls if no more products
      controlsContainer.style.display = 'none';
      return;
    }
    
    controlsContainer.style.display = 'block';
    
    if (isFullyExpanded) {
      controlsContainer.innerHTML = `
        <button class="btn-secondary show-more-products" data-category="${categoryKey}">
          Show less
        </button>
      `;
    } else if (categoryData.products.length > this.progressiveDisclosure.maxBeforeShowAll) {
      const remainingCount = categoryData.products.length - currentCount;
      const nextIncrement = Math.min(this.progressiveDisclosure.incrementBy, remainingCount);
      
      controlsContainer.innerHTML = `
        <button class="btn-secondary show-more-products" data-category="${categoryKey}">
          Show ${nextIncrement} more ${categoryData.name.toLowerCase()}
        </button>
        <button class="btn-outline show-all-products" data-category="${categoryKey}">
          Show all ${categoryData.products.length}
        </button>
      `;
    } else {
      const remainingCount = categoryData.products.length - currentCount;
      const nextIncrement = Math.min(this.progressiveDisclosure.incrementBy, remainingCount);
      
      controlsContainer.innerHTML = `
        <button class="btn-secondary show-more-products" data-category="${categoryKey}">
          Show ${nextIncrement} more
        </button>
      `;
    }
  }
  
  renderProducts() {
    try {
      // PHASE 2 REFACTOR: Use ProductCardRenderer for all product rendering
      return this.productCardRenderer.renderProductsGrid(this.products, {
        selectedImage: this.selectedImage,
        showCreateButton: true
      });
    } catch (error) {
      console.error('Error rendering products with ProductCardRenderer:', error);
      return `
        <div class="empty-state">
          <p>Error loading products.</p>
          <p>Please refresh the page to try again.</p>
        </div>
      `;
    }
  }
  
  isProductComplete(product) {
    // REFACTOR: Use validation service instead of inline validation logic
    return this.validationService.isProductComplete(product);
  }
  
  /**
   * Check if a product is broken (completely unusable)
   */
  isProductBroken(product) {
    // REFACTOR: Use validation service instead of inline validation logic
    return this.validationService.isProductBroken(product);
  }
  
  /**
   * Helper methods for service-based architecture
   */
  
  updateCartUI() {
    // Update cart display using cart service data
    this.renderCart();
  }
  
  async refreshProducts() {
    // Reload products from API
    try {
      await this.loadUserProducts();
      this.render();
    } catch (error) {
      console.error('Error refreshing products:', error);
      this.showError('Failed to refresh products');
    }
  }
  
  getCartSummary() {
    // Get cart summary from cart service
    return this.cartService.getSummary();
  }
  
  renderIncompleteProduct(product) {
    const productId = product.id || product.productId;
    const productTitle = product.title || 'Untitled Product';
    const productImage = product.sourceImage?.url || '';
    const productType = this.extractProductTypeFromProduct(product);
    const productIcon = this.getProductIcon(productType);
    const status = this.getProductStatus(product);
    
    return `
      <div class="product-card incomplete-product">
        <div class="product-type-header">
          <span class="product-type-icon">${productIcon}</span>
          <span class="product-type-name">${this.getProductTypeName(productType)}</span>
          <span class="product-status ${status.class}">${status.text}</span>
        </div>
        <div class="product-image">
          <img src="${productImage}" alt="${productTitle}" />
          <div class="processing-overlay">
            <div class="processing-spinner"></div>
            <p>Processing...</p>
          </div>
          <div class="product-actions">
            <button class="action-btn edit-product-btn" data-product-id="${productId}" title="Edit Product">
              <span>✏️</span>
            </button>
            <button class="action-btn delete-product-btn" data-product-id="${productId}" title="Delete">
              <span>🗑️</span>
            </button>
          </div>
        </div>
        <div class="product-info">
          <h4>${productTitle}</h4>
          <div class="incomplete-message">
            <p>⏳ This product is being set up with print providers. Variants and previews will be available soon.</p>
            <div class="incomplete-actions">
              <button class="refresh-status-btn" data-product-id="${productId}">
                🔄 Check Status
              </button>
              <button class="retry-setup-btn" data-product-id="${productId}">
                🔧 Retry Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  getProductStatus(product) {
    const hasVariants = product.variants && product.variants.length > 0;
    const hasImages = product.images && product.images.length > 0;
    
    if (!hasVariants && !hasImages) {
      return { class: 'status-processing', text: 'Setting Up' };
    }
    if (!hasVariants) {
      return { class: 'status-variants', text: 'Loading Variants' };
    }
    if (!hasImages) {
      return { class: 'status-images', text: 'Generating Previews' };
    }
    return { class: 'status-complete', text: 'Ready' };
  }
  
  async refreshProductStatus(productId) {
    try {
      this.setLoading(true, 'Checking product status...');
      
      const response = await fetch(`/api/merchandise/product-status/${productId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the product in our local array
        const productIndex = this.products.findIndex(p => (p.id || p.productId) === productId);
        if (productIndex >= 0) {
          this.products[productIndex] = { ...this.products[productIndex], ...data.product };
        }
        
        this.render();
        
        if (this.isProductComplete(data.product)) {
          this.showSuccess('Product is now ready! You can preview and add variants to cart.');
        } else {
          this.showSuccess('Status updated. Product is still being processed.');
        }
      } else {
        this.showError(data.error || 'Failed to check product status');
      }
      
    } catch (error) {
      console.error('Error refreshing product status:', error);
      this.showError('Failed to check product status');
    } finally {
      this.setLoading(false);
    }
  }
  
  async retryProductSetup(productId) {
    try {
      this.setLoading(true, 'Retrying product setup...');
      
      const response = await fetch(`/api/merchandise/retry-setup/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the product in our local array
        const productIndex = this.products.findIndex(p => (p.id || p.productId) === productId);
        if (productIndex >= 0) {
          this.products[productIndex] = { ...this.products[productIndex], ...data.product };
        }
        
        this.render();
        this.showSuccess('Product setup restarted. Check back in a few minutes.');
      } else {
        this.showError(data.error || 'Failed to retry product setup');
      }
      
    } catch (error) {
      console.error('Error retrying product setup:', error);
      this.showError('Failed to retry product setup');
    } finally {
      this.setLoading(false);
    }
  }
  
  renderCart() {
    try {
      // PHASE 2 REFACTOR: Use CartRenderer for all cart rendering
      return this.cartRenderer.renderCart();
    } catch (error) {
      console.error('Error rendering cart with CartRenderer:', error);
      return `
        <div class="empty-cart">
          <p>Error loading cart. Please refresh the page.</p>
        </div>
      `;
    }
  }
  
  renderModals() {
    // PHASE 2 REFACTOR: ModalRenderer handles modal creation dynamically
    // No need to pre-render static modals - they're created on demand
    return `<!-- Modal container - modals created dynamically by ModalRenderer -->`;
  }
  
  selectImage(imageId) {
    this.selectedImage = imageId;
    console.log('🖼️ Image selected:', imageId);
    this.render();
    
    // Initialize category cards after rendering with retries
    this.initializeCategoryCards();
  }

  async initializeCategoryCards() {
    console.log('🎴 Starting category cards initialization...');
    
    // Wait for DOM to be ready after render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryInitialize = async () => {
      attempts++;
      console.log(`� Attempt ${attempts}: Looking for category navigation container...`);
      
      try {
        // Find the container
        const container = document.getElementById('category-navigation-container');
        if (!container) {
          if (attempts < maxAttempts) {
            console.log(`⏳ Container not found, retrying in 200ms...`);
            setTimeout(tryInitialize, 200);
            return;
          } else {
            console.error('❌ Category navigation container not found after all attempts');
            const availableIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            console.log('Available containers:', availableIds.slice(0, 10));
            this.showError('Failed to initialize category selection. Please refresh the page.');
            return;
          }
        }
        
        console.log('✅ Found category navigation container!');
        
        // Make sure we have product categories loaded
        if (!this.productCategories || Object.keys(this.productCategories).length === 0) {
          console.log('📦 Loading product categories...');
          await this.loadProductTypes();
        }
        
        console.log(`📊 Ready to render ${Object.keys(this.productCategories).length} categories`);
        this.renderCategoryCards(container);
        console.log('✅ Category cards rendered successfully');
        
        // Add event listeners for category cards and product selection
        container.addEventListener('click', (e) => {
          if (e.target.classList.contains('select-simple-product')) {
            const productType = e.target.dataset.product;
            const blueprintId = parseInt(e.target.dataset.blueprint, 10);
            const providerId = parseInt(e.target.dataset.provider, 10);
            const blueprintName = e.target.dataset.name;
            
            console.log('🔥 DIAGNOSTIC: Product selection event triggered');
            console.log('   📊 Raw data from UI element:');
            console.log('      productType:', productType);
            console.log('      blueprintId:', blueprintId);
            console.log('      providerId:', providerId);
            console.log('      blueprintName:', blueprintName);
            console.log('   📊 availableProducts array status:');
            console.log('      exists:', !!this.availableProducts);
            console.log('      length:', this.availableProducts?.length || 0);
            if (this.availableProducts?.length > 0) {
              console.log('      first product sample:', this.availableProducts[0]);
            }

            // 🚨 NO FALLBACK LOGIC - STRICT VALIDATION ONLY
            if (!this.availableProducts || this.availableProducts.length === 0) {
              const error = '❌ FATAL ERROR: availableProducts array is empty or undefined. Cannot proceed with product selection.';
              console.error(error);
              console.error('   🔍 Debug info:');
              console.error('      this.availableProducts:', this.availableProducts);
              console.error('      typeof availableProducts:', typeof this.availableProducts);
              console.error('   🎯 This indicates loadProductTypes() failed or was never called');
              throw new Error(error);
            }

            // Find the exact product config - NO CONSTRUCTION, NO FALLBACKS
            const productConfig = this.availableProducts.find(p =>
              parseInt(p.blueprintId, 10) === blueprintId &&
              parseInt(p.printProviderId, 10) === providerId
            );

            if (!productConfig) {
              const error = `❌ FATAL ERROR: Product not found in validated catalog. Blueprint: ${blueprintId}, Provider: ${providerId}`;
              console.error(error);
              console.error('   🔍 Available product blueprints/providers:');
              this.availableProducts.forEach((p, i) => {
                console.error(`      ${i}: ${p.id} (blueprint: ${p.blueprintId}, provider: ${p.printProviderId})`);
              });
              console.error('   🎯 This indicates either:');
              console.error('      1. UI is generating invalid blueprint/provider combinations');
              console.error('      2. availableProducts is not properly loaded from product-types.js');
              console.error('      3. Data attributes on button are wrong');
              throw new Error(error);
            }

            console.log('✅ DIAGNOSTIC: Valid product config found');
            console.log('   📊 Product config details:');
            console.log('      id:', productConfig.id);
            console.log('      name:', productConfig.name);
            console.log('      blueprintId:', productConfig.blueprintId);
            console.log('      printProviderId:', productConfig.printProviderId);
            console.log('      category:', productConfig.category);
            console.log('      provider:', productConfig.provider);

            // Validate that this is a properly formatted product type ID
            if (!productConfig.id.startsWith('validated-')) {
              const error = `❌ FATAL ERROR: Product ID '${productConfig.id}' is not a validated product type. Must start with 'validated-'`;
              console.error(error);
              console.error('   🎯 This indicates the product was not loaded from the validated catalog');
              throw new Error(error);
            }

            // Emit event to open customization modal
            console.log('📱 DIAGNOSTIC: Emitting product.customize event');
            console.log('   📊 Event payload:');
            console.log('      productConfig.id:', productConfig.id);
            console.log('      blueprintId:', blueprintId);
            console.log('      providerId:', providerId);
            
            this.eventBus.emit('product.customize', {
              productConfig: productConfig,
              blueprintId: blueprintId,
              providerId: providerId
            });
            
            console.log('✅ DIAGNOSTIC: Product selection event completed successfully');
          } else if (e.target.classList.contains('category-card') || e.target.closest('.category-card')) {
            const card = e.target.closest('.category-card') || e.target;
            const categoryKey = card.dataset.category;
            console.log('🎯 Category card clicked:', categoryKey);
            this.showCategoryProducts(categoryKey);
          } else if (e.target.classList.contains('back-to-categories')) {
            console.log('🔙 Back to categories');
            this.showCategoryCards();
          } else if (e.target.classList.contains('browse-category-btn')) {
            const card = e.target.closest('.category-card');
            if (card) {
              const categoryKey = card.dataset.category;
              console.log('🎯 Browse category button clicked:', categoryKey);
              this.showCategoryProducts(categoryKey);
            }
          }
        });
        console.log('✅ Event listeners attached to category cards');
        
        // Auto-scroll to the Choose Product section for better UX
        const chooseProductSection = document.getElementById('choose-product-section');
        if (chooseProductSection) {
          chooseProductSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          console.log('📍 Auto-scrolled to Choose Product section');
        }
        
      } catch (error) {
        console.error('❌ Error initializing category cards:', error);
        this.showError('Failed to load product categories. Please refresh the page.');
      }
    };
    
    tryInitialize();
  }
  
  /**
   * Get character names from API with caching
   */
  async getCharacterNames() {
    if (this.cachedCharacters && this.cachedCharacters.length > 0) {
      return this.cachedCharacters;
    }
    
    try {
      const response = await fetch('/api/characters');
      const data = await response.json();
      if (data.success && data.data) {
        // Extract character names from the API response
        this.cachedCharacters = Object.values(data.data).map(char => ({
          name: char.name || char.character_name || char.id,
          id: char.id
        }));
        console.log('✅ Loaded characters from API:', this.cachedCharacters.length);
        return this.cachedCharacters;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load characters from API, using fallback:', error);
    }
    
    // Fallback to basic character list
    this.cachedCharacters = [
      { name: 'daphne', id: 'daphne' },
      { name: 'lucky', id: 'lucky' },
      { name: 'felix', id: 'felix' },
      { name: 'goblin-king', id: 'goblin-king' }
    ];
    return this.cachedCharacters;
  }
  
  /**
   * Get season names from API with caching
   */
  async getSeasonNames() {
    if (this.cachedSeasons && this.cachedSeasons.length > 0) {
      return this.cachedSeasons;
    }
    
    try {
      const response = await fetch('/api/seasons');
      const data = await response.json();
      if (data.success && data.data) {
        // Extract season names from the API response
        this.cachedSeasons = Object.keys(data.data).map(seasonKey => ({
          name: seasonKey,
          id: seasonKey
        }));
        console.log('✅ Loaded seasons from API:', this.cachedSeasons.length);
        return this.cachedSeasons;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load seasons from API, using fallback:', error);
    }
    
    // Fallback to basic season list
    this.cachedSeasons = [
      { name: 'spring', id: 'spring' },
      { name: 'summer', id: 'summer' },
      { name: 'autumn', id: 'autumn' },
      { name: 'fall', id: 'fall' },
      { name: 'winter', id: 'winter' }
    ];
    return this.cachedSeasons;
  }
  
  /**
   * Get location names from lore API with caching
   */
  async getLocationNames() {
    if (this.cachedLocations && this.cachedLocations.length > 0) {
      return this.cachedLocations;
    }
    
    try {
      const response = await fetch('/api/lore');
      const data = await response.json();
      if (data.success && data.data) {
        // Extract locations from lore data (filter by type or keywords)
        this.cachedLocations = Object.values(data.data)
          .filter(lore => {
            // Look for location-type lore items
            const title = (lore.title || '').toLowerCase();
            const description = (lore.description || '').toLowerCase();
            return title.includes('location') || 
                   title.includes('place') ||
                   description.includes('location') ||
                   lore.type === 'location';
          })
          .map(lore => ({
            name: lore.title || lore.name || lore.id,
            id: lore.id
          }));
        
        console.log('✅ Loaded locations from lore API:', this.cachedLocations.length);
        return this.cachedLocations;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load locations from API, using fallback:', error);
    }
    
    // Fallback to basic location list
    this.cachedLocations = [
      { name: 'forest', id: 'forest' },
      { name: 'castle', id: 'castle' },
      { name: 'garden', id: 'garden' },
      { name: 'mountain', id: 'mountain' },
      { name: 'cave', id: 'cave' },
      { name: 'town', id: 'town' },
      { name: 'village', id: 'village' }
    ];
    return this.cachedLocations;
  }

  async extractImageContext(imageData) {
    if (!imageData || !imageData.title) {
      return {};
    }
    
    const title = imageData.title.toLowerCase();
    const context = {};
    
    // Try to extract character names using API data
    const characters = await this.getCharacterNames();
    for (const character of characters) {
      const charName = character.name || character;
      const charKey = typeof charName === 'string' ? charName.toLowerCase() : '';
      if (title.includes(charKey.replace('-', ' ')) || title.includes(charKey)) {
        context.characterName = charKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        break;
      }
    }
    
    // Try to extract episode numbers
    const episodeMatch = title.match(/episode[\s\-]?(\d+)/i);
    if (episodeMatch) {
      context.episodeNumber = episodeMatch[1];
    }
    
    // Try to extract seasonal context using API data
    const seasons = await this.getSeasonNames();
    for (const season of seasons) {
      const seasonName = season.name || season;
      const seasonKey = typeof seasonName === 'string' ? seasonName.toLowerCase() : '';
      if (title.includes(seasonKey)) {
        context.seasonName = seasonKey.charAt(0).toUpperCase() + seasonKey.slice(1);
        break;
      }
    }
    
    // Try to extract location using lore API data
    const locations = await this.getLocationNames();
    for (const location of locations) {
      const locationName = location.name || location;
      const locationKey = typeof locationName === 'string' ? locationName.toLowerCase() : '';
      if (title.includes(locationKey)) {
        context.locationName = locationKey.charAt(0).toUpperCase() + locationKey.slice(1);
        break;
      }
    }
    
    return context;
  }
  
  /**
   * Map blueprint title/ID to our internal product type
   */
  mapBlueprintToProductType(blueprintTitle, blueprintId) {
    const title = blueprintTitle.toLowerCase();
    
    // Map by blueprint ID first (most reliable)
    const blueprintMap = {
      // T-Shirts & Tops
      '5': 'premium-tshirt',
      '6': 'premium-tshirt', 
      '9': 'premium-tshirt',
      '11': 'premium-tshirt',
      '12': 'premium-tshirt',
      '14': 'premium-tshirt',
      '15': 'premium-tshirt',
      '26': 'premium-tshirt',
      
      // Hoodies
      '146': 'hoodie',
      
      // Tank Tops
      '17': 'tank-top',
      
      // Mugs & Drinkware  
      '68': 'mug',
      
      // Pillows & Bedding
      '220': 'pillow',
      '223': 'pillow', 
      '229': 'pillow',
      '232': 'pillow',
      
      // Posters & Wall Art
      '19': 'poster'
    };
    
    if (blueprintMap[blueprintId]) {
      return blueprintMap[blueprintId];
    }
    
    // Fallback to title matching
    if (title.includes('hoodie') || title.includes('pullover')) {
      return 'hoodie';
    }
    if (title.includes('tank') || title.includes('sleeveless')) {
      return 'tank-top';
    }
    if (title.includes('pillow') || title.includes('cushion')) {
      return 'pillow';
    }
    if (title.includes('poster') || title.includes('print')) {
      return 'poster';
    }
    if (title.includes('mug') || title.includes('cup')) {
      return 'mug';
    }
    
    // Default to t-shirt
    return 'premium-tshirt';
  }
  
  findProductConfig(productTypeId) {
    console.log('🔍 Looking for product config:', productTypeId);
    console.log('🔍 Available product types:', Object.keys(this.productTypes));
    
    // Search through all product type categories
    for (const [categoryKey, category] of Object.entries(this.productTypes)) {
      console.log(`🔍 Checking category ${categoryKey}:`, category.products?.map(p => p.id));
      const product = category.products?.find(p => p.id === productTypeId);
      if (product) {
        console.log('✅ Found product config:', product);
        return product;
      }
    }
    
    console.log('❌ Product config not found for:', productTypeId);
    return null;
  }
  

  
  async createCustomizedProduct(productType, imageData, imageContext, customization) {
    try {
      // Prepare product options with productType information
      const productOptions = {
        ...imageContext,
        productType: productType, // Pass the selected product type
        borderConfig: null, // Border config removed - now handled in customization modal
        defaultVariant: {
          size: customization.defaultSize,
          color: customization.defaultColor
        }
      };
      
      // Get image data
      const selectedImageData = this.galleryImages.find(img => img.id === this.selectedImage);
      if (!selectedImageData) {
        throw new Error('Selected image not found');
      }
      
      // Call API directly without createProduct's progress handling
      this.setLoading(true, '🚀 Creating your amazing product...', 75);
      
      const response = await fetch('/api/merchandise/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          imageId: this.selectedImage,
          imageUrl: selectedImageData.url,
          imageTitle: selectedImageData.title || selectedImageData.fileName,
          productType: productType, // Ensure productType is passed at top level too
          productOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.setLoading(true, '✅ Product created successfully!', 100);
        
        // Add product to local array
        this.products.push(data.product);
        
        // Clean completion
        setTimeout(() => {
          this.setLoading(false);
          this.showSuccess('Product created successfully!');
          this.selectedImage = null;
          this.render();
        }, 500);
        
        return data.product;
      } else {
        throw new Error(data.error || 'Failed to create product');
      }
      
    } catch (error) {
      console.error('Error creating customized product:', error);
      this.setLoading(false);
      this.showError('Failed to create product: ' + error.message);
      throw error;
    }
  }
  
  async updateCustomizedProduct(existingProduct, productType, imageData, imageContext, customization) {
    try {
      // Delete the existing product first
      const productId = existingProduct.id || existingProduct.productId;
      this.products = this.products.filter(p => (p.id || p.productId) !== productId);
      
      // Create new product with updated settings
      await this.createCustomizedProduct(productType, imageData, imageContext, customization);
      
    } catch (error) {
      console.error('Error updating product:', error);
      this.setLoading(false);
      this.showError('Failed to update product: ' + error.message);
    }
  }
  
  extractProductTypeFromProduct(product) {
    console.log('🔍 Extracting product type from:', product);
    console.log('🔍 Product fields available:', Object.keys(product));
    console.log('🔍 Product blueprintId:', product.blueprintId);
    console.log('🔍 Product categoryId:', product.categoryId);
    console.log('🔍 Product productType:', product.productType);
    
    // First check if product has stored productType metadata
    if (product.productType) {
      console.log('🔍 Found stored productType:', product.productType);
      
      // Handle validated-XX format - extract the blueprint ID
      if (product.productType.startsWith('validated-')) {
        const blueprintId = product.productType.replace('validated-', '');
        console.log('🔍 Extracted blueprint ID from productType:', blueprintId);
        
        // Try to find the product type dynamically from loaded product data
        if (this.availableProducts && this.availableProducts.length > 0) {
          const matchingProduct = this.availableProducts.find(p => p.blueprintId === parseInt(blueprintId));
          if (matchingProduct) {
            console.log('🔍 Found dynamic product for blueprint', blueprintId, ':', matchingProduct.name);
            // Return the productType or category from the dynamic data
            return matchingProduct.productType || matchingProduct.category || 'custom-product';
          }
        }
        
        console.log('⚠️ No dynamic product found for blueprint', blueprintId, '- using fallback');
        // Fallback for common blueprint IDs if dynamic lookup fails
        const fallbackMap = {
          '68': 'coffee-mug',
          '5': 't-shirt',
          '77': 'hoodie',
          '220': 'pillow'
        };
        
        if (fallbackMap[blueprintId]) {
          console.log('� Using fallback mapping for blueprint', blueprintId);
          return fallbackMap[blueprintId];
        }
      }
      
      // Return as-is if not in validated-XX format
      return product.productType;
    }
    
    // Check if we have variants to determine product type
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      const variantTitle = firstVariant.title?.toLowerCase() || '';
      
      console.log('🔍 First variant title:', variantTitle);
      
      // Enhanced product type detection from variant titles
      if (variantTitle.includes('hoodie') || variantTitle.includes('pullover')) {
        return 'hoodie';
      }
      if (variantTitle.includes('tank') || variantTitle.includes('sleeveless')) {
        return 'tank-top';
      }
      if (variantTitle.includes('pillow') || variantTitle.includes('cushion')) {
        return 'pillow';
      }
      if (variantTitle.includes('poster') || variantTitle.includes('print')) {
        return 'poster';
      }
      if (variantTitle.includes('mug') || variantTitle.includes('cup') || variantTitle.includes('oz')) {
        return 'mug';
      }
      if (variantTitle.includes('tote') || variantTitle.includes('bag')) {
        return 'tote-bag';
      }
      if (variantTitle.includes('sticker')) {
        return 'sticker';
      }
      
      // Check blueprint ID patterns if available
      if (product.blueprintId || firstVariant.blueprintId) {
        const blueprintId = product.blueprintId || firstVariant.blueprintId;
        console.log('🔍 Blueprint ID:', blueprintId);
        
        // Map common blueprint IDs to product types
        const blueprintMap = {
          '5': 'premium-tshirt',
          '146': 'hoodie', 
          '17': 'tank-top',
          '68': 'mug',
          '19': 'poster',
          '71': 'pillow'
        };
        
        if (blueprintMap[blueprintId]) {
          console.log('🔍 Mapped blueprint to type:', blueprintMap[blueprintId]);
          return blueprintMap[blueprintId];
        }
      }
      
      // Default to premium t-shirt for clothing items
      return 'premium-tshirt';
    }
    
    // Fallback to title analysis
    const title = product.title?.toLowerCase() || '';
    console.log('🔍 Product title:', title);
    
    if (title.includes('hoodie') || title.includes('pullover')) {
      return 'hoodie';
    }
    if (title.includes('tank') || title.includes('sleeveless')) {
      return 'tank-top';
    }
    if (title.includes('pillow') || title.includes('cushion')) {
      return 'pillow';
    }
    if (title.includes('poster') || title.includes('print')) {
      return 'poster';
    }
    if (title.includes('mug') || title.includes('cup')) {
      return 'mug';
    }
    
    // Default fallback
    console.log('🔍 Using default product type: premium-tshirt');
    return 'premium-tshirt';
  }
  
  extractCurrentSettings(product) {
    // Extract current settings from the product
    // This is simplified - you might need to store more detailed settings
    return {
      selectedSize: 'M', // Default since we don't store this currently
      selectedColor: 'Black', // Default since we don't store this currently
      borderStyle: 'solid-medium' // Default since we don't store this currently
    };
  }
  
  getProductIcon(productType) {
    const icons = {
      'premium-tshirt': '👕',
      'hoodie': '🧥',
      'tank-top': '🎽',
      'pillow': '🛏️',
      'poster': '🖼️',
      'mug': '☕',
      'tote-bag': '🛍️',
      'sticker': '🏷️',
      'womens-tee': '👚',
      'heavy-cotton-tee': '👕',
      'infant-tee': '👶',
      'ultra-cotton-tee': '👕',
      'ultra-cotton-alt': '👕'
    };
    return icons[productType] || '👕';
  }
  
  getProductTypeName(productType) {
    // Try to find the product type in our dynamically loaded product data
    if (this.availableProducts && this.availableProducts.length > 0) {
      // Look for a product with matching blueprint ID from validated-XX format
      if (productType.startsWith && productType.startsWith('validated-')) {
        const blueprintId = parseInt(productType.replace('validated-', ''));
        const matchingProduct = this.availableProducts.find(p => p.blueprintId === blueprintId);
        if (matchingProduct && matchingProduct.name) {
          console.log('🎯 Found dynamic product name:', matchingProduct.name, 'for blueprint', blueprintId);
          return matchingProduct.name;
        }
      }
      
      // Look for direct productType match
      const matchingProduct = this.availableProducts.find(p => p.productType === productType || p.category === productType);
      if (matchingProduct && matchingProduct.name) {
        console.log('🎯 Found dynamic product name:', matchingProduct.name, 'for type', productType);
        return matchingProduct.name;
      }
    }
    
    // Fallback to minimal hardcoded mapping for common cases
    const fallbackNames = {
      'coffee-mug': 'Coffee Mug',
      't-shirt': 'T-Shirt',
      'hoodie': 'Hoodie',
      'mug': 'Mug'
    };
    
    const fallbackName = fallbackNames[productType];
    if (fallbackName) {
      console.log('🔄 Using fallback name:', fallbackName, 'for type', productType);
      return fallbackName;
    }
    
    console.log('⚠️ No name found for product type:', productType, '- using formatted version');
    // Last resort: format the productType string nicely
    return productType ? productType.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Custom Product';
  }
  
  getProductDetails(product) {
    const details = [];
    
    // Default size (we don't store this currently, so show most common)
    details.push(`<span class="detail-item"><strong>Size:</strong> M</span>`);
    
    // Border style (simplified - we don't store this currently)
    details.push(`<span class="detail-item"><strong>Border:</strong> Medium Black</span>`);
    
    // Price range from variants
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price / 100);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        details.push(`<span class="detail-item"><strong>Price:</strong> $${minPrice.toFixed(2)}</span>`);
      } else {
        details.push(`<span class="detail-item"><strong>Price:</strong> $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}</span>`);
      }
    }
    
    return details.join('');
  }
  
  getVariantPriceRange(variants) {
    if (!variants || variants.length === 0) {
      return 'Price TBD';
    }
    
    const prices = variants.map(v => v.price / 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`;
    } else {
      return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
  }
  
  previewProduct(productId) {
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (!product) {
      this.showError('Product not found');
      return;
    }
    
    this.showProductPreviewModal(product);
  }
  
  showVariantsModal(productId) {
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (!product) {
      this.showError('Product not found');
      return;
    }
    
    // Generate better title using our function
    const enhancedTitle = this.generateProductTitle(product, this.selectedImage);
    
    const hasVariants = product.variants && product.variants.length > 0;
    const hasImages = product.images && product.images.length > 0;
    const previewImage = (hasImages && product.images.length > 0) 
      ? product.images[0].src 
      : (product.sourceImage?.url || '');
    
    const modal = document.createElement('div');
    modal.className = 'modal variants-modal';
    modal.innerHTML = `
      <div class="modal-content preview-modal-content">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>� ${enhancedTitle}</h2>
        
        <div class="preview-layout">
          <div class="preview-gallery">
            <div class="main-preview">
              <img id="mainPreviewImage" src="${previewImage}" alt="${enhancedTitle}" />
            </div>
            ${hasImages ? `
              <div class="preview-thumbnails">
                ${product.images.map((img, index) => `
                  <img class="preview-thumb ${index === 0 ? 'active' : ''}" 
                       src="${img.src}" 
                       onclick="this.closest('.modal').querySelector('#mainPreviewImage').src = this.src; 
                                this.closest('.preview-thumbnails').querySelectorAll('.preview-thumb').forEach(t => t.classList.remove('active')); 
                                this.classList.add('active');" />
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="variant-selector">
            <div class="product-actions-bar">
              <button class="btn-secondary edit-product-btn" 
                      data-product-id="${productId}"
                      onclick="this.closest('.modal').remove(); merchandiseStore.startNewDesign();">
                <span>🎨</span> Edit Design
              </button>
            </div>

            ${hasVariants ? `
              <h3>Choose Your Style & Size</h3>
              <div class="variants-grid">
                ${product.variants.map((variant, variantIndex) => {
                  return `
                    <div class="variant-card" data-variant-id="${variant.id}">
                      <div class="variant-preview">
                        <img src="${previewImage}" alt="${variant.title}" 
                             onclick="document.getElementById('mainPreviewImage').src = this.src" 
                             style="cursor: pointer;" 
                             title="Click to view larger" />
                      </div>
                      <div class="variant-info">
                        <h4>${variant.title}</h4>
                        <p class="variant-price">$${(variant.price / 100).toFixed(2)}</p>
                        <button class="select-variant-btn" 
                                data-product-id="${productId}" 
                                data-variant-id="${variant.id}"
                                onclick="merchandiseStore.addToCart('${productId}', '${variant.id}'); this.closest('.modal').remove();">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="no-variants-message">
                <h3>🚧 Product Setup In Progress</h3>
                <p>This product is still being processed. Variants and detailed previews will be available soon!</p>
                <p class="product-info">You can still edit this product to make changes to the design.</p>
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                  Close Preview
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
  }
  
  showProductPreviewModal(product) {
    const hasVariants = product.variants && product.variants.length > 0;
    const hasImages = product.images && product.images.length > 0;
    // FIX: Ensure preview uses the correct product's image
    const previewImage = (hasImages && product.images.length > 0) 
      ? product.images[0].src 
      : (product.sourceImage?.url || '');
    
    // Helper function to get variant-specific image
    const getVariantImage = (variant, variantIndex) => {
      // Try to find variant-specific image by matching variant index to image index
      if (hasImages && product.images.length > 1) {
        // If we have multiple images, try to match them to variants
        const imageIndex = Math.min(variantIndex, product.images.length - 1);
        return product.images[imageIndex]?.src || previewImage;
      }
      // Fallback to main preview image
      return previewImage;
    };
    
    // Generate a better title
    const enhancedTitle = this.generateProductTitle(product, this.selectedImage);
    
    const modal = document.createElement('div');
    modal.className = 'modal product-preview-modal';
    modal.innerHTML = `
      <div class="modal-content preview-modal-content">
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
        <h2>🎨 ${enhancedTitle}</h2>
        
        <div class="preview-layout">
          <div class="preview-gallery">
            <div class="main-preview">
              <img id="mainPreviewImage" src="${previewImage}" alt="${product.title}" />
            </div>
            ${hasImages ? `
              <div class="preview-thumbnails">
                ${product.images.map((img, index) => `
                  <img class="preview-thumb ${index === 0 ? 'active' : ''}" 
                       src="${img.src}" 
                       onclick="this.closest('.modal').querySelector('#mainPreviewImage').src = this.src; 
                                this.closest('.preview-thumbnails').querySelectorAll('.preview-thumb').forEach(t => t.classList.remove('active')); 
                                this.classList.add('active');" />
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="variant-selector">
            <div class="product-actions-bar">
              <button class="btn-secondary edit-product-btn" 
                      data-product-id="${product.id || product.productId}"
                      onclick="this.closest('.modal').remove(); merchandiseStore.startNewDesign();">
                <span>🎨</span> Edit Design
              </button>
            </div>

            ${hasVariants ? `
              <h3>Choose Your Style & Size</h3>
              <div class="variants-grid">
                ${product.variants.map((variant, variantIndex) => {
                  const variantImage = getVariantImage(variant, variantIndex);
                  return `
                    <div class="variant-card" data-variant-id="${variant.id}">
                      <div class="variant-preview">
                        <img src="${variantImage}" alt="${variant.title}" 
                             onclick="document.getElementById('mainPreviewImage').src = this.src" 
                             style="cursor: pointer;" 
                             title="Click to view larger" />
                      </div>
                      <div class="variant-info">
                        <h4>${variant.title}</h4>
                        <p class="variant-price">$${(variant.price / 100).toFixed(2)}</p>
                        <button class="select-variant-btn" 
                                data-product-id="${product.id || product.productId}" 
                                data-variant-id="${variant.id}">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="no-variants-message">
                <h3>🚧 Product Setup In Progress</h3>
                <p>This product is still being processed. Variants and detailed previews will be available soon!</p>
                <p class="product-info">You can still edit this product to make changes to the design.</p>
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                  Close Preview
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Setup variant selection if variants exist
    if (hasVariants) {
      modal.querySelectorAll('.select-variant-btn').forEach(btn => {
        btn.onclick = (e) => {
          const productId = e.target.dataset.productId;
          const variantId = e.target.dataset.variantId;
          this.addToCart(productId, variantId);
          modal.remove();
        };
      });
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
        // Title and description will be auto-generated on server
        tags: formData.get('product-tags') ? formData.get('product-tags').split(',').map(tag => tag.trim()) : []
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
  
  /**
   * Ensure loading modal exists in DOM before trying to use it
   */
  ensureLoadingModalExists() {
    // Remove any existing loading modals first to prevent duplicates
    document.querySelectorAll('#loading-modal').forEach(el => el.remove());
    
    const modalHTML = `
      <div id="loading-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;">
        <div class="modal-content loading-modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; text-align: center; min-width: 300px;">
          <div class="loading-header">
            <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <h3 id="loading-title">Processing Your Request</h3>
          </div>
          <p id="loading-message">Loading...</p>
          <div class="progress-bar-container" style="margin: 15px 0;">
            <div class="progress-bar" id="loading-progress-bar" style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
              <div class="progress-bar-fill" id="loading-progress-fill" style="height: 100%; background: #007bff; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <span class="progress-text" id="loading-progress-text">0%</span>
          </div>
          <div class="loading-note">
            <small>This may take a moment while we process your request.</small>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('📱 Loading modal created (duplicates removed)');
  }
  
  setLoading(isLoading, message = 'Loading...', progress = null) {
    this.isLoading = isLoading;
    
    // Don't show loading modal during initial page load
    if (this.isInitializing && isLoading) {
      console.log('🔄 Skipping loading modal during initialization:', message);
      return;
    }
    
    if (isLoading) {
      // Only create modal when needed
      this.ensureLoadingModalExists();
    }
    
    // Force a small delay to ensure DOM is ready
    setTimeout(() => {
      const modal = document.getElementById('loading-modal');
      const messageEl = document.getElementById('loading-message');
      const progressFill = document.getElementById('loading-progress-fill');
      const progressText = document.getElementById('loading-progress-text');
      
      if (!modal) {
        console.warn('⚠️ Loading modal not available');
        return;
      }
      
      if (isLoading) {
        if (messageEl) messageEl.textContent = message;
        
        if (progress !== null && progressFill && progressText) {
          progressFill.style.width = `${progress}%`;
          progressText.textContent = `${Math.round(progress)}%`;
        }
        
        modal.style.display = 'block';
      } else {
        modal.style.display = 'none';
        if (progressFill && progressText) {
          progressFill.style.width = '0%';
          progressText.textContent = '0%';
        }
      }
    }, 10);
  }
  

  
  showSuccess(message) {
    // Implement success notification
    console.log('✅', message);
    // Always show success messages regardless of initialization state
    this.showToast(message, 'success');
  }
  
  showError(message) {
    // Implement error notification
    console.error('❌', message);
    this.showToast(message, 'error');
  }
  
  showToast(message, type = 'info') {
    try {
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
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    } catch (error) {
      console.error('Error showing toast:', error);
      // Fallback to alert if toast fails
      alert(`${type.toUpperCase()}: ${message}`);
    }
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
    
    // For test scenarios, if we have a simple imageId that matches our mock image
    if (this.galleryImages.length === 1 && this.galleryImages[0].id === imageId) {
      this.selectedImage = imageId;
      console.log('🧪 Test mode: Image pre-selected successfully');
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
      
      // Product navigator will be initialized after render in the main init() function
      
      // Update the UI to show the selection - with longer delay for rendering
      setTimeout(() => {
        // Try multiple selectors to find the image element
        let imageElement = document.querySelector(`.gallery-image-card[data-image-id="${image.id}"]`);
        
        if (!imageElement) {
          // Try with the filename instead
          const filename = image.id.split('/').pop();
          imageElement = document.querySelector(`.gallery-image-card[data-image-id*="${filename}"]`);
        }
        
        if (!imageElement) {
          // Try finding by image URL or any data attribute containing the filename
          const filename = image.id.split('/').pop();
          imageElement = document.querySelector(`[data-image-id="${filename}"], [data-id="${filename}"], img[src*="${filename}"]`);
        }
        
        if (imageElement) {
          // Remove previous selections
          document.querySelectorAll('.gallery-image-card.selected').forEach(el => {
            el.classList.remove('selected');
          });
          
          // Add selection to the preselected image
          imageElement.classList.add('selected');
          
          // Scroll to the selected image
          imageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          console.log('✅ Pre-selected image UI updated successfully');
        } else {
          console.warn('Pre-selected image element not found in DOM. Available elements:', 
            document.querySelectorAll('.gallery-image-card, [data-image-id], [data-id]').length);
          
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
      url.searchParams.delete('imageId');
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
            ${selectedImg.suitableForPrint ? 
              '<span class="print-ready">✅ Print Ready</span>' : 
              '<span class="enhancement-needed">🎨 Will be enhanced for printing</span>'
            }
          </p>
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
    // For development/localhost, we don't need a token since server handles auth
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'dev-bypass';
    }
    
    // Get authentication token from your auth system
    return localStorage.getItem('authToken') || '';
  }
  
  saveCartToStorage() {
    localStorage.setItem('merchandise-cart', JSON.stringify(this.cart));
  }
  
  loadCartFromStorage() {
    try {
      const saved = localStorage.getItem('merchandise-cart');
      if (saved) {
        this.cart = JSON.parse(saved);
        console.log(`🛍️ Loaded ${this.cart.length} items from cart storage`);
      } else {
        this.cart = [];
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.cart = [];
    }
  }
  
  // PHASE 2 REFACTOR: UI Renderer Event Handlers
  
  /**
   * Handle category selection from CategoryGridRenderer
   */
  handleCategorySelection(categoryId) {
    console.log('🎯 Category selected:', categoryId);
    // Filter products by category and re-render
    this.currentCategoryFilter = categoryId;
    this.render();
  }
  
  /**
   * Handle product search from CategoryGridRenderer  
   */
  handleProductSearch(searchTerm) {
    console.log('🔍 Product search:', searchTerm);
    this.currentSearchTerm = searchTerm;
    this.render();
  }
  
  /**
   * Handle filter changes from CategoryGridRenderer
   */
  handleFilterChange(filterType, filterValue) {
    console.log('🔧 Filter changed:', filterType, filterValue);
    this.currentFilters = this.currentFilters || {};
    this.currentFilters[filterType] = filterValue;
    this.render();
  }
  
  /**
   * Handle sort changes from CategoryGridRenderer
   */
  handleSortChange(sortBy) {
    console.log('📊 Sort changed:', sortBy);
    this.currentSort = sortBy;
    this.render();
  }
  
  /**
   * Handle view changes from CategoryGridRenderer
   */
  handleViewChange(viewType) {
    console.log('👁️ View changed:', viewType);
    this.currentViewType = viewType;
    // Update UI classes without full re-render
    const grid = document.querySelector('.product-grid');
    if (grid) {
      grid.dataset.view = viewType;
    }
  }
  
  /**
   * Show product preview modal using ModalRenderer
   */
  showProductPreview(productId) {
    console.log('👁️ Show product preview:', productId);
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (product) {
      const modalHtml = this.modalRenderer.renderPreviewModal(product);
      this.modalRenderer.showModal(modalHtml);
    }
  }
  
  /**
   * Show customization modal using ModalRenderer
   */
  showCustomizationModal(productId) {
    console.log('🎨 Show customization modal:', productId);
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (product) {
      const modalHtml = this.modalRenderer.renderCustomizationModal(product);
      this.modalRenderer.showModal(modalHtml);
    }
  }

  /**
   * Show customization modal for new blueprint selection (not an existing product)
   */
  showCustomizationModalForBlueprint(productConfig, blueprintId, providerId) {
    console.log('🎨 Show customization modal for blueprint:', blueprintId, providerId, productConfig);

    // Get the currently selected image for preview
    let previewImageUrl = '/images/previews/generic-product-preview.svg';
    if (this.selectedImage) {
      const imageData = this.galleryImages.find(img => img.id === this.selectedImage);
      if (imageData && imageData.url) {
        previewImageUrl = imageData.url;
      }
    }

    // Create a temporary product object for the modal renderer
    const product = {
      id: productConfig.id,
      productId: productConfig.id,
      productType: productConfig.id, // CRITICAL: Must be set for API calls
      type: productConfig.id, // Also set as type for fallback matching
      category: productConfig.category, // Set category from config
      title: productConfig.name,
      name: productConfig.name,
      blueprintId: blueprintId,
      printProviderId: providerId,
      price: productConfig.basePrice / 100, // Convert cents to dollars
      basePrice: productConfig.basePrice,
      image: previewImageUrl,
      previewImage: previewImageUrl,
      sourceImage: this.selectedImage ? { id: this.selectedImage } : null,
      variants: {},
      customization: {
        colorEffects: [],
        atmosphericEffects: [],
        borderStyle: 'none',
        borderColor: '#000000',
        borderWidth: 0
      }
    };

    console.log('📦 Created temporary product object:', product);

    // Render and show the customization modal
    const modalHtml = this.modalRenderer.renderCustomizationModal(product);
    this.modalRenderer.showModal(modalHtml);
  }

  /**
   * Handle add to cart from ProductCardRenderer or Customization Modal
   * @param {string} productId - Product ID
   * @param {Object} customization - Optional customization data (effects, borders, size, etc.)
   * @param {number} quantity - Quantity to add (default 1)
   */
  handleAddToCart(productId, customization = null, quantity = 1) {
    console.log('🛒 Add to cart:', productId);
    console.log('🎨 Customization:', customization);
    console.log('📦 Quantity:', quantity);

    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (product && this.validationService.isProductComplete(product)) {
      // Use customized image if available, otherwise use default preview
      const imageUrl = customization?.customizedImageUrl || product.previewImage;

      const cartItem = {
        productId: productId,
        variantId: 'default',
        title: product.title,
        price: product.price || 19.95,
        image: imageUrl,
        quantity: quantity || 1
      };

      // Add customization data to cart item if provided
      if (customization) {
        cartItem.customization = {
          effects: customization.effects || {},
          borderEnabled: customization.borderEnabled || false,
          borderWidth: customization.borderWidth || 0,
          borderWidthPixels: customization.borderWidthPixels || 0,
          borderColor: customization.borderColor || '#000000',
          size: customization.size,
          customizedImageUrl: customization.customizedImageUrl,
          timestamp: customization.timestamp
        };
        console.log('💾 Saving customization with cart item:', cartItem.customization);
      }

      this.cartService.addItem(cartItem);
      this.showSuccess(`Product added to cart! (Qty: ${quantity})`);
    } else {
      this.showError('Product needs to be completed before adding to cart');
    }
  }
  
  /**
   * Handle cart quantity changes from CartRenderer
   */
  handleCartQuantityChange(productId, variantId, quantity) {
    console.log('📝 Cart quantity change:', productId, variantId, quantity);
    if (quantity <= 0) {
      this.cartService.removeItem(productId, variantId);
    } else {
      this.cartService.updateQuantity(productId, variantId, quantity);
    }
    this.render(); // Re-render to update cart display
  }
  
  /**
   * Handle cart item removal from CartRenderer
   */
  handleCartItemRemoval(productId, variantId) {
    console.log('🗑️ Remove cart item:', productId, variantId);
    this.cartService.removeItem(productId, variantId);
    this.render(); // Re-render to update cart display
  }
  
  /**
   * Handle cart clear from CartRenderer  
   */
  handleCartClear() {
    console.log('🧹 Clear cart');
    this.cartService.clear();
    this.render(); // Re-render to update cart display
  }
  
  /**
   * Handle checkout from CartRenderer
   */
  handleCheckout() {
    console.log('💳 Handle checkout');
    const cartSummary = this.cartService.getSummary();
    if (!cartSummary.isEmpty) {
      const modalHtml = this.modalRenderer.renderCartModal(cartSummary);
      this.modalRenderer.showModal(modalHtml);
    }
  }
  
  /**
   * Handle customization save from ModalRenderer
   */
  handleCustomizationSave(productId, customization) {
    console.log('💾 Save customization:', productId, customization);
    // Update product with customization
    const product = this.products.find(p => (p.id || p.productId) === productId);
    if (product) {
      product.customization = customization;
      this.showSuccess('Customization saved!');
      this.render();
    }
  }

  /**
   * Generate Printify mockup for customized product
   * Calls API to create product with customized image
   * @param {Object} product - Product object with customization data
   * @param {Object} customization - Customization data with customizedImageUrl
   */
  async generatePrintifyMockup(product, customization) {
    console.log('\n' + '�'.repeat(60));
    console.log('🔥 DIAGNOSTIC: generatePrintifyMockup called');
    console.log('🔥'.repeat(60));

    try {
      // Comprehensive product object validation
      console.log('🔍 DIAGNOSTIC: Product object validation');
      console.log('   product exists:', !!product);
      console.log('   product type:', typeof product);
      if (product) {
        console.log('   product keys:', Object.keys(product));
        console.log('   product.id:', product.id);
        console.log('   product.productType:', product.productType);
        console.log('   product.type:', product.type);
        console.log('   product.title:', product.title);
        console.log('   product.blueprintId:', product.blueprintId);
        console.log('   product.printProviderId:', product.printProviderId);
        console.log('   product.category:', product.category);
      }

      // Comprehensive customization validation
      console.log('🔍 DIAGNOSTIC: Customization object validation');
      console.log('   customization exists:', !!customization);
      console.log('   customization type:', typeof customization);
      if (customization) {
        console.log('   customization keys:', Object.keys(customization));
        console.log('   customizedImageUrl:', customization.customizedImageUrl);
        console.log('   effects:', customization.effects);
        console.log('   borderEnabled:', customization.borderEnabled);
        console.log('   borderColor:', customization.borderColor);
      }

      // 🚨 STRICT VALIDATION - NO FALLBACKS
      if (!product) {
        const error = '❌ FATAL ERROR: product parameter is null/undefined';
        console.error(error);
        throw new Error(error);
      }

      if (!product.productType) {
        const error = `❌ FATAL ERROR: product.productType is missing. Product object: ${JSON.stringify(product, null, 2)}`;
        console.error(error);
        console.error('   🎯 This indicates modal handler did not set productType correctly');
        throw new Error(error);
      }

      // Validate productType format
      if (!product.productType.startsWith('validated-')) {
        const error = `❌ FATAL ERROR: product.productType '${product.productType}' is not from validated catalog`;
        console.error(error);
        console.error('   🎯 productType must start with "validated-" to be from validated catalog');
        throw new Error(error);
      }

      if (!customization) {
        const error = '❌ FATAL ERROR: customization parameter is null/undefined';
        console.error(error);
        throw new Error(error);
      }

      if (!customization.customizedImageUrl) {
        const error = '❌ FATAL ERROR: customization.customizedImageUrl is missing';
        console.error(error);
        console.error('   🎯 This indicates image effects processing failed');
        throw new Error(error);
      }

      if (!product.blueprintId || !product.printProviderId) {
        const error = `❌ FATAL ERROR: Missing blueprint/provider IDs. blueprintId: ${product.blueprintId}, printProviderId: ${product.printProviderId}`;
        console.error(error);
        console.error('   🎯 This indicates product object was not properly constructed from validated catalog');
        throw new Error(error);
      }

      console.log('✅ DIAGNOSTIC: All validations passed');

      // Prepare API payload with comprehensive validation
      console.log('🔍 DIAGNOSTIC: Preparing API request payload');
      
      const requestPayload = {
        imageId: product.id || 'custom-product',
        imageUrl: customization.customizedImageUrl,
        imageTitle: product.title,
        productType: product.productType, // Must be validated product type ID
        blueprintId: product.blueprintId, // Must match productType config
        printProviderId: product.printProviderId, // Must match productType config
        imageContext: {
          effects: customization.effects,
          borderEnabled: customization.borderEnabled,
          borderColor: customization.borderColor
        }
      };

      console.log('� DIAGNOSTIC: API payload details');
      console.log('   imageId:', requestPayload.imageId);
      console.log('   imageUrl (first 100 chars):', requestPayload.imageUrl.substring(0, 100) + '...');
      console.log('   imageTitle:', requestPayload.imageTitle);
      console.log('   productType:', requestPayload.productType);
      console.log('   blueprintId:', requestPayload.blueprintId);
      console.log('   printProviderId:', requestPayload.printProviderId);
      console.log('   imageContext:', requestPayload.imageContext);

      // Final validation of payload
      if (!requestPayload.productType.startsWith('validated-')) {
        const error = `❌ FATAL ERROR: About to send invalid productType '${requestPayload.productType}' to API`;
        console.error(error);
        throw new Error(error);
      }

      console.log('📤 DIAGNOSTIC: Sending API request to /api/merchandise/create-guided-product');

      const response = await fetch('/api/merchandise/create-guided-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('✅ Printify API response status:', response.status);

      if (!response.ok) {
        // Capture error response body for debugging
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('❌ Printify API Error Response Body:', errorBody);
        } catch (e) {
          console.error('❌ Could not read error response body:', e.message);
        }
        throw new Error(`Printify API error: ${response.statusText} (${response.status}). Response: ${errorBody}`);
      }

      const result = await response.json();
      console.log('🎉 Product created successfully:', result);

      if (result.success && result.product) {
        // Store the created product
        if (!this.customizedProducts) {
          this.customizedProducts = [];
        }
        this.customizedProducts.push(result.product);

        // Update current product with Printify details
        this.currentCustomizedProduct = {
          ...product,
          ...result.product,
          customization: customization,
          generatedAt: new Date().toISOString()
        };

        console.log('✅ Customized product stored:', this.currentCustomizedProduct);

        // Show success message
        this.showSuccess(`✨ Product mockup generated! Check it out below.`);
      } else {
        throw new Error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('❌ Error generating Printify mockup:', error);
      console.error('Error details:', error.message);

      this.showError(`Failed to generate mockup: ${error.message}`);

      // Fallback: Still try to display product with custom image
      console.log('📌 Fallback: Using customized image preview');
    }
  }

  /**
   * Handle transition to product options page after preview
   * Closes customization modals and shows product options for size/quantity/variants
   * @param {string} productId - Product ID (may be blueprint product ID)
   * @param {string} productType - Product type (t-shirt, hoodie, etc.) - REQUIRED
   * @param {Object} customization - Customization data with effects, borders, and customizedImageUrl
   */
  async handleGoToProductOptions(productId, productType, customization, blueprintId, printProviderId) {
    console.log('🎯 Going to product options:', productId);
    console.log('🎯 Product Type:', productType);
    console.log('🎯 Blueprint ID:', blueprintId);
    console.log('🎯 Print Provider ID:', printProviderId);
    console.log('🎨 Customization:', customization);

    // CRITICAL VALIDATION: productType must be present
    if (!productType) {
      throw new Error('❌ CRITICAL: productType is required to proceed with Printify integration. Got: ' + productType);
    }

    // Try to find the product in the products array
    // If it's a blueprint product (format: categoryId-blueprintId), it won't be in the array
    let product = this.products.find(p => (p.id || p.productId) === productId);

    if (!product) {
      console.log('⚠️ Product not in array, likely a blueprint product. Creating temp product object.');

      // For blueprint products, we still have the customization data
      // Create a temporary product object that we can work with
      // The actual product will be created when user adds to cart
      product = {
        id: productId,
        productId: productId,
        productType: productType, // CRITICAL: Include product type
        blueprintId: blueprintId, // 🔥 CRITICAL: Include actual blueprint ID
        printProviderId: printProviderId, // 🔥 CRITICAL: Include actual provider ID
        title: `Custom Product ${productId}`,
        previewImage: customization.customizedImageUrl || '/images/previews/generic-product-preview.svg',
        isCustomized: true,
        customization: customization
      };

      console.log('✅ Temporary product object created:', product);
    } else {
      // Store customization data on the existing product
      if (!product.customization) {
        product.customization = {};
      }
      product.customization = {
        ...product.customization,
        ...customization
      };
      console.log('💾 Customization stored on product');
    }

    // Store the product in a temporary location for the current session
    // This allows us to display it without modifying the main products array
    this.currentCustomizedProduct = product;

    // Generate Printify mockup image with customization (await for completion)
    await this.generatePrintifyMockup(product, customization);

    // Re-render to show product with customization data
    this.render();
  }

  /**
   * Handle modal close from ModalRenderer
   */
  handleModalClosed(modalId) {
    console.log('❌ Modal closed:', modalId);
    // Any cleanup needed when modals close
  }
  
  /**
   * Handle dialog confirmation from ModalRenderer
   */
  handleDialogConfirmed(modalId) {
    console.log('✅ Dialog confirmed:', modalId);
    // Handle confirmation actions
  }
  
  /**
   * Handle dialog cancellation from ModalRenderer
   */
  handleDialogCancelled(modalId) {
    console.log('❌ Dialog cancelled:', modalId);
    // Handle cancellation actions
  }

  /**
   * Start a new design process - return to gallery selection
   */
  startNewDesign() {
    console.log('🎨 Starting new design process...');
    
    // Clear current selection
    this.selectedImage = null;
    this.selectedCategory = null;
    this.selectedProduct = null;
    this.currentCustomizedProduct = null;
    
    // Show the merchandise creation interface by refreshing the page to starting state
    window.location.reload();
  }

  /**
   * Generate a meaningful product title based on image and product type
   * @param {Object} product - Product object
   * @param {Object} imageData - Image metadata
   * @returns {string} Enhanced product title
   */
  generateProductTitle(product, imageData = null) {
    try {
      let characterName = '';
      let episodeName = '';
      let loreName = '';
      let productTypeName = this.getProductTypeName(product.productType || 'unknown');

      // Try to extract character/episode/lore info from image data or title
      if (imageData && imageData.title) {
        const title = imageData.title.toLowerCase();
        
        // Check for character names
        if (title.includes('lucky') || title.includes('leprechaun')) {
          characterName = 'Lucky';
        } else if (title.includes('yeti')) {
          characterName = 'Yeti';
        } else if (title.includes('wavelength') || title.includes('band')) {
          characterName = 'Wavelength Band';
        } else if (title.includes('goblin')) {
          characterName = 'Goblin King';
        }

        // Check for episode references
        if (title.includes('lucky charm') || title.includes('episode 1')) {
          episodeName = 'My Lucky Charm';
        } else if (title.includes('back to the shire') || title.includes('episode 11')) {
          episodeName = 'Back to the Shire';
        } else if (title.includes('concert') || title.includes('encore')) {
          episodeName = 'Concert Episode';
        }

        // Check for lore references
        if (title.includes('shire')) {
          loreName = 'The Shire';
        } else if (title.includes('stage') || title.includes('concert venue')) {
          loreName = 'Concert Stage';
        }
      }

      // Also try to extract from product title if it contains metadata
      if (product.title && product.title !== 'Custom Product') {
        const title = product.title.toLowerCase();
        if (title.includes('lucky') && !characterName) characterName = 'Lucky';
        if (title.includes('yeti') && !characterName) characterName = 'Yeti';
        if (title.includes('wavelength') && !characterName) characterName = 'Wavelength Band';
      }

      // Build the title hierarchically
      let titleParts = [];
      
      if (characterName) {
        titleParts.push(characterName);
      }
      
      if (episodeName) {
        titleParts.push(episodeName);
      } else if (loreName) {
        titleParts.push(loreName);
      }

      if (titleParts.length > 0) {
        return `${titleParts.join(' - ')} ${productTypeName}`;
      } else {
        // Fallback to a more descriptive title
        return `Wavelength ${productTypeName}`;
      }

    } catch (error) {
      console.error('Error generating product title:', error);
      return product.title || 'Custom Product';
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

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseStore = MerchandiseStore;
}