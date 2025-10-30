/**
 * Border Processor Service
 * Adds decorative borders to images with customizable colors and widths
 * Perfect for merchandise printing with professional-grade borders
 */

const Sharp = require('sharp');

class BorderProcessor {
  /**
   * Apply border to image (INSET - preserves original dimensions)
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} borderParams - Border parameters
   * @returns {Promise<Buffer>} - Image with inset border applied
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

      console.log(`🖼️ Applying INSET border: ${widthPixels}px, Color: ${colorHex}`);

      // Get image metadata
      const metadata = await Sharp(imageBuffer).metadata();
      const { width: imgWidth, height: imgHeight } = metadata;

      console.log(`📐 Image dimensions preserved: ${imgWidth}x${imgHeight} (no dimension change)`);

      // Clean SVG approach - single composite operation with proper inset border
      const maxAllowedBorder = Math.min(imgWidth, imgHeight) / 4; // 25% of smallest dimension
      const actualBorderWidth = Math.min(widthPixels, maxAllowedBorder);
      
      console.log(`🎨 Clean SVG Border: ${actualBorderWidth}px, inset within ${imgWidth}x${imgHeight}`);

      // Create clean SVG with proper inset border frame
      const borderSvg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${imgWidth}" height="${actualBorderWidth}" fill="${colorHex}"/>
        <rect x="0" y="${imgHeight - actualBorderWidth}" width="${imgWidth}" height="${actualBorderWidth}" fill="${colorHex}"/>
        <rect x="0" y="0" width="${actualBorderWidth}" height="${imgHeight}" fill="${colorHex}"/>
        <rect x="${imgWidth - actualBorderWidth}" y="0" width="${actualBorderWidth}" height="${imgHeight}" fill="${colorHex}"/>
      </svg>`;

      // Single composite operation - most reliable approach
      const result = await Sharp(imageBuffer)
        .composite([{
          input: Buffer.from(borderSvg),
          top: 0,
          left: 0,
          blend: 'over'
        }])
        .png()
        .toBuffer();

      console.log(`✅ INSET border applied successfully: ${(result.length / 1024).toFixed(2)} KB`);
      console.log(`✅ Dimensions unchanged: ${imgWidth}x${imgHeight} - compatible with all Printify products`);
      return result;

    } catch (error) {
      console.error(`❌ Error applying inset border:`, error.message);
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
