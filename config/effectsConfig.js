/**
 * Image Effects Configuration
 * Defines all available effects, presets, and customization options
 * Used for post-processing of upscaled images
 */

const effectsConfig = {
  /**
   * Available effect toggles - simple on/off functionality
   */
  effectTypes: {
    /**
     * MASK EFFECTS - Transform image into iconic shapes
     * Exclusive group: Only one mask can be active at a time
     */
    maskHeart: {
      name: '💖 Heart Mask',
      description: 'Transform image into a heart shape',
      type: 'exclusive-mask',
      group: 'mask',
      enabled: false,
      preset: {
        mask: 'heart',
        featherEdges: 0.15
      }
    },
    maskLuckyCharm: {
      name: '🍀 Lucky Charm Mask',
      description: 'Transform image into a four-leaf clover shape',
      type: 'exclusive-mask',
      group: 'mask',
      enabled: false,
      preset: {
        mask: 'lucky-charm',
        featherEdges: 0.15
      }
    },
    maskHorseshoe: {
      name: '🧲 Horseshoe Mask',
      description: 'Transform image into a horseshoe shape',
      type: 'exclusive-mask',
      group: 'mask',
      enabled: false,
      preset: {
        mask: 'horseshoe',
        featherEdges: 0.15
      }
    },
    maskMushroom: {
      name: '🍄 Mushroom Mask',
      description: 'Transform image into a fun mushroom shape',
      type: 'exclusive-mask',
      group: 'mask',
      enabled: false,
      preset: {
        mask: 'mushroom',
        featherEdges: 0.15
      }
    },

    /**
     * FEATHER EFFECT - Smooth edge blending for printed objects
     */
    feather: {
      name: '🌫️ Feather Edges',
      description: 'Smoothly blend edges with printed object background',
      type: 'toggle',
      enabled: false,
      preset: {
        featherEdges: 0.25,
        featherFalloff: 'smooth'
      }
    },

    vibrancy: {
      name: '🌈 Enhanced Vibrancy',
      description: 'Boost color saturation and warmth',
      type: 'toggle',
      enabled: false,
      preset: {
        saturation: 1.4,
        colorTemperature: 3800,
        brightness: 1.08,
        contrast: 1.15
      }
    },
    glow: {
      name: '✨ Luminous Glow',
      description: 'Add bloom effect for magical appearance',
      type: 'toggle',
      enabled: false,
      preset: {
        bloom: 0.6,
        brightness: 1.05,
        saturation: 1.1
      }
    },
    dramatic: {
      name: '🎭 Dramatic Focus',
      description: 'Dark vignette edges for product focus',
      type: 'toggle',
      enabled: false,
      preset: {
        vignette: 0.5,
        contrast: 1.2,
        blur: 2
      }
    },
    lightning: {
      name: '⚡ Lightning Strike',
      description: 'Electric cool tones with intense energy',
      type: 'toggle',
      enabled: false,
      preset: {
        lightning: 0.85,
        colorTemperature: 6800,
        saturation: 1.2,
        brightness: 1.1,
        contrast: 1.3,
        vignette: 0.4,
        bloom: 0.4
      }
    },
    warmth: {
      name: '🔥 Golden Warmth',
      description: 'Cozy warm tones perfect for home products',
      type: 'toggle',
      enabled: false,
      preset: {
        colorTemperature: 3500,
        saturation: 1.2,
        brightness: 1.1
      }
    },
    coolness: {
      name: '❄️ Cool Elegance',
      description: 'Crisp cool tones for modern products',
      type: 'toggle',
      enabled: false,
      preset: {
        colorTemperature: 7200,
        saturation: 1.15,
        brightness: 1.05,
        contrast: 1.1
      }
    }
  },

  /**
   * Effect categories for UI organization
   */
  categories: [
    {
      id: 'shape',
      name: '✨ Shape Masks',
      description: 'Transform image into iconic shapes',
      effects: ['maskHeart', 'maskLuckyCharm', 'maskHorseshoe', 'maskMushroom'],
      exclusive: true,
      note: 'Select only one mask effect at a time'
    },
    {
      id: 'blending',
      name: '🌫️ Edge Effects',
      description: 'Refine and blend edges for printing',
      effects: ['feather']
    },
    {
      id: 'color',
      name: '🎨 Color Effects',
      description: 'Enhance colors and warmth',
      effects: ['vibrancy', 'warmth', 'coolness']
    },
    {
      id: 'atmospheric',
      name: '✨ Atmospheric Effects',
      description: 'Lighting and mood',
      effects: ['glow', 'dramatic', 'lightning']
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
   * Helper function to get effect configuration by type
   */
  getEffect: function(effectType) {
    return this.effectTypes[effectType];
  },

  /**
   * Build final effects from enabled toggles
   * Combines presets of all enabled effects
   * Enforces exclusivity for mask effects
   */
  buildEffectsFromToggles: function(enabledToggles = {}) {
    const finalEffects = {
      saturation: 1.0,
      colorTemperature: 5500,
      bloom: 0,
      vignette: 0,
      blur: 0,
      brightness: 1.0,
      contrast: 1.0,
      lightning: 0,
      mask: null,
      featherEdges: 0,
      featherFalloff: 'smooth'
    };

    // Track enabled masks to enforce exclusivity
    const enabledMasks = [];

    // Apply each enabled effect's preset
    for (const [toggleKey, enabled] of Object.entries(enabledToggles)) {
      if (enabled) {
        const effect = this.effectTypes[toggleKey];
        if (effect && effect.preset) {
          // Handle exclusive mask effects
          if (effect.group === 'mask') {
            enabledMasks.push(toggleKey);
            // Only apply the first enabled mask (priority order)
            if (finalEffects.mask === null) {
              Object.assign(finalEffects, effect.preset);
            }
          } else {
            // Merge non-exclusive effect values
            Object.assign(finalEffects, effect.preset);
          }
        }
      }
    }

    // Log if multiple masks were enabled (shouldn't happen in UI, but warn if it does)
    if (enabledMasks.length > 1) {
      console.warn(`⚠️ Multiple mask effects enabled: ${enabledMasks.join(', ')}. Only first will be applied.`);
    }

    return finalEffects;
  }
};

module.exports = effectsConfig;
