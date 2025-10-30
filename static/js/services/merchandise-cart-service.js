/**
 * WAVELENGTH Merchandise Cart Service
 * 
 * Handles all shopping cart operations including:
 * - Adding/removing items
 * - Quantity management
 * - Total calculations
 * - Storage persistence
 */

class MerchandiseCartService {
  constructor() {
    this.items = [];
    this.eventBus = null; // Will be injected
    this.debugMode = false; // Quiet by default - set to true for debugging
    
    console.log('🛒 CART DIAGNOSTICS: MerchandiseCartService initializing...');
    this.loadFromStorage();
    console.log(`🛒 CART DIAGNOSTICS: Initialized with ${this.items.length} items from storage`);
  }
  
  /**
   * Set event bus for publishing cart events
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
    if (this.debugMode) {
      console.log('🛒 CART DIAGNOSTICS: Event bus connected', eventBus ? '✅' : '❌');
    }
  }
  
  /**
   * Add item to cart
   * @param {Object} product - Product object
   * @param {string} variantId - Variant ID
   * @param {number} quantity - Quantity to add
   * @returns {Object} Result with success status and message
   */
  addItem(product, variantId, quantity = 1) {
    if (this.debugMode) {
      console.group('🛒 CART DIAGNOSTICS: Adding item to cart');
      console.log('Product:', product);
      console.log('Variant ID:', variantId);
      console.log('Quantity:', quantity);
      console.log('Current cart items:', this.items.length);
    }
    
    try {
      if (!product || !product.id) {
        throw new Error('Invalid product - missing product or product.id');
      }
      
      if (!variantId) {
        throw new Error('Variant ID is required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const productId = product.id || product.productId;
      const existingItemIndex = this.items.findIndex(
        item => (item.productId === productId || item.id === productId) && 
                item.variantId === variantId
      );
      
      if (this.debugMode) {
        console.log(`🔍 Checking for existing item: productId=${productId}, variantId=${variantId}`);
        console.log(`Found existing item at index: ${existingItemIndex}`);
      }
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const oldQuantity = this.items[existingItemIndex].quantity;
        this.items[existingItemIndex].quantity += quantity;
        const newQuantity = this.items[existingItemIndex].quantity;
        
        if (this.debugMode) {
          console.log(`✅ Updated existing item quantity: ${oldQuantity} → ${newQuantity}`);
        }
      } else {
        // Add new item
        const extractedPrice = this.extractPrice(product, variantId);
        const extractedImage = this.extractImage(product, variantId);

        const cartItem = {
          id: productId,
          productId: productId,
          variantId: variantId,
          quantity: quantity,
          title: product.title || 'Untitled Product',
          price: extractedPrice,
          image: extractedImage,
          dateAdded: new Date().toISOString()
        };
        
        if (this.debugMode) {
          console.log('📦 Creating new cart item:', cartItem);
          console.log('💰 Extracted price:', extractedPrice);
          console.log('🖼️ Extracted image:', extractedImage);
        }
        
        this.items.push(cartItem);
        
        if (this.debugMode) {
          console.log(`✅ Added new item to cart: ${cartItem.title}`);
        }
      }
      
      this.saveToStorage();
      
      const eventData = { items: this.items, action: 'add', productId, variantId, quantity };
      this.publishEvent('cart.updated', eventData);
      
      const result = {
        success: true,
        message: 'Item added to cart successfully',
        itemCount: this.items.length,
        totalQuantity: this.getTotalQuantity()
      };
      
      if (this.debugMode) {
        console.log('📊 Add item result:', result);
        console.log(`🛒 Cart now has ${result.itemCount} unique items, ${result.totalQuantity} total quantity`);
        console.groupEnd();
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ CART ERROR: Failed to add item to cart:', error);
      if (this.debugMode) {
        console.error('Error details:', {
          product: product,
          variantId: variantId,
          quantity: quantity,
          currentItems: this.items
        });
        console.groupEnd();
      }
      return {
        success: false,
        message: error.message,
        itemCount: this.items.length
      };
    }
  }
  
  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @returns {Object} Result with success status
   */
  removeItem(productId, variantId) {
    try {
      const initialLength = this.items.length;
      this.items = this.items.filter(
        item => !((item.productId === productId || item.id === productId) && 
                  item.variantId === variantId)
      );
      
      const removed = initialLength > this.items.length;
      
      if (removed) {
        this.saveToStorage();
        this.publishEvent('cart.updated', { items: this.items, action: 'remove' });
        console.log(`🛒 Removed item from cart: ${productId}`);
        
        return {
          success: true,
          message: 'Item removed from cart',
          itemCount: this.items.length
        };
      } else {
        return {
          success: false,
          message: 'Item not found in cart',
          itemCount: this.items.length
        };
      }
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return {
        success: false,
        message: error.message,
        itemCount: this.items.length
      };
    }
  }
  
  /**
   * Update item quantity
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {number} newQuantity - New quantity
   * @returns {Object} Result with success status
   */
  updateQuantity(productId, variantId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        return this.removeItem(productId, variantId);
      }
      
      const item = this.items.find(
        item => (item.productId === productId || item.id === productId) && 
                item.variantId === variantId
      );
      
      if (item) {
        item.quantity = newQuantity;
        this.saveToStorage();
        this.publishEvent('cart.updated', { items: this.items, action: 'update' });
        
        return {
          success: true,
          message: 'Quantity updated',
          itemCount: this.items.length
        };
      } else {
        return {
          success: false,
          message: 'Item not found in cart',
          itemCount: this.items.length
        };
      }
      
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      return {
        success: false,
        message: error.message,
        itemCount: this.items.length
      };
    }
  }
  
