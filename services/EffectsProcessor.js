/**
 * Effects Processor Service
 * Applies visual effects to images using Sharp
 * Supports color grading, bloom, vignette, and lightning effects
 */

const Sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const effectsConfig = require('../config/effectsConfig');

// Static overlay system
const StaticOverlayGenerator = require('../scripts/generate-static-overlays');

class EffectsProcessor {
  constructor() {
    this.overlayGenerator = new StaticOverlayGenerator();
    this.overlayCache = new Map(); // Cache loaded overlays
  }

  /**
   * Process image with effects
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} effectParams - Effect parameters
   * @returns {Promise<Buffer>} - Processed image buffer (PNG)
   */
  async processImage(imageBuffer, effectParams = {}) {
    try {
      // Use provided params or defaults
      const finalParams = {
        saturation: effectParams.saturation ?? 1.0,
        colorTemperature: effectParams.colorTemperature ?? 5500,
        bloom: effectParams.bloom ?? 0,
        vignette: effectParams.vignette ?? 0,
        blur: effectParams.blur ?? 0,
        brightness: effectParams.brightness ?? 1.0,
        contrast: effectParams.contrast ?? 1.0,
        lightning: effectParams.lightning ?? 0,
        // Static overlay effects
        staticLightning: effectParams.staticLightning ?? false,
        staticSnow: effectParams.staticSnow ?? false,
        staticFireflies: effectParams.staticFireflies ?? false,
        staticSparkles: effectParams.staticSparkles ?? false
      };

      console.log(`🎨 Processing image with effects:`, finalParams);

      // Get image metadata first to know dimensions
      const imageMetadata = await Sharp(imageBuffer).metadata();
      console.log(`📐 Image dimensions: ${imageMetadata.width}x${imageMetadata.height}`);

      // Start with Sharp pipeline
      let pipeline = Sharp(imageBuffer);

      // Apply effects in optimal order
      pipeline = await this.applyColorGrading(pipeline, finalParams);
      pipeline = await this.applyLightingEffects(pipeline, finalParams, imageMetadata);
      pipeline = await this.applySpecialEffects(pipeline, finalParams, imageMetadata);
      
      // Apply static overlays
      pipeline = await this.applyStaticOverlays(pipeline, finalParams, imageMetadata);

      // PROACTIVE FORMAT TRACKING: Use PNG for Printify compatibility instead of WebP
      // This maintains the format expected by Printify API
      console.log('📝 PROACTIVE FORMAT TRACKING: Effects processor maintaining PNG format for Printify compatibility');
      const processed = await pipeline
        .png({
          quality: 90,  // High quality PNG for print
          compressionLevel: 6  // Balanced compression
        })
        .toBuffer();

      // Apply border if specified in effectParams
      let finalProcessed = processed;
      if (effectParams.borderEnabled && effectParams.borderWidthPixels > 0 && effectParams.borderColor) {
        console.log(`🖼️ Applying border: ${effectParams.borderWidthPixels}px, Color: ${effectParams.borderColor}`);
        const BorderProcessor = require('./BorderProcessor');
        const borderProcessor = new BorderProcessor();
        finalProcessed = await borderProcessor.applyBorder(processed, {
          enabled: true,
          width: effectParams.borderWidth,
          widthPixels: effectParams.borderWidthPixels,
          colorHex: effectParams.borderColor
        });
        console.log(`✅ Border applied successfully`);
      }

      console.log(`✅ Effects applied successfully`);
      return finalProcessed;

    } catch (error) {
      console.error(`❌ Error processing image with effects:`, error.message);
      throw error;
    }
  }

