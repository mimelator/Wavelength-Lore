/**
 * WAVELENGTH Category Grid Renderer
 * 
 * Handles rendering of product categories and category grids including:
 * - Category navigation cards
 * - Product grids by category
 * - Filter controls
 * - Search results
 * - Loading states
 */

class MerchandiseCategoryGridRenderer {
  constructor(options = {}) {
    this.validationService = options.validationService;
    this.eventBus = options.eventBus;
    this.merchandiseStore = options.merchandiseStore; // For accessing helper methods
  }
  
  /**
   * Render main category navigation grid
   * @param {Array} categories - Array of category objects
   * @returns {string} HTML string for category grid
   */
  renderCategoryGrid(categories = []) {
    try {
      if (!categories.length) {
        return this.renderEmptyCategoryGrid();
      }
      
      return `
        <div class="category-grid-container">
          <div class="category-grid-header">
            <h2>Choose Your Product Category</h2>
            <p>Select a category to customize your Wavelength merchandise</p>
          </div>
          
          <div class="category-grid">
            ${categories.map(category => this.renderCategoryCard(category)).join('')}
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering category grid:', error);
      return this.renderCategoryGridError();
    }
  }
  
  /**
   * Render individual category card
   * @param {Object} category - Category object
   * @returns {string} HTML string for category card
   */
  renderCategoryCard(category) {
    const hasProducts = category.productCount > 0;
    const isComingSoon = category.comingSoon;
    
    return `
      <div class="category-card ${!hasProducts ? 'no-products' : ''} ${isComingSoon ? 'coming-soon' : ''}" 
           data-category-id="${category.id}">
        <div class="category-card-image">
          <img src="${category.image || '/images/categories/default-category.svg'}" 
               alt="${category.name}" 
               loading="lazy" />
          ${isComingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
        </div>
        
        <div class="category-card-content">
          <h3 class="category-title">${category.name}</h3>
          <p class="category-description">${category.description || 'Custom products for this category'}</p>
          
          <div class="category-stats">
            <span class="product-count">
              <span class="stat-icon">📦</span>
              ${category.productCount || 0} products
            </span>
            ${category.popularItems ? `
              <span class="popular-badge">
                <span class="stat-icon">🔥</span>
                Popular
              </span>
            ` : ''}
          </div>
          
          <div class="category-card-actions">
            ${hasProducts && !isComingSoon ? `
              <button class="select-category-btn btn-primary" data-category-id="${category.id}">
                <span>🎨</span> Customize Now
              </button>
            ` : isComingSoon ? `
              <button class="notify-me-btn btn-secondary" data-category-id="${category.id}">
                <span>🔔</span> Notify Me
              </button>
            ` : `
              <button class="unavailable-btn btn-disabled" disabled>
                <span>⏳</span> No Products Yet
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render product grid for a specific category
   * @param {string} categoryId - Category ID
   * @param {Array} products - Array of products
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for product grid
   */
  renderProductGrid(categoryId, products = [], options = {}) {
    try {
      const {
        showFilters = true,
        showSearch = true,
        sortBy = 'name',
        filterBy = {},
        searchTerm = ''
      } = options;
      
      return `
        <div class="product-grid-container" data-category-id="${categoryId}">
          ${showSearch || showFilters ? `
            <div class="product-grid-controls">
              ${showSearch ? this.renderSearchControls(searchTerm) : ''}
              ${showFilters ? this.renderFilterControls(filterBy) : ''}
            </div>
          ` : ''}
          
          <div class="product-grid-header">
            <div class="grid-info">
              <span class="product-count-info">
                ${products.length} product${products.length !== 1 ? 's' : ''} found
              </span>
            </div>
            
            <div class="grid-controls">
              ${this.renderSortControls(sortBy)}
              ${this.renderViewControls()}
            </div>
          </div>
          
          <div class="product-grid" data-view="grid">
            ${products.length ? 
              products.map(product => this.renderProductGridItem(product)).join('') :
              this.renderEmptyProductGrid(categoryId, searchTerm, filterBy)
            }
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error rendering product grid:', error);
      return this.renderProductGridError();
    }
  }
  
  /**
   * Render product grid item
   * @param {Object} product - Product object
   * @returns {string} HTML string for product grid item
   */
  renderProductGridItem(product) {
    const productStatus = this.validationService ? 
      this.validationService.getProductStatus(product) : 
      { isComplete: true, isValid: true };
    
    const statusClass = productStatus.isComplete ? 'complete' : 
                        productStatus.isValid ? 'incomplete' : 'broken';
    
    return `
      <div class="product-grid-item ${statusClass}" data-product-id="${product.id}">
        <div class="grid-item-image">
          <img src="${product.previewImage || '/images/previews/generic-product-preview.svg'}" 
               alt="${product.title}" 
               loading="lazy" />
          <div class="grid-item-overlay">
            <button class="quick-preview-btn" data-product-id="${product.id}">
              <span>👁️</span> Quick Preview
            </button>
            <button class="customize-btn" data-product-id="${product.id}">
              <span>🎨</span> Customize
            </button>
          </div>
        </div>
        
        <div class="grid-item-content">
          <h4 class="grid-item-title">${product.title}</h4>
          <p class="grid-item-price">
            ${product.price ? `$${product.price.toFixed(2)}` : 'Price varies'}
          </p>
          
          <div class="grid-item-status">
            ${this.renderProductStatusBadge(productStatus)}
          </div>
          
          <div class="grid-item-actions">
            <button class="add-to-cart-btn btn-primary" 
                    data-product-id="${product.id}"
                    ${!productStatus.isComplete ? 'disabled' : ''}>
              <span>🛒</span> Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render search controls
   * @param {string} currentSearchTerm - Current search term
   * @returns {string} HTML string for search controls
   */
  renderSearchControls(currentSearchTerm = '') {
    return `
      <div class="search-controls">
        <div class="search-input-container">
          <input type="text" 
                 class="product-search-input" 
                 placeholder="Search products..." 
                 value="${currentSearchTerm}">
          <button class="search-btn" title="Search">
            <span>🔍</span>
          </button>
          ${currentSearchTerm ? `
            <button class="clear-search-btn" title="Clear search">
              <span>✕</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Render filter controls
   * @param {Object} currentFilters - Current filter state
   * @returns {string} HTML string for filter controls
   */
  renderFilterControls(currentFilters = {}) {
    return `
      <div class="filter-controls">
        <div class="filter-section">
          <label>Status:</label>
          <select class="status-filter" data-filter="status">
            <option value="">All Status</option>
            <option value="complete" ${currentFilters.status === 'complete' ? 'selected' : ''}>Complete</option>
            <option value="incomplete" ${currentFilters.status === 'incomplete' ? 'selected' : ''}>Incomplete</option>
            <option value="broken" ${currentFilters.status === 'broken' ? 'selected' : ''}>Needs Fix</option>
          </select>
        </div>
        
        <div class="filter-section">
          <label>Price:</label>
          <select class="price-filter" data-filter="price">
            <option value="">All Prices</option>
            <option value="0-20" ${currentFilters.price === '0-20' ? 'selected' : ''}>Under $20</option>
            <option value="20-50" ${currentFilters.price === '20-50' ? 'selected' : ''}>$20 - $50</option>
            <option value="50+" ${currentFilters.price === '50+' ? 'selected' : ''}>Over $50</option>
          </select>
        </div>
        
        <div class="filter-actions">
          <button class="clear-filters-btn btn-secondary">
            <span>🗑️</span> Clear Filters
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render sort controls
   * @param {string} currentSort - Current sort option
   * @returns {string} HTML string for sort controls
   */
  renderSortControls(currentSort = 'name') {
    return `
      <div class="sort-controls">
        <label for="sort-by">Sort by:</label>
        <select id="sort-by" class="sort-select">
          <option value="name" ${currentSort === 'name' ? 'selected' : ''}>Name A-Z</option>
          <option value="name-desc" ${currentSort === 'name-desc' ? 'selected' : ''}>Name Z-A</option>
          <option value="price" ${currentSort === 'price' ? 'selected' : ''}>Price Low-High</option>
          <option value="price-desc" ${currentSort === 'price-desc' ? 'selected' : ''}>Price High-Low</option>
          <option value="status" ${currentSort === 'status' ? 'selected' : ''}>Status</option>
          <option value="created" ${currentSort === 'created' ? 'selected' : ''}>Recently Added</option>
        </select>
      </div>
    `;
  }
  
  /**
   * Render view controls (grid/list toggle)
   * @returns {string} HTML string for view controls
   */
  renderViewControls() {
    return `
      <div class="view-controls">
        <button class="view-toggle-btn active" data-view="grid" title="Grid View">
          <span>⊞</span>
        </button>
        <button class="view-toggle-btn" data-view="list" title="List View">
          <span>☰</span>
        </button>
      </div>
    `;
  }
  
  /**
   * Render product status badge
   * @param {Object} productStatus - Product status object
   * @returns {string} HTML string for status badge
   */
  renderProductStatusBadge(productStatus) {
    if (productStatus.isComplete) {
      return '<span class="status-badge complete">✅ Ready</span>';
    } else if (productStatus.isValid) {
      return '<span class="status-badge incomplete">⚠️ Incomplete</span>';
    } else {
      return '<span class="status-badge broken">❌ Needs Fix</span>';
    }
  }
  
  /**
   * Render empty category grid
   * @returns {string} HTML string for empty category grid
   */
  renderEmptyCategoryGrid() {
    return `
      <div class="category-grid-container empty">
        <div class="empty-categories-content">
          <div class="empty-categories-icon">📂</div>
          <h3>No Categories Available</h3>
          <p>Product categories are being set up. Check back soon!</p>
          <button class="refresh-categories-btn btn-primary">
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render empty product grid
   * @param {string} categoryId - Category ID
   * @param {string} searchTerm - Current search term
   * @param {Object} filters - Current filters
   * @returns {string} HTML string for empty product grid
   */
  renderEmptyProductGrid(categoryId, searchTerm = '', filters = {}) {
    const hasActiveFilters = searchTerm || Object.keys(filters).length > 0;
    
    return `
      <div class="product-grid-empty">
        <div class="empty-products-content">
          <div class="empty-products-icon">
            ${hasActiveFilters ? '🔍' : '📦'}
          </div>
          <h3>
            ${hasActiveFilters ? 'No Products Found' : 'No Products Yet'}
          </h3>
          <p>
            ${hasActiveFilters ? 
              'Try adjusting your search or filters to find more products.' :
              'Products for this category are being prepared. Check back soon!'
            }
          </p>
          <div class="empty-products-actions">
            ${hasActiveFilters ? `
              <button class="clear-search-filters-btn btn-secondary">
                <span>🗑️</span> Clear Search & Filters
              </button>
            ` : ''}
            <button class="browse-other-categories-btn btn-primary">
              <span>🔍</span> Browse Other Categories
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render category grid error state
   * @returns {string} HTML string for category grid error
   */
  renderCategoryGridError() {
    return `
      <div class="category-grid-container error">
        <div class="category-grid-error-content">
          <div class="category-grid-error-icon">⚠️</div>
          <h3>Error Loading Categories</h3>
          <p>There was a problem loading the product categories. Please try again.</p>
          <button class="retry-categories-btn btn-primary">
            <span>🔄</span> Retry
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render product grid error state
   * @returns {string} HTML string for product grid error
   */
  renderProductGridError() {
    return `
      <div class="product-grid-container error">
        <div class="product-grid-error-content">
          <div class="product-grid-error-icon">⚠️</div>
          <h3>Error Loading Products</h3>
          <p>There was a problem loading the products. Please try again.</p>
          <button class="retry-products-btn btn-primary">
            <span>🔄</span> Retry
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render loading state for category grid
   * @returns {string} HTML string for category grid loading
   */
  renderCategoryGridLoading() {
    return `
      <div class="category-grid-container loading">
        <div class="category-grid-header">
          <h2>Loading Categories...</h2>
        </div>
        <div class="category-grid">
          ${Array(6).fill(0).map(() => `
            <div class="category-card loading-placeholder">
              <div class="category-card-image loading-shimmer"></div>
              <div class="category-card-content">
                <div class="loading-shimmer loading-text"></div>
                <div class="loading-shimmer loading-text-small"></div>
                <div class="loading-shimmer loading-button"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Render loading state for product grid
   * @returns {string} HTML string for product grid loading
   */
  renderProductGridLoading() {
    return `
      <div class="product-grid-container loading">
        <div class="product-grid-header">
          <div class="loading-shimmer loading-text"></div>
        </div>
        <div class="product-grid">
          ${Array(8).fill(0).map(() => `
            <div class="product-grid-item loading-placeholder">
              <div class="grid-item-image loading-shimmer"></div>
              <div class="grid-item-content">
                <div class="loading-shimmer loading-text"></div>
                <div class="loading-shimmer loading-text-small"></div>
                <div class="loading-shimmer loading-button"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * Set up event listeners for category and product grid interactions
   * @param {HTMLElement} container - Container element
   */
  setupEventListeners(container) {
    if (!container) return;
    
    // Delegate event handling to container
    container.addEventListener('click', (e) => {
      // Category selection
      if (e.target.classList.contains('select-category-btn')) {
        this.handleCategorySelect(e.target);
      } else if (e.target.classList.contains('notify-me-btn')) {
        this.handleNotifyMe(e.target);
      }
      
      // Product interactions
      else if (e.target.classList.contains('quick-preview-btn')) {
        this.handleQuickPreview(e.target);
      } else if (e.target.classList.contains('customize-btn')) {
        this.handleCustomize(e.target);
      } else if (e.target.classList.contains('add-to-cart-btn')) {
        this.handleAddToCart(e.target);
      }
      
      // View controls
      else if (e.target.classList.contains('view-toggle-btn')) {
        this.handleViewToggle(e.target);
      }
      
      // Filter and search actions
      else if (e.target.classList.contains('clear-filters-btn')) {
        this.handleClearFilters();
      } else if (e.target.classList.contains('clear-search-btn')) {
        this.handleClearSearch();
      } else if (e.target.classList.contains('search-btn')) {
        this.handleSearch();
      }
      
      // Empty state actions
      else if (e.target.classList.contains('browse-other-categories-btn')) {
        this.handleBrowseOtherCategories();
      } else if (e.target.classList.contains('clear-search-filters-btn')) {
        this.handleClearSearchAndFilters();
      }
    });
    
    // Handle input changes
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('sort-select')) {
        this.handleSortChange(e.target);
      } else if (e.target.dataset.filter) {
        this.handleFilterChange(e.target);
      }
    });
    
    // Handle search input
    container.addEventListener('input', (e) => {
      if (e.target.classList.contains('product-search-input')) {
        this.throttleSearch(e.target);
      }
    });
  }
  
  /**
   * Handle category selection
   * @param {HTMLElement} button - Category select button
   */
  handleCategorySelect(button) {
    const categoryId = button.dataset.categoryId;
    if (this.eventBus) {
      this.eventBus.emit('category.selected', { categoryId });
    }
  }
  
  /**
   * Handle notify me for coming soon categories
   * @param {HTMLElement} button - Notify me button
   */
  handleNotifyMe(button) {
    const categoryId = button.dataset.categoryId;
    if (this.eventBus) {
      this.eventBus.emit('category.notifyMe', { categoryId });
    }
  }
  
  /**
   * Handle product quick preview
   * @param {HTMLElement} button - Quick preview button
   */
  handleQuickPreview(button) {
    const productId = button.dataset.productId;
    if (this.eventBus) {
      this.eventBus.emit('product.quickPreview', { productId });
    }
  }
  
  /**
   * Handle product customization
   * @param {HTMLElement} button - Customize button
   */
  handleCustomize(button) {
    const productId = button.dataset.productId;
    if (this.eventBus) {
      this.eventBus.emit('product.customize', { productId });
    }
  }
  
  /**
   * Handle add to cart
   * @param {HTMLElement} button - Add to cart button
   */
  handleAddToCart(button) {
    const productId = button.dataset.productId;
    if (this.eventBus) {
      this.eventBus.emit('product.addToCart', { productId });
    }
  }
  
  /**
   * Handle view toggle (grid/list)
   * @param {HTMLElement} button - View toggle button
   */
  handleViewToggle(button) {
    const viewType = button.dataset.view;
    const container = button.closest('.product-grid-container');
    
    // Update active state
    container.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Update grid view
    const grid = container.querySelector('.product-grid');
    if (grid) {
      grid.dataset.view = viewType;
    }
    
    if (this.eventBus) {
      this.eventBus.emit('grid.viewChanged', { viewType });
    }
  }
  
  /**
   * Handle search with throttling
   * @param {HTMLElement} input - Search input
   */
  throttleSearch(input) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.handleSearchInput(input);
    }, 300); // 300ms throttle
  }
  
  /**
   * Handle search input
   * @param {HTMLElement} input - Search input
   */
  handleSearchInput(input) {
    const searchTerm = input.value.trim();
    if (this.eventBus) {
      this.eventBus.emit('grid.search', { searchTerm });
    }
  }
  
  /**
   * Handle sort change
   * @param {HTMLElement} select - Sort select
   */
  handleSortChange(select) {
    const sortBy = select.value;
    if (this.eventBus) {
      this.eventBus.emit('grid.sortChanged', { sortBy });
    }
  }
  
  /**
   * Handle filter change
   * @param {HTMLElement} element - Filter element
   */
  handleFilterChange(element) {
    const filterType = element.dataset.filter;
    const filterValue = element.value;
    
    if (this.eventBus) {
      this.eventBus.emit('grid.filterChanged', { filterType, filterValue });
    }
  }
  
  /**
   * Handle clear filters
   */
  handleClearFilters() {
    if (this.eventBus) {
      this.eventBus.emit('grid.clearFilters');
    }
  }
  
  /**
   * Handle clear search
   */
  handleClearSearch() {
    if (this.eventBus) {
      this.eventBus.emit('grid.clearSearch');
    }
  }
  
  /**
   * Handle search button
   */
  handleSearch() {
    const container = document.querySelector('.search-controls');
    const input = container?.querySelector('.product-search-input');
    if (input) {
      this.handleSearchInput(input);
    }
  }
  
  /**
   * Handle browse other categories
   */
  handleBrowseOtherCategories() {
    if (this.eventBus) {
      this.eventBus.emit('ui.browseCategoriesFromEmpty');
    }
  }
  
  /**
   * Handle clear search and filters
   */
  handleClearSearchAndFilters() {
    if (this.eventBus) {
      this.eventBus.emit('grid.clearAll');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MerchandiseCategoryGridRenderer;
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.MerchandiseCategoryGridRenderer = MerchandiseCategoryGridRenderer;
}