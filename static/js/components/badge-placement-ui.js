/**
 * BadgePlacementUI Component
 * 
 * Interactive badge placement interface for merchandise customization
 * Features:
 * - Drag & drop badge positioning
 * - Smart preset positions (corners, center)
 * - Size controls (small, medium, large)
 * - Real-time canvas preview
 * - Multi-badge support
 * - Responsive percentage-based coordinates
 * 
 * 🏆 INTEGRATION: Works with existing BadgeMerchandiseIntegrationService
 */

class BadgePlacementUI {
  constructor(options = {}) {
    this.containerId = options.containerId || 'badge-placement-container';
    this.imageUrl = options.imageUrl || null;
    this.availableBadges = options.availableBadges || [];
    this.onConfigChange = options.onConfigChange || (() => {});
    
    // Canvas and context
    this.canvas = null;
    this.ctx = null;
    this.previewImage = null;
    this.imageLoaded = false;
    
    // Badge placement state
    this.selectedBadges = []; // Array of placed badge configurations
    this.dragState = null;
    this.selectedBadgeIndex = -1;
    
    // UI state
    this.isInitialized = false;
    this.isDragging = false;
    
    // Configuration
    this.canvasSize = { width: 600, height: 400 };
    this.badgeSizes = {
      small: 0.08,   // 8% of image width
      medium: 0.12,  // 12% of image width  
      large: 0.18    // 18% of image width
    };
    
    // Preset positions (percentage-based for responsiveness)
    this.presetPositions = {
      'top-left': { x: 0.05, y: 0.05 },
      'top-right': { x: 0.85, y: 0.05 },
      'bottom-left': { x: 0.05, y: 0.85 },
      'bottom-right': { x: 0.85, y: 0.85 },
      'center': { x: 0.42, y: 0.42 },
      'top-center': { x: 0.42, y: 0.05 },
      'bottom-center': { x: 0.42, y: 0.85 }
    };
    
    console.log('🏆 BadgePlacementUI constructor initialized');
  }
  
