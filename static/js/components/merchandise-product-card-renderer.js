/**
 * WAVELENGTH Product Card Renderer (FIXED - No Icons)
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
    const productTitle = this.generateEnhancedProductTitle(product);
    const productImage = this.getProductImage(product);
    const productType = this.getProductType(product);
    const productDetails = this.getProductDetails(product);
    const variantInfo = this.getVariantInfo(product);
    
    return `
      <div class="product-card complete-product" data-product-id="${productId}">
        <div class="product-type-header">
          <span class="product-type-name">${this.getProductTypeName(productType)}</span>
        </div>
        
        <div class="product-image gorgeous-mockup-container">
          <img src="${productImage}" 
               alt="${productTitle}" 
               loading="lazy" 
               class="gorgeous-mockup-image"
               style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          <div class="product-actions">
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
            ${this.renderInlineVariants(product)}
          </div>
          <div class="variant-status-display" id="variant-status-${productId}" style="display: none;">
            <small class="variant-status-message"></small>
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
    const status = this.validationService.getProductStatus(product);
    
    return `
      <div class="product-card incomplete-product" data-product-id="${productId}">
        <div class="product-type-header">
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
    const status = this.validationService.getProductStatus(product);
    
    return `
      <div class="product-card broken-product" data-product-id="${productId}">
        <div class="product-type-header">
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
   * Helper method to get product image URL with fallbacks
   * PRIORITIZES gorgeous Printify mockup images from enriched variants
   * @param {Object} product - Product object
   * @returns {string} Image URL
   */
  getProductImage(product) {
    // 🎨 PRIORITY 1: Beautiful Printify mockup from enriched variants
    if (product.variants && product.variants.length > 0) {
      const variantWithImage = product.variants.find(v => v.image && v.image.url);
      if (variantWithImage) {
        console.log(`🌟 [GORGEOUS MOCKUP] Using beautiful Printify mockup: ${variantWithImage.image.url.substring(0, 80)}...`);
        return variantWithImage.image.url;
      }
    }
    
    // PRIORITY 2: Basic Printify images array (fallback)
    if (product.images && product.images.length > 0) {
      return product.images[0].src || product.images[0].url;
    }
    
    // PRIORITY 3: Source image (original uploaded image)
    if (product.sourceImage && product.sourceImage.url) {
      return product.sourceImage.url;
    }
    
    // PRIORITY 4: Generic placeholder
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
   * Helper method to get product type name
   * @param {string} productType - Product type
   * @returns {string} Human-readable product type name
   */
  getProductTypeName(productType) {
    if (this.merchandiseStore && typeof this.merchandiseStore.getProductTypeName === 'function') {
      return this.merchandiseStore.getProductTypeName(productType);
    }
    
    // Try to find matching product in merchandise store catalog for dynamic typing
    if (this.merchandiseStore && this.merchandiseStore.availableProducts) {
      const matchingProduct = this.merchandiseStore.availableProducts.find(product => {
        const catalogProductType = this.merchandiseStore.extractProductTypeFromProduct(product);
        return catalogProductType === productType || 
               catalogProductType?.toLowerCase() === productType?.toLowerCase() ||
               product.title?.toLowerCase().includes(productType?.toLowerCase());
      });
      
      if (matchingProduct) {
        console.log('✅ Found product type in catalog:', matchingProduct.title);
        // Use the actual product title or derive a clean name
        const cleanTitle = matchingProduct.title
          .replace(/^(Wavelength\s+)?Lore\s*/i, '')
          .replace(/\s*-\s*.*$/, '') // Remove everything after dash
          .trim();
        if (cleanTitle && cleanTitle !== matchingProduct.title) {
          return cleanTitle;
        }
      }
    }
    
    // Dynamic type name generation based on patterns
    const dynamicTypeName = this.generateDynamicTypeName(productType);
    if (dynamicTypeName) {
      return dynamicTypeName;
    }
    
    // Fallback to formatted version
    if (productType) {
      return productType.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return 'Product';
  }
  
  /**
   * Generate dynamic type name based on product type patterns
   */
  generateDynamicTypeName(productType) {
    if (!productType) return null;
    
    const type = productType.toLowerCase();
    
    // Handle size variants
    if (type.includes('11oz')) return '11oz Mug';
    if (type.includes('15oz')) return '15oz Mug';
    if (type.includes('20oz')) return '20oz Mug';
    
    // Handle specific product patterns
    if (type === 'mug' || type.includes('coffee-mug')) return 'Coffee Mug';
    if (type === 'tshirt' || type === 't-shirt') return 'T-Shirt';
    if (type.includes('tank')) return 'Tank Top';
    if (type.includes('phone')) return 'Phone Case';
    if (type.includes('tote')) return 'Tote Bag';
    if (type.includes('throw') && type.includes('pillow')) return 'Throw Pillow';
    if (type === 'pillow') return 'Throw Pillow';
    if (type.includes('canvas')) return 'Canvas Print';
    if (type.includes('mouse')) return 'Mouse Pad';
    
    // Default: clean up the raw type
    return productType.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Helper method to get product details - STREAMLINED FOR SINGLE VARIANTS
   * @param {Object} product - Product object
   * @returns {string} Product details HTML
   */
  getProductDetails(product) {
    if (this.merchandiseStore && typeof this.merchandiseStore.getProductDetails === 'function') {
      return this.merchandiseStore.getProductDetails(product);
    }
    
    const variants = product.variants || [];
    
    // For single variants, don't duplicate size/price info here - it goes in the action section
    if (variants.length === 1) {
      const details = [];
      
      // Add product type context (non-variant specific details)
      const productType = this.getProductType(product);
      if (productType && productType.includes('mug')) {
        details.push(`<span class="detail-item"><strong>Material:</strong> Ceramic</span>`);
        details.push(`<span class="detail-item"><strong>Style:</strong> Classic</span>`);
      } else if (productType && productType.includes('shirt')) {
        details.push(`<span class="detail-item"><strong>Material:</strong> Premium Cotton</span>`);
        details.push(`<span class="detail-item"><strong>Fit:</strong> Regular</span>`);
      } else if (productType && productType.includes('tree') && productType.includes('skirt')) {
        details.push(`<span class="detail-item"><strong>Material:</strong> Premium Fabric</span>`);
        details.push(`<span class="detail-item"><strong>Style:</strong> Festive</span>`);
      }
      
      return details.length > 0 ? details.join('') : 'Premium custom merchandise';
    }
    
    // For multiple variants, show general details (not specific variant info)
    const details = [];
    
    // Add product type context
    const productType = this.getProductType(product);
    if (productType && productType.includes('mug')) {
      details.push(`<span class="detail-item"><strong>Material:</strong> Ceramic</span>`);
      details.push(`<span class="detail-item"><strong>Style:</strong> Classic</span>`);
    } else if (productType && productType.includes('shirt')) {
      details.push(`<span class="detail-item"><strong>Material:</strong> Premium Cotton</span>`);
      details.push(`<span class="detail-item"><strong>Fit:</strong> Regular</span>`);
    }
    
    // Add price range for multiple variants
    if (variants.length > 1) {
      const prices = variants.map(v => parseFloat(v.price) / 100);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
      details.push(`<span class="detail-item"><strong>Price Range:</strong> ${priceRange}</span>`);
    }
    
    return details.length > 0 ? details.join('') : 'Premium custom merchandise';
  }
  
  /**
   * Generate enhanced product title with character/episode/lore context
   * @param {Object} product - Product object
   * @returns {string} Enhanced product title
   */
  generateEnhancedProductTitle(product) {
    // Try to get context from the original image or product data
    const sourceImage = product.sourceImage || {};
    const imageName = sourceImage.name || sourceImage.filename || product.title || '';
    
    // Extract character/episode information from image name
    let characterName = '';
    let episodeName = '';
    let productType = this.getProductTypeName(this.getProductType(product));
    
    // Parse common patterns in image names
    if (imageName) {
      // Look for character names (common patterns)
      const characterPatterns = [
        /alice/i, /bob/i, /charlie/i, /diana/i, /eve/i, 
        /frank/i, /grace/i, /henry/i, /iris/i, /jack/i,
        /kate/i, /liam/i, /maya/i, /noah/i, /olivia/i,
        /parker/i, /quinn/i, /ruby/i, /sam/i, /tara/i
      ];
      
      for (const pattern of characterPatterns) {
        if (pattern.test(imageName)) {
          characterName = imageName.match(pattern)[0];
          characterName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
          break;
        }
      }
      
      // Look for episode patterns
      const episodeMatch = imageName.match(/episode[\s-_]*(\d+)/i) || 
                          imageName.match(/ep[\s-_]*(\d+)/i) ||
                          imageName.match(/chapter[\s-_]*(\d+)/i);
      if (episodeMatch) {
        episodeName = `Episode ${episodeMatch[1]}`;
      }
    }
    
    // Build enhanced title
    let title = '';
    if (characterName && episodeName) {
      title = `${characterName} ${episodeName} ${productType}`;
    } else if (characterName) {
      title = `${characterName} ${productType}`;
    } else if (episodeName) {
      title = `${episodeName} ${productType}`;
    } else {
      // Use actual Wavelength lore instead of generic fantasy words
      const wavelengthLore = this.selectWavelengthLore(product);
      title = `${wavelengthLore} ${productType}`;
    }
    
    return title;
  }

  /**
   * Select appropriate Wavelength lore element based on product context
   * @param {Object} product - Product object
   * @returns {string} Lore-based prefix for product title
   */
  selectWavelengthLore(product) {
    // Wavelength universe content - actual lore, not generic fantasy words
    const wavelengthLore = {
      characters: [
        { name: 'Lucky', location: 'Shire Sanctuary', keywords: ['lucky', 'leprechaun', 'charm', 'shire'] },
        { name: 'Yeti', location: 'Ice Fortress', keywords: ['yeti', 'ice', 'snow', 'cold', 'fortress'] },
        { name: 'Goblin King', location: 'Goblin Realm', keywords: ['goblin', 'king', 'realm', 'crown'] },
        { name: 'Wavelength Band', location: 'Concert Stage', keywords: ['band', 'concert', 'music', 'stage', 'wavelength'] }
      ],
      episodes: [
        { name: 'My Lucky Charm', keywords: ['my-lucky-charm', 'lucky-charm', 'charm', 'episode-1', 'episode 1'] },
        { name: 'Back to the Shire', keywords: ['back-to-the-shire', 'back-to-shire', 'shire', 'episode-11', 'episode 11'] },
        { name: 'Concert Encore', keywords: ['concert-encore', 'encore', 'concert', 'music', 'stage'] }
      ]
    };

    // Try to match product context to actual Wavelength content
    const sourceImage = product.sourceImage || {};
    const imageName = (sourceImage.name || sourceImage.filename || product.title || '').toLowerCase();
    
    // Look for episode matches first (more specific)
    for (const episode of wavelengthLore.episodes) {
      for (const keyword of episode.keywords) {
        if (imageName.includes(keyword)) {
          return episode.name;
        }
      }
    }
    
    // Look for character matches in image name/context
    for (const character of wavelengthLore.characters) {
      for (const keyword of character.keywords) {
        if (imageName.includes(keyword)) {
          return `${character.name}'s ${character.location}`;
        }
      }
    }
    
    // Intelligent fallback - rotate through characters instead of random fantasy
    // This ensures every product gets actual Wavelength lore, not meaningless words
    const productHash = this.generateProductHash(product);
    const characterIndex = productHash % wavelengthLore.characters.length;
    const selectedCharacter = wavelengthLore.characters[characterIndex];
    
    return `${selectedCharacter.name}'s ${selectedCharacter.location}`;
  }

  /**
   * Generate a consistent hash for a product to ensure stable character assignment
   * @param {Object} product - Product object
   * @returns {number} Hash value for consistent selection
   */
  generateProductHash(product) {
    const productString = JSON.stringify({
      id: product.id,
      title: product.title,
      productType: product.productType
    });
    
    // Simple hash function for consistent character selection
    let hash = 0;
    for (let i = 0; i < productString.length; i++) {
      const char = productString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
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
      // Convert prices from cents to dollars (divide by 100)
      const prices = variants.map(v => (parseFloat(v.price) || 0) / 100).filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        priceRange = min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
      }
    }
    
    return { count, priceRange };
  }
  
  /**
   * Render inline variants display within product card - OPTIMIZED FOR ALL SCENARIOS
   * @param {Object} product - Product object
   * @returns {string} HTML string for inline variants
   */
  renderInlineVariants(product) {
    const variants = product.variants || [];
    const productId = product.id || product.productId;
    
    if (variants.length === 0) {
      return '<p class="no-variants">No variants available</p>';
    }
    
    // SINGLE VARIANT: Streamlined display
    if (variants.length === 1) {
      const variant = variants[0];
      const sizeInfo = variant.title || 'Standard';
      const price = (variant.price / 100).toFixed(2);
      
      return `
        <div class="single-variant-action">
          <div class="variant-details">
            <div class="variant-specs">
              <span class="variant-size"><strong>Size:</strong> ${sizeInfo}</span>
              <span class="variant-price">$${price}</span>
            </div>
          </div>
          <button class="add-to-cart-btn primary" 
                  data-product-id="${productId}" 
                  data-variant-id="${variant.id}"
                  title="Add ${sizeInfo} to cart">
            🛒 Add to Cart
          </button>
        </div>
      `;
    }
    
    // ALL VARIANTS (2+): Use unified dropdown for all products
    const prices = variants.map(v => v.price / 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

    // 🔍 LOG: Rendering dropdown (6+ variants)
    const dropdownOptions = variants.map(variant => {
      const imageUrl = variant.image?.url || product.images?.[0]?.url || '';
      // Quieter logging - only log summary
      return `
        <option value="${variant.id}"
                data-price="${(variant.price / 100).toFixed(2)}"
                data-image-url="${imageUrl}">
          ${variant.title} - $${(variant.price / 100).toFixed(2)}
        </option>
      `;
    }).join('');

    const variantsWithImages = variants.filter(v => v.image?.url || product.images?.[0]?.url).length;
    console.log(`🎯 [DROPDOWN] Product ${productId}: ${variants.length} variants (${variantsWithImages} with images)`);

    return `
      <div class="variant-summary">
        <span class="variant-count">${variants.length} variants available</span>
        <span class="price-range">${priceRange}</span>
      </div>
      <div class="inline-variants many-variants">
        <h5>🎯 Choose Your Option (${variants.length} available):</h5>
        <div class="variant-selector-container">
          <div class="variant-selector-group">
            <select class="variant-selector" data-product-id="${productId}">
              <option value="">Select size & color...</option>
              ${dropdownOptions}
            </select>
            <div class="selected-variant-price" style="display: none;">
              <span class="price-label">Price:</span>
              <span class="price-value">$0.00</span>
            </div>
          </div>
          <button class="add-to-cart-btn primary unified-cart-btn" 
                  data-product-id="${productId}" 
                  data-variant-id=""
                  disabled
                  title="Select a variant first">
            🛒 Add Selected to Cart
          </button>
        </div>
        <div class="variant-selector-hint">
          <span class="hint-text">💡 Choose your preferred size and color combination above</span>
        </div>
      </div>
    `;
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
      
      // 🌟 Handle variant chip selection (switch gorgeous mockup image)
      if (e.target.closest('.variant-chip')) {
        const variantChip = e.target.closest('.variant-chip');
        const imageUrl = variantChip.dataset.imageUrl;
        this.handleVariantChipSelection(e.target, variantChip, imageUrl);
      }
      
      // Handle different button clicks
      if (e.target.closest('.edit-product-btn')) {
        this.handleEditProduct(productId);
      } else if (e.target.closest('.delete-product-btn')) {
        this.handleDeleteProduct(productId);
      } else if (e.target.closest('.add-to-cart-btn')) {
        const button = e.target.closest('.add-to-cart-btn');
        const variantId = button?.dataset.variantId || e.target.closest('[data-variant-id]')?.dataset.variantId;
        const variantImageUrl = button?.dataset.selectedVariantImage || '';  // Get image URL from button
        this.handleAddToCart(productId, variantId, variantImageUrl);
      } else if (e.target.closest('.refresh-status-btn')) {
        this.handleRefreshStatus(productId);
      } else if (e.target.closest('.retry-setup-btn')) {
        this.handleRetrySetup(productId);
      } else if (e.target.closest('.repair-product-btn')) {
        this.handleRepairProduct(productId);
      }
    });
    
    // Handle variant selector changes for multi-variant products
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        this.handleVariantSelection(e.target);
      }
    });
  }
  
  /**
   * Handle variant chip selection (update gorgeous mockup image)
   * @param {HTMLElement} clickedElement - The clicked element
   * @param {HTMLElement} variantChip - The variant chip container
   * @param {string} imageUrl - The variant's mockup image URL
   */
  handleVariantChipSelection(clickedElement, variantChip, imageUrl) {
    // Don't interfere if they clicked the cart button specifically
    if (clickedElement.classList.contains('add-to-cart-btn')) {
      return;
    }
    
    const productCard = variantChip.closest('.product-card');
    const productImage = productCard.querySelector('.gorgeous-mockup-image');
    
    // 🌟 UPDATE GORGEOUS MOCKUP IMAGE when variant chip is selected
    if (imageUrl && productImage) {
      console.log(`🎨 [GORGEOUS MOCKUP CHIP] Switching to variant image: ${imageUrl.substring(0, 80)}...`);
      productImage.src = imageUrl;
      
      // Add visual feedback - smooth transition
      productImage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      productImage.style.opacity = '0.8';
      productImage.style.transform = 'scale(0.98)';
      
      setTimeout(() => {
        productImage.style.opacity = '1';
        productImage.style.transform = 'scale(1)';
      }, 150);
    }
    
    // Highlight selected variant chip
    const allChips = productCard.querySelectorAll('.variant-chip');
    allChips.forEach(chip => chip.classList.remove('selected'));
    variantChip.classList.add('selected');
  }

  /**
   * Handle variant selection from dropdown
   * @param {HTMLSelectElement} selectElement - The variant selector element
   */
  handleVariantSelection(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const productId = selectElement.dataset.productId;
    const variantId = selectedOption.value;
    const price = selectedOption.dataset.price;
    const imageUrl = selectedOption.dataset.imageUrl;

    console.log(`\n🔄 [VARIANT-CHANGE] Product ${productId} variant selector changed`);
    console.log(`   ├─ Variant ID: ${variantId}`);
    console.log(`   ├─ Price: $${price || 'N/A'}`);
    console.log(`   └─ Image URL: ${imageUrl ? '✅ ' + imageUrl.substring(0, 60) + '...' : '❌ Missing'}`);

    // Find related elements in the same product card
    const productCard = selectElement.closest('.product-card');
    const cartButton = productCard.querySelector('.unified-cart-btn');
    const priceDisplay = productCard.querySelector('.selected-variant-price');
    const priceValue = productCard.querySelector('.price-value');
    const productImage = productCard.querySelector('.gorgeous-mockup-image');

    console.log(`   Elements found:`);
    console.log(`   ├─ Cart button: ${cartButton ? '✅' : '❌'}`);
    console.log(`   ├─ Price display: ${priceDisplay ? '✅' : '❌'}`);
    console.log(`   ├─ Product image: ${productImage ? '✅' : '❌'}`);

    // 🌟 UPDATE GORGEOUS MOCKUP IMAGE when variant changes
    if (imageUrl && productImage) {
      console.log(`   🎨 Updating mockup image...`);
      console.log(`      Current src: ${productImage.src.substring(0, 60)}...`);
      productImage.src = imageUrl;
      console.log(`      New src: ${imageUrl.substring(0, 60)}...`);

      // Add a subtle animation effect
      productImage.style.transition = 'opacity 0.3s ease';
      productImage.style.opacity = '0.7';
      setTimeout(() => {
        productImage.style.opacity = '1';
        console.log(`      ✅ Fade animation complete`);
      }, 150);
    } else {
      console.log(`   ⚠️ Cannot update image:`);
      if (!imageUrl) console.log(`      - No image URL provided`);
      if (!productImage) console.log(`      - Product image element not found`);
    }

    // Show variant status message
    this.showVariantStatus(productCard, imageUrl ? null : `⚠️ No preview available for ${selectedOption.textContent.split(' - ')[0]}`);
    
    if (variantId && cartButton) {
      // Enable cart button and update variant ID + IMAGE URL
      cartButton.disabled = false;
      cartButton.dataset.variantId = variantId;
      cartButton.dataset.variantImageUrl = imageUrl || '';  // ← Store the variant's image URL
      cartButton.title = `Add ${selectedOption.textContent.split(' - ')[0]} to cart`;
      cartButton.textContent = '🛒 Add Selected to Cart';

      // Store variant image on cart button for cart service to retrieve
      cartButton.dataset.selectedVariantImage = imageUrl || '';

      console.log(`   ✅ Cart button updated:`);
      console.log(`      ├─ variantId: ${variantId}`);
      console.log(`      ├─ imageUrl: ${imageUrl ? '✅' : '❌'}`);
      console.log(`      └─ data-selectedVariantImage set for cart service`);

      // Show and update price display
      if (priceDisplay && priceValue && price) {
        priceDisplay.style.display = 'block';
        priceValue.textContent = `$${price}`;
      }
    } else {
      // Disable cart button when no selection
      if (cartButton) {
        cartButton.disabled = true;
        cartButton.dataset.variantId = '';
        cartButton.dataset.variantImageUrl = '';  // Clear image URL
        cartButton.dataset.selectedVariantImage = '';  // Clear variant image
        cartButton.title = 'Select a variant first';
        cartButton.textContent = '🛒 Add Selected to Cart';
      }

      // Hide price display
      if (priceDisplay) {
        priceDisplay.style.display = 'none';
      }
    }
  }
  
  /**
   * Handle edit product action
   * @param {string} productId - Product ID
   */
  handleEditProduct(productId) {
    // First try to find the MerchandiseStore instance
    if (window.merchandiseStore && window.merchandiseStore.editProduct) {
      window.merchandiseStore.editProduct(productId);
    } else if (this.eventBus) {
      // Fallback to event bus if store not available
      this.eventBus.emit('product.edit', { productId });
    } else {
      // Final fallback - emit a custom customize event
      this.eventBus?.emit('product.customize', { productId });
      console.warn('Edit product functionality not fully connected:', productId);
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

  /**
   * Handle add to cart action
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {string} variantImageUrl - Optional variant image URL for cart display
   */
  handleAddToCart(productId, variantId, variantImageUrl = '') {
    if (this.eventBus) {
      this.eventBus.emit('cart.addItem', { productId, variantId, variantImageUrl });
    }
  }

  /**
   * Show or hide variant status message
   * @param {HTMLElement} productCard - Product card element
   * @param {string|null} message - Status message to show, or null to hide
   */
  showVariantStatus(productCard, message) {
    const productId = productCard.dataset.productId;
    const statusDisplay = productCard.querySelector('.variant-status-display');
    const statusMessage = productCard.querySelector('.variant-status-message');
    
    if (!statusDisplay || !statusMessage) {
      console.warn(`❌ Variant status elements not found for product ${productId}`);
      return;
    }
    
    if (message) {
      statusMessage.textContent = message;
      statusMessage.style.color = '#ff6b6b';
      statusMessage.style.fontWeight = 'bold';
      statusDisplay.style.display = 'block';
      statusDisplay.style.marginTop = '8px';
      statusDisplay.style.padding = '8px 12px';
      statusDisplay.style.background = '#fff5f5';
      statusDisplay.style.border = '1px solid #ffb3b3';
      statusDisplay.style.borderRadius = '6px';
      statusDisplay.style.fontSize = '0.85rem';
      console.log(`📝 Variant status shown: "${message}"`);
    } else {
      statusDisplay.style.display = 'none';
      console.log(`📝 Variant status hidden`);
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
  console.log('✅ MerchandiseProductCardRenderer exported to window object');
}