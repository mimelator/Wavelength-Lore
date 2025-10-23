/**
 * Enhanced Merchandise Store with AI Upscaling
 * 
 * Interactive component for creating print merchandise with intelligent
 * image quality enhancement and AI upscaling capabilities
 */

class EnhancedMerchandiseStore {
  constructor() {
    this.selectedImage = null;
    this.qualityAnalysis = null;
    this.enhancementPreview = null;
    this.selectedProductTypes = [];
    this.isAnalyzing = false;
    this.isCreating = false;
    
    this.init();
  }
  
  init() {
    this.createInterface();
    this.attachEventListeners();
    console.log('🎨 Enhanced Merchandise Store initialized with AI upscaling capabilities');
  }
  
  createInterface() {
    const container = document.getElementById('enhanced-merchandise-container');
    if (!container) {
      console.error('Enhanced merchandise container not found');
      return;
    }
    
    container.innerHTML = `
      <div class="enhanced-merchandise-store">
        <div class="store-header">
          <h2>🚀 AI-Enhanced Merchandise Creation</h2>
          <p>Transform your gallery images into high-quality print merchandise with intelligent AI upscaling</p>
        </div>
        
        <!-- Step 1: Image Selection & Analysis -->
        <div class="creation-step" id="step-image-selection">
          <div class="step-header">
            <span class="step-number">1</span>
            <h3>Select Image & Analyze Quality</h3>
          </div>
          
          <div class="image-selector">
            <div class="gallery-grid" id="gallery-images">
              <div class="loading-placeholder">Loading your gallery images...</div>
            </div>
          </div>
          
          <div class="image-analysis" id="image-analysis" style="display: none;">
            <div class="analysis-header">
              <h4>📊 Print Quality Analysis</h4>
              <div class="selected-image-preview" id="selected-image-preview"></div>
            </div>
            
            <div class="quality-metrics" id="quality-metrics"></div>
            <div class="enhancement-recommendation" id="enhancement-recommendation"></div>
            
            <div class="analysis-actions">
              <button class="btn btn-secondary" onclick="enhancedMerchandiseStore.changeImage()">
                Choose Different Image
              </button>
              <button class="btn btn-primary" onclick="enhancedMerchandiseStore.proceedToProductSelection()" id="proceed-btn">
                Continue to Product Selection
              </button>
            </div>
          </div>
        </div>
        
        <!-- Step 2: Product Type Selection -->
        <div class="creation-step" id="step-product-selection" style="display: none;">
          <div class="step-header">
            <span class="step-number">2</span>
            <h3>Choose Product Types</h3>
          </div>
          
          <div class="product-types-grid" id="product-types-grid"></div>
          
          <div class="selection-summary" id="selection-summary" style="display: none;">
            <h4>Selected Products:</h4>
            <div class="selected-products" id="selected-products"></div>
          </div>
          
          <div class="product-actions">
            <button class="btn btn-secondary" onclick="enhancedMerchandiseStore.backToImageSelection()">
              Back to Image Selection
            </button>
            <button class="btn btn-primary" onclick="enhancedMerchandiseStore.proceedToEnhancement()" id="proceed-enhancement-btn" disabled>
              Continue to Enhancement Options
            </button>
          </div>
        </div>
        
        <!-- Step 3: Enhancement Options -->
        <div class="creation-step" id="step-enhancement-options" style="display: none;">
          <div class="step-header">
            <span class="step-number">3</span>
            <h3>AI Enhancement Options</h3>
          </div>
          
          <div class="enhancement-options">
            <div class="enhancement-preview" id="enhancement-preview"></div>
            
            <div class="enhancement-settings">
              <div class="setting-group">
                <label for="content-type">Content Type:</label>
                <select id="content-type" onchange="enhancedMerchandiseStore.updateEnhancementPreview()">
                  <option value="illustration">Illustration/Artwork</option>
                  <option value="character">Character Portrait</option>
                  <option value="photo">Photograph</option>
                  <option value="artwork">Digital Art</option>
                </select>
              </div>
              
              <div class="setting-group">
                <label for="enhancement-method">Enhancement Method:</label>
                <select id="enhancement-method" onchange="enhancedMerchandiseStore.updateEnhancementPreview()">
                  <option value="auto">Auto (Recommended)</option>
                  <option value="openai">AI Artistic Enhancement</option>
                  <option value="replicate">Photo Enhancement</option>
                  <option value="sharp">Basic Upscaling</option>
                </select>
              </div>
              
              <div class="setting-group">
                <label for="style-preference">Style Preference:</label>
                <input type="text" id="style-preference" placeholder="e.g., anime, realistic, cartoon" 
                       onchange="enhancedMerchandiseStore.updateEnhancementPreview()">
              </div>
            </div>
          </div>
          
          <div class="enhancement-actions">
            <button class="btn btn-secondary" onclick="enhancedMerchandiseStore.backToProductSelection()">
              Back to Product Selection
            </button>
            <button class="btn btn-success" onclick="enhancedMerchandiseStore.createProducts()" id="create-products-btn">
              🚀 Create Enhanced Products
            </button>
          </div>
        </div>
        
        <!-- Step 4: Creation Progress -->
        <div class="creation-step" id="step-creation-progress" style="display: none;">
          <div class="step-header">
            <span class="step-number">4</span>
            <h3>Creating Your Enhanced Products</h3>
          </div>
          
          <div class="progress-container">
            <div class="progress-status" id="progress-status">
              Initializing AI enhancement...
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            
            <div class="creation-details" id="creation-details"></div>
          </div>
        </div>
        
        <!-- Step 5: Results -->
        <div class="creation-step" id="step-results" style="display: none;">
          <div class="step-header">
            <span class="step-number">5</span>
            <h3>✨ Products Created Successfully!</h3>
          </div>
          
          <div class="results-container">
            <div class="enhancement-summary" id="enhancement-summary"></div>
            <div class="created-products" id="created-products"></div>
            
            <div class="results-actions">
              <button class="btn btn-primary" onclick="enhancedMerchandiseStore.createMore()">
                Create More Products
              </button>
              <button class="btn btn-secondary" onclick="enhancedMerchandiseStore.viewProducts()">
                View All Products
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.loadGalleryImages();
    this.loadProductTypes();
  }
  
  attachEventListeners() {
    // Image selection event listeners are added dynamically
  }
  
  async loadGalleryImages() {
    try {
      const response = await fetch('/api/gallery/user-images', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.images) {
        this.displayGalleryImages(data.images);
      } else {
        this.showError('Failed to load gallery images');
      }
      
    } catch (error) {
      console.error('Error loading gallery images:', error);
      this.showError('Failed to load gallery images');
    }
  }
  
  displayGalleryImages(images) {
    const container = document.getElementById('gallery-images');
    
    if (images.length === 0) {
      container.innerHTML = `
        <div class="no-images">
          <p>No images found in your gallery.</p>
          <a href="/gallery" class="btn btn-primary">Upload Images</a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = images.map(image => `
      <div class="gallery-item" onclick="enhancedMerchandiseStore.selectImage('${image.id}', '${image.title}', '${image.url}', '${image.character || ''}')">
        <img src="${image.url}" alt="${image.title}" loading="lazy">
        <div class="image-info">
          <div class="image-title">${image.title}</div>
          ${image.character ? `<div class="image-character">${image.character}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
  
  async selectImage(imageId, title, url, character) {
    if (this.isAnalyzing) return;
    
    this.selectedImage = { id: imageId, title, url, character };
    this.isAnalyzing = true;
    
    // Show analysis interface
    document.getElementById('image-analysis').style.display = 'block';
    
    // Show selected image preview
    document.getElementById('selected-image-preview').innerHTML = `
      <img src="${url}" alt="${title}">
      <div class="image-details">
        <h5>${title}</h5>
        ${character ? `<p>Character: ${character}</p>` : ''}
      </div>
    `;
    
    // Show analyzing status
    document.getElementById('quality-metrics').innerHTML = `
      <div class="analyzing-status">
        <div class="spinner"></div>
        <p>Analyzing image quality for print suitability...</p>
      </div>
    `;
    
    try {
      // Analyze image quality
      const response = await fetch(`/api/enhanced-merchandise/preview-quality?imageId=${imageId}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.qualityAnalysis = data.qualityAssessment;
        this.displayQualityAnalysis(data.qualityAssessment);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('Error analyzing image quality:', error);
      this.showError('Failed to analyze image quality');
    } finally {
      this.isAnalyzing = false;
    }
  }
  
  displayQualityAnalysis(analysis) {
    const metricsContainer = document.getElementById('quality-metrics');
    const recommendationContainer = document.getElementById('enhancement-recommendation');
    
    // Display quality metrics
    metricsContainer.innerHTML = `
      <div class="quality-score ${analysis.analysis.suitableForPrint ? 'excellent' : 'needs-improvement'}">
        <div class="score-badge">
          ${analysis.analysis.suitableForPrint ? '✅ Excellent' : '⚠️ Needs Enhancement'}
        </div>
        <div class="score-details">
          <div class="metric">
            <span class="label">Dimensions:</span>
            <span class="value">${analysis.analysis.originalWidth}×${analysis.analysis.originalHeight}px</span>
          </div>
          <div class="metric">
            <span class="label">Estimated DPI:</span>
            <span class="value">${analysis.analysis.estimatedDPI}</span>
          </div>
          <div class="metric">
            <span class="label">Print Suitability:</span>
            <span class="value">${analysis.recommendations.printSuitability}</span>
          </div>
        </div>
      </div>
    `;
    
    // Display recommendations
    if (analysis.recommendations.recommendations.length > 0) {
      recommendationContainer.innerHTML = `
        <div class="enhancement-recommendations">
          <h5>💡 Recommendations:</h5>
          ${analysis.recommendations.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
              <div class="rec-header">
                <span class="rec-type">${rec.type.replace('-', ' ').toUpperCase()}</span>
                <span class="rec-priority priority-${rec.priority}">${rec.priority.toUpperCase()}</span>
              </div>
              <p class="rec-description">${rec.description}</p>
              <p class="rec-benefit"><strong>Benefit:</strong> ${rec.benefit}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      recommendationContainer.innerHTML = `
        <div class="no-recommendations">
          <p>✨ Your image is already optimized for high-quality printing!</p>
        </div>
      `;
    }
    
    // Enable proceed button
    document.getElementById('proceed-btn').disabled = false;
  }
  
  async loadProductTypes() {
    try {
      const response = await fetch('/api/merchandise/product-types');
      const data = await response.json();
      
      if (data.success) {
        this.productTypes = data.productTypes;
      }
    } catch (error) {
      console.error('Error loading product types:', error);
    }
  }
  
  proceedToProductSelection() {
    document.getElementById('step-image-selection').style.display = 'none';
    document.getElementById('step-product-selection').style.display = 'block';
    
    this.displayProductTypes();
  }
  
  displayProductTypes() {
    const container = document.getElementById('product-types-grid');
    
    const categories = {
      'apparel': { title: '👕 Apparel', products: ['t-shirt', 'hoodie', 'tank-top'] },
      'home': { title: '🏠 Home & Living', products: ['mug', 'poster', 'canvas'] },
      'accessories': { title: '🎒 Accessories', products: ['tote-bag', 'phone-case', 'sticker'] }
    };
    
    container.innerHTML = Object.entries(categories).map(([categoryKey, category]) => `
      <div class="product-category">
        <h4>${category.title}</h4>
        <div class="products-grid">
          ${category.products.map(productType => `
            <div class="product-type-card ${this.selectedProductTypes.includes(productType) ? 'selected' : ''}" 
                 onclick="enhancedMerchandiseStore.toggleProductType('${productType}')">
              <div class="product-icon">${this.getProductIcon(productType)}</div>
              <div class="product-name">${this.getProductName(productType)}</div>
              <div class="product-price">$${this.getProductPrice(productType)}</div>
              <div class="selection-indicator">
                ${this.selectedProductTypes.includes(productType) ? '✅' : '+'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
  
  toggleProductType(productType) {
    const index = this.selectedProductTypes.indexOf(productType);
    
    if (index > -1) {
      this.selectedProductTypes.splice(index, 1);
    } else {
      this.selectedProductTypes.push(productType);
    }
    
    this.updateProductSelection();
  }
  
  updateProductSelection() {
    // Update visual selection
    document.querySelectorAll('.product-type-card').forEach(card => {
      const productType = card.onclick.toString().match(/'([^']+)'/)[1];
      if (this.selectedProductTypes.includes(productType)) {
        card.classList.add('selected');
        card.querySelector('.selection-indicator').textContent = '✅';
      } else {
        card.classList.remove('selected');
        card.querySelector('.selection-indicator').textContent = '+';
      }
    });
    
    // Update selection summary
    const summaryContainer = document.getElementById('selection-summary');
    const proceedBtn = document.getElementById('proceed-enhancement-btn');
    
    if (this.selectedProductTypes.length > 0) {
      summaryContainer.style.display = 'block';
      document.getElementById('selected-products').innerHTML = this.selectedProductTypes
        .map(type => `<span class="selected-product">${this.getProductName(type)}</span>`)
        .join('');
      proceedBtn.disabled = false;
    } else {
      summaryContainer.style.display = 'none';
      proceedBtn.disabled = true;
    }
  }
  
  async proceedToEnhancement() {
    document.getElementById('step-product-selection').style.display = 'none';
    document.getElementById('step-enhancement-options').style.display = 'block';
    
    await this.loadEnhancementPreview();
  }
  
  async loadEnhancementPreview() {
    const previewContainer = document.getElementById('enhancement-preview');
    
    previewContainer.innerHTML = `
      <div class="loading-preview">
        <div class="spinner"></div>
        <p>Analyzing enhancement options...</p>
      </div>
    `;
    
    try {
      const response = await fetch('/api/enhanced-merchandise/preview-enhancement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageId: this.selectedImage.id,
          enhancementOptions: {
            contentType: 'illustration',
            character: this.selectedImage.character
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.enhancementPreview = data.enhancementPreview;
        this.displayEnhancementPreview(data.enhancementPreview);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('Error loading enhancement preview:', error);
      this.showError('Failed to load enhancement preview');
    }
  }
  
  displayEnhancementPreview(preview) {
    const container = document.getElementById('enhancement-preview');
    
    if (!preview.enhancementNeeded) {
      container.innerHTML = `
        <div class="no-enhancement-needed">
          <h4>✅ Image Quality Excellent</h4>
          <p>${preview.message}</p>
          <div class="current-specs">
            <div class="spec">
              <span class="label">Current Dimensions:</span>
              <span class="value">${preview.analysis.originalWidth}×${preview.analysis.originalHeight}px</span>
            </div>
            <div class="spec">
              <span class="label">Estimated DPI:</span>
              <span class="value">${preview.analysis.estimatedDPI}</span>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="enhancement-preview-content">
        <h4>🚀 Enhancement Preview</h4>
        
        <div class="before-after">
          <div class="current-image">
            <h5>Current Image</h5>
            <img src="${this.selectedImage.url}" alt="Current">
            <div class="image-specs">
              <div>${preview.preview.currentDimensions}</div>
              <div>DPI: ${preview.analysis.estimatedDPI}</div>
            </div>
          </div>
          
          <div class="enhancement-arrow">→</div>
          
          <div class="enhanced-preview">
            <h5>After AI Enhancement</h5>
            <div class="enhanced-placeholder">
              <div class="enhancement-icon">✨</div>
              <div class="enhancement-details">
                <div class="detail-row">
                  <span class="label">Target Dimensions:</span>
                  <span class="value">${preview.preview.targetDimensions}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Scale Factor:</span>
                  <span class="value">${preview.preview.scaleFactor}x</span>
                </div>
                <div class="detail-row">
                  <span class="label">Method:</span>
                  <span class="value">${preview.preview.method}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Quality Improvement:</span>
                  <span class="value">${preview.preview.printQualityImprovement}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  async updateEnhancementPreview() {
    // Placeholder for real-time preview updates
    console.log('Enhancement settings changed, updating preview...');
  }
  
  async createProducts() {
    if (this.isCreating) return;
    
    this.isCreating = true;
    
    // Show progress step
    document.getElementById('step-enhancement-options').style.display = 'none';
    document.getElementById('step-creation-progress').style.display = 'block';
    
    try {
      const enhancementOptions = {
        contentType: document.getElementById('content-type').value,
        method: document.getElementById('enhancement-method').value,
        style: document.getElementById('style-preference').value
      };
      
      const response = await fetch('/api/enhanced-merchandise/create-enhanced-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageId: this.selectedImage.id,
          productTypes: this.selectedProductTypes,
          enhancementOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showCreationResults(data);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('Error creating products:', error);
      this.showError('Failed to create enhanced products');
    } finally {
      this.isCreating = false;
    }
  }
  
  showCreationResults(results) {
    document.getElementById('step-creation-progress').style.display = 'none';
    document.getElementById('step-results').style.display = 'block';
    
    // Show enhancement summary
    const enhancementSummary = document.getElementById('enhancement-summary');
    if (results.imageEnhancement.enhanced) {
      enhancementSummary.innerHTML = `
        <div class="enhancement-success">
          <h4>✨ AI Enhancement Applied</h4>
          <div class="enhancement-details">
            <div class="detail">Method: ${results.imageEnhancement.metadata.method}</div>
            <div class="detail">Scale Factor: ${results.imageEnhancement.metadata.scaleFactor}x</div>
            <div class="detail">Quality: Optimized for print</div>
          </div>
        </div>
      `;
    } else {
      enhancementSummary.innerHTML = `
        <div class="no-enhancement">
          <h4>✅ Original Quality Maintained</h4>
          <p>Your image was already suitable for high-quality printing</p>
        </div>
      `;
    }
    
    // Show created products
    const productsContainer = document.getElementById('created-products');
    productsContainer.innerHTML = `
      <div class="products-results">
        <h4>Created Products (${results.successCount}/${results.totalCount})</h4>
        <div class="products-list">
          ${results.batchResults.map(result => `
            <div class="product-result ${result.success ? 'success' : 'error'}">
              <div class="product-name">${result.productType}</div>
              <div class="product-status">
                ${result.success ? '✅ Created' : '❌ Failed'}
              </div>
              ${result.productId ? `<div class="product-id">ID: ${result.productId}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Navigation methods
  changeImage() {
    this.selectedImage = null;
    this.qualityAnalysis = null;
    document.getElementById('image-analysis').style.display = 'none';
  }
  
  backToImageSelection() {
    document.getElementById('step-product-selection').style.display = 'none';
    document.getElementById('step-image-selection').style.display = 'block';
  }
  
  backToProductSelection() {
    document.getElementById('step-enhancement-options').style.display = 'none';
    document.getElementById('step-product-selection').style.display = 'block';
  }
  
  createMore() {
    // Reset and start over
    this.selectedImage = null;
    this.qualityAnalysis = null;
    this.selectedProductTypes = [];
    
    document.getElementById('step-results').style.display = 'none';
    document.getElementById('step-image-selection').style.display = 'block';
    document.getElementById('image-analysis').style.display = 'none';
  }
  
  viewProducts() {
    window.location.href = '/merchandise';
  }
  
  // Utility methods
  getProductIcon(productType) {
    const icons = {
      't-shirt': '👕',
      'hoodie': '🅿️',
      'tank-top': '🎽',
      'mug': '☕',
      'poster': '🖼️',
      'canvas': '🎨',
      'tote-bag': '🛍️',
      'phone-case': '📱',
      'sticker': '🏷️'
    };
    return icons[productType] || '📦';
  }
  
  getProductName(productType) {
    return productType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  getProductPrice(productType) {
    const prices = {
      't-shirt': '24.99',
      'hoodie': '39.99',
      'tank-top': '22.99',
      'mug': '16.99',
      'poster': '19.99',
      'canvas': '34.99',
      'tote-bag': '18.99',
      'phone-case': '21.99',
      'sticker': '4.99'
    };
    return prices[productType] || '19.99';
  }
  
  showError(message) {
    // Simple error display
    console.error(message);
    alert(message);
  }
}

// Initialize the enhanced merchandise store when the page loads
let enhancedMerchandiseStore;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('enhanced-merchandise-container')) {
    enhancedMerchandiseStore = new EnhancedMerchandiseStore();
  }
});