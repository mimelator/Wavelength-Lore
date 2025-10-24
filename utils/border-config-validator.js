/**
 * Border Configuration Validator
 * 
 * Validates border configuration objects to ensure they meet the requirements
 * for the border overlay system. Supports multiple border types with type-specific
 * validation rules.
 */

class BorderConfigValidator {
    constructor() {
        this.supportedBorderTypes = ['solid', 'gradient', 'pattern', 'wavelength-theme', 'blend'];
        this.supportedGradientTypes = ['linear', 'radial', 'conic'];
        this.supportedPatterns = ['polka-dots', 'stars', 'stripes', 'diagonal', 'custom'];
        this.supportedWavelengthThemes = ['goblin-king', 'ice-fortress', 'shire-sanctuary', 'wavelength-core'];
        this.supportedBlendModes = ['multiply', 'overlay', 'soft-light', 'hard-light', 'screen', 'color-burn'];
    }

    /**
     * Validates a border configuration object
     * @param {Object} config - The border configuration to validate
     * @returns {Object} Validation result with success/failure and detailed messages
     */
    validate(config) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Basic structure validation
        if (!config || typeof config !== 'object') {
            result.isValid = false;
            result.errors.push('Border configuration must be a valid object');
            return result;
        }

        // Required field validation
        if (!config.type) {
            result.isValid = false;
            result.errors.push('Border configuration must have a type field');
            return result;
        }

        // Type validation
        if (!this.supportedBorderTypes.includes(config.type)) {
            result.isValid = false;
            result.errors.push(`Unsupported border type: ${config.type}. Supported types: ${this.supportedBorderTypes.join(', ')}`);
            return result;
        }

        // Type-specific validation
        switch (config.type) {
            case 'solid':
                this.validateSolidBorder(config, result);
                break;
            case 'gradient':
                this.validateGradientBorder(config, result);
                break;
            case 'pattern':
                this.validatePatternBorder(config, result);
                break;
            case 'wavelength-theme':
                this.validateWavelengthThemeBorder(config, result);
                break;
            case 'blend':
                this.validateBlendBorder(config, result);
                break;
        }

