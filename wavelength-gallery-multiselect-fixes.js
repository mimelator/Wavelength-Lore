#!/usr/bin/env node

/**
 * WAVELENGTH Gallery Multi-Select Fixes
 * 
 * Fixes two issues with multi-select functionality:
 * 1. Selection circle positioning (CSS issue)
 * 2. Multi-delete not working (image identification issue)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WAVELENGTH GALLERY MULTI-SELECT FIXES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Fix 1: CSS positioning issue
console.log('\n🎯 FIXING ISSUE 1: Selection circle positioning');

const cssPath = path.join(__dirname, 'static/css/gallery/user-gallery.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Fix the circle positioning by making it absolutely positioned within the gallery item
const oldCircleCSS = `.gallery-item.selectable::before {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  background-color: rgba(0,0,0,0.3);
  z-index: 10;
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}`;

const newCircleCSS = `.gallery-item.selectable::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #fff;
  background-color: rgba(0,0,0,0.5);
  z-index: 15;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transition: all 0.3s ease;
  pointer-events: none; /* Ensure it doesn't interfere with clicks */
}`;

cssContent = cssContent.replace(oldCircleCSS, newCircleCSS);

// Fix the checkmark positioning too
const oldCheckmarkCSS = `.gallery-item.selectable::after {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  opacity: 0;
  transition: opacity 0.3s ease;
}`;

const newCheckmarkCSS = `.gallery-item.selectable::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 16;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none; /* Ensure it doesn't interfere with clicks */
}`;

cssContent = cssContent.replace(oldCheckmarkCSS, newCheckmarkCSS);

// Ensure gallery items have proper positioning context
const galleryItemBase = `.gallery-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 3px solid #333;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden; /* Ensure positioning context */
}`;

// Check if gallery-item already has position: relative, if not add it
if (!cssContent.includes('.gallery-item {') || !cssContent.includes('position: relative')) {
  console.log('   Adding position: relative to .gallery-item');
  // Find and replace or add the gallery-item rule
  if (cssContent.includes('.gallery-item {')) {
    cssContent = cssContent.replace(
      /\.gallery-item\s*\{([^}]+)\}/,
      (match, content) => {
        if (!content.includes('position:') && !content.includes('position ')) {
          return `.gallery-item {\n  position: relative;${content}\n}`;
        }
        return match;
      }
    );
  } else {
    cssContent += `\n\n/* Ensure gallery items have positioning context for selection circles */\n.gallery-item {\n  position: relative;\n}\n`;
  }
}

fs.writeFileSync(cssPath, cssContent);
console.log('✅ Fixed selection circle positioning in CSS');

// Fix 2: JavaScript multi-delete logic
console.log('\n🎯 FIXING ISSUE 2: Multi-delete not working');

const jsPath = path.join(__dirname, 'static/js/gallery/user-gallery.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Debug the selection process - add logging
const oldSelectHandler = `  function selectImageHandler(e) {
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
    deleteSelectedButton.textContent = \`Delete Selected (\${selectedImages.length})\`;
  }`;

jsContent = jsContent.replace(oldSelectHandler, newSelectHandler);

// Fix the batch delete logic to be more robust
const oldBatchDelete = `    // Separate S3 images from bookmarks
    const s3Images = selectedImages.filter(id => {
      const img = userImages.find(i => i.relativePath === id || i.id === id);
      return img && img.relativePath; // Has relativePath = S3 image
    });
    
    const bookmarks = selectedImages.filter(id => {
      const img = userImages.find(i => i.id === id || i.bookmarkId === id);
      return img && !img.relativePath; // No relativePath = bookmark
    });`;

const newBatchDelete = `    console.log('🔍 Batch delete - selectedImages:', selectedImages);
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
    });`;

jsContent = jsContent.replace(oldBatchDelete, newBatchDelete);

fs.writeFileSync(jsPath, jsContent);
console.log('✅ Fixed multi-delete image identification logic');

console.log('\n📋 SUMMARY OF FIXES:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 1. Selection circle positioning - moved and sized properly');
console.log('✅ 2. Added pointer-events: none to prevent click interference');
console.log('✅ 3. Enhanced image identifier matching logic');
console.log('✅ 4. Added detailed logging for debugging');
console.log('✅ 5. Improved batch delete logic for mixed image types');

console.log('\n🧪 TESTING INSTRUCTIONS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Visit http://localhost:3001/my-gallery');
console.log('2. Click "Select Multiple" button');
console.log('3. Check that selection circles appear properly positioned');
console.log('4. Select multiple images by clicking on them');
console.log('5. Check browser console for selection logging');
console.log('6. Click "Delete Selected" and verify it works');

console.log('\n🌊 WAVELENGTH MULTI-SELECT FIXES COMPLETE!');