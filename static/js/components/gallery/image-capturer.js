/**
 * Image Capture Utility
 * 
 * This utility allows users to capture images from any page on the Wavelength Lore site
 * and save them to their personal gallery.
 * 
 * @module components/gallery/image-capturer
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
    this.requireAuth = options.requireAuth !== false;
    this.onCapture = options.onCapture || this.defaultCaptureHandler.bind(this);
    this.onAuthNeeded = options.onAuthNeeded || this.defaultAuthHandler.bind(this);
    this.captureButtons = [];
    this.isEnabled = false;

    // Bind methods
    this.addCaptureButtonToImage = this.addCaptureButtonToImage.bind(this);
    this.handleImageCapture = this.handleImageCapture.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.processPage = this.processPage.bind(this);
    this.cleanupButtons = this.cleanupButtons.bind(this);
  }

  /**
   * Enable the image capturer for the current page
   */
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;

    // Process the page on load
    this.processPage();

    // Set up mutation observer to watch for new images
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

    // Start observing the entire document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle dynamic content loading (e.g., AJAX, SPA navigation)
    window.addEventListener('DOMContentLoaded', this.processPage);
    window.addEventListener('load', this.processPage);
    
    // If available, hook into router/navigation events
    if (window.addEventListener) {
      window.addEventListener('popstate', this.processPage);
      window.addEventListener('hashchange', this.processPage);
    }
  }

  /**
   * Disable the image capturer
   */
  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    // Stop the observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Remove event listeners
    window.removeEventListener('DOMContentLoaded', this.processPage);
    window.removeEventListener('load', this.processPage);
    window.removeEventListener('popstate', this.processPage);
    window.removeEventListener('hashchange', this.processPage);

    // Clean up buttons
    this.cleanupButtons();
  }

  /**
   * Process the page to find images and add capture buttons
   */
  processPage() {
    // First clean up any existing buttons
    this.cleanupButtons();

    // Find all images that should have capture buttons
    const images = this.findCaptureableImages();
    
    // Add capture buttons to these images
    images.forEach(this.addCaptureButtonToImage);
  }

  /**
   * Find all images on the page that can be captured
   * @returns {Array} Array of image elements
   */
  findCaptureableImages() {
    // Start with all img tags
    let images = Array.from(document.querySelectorAll('img'));

    // Filter out very small images, icons, etc.
    images = images.filter(img => {
      // Skip images that are too small (likely icons, avatars, etc.)
      const minSize = 100; // Minimum dimension in pixels
      if (img.width < minSize || img.height < minSize) {
        return false;
      }

      // Skip images that are part of UI elements or icons
      if (img.classList.contains('icon') || 
          img.classList.contains('avatar') ||
          img.classList.contains('logo')) {
        return false;
      }

      // Skip images with certain patterns in their src
      const excludePatterns = ['icon', 'avatar', 'logo', 'button', 'ui', 'background'];
      for (const pattern of excludePatterns) {
        if (img.src.toLowerCase().includes(pattern)) {
          return false;
        }
      }

      // Include images in certain contexts
      const includeContainers = ['carousel', 'gallery', 'slideshow', 'banner', 'hero'];
      for (const container of includeContainers) {
        let parent = img.parentElement;
        while (parent) {
          if (parent.classList && 
              (parent.classList.contains(container) || 
               parent.id.toLowerCase().includes(container))) {
            return true;
          }
          parent = parent.parentElement;
        }
      }

      // Default to including images that passed the size filter
      return true;
    });

    // Add special case for the radio page screensaver
    const radioScreensaver = document.querySelector('#radio-screensaver img, .radio-screensaver img');
    if (radioScreensaver && !images.includes(radioScreensaver)) {
      images.push(radioScreensaver);
    }

    // Add special case for forum images
    const forumImages = document.querySelectorAll('.forum-post img, .post-content img');
    forumImages.forEach(img => {
      if (!images.includes(img) && img.width >= 100 && img.height >= 100) {
        images.push(img);
      }
    });

    return images;
  }

  /**
   * Add a capture button to an image
   * @param {HTMLImageElement} img - The image to add a button to
   */
  addCaptureButtonToImage(img) {
    // Don't add a button if the image already has one
    const existingButton = img.parentElement.querySelector('.image-capture-button');
    if (existingButton) return;

    // Create a container for the image and button if needed
    let container = img.parentElement;
    
    // Make sure the container is positioned relatively
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    // Create the capture button
    const button = document.createElement('button');
    button.className = 'image-capture-button';
    button.innerHTML = '<span class="icon">+</span><span class="text">Save to Gallery</span>';
    button.setAttribute('aria-label', 'Save image to your gallery');
    button.setAttribute('title', 'Save image to your gallery');
    
    // Style the button
    button.style.position = 'absolute';
    button.style.bottom = '10px';
    button.style.right = '10px';
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.padding = '8px 12px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.opacity = '0';
    button.style.transition = 'opacity 0.3s ease';
    button.style.zIndex = '100';
    
    // Style the button icon
    const icon = button.querySelector('.icon');
    icon.style.marginRight = '5px';
    icon.style.fontSize = '16px';
    icon.style.fontWeight = 'bold';

    // Initially hide the button, it will appear on hover
    button.style.opacity = '0';

    // Add button to the container
    container.appendChild(button);
    
    // Add the image and button to our tracking array
    this.captureButtons.push({
      img,
      button,
      container
    });
    
    // Add event listeners
    button.addEventListener('click', (e) => this.handleImageCapture(e, img));
    container.addEventListener('mouseenter', this.handleMouseEnter);
    container.addEventListener('mouseleave', this.handleMouseLeave);
    
    // Add touch support for mobile
    container.addEventListener('touchstart', () => {
      button.style.opacity = '1';
      // Hide after a delay if not tapped
      setTimeout(() => {
        button.style.opacity = '0';
      }, 3000);
    });
  }

  /**
   * Handle mouse enter event on image container
   * @param {Event} e - The mouse event
   */
  handleMouseEnter(e) {
    const container = e.currentTarget;
    const button = container.querySelector('.image-capture-button');
    if (button) {
      button.style.opacity = '1';
    }
  }

  /**
   * Handle mouse leave event on image container
   * @param {Event} e - The mouse event
   */
  handleMouseLeave(e) {
    const container = e.currentTarget;
    const button = container.querySelector('.image-capture-button');
    if (button) {
      button.style.opacity = '0';
    }
  }

  /**
   * Handle image capture button click
   * @param {Event} e - The click event
   * @param {HTMLImageElement} img - The image to capture
   */
  handleImageCapture(e, img) {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated
    if (this.requireAuth && !this.isUserAuthenticated()) {
      this.onAuthNeeded();
      return;
    }
    
    // Prepare image data
    const imageData = {
      url: img.src,
      alt: img.alt || '',
      title: img.title || img.alt || 'Captured Image',
      width: img.naturalWidth,
      height: img.naturalHeight,
      timestamp: new Date().toISOString(),
      sourceUrl: window.location.href,
      pageTitle: document.title
    };
    
    // Call the capture handler
    this.onCapture(imageData);
    
    // Show feedback that the image was captured
    this.showCaptureFeedback(img);
  }

  /**
   * Show visual feedback that an image was captured
   * @param {HTMLImageElement} img - The captured image
   */
  showCaptureFeedback(img) {
    // Create a feedback overlay
    const overlay = document.createElement('div');
    overlay.className = 'capture-feedback';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 150, 0, 0.3)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '101';
    
    // Add success message
    const message = document.createElement('div');
    message.textContent = 'Saved to Gallery';
    message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    message.style.color = 'white';
    message.style.padding = '10px 15px';
    message.style.borderRadius = '4px';
    message.style.fontSize = '16px';
    
    overlay.appendChild(message);
    img.parentElement.appendChild(overlay);
    
    // Remove after a delay
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    }, 1500);
  }
  
  /**
   * Clean up all capture buttons
   */
  cleanupButtons() {
    this.captureButtons.forEach(({ img, button, container }) => {
      if (button && button.parentElement) {
        button.parentElement.removeChild(button);
      }
      
      container.removeEventListener('mouseenter', this.handleMouseEnter);
      container.removeEventListener('mouseleave', this.handleMouseLeave);
    });
    
    this.captureButtons = [];
  }

  /**
   * Check if the user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isUserAuthenticated() {
    // Placeholder - replace with actual authentication check
    return Boolean(
      window.userData && 
      window.userData.isAuthenticated === true
    );
  }

  /**
   * Default handler when an image is captured
   * @param {Object} imageData - The captured image data
   */
  defaultCaptureHandler(imageData) {
    console.log('Image captured:', imageData);
    
    // In a real implementation, this would call an API endpoint to save to user's gallery
    fetch('/api/gallery/user/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData),
      credentials: 'include' // Include cookies for authentication
    })
    .then(response => response.json())
    .then(data => {
      console.log('Image saved to gallery:', data);
    })
    .catch(error => {
      console.error('Error saving image to gallery:', error);
    });
  }

  /**
   * Default handler when authentication is needed
   */
  defaultAuthHandler() {
    console.log('Authentication required to save images');
    
    // In a real implementation, show login dialog or redirect to login page
    alert('Please log in to save images to your gallery');
    
    // Optionally redirect to login page
    // window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
  }
}

// Export the ImageCapturer class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageCapturer;
} else if (typeof window !== 'undefined') {
  window.ImageCapturer = ImageCapturer;
}