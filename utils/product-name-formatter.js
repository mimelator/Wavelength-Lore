/**
 * Product Name Formatter Utility
 * 
 * Converts image filenames into pretty product titles
 * Example: "daphne.webp" + "T-Shirt" → "Daphne T-Shirt"
 */

/**
 * Prettify an image filename by removing extension and formatting
 * @param {string} filename - The image filename (e.g., "daphne.webp")
 * @returns {string} - Prettified name (e.g., "Daphne")
 */
function prettifyImageName(filename) {
  if (!filename) return '';
  
  // Remove file extension
  let name = filename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '');
  
  // Replace hyphens, underscores, and dots with spaces
  name = name.replace(/[-_.]/g, ' ');
  
  // Replace multiple spaces with single space
  name = name.replace(/\s+/g, ' ');
  
  // Capitalize first letter of each word
  name = name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Trim extra spaces
  name = name.trim();
  
  return name;
}

/**
 * Generate a complete product title from filename and product type
 * @param {string} filename - The image filename (e.g., "daphne.webp")
 * @param {string} productType - The product type (e.g., "T-Shirt")
 * @returns {string} - Complete product title (e.g., "Daphne T-Shirt")
 */
function generateProductTitle(filename, productType) {
  const prettyName = prettifyImageName(filename);
  if (!prettyName) return productType || '';
  if (!productType) return prettyName;
  return `${prettyName} ${productType}`;
}

module.exports = {
  prettifyImageName,
  generateProductTitle
};
