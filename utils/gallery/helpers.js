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
    
    // Fetch the image
    console.log(`⬇️ Fetching image from URL...`);
    let response;
    try {
      response = await fetch(imageUrl);
    } catch (fetchError) {
      console.error('❌ Network error fetching image:', fetchError);
      return {
        success: false,
        error: `Network error fetching image: ${fetchError.message}`
      };
    }
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `Failed to fetch image: ${response.status} ${response.statusText}`
      };
    }
    
    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      console.error(`❌ Invalid content type: ${contentType} (expected image/*)`);
      return {
        success: false,
        error: `Invalid content type: ${contentType} (expected image/*)`
      };
    }
    
    console.log(`✅ Image fetched successfully`);
    console.log(`📊 Content type: ${contentType}`);
    console.log(`📊 Content length: ${response.headers.get('content-length') || 'unknown'} bytes`);
    
    // Get image data as buffer
    console.log(`📦 Reading image data...`);
    let imageBuffer;
    try {
      imageBuffer = await response.arrayBuffer();
      console.log(`✅ Successfully read image data: ${imageBuffer.byteLength} bytes`);
    } catch (bufferError) {
      console.error('❌ Error reading image data:', bufferError);
      return {
        success: false,
        error: `Error reading image data: ${bufferError.message}`
      };
    }
    
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      console.error('❌ Empty image data (zero bytes)');
      return {
        success: false,
        error: 'Empty image data'
      };
    }
    
    const buffer = Buffer.from(imageBuffer);
    console.log(`📊 Buffer size: ${buffer.length} bytes`);
    console.log(`📊 Buffer is valid: ${Buffer.isBuffer(buffer)}`);
    
    // Extract file name and extension from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Determine content type from URL extension or response header
    const extension = fileName.split('.').pop().toLowerCase();
    let mimeType = contentType || 'image/jpeg'; // Use response Content-Type if available
    
    // If we couldn't determine from Content-Type, try to infer from extension
    if (!mimeType.startsWith('image/')) {
      if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      }
    }
    
    console.log(`📄 Using mime type: ${mimeType}`);
    
    // Create a meaningful filename
    const fileNameWithoutExt = fileName.split('.')[0];
    const sanitizedTitle = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)
      : fileNameWithoutExt;
    
    const finalFileName = `${sanitizedTitle}.${extension}`;
    console.log(`📄 Final filename: ${finalFileName}`);
    
    // Upload to S3 with metadata
    console.log(`⬆️ Uploading to S3...`);
    const uploadResult = await galleryStorage.uploadGalleryImage(
      buffer,
      finalFileName,
      mimeType,
      userId,
      userGroups,
      title || sanitizedTitle, // Use title or sanitized version
      [] // No tags for content images
    );
    
    if (!uploadResult.success) {
      console.error('❌ S3 upload failed:', uploadResult.error);
      return uploadResult;
    }
    
    console.log(`✅ Image successfully saved to gallery`);
    console.log(`🔗 CDN URL: ${uploadResult.url}`);
    console.log(`📁 Path: ${uploadResult.relativePath}`);
    
    // Add metadata about source
    uploadResult.sourceUrl = sourceUrl;
    uploadResult.title = title;
    
    return uploadResult;
  } catch (error) {
    console.error('Error saving content image to gallery:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to save image to gallery',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

module.exports = {
  saveContentImageToUserGallery
};