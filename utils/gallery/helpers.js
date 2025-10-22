/**
 * Gallery Helper Functions
 * 
 * Provides helper functions for integrating gallery functionality with other parts of the site
 */

const express = require('express');
const router = express.Router();
const galleryStorage = require('./storage');

/**
 * Save an image from the site to the user's gallery
 * This can be used by other routes to allow saving of content images to user galleries
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
    console.log(`🖼️ Saving image to gallery for user: ${userId}`);
    console.log(`🔗 Image URL: ${imageUrl}`);
    console.log(`📝 Title: ${title}`);
    console.log(`👥 User groups:`, userGroups);
    
    // Fetch the image
    console.log(`⬇️ Fetching image from URL...`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `Failed to fetch image: ${response.status} ${response.statusText}`
      };
    }
    
    console.log(`✅ Image fetched successfully`)
    
    // Get image data as buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Extract file name and extension from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Determine content type from URL extension
    const extension = fileName.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    
    if (extension === 'png') {
      mimeType = 'image/png';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }
    
    // Create a meaningful filename
    const fileNameWithoutExt = fileName.split('.')[0];
    const sanitizedTitle = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)
      : fileNameWithoutExt;
    
    // Upload to S3 with metadata
    const uploadResult = await galleryStorage.uploadGalleryImage(
      buffer,
      `${sanitizedTitle}.${extension}`,
      mimeType,
      userId,
      userGroups
    );
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    // Add metadata about source
    uploadResult.sourceUrl = sourceUrl;
    uploadResult.title = title;
    
    return uploadResult;
  } catch (error) {
    console.error('Error saving content image to gallery:', error);
    return {
      success: false,
      error: error.message || 'Failed to save image to gallery'
    };
  }
}

module.exports = {
  saveContentImageToUserGallery
};