/**
 * WAVELENGTH Cart Renderer
 * 
 * Handles rendering of shopping cart UI including:
 * - Cart items with images and details
 * - Quantity controls
 * - Total calculations
 * - Checkout interface
 * - Empty cart states
 */

class MerchandiseCartRenderer {
  constructor(options = {}) {
    this.cartService = options.cartService;
    this.eventBus = options.eventBus;
    this.merchandiseStore = options.merchandiseStore; // For accessing helper methods
  }
  
  /**
   * Render complete cart interface
   * @returns {string} HTML string for cart display
   */
  renderCart() {
    try {
      const cartSummary = this.cartService.getSummary();
      
      if (cartSummary.isEmpty) {
        return this.renderEmptyCart();
      }
      
      return `
        <div class="cart-container">
          <div class="cart-header">
            <h3>
              <span class="cart-icon">🛒</span>
              Shopping Cart
              <span class="cart-badge">${cartSummary.totalQuantity}</span>
            </h3>
            <button class="clear-cart-btn" title="Clear Cart">
              <span>🗑️</span> Clear All
            </button>
          </div>
          
          <div class="cart-items">
            ${this.renderCartItems(cartSummary.items)}
          </div>
          
          <div class="cart-footer">
            ${this.renderCartSummary(cartSummary)}
            ${this.renderCheckoutSection(cartSummary)}
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering cart:', error);
      return this.renderCartError();
    }
  }
  
  /**
   * Render individual cart items
   * @param {Array} items - Array of cart items
   * @returns {string} HTML string for cart items
   */
  renderCartItems(items) {
    return items.map(item => this.renderCartItem(item)).join('');
  }
  
  /**
   * Render a single cart item
   * @param {Object} item - Cart item object
   * @returns {string} HTML string for cart item
   */
  renderCartItem(item) {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const itemImage = this.getItemImage(item);
    
    return `
      <div class="cart-item" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
        <div class="cart-item-image">
          <img src="${itemImage}" alt="${item.title}" loading="lazy" />
        </div>
        
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.title}</h4>
          <p class="cart-item-variant">
            ${this.getVariantDescription(item)}
          </p>
          <p class="cart-item-price">
            $${(item.price || 0).toFixed(2)} each
          </p>
        </div>
        
        <div class="cart-item-controls">
          <div class="quantity-controls">
            <button class="quantity-decrease" 
                    data-product-id="${item.productId}" 
                    data-variant-id="${item.variantId}"
                    title="Decrease quantity">
              −
            </button>
            <input type="number" 
                   class="quantity-input" 
                   value="${item.quantity || 1}" 
                   min="1" 
                   max="99"
                   data-product-id="${item.productId}" 
                   data-variant-id="${item.variantId}">
            <button class="quantity-increase" 
                    data-product-id="${item.productId}" 
                    data-variant-id="${item.variantId}"
                    title="Increase quantity">
              +
            </button>
          </div>
          
          <div class="cart-item-total">
            $${itemTotal.toFixed(2)}
          </div>
          
          <button class="remove-item-btn" 
                  data-product-id="${item.productId}" 
                  data-variant-id="${item.variantId}"
                  title="Remove from cart">
            <span>🗑️</span>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render cart summary with totals
   * @param {Object} cartSummary - Cart summary object
   * @returns {string} HTML string for cart summary
   */
  renderCartSummary(cartSummary) {
    const subtotal = cartSummary.total;
    const shipping = this.calculateShipping(subtotal);
    const tax = this.calculateTax(subtotal);
    const total = subtotal + shipping + tax;
    
    return `
      <div class="cart-summary">
        <div class="summary-row">
          <span class="summary-label">Subtotal (${cartSummary.totalQuantity} items):</span>
          <span class="summary-value">$${subtotal.toFixed(2)}</span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">Shipping:</span>
          <span class="summary-value">
            ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">Tax (estimated):</span>
          <span class="summary-value">$${tax.toFixed(2)}</span>
        </div>
        
        <div class="summary-row total-row">
          <span class="summary-label">Total:</span>
          <span class="summary-value total-value">$${total.toFixed(2)}</span>
        </div>
        
        <div class="savings-info">
          ${this.renderSavingsInfo(cartSummary)}
        </div>
      </div>
    `;
  }
  
  /**
   * Render checkout section
   * @param {Object} cartSummary - Cart summary object
   * @returns {string} HTML string for checkout section
   */
  renderCheckoutSection(cartSummary) {
    const isCheckoutEnabled = cartSummary.total > 0;
    
    return `
      <div class="checkout-section">
        <button class="checkout-btn ${!isCheckoutEnabled ? 'disabled' : ''}" 
                ${!isCheckoutEnabled ? 'disabled' : ''}>
          <span class="checkout-icon">💳</span>
          Proceed to Checkout
          <span class="checkout-total">$${cartSummary.total.toFixed(2)}</span>
        </button>
        
        <div class="checkout-info">
          <p class="secure-checkout">
            <span>🔒</span> Secure checkout powered by Printify
          </p>
          <p class="shipping-info">
            📦 Free shipping on orders over $50
          </p>
        </div>
        
        <div class="continue-shopping">
          <button class="continue-shopping-btn">
            ← Continue Shopping
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render empty cart state
   * @returns {string} HTML string for empty cart
   */
  renderEmptyCart() {
    return `
      <div class="cart-container empty-cart">
        <div class="empty-cart-content">
          <div class="empty-cart-icon">🛒</div>
          <h3>Your Cart is Empty</h3>
          <p>Add some custom products to get started!</p>
          <button class="browse-products-btn btn-primary">
            <span>🎨</span> Design Your First Product
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render cart error state
   * @returns {string} HTML string for cart error
   */
  renderCartError() {
    return `
      <div class="cart-container cart-error">
        <div class="cart-error-content">
          <div class="cart-error-icon">⚠️</div>
          <h3>Error Loading Cart</h3>
          <p>There was a problem loading your cart. Please try again.</p>
          <button class="retry-cart-btn btn-primary">
            <span>🔄</span> Retry
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render mini cart for header/sidebar
   * @returns {string} HTML string for mini cart
   */
  renderMiniCart() {
    try {
      const cartSummary = this.cartService.getSummary();
      
      return `
        <div class="mini-cart">
          <button class="mini-cart-toggle" data-cart-items="${cartSummary.itemCount}">
            <span class="cart-icon">🛒</span>
            <span class="cart-count ${cartSummary.itemCount > 0 ? 'has-items' : ''}">${cartSummary.itemCount}</span>
          </button>
          
          <div class="mini-cart-dropdown">
            ${cartSummary.isEmpty ? `
              <div class="mini-cart-empty">
                <p>Your cart is empty</p>
              </div>
            ` : `
              <div class="mini-cart-items">
                ${cartSummary.items.slice(0, 3).map(item => this.renderMiniCartItem(item)).join('')}
                ${cartSummary.itemCount > 3 ? `
                  <div class="mini-cart-more">
                    +${cartSummary.itemCount - 3} more items
                  </div>
                ` : ''}
              </div>
              <div class="mini-cart-total">
                Total: $${cartSummary.total.toFixed(2)}
              </div>
              <div class="mini-cart-actions">
                <button class="view-cart-btn btn-secondary">View Cart</button>
                <button class="mini-checkout-btn btn-primary">Checkout</button>
              </div>
            `}
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering mini cart:', error);
      return `
        <div class="mini-cart">
          <button class="mini-cart-toggle" data-cart-items="0">
            <span class="cart-icon">🛒</span>
            <span class="cart-count">0</span>
          </button>
        </div>
      `;
    }
  }
  
  /**
   * Render mini cart item
   * @param {Object} item - Cart item
   * @returns {string} HTML string for mini cart item
   */
  renderMiniCartItem(item) {
    const itemImage = this.getItemImage(item);
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    
    return `
      <div class="mini-cart-item">
        <img src="${itemImage}" alt="${item.title}" class="mini-item-image" />
        <div class="mini-item-details">
          <span class="mini-item-title">${item.title}</span>
          <span class="mini-item-quantity">Qty: ${item.quantity}</span>
          <span class="mini-item-price">$${itemTotal.toFixed(2)}</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Get item image with fallbacks
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
   * Calculate shipping cost
   * @param {number} subtotal - Subtotal amount
   * @returns {number} Shipping cost
   */
  calculateShipping(subtotal) {
    // Free shipping over $50, otherwise $5.99
    return subtotal >= 50 ? 0 : 5.99;
  }
  
  /**
   * Calculate tax estimate
   * @param {number} subtotal - Subtotal amount
   * @returns {number} Tax amount
   */
  calculateTax(subtotal) {
    // Rough 8% tax estimate
    return subtotal * 0.08;
  }
  
  /**
   * Render savings information
   * @param {Object} cartSummary - Cart summary
   * @returns {string} HTML string for savings info
   */
  renderSavingsInfo(cartSummary) {
    const subtotal = cartSummary.total;
    const freeShippingThreshold = 50;
    
    if (subtotal >= freeShippingThreshold) {
      return `
        <div class="savings-message success">
          <span>🎉</span> You're getting free shipping!
        </div>
      `;
    } else {
      const amountNeeded = freeShippingThreshold - subtotal;
      return `
        <div class="savings-message">
          <span>📦</span> Add $${amountNeeded.toFixed(2)} more for free shipping!
        </div>
      `;
    }
  }
  
  /**
   * Set up event listeners for cart interactions
   * @param {HTMLElement} container - Container element with cart
   */
  setupEventListeners(container) {
    if (!container) return;
    
    // Delegate event handling to container
    container.addEventListener('click', (e) => {
      // Quantity controls
      if (e.target.classList.contains('quantity-decrease')) {
        this.handleQuantityDecrease(e.target);
      } else if (e.target.classList.contains('quantity-increase')) {
        this.handleQuantityIncrease(e.target);
      } else if (e.target.classList.contains('remove-item-btn')) {
        this.handleRemoveItem(e.target);
      } else if (e.target.classList.contains('clear-cart-btn')) {
        this.handleClearCart();
      } else if (e.target.classList.contains('checkout-btn')) {
        this.handleCheckout();
      } else if (e.target.classList.contains('continue-shopping-btn')) {
        this.handleContinueShopping();
      } else if (e.target.classList.contains('browse-products-btn')) {
        this.handleBrowseProducts();
      }
    });
    
    // Handle quantity input changes
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        this.handleQuantityChange(e.target);
      }
    });
  }
  
  /**
   * Handle quantity decrease
   * @param {HTMLElement} button - Decrease button
   */
  handleQuantityDecrease(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    const input = button.parentElement.querySelector('.quantity-input');
    const currentQuantity = parseInt(input.value) || 1;
    
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      this.updateQuantity(productId, variantId, newQuantity);
    }
  }
  
  /**
   * Handle quantity increase
   * @param {HTMLElement} button - Increase button
   */
  handleQuantityIncrease(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    const input = button.parentElement.querySelector('.quantity-input');
    const currentQuantity = parseInt(input.value) || 1;
    
    const newQuantity = Math.min(currentQuantity + 1, 99);
    this.updateQuantity(productId, variantId, newQuantity);
  }
  
  /**
   * Handle quantity input change
   * @param {HTMLElement} input - Quantity input
   */
  handleQuantityChange(input) {
    const productId = input.dataset.productId;
    const variantId = input.dataset.variantId;
    const newQuantity = Math.max(1, Math.min(parseInt(input.value) || 1, 99));
    
    this.updateQuantity(productId, variantId, newQuantity);
  }
  
  /**
   * Update item quantity
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {number} quantity - New quantity
   */
  updateQuantity(productId, variantId, quantity) {
    if (this.cartService) {
      this.cartService.updateQuantity(productId, variantId, quantity);
    }
    
    if (this.eventBus) {
      this.eventBus.emit('cart.quantityChanged', { productId, variantId, quantity });
    }
  }
  
  /**
   * Handle remove item
   * @param {HTMLElement} button - Remove button
   */
  handleRemoveItem(button) {
    const productId = button.dataset.productId;
    const variantId = button.dataset.variantId;
    
    if (this.cartService) {
      this.cartService.removeItem(productId, variantId);
    }
    
    if (this.eventBus) {
      this.eventBus.emit('cart.itemRemoved', { productId, variantId });
    }
  }
  
  /**
   * Handle clear cart
   */
  handleClearCart() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      if (this.cartService) {
        this.cartService.clear();
      }
      
      if (this.eventBus) {
        this.eventBus.emit('cart.cleared');
      }
    }
  }
  
  /**
   * Handle checkout
   */
  handleCheckout() {
    if (this.eventBus) {
      this.eventBus.emit('cart.checkout');
    }
  }
  
  /**
   * Handle continue shopping
   */
  handleContinueShopping() {
    if (this.eventBus) {
      this.eventBus.emit('ui.continueShopping');
    }
  }
  
  /**
   * Handle browse products
   */
  handleBrowseProducts() {
    if (this.eventBus) {
      this.eventBus.emit('ui.browseProducts');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseCartRenderer;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseCartRenderer = MerchandiseCartRenderer;
}