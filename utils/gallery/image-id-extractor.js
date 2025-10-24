/**
 * Gallery Image ID Extractor
 * Shared utility to extract imageId from gallery storage responses
 */

/**
 * Extract imageId from gallery image object
 * @param {Object} imageObject - Gallery image object from listUserGalleryImages
 * @returns {string|null} - Image ID (fileName or relativePath)
 */
function extractImageId(imageObject) {
  if (!imageObject) return null;
  return imageObject.fileName || imageObject.relativePath || null;
}

/**
 * Extract imageId from first image in array
 * @param {Array} images - Array of gallery images
 * @returns {string|null} - Image ID or null
 */
function extractFirstImageId(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  return extractImageId(images[0]);
}

module.exports = {
  extractImageId,
  extractFirstImageId
};
