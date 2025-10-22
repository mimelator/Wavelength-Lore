/**
 * Image Capturer Class
 * 
 * This class adds "Save to Gallery" buttons to images on the website.
 */

class ImageCapturer {
  /**
   * Initialize the image capturer
   * @param {Object} options - Configuration options
   * @param {boolean} options.requireAuth - Whether authentication is required to save images
   * @param {Function} options.onCapture - Callback function when an image is captured
   * @param {Function} options.onAuthNeeded - Callback function when auth is needed but user is not logged in
   */
  constructor(options = {}) {
    this.options = {
      requireAuth: true,           // Require authentication to save images
      captureButtonPosition: 'top-right', // Position of capture button
      minImageSize: 100,           // Minimum image size to add capture button
      onCapture: null,             // Callback when an image is captured
      onAuthNeeded: null,          // Callback when authentication is needed
      excludeSelectors: [],        // Selectors to exclude from capture
      ...options
    };
    
    this.captureButtons = [];      // Track buttons added to the page
    this.enabled = false;          // Is the capturer enabled
    
    // Bind methods
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    this.processPage = this.processPage.bind(this);
    this.addCaptureButtonToImage = this.addCaptureButtonToImage.bind(this);
    this.handleCaptureClick = this.handleCaptureClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
  }
  
  /**
   * Enable the image capturer
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    
    console.log("🖼️ Image Capturer: Enabling capture buttons");
    
    // Process the page now
    this.processPage();
    
    // Create mutation observer to detect new images
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) {
        this.processPage();
      }
    });
    
    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Image Capturer: Enabled');
  }
  
  /**
   * Disable the image capturer
   */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    
    // Stop the observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Remove all buttons
    this.cleanupButtons();
    
    console.log('❌ Image Capturer: Disabled');
  }
  
  /**
   * Process the page to find images and add capture buttons
   */
  processPage() {
    if (!this.enabled) return;
    
    console.log('🔍 Image Capturer: Processing page for images');
    
    // Find all images that meet our criteria
    const images = Array.from(document.querySelectorAll('img')).filter(img => {
      // Skip small images
      if (img.naturalWidth < this.options.minImageSize || 
          img.naturalHeight < this.options.minImageSize) {
        return false;
      }
      
      // Skip images with excluded selectors
      for (const selector of this.options.excludeSelectors) {
        if (img.matches(selector)) {
          return false;
        }
      }
      
      // Skip images that already have a capture button
      if (img.parentElement && 
          img.parentElement.querySelector('.image-capture-button')) {
        return false;
      }
      
      return true;
    });
    
    console.log(`📷 Image Capturer: Found ${images.length} images`);
    
    // Add buttons to each image
    images.forEach(this.addCaptureButtonToImage);
  }
  
  /**
   * Add a capture button to an image
   * @param {HTMLImageElement} img - The image element
   */
  addCaptureButtonToImage(img) {
    // Create a wrapper if the image doesn't have one
    let wrapper = img.parentElement;
    const needsWrapper = !wrapper || getComputedStyle(wrapper).position === 'static';
    
    if (needsWrapper) {
      wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      img.parentElement.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    } else {
      wrapper.style.position = 'relative';
    }
    
    // Create button
    const button = document.createElement('button');
    button.className = `image-capture-button ${this.options.captureButtonPosition}`;
    button.innerHTML = `
      <span class="button-icon">🖼️</span>
      <span class="button-text">Save</span>
    `;
    
    // Style button (smaller size)
    button.style.position = 'absolute';
    button.style.top = '5px';
    button.style.right = '5px';
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.padding = '4px 8px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '12px';
    button.style.opacity = '0';
    button.style.transition = 'opacity 0.3s ease';
    button.style.zIndex = '1000';
    button.style.fontFamily = 'inherit';
    
    // Add hover event to show button
    wrapper.addEventListener('mouseenter', this.handleMouseEnter);
    wrapper.addEventListener('mouseleave', this.handleMouseLeave);
    
    // Add click handler
    button.addEventListener('click', (e) => this.handleCaptureClick(e, img));
    
    // Add to wrapper
    wrapper.appendChild(button);
    
    // Keep track of buttons
    this.captureButtons.push({
      img,
      button,
      wrapper
    });
    
    console.log('➕ Added capture button to image:', img.src.substring(0, 50) + '...');
  }
  
  /**
   * Handle mouse enter on image
   * @param {Event} e - Mouse event
   */
  handleMouseEnter(e) {
    const button = e.currentTarget.querySelector('.image-capture-button');
    if (button) {
      button.style.opacity = '1';
    }
  }
  
  /**
   * Handle mouse leave on image
   * @param {Event} e - Mouse event
   */
  handleMouseLeave(e) {
    const button = e.currentTarget.querySelector('.image-capture-button');
    if (button) {
      button.style.opacity = '0';
    }
  }
  
  /**
   * Handle capture button click
   * @param {Event} e - Click event
   * @param {HTMLImageElement} img - The image to capture
   */
  handleCaptureClick(e, img) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Image capture button clicked');
    
    // Check authentication if required
    if (this.options.requireAuth) {
      // Check if the user is authenticated
      const isAuthenticated = window.userData && window.userData.isAuthenticated;
      
      if (!isAuthenticated) {
        console.log('❌ Authentication required but user is not logged in');
        
        // Call auth needed callback if provided
        if (typeof this.options.onAuthNeeded === 'function') {
          this.options.onAuthNeeded();
        }
        
        return;
      }
    }
    
    // Create image data
    const imageData = {
      url: img.src,
      title: img.alt || 'Image from ' + document.title,
      source: {
        url: window.location.href,
        title: document.title
      },
      capturedAt: new Date().toISOString()
    };
    
    // Call capture callback if provided
    if (typeof this.options.onCapture === 'function') {
      console.log('📸 Calling onCapture callback');
      this.options.onCapture(imageData);
    } else {
      console.log('⚠️ No onCapture callback provided');
    }
    
    // Show feedback
    this.showCaptureFeedback(img);
  }
  
  /**
   * Show feedback when an image is captured
   * @param {HTMLImageElement} img - The captured image
   */
  showCaptureFeedback(img) {
    const wrapper = img.parentElement;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 150, 0, 0.3)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1001';
    
    // Create message
    const message = document.createElement('div');
    message.textContent = '✓ Saved to Gallery';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    message.style.color = 'white';
    message.style.padding = '10px 15px';
    message.style.borderRadius = '4px';
    message.style.fontWeight = 'bold';
    
    // Add to DOM
    overlay.appendChild(message);
    wrapper.appendChild(overlay);
    
    // Remove after a delay
    setTimeout(() => {
      if (wrapper.contains(overlay)) {
        wrapper.removeChild(overlay);
      }
    }, 1500);
  }
  
  /**
   * Clean up all capture buttons
   */
  cleanupButtons() {
    this.captureButtons.forEach(({img, button, wrapper}) => {
      // Remove button if it exists
      if (button && button.parentElement) {
        button.parentElement.removeChild(button);
      }
      
      // Remove event listeners
      if (wrapper) {
        wrapper.removeEventListener('mouseenter', this.handleMouseEnter);
        wrapper.removeEventListener('mouseleave', this.handleMouseLeave);
      }
    });
    
    // Clear the array
    this.captureButtons = [];
  }
}

// Expose to window object
if (typeof window !== 'undefined') {
  window.ImageCapturer = ImageCapturer;
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageCapturer;
}
