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
    this.loadFromStorage();
  }
  
  /**
   * Set event bus for publishing cart events
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * Add item to cart
   * @param {Object} product - Product object
   * @param {string} variantId - Variant ID
   * @param {number} quantity - Quantity to add
   * @returns {Object} Result with success status and message
   */
  addItem(product, variantId, quantity = 1) {
    try {
      if (!product || !product.id) {
        throw new Error('Invalid product');
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
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        this.items[existingItemIndex].quantity += quantity;
        console.log(`🛒 Updated cart item quantity: ${this.items[existingItemIndex].quantity}`);
      } else {
        // Add new item
        const cartItem = {
          id: productId,
          productId: productId,
          variantId: variantId,
          quantity: quantity,
          title: product.title || 'Untitled Product',
          price: this.extractPrice(product, variantId),
          image: this.extractImage(product),
          dateAdded: new Date().toISOString()
        };
        
        this.items.push(cartItem);
        console.log(`🛒 Added new item to cart: ${cartItem.title}`);
      }
      
      this.saveToStorage();
      this.publishEvent('cart.updated', { items: this.items, action: 'add' });
      
      return {
        success: true,
        message: 'Item added to cart successfully',
        itemCount: this.items.length,
        totalQuantity: this.getTotalQuantity()
      };
      
    } catch (error) {
      console.error('Error adding item to cart:', error);
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
        const variant = product.variants.find(v => v.id === variantId);
        if (variant && variant.price) {
          return parseFloat(variant.price) || 0;
        }
      }
      
      // Fallback to product price
      if (product.price) {
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
   * Extract image from product
   * @param {Object} product - Product object
   * @returns {string} Image URL
   */
  extractImage(product) {
    try {
      // Try product images first
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0].src || product.images[0].url || '';
      }
      
      // Try source image
      if (product.sourceImage && product.sourceImage.url) {
        return product.sourceImage.url;
      }
      
      // Default fallback
      return '/images/previews/generic-product-preview.svg';
      
    } catch (error) {
      console.error('Error extracting image:', error);
      return '/images/previews/generic-product-preview.svg';
    }
  }
  
  /**
   * Save cart to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('wavelength_cart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }
  
  /**
   * Load cart from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('wavelength_cart');
      if (stored) {
        this.items = JSON.parse(stored) || [];
        console.log(`🛒 Loaded ${this.items.length} items from storage`);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.items = [];
    }
  }
  
  /**
   * Publish event through event bus
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  publishEvent(event, data) {
    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit(event, data);
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