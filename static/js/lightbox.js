/**
 * Lightbox Component JavaScript
 * Reusable full-screen image viewer
 * 
 * Requires: lightbox.css
 * 
 * HTML Structure Required:
 * <div id="imageLightbox" class="lightbox" onclick="closeLightbox(event)">
 *     <div class="lightbox-close" onclick="closeLightbox(event)">×</div>
 *     <img id="lightboxImage" class="lightbox-image" alt="Enlarged view">
 *     <div id="lightboxInfo" class="lightbox-info"></div>
 * </div>
 * 
 * Usage:
 * - openLightbox(imageUrl, imageInfo) - Display an image
 * - closeLightbox(event) - Close the lightbox
 * - Escape key also closes the lightbox
 */

(function() {
    'use strict';

    /**
     * Open lightbox with an image
     * @param {string} imageUrl - URL of the image to display
     * @param {string} imageInfo - Optional description text shown at bottom
     */
    window.openLightbox = function(imageUrl, imageInfo) {
        const lightbox = document.getElementById('imageLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxInfoDiv = document.getElementById('lightboxInfo');
        
        if (!lightbox || !lightboxImage || !lightboxInfoDiv) {
            console.error('Lightbox elements not found. Make sure HTML structure is present.');
            return;
        }

        lightboxImage.src = imageUrl;
        lightboxInfoDiv.textContent = imageInfo || 'Click anywhere to close';
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    /**
     * Close the lightbox
     * @param {Event} event - Click event
     */
    window.closeLightbox = function(event) {
        // Only close if clicking the background, close button, or the image itself
        const clickedElement = event.target;
        const isBackground = clickedElement.id === 'imageLightbox';
        const isCloseButton = clickedElement.classList.contains('lightbox-close');
        const isImage = clickedElement.id === 'lightboxImage';
        
        if (isBackground || isCloseButton || isImage) {
            const lightbox = document.getElementById('imageLightbox');
            if (lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        }
    };

    /**
     * Initialize lightbox functionality
     * Sets up keyboard shortcuts and event listeners
     */
    function initializeLightbox() {
        // Close lightbox with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const lightbox = document.getElementById('imageLightbox');
                if (lightbox && lightbox.classList.contains('active')) {
                    lightbox.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });

        // Optional: Add arrow key navigation if multiple images
        // This can be extended later for gallery navigation
        console.log('✅ Lightbox initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLightbox);
    } else {
        initializeLightbox();
    }

})();
