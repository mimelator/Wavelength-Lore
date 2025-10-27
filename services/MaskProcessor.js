/**
 * Mask and Feather Effects Processor
 * Applies shape masks and edge feathering to images for merchandise printing
 *
 * Features:
 * - Heart, Lucky Charm (4-leaf clover), Horseshoe, Mushroom masks
 * - Feathering for smooth edge blending
 * - Alpha channel support for transparency
 */

const Sharp = require('sharp');

class MaskProcessor {
  /**
   * Apply mask and feather effects to image
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} maskParams - Mask and feather parameters
   * @returns {Promise<Buffer>} - Processed image buffer with mask applied
   */
  async processWithMask(imageBuffer, maskParams = {}) {
    try {
      const {
        mask = null,
        featherEdges = 0,
        featherFalloff = 'smooth'
      } = maskParams;

      if (!mask) {
        console.log('⚠️ No mask specified, returning original image');
        return imageBuffer;
      }

      console.log(`🎭 Applying mask: ${mask} with feather: ${featherEdges}`);

      // Get image metadata first
      const metadata = await Sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      console.log(`📐 Image dimensions: ${width}x${height}`);

      // Generate mask SVG based on type
      const maskSvg = this.generateMaskSVG(mask, width, height, featherEdges, featherFalloff);

      // Create mask as PNG, properly sized
      const maskBuffer = await Sharp(maskSvg)
        .resize(width, height, {
          fit: 'fill',
          withoutEnlargement: false
        })
        .png()
        .toBuffer();

      console.log(`✅ Generated mask for ${mask}`);

      // Apply mask using composite directly on the image
      // This is much simpler and avoids memory issues
      const result = await Sharp(imageBuffer)
        .composite([
          {
            input: maskBuffer,
            blend: 'multiply',
            gravity: 'center'
          }
        ])
        .webp({
          quality: 85,
          alphaQuality: 100
        })
        .toBuffer();

      console.log(`✅ Mask applied successfully: ${mask}`);
      return result;

    } catch (error) {
      console.error(`❌ Error applying mask:`, error.message);
      console.error(`Error details:`, error);
      throw error;
    }
  }

