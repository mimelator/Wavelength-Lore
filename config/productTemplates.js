/**
 * Product Templates - PERFECT PRINTING
 *
 * Templates define the ideal setup for each product type.
 * Each template combines:
 * - Product specifications (dimensions, DPI)
 * - Printify blueprint & providers
 * - Quality validation rules
 * - User-transparent optimization workflow
 *
 * When a user creates a product using a template, they get
 * consistent, high-quality results EVERY TIME.
 */

module.exports = {
  /**
   * APPAREL TEMPLATES
   */
  'premium-tshirt': {
    id: 'premium-tshirt',
    name: 'Premium T-Shirt - Perfect Print',
    category: 'apparel',
    productType: 'apparel-tshirt',
    description: 'High-quality direct-to-garment printing on premium cotton. Guaranteed perfect results.',

    // Printify Configuration
    printify: {
      blueprint: 5,        // Unisex Cotton Crew Tee
      providers: [61, 3],  // Dimona Tee, OTTO Print, Marco Fine Arts
      method: 'DTG',
      variants: {
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'White', 'Navy', 'Red', 'Dark Gray', 'Light Blue']
      }
    },

    // Image Optimization
    imageOptimization: {
      productKey: 'apparel-tshirt',
      targetDimensions: { width: 3000, height: 3600 },
      targetDpi: 300,
      allowUpscaling: true,
      upscaleMethod: 'ESRGAN',  // AI upscaling for quality
      upscaleThreshold: 2.0      // Upscale only if scale factor <= 2
    },

    // Placement
    placement: {
      position: 'front',
      x: 0.5,        // Centered
      y: 0.5,
      scale: 1,
      angle: 0
    },

    // Quality Checks (transparent to user)
    qualityChecks: [
      'dpi-validation-300',
      'transparency-edges',
      'color-space-validation',
      'dimension-optimization',
      'placement-verification'
    ],

    // User-Facing Messages
    userMessages: {
      beforeOptimization: 'Optimizing your image for Premium T-Shirt (3000x3600 pixels, 300 DPI)...',
      upscaling: 'Enhancing image quality with AI upscaling. This may take 30-60 seconds...',
      complete: '✅ Your image is now perfectly optimized for the Premium T-Shirt!',
      printQuality: 'Expected print quality: Excellent - crystal clear colors and sharp details'
    },

    // Success Criteria
    success: {
      dpi: '300 DPI minimum',
      dimensions: '3000x3600 pixels',
      colors: 'Full RGB color support',
      guarantee: 'Satisfaction guaranteed or reprint'
    }
  },

  'perfect-hoodie': {
    id: 'perfect-hoodie',
    name: 'Perfect Hoodie - DTG Premium',
    category: 'apparel',
    productType: 'apparel-hoodie',
    description: 'Direct-to-garment printing on premium quality hoodie. Larger print area for bold designs.',

    printify: {
      blueprint: 146,       // Pullover Hoodie
      providers: [1, 15],   // Printful, other vetted providers
      method: 'DTG',
      variants: {
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '2XL'],
        colors: ['Black', 'Navy', 'Gray', 'White', 'Maroon']
      }
    },

    imageOptimization: {
      productKey: 'apparel-hoodie',
      targetDimensions: { width: 3600, height: 4800 },
      targetDpi: 300,
      allowUpscaling: true,
      upscaleMethod: 'ESRGAN',
      upscaleThreshold: 2.5
    },

    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },

    qualityChecks: [
      'dpi-validation-300',
      'transparency-edges',
      'color-space-validation',
      'dimension-optimization',
      'placement-verification'
    ],

    userMessages: {
      beforeOptimization: 'Optimizing your image for Perfect Hoodie (3600x4800 pixels, 300 DPI)...',
      upscaling: 'Enhancing image quality. This may take 30-90 seconds...',
      complete: '✅ Your image is perfectly optimized for the Perfect Hoodie!',
      printQuality: 'Expected print quality: Premium - bold colors with excellent detail'
    },

    success: {
      dpi: '300 DPI minimum',
      dimensions: '3600x4800 pixels',
      colors: 'Full RGB color support',
      guarantee: 'Satisfaction guaranteed or reprint'
    }
  },

  /**
   * HOME & LIVING TEMPLATES
   */
  'perfect-pillow-16x16': {
    id: 'perfect-pillow-16x16',
    name: 'Perfect Pillow (16x16) - Gallery Quality',
    category: 'home',
    productType: 'home-pillow-16x16',
    description: 'High-resolution sublimation on premium pillow. Perfect for displaying artwork.',

    printify: {
      blueprint: 220,       // Spun Polyester Square Pillow
      providers: [10, 12],  // MWW On Demand, others
      method: 'Sublimation',
      variants: {
        sizes: ['16x16', '18x18'],
        colors: ['White', 'Black']
      }
    },

    imageOptimization: {
      productKey: 'home-pillow-16x16',
      targetDimensions: { width: 4800, height: 4800 },
      targetDpi: 300,
      allowUpscaling: true,
      upscaleMethod: 'ESRGAN',
      upscaleThreshold: 2.0
    },

    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },

    qualityChecks: [
      'dpi-validation-300',
      'square-aspect-ratio',
      'color-saturation-check',
      'dimension-optimization'
    ],

    userMessages: {
      beforeOptimization: 'Optimizing your artwork for Perfect Pillow (4800x4800 pixels, 300 DPI)...',
      upscaling: 'Enhancing image resolution. This may take 60-120 seconds...',
      complete: '✅ Your artwork is perfectly optimized for the 16x16 Pillow!',
      printQuality: 'Expected print quality: Gallery-grade - vibrant colors, exceptional detail'
    },

    success: {
      dpi: '300 DPI minimum',
      dimensions: '4800x4800 pixels',
      colors: 'Full RGB color support with saturation optimization',
      guarantee: 'Color accuracy guaranteed'
    }
  },

  'perfect-pillow-20x20': {
    id: 'perfect-pillow-20x20',
    name: 'Perfect Pillow (20x20) - Premium Display',
    category: 'home',
    productType: 'home-pillow-20x20',
    description: 'Ultra-high resolution sublimation. Stunning focal point for any room.',

    printify: {
      blueprint: 220,
      providers: [10, 12],
      method: 'Sublimation',
      variants: {
        sizes: ['20x20'],
        colors: ['White', 'Black']
      }
    },

    imageOptimization: {
      productKey: 'home-pillow-20x20',
      targetDimensions: { width: 6000, height: 6000 },
      targetDpi: 300,
      allowUpscaling: true,
      upscaleMethod: 'ESRGAN',
      upscaleThreshold: 2.5
    },

    placement: {
      position: 'front',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },

    qualityChecks: [
      'dpi-validation-300',
      'square-aspect-ratio',
      'color-saturation-check',
      'dimension-optimization'
    ],

    userMessages: {
      beforeOptimization: 'Optimizing your artwork for Perfect Pillow (6000x6000 pixels, 300 DPI)...',
      upscaling: 'Enhancing image resolution for maximum impact. This may take 90-180 seconds...',
      complete: '✅ Your artwork is perfectly optimized for the 20x20 Pillow!',
      printQuality: 'Expected print quality: Museum-grade - stunning clarity and color'
    },

    success: {
      dpi: '300 DPI minimum',
      dimensions: '6000x6000 pixels',
      colors: 'Full RGB color support with premium saturation',
      guarantee: 'Museum-quality color accuracy'
    }
  },

  'perfect-blanket': {
    id: 'perfect-blanket',
    name: 'Perfect Blanket - Full Coverage',
    category: 'home',
    productType: 'home-blanket',
    description: 'Full-bleed dye sublimation for maximum impact. Your design covers the entire surface.',

    printify: {
      blueprint: 238,       // Sherpa Fleece Blanket
      providers: [8, 9],    // Vetted blanket providers
      method: 'Dye Sublimation',
      variants: {
        sizes: ['60x50'],
        colors: ['Full Color']
      }
    },

    imageOptimization: {
      productKey: 'home-blanket',
      targetDimensions: { width: 6000, height: 5000 },
      targetDpi: 150,  // Larger items can use lower DPI
      allowUpscaling: true,
      upscaleMethod: 'bicubic',  // Standard upscaling acceptable for larger items
      upscaleThreshold: 3.0
    },

    placement: {
      position: 'full',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0
    },

    qualityChecks: [
      'dpi-validation-150',
      'color-saturation-check',
      'full-bleed-validation'
    ],

    userMessages: {
      beforeOptimization: 'Optimizing your design for Perfect Blanket (6000x5000 pixels, 150 DPI)...',
      upscaling: 'Preparing high-resolution full-bleed print. This may take 60-90 seconds...',
      complete: '✅ Your design is perfectly optimized for the Perfect Blanket!',
      printQuality: 'Expected print quality: Vibrant - full coverage from edge to edge'
    },

    success: {
      dpi: '150 DPI minimum (larger format)',
      dimensions: '6000x5000 pixels',
      coverage: '100% full bleed coverage',
      guarantee: 'Full-coverage satisfaction guarantee'
    }
  },

  /**
   * DRINKWARE TEMPLATES
   */
  'perfect-mug-ceramic': {
    id: 'perfect-mug-ceramic',
    name: 'Perfect Ceramic Mug - Wrap Printed',
    category: 'drinkware',
    productType: 'drinkware-mug-ceramic',
    description: 'Sublimation-printed ceramic mug. Design wraps around the entire cylinder.',

    printify: {
      blueprint: 17,        // Ceramic Mug
      providers: [7, 8],    // Gooten, other vetted providers
      method: 'Sublimation (Wrap)',
      variants: {
        sizes: ['11oz', '15oz'],
        colors: ['White']
      }
    },

    imageOptimization: {
      productKey: 'drinkware-mug-ceramic',
      targetDimensions: { width: 1350, height: 1050 },
      targetDpi: 300,
      allowUpscaling: false,  // Smaller items don't need upscaling
      upscaleMethod: 'none',
      upscaleThreshold: 1.0
    },

    placement: {
      position: 'wrap',
      x: 0.5,
      y: 0.5,
      scale: 1,
      angle: 0,
      notes: 'Wraps around cylinder, handle area avoided'
    },

    qualityChecks: [
      'dpi-validation-300',
      'wrap-dimension-check',
      'handle-placement-check'
    ],

    userMessages: {
      beforeOptimization: 'Optimizing your design for Perfect Ceramic Mug (1350x1050 pixels, 300 DPI)...',
      upscaling: 'none',  // No upscaling needed
      complete: '✅ Your design is perfectly optimized for the Perfect Ceramic Mug!',
      printQuality: 'Expected print quality: Professional - vibrant wrap-around design'
    },

    success: {
      dpi: '300 DPI',
      dimensions: '1350x1050 pixels',
      coverage: 'Wrap-around with handle exclusion',
      guarantee: 'Dishwasher safe, microwave safe'
    }
  },

  /**
   * UTILITY FUNCTIONS
   */
  getTemplateById(templateId) {
    return module.exports[templateId] || null;
  },

  getAllTemplates() {
    return Object.keys(module.exports).filter(key => !key.startsWith('get') && typeof module.exports[key] === 'object');
  },

  getTemplatesByCategory(category) {
    return module.exports.getAllTemplates().filter(key => {
      const template = module.exports[key];
      return template.category === category;
    });
  },

  /**
   * Get template information for user display
   */
  getTemplateInfo(templateId) {
    const template = module.exports.getTemplateById(templateId);
    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      printQuality: template.success.guarantee,
      imageDimensions: `${template.imageOptimization.targetDimensions.width}x${template.imageOptimization.targetDimensions.height}`,
      dpi: template.imageOptimization.targetDpi,
      printMethod: template.printify.method,
      upscaling: template.imageOptimization.allowUpscaling
    };
  }
};
