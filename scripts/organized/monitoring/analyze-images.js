#!/usr/bin/env node

/**
 * Image Optimization Analysis - Preview what will be optimized
 */

const fs = require('fs');
const path = require('path');

class ImageAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.staticDir = path.join(this.projectRoot, 'static', 'images');
    this.totalSize = 0;
    this.totalFiles = 0;
    this.categories = {};
  }

  analyze() {
    console.log('🔍 Wavelength Lore - Image Analysis Report');
    console.log('==========================================\n');

    this.scanDirectory(this.staticDir);
    this.showReport();
  }

  scanDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, path.join(relativePath, item));
      } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
        this.analyzeFile(fullPath, relativePath, item, stat.size);
      }
    }
  }

  analyzeFile(filePath, dirPath, fileName, size) {
    this.totalSize += size;
    this.totalFiles++;

    // Categorize by path
    let category = 'Other';
    if (dirPath.includes('season') && dirPath.includes('episode')) {
      category = 'Episode Images';
    } else if (dirPath.includes('character')) {
      category = 'Character Images';
    } else if (dirPath.includes('season') && !dirPath.includes('episode')) {
      category = 'Season Images';
    } else if (dirPath.includes('carousel') || dirPath.includes('images')) {
      category = 'Carousel Images';
    }

    if (!this.categories[category]) {
      this.categories[category] = { count: 0, size: 0, examples: [] };
    }

    this.categories[category].count++;
    this.categories[category].size += size;
    
    if (this.categories[category].examples.length < 3) {
      this.categories[category].examples.push({
        path: path.join(dirPath, fileName),
        size: this.formatBytes(size)
      });
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showReport() {
    console.log(`📊 Overall Statistics:`);
    console.log(`   Total Images: ${this.totalFiles}`);
    console.log(`   Total Size: ${this.formatBytes(this.totalSize)}`);
    console.log(`   Average Size: ${this.formatBytes(this.totalSize / this.totalFiles)}\n`);

    console.log(`📂 By Category:`);
    for (const [category, data] of Object.entries(this.categories)) {
      console.log(`   ${category}:`);
      console.log(`     Count: ${data.count} files`);
      console.log(`     Size: ${this.formatBytes(data.size)}`);
      console.log(`     Average: ${this.formatBytes(data.size / data.count)}`);
      console.log(`     Examples:`);
      data.examples.forEach(example => {
        console.log(`       ${example.path} (${example.size})`);
      });
      console.log('');
    }

    // Estimated savings
    const estimatedSavings = this.totalSize * 0.75; // Conservative 75% reduction
    console.log(`💡 Optimization Preview:`);
    console.log(`   Current Size: ${this.formatBytes(this.totalSize)}`);
    console.log(`   Estimated After: ${this.formatBytes(this.totalSize - estimatedSavings)}`);
    console.log(`   Estimated Savings: ${this.formatBytes(estimatedSavings)} (75% reduction)`);
    console.log(`   
🚀 Benefits after optimization:
   • Faster page load times
   • Reduced bandwidth usage
   • Better mobile performance  
   • Improved SEO scores
   • Lower hosting costs`);
  }
}

const analyzer = new ImageAnalyzer();
analyzer.analyze();