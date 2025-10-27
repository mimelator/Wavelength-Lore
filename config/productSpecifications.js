/**
 * Product Specifications & Image Optimization Requirements
 *
 * Defines the PERFECT image dimensions for each product type.
 * When a user selects a product, we optimize their image to match
 * the product's specific requirements for maximum print quality.
 *
 * TRANSPARENCY PRINCIPLE: Users see the optimized image and any
 * processing (like upscaling) shows a progress indicator. The
 * final result is always transparent - they see exactly what
 * will be printed.
 */

module.exports = {
  /**
   * APPAREL - T-Shirts, Hoodies, Tanks, etc.
   */
  'apparel-tshirt': {
    name: 'T-Shirt',
    category: 'apparel',
    printMethod: 'DTG / Screen Print',
    printArea: {
      width: 10,
      height: 12,
      unit: 'inches',
      description: 'Front chest area'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 3000,
        height: 3600,
        aspect: '10:12'
      },
      minDimensions: {
        width: 1200,
        height: 1440
      },
      maxDimensions: {
        width: 4000,
        height: 4800
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'front',
      x: 0.5,        // Centered horizontally
      y: 0.5,        // Centered vertically
      scale: 1,      // Full size
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.5,     // inches
      pixels: 150    // at 300 DPI
    },
    qualityChecks: [
      'dpi-validation-300',
      'transparency-edges',
      'color-space-validation',
      'dimension-optimization'
    ],
    notes: 'Standard apparel print. Image will be centered on front.'
  },

  'apparel-hoodie': {
    name: 'Hoodie',
    category: 'apparel',
    printMethod: 'DTG',
    printArea: {
      width: 12,
      height: 16,
      unit: 'inches',
      description: 'Front chest area, larger than t-shirt'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 3600,
        height: 4800,
        aspect: '12:16'
      },
      minDimensions: {
        width: 1440,
        height: 1920
      },
      maxDimensions: {
        width: 4800,
        height: 6400
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.5,
      pixels: 150
    },
    qualityChecks: [
      'dpi-validation-300',
      'transparency-edges',
      'color-space-validation',
      'dimension-optimization'
    ],
    notes: 'Larger print area than t-shirt. Requires higher resolution image.'
  },

  'apparel-tank': {
    name: 'Tank Top',
    category: 'apparel',
    printMethod: 'DTG / Screen Print',
    printArea: {
      width: 9,
      height: 11,
      unit: 'inches',
      description: 'Front chest area, smaller than t-shirt'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 2700,
        height: 3300,
        aspect: '9:11'
      },
      minDimensions: {
        width: 1080,
        height: 1320
      },
      maxDimensions: {
        width: 3600,
        height: 4400
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.5,
      pixels: 150
    },
    qualityChecks: [
      'dpi-validation-300',
      'transparency-edges',
      'color-space-validation',
      'dimension-optimization'
    ],
    notes: 'Smaller print area. May need downscaling from larger images.'
  },

  /**
   * HOME & LIVING - Pillows, Blankets, Canvas
   */
  'home-pillow-16x16': {
    name: 'Pillow (16x16)',
    category: 'home',
    printMethod: 'Sublimation',
    printArea: {
      width: 16,
      height: 16,
      unit: 'inches',
      description: 'Full pillow front, square format'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 4800,
        height: 4800,
        aspect: '1:1'
      },
      minDimensions: {
        width: 1920,
        height: 1920
      },
      maxDimensions: {
        width: 6400,
        height: 6400
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.25,
      pixels: 75
    },
    qualityChecks: [
      'dpi-validation-300',
      'square-aspect-ratio',
      'color-saturation-check',
      'dimension-optimization'
    ],
    notes: 'LARGER print area than apparel. Requires 4800x4800 minimum for best quality.'
  },

  'home-pillow-20x20': {
    name: 'Pillow (20x20)',
    category: 'home',
    printMethod: 'Sublimation',
    printArea: {
      width: 20,
      height: 20,
      unit: 'inches',
      description: 'Full pillow front, largest size'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 6000,
        height: 6000,
        aspect: '1:1'
      },
      minDimensions: {
        width: 2400,
        height: 2400
      },
      maxDimensions: {
        width: 8000,
        height: 8000
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.25,
      pixels: 75
    },
    qualityChecks: [
      'dpi-validation-300',
      'square-aspect-ratio',
      'color-saturation-check',
      'dimension-optimization'
    ],
    notes: 'LARGEST pillow. Requires 6000x6000 for perfect quality. May require upscaling.'
  },

  'home-blanket': {
    name: 'Blanket (60x50)',
    category: 'home',
    printMethod: 'Dye Sublimation',
    printArea: {
      width: 60,
      height: 50,
      unit: 'inches',
      description: 'Full blanket, full bleed'
    },
    imageSpec: {
      recommendedDpi: 150,  // Larger items can use lower DPI
      optimalDimensions: {
        width: 6000,
        height: 5000,
        aspect: '6:5'
      },
      minDimensions: {
        width: 2400,
        height: 2000
      },
      maxDimensions: {
        width: 8000,
        height: 6667
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'full',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: false,  // Full bleed, no buffer needed
      size: 0,
      pixels: 0
    },
    qualityChecks: [
      'dpi-validation-150',
      'color-saturation-check',
      'full-bleed-validation'
    ],
    notes: 'HUGE print area. Lower DPI acceptable (150 DPI). Full bleed product.'
  },

  'home-canvas-24x36': {
    name: 'Canvas (24x36)',
    category: 'home',
    printMethod: 'Giclee Canvas',
    printArea: {
      width: 24,
      height: 36,
      unit: 'inches',
      description: 'Full canvas, portrait format'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 7200,
        height: 10800,
        aspect: '2:3'
      },
      minDimensions: {
        width: 2880,
        height: 4320
      },
      maxDimensions: {
        width: 9600,
        height: 14400
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'full',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.5,
      pixels: 150
    },
    qualityChecks: [
      'dpi-validation-300',
      'color-space-validation',
      'dimension-optimization'
    ],
    notes: 'VERY LARGE format. Requires 7200x10800 for best gallery quality.'
  },

  /**
   * DRINKWARE - Mugs, Tumblers
   */
  'drinkware-mug-ceramic': {
    name: 'Ceramic Mug (11oz)',
    category: 'drinkware',
    printMethod: 'Sublimation (Wrap-Around)',
    printArea: {
      width: 4.5,
      height: 3.5,
      unit: 'inches',
      description: 'Cylindrical wrap, handle placement avoided'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 1350,
        height: 1050,
        aspect: '9:7'
      },
      minDimensions: {
        width: 540,
        height: 420
      },
      maxDimensions: {
        width: 1800,
        height: 1400
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'wrap',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0,
      notes: 'Wraps around cylinder. Handle area is avoided.'
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.1,
      pixels: 30
    },
    qualityChecks: [
      'dpi-validation-300',
      'wrap-dimension-check',
      'handle-placement-check'
    ],
    notes: 'SMALLER print area. Images optimized to 1350x1050. No upscaling typically needed.'
  },

  'drinkware-mug-travel': {
    name: 'Travel Mug (12oz)',
    category: 'drinkware',
    printMethod: 'Sublimation (Wrap-Around)',
    printArea: {
      width: 5,
      height: 4,
      unit: 'inches',
      description: 'Cylindrical wrap for travel mug'
    },
    imageSpec: {
      recommendedDpi: 300,
      optimalDimensions: {
        width: 1500,
        height: 1200,
        aspect: '5:4'
      },
      minDimensions: {
        width: 600,
        height: 480
      },
      maxDimensions: {
        width: 2000,
        height: 1600
      },
      supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
      maxFileSize: '50MB'
    },
    placement: {
      position: 'wrap',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },
    transparencyBuffer: {
      enabled: true,
      size: 0.1,
      pixels: 30
    },
    qualityChecks: [
      'dpi-validation-300',
      'wrap-dimension-check'
    ],
    notes: 'Travel mug wrap. Similar to ceramic mug but slightly different dimensions.'
  },

  /**
   * UTILITY FUNCTIONS
   */
  getSpecsByProductKey(productKey) {
    return module.exports[productKey] || null;
  },

  getAllProductTypes() {
    return Object.keys(module.exports).filter(key => !key.startsWith('get') && typeof module.exports[key] === 'object');
  },

  getProductsByCategory(category) {
    return module.exports.getAllProductTypes().filter(key => {
      const spec = module.exports[key];
      return spec.category === category;
    });
  },

  /**
   * Calculate optimal image dimensions for a product
   * @param {string} productKey - Product identifier
   * @returns {object} { width, height, dpi }
   */
  getOptimalDimensions(productKey) {
    const spec = module.exports.getSpecsByProductKey(productKey);
    if (!spec) return null;

    return {
      width: spec.imageSpec.optimalDimensions.width,
      height: spec.imageSpec.optimalDimensions.height,
      dpi: spec.imageSpec.recommendedDpi,
      printArea: spec.printArea,
      method: spec.printMethod
    };
  },

  /**
   * Check if image dimensions are suitable for product
   * @param {number} imageWidth - Current image width
   * @param {number} imageHeight - Current image height
   * @param {string} productKey - Product identifier
   * @returns {object} { suitable, needsDownscale, needsUpscale, recommendation }
   */
  validateImageDimensions(imageWidth, imageHeight, productKey) {
    const spec = module.exports.getSpecsByProductKey(productKey);
    if (!spec) return { suitable: false, error: 'Product not found' };

    const optimalDims = spec.imageSpec.optimalDimensions;
    const minDims = spec.imageSpec.minDimensions;
    const maxDims = spec.imageSpec.maxDimensions;

    const isBelowMin = imageWidth < minDims.width || imageHeight < minDims.height;
    const isAboveMax = imageWidth > maxDims.width || imageHeight > maxDims.height;
    const isOptimal = imageWidth === optimalDims.width && imageHeight === optimalDims.height;

    let recommendation = '';
    let needsUpscale = false;
    let needsDownscale = false;

    if (isBelowMin) {
      needsUpscale = true;
      recommendation = `Image is too small. Will upscale from ${imageWidth}x${imageHeight} to ${optimalDims.width}x${optimalDims.height}. This may take a few seconds.`;
    } else if (isAboveMax) {
      needsDownscale = true;
      recommendation = `Image is larger than needed. Will optimize from ${imageWidth}x${imageHeight} to ${optimalDims.width}x${optimalDims.height}.`;
    } else if (!isOptimal) {
      recommendation = `Image dimensions will be optimized to ${optimalDims.width}x${optimalDims.height} for perfect quality.`;
    } else {
      recommendation = `✅ Perfect! Image is already optimized at ${optimalDims.width}x${optimalDims.height}.`;
    }

    return {
      suitable: !isBelowMin && !isAboveMax,
      needsUpscale,
      needsDownscale,
      currentDimensions: { width: imageWidth, height: imageHeight },
      optimalDimensions: optimalDims,
      minDimensions: minDims,
      maxDimensions: maxDims,
      recommendation,
      printArea: spec.printArea,
      dpi: spec.imageSpec.recommendedDpi
    };
  }
};
