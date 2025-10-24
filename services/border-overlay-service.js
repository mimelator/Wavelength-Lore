/**
 * Border Overlay Service
 * 
 * Core image processing engine for applying borders, gradients, patterns, 
 * and blend effects to cached enhanced images. Uses Sharp for high-performance
 * image manipulation.
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const BorderConfigValidator = require('../utils/border-config-validator');

class BorderOverlayService {
    constructor(options = {}) {
        this.validator = new BorderConfigValidator();
        this.options = {
            outputFormat: 'webp', // Default output format
            quality: 90, // Default quality
            maxImageSize: 5000, // Max width/height in pixels
            tempDir: options.tempDir || path.join(process.cwd(), 'temp'),
            ...options
        };
        
        // Ensure temp directory exists
        this.ensureTempDirectory();
    }

    async ensureTempDirectory() {
        try {
            await fs.mkdir(this.options.tempDir, { recursive: true });
        } catch (error) {
            console.warn('Warning: Could not create temp directory:', error.message);
        }
    }

    /**
     * Apply border overlay to an image
     * @param {Buffer|string} imageInput - Image buffer or file path
     * @param {Object} borderConfig - Border configuration object
     * @param {Object} options - Processing options
     * @returns {Promise<Buffer>} Processed image buffer
     */
    async applyBorderOverlay(imageInput, borderConfig, options = {}) {
        const startTime = Date.now();
        
        try {
            // Validate border configuration
            const validation = this.validator.validate(borderConfig);
            if (!validation.isValid) {
                throw new Error(`Invalid border configuration: ${validation.errors.join(', ')}`);
            }

            console.log(`🎨 Applying ${borderConfig.type} border overlay...`);

            // Load and validate image
            const imageBuffer = await this.loadImageBuffer(imageInput);
            const imageInfo = await this.getImageInfo(imageBuffer);
            
            console.log(`📐 Image dimensions: ${imageInfo.width}x${imageInfo.height}`);

            // Apply border based on type
            let processedImage;
            switch (borderConfig.type) {
                case 'solid':
                    processedImage = await this.applySolidBorder(imageBuffer, borderConfig, imageInfo);
                    break;
                case 'gradient':
                    processedImage = await this.applyGradientBorder(imageBuffer, borderConfig, imageInfo);
                    break;
                case 'pattern':
                    processedImage = await this.applyPatternBorder(imageBuffer, borderConfig, imageInfo);
                    break;
                case 'wavelength-theme':
                    processedImage = await this.applyWavelengthThemeBorder(imageBuffer, borderConfig, imageInfo);
                    break;
                case 'blend':
                    processedImage = await this.applyBlendBorder(imageBuffer, borderConfig, imageInfo);
                    break;
                default:
                    throw new Error(`Unsupported border type: ${borderConfig.type}`);
            }

            // Apply final processing options
            const finalImage = await this.applyFinalProcessing(processedImage, options);

            const processingTime = Date.now() - startTime;
            console.log(`✅ Border overlay applied in ${processingTime}ms`);

            return finalImage;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`❌ Border overlay failed after ${processingTime}ms:`, error.message);
            throw error;
        }
    }

    /**
     * Load image buffer from input (Buffer or file path)
     */
    async loadImageBuffer(imageInput) {
        if (Buffer.isBuffer(imageInput)) {
            return imageInput;
        }
        
        if (typeof imageInput === 'string') {
            try {
                return await fs.readFile(imageInput);
            } catch (error) {
                throw new Error(`Failed to load image from path: ${imageInput}`);
            }
        }

        throw new Error('Image input must be a Buffer or file path string');
    }

    /**
     * Get image information using Sharp
     */
    async getImageInfo(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                channels: metadata.channels,
                hasAlpha: metadata.channels === 4
            };
        } catch (error) {
            throw new Error(`Failed to read image metadata: ${error.message}`);
        }
    }

    /**
     * Apply solid color border
     */
    async applySolidBorder(imageBuffer, config, imageInfo) {
        const { color = '#000000', width = 10, opacity = 1.0 } = config;
        
        console.log(`🎨 Applying solid border: ${color}, width: ${width}px, opacity: ${opacity}`);

        const borderWidth = Math.max(1, Math.min(width, 100)); // Clamp to reasonable range
        const newWidth = imageInfo.width + (borderWidth * 2);
        const newHeight = imageInfo.height + (borderWidth * 2);

        // Parse color to RGB
        const borderColor = this.parseColor(color, opacity);

        try {
            const borderedImage = await sharp({
                create: {
                    width: newWidth,
                    height: newHeight,
                    channels: 4,
                    background: borderColor
                }
            })
            .composite([{
                input: imageBuffer,
                left: borderWidth,
                top: borderWidth
            }])
            .png() // Use PNG to preserve alpha channel
            .toBuffer();

            return borderedImage;

        } catch (error) {
            throw new Error(`Failed to apply solid border: ${error.message}`);
        }
    }

    /**
     * Apply gradient border
     */
    async applyGradientBorder(imageBuffer, config, imageInfo) {
        const { gradientType = 'linear', colors = ['#000000', '#ffffff'], direction = '0deg', width = 15 } = config;
        
        console.log(`🌈 Applying ${gradientType} gradient border with ${colors.length} colors`);

        const borderWidth = Math.max(1, Math.min(width, 100));
        const newWidth = imageInfo.width + (borderWidth * 2);
        const newHeight = imageInfo.height + (borderWidth * 2);

        try {
            // Create gradient border using SVG
            const gradientSvg = this.createGradientSvg(newWidth, newHeight, gradientType, colors, direction, borderWidth);
            
            const gradientBuffer = Buffer.from(gradientSvg);
            
            const borderedImage = await sharp(gradientBuffer)
                .composite([{
                    input: imageBuffer,
                    left: borderWidth,
                    top: borderWidth
                }])
                .png()
                .toBuffer();

            return borderedImage;

        } catch (error) {
            throw new Error(`Failed to apply gradient border: ${error.message}`);
        }
    }

    /**
     * Create SVG gradient for border
     */
    createGradientSvg(width, height, gradientType, colors, direction, borderWidth) {
        const colorStops = colors.map((color, index) => {
            const offset = (index / (colors.length - 1)) * 100;
            return `<stop offset="${offset}%" stop-color="${color}"/>`;
        }).join('\n    ');

        let gradientDef;
        if (gradientType === 'linear') {
            // Parse direction to coordinates
            const coords = this.parseLinearGradientDirection(direction);
            gradientDef = `<linearGradient id="borderGradient" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
    ${colorStops}
  </linearGradient>`;
        } else if (gradientType === 'radial') {
            gradientDef = `<radialGradient id="borderGradient" cx="50%" cy="50%" r="50%">
    ${colorStops}
  </radialGradient>`;
        } else {
            // Default to linear
            gradientDef = `<linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
    ${colorStops}
  </linearGradient>`;
        }

        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientDef}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#borderGradient)"/>
  <rect x="${borderWidth}" y="${borderWidth}" width="${width - borderWidth * 2}" height="${height - borderWidth * 2}" fill="transparent"/>
