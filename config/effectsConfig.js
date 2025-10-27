/**
 * Image Effects Configuration
 * Defines all available effects, presets, and customization options
 * Used for post-processing of upscaled images
 */

const effectsConfig = {
  /**
   * Available effect types that can be applied
   */
  effectTypes: {
    colorTemperature: {
      name: 'Color Temperature',
      description: 'Warm (golden) to cool (blue) color grading',
      type: 'slider',
      min: 2000,
      max: 8000,
      default: 5500,
      unit: 'Kelvin'
    },
    saturation: {
      name: 'Saturation',
      description: 'Color intensity from muted to vibrant',
      type: 'slider',
      min: 0.5,
      max: 2.0,
      default: 1.0,
      step: 0.1
    },
    bloom: {
      name: 'Bloom Glow',
      description: 'Light glow effect on bright areas',
      type: 'slider',
      min: 0,
      max: 1.0,
      default: 0,
      step: 0.1
    },
    vignette: {
      name: 'Vignette',
      description: 'Darkens edges for focus effect',
      type: 'slider',
      min: 0,
      max: 1.0,
      default: 0,
      step: 0.1
    },
    blur: {
      name: 'Edge Blur',
      description: 'Soft focus on edges',
      type: 'slider',
      min: 0,
      max: 10,
      default: 0,
      step: 0.5
    },
    brightness: {
      name: 'Brightness',
      description: 'Overall image brightness',
      type: 'slider',
      min: 0.7,
      max: 1.3,
      default: 1.0,
      step: 0.05
    },
    contrast: {
      name: 'Contrast',
      description: 'Contrast enhancement',
      type: 'slider',
      min: 0.7,
      max: 1.5,
      default: 1.0,
      step: 0.05
    },
    lightning: {
      name: 'Lightning Intensity',
      description: 'Electric lightning strike effect',
      type: 'slider',
      min: 0,
      max: 1.0,
      default: 0,
      step: 0.1
    }
  },

  /**
   * Pre-configured effect presets for quick application
   * Users can customize from these starting points
   */
  presets: {
    'vibrant-colors': {
      id: 'vibrant-colors',
      name: '✨ Vibrant Colors',
      description: 'Enhanced saturation with warm, golden tones',
      category: 'color',
      icon: '🌈',
      effects: {
        saturation: 1.3,
        colorTemperature: 4000,
        bloom: 0.3,
        brightness: 1.05,
        contrast: 1.1,
        vignette: 0.2,
        blur: 0,
        lightning: 0
      },
      userMessage: 'Perfect for showcasing vibrant designs on products. Enhanced colors with warm glow.'
    },

    'lightning-strike': {
      id: 'lightning-strike',
      name: '⚡ Lightning Strike',
      description: 'Dramatic cool tones with electric intensity',
      category: 'atmospheric',
      icon: '⚡',
      effects: {
        saturation: 1.2,
        colorTemperature: 6500,
        bloom: 0.5,
        brightness: 1.1,
        contrast: 1.25,
        vignette: 0.4,
        blur: 1,
        lightning: 0.8
      },
      userMessage: 'Bold and dramatic. Creates striking contrast with cool electric tones and energy.'
    },

    'custom': {
      id: 'custom',
      name: '🎨 Custom Effects',
      description: 'Mix and match your own effect combination',
      category: 'custom',
      icon: '🎨',
      effects: {
        saturation: 1.0,
        colorTemperature: 5500,
        bloom: 0.0,
        brightness: 1.0,
        contrast: 1.0,
        vignette: 0.0,
        blur: 0,
        lightning: 0
      },
      userMessage: 'Build your own unique effect combination with individual sliders.'
    }
  },

  /**
   * Effect categories for UI organization
   */
  categories: [
    {
      id: 'color',
      name: 'Color Effects',
      description: 'Color grading and saturation adjustments',
      icon: '🌈',
      effects: ['saturation', 'colorTemperature', 'brightness', 'contrast']
    },
    {
      id: 'atmospheric',
      description: 'Lighting and atmospheric effects',
      name: 'Atmospheric',
      icon: '✨',
      effects: ['bloom', 'vignette', 'blur', 'lightning']
    },
    {
      id: 'custom',
      name: 'Custom Mix',
      description: 'Create your own effect combination',
      icon: '🎨',
      effects: ['saturation', 'colorTemperature', 'bloom', 'vignette', 'blur', 'brightness', 'contrast', 'lightning']
    }
  ],

  /**
   * Sharp processing configuration
   */
  processing: {
    webpQuality: 80,
    webpAlphaQuality: 100,
    jpegQuality: 85,
    preview: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 75
    }
  },

  /**
   * Helper function to get preset by ID
   */
  getPreset: function(presetId) {
    return this.presets[presetId] || this.presets['custom'];
  },

  /**
   * Helper function to get effect configuration by type
   */
  getEffect: function(effectType) {
    return this.effectTypes[effectType];
  },

  /**
   * Validate effect parameters
   */
  validateEffectParams: function(params) {
    const validated = {};

    for (const [key, value] of Object.entries(params)) {
      const effectConfig = this.effectTypes[key];

      if (!effectConfig) {
        console.warn(`Unknown effect type: ${key}`);
        continue;
      }

      // Clamp value between min and max
      const clamped = Math.max(
        effectConfig.min,
        Math.min(effectConfig.max, value)
      );

      validated[key] = clamped;
    }

    return validated;
  },

  /**
   * Merge effect parameters with defaults
   */
  mergeWithDefaults: function(customParams = {}) {
    const defaults = {};

    for (const [key, config] of Object.entries(this.effectTypes)) {
      defaults[key] = config.default;
    }

    return { ...defaults, ...customParams };
  }
};

module.exports = effectsConfig;