  /**
   * Initialize the badge placement interface
   */
  async init() {
    try {
      console.log('🏆 Initializing BadgePlacementUI...');
      
      this.renderUI();
      await this.initializeCanvas();
      this.setupEventListeners();
      await this.loadAvailableBadges();
      
      this.isInitialized = true;
      console.log('✅ BadgePlacementUI initialized successfully');
      
    } catch (error) {
      console.error('❌ BadgePlacementUI initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Render the main UI structure
   */
  renderUI() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container ${this.containerId} not found`);
    }
    
    container.innerHTML = `
      <div class="badge-placement-interface">
        <!-- Header -->
        <div class="badge-placement-header">
          <h3>🏆 Badge Placement Designer</h3>
          <p>Add your earned badges to your merchandise design</p>
        </div>
        
        <!-- Main Content -->
        <div class="badge-placement-content">
          <!-- Left Panel: Badge Library -->
          <div class="badge-library-panel">
            <h4>Available Badges</h4>
            <div class="available-badges-grid" id="available-badges-grid">
              <div class="loading-badges">Loading your badges...</div>
            </div>
            
            <div class="badge-controls">
              <h4>Badge Size</h4>
              <div class="size-controls">
                <label><input type="radio" name="badge-size" value="small"> Small</label>
                <label><input type="radio" name="badge-size" value="medium" checked> Medium</label>
                <label><input type="radio" name="badge-size" value="large"> Large</label>
              </div>
            </div>
            
            <div class="preset-positions">
              <h4>Quick Positions</h4>
              <div class="position-presets">
                <button class="preset-btn" data-position="top-left">↖ Top Left</button>
                <button class="preset-btn" data-position="top-center">↑ Top Center</button>
                <button class="preset-btn" data-position="top-right">↗ Top Right</button>
                <button class="preset-btn" data-position="center">⊙ Center</button>
                <button class="preset-btn" data-position="bottom-left">↙ Bottom Left</button>
                <button class="preset-btn" data-position="bottom-center">↓ Bottom Center</button>
                <button class="preset-btn" data-position="bottom-right">↘ Bottom Right</button>
              </div>
            </div>
          </div>
          
          <!-- Center Panel: Canvas Preview -->
          <div class="canvas-preview-panel">
            <h4>Design Preview</h4>
            <div class="canvas-container">
              <canvas id="badge-preview-canvas" width="600" height="400"></canvas>
              <div class="canvas-overlay" id="canvas-overlay">
                <div class="canvas-instructions">
                  <p>🎯 Drag badges from the left panel onto your image</p>
                  <p>📐 Use preset positions or drag to customize placement</p>
                  <p>🔧 Click badges to select and adjust</p>
                </div>
              </div>
            </div>
            
            <div class="canvas-controls">
              <button class="btn btn-secondary" id="clear-all-badges">🗑️ Clear All</button>
              <button class="btn btn-primary" id="preview-final">👁️ Preview Final</button>
            </div>
          </div>
          
          <!-- Right Panel: Placed Badges -->
          <div class="placed-badges-panel">
            <h4>Placed Badges</h4>
            <div class="placed-badges-list" id="placed-badges-list">
              <div class="no-badges-placed">
                <p>No badges placed yet</p>
                <p class="help-text">Drag badges from the left panel to get started</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="badge-placement-footer">
          <div class="placement-summary">
            <span id="badge-count">0 badges placed</span>
          </div>
          <div class="action-buttons">
            <button class="btn btn-secondary" id="reset-placement">↺ Reset</button>
            <button class="btn btn-success" id="apply-badges">✨ Apply Badges</button>
          </div>
        </div>
      </div>
    `;
    
    console.log('✅ Badge placement UI rendered');
  }
  
  /**
   * Initialize the canvas for preview
   */
  async initializeCanvas() {
    this.canvas = document.getElementById('badge-preview-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    if (this.imageUrl) {
      await this.loadPreviewImage();
    } else {
      this.drawPlaceholder();
    }
  }
  
  /**
   * Load the base image for preview
   */
  async loadPreviewImage() {
    return new Promise((resolve, reject) => {
      this.previewImage = new Image();
      this.previewImage.crossOrigin = 'anonymous';
      
      this.previewImage.onload = () => {
        this.imageLoaded = true;
        this.drawCanvas();
        resolve();
      };
      
      this.previewImage.onerror = (error) => {
        console.error('Failed to load preview image:', error);
        this.drawPlaceholder();
        resolve(); // Don't reject, just use placeholder
      };
      
      this.previewImage.src = this.imageUrl;
    });
  }
  
  /**
   * Draw placeholder when no image is loaded
   */
  drawPlaceholder() {
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#999';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Image Preview', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.fillText('Load an image to see badge placement', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  /**
   * Draw the complete canvas with image and badges
   */
  drawCanvas() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw base image if loaded
    if (this.imageLoaded && this.previewImage) {
      this.ctx.drawImage(this.previewImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.drawPlaceholder();
    }
    
    // Draw all placed badges
    this.selectedBadges.forEach((badgeConfig, index) => {
      this.drawBadge(badgeConfig, index === this.selectedBadgeIndex);
    });
    
    // Hide/show instructions overlay
    const overlay = document.getElementById('canvas-overlay');
    if (overlay) {
      overlay.style.display = this.selectedBadges.length > 0 ? 'none' : 'flex';
    }
  }
  
  /**
   * Draw a single badge on the canvas
   */
  drawBadge(badgeConfig, isSelected = false) {
    const { badge, position, size } = badgeConfig;
    
    // Calculate actual pixel position from percentage
    const x = position.x * this.canvas.width;
    const y = position.y * this.canvas.height;
    
    // Calculate badge size in pixels
    const badgeSize = this.badgeSizes[size] * this.canvas.width;
    
    // Draw selection indicator if selected
    if (isSelected) {
      this.ctx.strokeStyle = '#3498db';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.strokeRect(x - 5, y - 5, badgeSize + 10, badgeSize + 10);
      this.ctx.setLineDash([]); // Reset line dash
    }
    
    // Draw badge image if available
    if (badge.imageElement) {
      this.ctx.drawImage(badge.imageElement, x, y, badgeSize, badgeSize);
    } else {
      // Draw placeholder badge
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.beginPath();
      this.ctx.arc(x + badgeSize/2, y + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Draw badge name
      this.ctx.fillStyle = '#fff';
      this.ctx.font = `${Math.max(12, badgeSize/8)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(badge.name.substring(0, 8), x + badgeSize/2, y + badgeSize/2 + 4);
    }
  }
  
  /**
   * Setup event listeners for interactions
   */
  setupEventListeners() {
    // Canvas interactions
    this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    
    // Preset position buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const position = e.target.dataset.position;
        this.applyPresetPosition(position);
      });
    });
    
    // Size controls
    document.querySelectorAll('input[name="badge-size"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateSelectedBadgeSize(e.target.value);
      });
    });
    
    // Action buttons
    document.getElementById('clear-all-badges')?.addEventListener('click', this.clearAllBadges.bind(this));
    document.getElementById('preview-final')?.addEventListener('click', this.showFinalPreview.bind(this));
    document.getElementById('reset-placement')?.addEventListener('click', this.resetPlacement.bind(this));
    document.getElementById('apply-badges')?.addEventListener('click', this.applyBadges.bind(this));
  }
  
  /**
   * Load available badges from the server
   */
  async loadAvailableBadges() {
    try {
      console.log('🏆 Loading available badges...');
      
      // Try demo endpoint first, then fall back to authenticated endpoint
      let response;
      try {
        response = await fetch('/merchandise/badge-collection-demo', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (demoError) {
        console.log('🔄 Demo endpoint failed, trying authenticated endpoint...');
        response = await fetch('/api/merchandise/badge-collection', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load badges: ${response.statusText}`);
      }
      
      const badgeData = await response.json();
      
      if (badgeData.success && badgeData.badges) {
        this.availableBadges = badgeData.badges;
        await this.renderAvailableBadges();
        console.log(`✅ Loaded ${this.availableBadges.length} available badges`);
      } else {
        console.warn('No badges available or API error:', badgeData.error);
        this.renderNoBadges();
      }
      
    } catch (error) {
      console.error('❌ Failed to load available badges:', error);
      this.renderBadgeError();
    }
  }
  
  /**
   * Render the available badges grid
   */
  async renderAvailableBadges() {
    const grid = document.getElementById('available-badges-grid');
    if (!grid) return;
    
    if (this.availableBadges.length === 0) {
      grid.innerHTML = `
        <div class="no-badges-available">
          <p>🎯 No badges earned yet</p>
          <p class="help-text">Complete NPC quests to earn badges!</p>
        </div>
      `;
      return;
    }
    
    // Create badge elements
    const badgeElements = await Promise.all(
      this.availableBadges.map(async (badge) => {
        // Preload badge image
        const imageElement = await this.loadBadgeImage(badge.image);
        badge.imageElement = imageElement;
        
        return `
          <div class="available-badge" data-badge-id="${badge.id}" draggable="true">
            <img src="${badge.image}" alt="${badge.name}" class="badge-image">
            <div class="badge-info">
              <div class="badge-name">${badge.name}</div>
              <div class="badge-description">${badge.description || 'Achievement badge'}</div>
            </div>
          </div>
        `;
      })
    );
    
    grid.innerHTML = badgeElements.join('');
    
    // Add drag and drop listeners
    document.querySelectorAll('.available-badge').forEach(badgeEl => {
      badgeEl.addEventListener('dragstart', this.handleBadgeDragStart.bind(this));
      badgeEl.addEventListener('click', this.handleBadgeClick.bind(this));
    });
    
    // Make canvas a drop target
    this.canvas.addEventListener('dragover', this.handleCanvasDragOver.bind(this));
    this.canvas.addEventListener('drop', this.handleCanvasDrop.bind(this));
  }
  
  /**
   * Load badge image and return Image element
   */
  loadBadgeImage(imageSrc) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load badge image: ${imageSrc}`);
        resolve(null);
      };
      
      img.src = imageSrc;
    });
  }
  
  /**
   * Render no badges message
   */
  renderNoBadges() {
    const grid = document.getElementById('available-badges-grid');
    if (!grid) return;
    
    grid.innerHTML = `
      <div class="no-badges-available">
        <p>🎯 No badges earned yet</p>
        <p class="help-text">Complete NPC quests to unlock badges for your merchandise!</p>
        <button class="btn btn-primary btn-sm" onclick="window.location.href='/#npc-quests'">
          🚀 Start Quest
        </button>
      </div>
    `;
  }
  
  /**
   * Render badge loading error
   */
  displayBadgeError() {
    const grid = document.getElementById('available-badges-grid');
    if (!grid) return;
    
    grid.innerHTML = `
      <div class="badge-error">
        <p>❌ Failed to load badges</p>
        <button class="btn btn-secondary btn-sm" id="retry-load-badges">
          🔄 Retry
        </button>
      </div>
    `;
    
    // Bind retry button with proper context
    const retryButton = document.getElementById('retry-load-badges');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadAvailableBadges();
      });
    }
  }
  
  /**
   * Handle badge drag start
   */
  handleBadgeDragStart(e) {
    const badgeId = e.target.closest('.available-badge').dataset.badgeId;
    e.dataTransfer.setData('text/plain', badgeId);
    console.log('🏆 Started dragging badge:', badgeId);
  }
  
  /**
   * Handle canvas drag over
   */
  handleCanvasDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  
  /**
   * Handle badge drop on canvas
   */
  handleCanvasDrop(e) {
    e.preventDefault();
    
    const badgeId = e.dataTransfer.getData('text/plain');
    const badge = this.availableBadges.find(b => b.id === badgeId);
    
    if (!badge) {
      console.error('Badge not found:', badgeId);
      return;
    }
    
    // Calculate drop position as percentage
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvas.width;
    const y = (e.clientY - rect.top) / this.canvas.height;
    
    // Get selected size
    const selectedSize = document.querySelector('input[name="badge-size"]:checked')?.value || 'medium';
    
    this.addBadge(badge, { x, y }, selectedSize);
  }
  
  /**
   * Handle badge click (add to center)
   */
  handleBadgeClick(e) {
    const badgeId = e.target.closest('.available-badge').dataset.badgeId;
    const badge = this.availableBadges.find(b => b.id === badgeId);
    
    if (!badge) return;
    
    const selectedSize = document.querySelector('input[name="badge-size"]:checked')?.value || 'medium';
    this.addBadge(badge, this.presetPositions.center, selectedSize);
  }
  
  /**
   * Add a badge to the canvas
   */
  addBadge(badge, position, size) {
    const badgeConfig = {
      badge: badge,
      position: { ...position },
      size: size,
      id: `${badge.id}_${Date.now()}`
    };
    
    this.selectedBadges.push(badgeConfig);
    this.selectedBadgeIndex = this.selectedBadges.length - 1;
    
    this.drawCanvas();
    this.updatePlacedBadgesList();
    this.updateBadgeCount();
    this.onConfigChange(this.getBadgeConfiguration());
    
    console.log('🏆 Added badge:', badge.name, 'at position:', position);
  }
  
  /**
   * Apply preset position to selected badge
   */
  applyPresetPosition(positionKey) {
    if (this.selectedBadgeIndex < 0 || this.selectedBadgeIndex >= this.selectedBadges.length) {
      console.warn('No badge selected for preset position');
      return;
    }
    
    const position = this.presetPositions[positionKey];
    if (!position) {
      console.error('Invalid preset position:', positionKey);
      return;
    }
    
    this.selectedBadges[this.selectedBadgeIndex].position = { ...position };
    this.drawCanvas();
    this.onConfigChange(this.getBadgeConfiguration());
    
    console.log('🏆 Applied preset position:', positionKey);
  }
  
  /**
   * Update selected badge size
   */
  updateSelectedBadgeSize(newSize) {
    if (this.selectedBadgeIndex < 0 || this.selectedBadgeIndex >= this.selectedBadges.length) {
      return;
    }
    
    this.selectedBadges[this.selectedBadgeIndex].size = newSize;
    this.drawCanvas();
    this.onConfigChange(this.getBadgeConfiguration());
  }
  
  /**
   * Handle canvas mouse down (start dragging)
   */
  handleCanvasMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvas.width;
    const y = (e.clientY - rect.top) / this.canvas.height;
    
    // Find badge at click position
    const clickedBadgeIndex = this.findBadgeAtPosition(x, y);
    
    if (clickedBadgeIndex >= 0) {
      this.selectedBadgeIndex = clickedBadgeIndex;
      this.isDragging = true;
      this.dragState = {
        startX: x,
        startY: y,
        initialPosition: { ...this.selectedBadges[clickedBadgeIndex].position }
      };
      
      this.drawCanvas();
      this.updatePlacedBadgesList();
    }
  }
  
  /**
   * Handle canvas mouse move (dragging)
   */
  handleCanvasMouseMove(e) {
    if (!this.isDragging || this.selectedBadgeIndex < 0) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvas.width;
    const y = (e.clientY - rect.top) / this.canvas.height;
    
    // Update badge position
    this.selectedBadges[this.selectedBadgeIndex].position = {
      x: Math.max(0, Math.min(0.9, x)), // Keep within canvas bounds
      y: Math.max(0, Math.min(0.9, y))
    };
    
    this.drawCanvas();
    this.onConfigChange(this.getBadgeConfiguration());
  }
  
  /**
   * Handle canvas mouse up (stop dragging)
   */
  handleCanvasMouseUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragState = null;
      console.log('🏆 Finished dragging badge');
    }
  }
  
  /**
   * Handle canvas click (select badge)
   */
  handleCanvasClick(e) {
    if (this.isDragging) return; // Don't select if we were dragging
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvas.width;
    const y = (e.clientY - rect.top) / this.canvas.height;
    
    const clickedBadgeIndex = this.findBadgeAtPosition(x, y);
    
    if (clickedBadgeIndex >= 0) {
      this.selectedBadgeIndex = clickedBadgeIndex;
      this.drawCanvas();
      this.updatePlacedBadgesList();
      
      // Update size radio to match selected badge
      const badgeSize = this.selectedBadges[clickedBadgeIndex].size;
      const sizeRadio = document.querySelector(`input[name="badge-size"][value="${badgeSize}"]`);
      if (sizeRadio) sizeRadio.checked = true;
    } else {
      this.selectedBadgeIndex = -1;
      this.drawCanvas();
      this.updatePlacedBadgesList();
    }
  }
  
  /**
   * Find badge at given position
   */
  findBadgeAtPosition(x, y) {
    // Check badges in reverse order (last placed = on top)
    for (let i = this.selectedBadges.length - 1; i >= 0; i--) {
      const badge = this.selectedBadges[i];
      const badgeX = badge.position.x;
      const badgeY = badge.position.y;
      const badgeSize = this.badgeSizes[badge.size];
      
      if (x >= badgeX && x <= badgeX + badgeSize &&
          y >= badgeY && y <= badgeY + badgeSize) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Update the placed badges list UI
   */
  updatePlacedBadgesList() {
    const list = document.getElementById('placed-badges-list');
    if (!list) return;
    
    if (this.selectedBadges.length === 0) {
      list.innerHTML = `
        <div class="no-badges-placed">
          <p>No badges placed yet</p>
          <p class="help-text">Drag badges from the left panel to get started</p>
        </div>
      `;
      return;
    }
    
    const badgeItems = this.selectedBadges.map((badgeConfig, index) => `
      <div class="placed-badge-item ${index === this.selectedBadgeIndex ? 'selected' : ''}" data-index="${index}">
        <img src="${badgeConfig.badge.image}" alt="${badgeConfig.badge.name}" class="badge-thumbnail">
        <div class="badge-details">
          <div class="badge-name">${badgeConfig.badge.name}</div>
          <div class="badge-position">
            ${(badgeConfig.position.x * 100).toFixed(0)}%, ${(badgeConfig.position.y * 100).toFixed(0)}%
          </div>
          <div class="badge-size">Size: ${badgeConfig.size}</div>
        </div>
        <button class="remove-badge-btn" data-index="${index}" title="Remove badge">×</button>
      </div>
    `).join('');
    
    list.innerHTML = badgeItems;
    
    // Add click handlers for placed badge items
    list.querySelectorAll('.placed-badge-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectedBadgeIndex = index;
        this.drawCanvas();
        this.updatePlacedBadgesList();
      });
    });
    
    // Add remove handlers
    list.querySelectorAll('.remove-badge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        this.removeBadge(index);
      });
    });
  }
  
  /**
   * Remove a badge by index
   */
  removeBadge(index) {
    if (index < 0 || index >= this.selectedBadges.length) return;
    
    this.selectedBadges.splice(index, 1);
    
    // Adjust selected index if needed
    if (this.selectedBadgeIndex >= index) {
      this.selectedBadgeIndex = Math.max(-1, this.selectedBadgeIndex - 1);
    }
    
    this.drawCanvas();
    this.updatePlacedBadgesList();
    this.updateBadgeCount();
    this.onConfigChange(this.getBadgeConfiguration());
    
    console.log('🏆 Removed badge at index:', index);
  }
  
  /**
   * Update badge count display
   */
  updateBadgeCount() {
    const countEl = document.getElementById('badge-count');
    if (countEl) {
      const count = this.selectedBadges.length;
      countEl.textContent = `${count} badge${count !== 1 ? 's' : ''} placed`;
    }
  }
  
  /**
   * Clear all badges
   */
  clearAllBadges() {
    this.selectedBadges = [];
    this.selectedBadgeIndex = -1;
    this.drawCanvas();
    this.updatePlacedBadgesList();
    this.updateBadgeCount();
    this.onConfigChange(this.getBadgeConfiguration());
    
    console.log('🏆 Cleared all badges');
  }
  
  /**
   * Show final preview modal
   */
  async showFinalPreview() {
    console.log('🏆 Generating final preview with badges...');
    console.log('📊 Selected badges:', this.selectedBadges.length);
    
    // Create a temporary canvas for full resolution preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 800;
    previewCanvas.height = 600;
    const previewCtx = previewCanvas.getContext('2d');
    
    // Draw high-res background image
    if (this.imageLoaded && this.previewImage) {
      previewCtx.drawImage(this.previewImage, 0, 0, previewCanvas.width, previewCanvas.height);
      console.log('✅ Background image drawn');
    } else {
      // Fill with placeholder background
      previewCtx.fillStyle = '#f0f0f0';
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.fillStyle = '#666';
      previewCtx.font = '24px Arial';
      previewCtx.textAlign = 'center';
      previewCtx.fillText('No Background Image', previewCanvas.width / 2, previewCanvas.height / 2);
      console.log('⚠️ No background image, using placeholder');
    }
    
    // Draw badges at higher resolution - ensure images are loaded
    const badgePromises = this.selectedBadges.map(async (badgeConfig, index) => {
      const { badge, position, size } = badgeConfig;
      const x = position.x * previewCanvas.width;
      const y = position.y * previewCanvas.height;
      const badgeSize = this.badgeSizes[size] * previewCanvas.width;
      
      console.log(`🏆 Processing badge ${index + 1}:`, badge.name, `at (${x.toFixed(0)}, ${y.toFixed(0)}) size ${badgeSize.toFixed(0)}px`);
      
      // Create or use existing image element
      let imageElement = badge.imageElement;
      
      if (!imageElement || imageElement.src !== badge.image) {
        console.log(`🔄 Loading image for badge: ${badge.name}`);
        imageElement = new Image();
        imageElement.crossOrigin = 'anonymous';
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          imageElement.onload = () => {
            console.log(`✅ Badge image loaded: ${badge.name}`);
            resolve();
          };
          imageElement.onerror = () => {
            console.error(`❌ Failed to load badge image: ${badge.name}`);
            reject(new Error(`Failed to load badge image: ${badge.name}`));
          };
          imageElement.src = badge.image;
        });
        
        // Cache the loaded image
        badge.imageElement = imageElement;
      }
      
      // Draw the badge
      try {
        previewCtx.drawImage(imageElement, x, y, badgeSize, badgeSize);
        console.log(`✅ Badge drawn: ${badge.name}`);
        
        // Add badge border for better visibility
        previewCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        previewCtx.lineWidth = 2;
        previewCtx.strokeRect(x, y, badgeSize, badgeSize);
        
      } catch (error) {
        console.error(`❌ Error drawing badge ${badge.name}:`, error);
        
        // Draw placeholder for failed badge
        previewCtx.fillStyle = '#ff4444';
        previewCtx.fillRect(x, y, badgeSize, badgeSize);
        previewCtx.fillStyle = 'white';
        previewCtx.font = '16px Arial';
        previewCtx.textAlign = 'center';
        previewCtx.fillText('❌', x + badgeSize/2, y + badgeSize/2);
      }
    });
    
    // Wait for all badges to be processed
    try {
      await Promise.all(badgePromises);
      console.log('✅ All badges processed for final preview');
    } catch (error) {
      console.error('⚠️ Some badges failed to load:', error);
    }
    
    // Show in modal
    const modalHtml = `
      <div class="modal fade" id="badge-preview-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">🏆 Final Preview</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <canvas id="final-preview-canvas" style="max-width: 100%; border: 1px solid #ddd;"></canvas>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-success" onclick="document.getElementById('apply-badges').click(); bootstrap.Modal.getInstance(document.getElementById('badge-preview-modal')).hide();">
                ✨ Apply This Design
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM temporarily
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('badge-preview-modal'));
    
    // Copy canvas content
    const finalCanvas = document.getElementById('final-preview-canvas');
    finalCanvas.width = previewCanvas.width;
    finalCanvas.height = previewCanvas.height;
    finalCanvas.getContext('2d').drawImage(previewCanvas, 0, 0);
    
    // Clean up on close
    document.getElementById('badge-preview-modal').addEventListener('hidden.bs.modal', () => {
      document.getElementById('badge-preview-modal').remove();
    });
    
    modal.show();
  }
  
  /**
   * Reset placement to initial state
   */
  resetPlacement() {
    if (confirm('Reset all badge placements? This cannot be undone.')) {
      this.clearAllBadges();
    }
  }
  
  /**
   * Apply badges (final action)
   */
  applyBadges() {
    const config = this.getBadgeConfiguration();
    
    if (config.badges.length === 0) {
      alert('Please place at least one badge before applying.');
      return;
    }
    
    console.log('🏆 Applying badge configuration:', config);
    this.onConfigChange(config, true); // true = final application
  }
  
  /**
   * Get current badge configuration for server
   */
  getBadgeConfiguration() {
    return {
      badges: this.selectedBadges.map(badgeConfig => ({
        badgeId: badgeConfig.badge.id,
        position: { ...badgeConfig.position },
        size: badgeConfig.size,
        badge: {
          id: badgeConfig.badge.id,
          name: badgeConfig.badge.name,
          image: badgeConfig.badge.image
        }
      })),
      canvasSize: { ...this.canvasSize },
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update image for preview
   */
  async updateImage(imageUrl) {
    this.imageUrl = imageUrl;
    this.imageLoaded = false;
    
    if (imageUrl) {
      await this.loadPreviewImage();
    } else {
      this.drawPlaceholder();
    }
    
    this.drawCanvas();
  }
  
  /**
   * Get placement summary for display
   */
  getPlacementSummary() {
    return {
      badgeCount: this.selectedBadges.length,
      badges: this.selectedBadges.map(b => ({
        name: b.badge.name,
        position: `${(b.position.x * 100).toFixed(0)}%, ${(b.position.y * 100).toFixed(0)}%`,
        size: b.size
      }))
    };
  }
}

// Global access for debugging and integration
if (typeof window !== 'undefined') {
  window.BadgePlacementUI = BadgePlacementUI;
  console.log('🏆 BadgePlacementUI class loaded and available globally');
}