/**
 * 🔍 Wavelength Lightbox Component
 * 
 * Provides image lightbox/zoom functionality for product previews
 * - Click to zoom product images
 * - Smooth fade animations  
 * - Keyboard support (ESC to close)
 * - Touch/click outside to close
 * - Mobile responsive
 */

class WavelengthLightbox {
  constructor() {
    this.lightboxElement = null;
    this.isActive = false;
    this.init();
  }

  /**
   * Initialize lightbox functionality
   */
  init() {
    this.createLightboxElement();
    this.bindEvents();
    console.log('🔍 Wavelength Lightbox initialized');
  }

  /**
   * Create the lightbox DOM element
   */
  createLightboxElement() {
    // Remove existing lightbox if present
    const existing = document.getElementById('wavelength-lightbox');
    if (existing) {
      existing.remove();
    }

    // Create lightbox HTML
    const lightboxHTML = `
      <div id="wavelength-lightbox" class="lightbox-overlay">
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close lightbox">×</button>
          <img class="lightbox-image" src="" alt="" />
          <div class="lightbox-info">
            <div class="lightbox-title"></div>
            <div class="lightbox-subtitle"></div>
          </div>
        </div>
      </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    this.lightboxElement = document.getElementById('wavelength-lightbox');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.lightboxElement) return;

    // Close button
    const closeBtn = this.lightboxElement.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', () => this.closeLightbox());

    // Click outside content to close
    this.lightboxElement.addEventListener('click', (e) => {
      if (e.target === this.lightboxElement) {
        this.closeLightbox();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.closeLightbox();
      }
    });

    // Event delegation for zoomable images (handles dynamically added images)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('zoomable-image') || e.target.classList.contains('gorgeous-mockup-image') || e.target.classList.contains('preview-image')) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔍 Lightbox click detected on:', e.target.className);
        
        // Extract title and subtitle
        let title = 'Product Preview';
        let subtitle = 'Click outside or press ESC to close';
        
        if (e.target.classList.contains('gorgeous-mockup-image')) {
          const productCard = e.target.closest('.product-card');
          title = productCard?.querySelector('.product-title')?.textContent || 'Product Preview';
          const productType = productCard?.querySelector('.product-type-name')?.textContent || '';
          subtitle = productType || 'Product Image';
        } else if (e.target.classList.contains('preview-image')) {
          const modal = e.target.closest('.modal');
          title = modal?.querySelector('.modal-title')?.textContent || 'Product Preview';
          subtitle = 'Customization Preview';
        }
        
        this.openLightbox(e.target.src, title, subtitle);
      }
    });
  }

  /**
   * Open lightbox with image
   * @param {string} imageSrc - Image source URL
   * @param {string} title - Image title
   * @param {string} subtitle - Image subtitle
   */
  openLightbox(imageSrc, title = '', subtitle = '') {
    if (!this.lightboxElement || !imageSrc) {
      console.warn('❌ Cannot open lightbox: missing element or image source');
      return;
    }

    console.log(`🔍 Opening lightbox for: ${title || 'Image'}`);

    // Set image and info
    const lightboxImage = this.lightboxElement.querySelector('.lightbox-image');
    const lightboxTitle = this.lightboxElement.querySelector('.lightbox-title');
    const lightboxSubtitle = this.lightboxElement.querySelector('.lightbox-subtitle');

    lightboxImage.src = imageSrc;
    lightboxImage.alt = title || 'Product Preview';
    lightboxTitle.textContent = title;
    lightboxSubtitle.textContent = subtitle;

    // Show lightbox
    this.lightboxElement.classList.add('active');
    this.isActive = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Add fade-in animation
    setTimeout(() => {
      if (this.lightboxElement) {
        this.lightboxElement.style.opacity = '1';
      }
    }, 10);
  }

  /**
   * Close lightbox
   */
  closeLightbox() {
    if (!this.lightboxElement || !this.isActive) return;

    console.log('🔍 Closing lightbox');

    // Hide lightbox
    this.lightboxElement.classList.remove('active');
    this.isActive = false;
    document.body.style.overflow = ''; // Restore scrolling

    // Clear image after animation
    setTimeout(() => {
      if (this.lightboxElement) {
        const lightboxImage = this.lightboxElement.querySelector('.lightbox-image');
        lightboxImage.src = '';
      }
    }, 300);
  }

  /**
   * Make images zoomable by adding click handlers
   * @param {string} selector - CSS selector for images to make zoomable
   * @param {Function} titleExtractor - Optional function to extract title from image element
   * @param {Function} subtitleExtractor - Optional function to extract subtitle from image element
   */
  makeImagesZoomable(selector, titleExtractor = null, subtitleExtractor = null) {
    const images = document.querySelectorAll(selector);
    
    images.forEach(img => {
      // Add zoomable class for cursor styling
      img.classList.add('zoomable-image');
      
      // Add click handler
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const title = titleExtractor ? titleExtractor(img) : img.alt || 'Product Preview';
        const subtitle = subtitleExtractor ? subtitleExtractor(img) : '';
        
        this.openLightbox(img.src, title, subtitle);
      });
    });

    console.log(`🔍 Made ${images.length} images zoomable with selector: ${selector}`);
  }

  /**
   * Remove zoomable functionality from images
   * @param {string} selector - CSS selector for images
   */
  removeZoomable(selector) {
    const images = document.querySelectorAll(selector);
    
    images.forEach(img => {
      img.classList.remove('zoomable-image');
      // Note: We can't easily remove the specific click handler without a reference,
      // but adding the class check prevents conflicts
    });
  }
}

// Auto-initialize and make globally available
let wavelengthLightbox;

document.addEventListener('DOMContentLoaded', () => {
  wavelengthLightbox = new WavelengthLightbox();
  
  // Make it globally available
  window.WavelengthLightbox = wavelengthLightbox;
  
  console.log('🔍 Wavelength Lightbox ready - will handle clicks on .gorgeous-mockup-image and .preview-image elements');
  
  // Apply zoomable styling to any existing images
  wavelengthLightbox.applyCursorStyling();
  
  // Re-apply styling periodically for dynamically loaded images
  setInterval(() => {
    wavelengthLightbox.applyCursorStyling();
  }, 2000);
});

// Helper method to apply cursor styling to zoomable images
WavelengthLightbox.prototype.applyCursorStyling = function() {
  const selectors = ['.gorgeous-mockup-image', '.preview-image'];
  selectors.forEach(selector => {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (!img.classList.contains('zoomable-image')) {
        img.classList.add('zoomable-image');
      }
    });
  });
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WavelengthLightbox;
}