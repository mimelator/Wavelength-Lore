/**
 * Product Navigator - Tiered category navigation with search
 */

class ProductNavigator {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      showSearch: true,
      enableFilters: true,
      ...options
    };
    
    this.catalog = null;
    this.currentView = 'categories'; // 'categories', 'subcategories', 'products'
    this.currentCategory = null;
    this.currentSubcategory = null;
    this.searchQuery = '';
    this.filters = {};
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadCatalog();
      this.render();
      this.bindEvents();
    } catch (error) {
      console.error('Failed to initialize ProductNavigator:', error);
      this.renderError('Failed to load product catalog');
    }
  }
  
  async loadCatalog() {
    const response = await fetch('/api/product-catalog');
    if (!response.ok) {
      throw new Error('Failed to load catalog');
    }
    this.catalog = await response.json();
  }
  
  render() {
    if (!this.catalog) {
      this.renderLoading();
      return;
    }
    
    this.container.innerHTML = `
      <div class="product-navigator">
        ${this.options.showSearch ? this.renderSearchBar() : ''}
        ${this.renderBreadcrumbs()}
        ${this.renderContent()}
      </div>
    `;
  }
  
  renderSearchBar() {
    return `
      <div class="search-section">
        <div class="search-input-wrapper">
          <input type="text" 
                 id="product-search" 
                 placeholder="Search products..." 
                 value="${this.searchQuery}"
                 class="search-input">
          <button class="search-clear" ${this.searchQuery ? '' : 'style="display:none"'}>×</button>
        </div>
        <div class="search-results" style="display:none"></div>
      </div>
    `;
  }
  
  renderBreadcrumbs() {
    const breadcrumbs = ['All Categories'];
    
    if (this.currentCategory) {
      breadcrumbs.push(this.catalog.categories[this.currentCategory].name);
    }
    
    if (this.currentSubcategory) {
      breadcrumbs.push(this.catalog.categories[this.currentCategory].subcategories[this.currentSubcategory].name);
    }
    
    return `
      <nav class="breadcrumbs">
        ${breadcrumbs.map((crumb, index) => `
          <span class="breadcrumb ${index === breadcrumbs.length - 1 ? 'active' : ''}" 
                data-level="${index}">
            ${crumb}
          </span>
          ${index < breadcrumbs.length - 1 ? '<span class="separator">›</span>' : ''}
        `).join('')}
      </nav>
    `;
  }
  
  renderContent() {
    if (this.searchQuery) {
      return this.renderSearchResults();
    }
    
    switch (this.currentView) {
      case 'categories':
        return this.renderCategories();
      case 'subcategories':
        return this.renderSubcategories();
      case 'products':
        return this.renderProducts();
      default:
        return this.renderCategories();
    }
  }
  
  renderCategories() {
    const categories = Object.entries(this.catalog.categories)
      .filter(([key, cat]) => cat.productCount > 0);
    
    return `
      <div class="categories-grid">
        ${categories.map(([key, category]) => `
          <div class="category-card" data-category="${key}">
            <div class="category-icon">${category.icon}</div>
            <h3 class="category-name">${category.name}</h3>
            <p class="category-description">${category.description}</p>
            <div class="category-stats">
              <span class="product-count">${category.productCount} products</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderSubcategories() {
    const category = this.catalog.categories[this.currentCategory];
    const subcategories = Object.entries(category.subcategories)
      .filter(([key, sub]) => sub.products.length > 0);
    
    return `
      <div class="subcategories-section">
        <h2 class="section-title">${category.icon} ${category.name}</h2>
        <div class="subcategories-grid">
          ${subcategories.map(([key, subcategory]) => `
            <div class="subcategory-card" data-subcategory="${key}">
              <h4 class="subcategory-name">${subcategory.name}</h4>
              <div class="subcategory-stats">
                <span class="product-count">${subcategory.products.length} products</span>
              </div>
              <div class="subcategory-preview">
                ${subcategory.products.slice(0, 3).map(product => `
                  <span class="preview-item">${product.blueprint_title}</span>
                `).join('')}
                ${subcategory.products.length > 3 ? `<span class="more-items">+${subcategory.products.length - 3} more</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderProducts() {
    const subcategory = this.catalog.categories[this.currentCategory].subcategories[this.currentSubcategory];
    const products = subcategory.products;
    
    return `
      <div class="products-section">
        <h2 class="section-title">${subcategory.name}</h2>
        <div class="products-grid">
          ${products.map(product => `
            <div class="product-card" data-blueprint="${product.blueprint_id}" data-provider="${product.provider_id}">
              <div class="product-info">
                <h4 class="product-title">${product.blueprint_title}</h4>
                <p class="product-brand">${product.blueprint_brand || 'Generic'}</p>
                <p class="product-provider">by ${product.provider_title}</p>
                <div class="product-price">$${(product.estimatedPrice / 100).toFixed(2)}</div>
                <div class="product-tags">
                  ${product.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              </div>
              <button class="select-product-btn">Select This Product</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  renderSearchResults() {
    const results = this.searchProducts(this.searchQuery);
    
    if (results.length === 0) {
      return `
        <div class="search-results-section">
          <h2 class="section-title">Search Results for "${this.searchQuery}"</h2>
          <div class="no-results">
            <p>No products found matching your search.</p>
            <button class="clear-search-btn">Clear Search</button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="search-results-section">
        <h2 class="section-title">Search Results for "${this.searchQuery}" (${results.length})</h2>
        <div class="products-grid">
          ${results.map(product => `
            <div class="product-card" data-blueprint="${product.blueprint_id}" data-provider="${product.provider_id}">
              <div class="product-info">
                <h4 class="product-title">${product.blueprint_title}</h4>
                <p class="product-brand">${product.blueprint_brand || 'Generic'}</p>
                <p class="product-provider">by ${product.provider_title}</p>
                <div class="product-category">${this.catalog.categories[product.category].name}</div>
                <div class="product-price">$${(product.estimatedPrice / 100).toFixed(2)}</div>
              </div>
              <button class="select-product-btn">Select This Product</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  searchProducts(query) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    return this.catalog.searchIndex.filter(product => 
      product.searchTerms.includes(searchTerm) ||
      product.blueprint_title.toLowerCase().includes(searchTerm) ||
      product.blueprint_brand?.toLowerCase().includes(searchTerm) ||
      product.provider_title.toLowerCase().includes(searchTerm)
    );
  }
  
  bindEvents() {
    // Category navigation
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.category-card')) {
        const categoryKey = e.target.closest('.category-card').dataset.category;
        this.navigateToCategory(categoryKey);
      }
      
      if (e.target.closest('.subcategory-card')) {
        const subcategoryKey = e.target.closest('.subcategory-card').dataset.subcategory;
        this.navigateToSubcategory(subcategoryKey);
      }
      
      if (e.target.closest('.select-product-btn')) {
        const card = e.target.closest('.product-card');
        const blueprintId = card.dataset.blueprint;
        const providerId = card.dataset.provider;
        this.selectProduct(blueprintId, providerId);
      }
      
      if (e.target.closest('.breadcrumb')) {
        const level = parseInt(e.target.closest('.breadcrumb').dataset.level);
        this.navigateToBreadcrumb(level);
      }
      
      if (e.target.closest('.clear-search-btn') || e.target.closest('.search-clear')) {
        this.clearSearch();
      }
    });
    
    // Search functionality
    const searchInput = this.container.querySelector('#product-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });
    }
  }
  
  navigateToCategory(categoryKey) {
    this.currentCategory = categoryKey;
    this.currentSubcategory = null;
    this.currentView = 'subcategories';
    this.render();
  }
  
  navigateToSubcategory(subcategoryKey) {
    this.currentSubcategory = subcategoryKey;
    this.currentView = 'products';
    this.render();
  }
  
  navigateToBreadcrumb(level) {
    switch (level) {
      case 0: // All Categories
        this.currentCategory = null;
        this.currentSubcategory = null;
        this.currentView = 'categories';
        break;
      case 1: // Category level
        this.currentSubcategory = null;
        this.currentView = 'subcategories';
        break;
    }
    this.render();
  }
  
  handleSearch(query) {
    this.searchQuery = query.trim();
    
    // Show/hide clear button
    const clearBtn = this.container.querySelector('.search-clear');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery ? 'block' : 'none';
    }
    
    this.render();
  }
  
  clearSearch() {
    this.searchQuery = '';
    const searchInput = this.container.querySelector('#product-search');
    if (searchInput) {
      searchInput.value = '';
    }
    this.render();
  }
  
  selectProduct(blueprintId, providerId) {
    // Emit custom event for parent components to handle
    const event = new CustomEvent('productSelected', {
      detail: { blueprintId, providerId }
    });
    this.container.dispatchEvent(event);
    
    console.log('Product selected:', { blueprintId, providerId });
  }
  
  renderLoading() {
    this.container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading product catalog...</p>
      </div>
    `;
  }
  
  renderError(message) {
    this.container.innerHTML = `
      <div class="error-state">
        <p class="error-message">${message}</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductNavigator;
}