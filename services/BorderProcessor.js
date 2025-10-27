/**
 * Border Processor Service
 * Adds decorative borders to images with customizable colors and widths
 * Perfect for merchandise printing with professional-grade borders
 */

const Sharp = require('sharp');

class BorderProcessor {
  /**
   * Apply border to image
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} borderParams - Border parameters
   * @returns {Promise<Buffer>} - Image with border applied
   */
  async applyBorder(imageBuffer, borderParams = {}) {
    try {
      const {
        enabled = false,
        width = 0,
        widthPixels = 0,
        colorHex = '#000000'
      } = borderParams;

      if (!enabled || width === 0 || widthPixels === 0) {
        console.log('⚠️ Border disabled or width is 0, returning original image');
        return imageBuffer;
      }

      console.log(`🖼️ Applying border: ${widthPixels}px, Color: ${colorHex}`);

      // Get image metadata
      const metadata = await Sharp(imageBuffer).metadata();
      const { width: imgWidth, height: imgHeight } = metadata;

      // Calculate new dimensions with border
      const newWidth = imgWidth + (widthPixels * 2);
      const newHeight = imgHeight + (widthPixels * 2);

      // Parse hex color to RGB
      const { r, g, b } = this.hexToRGB(colorHex);

      console.log(`📐 Original: ${imgWidth}x${imgHeight}, With border: ${newWidth}x${newHeight}`);

      // Create image with border using extend
      const result = await Sharp(imageBuffer)
        .extend({
          top: widthPixels,
          bottom: widthPixels,
          left: widthPixels,
          right: widthPixels,
          background: { r, g, b, alpha: 1 }
        })
        .webp({
          quality: 85,
          alphaQuality: 100
        })
        .toBuffer();

      console.log(`✅ Border applied successfully: ${(result.length / 1024).toFixed(2)} KB`);
      return result;

    } catch (error) {
      console.error(`❌ Error applying border:`, error.message);
      throw error;
    }
  }

  /**
   * Convert hex color to RGB object
   * @param {string} hex - Hex color code (e.g., '#FF0000')
   * @returns {Object} RGB object {r, g, b}
   */
  hexToRGB(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex string
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }

  /**
   * Get border color options
   * @returns {Array} Array of color objects with name and hex
   */
  getColorPalette() {
    const effectsConfig = require('../config/effectsConfig');
    return effectsConfig.borderConfig.colors;
  }

  /**
   * Get border width options
   * @returns {Array} Array of width options
   */
  getWidthOptions() {
    const effectsConfig = require('../config/effectsConfig');
    return effectsConfig.borderConfig.widths;
  }

  /**
   * Validate border parameters
   * @param {Object} borderParams - Border parameters to validate
   * @returns {Object} Validation result {valid: boolean, errors: []}
   */
  validateBorderParams(borderParams = {}) {
    const errors = [];
    const { enabled, width, colorHex } = borderParams;

    if (enabled && width) {
      if (width < 0 || width > 4) {
        errors.push('Border width must be between 0 and 4');
      }

      if (!colorHex || !colorHex.match(/^#[0-9A-F]{6}$/i)) {
        errors.push('Invalid color hex format. Expected format: #RRGGBB');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = BorderProcessor;