</svg>`;
    }

    /**
     * Parse linear gradient direction to SVG coordinates
     */
    parseLinearGradientDirection(direction) {
        // Default: left to right
        let coords = { x1: '0%', y1: '0%', x2: '100%', y2: '0%' };

        if (typeof direction === 'string') {
            if (direction.includes('deg')) {
                // Convert degrees to coordinates
                const degrees = parseInt(direction);
                const radians = (degrees - 90) * (Math.PI / 180);
                const x2 = 50 + Math.cos(radians) * 50;
                const y2 = 50 + Math.sin(radians) * 50;
                coords = { x1: '50%', y1: '50%', x2: `${x2}%`, y2: `${y2}%` };
            } else if (direction.includes('to ')) {
                // Keyword directions
                const directionMap = {
                    'to right': { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
                    'to left': { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
                    'to bottom': { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
                    'to top': { x1: '0%', y1: '100%', x2: '0%', y2: '0%' },
                    'to bottom right': { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
                    'to top left': { x1: '100%', y1: '100%', x2: '0%', y2: '0%' }
                };
                coords = directionMap[direction] || coords;
            }
        }

        return coords;
    }

    /**
     * Apply pattern border (placeholder for now)
     */
    async applyPatternBorder(imageBuffer, config, imageInfo) {
        console.log(`🔶 Applying pattern border: ${config.pattern}`);
        
        // For now, apply a simple dotted border as placeholder
        // This will be enhanced with actual pattern generation
        const solidConfig = {
            type: 'solid',
            color: config.patternColor || '#ffffff',
            width: config.spacing || 15,
            opacity: config.opacity || 0.7
        };
        
        return await this.applySolidBorder(imageBuffer, solidConfig, imageInfo);
    }

    /**
     * Apply Wavelength theme border (placeholder for now)
     */
    async applyWavelengthThemeBorder(imageBuffer, config, imageInfo) {
        console.log(`⚡ Applying Wavelength theme border: ${config.theme}`);
        
        // For now, apply a themed color border as placeholder
        const themeColors = {
            'goblin-king': '#8B4513',
            'ice-fortress': '#87CEEB',
            'shire-sanctuary': '#228B22',
            'wavelength-core': '#9370DB'
        };
        
        const solidConfig = {
            type: 'solid',
            color: themeColors[config.theme] || '#000000',
            width: 20,
            opacity: 0.8
        };
        
        return await this.applySolidBorder(imageBuffer, solidConfig, imageInfo);
    }

    /**
     * Apply blend border for seamless fabric transition
     */
    async applyBlendBorder(imageBuffer, config, imageInfo) {
        const { featherRadius = 20, fadeDistance = 50, direction = 'outward' } = config;
        
        console.log(`🌊 Applying blend border: feather ${featherRadius}px, fade ${fadeDistance}px, ${direction}`);

        try {
            // Create a feathered mask
            const maskSize = Math.max(featherRadius, fadeDistance);
            const newWidth = imageInfo.width + (maskSize * 2);
            const newHeight = imageInfo.height + (maskSize * 2);

            // Create a gradient mask for feathering
            const maskSvg = this.createFeatherMask(newWidth, newHeight, maskSize, direction);
            const maskBuffer = Buffer.from(maskSvg);

            // Apply the feathered edge
            const featheredImage = await sharp({
                create: {
                    width: newWidth,
                    height: newHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                }
            })
            .composite([
                {
                    input: imageBuffer,
                    left: maskSize,
                    top: maskSize
                },
                {
                    input: maskBuffer,
                    blend: 'dest-in'
                }
            ])
            .png()
            .toBuffer();

            return featheredImage;

        } catch (error) {
            throw new Error(`Failed to apply blend border: ${error.message}`);
        }
    }

    /**
     * Create SVG feather mask for blend borders
     */
    createFeatherMask(width, height, maskSize, direction) {
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(centerX, centerY) - maskSize;

        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="featherMask" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="white" stop-opacity="1"/>
      <stop offset="70%" stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#featherMask)"/>
</svg>`;
    }

    /**
     * Parse color string to Sharp-compatible color object
     */
    parseColor(colorString, opacity = 1.0) {
        // Handle hex colors
        if (colorString.startsWith('#')) {
            const hex = colorString.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const alpha = Math.round(opacity * 255);
            return { r, g, b, alpha };
        }

        // Handle named colors (basic set)
        const namedColors = {
            red: { r: 255, g: 0, b: 0 },
            green: { r: 0, g: 255, b: 0 },
            blue: { r: 0, g: 0, b: 255 },
            white: { r: 255, g: 255, b: 255 },
            black: { r: 0, g: 0, b: 0 }
        };

        if (namedColors[colorString.toLowerCase()]) {
            const color = namedColors[colorString.toLowerCase()];
            return { ...color, alpha: Math.round(opacity * 255) };
        }

        // Default to black
        return { r: 0, g: 0, b: 0, alpha: Math.round(opacity * 255) };
    }

    /**
     * Apply final processing options
     */
    async applyFinalProcessing(imageBuffer, options) {
        const format = options.format || this.options.outputFormat;
        const quality = options.quality || this.options.quality;

        try {
            let processor = sharp(imageBuffer);

            // Apply format and quality
            if (format === 'webp') {
                processor = processor.webp({ quality });
            } else if (format === 'jpeg' || format === 'jpg') {
                processor = processor.jpeg({ quality });
            } else if (format === 'png') {
                processor = processor.png({ quality: Math.round(quality / 10) }); // PNG quality is 0-9
            }

            return await processor.toBuffer();

        } catch (error) {
            throw new Error(`Failed to apply final processing: ${error.message}`);
        }
    }

    /**
     * Generate a unique hash for border configuration
     */
    generateBorderHash(borderConfig, imageHash) {
        const configString = JSON.stringify(borderConfig);
        const combinedString = `${imageHash}-${configString}`;
        return crypto.createHash('md5').update(combinedString).digest('hex');
    }

    /**
     * Get supported border types
     */
    getSupportedBorderTypes() {
        return this.validator.supportedBorderTypes;
    }

    /**
     * Get sample configuration for a border type
     */
    getSampleConfiguration(borderType) {
        return this.validator.getSampleConfig(borderType);
    }
}

module.exports = BorderOverlayService;