        return result;
    }

    /**
     * Validates solid color border configuration
     */
    validateSolidBorder(config, result) {
        // Color validation
        if (!config.color) {
            result.isValid = false;
            result.errors.push('Solid border must have a color field');
        } else if (!this.isValidColor(config.color)) {
            result.isValid = false;
            result.errors.push(`Invalid color format: ${config.color}. Use hex (#ff0000), rgb(), or named colors`);
        }

        // Width validation
        if (config.width !== undefined) {
            if (!this.isValidWidth(config.width)) {
                result.isValid = false;
                result.errors.push('Border width must be a positive number (pixels)');
            }
        }

        // Opacity validation
        if (config.opacity !== undefined) {
            if (!this.isValidOpacity(config.opacity)) {
                result.isValid = false;
                result.errors.push('Opacity must be a number between 0 and 1');
            }
        }
    }

    /**
     * Validates gradient border configuration
     */
    validateGradientBorder(config, result) {
        // Gradient type validation
        if (!config.gradientType) {
            result.isValid = false;
            result.errors.push('Gradient border must have a gradientType field');
        } else if (!this.supportedGradientTypes.includes(config.gradientType)) {
            result.isValid = false;
            result.errors.push(`Unsupported gradient type: ${config.gradientType}. Supported: ${this.supportedGradientTypes.join(', ')}`);
        }

        // Colors validation
        if (!config.colors || !Array.isArray(config.colors)) {
            result.isValid = false;
            result.errors.push('Gradient border must have a colors array');
        } else if (config.colors.length < 2) {
            result.isValid = false;
            result.errors.push('Gradient must have at least 2 colors');
        } else {
            // Validate each color
            config.colors.forEach((color, index) => {
                if (!this.isValidColor(color)) {
                    result.isValid = false;
                    result.errors.push(`Invalid color at index ${index}: ${color}`);
                }
            });
        }

        // Direction validation for linear gradients
        if (config.gradientType === 'linear' && config.direction) {
            if (!this.isValidDirection(config.direction)) {
                result.warnings.push(`Direction "${config.direction}" may not be valid. Use degrees (45deg) or keywords (to right)`);
            }
        }

        // Width validation
        if (config.width !== undefined && !this.isValidWidth(config.width)) {
            result.isValid = false;
            result.errors.push('Border width must be a positive number');
        }
    }

    /**
     * Validates pattern border configuration
     */
    validatePatternBorder(config, result) {
        // Pattern validation
        if (!config.pattern) {
            result.isValid = false;
            result.errors.push('Pattern border must have a pattern field');
        } else if (!this.supportedPatterns.includes(config.pattern) && config.pattern !== 'custom') {
            result.isValid = false;
            result.errors.push(`Unsupported pattern: ${config.pattern}. Supported: ${this.supportedPatterns.join(', ')}`);
        }

        // Pattern color validation
        if (config.patternColor && !this.isValidColor(config.patternColor)) {
            result.isValid = false;
            result.errors.push(`Invalid pattern color: ${config.patternColor}`);
        }

        // Pattern size validation
        if (config.patternSize && !['small', 'medium', 'large'].includes(config.patternSize)) {
            result.warnings.push(`Pattern size "${config.patternSize}" should be small, medium, or large`);
        }

        // Opacity validation
        if (config.opacity !== undefined && !this.isValidOpacity(config.opacity)) {
            result.isValid = false;
            result.errors.push('Pattern opacity must be between 0 and 1');
        }

        // Spacing validation
        if (config.spacing !== undefined && !this.isValidWidth(config.spacing)) {
            result.isValid = false;
            result.errors.push('Pattern spacing must be a positive number');
        }
    }

    /**
     * Validates Wavelength theme border configuration
     */
    validateWavelengthThemeBorder(config, result) {
        // Theme validation
        if (!config.theme) {
            result.isValid = false;
            result.errors.push('Wavelength theme border must have a theme field');
        } else if (!this.supportedWavelengthThemes.includes(config.theme)) {
            result.isValid = false;
            result.errors.push(`Unsupported theme: ${config.theme}. Supported: ${this.supportedWavelengthThemes.join(', ')}`);
        }

        // Elements validation
        if (config.elements && !Array.isArray(config.elements)) {
            result.isValid = false;
            result.errors.push('Theme elements must be an array');
        } else if (config.elements && config.elements.length === 0) {
            result.warnings.push('No theme elements specified - will use default elements');
        }

        // Density validation
        if (config.density && !['low', 'medium', 'high'].includes(config.density)) {
            result.warnings.push(`Density "${config.density}" should be low, medium, or high`);
        }

        // Color scheme validation
        if (config.colorScheme && !['light', 'dark', 'vibrant', 'muted'].includes(config.colorScheme)) {
            result.warnings.push(`Color scheme "${config.colorScheme}" should be light, dark, vibrant, or muted`);
        }
    }

    /**
     * Validates blend effect border configuration
     */
    validateBlendBorder(config, result) {
        // Blend mode validation
        if (!config.blendMode) {
            result.isValid = false;
            result.errors.push('Blend border must have a blendMode field');
        } else if (!this.supportedBlendModes.includes(config.blendMode)) {
            result.isValid = false;
            result.errors.push(`Unsupported blend mode: ${config.blendMode}. Supported: ${this.supportedBlendModes.join(', ')}`);
        }

        // Feather radius validation
        if (config.featherRadius !== undefined && !this.isValidWidth(config.featherRadius)) {
            result.isValid = false;
            result.errors.push('Feather radius must be a positive number');
        }

        // Fade distance validation
        if (config.fadeDistance !== undefined && !this.isValidWidth(config.fadeDistance)) {
            result.isValid = false;
            result.errors.push('Fade distance must be a positive number');
        }

        // Direction validation
        if (config.direction && !['inward', 'outward', 'both'].includes(config.direction)) {
            result.warnings.push(`Direction "${config.direction}" should be inward, outward, or both`);
        }
    }

    /**
     * Validates color format (hex, rgb, rgba, named colors)
     */
    isValidColor(color) {
        if (typeof color !== 'string') return false;

        // Hex colors
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true;
        
        // RGB/RGBA colors
        if (/^rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)$/.test(color)) return true;
        if (/^rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[01]?(\\.[0-9]+)?\\s*\\)$/.test(color)) return true;
        
        // Named colors (basic validation)
        const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'silver', 'gray', 'maroon', 'olive', 'aqua', 'fuchsia', 'white', 'black'];
        if (namedColors.includes(color.toLowerCase())) return true;

        return false;
    }

    /**
     * Validates width/spacing values
     */
    isValidWidth(width) {
        return typeof width === 'number' && width > 0 && width <= 1000;
    }

    /**
     * Validates opacity values
     */
    isValidOpacity(opacity) {
        return typeof opacity === 'number' && opacity >= 0 && opacity <= 1;
    }

    /**
     * Validates gradient direction
     */
    isValidDirection(direction) {
        if (typeof direction !== 'string') return false;
        
        // Degree values
        if (/^\\d+deg$/.test(direction)) return true;
        
        // Keyword directions
        const keywords = ['to top', 'to right', 'to bottom', 'to left', 'to top right', 'to top left', 'to bottom right', 'to bottom left'];
        return keywords.includes(direction.toLowerCase());
    }

    /**
     * Gets a sample configuration for a given border type
     */
    getSampleConfig(borderType) {
        const samples = {
            solid: {
                type: 'solid',
                color: '#ff0000',
                width: 10,
                opacity: 1.0
            },
            gradient: {
                type: 'gradient',
                gradientType: 'linear',
                colors: ['#ff0000', '#00ff00'],
                direction: '45deg',
                width: 15
            },
            pattern: {
                type: 'pattern',
                pattern: 'polka-dots',
                patternColor: '#ffffff',
                patternSize: 'medium',
                opacity: 0.7,
                spacing: 20
            },
            'wavelength-theme': {
                type: 'wavelength-theme',
                theme: 'goblin-king',
                elements: ['crowns', 'gems'],
                density: 'medium',
                colorScheme: 'dark'
            },
            blend: {
                type: 'blend',
                blendMode: 'soft-light',
                featherRadius: 20,
                fadeDistance: 50,
                direction: 'outward'
            }
        };

        return samples[borderType] || null;
    }
}

module.exports = BorderConfigValidator;