  /**
   * Get all cart items
   * @returns {Array} Array of cart items
   */
  getItems() {
    return [...this.items]; // Return copy to prevent mutation
  }
  
  /**
   * Get cart item count
   * @returns {number} Number of unique items
   */
  getItemCount() {
    return this.items.length;
  }
  
  /**
   * Get total quantity of all items
   * @returns {number} Total quantity
   */
  getTotalQuantity() {
    return this.items.reduce((total, item) => total + (item.quantity || 1), 0);
  }
  
  /**
   * Calculate cart total price
   * @returns {number} Total price
   */
  getTotal() {
    try {
      if (!this.items || this.items.length === 0) {
        return 0;
      }
      
      return this.items.reduce((total, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);
      
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }
  
  /**
   * Clear all items from cart
   * @returns {Object} Result with success status
   */
  clear() {
    try {
      this.items = [];
      this.saveToStorage();
      this.publishEvent('cart.updated', { items: this.items, action: 'clear' });
      
      return {
        success: true,
        message: 'Cart cleared',
        itemCount: 0
      };
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        message: error.message,
        itemCount: this.items.length
      };
    }
  }
  
  /**
   * Check if cart is empty
   * @returns {boolean} True if cart is empty
   */
  isEmpty() {
    return this.items.length === 0;
  }
  
  /**
   * Extract price from product and variant
   * @param {Object} product - Product object
   * @param {string} variantId - Variant ID
   * @returns {number} Price
   */
  extractPrice(product, variantId) {
    try {
      // Try to find variant-specific price
      if (product.variants && Array.isArray(product.variants)) {
        const variant = product.variants.find(v => v.id == variantId); // Use loose equality for type flexibility
        if (variant && variant.price) {
          // Convert cents to dollars (Printify prices are in cents)
          return (parseFloat(variant.price) / 100) || 0;
        }
      }
      
      // Fallback to product price
      if (product.price) {
        // Assume product price is already in dollars
        return parseFloat(product.price) || 0;
      }
      
      // Default estimated price
      return 25.00;
      
    } catch (error) {
      console.error('Error extracting price:', error);
      return 25.00;
    }
  }
  
  /**
   * Extract image from product (prioritizing variant-specific image)
   * @param {Object} product - Product object
   * @param {string} variantId - Optional variant ID to get variant-specific image
   * @returns {string} Image URL
   */
  extractImage(product, variantId = null) {
    try {
      console.log(`📸 [EXTRACT-IMAGE] Product: ${product.title || product.id} | VariantId: ${variantId || 'None'}`);

      // 🖼️ PRIORITY 0: Pre-selected variant image URL (from dropdown/button selection)
      if (product.selectedVariantImageUrl) {
        console.log(`   ├─ PRIORITY 0: Using pre-selected variant image from product card selection`);
        console.log(`   │  └─ Found variant image: ✅ ${product.selectedVariantImageUrl.substring(0, 80)}...`);
        return product.selectedVariantImageUrl;
      }

      // 🖼️ PRIORITY 1: Variant-specific image
      if (variantId && product.variants && Array.isArray(product.variants)) {
        console.log(`   ├─ PRIORITY 1: Looking for variant image (variantId: ${variantId})`);
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          console.log(`   │  ├─ Found variant: ${variant.title}`);
          if (variant.image && variant.image.url) {
            console.log(`   │  ├─ Found variant image: ✅ ${variant.image.url}`);
            if (this.debugMode) {
              console.log(`🖼️ Using variant image for ${variantId}:`, variant.image.url);
            }
            return variant.image.url;
          } else {
            console.log(`   │  └─ NO variant image found (variant.image: ${variant.image ? '?exists' : 'missing'})`);
          }
        } else {
          console.log(`   │  └─ Variant not found in product.variants`);
        }
      } else {
        console.log(`   ├─ PRIORITY 1: Skipped (variantId: ${variantId ? 'present' : 'MISSING'}, variants: ${product.variants ? '✅' : '❌'})`);
      }

      // PRIORITY 2: Product images
      console.log(`   ├─ PRIORITY 2: Looking for product image`);
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = product.images[0].src || product.images[0].url || '';
        if (imageUrl) {
          console.log(`   │  └─ Found product image: ✅ ${imageUrl}`);
          if (this.debugMode) {
            console.log('🖼️ Using product image:', imageUrl);
          }
          return imageUrl;
        } else {
          console.log(`   │  └─ Product image exists but URL empty`);
        }
      } else {
        console.log(`   │  └─ No product.images array`);
      }

      // PRIORITY 3: Source image (gallery image)
      console.log(`   ├─ PRIORITY 3: Looking for source/gallery image`);
      if (product.sourceImage && product.sourceImage.url) {
        console.log(`   │  └─ Found source image: ✅ ${product.sourceImage.url}`);
        if (this.debugMode) {
          console.log('🖼️ Using source image:', product.sourceImage.url);
        }
        return product.sourceImage.url;
      } else {
        console.log(`   │  └─ No sourceImage.url`);
      }

      // PRIORITY 4: Default fallback
      const fallback = '/images/previews/generic-product-preview.svg';
      console.log(`   └─ PRIORITY 4: Using generic fallback: ${fallback}`);
      if (this.debugMode) {
        console.log('🖼️ Using generic fallback image');
      }
      return fallback;

    } catch (error) {
      console.error(`❌ [EXTRACT-IMAGE] Error extracting image:`, error);
      return '/images/previews/generic-product-preview.svg';
    }
  }
  
  /**
   * Save cart to localStorage
   */
  saveToStorage() {
    if (this.debugMode) {
      console.log(`💾 CART DIAGNOSTICS: Saving ${this.items.length} items to localStorage`);
    }
    
    try {
      const cartData = JSON.stringify(this.items);
      localStorage.setItem('wavelength_cart', cartData);
      
      if (this.debugMode) {
        console.log('✅ Cart saved to localStorage successfully');
        console.log(`📦 Saved data size: ${cartData.length} characters`);
        
        // Verify save by reading it back
        const verification = localStorage.getItem('wavelength_cart');
        if (verification === cartData) {
          console.log('✅ Storage verification passed');
        } else {
          console.warn('⚠️ Storage verification failed - data mismatch');
        }
      }
    } catch (error) {
      console.error('❌ CART ERROR: Failed to save cart to storage:', error);
      if (this.debugMode) {
        console.error('Cart data that failed to save:', this.items);
      }
    }
  }
  
  /**
   * Load cart from localStorage
   */
  loadFromStorage() {
    if (this.debugMode) {
      console.log('💾 CART DIAGNOSTICS: Loading cart from localStorage...');
    }
    
    try {
      const stored = localStorage.getItem('wavelength_cart');
      if (stored) {
        const parsedItems = JSON.parse(stored) || [];
        this.items = parsedItems;
        
        if (this.debugMode) {
          console.log(`✅ Loaded ${this.items.length} items from storage`);
          console.log('📦 Cart items loaded:', this.items);
          
          // Validate loaded items
          this.items.forEach((item, index) => {
            if (!item.productId || !item.variantId) {
              console.warn(`⚠️ Invalid cart item at index ${index}:`, item);
            }
          });
        }
      } else {
        if (this.debugMode) {
          console.log('📝 No cart data found in localStorage - starting with empty cart');
        }
      }
    } catch (error) {
      console.error('❌ CART ERROR: Failed to load cart from storage:', error);
      this.items = [];
      if (this.debugMode) {
        console.log('🔄 Reset to empty cart due to storage error');
      }
    }
  }
  
  /**
   * Publish event through event bus
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  publishEvent(event, data) {
    if (this.debugMode) {
      console.log(`📢 CART EVENT: Publishing '${event}'`, data);
    }
    
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit(event, data);
      if (this.debugMode) {
        console.log(`✅ Event '${event}' published successfully`);
      }
    } else {
      if (this.debugMode) {
        console.warn(`⚠️ Event bus not available for event '${event}'`, {
          hasEventBus: !!this.eventBus,
          hasEmitMethod: this.eventBus && typeof this.eventBus.emit === 'function'
        });
      }
    }
  }
  
  /**
   * Get cart summary for display
   * @returns {Object} Cart summary
   */
  getSummary() {
    return {
      itemCount: this.getItemCount(),
      totalQuantity: this.getTotalQuantity(),
      total: this.getTotal(),
      isEmpty: this.isEmpty(),
      items: this.getItems()
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseCartService;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseCartService = MerchandiseCartService;
}