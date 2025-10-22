/**
 * User Gallery Component
 * 
 * This component displays a user's personal gallery of saved images,
 * with options to view, download, and manage their collection.
 * 
 * @module components/gallery/user-gallery
 */

class UserGallery {
  /**
   * Create a new User Gallery instance
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {string} options.apiEndpoint - API endpoint for loading user gallery data
   * @param {string} options.layout - Gallery layout ('grid', 'carousel', 'masonry')
   * @param {boolean} options.enableLightbox - Whether to enable lightbox view
   * @param {boolean} options.enableDownload - Whether to enable image downloads
   * @param {boolean} options.enableScreensaver - Whether to enable screensaver mode
   * @param {boolean} options.enableDelete - Whether to enable image deletion
   */
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId);
    this.apiEndpoint = options.apiEndpoint || '/gallery/api/user/images';
    this.layout = options.layout || 'grid';
    this.enableLightbox = options.enableLightbox !== false;
    this.enableDownload = options.enableDownload !== false;
    this.enableScreensaver = options.enableScreensaver !== false;
    this.enableDelete = options.enableDelete !== false;
    
    this.images = [];
    this.currentIndex = 0;
    this.isLightboxOpen = false;
    this.isScreensaverActive = false;
    this.screensaverTimer = null;
    
    this.init();
  }
  
  /**
   * Initialize the gallery
   * @private
   */
  async init() {
    if (!this.container) {
      console.error('Gallery container element not found');
      return;
    }
    
    // Add loading state
    this.container.innerHTML = '<div class="gallery-loading">Loading your gallery...</div>';
    
    try {
      // Load user's gallery images
      await this.loadUserGallery();
      
      // Render the gallery
      this.renderGallery();
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize user gallery:', error);
      this.container.innerHTML = `
        <div class="gallery-error">
          <h3>Unable to load your gallery</h3>
          <p>Please try again later or contact support if the problem persists.</p>
          <button id="retry-gallery-load">Retry</button>
        </div>
      `;
      
      document.getElementById('retry-gallery-load').addEventListener('click', () => {
        this.init();
      });
    }
  }
  
  /**
   * Load the user's gallery images from the API
   * @private
   */
  async loadUserGallery() {
    try {
      // Attempt to get Firebase ID token if available
      let headers = {
        'Content-Type': 'application/json'
      };
      
      // Try to get Firebase token
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        try {
          const token = await firebase.auth().currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
          console.log('📝 Added Firebase token to gallery request');
        } catch (tokenError) {
          console.warn('⚠️ Could not get Firebase token:', tokenError.message);
        }
      } else {
        console.log('🔍 Firebase auth not available or user not logged in');
      }
      
      const response = await fetch(this.apiEndpoint, {
        headers,
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If authentication error, redirect to login
        if (response.status === 401) {
          console.error('❌ Authentication required for gallery');
          
          // Show login prompt and redirect after delay
          this.container.innerHTML = `
            <div class="gallery-auth-error">
              <h3>Authentication Required</h3>
              <p>Please log in to view your gallery.</p>
              <p>Redirecting to login page...</p>
            </div>
          `;
          
          // Add login button with immediate action
          const loginButton = document.createElement('button');
          loginButton.textContent = 'Log In Now';
          loginButton.style.padding = '10px 20px';
          loginButton.style.background = '#4c84ff';
          loginButton.style.color = 'white';
          loginButton.style.border = 'none';
          loginButton.style.borderRadius = '4px';
          loginButton.style.cursor = 'pointer';
          loginButton.style.fontSize = '16px';
          loginButton.style.margin = '20px auto';
          loginButton.style.display = 'block';
          
          loginButton.addEventListener('click', () => {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login?redirect=${currentUrl}`;
          });
          
          this.container.querySelector('.gallery-auth-error').appendChild(loginButton);
          
          // Redirect to login after a short delay
          setTimeout(() => {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login?redirect=${currentUrl}`;
          }, 5000);
          
          return;
        }
        
        throw new Error(`Failed to load gallery: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.images = data.images || [];
      
    } catch (error) {
      console.error('Error loading user gallery:', error);
      throw error;
    }
  }
  
  /**
   * Render the gallery in the container
   * @private
   */
  renderGallery() {
    // Clear container
    this.container.innerHTML = '';
    this.container.classList.add('user-gallery');
    this.container.classList.add(`layout-${this.layout}`);
    
    // Add gallery header with controls
    const header = document.createElement('div');
    header.className = 'gallery-header';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'My Gallery';
    header.appendChild(title);
    
    // Add controls
    const controls = document.createElement('div');
    controls.className = 'gallery-controls';
    
    // Layout switcher
    const layoutSelector = document.createElement('select');
    layoutSelector.id = 'gallery-layout-selector';
    layoutSelector.innerHTML = `
      <option value="grid" ${this.layout === 'grid' ? 'selected' : ''}>Grid</option>
      <option value="carousel" ${this.layout === 'carousel' ? 'selected' : ''}>Carousel</option>
      <option value="masonry" ${this.layout === 'masonry' ? 'selected' : ''}>Masonry</option>
    `;
    layoutSelector.addEventListener('change', (e) => {
      this.changeLayout(e.target.value);
    });
    
    const layoutLabel = document.createElement('label');
    layoutLabel.htmlFor = 'gallery-layout-selector';
    layoutLabel.textContent = 'Layout: ';
    
    controls.appendChild(layoutLabel);
    controls.appendChild(layoutSelector);
    
    // Screensaver button
    if (this.enableScreensaver && this.images.length > 0) {
      const screensaverBtn = document.createElement('button');
      screensaverBtn.textContent = 'Start Screensaver';
      screensaverBtn.className = 'screensaver-button';
      screensaverBtn.addEventListener('click', () => this.toggleScreensaver());
      controls.appendChild(screensaverBtn);
    }
    
    header.appendChild(controls);
    this.container.appendChild(header);
    
    // Display message if gallery is empty
    if (this.images.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'gallery-empty';
      emptyMessage.innerHTML = `
        <p>You haven't saved any images to your gallery yet.</p>
        <p>Browse the site and click the "Save to Gallery" button on images you like.</p>
      `;
      this.container.appendChild(emptyMessage);
      return;
    }
    
    // Create gallery elements based on layout
    switch (this.layout) {
      case 'carousel':
        this.renderCarousel();
        break;
      case 'masonry':
        this.renderMasonry();
        break;
      case 'grid':
      default:
        this.renderGrid();
        break;
    }
    
    // Create lightbox if enabled
    if (this.enableLightbox) {
      this.createLightbox();
    }
  }
  
  /**
   * Render images in a grid layout
   * @private
   */
  renderGrid() {
    const galleryGrid = document.createElement('div');
    galleryGrid.className = 'gallery-grid';
    
    this.images.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title || `Image ${index + 1}`;
      img.dataset.index = index;
      
      item.appendChild(img);
      
      // Add caption if available
      if (image.title) {
        const caption = document.createElement('div');
        caption.className = 'gallery-caption';
        caption.textContent = image.title;
        item.appendChild(caption);
      }
      
      // Add action buttons (download, delete)
      const actions = document.createElement('div');
      actions.className = 'gallery-item-actions';
      
      if (this.enableDownload) {
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<span class="icon">↓</span>';
        downloadBtn.className = 'download-button';
        downloadBtn.setAttribute('title', 'Download image');
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.downloadImage(image);
        });
        actions.appendChild(downloadBtn);
      }
      
      if (this.enableDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="icon">×</span>';
        deleteBtn.className = 'delete-button';
        deleteBtn.setAttribute('title', 'Remove from gallery');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteImage(image, item);
        });
        actions.appendChild(deleteBtn);
      }
      
      item.appendChild(actions);
      galleryGrid.appendChild(item);
    });
    
    this.container.appendChild(galleryGrid);
  }
  
  /**
   * Render images in a carousel layout
   * @private
   */
  renderCarousel() {
    const carousel = document.createElement('div');
    carousel.className = 'gallery-carousel';
    
    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'carousel-track';
    
    this.images.forEach((image, index) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      if (index === 0) {
        slide.classList.add('active');
      }
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title || `Image ${index + 1}`;
      img.dataset.index = index;
      
      slide.appendChild(img);
      
      // Add caption if available
      if (image.title) {
        const caption = document.createElement('div');
        caption.className = 'carousel-caption';
        caption.textContent = image.title;
        slide.appendChild(caption);
      }
      
      carouselTrack.appendChild(slide);
    });
    
    carousel.appendChild(carouselTrack);
    
    // Add carousel navigation
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-prev';
    prevButton.innerHTML = '&#10094;';
    prevButton.setAttribute('aria-label', 'Previous image');
    prevButton.addEventListener('click', () => this.moveCarousel(-1));
    
    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-next';
    nextButton.innerHTML = '&#10095;';
    nextButton.setAttribute('aria-label', 'Next image');
    nextButton.addEventListener('click', () => this.moveCarousel(1));
    
    carousel.appendChild(prevButton);
    carousel.appendChild(nextButton);
    
    // Add carousel indicators
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    this.images.forEach((_, index) => {
      const indicator = document.createElement('span');
      indicator.className = 'carousel-indicator';
      if (index === 0) {
        indicator.classList.add('active');
      }
      indicator.addEventListener('click', () => this.goToSlide(index));
      indicators.appendChild(indicator);
    });
    
    carousel.appendChild(indicators);
    this.container.appendChild(carousel);
  }
  
  /**
   * Move the carousel by a number of slides
   * @param {number} offset - Number of slides to move (positive or negative)
   */
  moveCarousel(offset) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    let activeIndex = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('active')) {
        activeIndex = i;
        break;
      }
    }
    
    let newIndex = activeIndex + offset;
    if (newIndex < 0) {
      newIndex = slides.length - 1;
    } else if (newIndex >= slides.length) {
      newIndex = 0;
    }
    
    this.goToSlide(newIndex);
  }
  
  /**
   * Go to a specific carousel slide
   * @param {number} index - The slide index to show
   */
  goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.remove('active');
      indicators[i].classList.remove('active');
    }
    
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
  }
  
  /**
   * Render images in a masonry layout
   * @private
   */
  renderMasonry() {
    // For now, just use the grid layout with a masonry class
    // In a real implementation, this would use a proper masonry layout library
    this.renderGrid();
    this.container.querySelector('.gallery-grid').classList.add('masonry-layout');
  }
  
  /**
   * Create the lightbox overlay
   * @private
   */
  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'gallery-lightbox';
    this.lightbox.style.display = 'none';
    
    const lightboxContent = document.createElement('div');
    lightboxContent.className = 'lightbox-content';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'lightbox-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    
    const image = document.createElement('img');
    image.className = 'lightbox-image';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'lightbox-prev';
    prevButton.innerHTML = '&#10094;';
    prevButton.setAttribute('aria-label', 'Previous image');
    
    const nextButton = document.createElement('button');
    nextButton.className = 'lightbox-next';
    nextButton.innerHTML = '&#10095;';
    nextButton.setAttribute('aria-label', 'Next image');
    
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    
    // Add download button in lightbox if enabled
    let downloadButton = null;
    if (this.enableDownload) {
      downloadButton = document.createElement('button');
      downloadButton.className = 'lightbox-download';
      downloadButton.innerHTML = 'Download';
      downloadButton.setAttribute('aria-label', 'Download image');
    }
    
    lightboxContent.appendChild(closeButton);
    lightboxContent.appendChild(prevButton);
    lightboxContent.appendChild(image);
    lightboxContent.appendChild(nextButton);
    lightboxContent.appendChild(caption);
    if (downloadButton) {
      lightboxContent.appendChild(downloadButton);
    }
    
    this.lightbox.appendChild(lightboxContent);
    document.body.appendChild(this.lightbox);
    
    // Store references to lightbox elements
    this.lightboxImage = image;
    this.lightboxCaption = caption;
    this.lightboxDownloadButton = downloadButton;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Image click events
    this.container.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'IMG' && this.enableLightbox) {
        const index = parseInt(target.dataset.index, 10);
        this.openLightbox(index);
      }
    });
    
    // Lightbox navigation
    if (this.enableLightbox) {
      // Close button
      this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
        this.closeLightbox();
      });
      
      // Previous button
      this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => {
        this.showLightboxImage(this.currentIndex - 1);
      });
      
      // Next button
      this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => {
        this.showLightboxImage(this.currentIndex + 1);
      });
      
      // Download button
      if (this.lightboxDownloadButton) {
        this.lightboxDownloadButton.addEventListener('click', () => {
          this.downloadImage(this.images[this.currentIndex]);
        });
      }
      
      // Close on background click
      this.lightbox.addEventListener('click', (event) => {
        if (event.target === this.lightbox) {
          this.closeLightbox();
        }
      });
      
      // Keyboard navigation
      document.addEventListener('keydown', (event) => {
        if (!this.isLightboxOpen) return;
        
        switch (event.key) {
          case 'Escape':
            this.closeLightbox();
            break;
          case 'ArrowLeft':
            this.showLightboxImage(this.currentIndex - 1);
            break;
          case 'ArrowRight':
            this.showLightboxImage(this.currentIndex + 1);
            break;
        }
      });
    }
  }
  
  /**
   * Open the lightbox at the specified image index
   * @param {number} index - The index of the image to show
   */
  openLightbox(index) {
    if (!this.enableLightbox) return;
    
    this.isLightboxOpen = true;
    this.lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    this.showLightboxImage(index);
  }
  
  /**
   * Show the image at the specified index in the lightbox
   * @param {number} index - The index of the image to show
   */
  showLightboxImage(index) {
    // Handle index bounds
    const totalImages = this.images.length;
    index = ((index % totalImages) + totalImages) % totalImages; // Ensure positive and within bounds
    
    const image = this.images[index];
    this.currentIndex = index;
    
    this.lightboxImage.src = image.url;
    this.lightboxImage.alt = image.title || `Image ${index + 1}`;
    this.lightboxCaption.textContent = image.title || '';
  }
  
  /**
   * Close the lightbox
   */
  closeLightbox() {
    this.isLightboxOpen = false;
    this.lightbox.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  /**
   * Change the gallery layout
   * @param {string} layout - New layout ('grid', 'carousel', 'masonry')
   */
  changeLayout(layout) {
    this.layout = layout;
    this.renderGallery();
  }
  
  /**
   * Download an image
   * @param {Object} image - The image object to download
   */
  downloadImage(image) {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = image.url;
    a.download = image.title || 'wavelength-image';
    a.style.display = 'none';
    
    // Add to document, click it, and remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  /**
   * Delete an image from the gallery
   * @param {Object} image - The image object to delete
   * @param {HTMLElement} itemElement - The DOM element representing the image
   */
  deleteImage(image, itemElement) {
    if (!confirm('Are you sure you want to remove this image from your gallery?')) {
      return;
    }
    
    // Start with visual feedback
    itemElement.classList.add('deleting');
    
    // Call API to delete the image
    fetch('/gallery/api/user/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageId: image.id }),
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete image');
        }
        return response.json();
      })
      .then(() => {
        // Remove from our array
        this.images = this.images.filter(img => img.id !== image.id);
        
        // Remove from DOM with animation
        itemElement.style.opacity = '0';
        itemElement.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          if (itemElement.parentNode) {
            itemElement.parentNode.removeChild(itemElement);
          }
          
          // If gallery is now empty, re-render to show empty message
          if (this.images.length === 0) {
            this.renderGallery();
          }
        }, 300);
      })
      .catch(error => {
        console.error('Error deleting image:', error);
        itemElement.classList.remove('deleting');
        alert('Failed to delete image. Please try again.');
      });
  }
  
  /**
   * Toggle the screensaver mode
   */
  toggleScreensaver() {
    if (this.isScreensaverActive) {
      this.stopScreensaver();
    } else {
      this.startScreensaver();
    }
  }
  
  /**
   * Start the screensaver mode
   */
  startScreensaver() {
    if (this.images.length === 0) return;
    
    this.isScreensaverActive = true;
    
    // Create screensaver overlay
    this.screensaver = document.createElement('div');
    this.screensaver.className = 'gallery-screensaver';
    this.screensaver.style.position = 'fixed';
    this.screensaver.style.top = '0';
    this.screensaver.style.left = '0';
    this.screensaver.style.width = '100%';
    this.screensaver.style.height = '100%';
    this.screensaver.style.backgroundColor = 'black';
    this.screensaver.style.zIndex = '10000';
    this.screensaver.style.display = 'flex';
    this.screensaver.style.justifyContent = 'center';
    this.screensaver.style.alignItems = 'center';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'screensaver-image-container';
    imageContainer.style.position = 'relative';
    imageContainer.style.width = '80%';
    imageContainer.style.height = '80%';
    imageContainer.style.display = 'flex';
    imageContainer.style.justifyContent = 'center';
    imageContainer.style.alignItems = 'center';
    
    // Create image element
    const image = document.createElement('img');
    image.className = 'screensaver-image';
    image.style.maxWidth = '100%';
    image.style.maxHeight = '100%';
    image.style.objectFit = 'contain';
    image.style.transition = 'opacity 1s ease-in-out';
    
    // Create caption element
    const caption = document.createElement('div');
    caption.className = 'screensaver-caption';
    caption.style.position = 'absolute';
    caption.style.bottom = '-40px';
    caption.style.left = '0';
    caption.style.right = '0';
    caption.style.color = 'white';
    caption.style.textAlign = 'center';
    caption.style.fontSize = '18px';
    
    // Create exit button
    const exitButton = document.createElement('button');
    exitButton.textContent = 'Exit Screensaver';
    exitButton.className = 'screensaver-exit';
    exitButton.style.position = 'absolute';
    exitButton.style.bottom = '20px';
    exitButton.style.right = '20px';
    exitButton.style.padding = '10px 15px';
    exitButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    exitButton.style.color = 'white';
    exitButton.style.border = 'none';
    exitButton.style.borderRadius = '4px';
    exitButton.style.cursor = 'pointer';
    exitButton.addEventListener('click', () => this.stopScreensaver());
    
    imageContainer.appendChild(image);
    imageContainer.appendChild(caption);
    this.screensaver.appendChild(imageContainer);
    this.screensaver.appendChild(exitButton);
    
    document.body.appendChild(this.screensaver);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Start the slideshow
    this.screensaverIndex = 0;
    this.showScreensaverImage();
    
    // Auto-advance every 5 seconds
    this.screensaverTimer = setInterval(() => {
      this.screensaverIndex = (this.screensaverIndex + 1) % this.images.length;
      this.showScreensaverImage();
    }, 5000);
    
    // Add event listener to exit on click or key press
    this.screensaver.addEventListener('click', (e) => {
      if (e.target === this.screensaver) {
        this.stopScreensaver();
      }
    });
    
    document.addEventListener('keydown', this.handleScreensaverKeydown = (e) => {
      if (e.key === 'Escape') {
        this.stopScreensaver();
      } else if (e.key === 'ArrowRight') {
        this.screensaverIndex = (this.screensaverIndex + 1) % this.images.length;
        this.showScreensaverImage();
      } else if (e.key === 'ArrowLeft') {
        this.screensaverIndex = (this.screensaverIndex - 1 + this.images.length) % this.images.length;
        this.showScreensaverImage();
      }
    });
  }
  
  /**
   * Show a specific image in the screensaver
   */
  showScreensaverImage() {
    const image = this.screensaver.querySelector('.screensaver-image');
    const caption = this.screensaver.querySelector('.screensaver-caption');
    const currentImage = this.images[this.screensaverIndex];
    
    // Fade out
    image.style.opacity = '0';
    
    // Change image after fade
    setTimeout(() => {
      image.src = currentImage.url;
      caption.textContent = currentImage.title || '';
      image.style.opacity = '1';
    }, 500);
  }
  
  /**
   * Stop the screensaver mode
   */
  stopScreensaver() {
    if (!this.isScreensaverActive) return;
    
    this.isScreensaverActive = false;
    
    // Clear the auto-advance timer
    if (this.screensaverTimer) {
      clearInterval(this.screensaverTimer);
      this.screensaverTimer = null;
    }
    
    // Remove the screensaver element
    if (this.screensaver && this.screensaver.parentNode) {
      this.screensaver.parentNode.removeChild(this.screensaver);
      this.screensaver = null;
    }
    
    // Remove event listener
    document.removeEventListener('keydown', this.handleScreensaverKeydown);
    
    // Restore scrolling
    document.body.style.overflow = '';
  }
}

// Export the UserGallery class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserGallery;
} else if (typeof window !== 'undefined') {
  window.UserGallery = UserGallery;
}