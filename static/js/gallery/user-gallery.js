/**
 * User Gallery JavaScript Module
 * Handles gallery functionality including image display, modal interactions, 
 * carousel/grid views, search, multi-select, and API communications.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM element references
  const carouselEl = document.getElementById('gallery-carousel');
  const gridEl = document.getElementById('gallery-grid');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('fullSizeImage');
  const modalCaption = document.getElementById('modalCaption');
  const deleteBtn = document.getElementById('delete-image');
  const actionButtons = document.getElementById('action-buttons');
  const screensaverModal = document.getElementById('screensaverModal');
  const screensaverImage = document.getElementById('screensaverImage');
  const downloadAllBtn = document.getElementById('download-all');
  const startScreensaverBtn = document.getElementById('start-screensaver');
  const storageUsedBar = document.getElementById('storage-used-bar');
  const storageText = document.getElementById('storage-text');
  
  // Application state
  let userImages = [];
  let currentImageId = null;
  let currentRelativePath = null;
  let screensaverInterval = null;
  let currentScreensaverIndex = 0;
  let selectMode = false;
  let selectedImages = [];
  
  // Function to fetch storage stats
  function fetchStorageStats() {
    fetch('/api/gallery/user/storage-stats', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.status === 401) {
        showLoginButton();
        throw new Error('Authentication required');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        updateStorageMeter(data.stats);
      }
    })
    .catch(error => {
      console.error('Error fetching storage stats:', error);
    });
  }
  
  // Function to update storage meter
  function updateStorageMeter(stats) {
    // For unlimited quota
    if (stats.quota === -1) {
      storageUsedBar.style.width = '10%';
      storageText.textContent = `Used: ${stats.usedFormatted} of Unlimited`;
      storageUsedBar.classList.remove('warning', 'danger');
      return;
    }
    
    // Update the progress bar
    storageUsedBar.style.width = `${stats.percentage}%`;
    
    // Set color based on usage
    storageUsedBar.classList.remove('warning', 'danger');
    if (stats.percentage >= 90) {
      storageUsedBar.classList.add('danger');
    } else if (stats.percentage >= 70) {
      storageUsedBar.classList.add('warning');
    }
    
    // Update text
    storageText.textContent = `Used: ${stats.usedFormatted} of ${stats.quotaFormatted} (${stats.percentage.toFixed(1)}%)`;
  }
  
  // Function to fetch user's images
  function fetchUserGallery() {
    console.log('🔍 fetchUserGallery() called - starting gallery fetch...');
    
    fetch('/api/gallery/user/images', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      console.log('📡 Gallery API response status:', response.status);
      console.log('📡 Gallery API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        console.log('❌ Authentication required - showing login button');
        showLoginButton();
        throw new Error('Authentication required');
      }
      return response.json();
    })
    .then(data => {
      console.log('📦 Gallery API response data:', data);
      
      if (data.success) {
        userImages = data.images || [];
        console.log(`✅ Gallery fetch successful! Found ${userImages.length} images:`, userImages);
        
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
      } else {
        console.log('❌ Gallery API returned success: false', data);
      }
    })
    .catch(error => {
      console.error('❌ Error fetching gallery:', error);
    });
  }
  
  // Function to populate the gallery with images
  function populateGallery(images) {
    console.log('🎨 populateGallery() called with', images.length, 'images:', images);
    
    // Clear previous images
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    
    console.log('🧹 Cleared carousel and grid elements');
    console.log('📍 Carousel element:', carouselEl);
    console.log('📍 Grid element:', gridEl);
    
    // Populate carousel view
    images.forEach((image, index) => {
      console.log(`🖼️ Processing image ${index + 1}:`, image);
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title || '';
      img.className = 'carousel-image';
      img.dataset.id = image.id;
      img.dataset.caption = image.title || '';
      img.dataset.relativePath = image.relativePath;
      div.appendChild(img);
      carouselEl.appendChild(div);
    });
    
    // Initialize carousel with slick
    $(document).ready(function() {
      $('#gallery-carousel').slick({
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
    });
    
    // Populate grid view
    images.forEach(image => {
      const item = document.createElement('div');
      item.classList.add('gallery-item');
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title || '';
      img.dataset.id = image.id;
      img.dataset.caption = image.title || '';
      img.dataset.relativePath = image.relativePath;
      
      if (image.title) {
        const caption = document.createElement('div');
        caption.classList.add('gallery-caption');
        caption.textContent = image.title;
        item.appendChild(caption);
      }
      
      item.appendChild(img);
      gridEl.appendChild(item);
    });
    
    // Add click event to all images
    document.querySelectorAll('.carousel-image, .gallery-item img').forEach(img => {
      img.addEventListener('click', () => {
        openModal(img.src, img.dataset.caption, img.dataset.id, img.dataset.relativePath);
      });
    });
  }
  
  // Function to show empty gallery message
  function showEmptyGallery() {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-gallery';
    emptyMessage.innerHTML = `
      <p>Your gallery is empty.</p>
      <p>Upload images or save images from around the site!</p>
    `;
    
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    gridEl.appendChild(emptyMessage);
    
    // Hide carousel view and show grid view with message
    document.getElementById('carousel-view').style.display = 'none';
    document.getElementById('grid-view').style.display = 'block';
    document.getElementById('carousel-layout').classList.remove('active');
    document.getElementById('grid-layout').classList.add('active');
  }
  
  // Function to show login button
  function showLoginButton() {
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-button';
    
    const button = document.createElement('button');
    button.textContent = 'Login to View Gallery';
    button.className = 'login-btn';
    
    button.addEventListener('click', () => {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `/login?redirect=${currentUrl}`;
    });
    
    loginContainer.appendChild(button);
    
    // Clear existing content and show login button
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    document.querySelector('.gallery-controls').style.display = 'none';
    document.getElementById('storage-meter-container').style.display = 'none';
    document.getElementById('action-buttons').style.display = 'none';
    
    const mainContainer = document.querySelector('.gallery-main-container');
    mainContainer.appendChild(loginContainer);
  }
  
  // Function to open modal
  function openModal(imgSrc, caption, imageId, relativePath) {
    modal.style.display = 'block';
    modalImg.src = imgSrc;
    modalCaption.textContent = caption;
    currentImageId = imageId;
    currentRelativePath = relativePath;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
  
  // Delete image function
  deleteBtn.addEventListener('click', () => {
    if (!currentRelativePath) return;
    
    fetch('/api/gallery/user/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ relativePath: currentRelativePath })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove image from arrays and DOM
        userImages = userImages.filter(img => img.relativePath !== currentRelativePath);
        
        // Close modal
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Repopulate gallery
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
        
        // Refresh storage stats
        fetchStorageStats();
      }
    })
    .catch(error => {
      console.error('Error deleting image:', error);
    });
  });
  
  // Download all images function
  downloadAllBtn.addEventListener('click', () => {
    if (userImages.length === 0) return;
    
    // For each image, create a temporary link and trigger download
    userImages.forEach(image => {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.title || `wavelength-image-${image.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
  
  // Start screensaver function
  startScreensaverBtn.addEventListener('click', () => {
    if (userImages.length === 0) return;
    
    screensaverModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Show first image
    currentScreensaverIndex = 0;
    screensaverImage.src = userImages[currentScreensaverIndex].url;
    
    // Set up interval to cycle through images
    screensaverInterval = setInterval(() => {
      currentScreensaverIndex = (currentScreensaverIndex + 1) % userImages.length;
      screensaverImage.src = userImages[currentScreensaverIndex].url;
    }, 5000);
  });
  
  // Close modal events
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      screensaverModal.style.display = 'none';
      document.body.style.overflow = '';
      
      // Clear screensaver interval if active
      if (screensaverInterval) {
        clearInterval(screensaverInterval);
        screensaverInterval = null;
      }
    });
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
    if (event.target === screensaverModal) {
      screensaverModal.style.display = 'none';
      document.body.style.overflow = '';
      
      if (screensaverInterval) {
        clearInterval(screensaverInterval);
        screensaverInterval = null;
      }
    }
  });
  
  // Layout switchers
  const carouselView = document.getElementById('carousel-view');
  const gridView = document.getElementById('grid-view');
  const carouselBtn = document.getElementById('carousel-layout');
  const gridBtn = document.getElementById('grid-layout');
  const searchInput = document.getElementById('gallery-search');
  const searchButton = document.getElementById('search-button');
  
  // Search functionality
  function searchGallery() {
    const query = searchInput.value.toLowerCase();
    
    if (!query) {
      // If search is empty, show all images
      populateGallery(userImages);
      return;
    }
    
    // Filter images by title, tags, or filename
    const filteredImages = userImages.filter(image => {
      // Check title
      if (image.title && image.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check filename
      if (image.fileName && image.fileName.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check tags
      if (image.tags && Array.isArray(image.tags)) {
        return image.tags.some(tag => tag.toLowerCase().includes(query));
      }
      
      return false;
    });
    
    // Display filtered results
    if (filteredImages.length > 0) {
      populateGallery(filteredImages);
    } else {
      // Show no results message
      carouselEl.innerHTML = '';
      gridEl.innerHTML = '<div class="empty-gallery"><p>No images match your search.</p></div>';
      
      // Switch to grid view to show the message
      carouselView.style.display = 'none';
      gridView.style.display = 'block';
      carouselBtn.classList.remove('active');
      gridBtn.classList.add('active');
    }
  }
  
  // Search event listeners
  searchButton.addEventListener('click', searchGallery);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchGallery();
    }
  });
  
  // Multi-select functionality
  const selectModeButton = document.getElementById('select-mode');
  const deleteSelectedButton = document.getElementById('delete-selected');
  
  selectModeButton.addEventListener('click', () => {
    selectMode = !selectMode;
    selectedImages = [];
    
    if (selectMode) {
      // Enter select mode
      selectModeButton.textContent = 'Cancel Selection';
      deleteSelectedButton.style.display = 'inline-block';
      
      // Switch to grid view for easier selection
      carouselView.style.display = 'none';
      gridView.style.display = 'block';
      gridBtn.classList.add('active');
      carouselBtn.classList.remove('active');
      
      // Add selection styling to grid items
      const gridItems = document.querySelectorAll('.gallery-item');
      gridItems.forEach(item => {
        item.classList.add('selectable');
        
        // Add click handler for selection
        item.addEventListener('click', selectImageHandler);
      });
    } else {
      // Exit select mode
      exitSelectMode();
    }
  });
  
  function selectImageHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const item = this;
    const img = item.querySelector('img');
    const relativePath = img.dataset.relativePath;
    
    if (!relativePath) return;
    
    // Toggle selection
    if (item.classList.contains('selected')) {
      item.classList.remove('selected');
      selectedImages = selectedImages.filter(path => path !== relativePath);
    } else {
      item.classList.add('selected');
      selectedImages.push(relativePath);
    }
    
    // Update delete button text
    deleteSelectedButton.textContent = `Delete Selected (${selectedImages.length})`;
  }
  
  function exitSelectMode() {
    selectMode = false;
    selectModeButton.textContent = 'Select Multiple';
    deleteSelectedButton.style.display = 'none';
    
    // Remove selection styling
    const gridItems = document.querySelectorAll('.gallery-item');
    gridItems.forEach(item => {
      item.classList.remove('selectable', 'selected');
      item.removeEventListener('click', selectImageHandler);
    });
    
    // Clear selected images
    selectedImages = [];
  }
  
  // Delete selected images
  deleteSelectedButton.addEventListener('click', () => {
    if (selectedImages.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} selected images?`)) {
      return;
    }
    
    // Call batch delete API
    fetch('/api/gallery/user/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ relativePaths: selectedImages })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove deleted images from the array
        userImages = userImages.filter(img => !selectedImages.includes(img.relativePath));
        
        // Exit select mode
        exitSelectMode();
        
        // Repopulate gallery
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
        
        // Refresh storage stats
        fetchStorageStats();
        
        // Show success message
        alert(`Successfully deleted ${data.message}`);
      } else {
        alert(`Error: ${data.error || 'Failed to delete selected images'}`);
      }
    })
    .catch(error => {
      console.error('Error deleting images:', error);
      alert('Network error. Please try again.');
    });
  });
  
  carouselBtn.addEventListener('click', () => {
    if (userImages.length === 0) return;
    
    carouselView.style.display = 'block';
    gridView.style.display = 'none';
    carouselBtn.classList.add('active');
    gridBtn.classList.remove('active');
    
    // Refresh the carousel to fix layout issues
    $('#gallery-carousel').slick('refresh');
  });
  
  gridBtn.addEventListener('click', () => {
    carouselView.style.display = 'none';
    gridView.style.display = 'block';
    gridBtn.classList.add('active');
    carouselBtn.classList.remove('active');
  });
  
  // Initialize gallery
  console.log('🚀 Gallery initialization starting...');
  console.log('📍 DOM elements found:');
  console.log('  - Carousel:', carouselEl ? 'Found' : 'NOT FOUND');
  console.log('  - Grid:', gridEl ? 'Found' : 'NOT FOUND');
  
  fetchStorageStats();
  fetchUserGallery();
});