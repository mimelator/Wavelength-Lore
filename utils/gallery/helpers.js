/**
 * Gallery Helper Functions
 * 
 * Provides helper functions for integrating gallery functionality with other parts of the site
 */

const express = require('express');
const router = express.Router();
const { saveImageToFirebase } = require('../../services/firebase/galleryService');

/**
 * Save an image REFERENCE from the site to the user's gallery
 * 
 * CRITICAL: This does NOT duplicate images to S3. It stores ONLY a reference 
 * to the original image location in Firebase.
 * 
 * @param {string} imageUrl - The URL of the image to save
 * @param {string} title - The title of the image
 * @param {string} sourceUrl - The source URL where the image was found
 * @param {string} userId - The user ID to save the image for
 * @param {Array<string>} userGroups - The user's group memberships
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function saveContentImageToUserGallery(imageUrl, title, sourceUrl, userId, userGroups) {
  try {
    console.log(`🖼️ Saving image REFERENCE to gallery for user: ${userId}`);
    console.log(`🔗 Image URL: ${imageUrl}`);
    console.log(`📝 Title: ${title}`);
    console.log(`👥 User groups:`, userGroups);
    
    // Validate input parameters
    if (!imageUrl) {
      console.error('❌ Missing image URL');
      return {
        success: false,
        error: 'Missing image URL'
      };
    }
    
    if (!userId) {
      console.error('❌ Missing user ID');
      return {
        success: false,
        error: 'Missing user ID'
      };
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (urlError) {
      console.error('❌ Invalid image URL format:', urlError.message);
      return {
        success: false,
        error: `Invalid image URL: ${urlError.message}`
      };
    }
    
    // Extract filename from URL for reference purposes
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    console.log(`📄 Filename: ${fileName}`);
    
    // Save REFERENCE (bookmark) to Firebase WITHOUT uploading to S3
    console.log(`💾 Saving bookmark to Firebase (NO S3 DUPLICATION)...`);
    const firebaseResult = await saveImageToFirebase(
      userId,
      imageUrl, // Original URL - NOT S3
      title || fileName,
      null, // No relativePath - this is a content image bookmark
      fileName,
      sourceUrl || '',
      [], // No tags for content images
      userGroups
    );
    
    if (!firebaseResult.success) {
      console.error('❌ Failed to save bookmark to Firebase:', firebaseResult.error);
      return firebaseResult;
    }
    
    console.log(`✅ Bookmark saved to Firebase with ID: ${firebaseResult.id}`);
    console.log(`🔗 Stored original URL (no S3 duplication): ${imageUrl}`);
    
    // Return reference to original URL WITHOUT uploading to S3
    return {
      success: true,
      url: imageUrl, // Return original URL
      fileName: fileName,
      relativePath: null, // No S3 path - not duplicated
      sourceUrl: sourceUrl,
      bookmarkId: firebaseResult.id
    };
  } catch (error) {
    console.error('Error saving content image reference to gallery:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to save image reference to gallery',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

module.exports = {
  saveContentImageToUserGallery
};
