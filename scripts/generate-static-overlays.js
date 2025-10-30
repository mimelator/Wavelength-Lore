#!/usr/bin/env node

/**
 * Static Overlay Generator
 * Generates pre-rendered overlay effects in multiple sizes and intensities
 * Saves as PNG files with transparency for reliable compositing
 */

const Sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class StaticOverlayGenerator {
  constructor() {
    this.baseDir = path.join(__dirname, '../static-overlays');
    // Generate at single master size, then resize as needed
    this.masterSize = { width: 800, height: 800 };
    this.intensities = ['light', 'medium', 'heavy'];
  }

  /**
   * Generate one quality overlay for each effect type
   */
  async generateQualityOverlays() {
    console.log('🎨 Starting quality overlay generation...');
    
    try {
      // Generate lightning overlay with jagged branches
      await this.generateLightningOverlay();
      
      // Generate snow overlay with beautiful particles
      await this.generateSnowOverlay();
      
      // Generate fireflies overlay with warm glow
      await this.generateFirefliesOverlay();
      
      // Generate vignette overlay for dramatic focus
      await this.generateVignetteOverlay();
      
      // Generate sparkles overlay with star bursts
      await this.generateSparklesOverlay();
      
      console.log('✅ Quality static overlays generated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating overlays:', error.message);
      throw error;
    }
  }

  /**
   * Generate master lightning overlay (resize as needed)
   */
  async generateLightningOverlay() {
    console.log('⚡ Generating master lightning overlay...');
    
    // Ensure directory exists
    await fs.mkdir(path.join(this.baseDir, 'lightning'), { recursive: true });
    
    // Generate one master overlay
    const filename = `lightning-master.png`;
    const filepath = path.join(this.baseDir, 'lightning', filename);
    
    const overlayBuffer = await this.createLightningOverlay(
      this.masterSize.width, this.masterSize.height, 'double', 'heavy'
    );
    
    await fs.writeFile(filepath, overlayBuffer);
    console.log(`  ✓ Created master lightning overlay: ${filename}`);
  }

  /**
   * Generate master snow overlay (resize as needed)
   */
  async generateSnowOverlay() {
    console.log('❄️ Generating master snow overlay...');
    
    // Ensure directory exists
    await fs.mkdir(path.join(this.baseDir, 'snow'), { recursive: true });
    
    // Generate one master overlay
    const filename = `snow-master.png`;
    const filepath = path.join(this.baseDir, 'snow', filename);
    
    const overlayBuffer = await this.createSnowOverlay(
      this.masterSize.width, this.masterSize.height, 'blizzard', 'medium'
    );
    
    await fs.writeFile(filepath, overlayBuffer);
    console.log(`  ✓ Created master snow overlay: ${filename}`);
  }

  /**
   * Generate master fireflies overlay (resize as needed)
   */
  async generateFirefliesOverlay() {
    console.log('🐛 Generating master fireflies overlay...');
    
    // Ensure directory exists
    await fs.mkdir(path.join(this.baseDir, 'fireflies'), { recursive: true });
    
    // Generate one master overlay
    const filename = `fireflies-master.png`;
    const filepath = path.join(this.baseDir, 'fireflies', filename);
    
    const overlayBuffer = await this.createFirefliesOverlay(
      this.masterSize.width, this.masterSize.height, 'dance', 'medium'
    );
    
    await fs.writeFile(filepath, overlayBuffer);
    console.log(`  ✓ Created master fireflies overlay: ${filename}`);
  }

  /**
   * Generate master vignette overlay (resize as needed)
   */
  async generateVignetteOverlay() {
    console.log('🎭 Generating master vignette overlay...');
    
    // Ensure directory exists
    await fs.mkdir(path.join(this.baseDir, 'vignette'), { recursive: true });
    
    // Generate one master overlay
    const filename = `vignette-master.png`;
    const filepath = path.join(this.baseDir, 'vignette', filename);
    
    const overlayBuffer = await this.createVignetteOverlay(
      this.masterSize.width, this.masterSize.height, 'dramatic', 'medium'
    );
    
    await fs.writeFile(filepath, overlayBuffer);
    console.log(`  ✓ Created master vignette overlay: ${filename}`);
  }

  /**
   * Generate master sparkles overlay (resize as needed)
   */
  async generateSparklesOverlay() {
    console.log('✨ Generating master sparkles overlay...');
    
    // Ensure directory exists
    await fs.mkdir(path.join(this.baseDir, 'sparkles'), { recursive: true });
    
    // Generate one master overlay
    const filename = `sparkles-master.png`;
    const filepath = path.join(this.baseDir, 'sparkles', filename);
    
    const overlayBuffer = await this.createSparklesOverlay(
      this.masterSize.width, this.masterSize.height, 'magic', 'medium'
    );
    
    await fs.writeFile(filepath, overlayBuffer);
    console.log(`  ✓ Created master sparkles overlay: ${filename}`);
  }

  /**
   * Generate lightning effect overlays
   */
  async generateLightningOverlays() {
    console.log('⚡ Generating lightning overlays...');
    
    const variations = ['single', 'double', 'web'];
    
    for (const variation of variations) {
      for (const intensity of this.intensities) {
        for (const [sizeKey, sizeInfo] of Object.entries(this.sizes)) {
          const filename = `lightning-${variation}-${intensity}-${sizeInfo.suffix}.png`;
          const filepath = path.join(this.baseDir, 'lightning', filename);
          
          const lightningBuffer = await this.createLightningOverlay(
            sizeInfo.width, 
            sizeInfo.height, 
            variation, 
            intensity
          );
          
          await fs.writeFile(filepath, lightningBuffer);
          console.log(`  ✓ Created ${filename}`);
        }
      }
    }
  }

  /**
   * Create lightning overlay using proven fractal algorithm
   */
  async createLightningOverlay(width, height, variation, intensity) {
    const intensityValue = this.getIntensityValue(intensity);
    
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

    // Generate 2-4 main lightning bolts (from proven algorithm)
    const boltCount = Math.ceil(2 + intensityValue * 2);

    for (let b = 0; b < boltCount; b++) {
      // Random starting position (top area)
      const startX = Math.random() * width * 0.6 + width * 0.2;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * width * 0.4;
      const endY = height;

      // Generate lightning path with fractal branching
      const path = this.generateLightningPath(startX, startY, endX, endY, 5, intensityValue);

      // Add glow effect (outer layer) - Make more visible at low intensities
      const glowOpacity = Math.max(0.4, 0.3 + intensityValue * 0.4);
      svgContent += `<path d="M ${startX} ${startY} ${path}" stroke="rgba(100,150,255,${glowOpacity})" stroke-width="8" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;

      // Add main bolt (bright) - Ensure visibility at low intensities
      const mainOpacity = Math.max(0.6, 0.5 + intensityValue * 0.4);
      svgContent += `<path d="M ${startX} ${startY} ${path}" stroke="rgba(200,220,255,${mainOpacity})" stroke-width="3" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;

      // Add core (very bright white) - Always visible
      const coreOpacity = Math.max(0.7, 0.6 + intensityValue * 0.4);
      svgContent += `<path d="M ${startX} ${startY} ${path}" stroke="rgba(255,255,255,${coreOpacity})" stroke-width="1" fill="none" stroke-linecap="round"/>`;

      // Add secondary branches
      const branchPoints = Math.floor(3 + intensityValue * 2);
      for (let i = 0; i < branchPoints; i++) {
        const branchT = Math.random();
        const branchX = startX + (endX - startX) * branchT;
        const branchY = startY + (endY - startY) * branchT;
        const branchEndX = branchX + (Math.random() - 0.5) * width * 0.2;
        const branchEndY = branchY + (Math.random() * height * 0.3);

        const branchPath = this.generateLightningPath(branchX, branchY, branchEndX, branchEndY, 3, intensityValue * 0.6);
        svgContent += `<path d="M ${branchX} ${branchY} ${branchPath}" stroke="rgba(150,200,255,${0.5 * intensityValue})" stroke-width="1.5" fill="none" filter="url(#glow)" stroke-linecap="round"/>`;
      }
    }

    svgContent += `</svg>`;
    
    // Convert SVG to PNG with transparency
    return await Sharp(Buffer.from(svgContent))
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  // Removed old renderLightningBolt method - now using proven fractal algorithm directly

  /**
   * Generate snow effect overlays
   */
  async generateSnowOverlays() {
    console.log('❄️ Generating snow overlays...');
    
    const variations = ['light-fall', 'heavy-storm', 'blizzard'];
    
    for (const variation of variations) {
      for (const intensity of this.intensities) {
        for (const [sizeKey, sizeInfo] of Object.entries(this.sizes)) {
          const filename = `snow-${variation}-${intensity}-${sizeInfo.suffix}.png`;
          const filepath = path.join(this.baseDir, 'snow', filename);
          
          const snowBuffer = await this.createSnowOverlay(
            sizeInfo.width, 
            sizeInfo.height, 
            variation, 
            intensity
          );
          
          await fs.writeFile(filepath, snowBuffer);
          console.log(`  ✓ Created ${filename}`);
        }
      }
    }
  }

  /**
   * Create snow overlay
   */
  async createSnowOverlay(width, height, variation, intensity) {
    const intensityValue = this.getIntensityValue(intensity);
    let particleCount;
    let sizeRange;
    
    // Scale particle count and size based on image dimensions
    const scaleFactor = (width * height) / (800 * 800);
    
    if (variation === 'light-fall') {
      particleCount = Math.floor(50 * scaleFactor * intensityValue);
      sizeRange = { min: 1, max: 3 };
    } else if (variation === 'heavy-storm') {
      particleCount = Math.floor(150 * scaleFactor * intensityValue);
      sizeRange = { min: 2, max: 5 };
    } else if (variation === 'blizzard') {
      particleCount = Math.floor(300 * scaleFactor * intensityValue);
      sizeRange = { min: 1, max: 4 };
    }

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="snowglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>`;

    // Generate snow particles
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
      const opacity = 0.3 + Math.random() * 0.7;
      
      svgContent += `<circle cx="${x}" cy="${y}" r="${size}" 
                            fill="rgba(255,255,255,${opacity * intensityValue})" 
                            filter="url(#snowglow)"/>`;
    }

    svgContent += '</svg>';
    
    return await Sharp(Buffer.from(svgContent))
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  /**
   * Generate fireflies overlays
   */
  async generateFirefliesOverlays() {
    console.log('🐛 Generating fireflies overlays...');
    
    const variations = ['scattered', 'swarm', 'dance'];
    
    for (const variation of variations) {
      for (const intensity of this.intensities) {
        for (const [sizeKey, sizeInfo] of Object.entries(this.sizes)) {
          const filename = `fireflies-${variation}-${intensity}-${sizeInfo.suffix}.png`;
          const filepath = path.join(this.baseDir, 'fireflies', filename);
          
          const firefliesBuffer = await this.createFirefliesOverlay(
            sizeInfo.width, 
            sizeInfo.height, 
            variation, 
            intensity
          );
          
          await fs.writeFile(filepath, firefliesBuffer);
          console.log(`  ✓ Created ${filename}`);
        }
      }
    }
  }

  /**
   * Create fireflies overlay
   */
  async createFirefliesOverlay(width, height, variation, intensity) {
    const intensityValue = this.getIntensityValue(intensity);
    const scaleFactor = (width * height) / (800 * 800);
    
    let particleCount;
    let glowSize;
    
    if (variation === 'scattered') {
      particleCount = Math.floor(15 * scaleFactor * intensityValue);
      glowSize = Math.ceil(width / 200);
    } else if (variation === 'swarm') {
      particleCount = Math.floor(40 * scaleFactor * intensityValue);
      glowSize = Math.ceil(width / 300);
    } else if (variation === 'dance') {
      particleCount = Math.floor(25 * scaleFactor * intensityValue);
      glowSize = Math.ceil(width / 250);
    }

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="fireflyglow" x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="${glowSize}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="fireflyGradient">
          <stop offset="0%" style="stop-color:rgba(255,255,150,1);stop-opacity:1" />
          <stop offset="70%" style="stop-color:rgba(255,200,50,0.8);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,150,0,0);stop-opacity:1" />
        </radialGradient>
      </defs>`;

    // Generate firefly positions based on variation
    const positions = [];
    
    if (variation === 'scattered') {
      // Random scattered positions
      for (let i = 0; i < particleCount; i++) {
        positions.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 2 + Math.random() * 3
        });
      }
    } else if (variation === 'swarm') {
      // Clustered in center area
      const centerX = width / 2;
      const centerY = height / 2;
      for (let i = 0; i < particleCount; i++) {
        positions.push({
          x: centerX + (Math.random() - 0.5) * width * 0.6,
          y: centerY + (Math.random() - 0.5) * height * 0.6,
          size: 1.5 + Math.random() * 2.5
        });
      }
    } else if (variation === 'dance') {
      // Curved pattern like a dance
      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const angle = t * Math.PI * 4;
        const radius = Math.sin(t * Math.PI * 2) * width * 0.3;
        positions.push({
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * height * 0.2,
          size: 1.5 + Math.random() * 2
        });
      }
    }

    // Render fireflies
    for (const pos of positions) {
      const opacity = 0.6 + Math.random() * 0.4;
      svgContent += `<circle cx="${pos.x}" cy="${pos.y}" r="${pos.size * glowSize}" 
                            fill="url(#fireflyGradient)" 
                            opacity="${opacity * intensityValue}"
                            filter="url(#fireflyglow)"/>`;
      svgContent += `<circle cx="${pos.x}" cy="${pos.y}" r="${pos.size}" 
                            fill="rgba(255,255,200,${opacity * intensityValue})"/>`;
    }

    svgContent += '</svg>';
    
    return await Sharp(Buffer.from(svgContent))
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  /**
   * Generate vignette overlays
   */
  async generateVignetteOverlays() {
    console.log('🎭 Generating vignette overlays...');
    
    const variations = ['subtle', 'dramatic', 'soft-focus'];
    
    for (const variation of variations) {
      for (const intensity of this.intensities) {
        for (const [sizeKey, sizeInfo] of Object.entries(this.sizes)) {
          const filename = `vignette-${variation}-${intensity}-${sizeInfo.suffix}.png`;
          const filepath = path.join(this.baseDir, 'vignette', filename);
          
          const vignetteBuffer = await this.createVignetteOverlay(
            sizeInfo.width, 
            sizeInfo.height, 
            variation, 
            intensity
          );
          
          await fs.writeFile(filepath, vignetteBuffer);
          console.log(`  ✓ Created ${filename}`);
        }
      }
    }
  }

  /**
   * Create vignette overlay
   */
  async createVignetteOverlay(width, height, variation, intensity) {
    const intensityValue = this.getIntensityValue(intensity);
    let innerRadius, outerRadius, color;
    
    if (variation === 'subtle') {
      innerRadius = '80%';
      outerRadius = '100%';
      color = 'rgba(0,0,0,';
    } else if (variation === 'dramatic') {
      innerRadius = '60%';
      outerRadius = '90%';
      color = 'rgba(0,0,0,';
    } else if (variation === 'soft-focus') {
      innerRadius = '70%';
      outerRadius = '100%';
      color = 'rgba(20,20,20,';
    }

    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vignetteGradient" cx="50%" cy="50%" r="${outerRadius}">
          <stop offset="0%" style="stop-color:${color}0);stop-opacity:1" />
          <stop offset="${innerRadius}" style="stop-color:${color}0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}${intensityValue});stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#vignetteGradient)" />
    </svg>`;
    
    return await Sharp(Buffer.from(svgContent))
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  /**
   * Generate sparkles overlays
   */
  async generateSparklesOverlays() {
    console.log('✨ Generating sparkles overlays...');
    
    const variations = ['stardust', 'glitter', 'magic'];
    
    for (const variation of variations) {
      for (const intensity of this.intensities) {
        for (const [sizeKey, sizeInfo] of Object.entries(this.sizes)) {
          const filename = `sparkles-${variation}-${intensity}-${sizeInfo.suffix}.png`;
          const filepath = path.join(this.baseDir, 'sparkles', filename);
          
          const sparklesBuffer = await this.createSparklesOverlay(
            sizeInfo.width, 
            sizeInfo.height, 
            variation, 
            intensity
          );
          
          await fs.writeFile(filepath, sparklesBuffer);
          console.log(`  ✓ Created ${filename}`);
        }
      }
    }
  }

  /**
   * Create sparkles overlay
   */
  async createSparklesOverlay(width, height, variation, intensity) {
    const intensityValue = this.getIntensityValue(intensity);
    const scaleFactor = (width * height) / (800 * 800);
    
    let particleCount;
    let sparkleSize;
    
    if (variation === 'stardust') {
      particleCount = Math.floor(80 * scaleFactor * intensityValue);
      sparkleSize = Math.ceil(width / 400);
    } else if (variation === 'glitter') {
      particleCount = Math.floor(120 * scaleFactor * intensityValue);
      sparkleSize = Math.ceil(width / 600);
    } else if (variation === 'magic') {
      particleCount = Math.floor(60 * scaleFactor * intensityValue);
      sparkleSize = Math.ceil(width / 300);
    }

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sparkleglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${sparkleSize}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>`;

    // Generate sparkles
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = sparkleSize * (0.5 + Math.random() * 1.5);
      const opacity = 0.4 + Math.random() * 0.6;
      const rotation = Math.random() * 360;
      
      // Create star shape
      const starPath = this.createStarPath(x, y, size);
      
      svgContent += `<path d="${starPath}" 
                           fill="rgba(255,255,255,${opacity * intensityValue})" 
                           transform="rotate(${rotation} ${x} ${y})"
                           filter="url(#sparkleglow)"/>`;
    }

    svgContent += '</svg>';
    
    return await Sharp(Buffer.from(svgContent))
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  /**
   * Create star path for sparkles
   */
  createStarPath(centerX, centerY, size) {
    const outerRadius = size;
    const innerRadius = size * 0.4;
    const points = 4; // 4-pointed star
    
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    
    path += ' Z';
    return path;
  }

  /**
   * Generate fractal lightning path (from proven dynamic implementation)
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
   * Convert intensity name to numeric value
   */
  getIntensityValue(intensity) {
    switch (intensity) {
      case 'light': return 0.3;
      case 'medium': return 0.6;
      case 'heavy': return 1.0;
      default: return 0.6;
    }
  }

  /**
   * Generate overlay catalog JSON for master overlays
   */
  async generateOverlayCatalog() {
    console.log('📋 Generating master overlay catalog...');
    
    const catalog = {
      lightning: {
        masterFile: 'lightning-master.png',
        masterSize: this.masterSize,
        description: 'Electric lightning effects with jagged branching patterns'
      },
      snow: {
        masterFile: 'snow-master.png',
        masterSize: this.masterSize,
        description: 'Beautiful snow effects with varied particle sizes'
      },
      fireflies: {
        masterFile: 'fireflies-master.png',
        masterSize: this.masterSize,
        description: 'Magical firefly effects with warm glowing particles'
      },
      vignette: {
        masterFile: 'vignette-master.png',
        masterSize: this.masterSize,
        description: 'Dramatic edge darkening for photo focus'
      },
      sparkles: {
        masterFile: 'sparkles-master.png',
        masterSize: this.masterSize,
        description: 'Sparkling star effects with magical twinkles'
      }
    };

    const catalogPath = path.join(this.baseDir, 'overlay-catalog.json');
    await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2));
    
    console.log('✅ Master overlay catalog saved to overlay-catalog.json');
    return catalog;
  }

  /**
   * Resize overlay to target dimensions
   * This is the key function for the new pipeline approach
   */
  async resizeOverlay(overlayPath, targetWidth, targetHeight) {
    try {
      console.log(`🔄 Resizing overlay ${overlayPath} to ${targetWidth}x${targetHeight}`);
      
      const resizedBuffer = await Sharp(overlayPath)
        .resize(targetWidth, targetHeight, {
          fit: 'fill',  // Fill the entire target dimensions
          kernel: Sharp.kernel.lanczos3  // High-quality resampling
        })
        .png({ compressionLevel: 1 })
        .toBuffer();
      
      return resizedBuffer;
      
    } catch (error) {
      console.error(`❌ Error resizing overlay ${overlayPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get overlay path for effect type
   */
  getOverlayPath(effectType) {
    return path.join(this.baseDir, effectType, `${effectType}-master.png`);
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new StaticOverlayGenerator();
  
  generator.generateQualityOverlays()
    .then(() => generator.generateOverlayCatalog())
    .then(() => {
      console.log('🎉 Quality overlay generation complete!');
    })
    .catch(error => {
      console.error('💥 Generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = StaticOverlayGenerator;