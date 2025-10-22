/**
 * Image Capture Initializer
 * 
 * This file initializes the image capture functionality across the site,
 * enabling users to save images to their personal gallery.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the image capturer
  const capturer = new ImageCapturer({
    requireAuth: true, // Require authentication to save images
    
    // Custom handler when an image is captured
    onCapture: async (imageData) => {
      try {
        const response = await fetch('/api/gallery/user/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(imageData),
          credentials: 'include' // Include cookies for authentication
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save image: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Image saved to gallery:', result);
        
        // Show saved notification
        showNotification('Image saved to your gallery!', 'success');
        
      } catch (error) {
        console.error('Error saving image to gallery:', error);
        showNotification('Failed to save image. Please try again.', 'error');
      }
    },
    
    // Custom handler when authentication is needed
    onAuthNeeded: () => {
      showNotification('Please log in to save images to your gallery', 'warning');
      
      // Store the current URL to redirect back after login
      const currentUrl = encodeURIComponent(window.location.href);
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = `/login?redirect=${currentUrl}`;
      }, 2000);
    }
  });
  
  // Enable the capturer
  capturer.enable();
  
  // Function to show notifications
  function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
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
    notification.textContent = message;
    
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
  
  // Helper function to get notification background color based on type
  function getBackgroundColor(type) {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      default: return '#2196f3'; // info
    }
  }
  
  // Add CSS for animations
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
  `;
  document.head.appendChild(style);
});