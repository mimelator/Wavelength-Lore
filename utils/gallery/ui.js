/**
 * Gallery UI Components
 * 
 * Provides UI components and helpers for integrating gallery functionality 
 * throughout the site
 */

/**
 * Create a "Save to Gallery" button that can be added to content pages
 * 
 * @param {string} imageUrl - The URL of the image to save
 * @param {string} title - The title/caption for the image
 * @param {string} sourceUrl - The URL of the page where the image appears (optional)
 * @returns {string} HTML for a save to gallery button
 */
function createSaveToGalleryButton(imageUrl, title, sourceUrl = '') {
  // Sanitize inputs for HTML attributes
  const safeImageUrl = imageUrl.replace(/"/g, '&quot;');
  const safeTitle = title.replace(/"/g, '&quot;');
  const safeSourceUrl = sourceUrl.replace(/"/g, '&quot;');
  
  // Create a unique ID for the button
  const buttonId = `save-to-gallery-${Math.random().toString(36).substring(2, 10)}`;
  
  return `
    <button 
      id="${buttonId}" 
      class="save-to-gallery-btn" 
      data-image-url="${safeImageUrl}" 
      data-title="${safeTitle}" 
      data-source-url="${safeSourceUrl}">
      <i class="fas fa-bookmark"></i> Save to Gallery
    </button>
    <script>
      document.getElementById('${buttonId}').addEventListener('click', function(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const imageUrl = button.getAttribute('data-image-url');
        const title = button.getAttribute('data-title');
        const sourceUrl = button.getAttribute('data-source-url');
        
        // Save the image to the gallery
        fetch('/gallery/api/user/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            url: imageUrl,
            title: title,
            sourceUrl: sourceUrl
          })
        })
        .then(response => {
          if (response.status === 401) {
            // User is not logged in, redirect to login page
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = \`/login?redirect=\${currentUrl}&message=Please log in to save images to your gallery\`;
            return;
          }
          return response.json();
        })
        .then(data => {
          if (data && data.success) {
            // Show success message
            button.innerHTML = '<i class="fas fa-check"></i> Saved!';
            button.disabled = true;
            button.classList.add('saved');
            
            // Reset button after 3 seconds
            setTimeout(() => {
              button.innerHTML = '<i class="fas fa-bookmark"></i> Save to Gallery';
              button.disabled = false;
              button.classList.remove('saved');
            }, 3000);
          } else if (data) {
            // Show error message
            alert(data.error || 'Failed to save image to gallery');
          }
        })
        .catch(error => {
          console.error('Error saving image to gallery:', error);
          alert('Error saving image to gallery');
        });
      });
    </script>
    <style>
      .save-to-gallery-btn {
        display: inline-block;
        padding: 5px 10px;
        background-color: #8e44ad;
        color: white;
        border: 2px solid #333;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'AnimeAce', Arial, sans-serif;
        font-size: 12px;
        transition: all 0.3s ease;
        margin-top: 5px;
      }
      
      .save-to-gallery-btn:hover {
        background-color: #703688;
        transform: translateY(-2px);
      }
      
      .save-to-gallery-btn.saved {
        background-color: #27ae60;
      }
      
      .save-to-gallery-btn i {
        margin-right: 5px;
      }
    </style>
  `;
}

module.exports = {
  createSaveToGalleryButton
};