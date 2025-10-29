/**
 * User Gallery JavaScript Module
 * Handles gallery functionality including image display, modal interactions, 
 * carousel/grid views, search, multi-select, and API communications.
 * Now uses shared screensaver utility for enhanced functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Enhanced error handling utility
  function showError(message, error = null) {
    console.error('Gallery Error:', message, error);
    
    // Create or update error display
    let errorDiv = document.getElementById('gallery-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'gallery-error';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong>Gallery Error</strong><br>
          ${message}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorDiv && errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // Success notification utility  
  function showSuccess(message) {
    console.log('Gallery Success:', message);
    
    let successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #44aa44;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    successDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong>Success</strong><br>
          ${message}
        </div>
        <button onclick="this.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv && successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }

  // DOM element references
  const carouselEl = document.getElementById('gallery-carousel');
  const gridEl = document.getElementById('gallery-grid');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('fullSizeImage');
  const modalCaption = document.getElementById('modalCaption');
  const deleteBtn = document.getElementById('delete-image');
  const actionButtons = document.getElementById('action-buttons');
  const downloadAllBtn = document.getElementById('download-all');
  const startScreensaverBtn = document.getElementById('start-screensaver');

  
  // Application state
  let userImages = [];
  let currentImageId = null;
  let currentRelativePath = null;
  let selectMode = false;
  let selectedImages = [];
  
  // Global function for carousel partial to use for modal handling
  window.setCurrentImageForModal = function(imageId, relativePath) {
    currentImageId = imageId;
    currentRelativePath = relativePath;
  };
  
  // Initialize shared screensaver utility
  let galleryScreensaver = null;
  
  // Initialize screensaver when the shared utility is available
  function initializeScreensaver() {
    if (typeof WavelengthScreensaver !== 'undefined') {
      galleryScreensaver = new WavelengthScreensaver({
        containerId: 'screensaverOverlay',
        gallerySelector: '.screensaver-gallery',
        autoRotate: true,
        rotationInterval: 8000,
        transitionsEnabled: true,
        weatherEffects: true,
        exitOnClick: true,
        exitOnKeypress: true,
        imageEffects: true,
        gameMode: false,
        badges: true,
        lyrics: false,
        titleDisplay: false,
        summary: false,
        showControls: false
      });
      
      galleryScreensaver.init();
      console.log('✅ Gallery screensaver initialized');
    }
  }
  
  function fetchUserGallery() {
    fetch('/api/gallery/user/images', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
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
        userImages = data.images || [];
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
      }
    })
    .catch(error => {
      console.error('❌ Error fetching gallery:', error);
    });
  }
  
  function populateGallery(images) {
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    
    images.forEach((image, index) => {
      const div = document.createElement('div');
      div.className = 'carousel-item';
      
      const img = document.createElement('img');
      img.src = image.url;
      img.alt = image.title || '';
      img.dataset.id = image.id;
      img.dataset.caption = image.title || '';
      img.dataset.relativePath = image.relativePath;
      
      const actions = document.createElement('div');
      actions.className = 'gallery-item-actions carousel-actions';
      
      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '<span class="icon">↓</span>';
      downloadBtn.className = 'download-button';
      downloadBtn.setAttribute('title', 'Download image');
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(image);
      });
      actions.appendChild(downloadBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<span class="icon">×</span>';
      deleteBtn.className = 'delete-button';
      deleteBtn.setAttribute('title', 'Remove from gallery');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage(image.id, image.relativePath, div);
      });
      actions.appendChild(deleteBtn);

      if (window.userGroups && (window.userGroups.includes('admin') || window.userGroups.includes('content_manager'))) {
        const merchBtn = document.createElement('button');
        merchBtn.innerHTML = '<span class="icon">🛍️</span>';
        merchBtn.className = 'merch-store-button';
        merchBtn.setAttribute('title', 'Create custom merchandise from this image');
        merchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openInMerchStore(image);
        });
        actions.appendChild(merchBtn);
      }
      
      div.appendChild(img);
      div.appendChild(actions);
      carouselEl.appendChild(div);
    });
    
    if ($('#gallery-carousel').hasClass('slick-initialized')) {
      $('#gallery-carousel').slick('unslick');
    }
    
    // Hide carousel during initialization to prevent flicker
    carouselEl.style.visibility = 'hidden';
    
    const carouselOptions = window.userGalleryCarouselOptions || {
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      dots: true,
      arrows: true,
      centerMode: true,
      centerPadding: '60px',
      adaptiveHeight: true,
      responsive: [
        { breakpoint: 768, settings: { centerPadding: '40px' } },
        { breakpoint: 480, settings: { centerPadding: '20px' } }
      ]
    };
    
    setTimeout(() => {
      $('#gallery-carousel').slick(carouselOptions);
      carouselEl.style.visibility = 'visible';
    }, 100);
    
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
      
      const actions = document.createElement('div');
      actions.className = 'gallery-item-actions';
      
      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '<span class="icon">↓</span>';
      downloadBtn.className = 'download-button';
      downloadBtn.setAttribute('title', 'Download image');
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(image);
      });
      actions.appendChild(downloadBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<span class="icon">×</span>';
      deleteBtn.className = 'delete-button';
      deleteBtn.setAttribute('title', 'Remove from gallery');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage(image.id, image.relativePath, item);
      });
      actions.appendChild(deleteBtn);

      if (window.userGroups && (window.userGroups.includes('admin') || window.userGroups.includes('content_manager'))) {
        const merchBtn = document.createElement('button');
        merchBtn.innerHTML = '<span class="icon">🛍️</span>';
        merchBtn.className = 'merch-store-button';
        merchBtn.setAttribute('title', 'Create custom merchandise from this image');
        merchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openInMerchStore(image);
        });
        actions.appendChild(merchBtn);
      }
      
      item.appendChild(img);
      item.appendChild(actions);
      gridEl.appendChild(item);
    });
    
    document.querySelectorAll('#gallery-carousel img, .gallery-item img').forEach(img => {
      img.addEventListener('click', (e) => {
        // In select mode, don't open modal - let select handler work
        if (selectMode && e.target.closest('.gallery-item')) {
          return;
        }
        openModal(img.src, img.dataset.caption, img.dataset.id, img.dataset.relativePath);
      });
    });
  }
  
  function showEmptyGallery() {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-gallery';
    emptyMessage.innerHTML = `<p>Your gallery is empty.</p><p>Upload images or save images from around the site!</p>`;
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    gridEl.appendChild(emptyMessage);
    document.getElementById('carousel-view').style.display = 'none';
    document.getElementById('grid-view').style.display = 'block';
    document.getElementById('carousel-layout').classList.remove('active');
    document.getElementById('grid-layout').classList.add('active');
  }
  
  function downloadImage(image) {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title || 'gallery-image.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function deleteImage(imageId, relativePath, itemElement) {
    if (!confirm('Are you sure you want to remove this image from your gallery?')) return;
    
    // Determine what to send based on what we have
    let deleteData = {};
    if (relativePath) {
      deleteData.relativePath = relativePath;
    } else if (imageId) {
      // If no relativePath, this is likely a bookmark - use bookmarkId
      deleteData.bookmarkId = imageId;
    } else {
      alert('Unable to identify image for deletion');
      return;
    }
    
    console.log('🗑️ Deleting image:', deleteData);
    
    fetch('/api/gallery/user/delete', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(deleteData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Remove from UI
        if (itemElement && itemElement.parentNode) {
          itemElement.parentNode.removeChild(itemElement);
        }
        
        // Update local data
        const identifier = relativePath || imageId;
        userImages = userImages.filter(img => 
          img.relativePath !== identifier && 
          img.id !== identifier &&
          img.bookmarkId !== identifier
        );
        
        // If carousel is active, refresh it
        if ($('#gallery-carousel').hasClass('slick-initialized')) {
          if (userImages.length > 0) {
            populateGallery(userImages);
          } else {
            showEmptyGallery();
          }
        }
        
        console.log('✅ Image deleted successfully');
      } else {
        throw new Error(data.error || 'Unknown error from server');
      }
    })
    .catch(error => {
      console.error('Error deleting image:', error);
      alert('Failed to delete image: ' + error.message);
    });
  }
  
  function openInMerchStore(image) {
    window.location.href = `/merchandise?preselect=${encodeURIComponent(image.id)}`;
  }

  function showLoginButton() {
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-button';
    const button = document.createElement('button');
    button.textContent = 'Login to View Gallery';
    button.className = 'login-btn';
    button.addEventListener('click', () => {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
    });
    loginContainer.appendChild(button);
    carouselEl.innerHTML = '';
    gridEl.innerHTML = '';
    document.querySelector('.gallery-controls').style.display = 'none';
    document.getElementById('action-buttons').style.display = 'none';
    document.querySelector('.gallery-main-container').appendChild(loginContainer);
  }
  
  function openModal(imgSrc, caption, imageId, relativePath) {
    modal.style.display = 'block';
    modalImg.src = imgSrc;
    modalCaption.textContent = caption;
    currentImageId = imageId;
    currentRelativePath = relativePath;
    document.body.style.overflow = 'hidden';
  }
  
  deleteBtn.addEventListener('click', () => {
    if (!currentImageId && !currentRelativePath) {
      alert('No image selected for deletion');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this image from your gallery?')) return;
    
    // Determine what to send for deletion
    let deleteData = {};
    if (currentRelativePath) {
      deleteData.relativePath = currentRelativePath;
    } else if (currentImageId) {
      deleteData.bookmarkId = currentImageId;
    }
    
    console.log('🗑️ Modal delete:', deleteData);
    
    fetch('/api/gallery/user/delete', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      credentials: 'include',
      body: JSON.stringify(deleteData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Filter out the deleted image
        const identifier = currentRelativePath || currentImageId;
        userImages = userImages.filter(img => 
          img.relativePath !== identifier && 
          img.id !== identifier &&
          img.bookmarkId !== identifier
        );
        
        // Close modal
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Refresh gallery
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
        
        console.log('✅ Image deleted from modal successfully');
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    })
    .catch(error => {
      console.error('Error deleting image from modal:', error);
      alert('Failed to delete image: ' + error.message);
    });
  });
  
  downloadAllBtn.addEventListener('click', () => {
    if (userImages.length === 0) return;
    userImages.forEach(image => {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.title || `wavelength-image-${image.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
  
  startScreensaverBtn.addEventListener('click', () => {
    if (userImages.length === 0) return;
    const imageUrls = userImages.map(img => img.url);
    if (galleryScreensaver) {
      galleryScreensaver.enter(imageUrls);
    }
  });
  
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      if (galleryScreensaver && galleryScreensaver.active) {
        galleryScreensaver.exit();
      }
    });
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
  
  const carouselView = document.getElementById('carousel-view');
  const gridView = document.getElementById('grid-view');
  const carouselBtn = document.getElementById('carousel-layout');
  const gridBtn = document.getElementById('grid-layout');
  const searchInput = document.getElementById('gallery-search');
  const searchButton = document.getElementById('search-button');
  
  function searchGallery() {
    const query = searchInput.value.toLowerCase();
    if (!query) {
      populateGallery(userImages);
      return;
    }
    
    const filteredImages = userImages.filter(image => {
      return (image.title && image.title.toLowerCase().includes(query)) ||
             (image.fileName && image.fileName.toLowerCase().includes(query)) ||
             (image.tags && Array.isArray(image.tags) && image.tags.some(tag => tag.toLowerCase().includes(query)));
    });
    
    if (filteredImages.length > 0) {
      populateGallery(filteredImages);
    } else {
      carouselEl.innerHTML = '';
      gridEl.innerHTML = '<div class="empty-gallery"><p>No images match your search.</p></div>';
      carouselView.style.display = 'none';
      gridView.style.display = 'block';
      carouselBtn.classList.remove('active');
      gridBtn.classList.add('active');
    }
  }
  
  searchButton.addEventListener('click', searchGallery);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchGallery();
  });
  
  const selectModeButton = document.getElementById('select-mode');
  const deleteSelectedButton = document.getElementById('delete-selected');
  
  selectModeButton.addEventListener('click', () => {
    selectMode = !selectMode;
    selectedImages = [];
    
    if (selectMode) {
      selectModeButton.textContent = 'Cancel Selection';
      deleteSelectedButton.style.display = 'inline-block';
      carouselView.style.display = 'none';
      gridView.style.display = 'block';
      gridBtn.classList.add('active');
      carouselBtn.classList.remove('active');
      
      document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.add('selectable');
        // Remove existing click handlers that open modal
        const img = item.querySelector('img');
        if (img) {
          img.replaceWith(img.cloneNode(true));
        }
        // Add select handler
        item.addEventListener('click', selectImageHandler);
      });
    } else {
      exitSelectMode();
    }
  });
  
  function selectImageHandler(e) {
    // Only prevent default if we're actually in select mode and clicking on the image
    if (!selectMode) {
      return; // Let normal modal opening work
    }
    
    // Check if click was on action buttons - don't interfere with those
    if (e.target.closest('.gallery-item-actions')) {
      return; // Let action buttons work normally
    }
    
    e.preventDefault();
    e.stopPropagation();
    const item = this;
    const img = item.querySelector('img');
    const relativePath = img.dataset.relativePath;
    const imageId = img.dataset.id;
    
    console.log('🔍 Select handler - Image data:', {
      relativePath,
      imageId,
      datasetId: img.dataset.id,
      datasetRelativePath: img.dataset.relativePath
    });
    
    // For selection, we need to store the right identifier that matches what's in userImages
    let imageIdentifier;
    
    // Find the actual image in userImages to get the correct identifier
    const matchingImage = userImages.find(userImg => {
      return (userImg.relativePath && userImg.relativePath === relativePath) ||
             (userImg.id === imageId) ||
             (userImg.bookmarkId === imageId);
    });
    
    if (matchingImage) {
      // Use the identifier that will work for deletion
      imageIdentifier = matchingImage.relativePath || matchingImage.bookmarkId || matchingImage.id;
      console.log('🎯 Found matching image:', matchingImage);
      console.log('🎯 Using identifier:', imageIdentifier);
    } else {
      console.error('❌ No matching image found in userImages for:', { relativePath, imageId });
      return;
    }
    
    if (item.classList.contains('selected')) {
      item.classList.remove('selected');
      selectedImages = selectedImages.filter(id => id !== imageIdentifier);
      console.log('🗑️ Deselected:', imageIdentifier);
    } else {
      item.classList.add('selected');
      selectedImages.push(imageIdentifier);
      console.log('✅ Selected:', imageIdentifier);
    }
    
    console.log('📊 Current selection:', selectedImages);
    deleteSelectedButton.textContent = `Delete Selected (${selectedImages.length})`;
  }
  
  function exitSelectMode() {
    selectMode = false;
    selectModeButton.textContent = 'Select Multiple';
    deleteSelectedButton.style.display = 'none';
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.remove('selectable', 'selected');
      item.removeEventListener('click', selectImageHandler);
    });
    selectedImages = [];
  }
  
  deleteSelectedButton.addEventListener('click', () => {
    if (selectedImages.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} selected images?`)) return;
    
    console.log('🔍 Batch delete - selectedImages:', selectedImages);
    console.log('🔍 Batch delete - userImages:', userImages.map(img => ({
      id: img.id,
      bookmarkId: img.bookmarkId,
      relativePath: img.relativePath,
      type: img.type
    })));
    
    // Separate S3 images from bookmarks more carefully
    const s3Images = [];
    const bookmarks = [];
    
    selectedImages.forEach(selectedId => {
      const matchingImage = userImages.find(userImg => {
        return (userImg.relativePath === selectedId) ||
               (userImg.id === selectedId) ||
               (userImg.bookmarkId === selectedId);
      });
      
      if (matchingImage) {
        if (matchingImage.relativePath) {
          // This is an S3 image - use relativePath for deletion
          s3Images.push(matchingImage.relativePath);
        } else if (matchingImage.bookmarkId) {
          // This is a bookmark - use bookmarkId for deletion
          bookmarks.push(matchingImage.bookmarkId);
        } else {
          console.warn('⚠️ Image has no relativePath or bookmarkId:', matchingImage);
        }
      } else {
        console.error('❌ No matching image found for selected ID:', selectedId);
      }
    });
    
    console.log('🗑️ Batch delete:', { s3Images, bookmarks });
    
    // Process deletions
    const deletePromises = [];
    
    // Delete S3 images
    if (s3Images.length > 0) {
      deletePromises.push(
        fetch('/api/gallery/user/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ relativePaths: s3Images })
        }).then(r => r.json())
      );
    }
    
    // Delete bookmarks individually (no batch endpoint for bookmarks)
    bookmarks.forEach(bookmarkId => {
      deletePromises.push(
        fetch('/api/gallery/user/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bookmarkId })
        }).then(r => r.json())
      );
    });
    
    Promise.all(deletePromises)
    .then(results => {
      console.log('🗑️ Batch delete results:', results);
      
      let totalSuccess = 0;
      let totalFailed = 0;
      
      results.forEach(result => {
        if (result.success) {
          totalSuccess++;
        } else {
          totalFailed++;
          console.error('Delete failed:', result);
        }
      });
      
      if (totalSuccess > 0) {
        // Remove deleted images from local array
        userImages = userImages.filter(img => {
          const imgId = img.relativePath || img.id || img.bookmarkId;
          return !selectedImages.includes(imgId);
        });
        
        exitSelectMode();
        
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
        
        const message = totalFailed > 0 
          ? `${totalSuccess} images deleted, ${totalFailed} failed`
          : `${totalSuccess} images deleted successfully`;
        alert(message);
      } else {
        alert('Failed to delete any images');
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
    if ($('#gallery-carousel').hasClass('slick-initialized')) {
      $('#gallery-carousel').slick('refresh');
    }
  });
  
  gridBtn.addEventListener('click', () => {
    carouselView.style.display = 'none';
    gridView.style.display = 'block';
    gridBtn.classList.add('active');
    carouselBtn.classList.remove('active');
  });
  
  initializeScreensaver();
  fetchUserGallery();
});
