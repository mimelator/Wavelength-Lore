/**
 * Image Capture Initializer for Gallery
 * 
 * This file initializes the image capture functionality across the site,
 * enabling users to save images to their personal gallery.
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🖼️ Initializing Image Capturer');
  
  // Create global window.userData object if it doesn't exist
  // This is needed for the authentication check in the ImageCapturer
  if (typeof window.userData === 'undefined') {
    window.userData = {};
  }
  
  // Check if user is authenticated via Firebase
  if (window.firebaseAuth && window.firebaseUtils) {
    window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
      if (user) {
        console.log('�� User authenticated, enabling image capture');
        window.userData.isAuthenticated = true;
        
        // Initialize the image capturer
        initializeImageCapturer();
      } else {
        console.log('👤 User not authenticated');
        window.userData.isAuthenticated = false;
      }
    });
  } else {
    console.log('🔥 Firebase not available, checking for auth later');
    // Check again after a delay
    setTimeout(() => {
      if (window.firebaseAuth && window.firebaseUtils) {
        console.log('🔥 Firebase now available, checking auth');
        window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
          if (user) {
            console.log('�� User authenticated, enabling image capture');
            window.userData.isAuthenticated = true;
            
            // Initialize the image capturer
            initializeImageCapturer();
          }
        });
      } else {
        console.log('🔥 Firebase still not available, proceeding with default initialization');
        // Initialize anyway, but require auth
        initializeImageCapturer();
      }
    }, 1000);
  }
  
  // Function to initialize the image capturer
  function initializeImageCapturer() {
    console.log('🖼️ Creating ImageCapturer instance');
    
    // Check if we're on a gallery page - if so, don't initialize the capturer
    const currentPath = window.location.pathname;
    const isGalleryPage = currentPath.includes('/gallery') || 
                         currentPath === '/my-gallery' || 
                         currentPath.includes('/gallery-demo');
    
    // Check if we're on merchandise pages - disable Save to Gallery there too
    const isMerchandisePage = currentPath.includes('/merchandise') || 
                             currentPath.startsWith('/enhanced-merchandise');
    
    if (isGalleryPage || isMerchandisePage) {
      console.log(`🚫 ${isMerchandisePage ? 'Merchandise' : 'Gallery'} page detected - Save to Gallery functionality disabled`);
      return;
    }
    
    // Check if we're on main entry pages where we don't want save buttons on cards/badges
    const isMainEntryPage = currentPath === '/' || 
                           currentPath === '/characters' || 
                           currentPath === '/lore' || 
                           currentPath === '/episodes' || 
                           currentPath.startsWith('/character/') || 
                           currentPath.startsWith('/lore/') || 
                           currentPath.startsWith('/episode/');
    
    if (isMainEntryPage) {
      console.log('🏠 Main entry page detected - Limited Save to Gallery functionality');
    }
    
    // Check if ImageCapturer class is available
    if (typeof window.ImageCapturer === 'undefined') {
      console.error('❌ ImageCapturer class not found! Make sure image-capturer.js is loaded first.');
      return;
    }
    
    // Create a new image capturer instance
    const capturer = new window.ImageCapturer({
      requireAuth: true,
      
      // Exclude these selectors from getting Save to Gallery buttons
      excludeSelectors: [
        // Banner images
        '.banner img', 
        '.site-banner img',
        '.header-banner img',
        '.page-banner img',
        '[class*="banner"] img',
        
        // Navigation elements and cards/badges on main entry pages
        'nav img', 
        '.navigation img',
        '.nav-item img',
        '.navbar img',
        '.menu img',
        '.nav-card img',
        '.link-card img',
        '.card img',
        '.badge img',
        '.entry-card img',
        '.character-card img',
        '.lore-card img',
        '.episode-card img',
        
        // Main navigation and index page elements
        '.main-nav img',
        '.page-nav img',
        '.content-grid img',
        '.content-card img',
        '.grid-item img',
        '.index-card img',
        
        // UI elements that shouldn't have save buttons
        '.icon img',
        '.logo img',
        '.avatar img',
        '.button img',
        '.thumbnail img',
        '.profile-picture img',
        
        // Additional selectors
        '[role="button"] img',
        '[role="navigation"] img'
      ],
      
      // Called when an image is captured
      onCapture: async (imageData) => {
        try {
          console.log('📸 Image captured:', imageData);
          
          // Save the image to the user's gallery
          const response = await fetch('/gallery/api/user/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imageData),
            credentials: 'include' // Send cookies for authentication
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Image saved to gallery:', data);
          
          // Show success notification with gallery and merchandise store links
          const galleryLink = '<a href="/my-gallery" class="gallery-link">View Gallery</a>';
          const merchLink = data.merchLink ? `<a href="${data.merchLink}" class="merch-link">🛍️ Create Merchandise</a>` : '';
          const separator = data.merchLink ? ' | ' : '';
          
          showNotification(`Image saved to your gallery! ${galleryLink}${separator}${merchLink}`, 'success');
          
        } catch (error) {
          console.error('❌ Error saving image:', error);
          showNotification('Failed to save image. Please try again.', 'error');
        }
      },
      
      // Called when authentication is needed but user is not logged in
      onAuthNeeded: () => {
        console.log('🔒 Authentication required');
        
        // Show login notification
        showNotification('Please log in to save images to your gallery', 'info');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          const currentUrl = encodeURIComponent(window.location.href);
          window.location.href = `/login?redirect=${currentUrl}`;
        }, 2000);
      }
    });
    
    // Enable the capturer
    console.log('🖼️ Enabling image capture functionality');
    capturer.enable();
    
    // Log that initialization is complete
    console.log('✅ Image capturer initialized successfully');
  }
  
  // Function to show notifications
  function showNotification(message, type = 'info') {
    console.log(`📣 ${type.toUpperCase()}: ${message}`);
    
    // Create container if it doesn't exist
    let container = document.getElementById('gallery-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gallery-notifications';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `gallery-notification ${type}`;
    notification.innerHTML = message;
    
    // Style the notification
    notification.style.backgroundColor = getBackgroundColor(type);
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.margin = '8px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    notification.style.minWidth = '250px';
    notification.style.animation = 'slideIn 0.5s ease-out forwards';
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }
  
  // Helper to get notification background color
  function getBackgroundColor(type) {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      default: return '#2196f3'; // info
    }
  }
  
  // Add CSS for animations and gallery link
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .gallery-link {
      display: inline-block;
      margin-left: 8px;
      padding: 2px 8px;
      background-color: #ffffff;
      color: #2196f3;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.2s ease;
    }
    
    .gallery-link:hover {
      background-color: #e3f2fd;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
});
