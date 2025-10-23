/**
 * Gallery Client-Side Debugging Tools
 * 
 * This script enhances the client-side gallery code with better error logging
 * and diagnostics to help troubleshoot upload issues.
 * 
 * INSTRUCTIONS: 
 * 1. Add this script to your page after the main gallery scripts
 * 2. Open the browser console to see enhanced debug output
 * 3. Click "Save to Gallery" on an image to trigger diagnostics
 */

(function() {
  // Create a styled console logger
  const GalleryDebug = {
    styles: {
      info: 'color: #0066ff; font-weight: bold',
      success: 'color: #00aa00; font-weight: bold',
      warning: 'color: #ff9900; font-weight: bold',
      error: 'color: #ff0000; font-weight: bold',
      network: 'color: #9900cc; font-weight: bold'
    },
    
    log: function(type, ...args) {
      const style = this.styles[type] || '';
      console.log(`%c[Gallery Debug - ${type}]`, style, ...args);
    },
    
    info: function(...args) { this.log('info', ...args); },
    success: function(...args) { this.log('success', ...args); },
    warning: function(...args) { this.log('warning', ...args); },
    error: function(...args) { this.log('error', ...args); },
    network: function(...args) { this.log('network', ...args); }
  };
  
  // Make it globally available
  window.GalleryDebug = GalleryDebug;
  
  GalleryDebug.info('Gallery Debug Tools loaded! Watch this console for detailed diagnostics.');
  
  // Check for authentication
  if (window.userData) {
    GalleryDebug.info('User authentication status:', window.userData.isAuthenticated);
    GalleryDebug.info('User data:', window.userData);
  } else {
    GalleryDebug.warning('window.userData not found. Authentication checks may fail.');
  }
  
  // Check if the UserGallery class exists
  if (typeof window.UserGallery === 'function') {
    GalleryDebug.info('UserGallery class found. Enhancing with debug capabilities...');
    
    // Store the original prototype methods
    const originalLoadUserGallery = window.UserGallery.prototype.loadUserGallery;
    
    // Enhance loadUserGallery with better diagnostics
    window.UserGallery.prototype.loadUserGallery = async function() {
      GalleryDebug.info('Loading user gallery from:', this.apiEndpoint);
      
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
            GalleryDebug.success('Firebase token obtained successfully');
          } catch (tokenError) {
            GalleryDebug.error('Could not get Firebase token:', tokenError.message);
          }
        } else {
          GalleryDebug.warning('Firebase auth not available or user not logged in');
        }
        
        GalleryDebug.network('Making fetch request to:', this.apiEndpoint);
        GalleryDebug.network('Headers:', headers);
        
        const response = await fetch(this.apiEndpoint, {
          headers,
          credentials: 'include' // Include cookies for authentication
        });
        
        GalleryDebug.network('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 401) {
            GalleryDebug.error('Authentication required for gallery (401 Unauthorized)');
          } else {
            GalleryDebug.error(`API request failed with status: ${response.status} ${response.statusText}`);
          }
          
          try {
            // Try to parse error response
            const errorData = await response.json();
            GalleryDebug.error('Error details:', errorData);
          } catch (jsonError) {
            GalleryDebug.error('Could not parse error response');
            const text = await response.text();
            GalleryDebug.error('Raw response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
          }
          
          throw new Error(`Failed to load gallery: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        GalleryDebug.success('Gallery data loaded successfully');
        GalleryDebug.info(`Found ${data.images ? data.images.length : 0} images`);
        
        if (data.images && data.images.length > 0) {
          GalleryDebug.info('First image:', data.images[0]);
        }
        
        this.images = data.images || [];
        
      } catch (error) {
        GalleryDebug.error('Error loading user gallery:', error);
        throw error;
      }
    };
    
    GalleryDebug.success('UserGallery class enhanced successfully');
  } else {
    GalleryDebug.warning('UserGallery class not found. Is the gallery code loaded?');
  }
  
  // Check if the ImageCapturer class exists
  if (typeof window.ImageCapturer === 'function') {
    GalleryDebug.info('ImageCapturer class found. Enhancing with debug capabilities...');
    
    // Store the original prototype methods
    const originalHandleCaptureClick = window.ImageCapturer.prototype.handleCaptureClick;
    
    // Enhance handleCaptureClick with better diagnostics
    window.ImageCapturer.prototype.handleCaptureClick = function(e, img) {
      e.preventDefault();
      e.stopPropagation();
      
      GalleryDebug.info('Image capture button clicked');
      GalleryDebug.info('Image URL:', img.src);
      GalleryDebug.info('Image alt text:', img.alt);
      
      // Check authentication if required
      if (this.options.requireAuth) {
        // Check if the user is authenticated
        const isAuthenticated = window.userData && window.userData.isAuthenticated;
        
        GalleryDebug.info('Authentication required:', true);
        GalleryDebug.info('User is authenticated:', isAuthenticated);
        
        if (!isAuthenticated) {
          GalleryDebug.error('Authentication required but user is not logged in');
          
          // Call auth needed callback if provided
          if (typeof this.options.onAuthNeeded === 'function') {
            GalleryDebug.info('Calling onAuthNeeded callback');
            this.options.onAuthNeeded();
          } else {
            GalleryDebug.warning('No onAuthNeeded callback provided');
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
      
      GalleryDebug.info('Image data:', imageData);
      
      // Call capture callback if provided
      if (typeof this.options.onCapture === 'function') {
        GalleryDebug.info('Calling onCapture callback');
        
        // Wrap the callback to catch and log errors
        try {
          this.options.onCapture(imageData);
        } catch (error) {
          GalleryDebug.error('Error in onCapture callback:', error);
        }
      } else {
        GalleryDebug.warning('No onCapture callback provided');
      }
      
      // Show feedback
      this.showCaptureFeedback(img);
      
      // Add diagnostic overlay
      GalleryDebug.info('Adding diagnostic information to page');
      this.showDiagnosticInfo(img, imageData);
    };
    
    // Add a new method for showing diagnostic information
    window.ImageCapturer.prototype.showDiagnosticInfo = function(img, imageData) {
      // Create diagnostic container
      const diagnosticEl = document.createElement('div');
      diagnosticEl.style.position = 'fixed';
      diagnosticEl.style.bottom = '20px';
      diagnosticEl.style.right = '20px';
      diagnosticEl.style.width = '300px';
      diagnosticEl.style.maxHeight = '400px';
      diagnosticEl.style.overflowY = 'auto';
      diagnosticEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      diagnosticEl.style.color = 'white';
      diagnosticEl.style.padding = '15px';
      diagnosticEl.style.borderRadius = '5px';
      diagnosticEl.style.zIndex = '10000';
      diagnosticEl.style.fontFamily = 'monospace';
      diagnosticEl.style.fontSize = '12px';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = 'Gallery Save Diagnostics';
      title.style.margin = '0 0 10px 0';
      title.style.color = '#33ccff';
      diagnosticEl.appendChild(title);
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '5px';
      closeBtn.style.right = '5px';
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.color = 'white';
      closeBtn.style.fontSize = '20px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(diagnosticEl);
      });
      diagnosticEl.appendChild(closeBtn);
      
      // Create content
      const content = document.createElement('div');
      
      // Image info
      content.innerHTML += '<div style="color: #33ccff; margin-top: 10px;">Image Information:</div>';
      content.innerHTML += `<div>URL: ${truncateMiddle(imageData.url, 40)}</div>`;
      content.innerHTML += `<div>Title: ${imageData.title}</div>`;
      content.innerHTML += `<div>Size: ${img.naturalWidth}x${img.naturalHeight}px</div>`;
      
      // Authentication info
      content.innerHTML += '<div style="color: #33ccff; margin-top: 10px;">Authentication Status:</div>';
      if (window.userData) {
        content.innerHTML += `<div>Logged in: ${window.userData.isAuthenticated ? '✓' : '✗'}</div>`;
        if (window.userData.user) {
          content.innerHTML += `<div>User ID: ${window.userData.user.uid || 'N/A'}</div>`;
        }
      } else {
        content.innerHTML += '<div>User data not available</div>';
      }
      
      // Network request info
      content.innerHTML += '<div style="color: #33ccff; margin-top: 10px;">Upload Request:</div>';
      content.innerHTML += '<div id="network-status">Pending...</div>';
      
      // Add content to diagnostic element
      diagnosticEl.appendChild(content);
      
      // Add to page
      document.body.appendChild(diagnosticEl);
      
      // Make an API call to check the image save status
      this.checkImageSaveStatus(imageData.url, diagnosticEl.querySelector('#network-status'));
    };
    
    // Add method to check image save status
    window.ImageCapturer.prototype.checkImageSaveStatus = function(imageUrl, statusElement) {
      // Check if the image URL is already in user gallery
      fetch('/api/gallery/user/images', {
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        const images = data.images || [];
        GalleryDebug.info(`Found ${images.length} images in user gallery`);
        
        // Check if URL exists in the gallery (approximate match)
        const found = images.find(img => 
          img.url.includes(new URL(imageUrl).pathname.split('/').pop()) || 
          imageUrl.includes(new URL(img.url).pathname.split('/').pop())
        );
        
        if (found) {
          statusElement.innerHTML = `<div style="color: #00cc00">✓ Image found in gallery!</div>`;
          statusElement.innerHTML += `<div>Gallery URL: ${found.url}</div>`;
          statusElement.innerHTML += `<div>Relative Path: ${found.relativePath}</div>`;
        } else {
          statusElement.innerHTML = `<div style="color: #ff0000">✗ Image NOT found in gallery!</div>`;
          statusElement.innerHTML += `<div>Your gallery contains ${images.length} images, but this one is not present.</div>`;
          statusElement.innerHTML += `<div style="margin-top: 10px; font-weight: bold">Troubleshooting:</div>`;
          statusElement.innerHTML += `<div>1. Check browser console for errors</div>`;
          statusElement.innerHTML += `<div>2. Verify S3 bucket permissions</div>`;
          statusElement.innerHTML += `<div>3. Check server logs for upload errors</div>`;
        }
      })
      .catch(error => {
        statusElement.innerHTML = `<div style="color: #ff0000">Error checking gallery: ${error.message}</div>`;
        GalleryDebug.error('Error checking image save status:', error);
      });
    };
    
    // Helper function to truncate long strings in the middle
    function truncateMiddle(str, maxLength) {
      if (str.length <= maxLength) return str;
      const halfLength = Math.floor(maxLength / 2);
      return str.substring(0, halfLength) + '...' + str.substring(str.length - halfLength);
    }
    
    GalleryDebug.success('ImageCapturer class enhanced successfully');
  } else {
    GalleryDebug.warning('ImageCapturer class not found. Is the gallery code loaded?');
  }
  
  // Monitor all fetch requests to gallery endpoints
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && 
        (url.includes('/gallery') || url.includes('/api/gallery'))) {
      GalleryDebug.network(`Fetch request to gallery endpoint: ${url}`);
      if (options) {
        GalleryDebug.network('Fetch options:', {...options, body: options.body ? '[BODY]' : undefined});
      }
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          GalleryDebug.network(`Response from ${url}: ${response.status} ${response.statusText}`);
          return response;
        })
        .catch(error => {
          GalleryDebug.error(`Fetch error for ${url}:`, error);
          throw error;
        });
    }
    
    return originalFetch.apply(this, arguments);
  };
  
  GalleryDebug.info('Installed network request monitoring for gallery endpoints');
  GalleryDebug.info('Debug setup complete. Ready for gallery operations.');
})();