  /**
   * Generate mask SVG for different shape types
   * @param {String} maskType - Type of mask (heart, lucky-charm, horseshoe, mushroom)
   * @param {Number} width - Image width
   * @param {Number} height - Image height
   * @param {Number} featherAmount - Feathering amount (0-1)
   * @param {String} falloffType - Feathering falloff type (smooth, linear, radial)
   * @returns {Buffer} - SVG mask as buffer
   */
  generateMaskSVG(maskType, width, height, featherAmount = 0, falloffType = 'smooth') {
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.35; // Scale to fit nicely in image

    let maskPath = '';
    let filterId = `filter-${maskType}`;

    // Create feathering filter - applies blur to the edges
    const featherFilter = featherAmount > 0 ? `
      <filter id="${filterId}">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${featherAmount * 20}" />
      </filter>
    ` : '';

    switch (maskType.toLowerCase()) {
      case 'heart':
        maskPath = this.generateHeartPath(cx, cy, scale);
        break;
      case 'lucky-charm':
      case 'four-leaf':
      case 'clover':
        maskPath = this.generateLuckyCharmPath(cx, cy, scale);
        break;
      case 'horseshoe':
        maskPath = this.generateHorseshoePath(cx, cy, scale);
        break;
      case 'mushroom':
        maskPath = this.generateMushroomPath(cx, cy, scale);
        break;
      default:
        console.warn(`⚠️ Unknown mask type: ${maskType}, using heart as default`);
        maskPath = this.generateHeartPath(cx, cy, scale);
    }

    // Create an SVG with a white shape on black background
    // This will be used as a luminance mask where white = keep, black = transparent
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${featherFilter}
        </defs>
        <!-- Black background for transparency -->
        <rect width="${width}" height="${height}" fill="black"/>
        <!-- White shape with optional feathering -->
        ${featherAmount > 0 ? `<g filter="url(#${filterId})">${maskPath}</g>` : maskPath}
      </svg>
    `;

    return Buffer.from(svg);
  }

  /**
   * Generate heart shape path
   */
  generateHeartPath(cx, cy, scale) {
    // Heart shape SVG path
    const heartWidth = scale * 2;
    const heartHeight = scale * 2;
    const x = cx - heartWidth / 2;
    const y = cy - heartHeight / 2;

    return `
      <path d="
        M ${cx} ${y + heartHeight * 0.35}
        C ${x} ${y}, ${x} ${y + heartHeight * 0.25}, ${x + heartWidth * 0.25} ${y + heartHeight * 0.25}
        C ${x + heartWidth * 0.35} ${y + heartHeight * 0.15}, ${cx} ${y}, ${cx} ${y}
        C ${cx} ${y}, ${x + heartWidth * 0.65} ${y + heartHeight * 0.15}, ${x + heartWidth * 0.75} ${y + heartHeight * 0.25}
        C ${x + heartWidth} ${y + heartHeight * 0.25}, ${x + heartWidth} ${y}, ${cx} ${y + heartHeight * 0.35}
        Z
      " fill="white"/>
    `;
  }

  /**
   * Generate lucky charm / four-leaf clover path
   */
  generateLuckyCharmPath(cx, cy, scale) {
    // Four-leaf clover shape (4 circles arranged in clover pattern)
    const leafRadius = scale * 0.7;
    const stemLength = scale * 0.5;
    const stemWidth = scale * 0.15;

    return `
      <!-- Stem -->
      <rect x="${cx - stemWidth / 2}" y="${cy}" width="${stemWidth}" height="${stemLength}" fill="white"/>

      <!-- Top leaf -->
      <circle cx="${cx}" cy="${cy - leafRadius}" r="${leafRadius}" fill="white"/>

      <!-- Bottom leaf -->
      <circle cx="${cx}" cy="${cy + leafRadius}" r="${leafRadius}" fill="white"/>

      <!-- Left leaf -->
      <circle cx="${cx - leafRadius}" cy="${cy}" r="${leafRadius}" fill="white"/>

      <!-- Right leaf -->
      <circle cx="${cx + leafRadius}" cy="${cy}" r="${leafRadius}" fill="white"/>
    `;
  }

  /**
   * Generate horseshoe shape path
   */
  generateHorseshoePath(cx, cy, scale) {
    // Horseshoe (U-shape with rounded ends)
    const outerRadius = scale * 1.2;
    const innerRadius = scale * 0.8;
    const gapWidth = scale * 0.6;

    return `
      <g fill="white">
        <!-- Outer arc (top) -->
        <path d="
          M ${cx - gapWidth / 2} ${cy - outerRadius}
          A ${outerRadius} ${outerRadius} 0 0 0 ${cx + gapWidth / 2} ${cy - outerRadius}
          L ${cx + gapWidth / 2} ${cy - innerRadius}
          A ${innerRadius} ${innerRadius} 0 0 1 ${cx - gapWidth / 2} ${cy - innerRadius}
          Z
        "/>

        <!-- Left arm -->
        <rect x="${cx - outerRadius}" y="${cy - outerRadius * 0.5}" width="${outerRadius - gapWidth / 2}" height="${scale * 1}" fill="white" rx="${scale * 0.2}"/>

        <!-- Right arm -->
        <rect x="${cx + gapWidth / 2}" y="${cy - outerRadius * 0.5}" width="${outerRadius - gapWidth / 2}" height="${scale * 1}" fill="white" rx="${scale * 0.2}"/>
      </g>
    `;
  }

  /**
   * Generate mushroom shape path
   */
  generateMushroomPath(cx, cy, scale) {
    // Mushroom (circle cap + rectangle stem)
    const capRadius = scale * 1.1;
    const stemWidth = scale * 0.4;
    const stemHeight = scale * 1.2;
    const spotSize = scale * 0.15;

    return `
      <g fill="white">
        <!-- Mushroom cap (circle) -->
        <circle cx="${cx}" cy="${cy - scale * 0.3}" r="${capRadius}" fill="white"/>

        <!-- Mushroom stem (rectangle) -->
        <rect x="${cx - stemWidth / 2}" y="${cy - scale * 0.3}" width="${stemWidth}" height="${stemHeight}" fill="white" rx="${scale * 0.1}"/>

        <!-- Decorative spots on cap -->
        <circle cx="${cx - capRadius * 0.4}" cy="${cy - scale * 0.8}" r="${spotSize}" fill="rgba(255,255,255,0.6)"/>
        <circle cx="${cx + capRadius * 0.4}" cy="${cy - scale * 0.8}" r="${spotSize}" fill="rgba(255,255,255,0.6)"/>
        <circle cx="${cx - capRadius * 0.2}" cy="${cy - scale * 1.0}" r="${spotSize * 0.8}" fill="rgba(255,255,255,0.4)"/>
        <circle cx="${cx + capRadius * 0.2}" cy="${cy - scale * 1.0}" r="${spotSize * 0.8}" fill="rgba(255,255,255,0.4)"/>
      </g>
    `;
  }

  /**
   * Apply feathering effect only (for edge blending without mask)
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Number} featherAmount - Feathering amount (0-1)
   * @param {String} falloffType - Falloff type (smooth, linear, radial)
   * @returns {Promise<Buffer>} - Feathered image buffer
   */
  async applyFeatherOnly(imageBuffer, featherAmount = 0.25, falloffType = 'smooth') {
    try {
      if (featherAmount <= 0) {
        return imageBuffer;
      }

      console.log(`🌫️ Applying feather effect: ${featherAmount} (${falloffType})`);

      const metadata = await Sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      // Create feather mask based on falloff type
      const featherMask = this.generateFeatherMask(width, height, featherAmount, falloffType);

      // Apply as overlay with blend
      const result = await Sharp(imageBuffer)
        .composite([
          {
            input: featherMask,
            blend: 'multiply'
          }
        ])
        .webp({ quality: 85 })
        .toBuffer();

      console.log(`✅ Feathering applied successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Error applying feather effect:`, error.message);
      throw error;
    }
  }

  /**
   * Generate feather mask SVG
   */
  generateFeatherMask(width, height, amount = 0.25, falloffType = 'smooth') {
    const featherWidth = width * amount * 0.5;
    const featherHeight = height * amount * 0.5;
    const blurAmount = featherWidth * 0.5;

    let gradientId = `feather-${falloffType}`;
    let gradient = '';

    switch (falloffType.toLowerCase()) {
      case 'smooth':
      case 'radial':
        // Radial gradient from edges (soft feather)
        gradient = `
          <radialGradient id="${gradientId}" cx="50%" cy="50%" r="45%">
            <stop offset="0%" style="stop-color:white;stop-opacity:1" />
            <stop offset="100%" style="stop-color:white;stop-opacity:0" />
          </radialGradient>
        `;
        break;
      case 'linear':
        // Linear gradient from top
        gradient = `
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0" />
            <stop offset="15%" style="stop-color:white;stop-opacity:1" />
            <stop offset="85%" style="stop-color:white;stop-opacity:1" />
            <stop offset="100%" style="stop-color:white;stop-opacity:0" />
          </linearGradient>
        `;
        break;
      default:
        gradient = `
          <radialGradient id="${gradientId}" cx="50%" cy="50%" r="45%">
            <stop offset="0%" style="stop-color:white;stop-opacity:1" />
            <stop offset="100%" style="stop-color:white;stop-opacity:0" />
          </radialGradient>
        `;
    }

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${gradient}
          <filter id="feather-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmount}" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#${gradientId})" filter="url(#feather-blur)"/>
      </svg>
    `;

    return Buffer.from(svg);
  }
}

module.exports = MaskProcessor;
