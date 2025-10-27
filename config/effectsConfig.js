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
   * Border customization configuration
   * Allows users to add decorative borders with custom colors and widths
   */
  borderConfig: {
    enabled: true,
    widths: [
      { value: 0, label: 'None', pixels: 0 },
      { value: 1, label: 'Thin', pixels: 10 },
      { value: 2, label: 'Medium', pixels: 20 },
      { value: 3, label: 'Thick', pixels: 30 },
      { value: 4, label: 'Extra Thick', pixels: 40 }
    ],
    // 36-color palette for merchandise borders
    colors: [
      // Primary Colors (6)
      { name: 'Red', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
      { name: 'Blue', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } },
      { name: 'Yellow', hex: '#FFFF00', rgb: { r: 255, g: 255, b: 0 } },
      { name: 'Green', hex: '#00AA00', rgb: { r: 0, g: 170, b: 0 } },
      { name: 'Purple', hex: '#AA00AA', rgb: { r: 170, g: 0, b: 170 } },
      { name: 'Orange', hex: '#FF8800', rgb: { r: 255, g: 136, b: 0 } },

      // Pastel Colors (6)
      { name: 'Soft Pink', hex: '#FFB6C1', rgb: { r: 255, g: 182, b: 193 } },
      { name: 'Soft Blue', hex: '#ADD8E6', rgb: { r: 173, g: 216, b: 230 } },
      { name: 'Soft Yellow', hex: '#FFFFE0', rgb: { r: 255, g: 255, b: 224 } },
      { name: 'Soft Green', hex: '#90EE90', rgb: { r: 144, g: 238, b: 144 } },
      { name: 'Soft Purple', hex: '#DDA0DD', rgb: { r: 221, g: 160, b: 221 } },
      { name: 'Soft Peach', hex: '#FFDAB9', rgb: { r: 255, g: 218, b: 185 } },

      // Dark/Deep Colors (6)
      { name: 'Dark Red', hex: '#8B0000', rgb: { r: 139, g: 0, b: 0 } },
      { name: 'Dark Blue', hex: '#00008B', rgb: { r: 0, g: 0, b: 139 } },
      { name: 'Dark Green', hex: '#006400', rgb: { r: 0, g: 100, b: 0 } },
      { name: 'Dark Purple', hex: '#4B0082', rgb: { r: 75, g: 0, b: 130 } },
      { name: 'Dark Brown', hex: '#654321', rgb: { r: 101, g: 67, b: 33 } },
      { name: 'Dark Gray', hex: '#333333', rgb: { r: 51, g: 51, b: 51 } },

      // Metallic/Special Colors (6)
      { name: 'Gold', hex: '#FFD700', rgb: { r: 255, g: 215, b: 0 } },
      { name: 'Silver', hex: '#C0C0C0', rgb: { r: 192, g: 192, b: 192 } },
      { name: 'Rose Gold', hex: '#FF6B9D', rgb: { r: 255, g: 107, b: 157 } },
      { name: 'Bronze', hex: '#CD7F32', rgb: { r: 205, g: 127, b: 50 } },
      { name: 'Copper', hex: '#B87333', rgb: { r: 184, g: 115, b: 51 } },
      { name: 'Platinum', hex: '#E5E4E2', rgb: { r: 229, g: 228, b: 226 } },

      // Vibrant/Neon Colors (6)
      { name: 'Neon Pink', hex: '#FF10F0', rgb: { r: 255, g: 16, b: 240 } },
      { name: 'Neon Green', hex: '#39FF14', rgb: { r: 57, g: 255, b: 20 } },
      { name: 'Neon Blue', hex: '#0080FF', rgb: { r: 0, g: 128, b: 255 } },
      { name: 'Hot Pink', hex: '#FF69B4', rgb: { r: 255, g: 105, b: 180 } },
      { name: 'Cyan', hex: '#00FFFF', rgb: { r: 0, g: 255, b: 255 } },
      { name: 'Lime', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 } },

      // Neutral Colors (6)
      { name: 'White', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'Black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
      { name: 'Light Gray', hex: '#CCCCCC', rgb: { r: 204, g: 204, b: 204 } },
      { name: 'Medium Gray', hex: '#888888', rgb: { r: 136, g: 136, b: 136 } },
      { name: 'Cream', hex: '#FFFDD0', rgb: { r: 255, g: 253, b: 208 } },
      { name: 'Beige', hex: '#F5F5DC', rgb: { r: 245, g: 245, b: 220 } }
    ]
  },

  /**
   * Effect categories for UI organization
   */
  categories: [
    {
      id: 'border',
      name: '🖼️ Border Customization',
      description: 'Add decorative borders with custom colors and widths',
      type: 'customization',
      borderEnabled: false
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
      lightning: 0
    };

    // Apply each enabled effect's preset
    for (const [toggleKey, enabled] of Object.entries(enabledToggles)) {
      if (enabled) {
        const effect = this.effectTypes[toggleKey];
        if (effect && effect.preset) {
          // Merge effect values
          Object.assign(finalEffects, effect.preset);
        }
      }
    }

    return finalEffects;
  }
};

module.exports = effectsConfig;