  /**
   * Apply color grading effects
   */
  async applyColorGrading(pipeline, params) {
    try {
      // Color temperature adjustment
      if (params.colorTemperature !== 5500) {
        const tempShift = this.kelvinToRGB(params.colorTemperature);
        pipeline = pipeline.modulate({
          hue: tempShift.hue,
          saturation: params.saturation,
          brightness: params.brightness,
          lightness: 0
        });
      } else {
        // Just apply saturation if no temp shift needed
        pipeline = pipeline.modulate({
          saturation: params.saturation,
          brightness: params.brightness
        });
      }

      // Apply contrast
      if (params.contrast !== 1.0) {
        pipeline = pipeline.modulate({
          contrast: params.contrast
        });
      }

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying color grading:`, error.message);
      return pipeline; // Return unmodified on error
    }
  }

  /**
   * Apply lighting effects (bloom, vignette)
   */
  async applyLightingEffects(pipeline, params, imageMetadata = {}) {
    try {
      // Vignette effect (darken edges)
      if (params.vignette > 0) {
        pipeline = await this.applyVignette(pipeline, params.vignette, imageMetadata);
      }

      // Bloom effect (glow)
      if (params.bloom > 0) {
        pipeline = await this.applyBloom(pipeline, params.bloom, imageMetadata);
      }

      // Edge blur effect
      if (params.blur > 0) {
        pipeline = await this.applyEdgeBlur(pipeline, params.blur, imageMetadata);
      }

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying lighting effects:`, error.message);
      return pipeline;
    }
  }

  /**
   * Apply special effects (lightning, etc.)
   */
  async applySpecialEffects(pipeline, params, imageMetadata = {}) {
    try {
      // Lightning effect (electric color shift and vignette)
      if (params.lightning > 0) {
        pipeline = await this.applyLightningEffect(pipeline, params.lightning, imageMetadata);
      }

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying special effects:`, error.message);
      return pipeline;
    }
  }

  /**
   * Apply static overlay effects
   * Loads master overlays and resizes them to match image dimensions
   */
  async applyStaticOverlays(pipeline, params, imageMetadata = {}) {
    try {
      const width = imageMetadata.width || 1000;
      const height = imageMetadata.height || 1000;
      
      console.log(`🎨 Applying static overlays to ${width}x${height} image`);
      
      // Lightning overlay
      if (params.staticLightning) {
        console.log('⚡ Applying static lightning overlay...');
        const lightningOverlay = await this.loadAndResizeOverlay('lightning', width, height);
        pipeline = pipeline.composite([
          {
            input: lightningOverlay,
            blend: 'screen',
            opacity: 0.8
          }
        ]);
      }
      
      // Snow overlay
      if (params.staticSnow) {
        console.log('❄️ Applying static snow overlay...');
        const snowOverlay = await this.loadAndResizeOverlay('snow', width, height);
        pipeline = pipeline.composite([
          {
            input: snowOverlay,
            blend: 'screen',
            opacity: 0.7
          }
        ]);
      }
      
      // Fireflies overlay
      if (params.staticFireflies) {
        console.log('🐛 Applying static fireflies overlay...');
        const firefliesOverlay = await this.loadAndResizeOverlay('fireflies', width, height);
        pipeline = pipeline.composite([
          {
            input: firefliesOverlay,
            blend: 'screen',
            opacity: 0.6
          }
        ]);
      }
      
      // Sparkles overlay
      if (params.staticSparkles) {
        console.log('✨ Applying static sparkles overlay...');
        const sparklesOverlay = await this.loadAndResizeOverlay('sparkles', width, height);
        pipeline = pipeline.composite([
          {
            input: sparklesOverlay,
            blend: 'screen',
            opacity: 0.5
          }
        ]);
      }
      
      // Vignette overlay (separate from dynamic vignette)
      if (params.staticVignette) {
        console.log('🎭 Applying static vignette overlay...');
        const vignetteOverlay = await this.loadAndResizeOverlay('vignette', width, height);
        pipeline = pipeline.composite([
          {
            input: vignetteOverlay,
            blend: 'multiply',
            opacity: 0.8
          }
        ]);
      }

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying static overlays:`, error.message);
      return pipeline;
    }
  }

  /**
   * Load and resize overlay to match target dimensions
   * Uses caching to avoid repeated file operations
   * Supports both local files and CDN URLs for production
   */
  async loadAndResizeOverlay(effectType, targetWidth, targetHeight) {
    try {
      const cacheKey = `${effectType}-${targetWidth}x${targetHeight}`;
      
      // Check cache first
      if (this.overlayCache.has(cacheKey)) {
        console.log(`📋 Using cached overlay: ${cacheKey}`);
        return this.overlayCache.get(cacheKey);
      }
      
      // Try local file first, then CDN as fallback
      let overlayBuffer = null;
      
      // Attempt 1: Load from local file system
      const localOverlayPath = this.overlayGenerator.getOverlayPath(effectType);
      try {
        await fs.access(localOverlayPath);
        console.log(`📁 Loading overlay from local file: ${localOverlayPath}`);
        overlayBuffer = await fs.readFile(localOverlayPath);
      } catch (localError) {
        console.log(`⚠️ Local overlay not found: ${localOverlayPath}`);
        
        // Attempt 2: Load from CDN (production fallback)
        const cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
        const cdnOverlayUrl = `${cdnUrl}/static-overlays/${effectType}/${effectType}-master.png`;
        
        try {
          console.log(`🌐 Loading overlay from CDN: ${cdnOverlayUrl}`);
          const axios = require('axios');
          const response = await axios.get(cdnOverlayUrl, { responseType: 'arraybuffer' });
          overlayBuffer = Buffer.from(response.data);
          console.log(`✅ CDN overlay loaded: ${overlayBuffer.length} bytes`);
        } catch (cdnError) {
          console.error(`❌ CDN overlay failed: ${cdnError.message}`);
          console.warn(`⚠️ Overlay not available locally or via CDN: ${effectType}`);
          return null;
        }
      }
      
      if (!overlayBuffer) {
        console.warn(`⚠️ No overlay buffer available for: ${effectType}`);
        return null;
      }
      
      // Resize overlay to target dimensions using Sharp directly
      const resizedBuffer = await Sharp(overlayBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();
      
      // Cache the resized overlay
      this.overlayCache.set(cacheKey, resizedBuffer);
      console.log(`💾 Cached resized overlay: ${cacheKey} (${resizedBuffer.length} bytes)`);
      
      return resizedBuffer;
      
    } catch (error) {
      console.error(`❌ Error loading overlay ${effectType}:`, error.message);
      return null;
    }
  }

  /**
   * Apply vignette (darkened edges for focus)
   */
  async applyVignette(pipeline, intensity, imageMetadata = {}) {
    try {
      // Create vignette SVG overlay
      const vignetteIntensity = Math.max(0, Math.min(1, intensity));
      const opacity = vignetteIntensity;

      // Get image dimensions
      const width = imageMetadata.width || 1000;
      const height = imageMetadata.height || 1000;

      // SVG for radial gradient vignette with correct dimensions
      const vignetteOverlay = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
              <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(0,0,0,${opacity});stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#vignette)" />
        </svg>
      `);

      pipeline = pipeline.composite([
        {
          input: vignetteOverlay,
          blend: 'multiply'
        }
      ]);

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying vignette:`, error.message);
      return pipeline;
    }
  }

  /**
   * Apply bloom/glow effect
   * Creates a soft glow on bright areas
   */
  async applyBloom(pipeline, intensity, imageMetadata = {}) {
    try {
      const bloomIntensity = Math.max(0, Math.min(1, intensity));

      if (bloomIntensity === 0) return pipeline;

      // Create a blurred version for bloom effect
      // Ensure the bloom buffer has the same dimensions as the source
      const pipelineBuffer = await pipeline.toBuffer();
      const bloomBuffer = await Sharp(pipelineBuffer)
        .blur(20 + bloomIntensity * 40) // 20-60px blur
        .modulate({
          saturation: 1 + bloomIntensity * 0.5
        })
        .toBuffer();

      // Composite bloom on top with blend
      pipeline = pipeline.composite([
        {
          input: bloomBuffer,
          blend: 'screen',
          opacity: bloomIntensity * 0.5
        }
      ]);

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying bloom:`, error.message);
      return pipeline;
    }
  }

  /**
   * Apply edge blur for depth of field effect
   */
  async applyEdgeBlur(pipeline, blurStrength, imageMetadata = {}) {
    try {
      const strength = Math.max(0, Math.min(10, blurStrength));

      if (strength === 0) return pipeline;

      // Create a blur mask that's strongest at edges
      // Use provided metadata if available, otherwise get from pipeline
      const metadata = Object.keys(imageMetadata).length > 0 ? imageMetadata : await pipeline.metadata();
      const width = metadata.width;
      const height = metadata.height;

      // Create gradient mask (sharp in center, blurred at edges)
      const maskSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="focusmask" cx="50%" cy="50%" r="60%">
              <stop offset="0%" style="stop-color:white;stop-opacity:1" />
              <stop offset="100%" style="stop-color:black;stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#focusmask)" />
        </svg>
      `);

      // Create blurred version
      const blurredBuffer = await Sharp(await pipeline.toBuffer())
        .blur(strength)
        .toBuffer();

      // Composite with mask
      pipeline = pipeline.composite([
        {
          input: blurredBuffer,
          blend: 'lighten'
        }
      ]);

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying edge blur:`, error.message);
      return pipeline;
    }
  }

  /**
   * Apply lightning strike effect
   * Creates electric blue/white tones with procedural lightning bolts and enhanced vignette
   */
  async applyLightningEffect(pipeline, intensity, imageMetadata = {}) {
    try {
      const lightningIntensity = Math.max(0, Math.min(1, intensity));

      if (lightningIntensity === 0) return pipeline;

      // Get image dimensions, default to 1000x1000 if not available
      const width = imageMetadata.width || 1000;
      const height = imageMetadata.height || 1000;
      console.log(`⚡ Applying lightning effect to ${width}x${height} image`);

      // Apply cool color shift (blue tones)
      pipeline = pipeline.modulate({
        hue: 200 * lightningIntensity, // Shift toward blue
        saturation: 1.2 + lightningIntensity * 0.3,
        brightness: 1.0 + lightningIntensity * 0.1
      });

      // Add glow effect
      const glowBuffer = await Sharp(await pipeline.toBuffer())
        .blur(30)
        .modulate({
          saturation: 2.0,
          brightness: 1.3
        })
        .toBuffer();

      pipeline = pipeline.composite([
        {
          input: glowBuffer,
          blend: 'lighten',
          opacity: lightningIntensity * 0.4
        }
      ]);

      // Create procedural lightning bolts with correct dimensions
      const lightningBolts = this.generateLightningBolts(lightningIntensity, width, height);
      pipeline = pipeline.composite([
        {
          input: lightningBolts,
          blend: 'screen',
          opacity: lightningIntensity * 0.7
        }
      ]);

      // Add strong vignette for drama with correct dimensions
      const vignetteOverlay = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="lightning-vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(20,40,80,${lightningIntensity * 0.6});stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#lightning-vignette)" />
        </svg>
      `);

      pipeline = pipeline.composite([
        {
          input: vignetteOverlay,
          blend: 'multiply'
        }
      ]);

      return pipeline;

    } catch (error) {
      console.error(`⚠️ Error applying lightning effect:`, error.message);
      return pipeline;
    }
  }

  /**
   * Generate procedural lightning bolts
   * Creates fractal-like branching lightning paths
   */
  generateLightningBolts(intensity, width = 1000, height = 1000) {
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>`;

    // Generate 2-4 main lightning bolts
    const boltCount = Math.ceil(2 + intensity * 2);

    for (let b = 0; b < boltCount; b++) {
      // Random starting position (top area)
      const startX = Math.random() * width * 0.6 + width * 0.2;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * width * 0.4;
      const endY = height;

      // Generate lightning path with fractal branching
      const path = this.generateLightningPath(startX, startY, endX, endY, 5, intensity);

      // Add glow effect (outer layer)
      svgContent += `<path d="${path}" stroke="rgba(100,150,255,${0.3 * intensity})" stroke-width="8" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;

      // Add main bolt (bright)
      svgContent += `<path d="${path}" stroke="rgba(200,220,255,${0.7 * intensity})" stroke-width="3" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;

      // Add core (very bright white)
      svgContent += `<path d="${path}" stroke="rgba(255,255,255,${0.9 * intensity})" stroke-width="1" fill="none" stroke-linecap="round"/>`;

      // Add secondary branches
      const branchPoints = Math.floor(3 + intensity * 2);
      for (let i = 0; i < branchPoints; i++) {
        const branchT = Math.random();
        const branchX = startX + (endX - startX) * branchT;
        const branchY = startY + (endY - startY) * branchT;
        const branchEndX = branchX + (Math.random() - 0.5) * width * 0.2;
        const branchEndY = branchY + (Math.random() * height * 0.3);

        const branchPath = this.generateLightningPath(branchX, branchY, branchEndX, branchEndY, 3, intensity * 0.6);
        svgContent += `<path d="${branchPath}" stroke="rgba(150,200,255,${0.5 * intensity})" stroke-width="1.5" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;
      }
    }

    svgContent += `</svg>`;
    return Buffer.from(svgContent);
  }

  /**
   * Generate a fractal lightning path
   */
  generateLightningPath(x1, y1, x2, y2, depth, intensity, deviation = 20) {
    if (depth === 0) {
      return `L ${x2} ${y2}`;
    }

    // Find midpoint and offset it randomly
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * deviation * (1 + intensity);
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * deviation * (1 + intensity);

    // Recursively generate left and right branches
    const leftPath = this.generateLightningPath(x1, y1, midX, midY, depth - 1, intensity, deviation * 0.7);
    const rightPath = this.generateLightningPath(midX, midY, x2, y2, depth - 1, intensity, deviation * 0.7);

    return `${leftPath} ${rightPath}`;
  }

  /**
   * Convert color temperature (Kelvin) to RGB adjustment values
   * Approximates warm/cool color shifts
   */
  kelvinToRGB(kelvin) {
    const temp = kelvin / 100;
    let hue = 0;
    let saturation = 1.0;

    // Hue shift based on color temperature
    if (temp < 50) {
      hue = -30; // Very warm (orange/red)
      saturation = 1.2;
    } else if (temp < 55) {
      hue = -20; // Warm (golden)
      saturation = 1.1;
    } else if (temp === 55) {
      hue = 0; // Neutral white
      saturation = 1.0;
    } else if (temp < 65) {
      hue = 15; // Cool (blue-white)
      saturation = 0.95;
    } else {
      hue = 30; // Very cool (blue)
      saturation = 0.9;
    }

    return { hue, saturation };
  }

  /**
   * Generate effect hash for caching
   */
  generateEffectHash(effectParams) {
    const paramsStr = JSON.stringify(effectParams);
    return crypto.createHash('sha256').update(paramsStr).digest('hex').substring(0, 12);
  }

  /**
   * Save processed image to public directory
   */
  async saveProcessedImage(imageBuffer, baseName = 'effect') {
    try {
      const timestamp = Date.now();
      const filename = `${baseName}-${timestamp}.webp`;
      const filepath = path.join(__dirname, '../public/upscaled-images', filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });

      // Write file
      await fs.writeFile(filepath, imageBuffer);

      console.log(`💾 Saved processed image: ${filename}`);
      return {
        filename,
        url: `/upscaled-images/${filename}`,
        path: filepath
      };

    } catch (error) {
      console.error(`❌ Error saving processed image:`, error.message);
      throw error;
    }
  }
}

module.exports = EffectsProcessor;
