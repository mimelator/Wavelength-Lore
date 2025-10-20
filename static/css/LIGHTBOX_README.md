# Lightbox Component

A reusable full-screen image viewer component with smooth animations and keyboard support.

## Files

- **CSS**: `/static/css/lightbox.css` - All styling for the lightbox
- **JavaScript**: `/static/js/lightbox.js` - All functionality for the lightbox

## Installation

### 1. Include the files in your page

```html
<link rel="stylesheet" href="<%= cdnUrl %>/css/lightbox.css">
<script src="<%= cdnUrl %>/js/lightbox.js"></script>
```

### 2. Add the HTML structure (usually in the body)

```html
<!-- Lightbox HTML Structure -->
<div id="imageLightbox" class="lightbox" onclick="closeLightbox(event)">
    <div class="lightbox-close" onclick="closeLightbox(event)">×</div>
    <img id="lightboxImage" class="lightbox-image" alt="Enlarged view">
    <div id="lightboxInfo" class="lightbox-info"></div>
</div>
```

## Usage

### Open a lightbox

```javascript
// Simple usage
openLightbox('https://example.com/image.jpg', 'Image description');

// With onclick attribute
<img src="thumbnail.jpg" onclick="openLightbox(this.src, 'Gallery Image 1')">

// From JavaScript
document.querySelector('.my-image').addEventListener('click', function() {
    openLightbox(this.src, 'Main Product Image');
});
```

### Close lightbox

The lightbox closes automatically when:
- User clicks the close button (×)
- User clicks the dark background
- User clicks the image itself
- User presses the `Escape` key

You can also manually close it:
```javascript
closeLightbox(event);
```

## Features

✅ **Full-screen display** - Nearly 95% of viewport
✅ **Smooth animations** - Fade-in and zoom-in effects
✅ **Keyboard support** - Press Escape to close
✅ **Multiple close methods** - Click background, button, or image
✅ **Responsive** - Works on mobile and desktop
✅ **Accessible** - Respects prefers-reduced-motion
✅ **Info display** - Shows optional description at bottom
✅ **Body scroll lock** - Prevents background scrolling

## Examples

### Gallery Integration

```html
<div class="image-gallery">
    <img src="image1.jpg" onclick="openLightbox('image1.jpg', 'Gallery Image 1')">
    <img src="image2.jpg" onclick="openLightbox('image2.jpg', 'Gallery Image 2')">
    <img src="image3.jpg" onclick="openLightbox('image3.jpg', 'Gallery Image 3')">
</div>
```

### Dynamic Images

```javascript
const images = [
    { url: 'img1.jpg', title: 'Image 1' },
    { url: 'img2.jpg', title: 'Image 2' }
];

images.forEach(img => {
    const element = document.createElement('img');
    element.src = img.url;
    element.onclick = () => openLightbox(img.url, img.title);
    gallery.appendChild(element);
});
```

### AI Generated Images

```javascript
// After generating images
displayGeneratedImages(generatedImages);

function displayGeneratedImages(images) {
    const html = images.map((img, i) => `
        <img src="${img.url}" 
             onclick="openLightbox('${img.url}', 'Generated Image ${i + 1}')"
             style="cursor: zoom-in;">
    `).join('');
    container.innerHTML = html;
}
```

## Customization

The lightbox styling can be customized by overriding CSS variables or classes in your page's styles:

```css
/* Change background opacity */
.lightbox {
    background: rgba(0, 0, 0, 0.98); /* More opaque */
}

/* Change close button style */
.lightbox-close {
    background: rgba(255, 0, 0, 0.7); /* Red background */
    font-size: 40px; /* Smaller */
}

/* Change info bar style */
.lightbox-info {
    background: rgba(102, 126, 234, 0.9); /* Brand color */
    font-size: 16px; /* Larger text */
}
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The lightbox requires the HTML structure to be present on the page
- Element IDs must match: `imageLightbox`, `lightboxImage`, `lightboxInfo`
- JavaScript file is self-initializing (no manual init required)
- Works with both relative and absolute image URLs
- Images must be accessible (CORS-enabled for external sources)

## Current Implementations

This lightbox is currently used in:

1. **Edit Content Page** (`views/edit-content.ejs`)
   - Main image preview
   - Gallery thumbnails
   - AI-generated images

2. **Future Pages** (can be easily added)
   - Lore gallery page
   - Character detail page
   - Episode carousel images
   - Forum post images
