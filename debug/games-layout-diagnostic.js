/**
 * Games Page Layout Diagnostic
 * Check for issues with background gallery positioning
 */

console.log('🔍 GAMES PAGE LAYOUT DIAGNOSTIC');
console.log('====================================');

// Check if gallery container exists
const galleryContainer = document.getElementById('games-background-gallery');
console.log('Gallery container found:', !!galleryContainer);

if (galleryContainer) {
    console.log('Gallery container styles:');
    const styles = window.getComputedStyle(galleryContainer);
    console.log('- Position:', styles.position);
    console.log('- Z-index:', styles.zIndex);
    console.log('- Width:', styles.width);
    console.log('- Height:', styles.height);
    console.log('- Top:', styles.top);
    console.log('- Left:', styles.left);
}

// Check main content container
const mainContainer = document.querySelector('.games-container');
console.log('Main container found:', !!mainContainer);

if (mainContainer) {
    console.log('Main container styles:');
    const styles = window.getComputedStyle(mainContainer);
    console.log('- Position:', styles.position);
    console.log('- Z-index:', styles.zIndex);
    console.log('- Margin-top:', styles.marginTop);
    console.log('- Padding-top:', styles.paddingTop);
}

// Check for any large images
setTimeout(() => {
    const galleryImages = document.querySelectorAll('.games-background-gallery-image');
    console.log('Gallery images found:', galleryImages.length);
    
    galleryImages.forEach((img, index) => {
        const rect = img.getBoundingClientRect();
        console.log(`Image ${index + 1}:`, {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            position: window.getComputedStyle(img).position
        });
    });
    
    // Check if images are pushing content down
    if (galleryImages.length > 0) {
        const firstImg = galleryImages[0];
        const imgBottom = firstImg.getBoundingClientRect().bottom;
        const mainTop = mainContainer ? mainContainer.getBoundingClientRect().top : 0;
        
        console.log('Image bottom:', imgBottom);
        console.log('Main container top:', mainTop);
        console.log('Images pushing content:', imgBottom > mainTop);
    }
}, 2000); // Wait for images to load