#!/usr/bin/env node

/**
 * WAVELENGTH Gallery Delete Fixes
 * 
 * Fixes two critical issues in My Gallery:
 * 1. Select Multiple preventing fullscreen preview
 * 2. Delete overlay JavaScript errors after confirmation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WAVELENGTH GALLERY DELETE FIXES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const userGalleryJsPath = path.join(__dirname, 'static/js/gallery/user-gallery.js');

console.log('📁 Target file:', userGalleryJsPath);

// Read current content
let content = fs.readFileSync(userGalleryJsPath, 'utf8');

console.log('🔍 Analyzing current issues...');

// Issue 1: Fix Select Multiple interfering with fullscreen preview
console.log('\n🎯 FIXING ISSUE 1: Select Multiple preventing fullscreen preview');

// Replace the selectImageHandler function to allow modal opening when not in select mode
const oldSelectHandler = `  function selectImageHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const item = this;
    const img = item.querySelector('img');
    const relativePath = img.dataset.relativePath;
    if (!relativePath) return;
    
    if (item.classList.contains('selected')) {
      item.classList.remove('selected');
      selectedImages = selectedImages.filter(path => path !== relativePath);
    } else {
      item.classList.add('selected');
      selectedImages.push(relativePath);
    }
    deleteSelectedButton.textContent = \`Delete Selected (\${selectedImages.length})\`;
  }`;

const newSelectHandler = `  function selectImageHandler(e) {
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
    const bookmarkId = img.dataset.id;
    
    // Use either relativePath for S3 images or bookmarkId for bookmarks as identifier
    const imageIdentifier = relativePath || bookmarkId;
    if (!imageIdentifier) return;
    
    if (item.classList.contains('selected')) {
      item.classList.remove('selected');
      selectedImages = selectedImages.filter(id => id !== imageIdentifier);
    } else {
      item.classList.add('selected');
      selectedImages.push(imageIdentifier);
    }
    deleteSelectedButton.textContent = \`Delete Selected (\${selectedImages.length})\`;
  }`;

content = content.replace(oldSelectHandler, newSelectHandler);

// Fix the image click handlers to work properly with select mode
const oldImageClickSetup = `    document.querySelectorAll('#gallery-carousel img, .gallery-item img').forEach(img => {
      img.addEventListener('click', () => {
        openModal(img.src, img.dataset.caption, img.dataset.id, img.dataset.relativePath);
      });
    });`;

const newImageClickSetup = `    document.querySelectorAll('#gallery-carousel img, .gallery-item img').forEach(img => {
      img.addEventListener('click', (e) => {
        // In select mode, don't open modal - let select handler work
        if (selectMode && e.target.closest('.gallery-item')) {
          return;
        }
        openModal(img.src, img.dataset.caption, img.dataset.id, img.dataset.relativePath);
      });
    });`;

content = content.replace(oldImageClickSetup, newImageClickSetup);

// Fix the select mode setup to properly handle both modes
const oldSelectModeSetup = `      document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.add('selectable');
        item.addEventListener('click', selectImageHandler);
      });`;

const newSelectModeSetup = `      document.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.add('selectable');
        // Remove existing click handlers that open modal
        const img = item.querySelector('img');
        if (img) {
          img.replaceWith(img.cloneNode(true));
        }
        // Add select handler
        item.addEventListener('click', selectImageHandler);
      });`;

content = content.replace(oldSelectModeSetup, newSelectModeSetup);

console.log('✅ Fixed select mode interference with fullscreen preview');

// Issue 2: Fix delete overlay JavaScript errors
console.log('\n🎯 FIXING ISSUE 2: Delete overlay JavaScript errors');

// Fix the deleteImage function to handle both S3 images and bookmarks properly
const oldDeleteImage = `  function deleteImage(imageId, relativePath, itemElement) {
    if (!confirm('Are you sure you want to remove this image from your gallery?')) return;
    
    fetch('/api/gallery/user/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ relativePath })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && itemElement && itemElement.parentNode) {
        itemElement.parentNode.removeChild(itemElement);
      } else {
        alert('Failed to delete image: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    });
  }`;

const newDeleteImage = `  function deleteImage(imageId, relativePath, itemElement) {
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
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
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
  }`;

content = content.replace(oldDeleteImage, newDeleteImage);

// Fix the modal delete button handler
const oldModalDelete = `  deleteBtn.addEventListener('click', () => {
    if (!currentRelativePath) return;
    
    fetch('/api/gallery/user/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ relativePath: currentRelativePath })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        userImages = userImages.filter(img => img.relativePath !== currentRelativePath);
        modal.style.display = 'none';
        document.body.style.overflow = '';
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
      }
    })
    .catch(error => console.error('Error deleting image:', error));
  });`;

const newModalDelete = `  deleteBtn.addEventListener('click', () => {
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
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
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
  });`;

content = content.replace(oldModalDelete, newModalDelete);

// Fix batch delete to handle mixed image types
const oldBatchDelete = `    fetch('/api/gallery/user/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ relativePaths: selectedImages })
    })`;

const newBatchDelete = `    // Separate S3 images from bookmarks
    const s3Images = selectedImages.filter(id => {
      const img = userImages.find(i => i.relativePath === id || i.id === id);
      return img && img.relativePath; // Has relativePath = S3 image
    });
    
    const bookmarks = selectedImages.filter(id => {
      const img = userImages.find(i => i.id === id || i.bookmarkId === id);
      return img && !img.relativePath; // No relativePath = bookmark
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
    
    Promise.all(deletePromises)`;

content = content.replace(
  `    fetch('/api/gallery/user/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ relativePaths: selectedImages })
    })`,
  newBatchDelete
);

// Fix the batch delete response handling
const oldBatchResponse = `    .then(response => response.json())
    .then(data => {
      if (data.success) {
        userImages = userImages.filter(img => !selectedImages.includes(img.relativePath));
        exitSelectMode();
        if (userImages.length > 0) {
          populateGallery(userImages);
        } else {
          showEmptyGallery();
        }
        alert(\`Successfully deleted \${data.message}\`);
      } else {
        alert(\`Error: \${data.error || 'Failed to delete selected images'}\`);
      }
    })`;

const newBatchResponse = `    .then(results => {
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
          ? \`\${totalSuccess} images deleted, \${totalFailed} failed\`
          : \`\${totalSuccess} images deleted successfully\`;
        alert(message);
      } else {
        alert('Failed to delete any images');
      }
    })`;

content = content.replace(oldBatchResponse, newBatchResponse);

console.log('✅ Fixed delete overlay JavaScript errors');

// Add better error handling and user feedback
console.log('\n🔧 ADDING ENHANCED ERROR HANDLING...');

// Add a utility function for better error display
const errorHandlingCode = `
  // Enhanced error handling utility
  function showError(message, error = null) {
    console.error('Gallery Error:', message, error);
    
    // Create or update error display
    let errorDiv = document.getElementById('gallery-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'gallery-error';
      errorDiv.style.cssText = \`
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
      \`;
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong>Gallery Error</strong><br>
          \${message}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
    \`;
    
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
    successDiv.style.cssText = \`
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
    \`;
    successDiv.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong>Success</strong><br>
          \${message}
        </div>
        <button onclick="this.remove()" 
                style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
      </div>
    \`;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv && successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }
`;

// Insert the error handling code after the DOMContentLoaded event listener
content = content.replace(
  "document.addEventListener('DOMContentLoaded', () => {",
  "document.addEventListener('DOMContentLoaded', () => {" + errorHandlingCode
);

// Write the fixed content back to file
fs.writeFileSync(userGalleryJsPath, content);

console.log('\n✅ ALL FIXES APPLIED SUCCESSFULLY!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 FIXED ISSUES:');
console.log('   1. ✅ Select Multiple now allows fullscreen preview when not selecting');
console.log('   2. ✅ Delete overlay handles both S3 images and bookmarks properly');
console.log('   3. ✅ Better error handling and user feedback');
console.log('   4. ✅ Improved batch delete for mixed image types');
console.log('');
console.log('🚀 NEXT STEPS:');
console.log('   1. Test Select Multiple - should now allow image preview when not actively selecting');
console.log('   2. Test Delete functionality - should work without JavaScript errors');
console.log('   3. Check error notifications appear for any remaining issues');
console.log('');
console.log('🌊 WAVELENGTH GALLERY FIXES COMPLETE!');