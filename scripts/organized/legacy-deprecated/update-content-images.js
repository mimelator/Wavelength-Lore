#!/usr/bin/env node

/**
 * Wavelength Lore - Content Image References Updater
 * 
 * Updates all content files to use the new optimized WebP images
 * instead of the original PNG/JPG references.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ContentImageUpdater {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.contentDir = path.join(this.projectRoot, 'content');
    this.staticDir = path.join(this.projectRoot, 'static', 'images');
    
    this.stats = {
      filesProcessed: 0,
      referencesUpdated: 0,
      errors: []
    };
  }

  /**
   * Main update process
   */
  async updateAllContent() {
    console.log('🎵 Wavelength Lore - Content Image References Update');
    console.log('===================================================\n');

    try {
      // Find all YAML files with image references
      const contentFiles = this.findContentFiles();
      
      console.log(`📋 Found ${contentFiles.length} content files to process\n`);
      
      // Process each file
      for (const filePath of contentFiles) {
        await this.processContentFile(filePath);
      }
      
      // Show final statistics
      this.showFinalStats();
      
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find all YAML content files that contain image references
   */
  findContentFiles() {
    const files = [];
    
    const scanDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
          // Check if file contains image references
          const content = fs.readFileSync(fullPath, 'utf8');
          if (/\.(png|jpg|jpeg)/i.test(content)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    scanDirectory(this.contentDir);
    return files;
  }

  /**
   * Process a single content file
   */
  async processContentFile(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    console.log(`📝 Processing: ${relativePath}`);
    
    try {
      // Read and parse YAML
      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Update image references
      let updatedContent = this.updateImageReferences(content);
      
      // Count changes
      const changes = this.countChanges(originalContent, updatedContent);
      
      if (changes > 0) {
        // Create backup
        const backupPath = filePath + `.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);
        
        // Write updated content
        fs.writeFileSync(filePath, updatedContent);
        
        console.log(`   ✅ Updated ${changes} image references`);
        console.log(`   💾 Backup: ${path.basename(backupPath)}`);
        
        this.stats.referencesUpdated += changes;
      } else {
        console.log(`   ℹ️  No updates needed`);
      }
      
      this.stats.filesProcessed++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${relativePath}:`, error.message);
      this.stats.errors.push({ file: relativePath, error: error.message });
    }
    
    console.log('');
  }

  /**
   * Update image references in content string
   */
  updateImageReferences(content) {
    // Replace PNG references with WebP
    content = content.replace(/\.png/gi, '.webp');
    
    // Replace JPG/JPEG references with WebP
    content = content.replace(/\.jpe?g/gi, '.webp');
    
    return content;
  }

  /**
   * Count the number of changes made
   */
  countChanges(original, updated) {
    const originalRefs = (original.match(/\.(png|jpe?g)/gi) || []).length;
    const updatedRefs = (updated.match(/\.(png|jpe?g)/gi) || []).length;
    return originalRefs - updatedRefs;
  }

  /**
   * Verify that referenced WebP files exist
   */
  verifyImageExists(imagePath) {
    // Convert URL to local path
    let localPath = imagePath;
    
    // Handle CloudFront URLs
    if (imagePath.includes('cloudfront.net')) {
      localPath = imagePath.split('/images/')[1];
    }
    
    // Handle localhost URLs
    if (imagePath.includes('localhost:3001')) {
      localPath = imagePath.split('/images/')[1];
    }
    
    if (localPath) {
      const fullPath = path.join(this.staticDir, localPath);
      return fs.existsSync(fullPath);
    }
    
    return false;
  }

  /**
   * Show final statistics
   */
  showFinalStats() {
    console.log('🎉 CONTENT UPDATE COMPLETE!');
    console.log('===========================\n');
    
    console.log(`📊 Statistics:`);
    console.log(`   Files Processed: ${this.stats.filesProcessed}`);
    console.log(`   References Updated: ${this.stats.referencesUpdated}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.stats.errors.forEach(error => {
        console.log(`   ${error.file}: ${error.error}`);
      });
    }
    
    console.log(`\n✅ All content files now reference optimized WebP images!`);
    console.log(`🔄 Consider testing your site to ensure all images load correctly`);
    console.log(`💾 Backups of original files created with .backup timestamps`);
  }
}

// Main execution
async function main() {
  const updater = new ContentImageUpdater();
  await updater.updateAllContent();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ContentImageUpdater;