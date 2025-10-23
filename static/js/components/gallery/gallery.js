/**
 * Photo Gallery Component
 * 
 * This component displays a collection of images in a responsive gallery format,
 * allowing users to view, navigate, and interact with images.
 *
 * @module components/gallery/gallery
 */

class PhotoGallery {
  /**
   * Create a new Photo Gallery instance
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - ID of the container element
   * @param {Array} options.images - Array of image objects
   * @param {string} options.layout - Gallery layout ('grid', 'carousel', 'masonry')
   * @param {boolean} options.enableLightbox - Whether to enable lightbox view
   */
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId);
    this.images = options.images || [];
    this.layout = options.layout || 'grid';
    this.enableLightbox = options.enableLightbox !== false;
    
    this.currentIndex = 0;
    this.isLightboxOpen = false;
    
    this.init();
  }
  
  /**
   * Initialize the gallery
   * @private
   */
  init() {
    if (!this.container) {
      console.error('Gallery container element not found');
      return;
    }
    
    this.renderGallery();
    this.setupEventListeners();
  }
  
  /**
   * Render the gallery in the container
   * @private
   */
  renderGallery() {
    // Clear container
    this.container.innerHTML = '';
    this.container.classList.add('photo-gallery');
    this.container.classList.add(`layout-${this.layout}`);
    
    if (this.images.length === 0) {
      this.container.innerHTML = '<p class="gallery-empty">No images to display</p>';
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
    galleryGrid.classList.add('gallery-grid');
    
    this.images.forEach((image, index) => {
      const item = document.createElement('div');
      item.classList.add('gallery-item');
      
      const img = document.createElement('img');
      img.src = image.thumbnailUrl || image.url;
      img.alt = image.caption || `Image ${index + 1}`;
      img.dataset.index = index;
      
      item.appendChild(img);
      
      if (image.caption) {
        const caption = document.createElement('div');
        caption.classList.add('gallery-caption');
        caption.textContent = image.caption;
        item.appendChild(caption);
      }
      
      galleryGrid.appendChild(item);
    });
    
    this.container.appendChild(galleryGrid);
  }
  
  /**
   * Render images in a carousel layout
   * @private
   */
  renderCarousel() {
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('carousel-section');
    
    const carousel = document.createElement('div');
    carousel.classList.add('carousel');
    carousel.id = 'gallery-carousel';
    
    this.images.forEach((image, index) => {
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.caption || `Image ${index + 1}`;
      img.dataset.index = index;
      img.classList.add('carousel-image');
      
      div.appendChild(img);
      carousel.appendChild(div);
    });
    
    carouselContainer.appendChild(carousel);
    this.container.appendChild(carouselContainer);
    
    // Initialize slick carousel if jQuery and slick are available
    if (typeof jQuery !== 'undefined' && typeof jQuery.fn.slick !== 'undefined') {
      jQuery(carousel).slick({
        infinite: true,
        slidesToShow: window.innerWidth <= 768 ? 1 : 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        dots: true,
        arrows: true,
        adaptiveHeight: true,
        centerMode: true,
        centerPadding: '0'
      });
    } else {
      console.warn('Slick carousel not available. Please include jQuery and slick.js for carousel functionality.');
      // Add a basic non-slick carousel alternative here if needed
      const warningDiv = document.createElement('div');
      warningDiv.style.textAlign = 'center';
      warningDiv.style.padding = '20px';
      warningDiv.textContent = 'Carousel requires slick.js to function properly.';
      carouselContainer.appendChild(warningDiv);
    }
  }
  
  /**
   * Render images in a masonry layout
   * @private
   */
  renderMasonry() {
    // Masonry implementation will be added here
    console.log('Masonry layout not yet implemented');
    this.renderGrid(); // Fallback to grid for now
  }
  
  /**
   * Create the lightbox overlay
   * @private
   */
  createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.classList.add('gallery-lightbox');
    this.lightbox.style.display = 'none';
    
    const lightboxContent = document.createElement('div');
    lightboxContent.classList.add('lightbox-content');
    
    const closeButton = document.createElement('button');
    closeButton.classList.add('lightbox-close');
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    
    const image = document.createElement('img');
    image.classList.add('lightbox-image');
    
    const prevButton = document.createElement('button');
    prevButton.classList.add('lightbox-prev');
    prevButton.innerHTML = '&#10094;';
    prevButton.setAttribute('aria-label', 'Previous image');
    
    const nextButton = document.createElement('button');
    nextButton.classList.add('lightbox-next');
    nextButton.innerHTML = '&#10095;';
    nextButton.setAttribute('aria-label', 'Next image');
    
    const caption = document.createElement('div');
    caption.classList.add('lightbox-caption');
    
    lightboxContent.appendChild(closeButton);
    lightboxContent.appendChild(prevButton);
    lightboxContent.appendChild(image);
    lightboxContent.appendChild(nextButton);
    lightboxContent.appendChild(caption);
    
    this.lightbox.appendChild(lightboxContent);
    document.body.appendChild(this.lightbox);
    
    // Store references to lightbox elements
    this.lightboxImage = image;
    this.lightboxCaption = caption;
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
    this.lightboxImage.alt = image.caption || `Image ${index + 1}`;
    this.lightboxCaption.textContent = image.caption || '';
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
   * Update gallery with new images
   * @param {Array} images - New array of image objects
   */
  updateImages(images) {
    this.images = images || [];
    this.renderGallery();
  }
  
  /**
   * Change the gallery layout
   * @param {string} layout - New layout ('grid', 'carousel', 'masonry')
   */
  changeLayout(layout) {
    this.layout = layout;
    this.renderGallery();
  }
}

// Export the PhotoGallery class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoGallery;
}