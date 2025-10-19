#!/usr/bin/env node

/**
 * Wavelength Lore - Comprehensive Image Optimization Script
 * 
 * This script optimizes all images across the site for better performance:
 * - Carousel images: Resize to 1200px width, 85% quality, WebP format
 * - Character portraits: Resize to 800px width, 90% quality, WebP format
 * - Episode images: Resize to 1200px width, 85% quality, WebP format
 * - Hero images: Resize to 1920px width, 80% quality, WebP format
 * 
 * Creates backups and provides detailed progress reporting.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SiteImageOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.staticDir = path.join(this.projectRoot, 'static', 'images');
    this.backupDir = path.join(this.projectRoot, 'image-backups');
    this.assetManager = path.join(this.projectRoot, 'scripts', 'asset-manager.js');
    
    this.stats = {
      totalProcessed: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      errors: []
    };

    // Optimization profiles for different image types
    this.profiles = {
      carousel: { width: 1200, quality: 85, format: 'webp' },
      character: { width: 800, quality: 90, format: 'webp' },
      episode: { width: 1200, quality: 85, format: 'webp' },
      hero: { width: 1920, quality: 80, format: 'webp' },
      thumbnail: { width: 400, quality: 85, format: 'webp' },
      default: { width: 1200, quality: 85, format: 'webp' }
    };
  }

  /**
   * Main optimization process
   */
  async optimize() {
    console.log('🎵 Wavelength Lore - Site-wide Image Optimization');
    console.log('================================================\n');

    try {
      // Create backup directory
      await this.createBackupDirectory();
      
      // Find all image directories
      const imageDirs = await this.findImageDirectories();
      
      console.log(`📊 Found ${imageDirs.length} image directories to process\n`);
      
      // Process each directory
      for (const dir of imageDirs) {
        await this.processDirectory(dir);
      }
      
      // Show final statistics
      this.showFinalStats();
      
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create backup directory structure
   */
  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Find all directories containing images
   */
  async findImageDirectories() {
    const dirs = [];
    
    const scanDirectory = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);
      let hasImages = false;
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, path.join(relativePath, item));
        } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
          hasImages = true;
        }
      }
      
      if (hasImages) {
        dirs.push(relativePath || '.');
      }
    };
    
    scanDirectory(this.staticDir);
    return dirs;
  }

  /**
   * Process a single directory
   */
  async processDirectory(dirPath) {
    const fullPath = path.join(this.staticDir, dirPath);
    const images = fs.readdirSync(fullPath).filter(file => 
      /\.(png|jpg|jpeg)$/i.test(file)
    );
    
    if (images.length === 0) return;
    
    console.log(`📂 Processing: ${dirPath} (${images.length} images)`);
    
    // Determine optimization profile
    const profile = this.getOptimizationProfile(dirPath);
    console.log(`   Profile: ${profile.width}px width, ${profile.quality}% quality, ${profile.format} format`);
    
    // Calculate sizes before optimization
    const sizeBefore = this.calculateDirectorySize(fullPath);
    this.stats.totalSizeBefore += sizeBefore;
    
    try {
      // Create backup
      await this.backupDirectory(dirPath, fullPath);
      
      // Optimize images
      await this.optimizeDirectory(dirPath, profile);
      
      // Calculate sizes after optimization
      const sizeAfter = this.calculateDirectorySize(fullPath);
      this.stats.totalSizeAfter += sizeAfter;
      this.stats.totalProcessed += images.length;
      
      const reduction = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
      console.log(`   ✅ Optimized ${images.length} images`);
      console.log(`   💾 Size: ${this.formatBytes(sizeBefore)} → ${this.formatBytes(sizeAfter)} (${reduction}% reduction)\n`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${dirPath}:`, error.message);
      this.stats.errors.push({ directory: dirPath, error: error.message });
    }
  }

  /**
   * Determine optimization profile based on directory path
   */
  getOptimizationProfile(dirPath) {
    if (dirPath.includes('carousel') || dirPath.includes('images')) {
      return this.profiles.carousel;
    } else if (dirPath.includes('characters')) {
      return this.profiles.character;
    } else if (dirPath.includes('episodes')) {
      return this.profiles.episode;
    } else if (dirPath.includes('hero') || dirPath.includes('season') && !dirPath.includes('episode')) {
      return this.profiles.hero;
    } else if (dirPath.includes('thumbnail')) {
      return this.profiles.thumbnail;
    } else {
      return this.profiles.default;
    }
  }

  /**
   * Backup directory before optimization
   */
  async backupDirectory(relativePath, fullPath) {
    const backupPath = path.join(this.backupDir, relativePath);
    
    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }
    
    // Copy directory structure and files
    await execAsync(`cp -r "${fullPath}" "${backupPath}"`);
  }

  /**
   * Optimize images in directory using asset-manager
   */
  async optimizeDirectory(relativePath, profile) {
    const target = relativePath === '.' ? '' : relativePath;
    
    // Step 1: Resize images
    if (profile.width) {
      await execAsync(`node "${this.assetManager}" update resize --target="${target}" --width=${profile.width}`);
    }
    
    // Step 2: Optimize quality
    if (profile.quality) {
      await execAsync(`node "${this.assetManager}" update quality --target="${target}" --quality=${profile.quality}`);
    }
    
    // Step 3: Convert format
    if (profile.format) {
      await execAsync(`node "${this.assetManager}" update format --target="${target}" --format=${profile.format}`);
    }
  }

  /**
   * Calculate total size of files in directory
   */
  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(file)) {
          totalSize += stat.size;
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return totalSize;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Show final optimization statistics
   */
  showFinalStats() {
    console.log('🎉 OPTIMIZATION COMPLETE!');
    console.log('========================\n');
    
    console.log(`📊 Statistics:`);
    console.log(`   Total Images: ${this.stats.totalProcessed}`);
    console.log(`   Size Before: ${this.formatBytes(this.stats.totalSizeBefore)}`);
    console.log(`   Size After: ${this.formatBytes(this.stats.totalSizeAfter)}`);
    
    if (this.stats.totalSizeBefore > 0) {
      const totalReduction = ((this.stats.totalSizeBefore - this.stats.totalSizeAfter) / this.stats.totalSizeBefore * 100).toFixed(1);
      const savedSpace = this.stats.totalSizeBefore - this.stats.totalSizeAfter;
      console.log(`   Space Saved: ${this.formatBytes(savedSpace)} (${totalReduction}% reduction)`);
    }
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.stats.errors.forEach(error => {
        console.log(`   ${error.directory}: ${error.error}`);
      });
    }
    
    console.log(`\n💾 Backups stored in: ${this.backupDir}`);
    console.log(`🔄 Consider running: ./asset-manager.js sync --force`);
    console.log(`\n🚀 Your site images are now optimized for maximum performance!`);
  }
}

// Safety check and confirmation
async function confirmOptimization() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🚨 This will optimize ALL 800+ images on your site. Backups will be created. Continue? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main execution
async function main() {
  const confirmed = await confirmOptimization();
  
  if (!confirmed) {
    console.log('❌ Optimization cancelled');
    process.exit(0);
  }
  
  const optimizer = new SiteImageOptimizer();
  await optimizer.optimize();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SiteImageOptimizer;