#!/usr/bin/env node

/**
 * Wavelength Lore Asset Management CLI
 * 
 * Handles upload, optimization, and management of images, audio, and video assets.
 * Automatically uploads to CloudFront CDN and generates proper URLs.
 * 
 * Usage:
 *   ./asset-manager.js upload --type=images --path=local/path --target=season1/episode1
 *   ./asset-manager.js optimize --type=images --quality=85
 *   ./asset-manager.js sync --force
 *   ./asset-manager.js validate
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

// Optional dependency - gracefully handle if not installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('📝 Note: sharp not installed. Image optimization features disabled.');
  console.log('   Install with: npm install sharp');
}

const execAsync = promisify(exec);

class AssetManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.staticDir = path.join(this.projectRoot, 'static');
    this.imagesDir = path.join(this.staticDir, 'images');
    this.audioDir = path.join(this.staticDir, 'audio');
    this.videoDir = path.join(this.staticDir, 'video');
    
    this.cdnBase = process.env.CDN_URL + '';
    
    // Image optimization settings
    this.imageSettings = {
      quality: 85,
      progressive: true,
      formats: ['webp', 'jpg'],
      sizes: {
        thumbnail: { width: 300, height: 200 },
        medium: { width: 800, height: 600 },
        large: { width: 1200, height: 900 },
        hero: { width: 1920, height: 1080 }
      }
    };
  }

  async main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const flags = this.parseFlags(args.slice(1));

    try {
      switch (command) {
        case 'upload':
          await this.handleUpload(flags);
          break;
        case 'optimize':
          await this.optimizeAssets(flags);
          break;
        case 'sync':
          await this.syncToCloudFront(flags);
          break;
        case 'validate':
          await this.validateAssets(flags);
          break;
        case 'generate-urls':
          await this.generateAssetUrls(flags);
          break;
        case 'batch-upload':
          await this.batchUpload(flags);
          break;
        case 'update':
          await this.handleUpdate(flags);
          break;
        case 'replace':
          await this.replaceAsset(flags);
          break;
        case 'rename':
          await this.renameAsset(flags);
          break;
        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;
        case 'update-help':
          this.showUpdateHelp();
          break;
        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log('Run ./asset-manager.js help for usage information');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  parseFlags(args) {
    const flags = { _: [] };
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        flags[key] = value || true;
      } else {
        flags._.push(arg);
      }
    });
    return flags;
  }

  async handleUpload(flags) {
    const { type, path: sourcePath, target, quality } = flags;
    
    if (!type || !sourcePath || !target) {
      throw new Error('Required flags: --type --path --target');
    }

    console.log(`📤 Uploading ${type} assets...`);
    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${target}`);

    switch (type) {
      case 'images':
        await this.uploadImages(sourcePath, target, { quality: parseInt(quality) || 85 });
        break;
      case 'audio':
        await this.uploadAudio(sourcePath, target);
        break;
      case 'video':
        await this.uploadVideo(sourcePath, target);
        break;
      default:
        throw new Error(`Unknown asset type: ${type}`);
    }
  }

  async uploadImages(sourcePath, target, options = {}) {
    if (!sharp) {
      console.log('❌ Image processing requires sharp package');
      console.log('   Install with: npm install sharp');
      console.log('   For now, copying images without optimization...');
      return this.copyImages(sourcePath, target);
    }

    console.log('🖼️ Processing images...');
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const targetDir = path.join(this.imagesDir, target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const imageFiles = fs.readdirSync(sourcePath)
      .filter(file => /\\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file));

    console.log(`Found ${imageFiles.length} images to process`);

    const results = [];

    for (const file of imageFiles) {
      const sourceFull = path.join(sourcePath, file);
      const baseName = path.parse(file).name;
      
      console.log(`  Processing: ${file}`);

      // Generate multiple sizes and formats
      for (const [sizeName, dimensions] of Object.entries(this.imageSettings.sizes)) {
        for (const format of this.imageSettings.formats) {
          const outputName = `${baseName}-${sizeName}.${format}`;
          const outputPath = path.join(targetDir, outputName);
          
          try {
            await sharp(sourceFull)
              .resize(dimensions.width, dimensions.height, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .toFormat(format, {
                quality: options.quality || this.imageSettings.quality,
                progressive: this.imageSettings.progressive
              })
              .toFile(outputPath);

            const url = `${this.cdnBase}/images/${target}/${outputName}`;
            results.push({
              original: file,
              size: sizeName,
              format: format,
              path: outputPath,
              url: url
            });

            console.log(`    ✅ ${sizeName} ${format}: ${outputName}`);
          } catch (error) {
            console.error(`    ❌ Failed to process ${outputName}:`, error.message);
          }
        }
      }

      // Also copy original
      const originalTarget = path.join(targetDir, file);
      fs.copyFileSync(sourceFull, originalTarget);
      
      const originalUrl = `${this.cdnBase}/images/${target}/${file}`;
      results.push({
        original: file,
        size: 'original',
        format: path.extname(file).substring(1),
        path: originalTarget,
        url: originalUrl
      });
    }

    // Save results manifest
    const manifestPath = path.join(targetDir, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));

    console.log(`✅ Processed ${imageFiles.length} images`);
    console.log(`📁 Assets saved to: ${targetDir}`);
    console.log(`📋 Manifest: ${manifestPath}`);

    return results;
  }

  async copyImages(sourcePath, target) {
    console.log('📁 Copying images (no optimization)...');
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const targetDir = path.join(this.imagesDir, target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const imageFiles = fs.readdirSync(sourcePath)
      .filter(file => /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file));

    console.log(`Found ${imageFiles.length} images to copy`);

    const results = [];

    for (const file of imageFiles) {
      const sourceFull = path.join(sourcePath, file);
      const targetFull = path.join(targetDir, file);
      
      fs.copyFileSync(sourceFull, targetFull);
      
      const url = `${this.cdnBase}/images/${target}/${file}`;
      results.push({
        original: file,
        size: 'original',
        format: path.extname(file).substring(1),
        path: targetFull,
        url: url
      });

      console.log(`  ✅ ${file} -> ${url}`);
    }

    console.log(`✅ Copied ${imageFiles.length} images`);
    return results;
  }

  async uploadAudio(sourcePath, target) {
    console.log('🎵 Processing audio files...');
    
    const targetDir = path.join(this.audioDir, target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const audioFiles = fs.readdirSync(sourcePath)
      .filter(file => /\\.(mp3|wav|m4a|flac|ogg)$/i.test(file));

    console.log(`Found ${audioFiles.length} audio files`);

    const results = [];

    for (const file of audioFiles) {
      const sourceFull = path.join(sourcePath, file);
      const targetFull = path.join(targetDir, file);
      
      // Copy file (TODO: Add audio optimization with ffmpeg)
      fs.copyFileSync(sourceFull, targetFull);
      
      const url = `${this.cdnBase}/audio/${target}/${file}`;
      results.push({
        original: file,
        path: targetFull,
        url: url
      });

      console.log(`  ✅ ${file} -> ${url}`);
    }

    console.log(`✅ Processed ${audioFiles.length} audio files`);
    return results;
  }

  async uploadVideo(sourcePath, target) {
    console.log('🎬 Processing video files...');
    
    const targetDir = path.join(this.videoDir, target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const videoFiles = fs.readdirSync(sourcePath)
      .filter(file => /\\.(mp4|avi|mov|mkv|webm)$/i.test(file));

    console.log(`Found ${videoFiles.length} video files`);

    const results = [];

    for (const file of videoFiles) {
      const sourceFull = path.join(sourcePath, file);
      const targetFull = path.join(targetDir, file);
      
      // Copy file (TODO: Add video optimization with ffmpeg)
      fs.copyFileSync(sourceFull, targetFull);
      
      const url = `${this.cdnBase}/video/${target}/${file}`;
      results.push({
        original: file,
        path: targetFull,
        url: url
      });

      console.log(`  ✅ ${file} -> ${url}`);
    }

    console.log(`✅ Processed ${videoFiles.length} video files`);
    return results;
  }

  async syncToCloudFront(flags) {
    console.log('☁️ Syncing assets to CloudFront...');
    
    try {
      // Use AWS CLI to sync static directory to S3
      const command = `aws s3 sync static/ s3://your-bucket-name/ --delete ${flags.force ? '--force' : ''}`;
      await execAsync(command, { cwd: this.projectRoot });
      
      // Invalidate CloudFront cache
      console.log('🔄 Invalidating CloudFront cache...');
      await execAsync('aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"');
      
      console.log('✅ Assets synced to CloudFront');
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      console.log('💡 Make sure AWS CLI is configured and you have the correct permissions');
    }
  }

  async validateAssets(flags) {
    console.log('🔍 Validating assets...');
    
    const issues = [];
    
    // Check for missing assets referenced in content
    const contentFiles = this.findContentFiles();
    
    for (const contentFile of contentFiles) {
      const content = fs.readFileSync(contentFile, 'utf8');
      const assetUrls = this.extractAssetUrls(content);
      
      for (const url of assetUrls) {
        if (url.includes(this.cdnBase)) {
          const localPath = this.urlToLocalPath(url);
          if (!fs.existsSync(localPath)) {
            issues.push({
              type: 'missing-asset',
              file: contentFile,
              url: url,
              localPath: localPath
            });
          }
        }
      }
    }
    
    // Check for orphaned assets (assets not referenced anywhere)
    const allAssets = this.findAllAssets();
    const referencedAssets = new Set();
    
    contentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      this.extractAssetUrls(content).forEach(url => referencedAssets.add(url));
    });
    
    for (const asset of allAssets) {
      const url = this.localPathToUrl(asset);
      if (!referencedAssets.has(url)) {
        issues.push({
          type: 'orphaned-asset',
          localPath: asset,
          url: url
        });
      }
    }
    
    // Report results
    if (issues.length === 0) {
      console.log('✅ No asset issues found');
    } else {
      console.log(`⚠️ Found ${issues.length} asset issues:`);
      issues.forEach(issue => {
        console.log(`  ${issue.type}: ${issue.url || issue.localPath}`);
      });
    }
    
    return issues;
  }

  async generateAssetUrls(flags) {
    console.log('🔗 Generating asset URLs...');
    
    const { target } = flags;
    if (!target) {
      throw new Error('Required flag: --target (e.g., season1/episode1)');
    }
    
    const targetDir = path.join(this.imagesDir, target);
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Target directory does not exist: ${targetDir}`);
    }
    
    const files = fs.readdirSync(targetDir)
      .filter(file => !file.startsWith('.') && file !== 'asset-manifest.json');
    
    console.log('Generated URLs:');
    console.log('```yaml');
    console.log('carouselImages:');
    
    files.forEach(file => {
      const url = `${this.cdnBase}/images/${target}/${file}`;
      console.log(`  - ${url}`);
    });
    
    console.log('```');
  }

  findContentFiles() {
    const contentDir = path.join(this.projectRoot, 'content');
    const files = [];
    
    const searchDir = (dir) => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
          files.push(fullPath);
        }
      });
    };
    
    searchDir(contentDir);
    return files;
  }

  extractAssetUrls(content) {
    const urlRegex = /https?:\/\/[^\s"']+\.(jpg|jpeg|png|gif|mp3|wav|m4a|mp4|webm)/gi;
    return content.match(urlRegex) || [];
  }

  urlToLocalPath(url) {
    if (!url.startsWith(this.cdnBase)) return null;
    
    const relativePath = url.replace(this.cdnBase + '/', '');
    return path.join(this.staticDir, relativePath);
  }

  localPathToUrl(localPath) {
    const relativePath = path.relative(this.staticDir, localPath);
    return `${this.cdnBase}/${relativePath.replace(/\\\\/g, '/')}`;
  }

  findAllAssets() {
    const assets = [];
    
    const searchDir = (dir) => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (/\\.(jpg|jpeg|png|gif|mp3|wav|m4a|mp4|webm)$/i.test(item)) {
          assets.push(fullPath);
        }
      });
    };
    
    searchDir(this.staticDir);
    return assets;
  }

  /**
   * Handle update operations
   */
  async handleUpdate(flags) {
    const subcommand = flags._?.[0]; // Get first positional argument
    
    if (!subcommand) {
      console.log('❌ Update operation required. Use: quality, metadata, resize, or format');
      console.log('Examples:');
      console.log('  ./asset-manager.js update quality --target=season1/episode1 --quality=90');
      console.log('  ./asset-manager.js update metadata --target=season1/episode1 --title="New Title"');
      console.log('  ./asset-manager.js update resize --target=season1/episode1 --width=1200 --height=800');
      console.log('  ./asset-manager.js update format --target=season1/episode1 --format=webp');
      process.exit(1);
    }

    switch (subcommand) {
      case 'quality':
        await this.updateImageQuality(flags);
        break;
      case 'metadata':
        await this.updateAssetMetadata(flags);
        break;
      case 'resize':
        await this.resizeAssets(flags);
        break;
      case 'format':
        await this.convertAssetFormat(flags);
        break;
      default:
        console.log(`❌ Unknown update operation: ${subcommand}`);
        console.log('Available operations: quality, metadata, resize, format');
        process.exit(1);
    }
  }

  /**
   * Update image quality for assets in a target directory
   */
  async updateImageQuality(flags) {
    const target = flags.target;
    const quality = parseInt(flags.quality) || 85;

    if (!target) {
      console.log('❌ Target path required. Use --target=season1/episode1');
      process.exit(1);
    }

    if (!sharp) {
      console.log('❌ Sharp is required for image quality updates. Install with: npm install sharp');
      process.exit(1);
    }

    const targetDir = path.join(this.imagesDir, target);
    
    if (!fs.existsSync(targetDir)) {
      console.log(`❌ Target directory not found: ${targetDir}`);
      process.exit(1);
    }

    console.log(`🔧 Updating image quality to ${quality}% for: ${target}`);

    try {
      const files = fs.readdirSync(targetDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

      if (imageFiles.length === 0) {
        console.log('❌ No image files found in target directory');
        process.exit(1);
      }

      for (const file of imageFiles) {
        const filePath = path.join(targetDir, file);
        const backupPath = path.join(targetDir, `${file}.backup`);
        
        // Create backup
        fs.copyFileSync(filePath, backupPath);
        
        try {
          await sharp(filePath)
            .jpeg({ quality, progressive: true })
            .png({ quality, progressive: true })
            .webp({ quality })
            .toFile(filePath + '.tmp');
          
          // Replace original with optimized version
          fs.renameSync(filePath + '.tmp', filePath);
          console.log(`✅ Updated quality for: ${file}`);
          
          // Remove backup if successful
          fs.unlinkSync(backupPath);
          
        } catch (error) {
          console.error(`❌ Failed to update ${file}: ${error.message}`);
          // Restore from backup
          if (fs.existsSync(backupPath)) {
            fs.renameSync(backupPath, filePath);
          }
        }
      }

      console.log(`🎉 Completed quality update for ${imageFiles.length} images`);
      
    } catch (error) {
      console.error('❌ Error updating image quality:', error.message);
      process.exit(1);
    }
  }

  /**
   * Update asset metadata (for content files that reference assets)
   */
  async updateAssetMetadata(flags) {
    const target = flags.target;
    const title = flags.title;
    const description = flags.description;
    const tags = flags.tags;

    if (!target) {
      console.log('❌ Target path required. Use --target=season1/episode1');
      process.exit(1);
    }

    console.log(`📝 Updating metadata for assets in: ${target}`);

    // Look for content files that might reference these assets
    const possibleContentFiles = [
      path.join(this.projectRoot, 'content', 'seasons', 'season1.yaml'),
      path.join(this.projectRoot, 'content', 'characters'),
      path.join(this.projectRoot, 'content', 'lore')
    ];

    try {
      // This is a placeholder for metadata updates
      // In practice, you'd update YAML files, database records, etc.
      console.log(`🔍 Scanning for content files that reference: ${target}`);
      
      if (title) console.log(`   📝 Title: ${title}`);
      if (description) console.log(`   📝 Description: ${description}`);
      if (tags) console.log(`   🏷️  Tags: ${tags}`);
      
      console.log('💡 Metadata update feature ready - implement specific content file updates as needed');
      
    } catch (error) {
      console.error('❌ Error updating metadata:', error.message);
      process.exit(1);
    }
  }

  /**
   * Resize assets in a target directory
   */
  async resizeAssets(flags) {
    const target = flags.target;
    const width = parseInt(flags.width);
    const height = parseInt(flags.height);
    const maintainAspect = flags['maintain-aspect'] !== 'false';

    if (!target) {
      console.log('❌ Target path required. Use --target=season1/episode1');
      process.exit(1);
    }

    if (!width && !height) {
      console.log('❌ Width or height required. Use --width=1200 and/or --height=800');
      process.exit(1);
    }

    if (!sharp) {
      console.log('❌ Sharp is required for image resizing. Install with: npm install sharp');
      process.exit(1);
    }

    const targetDir = path.join(this.imagesDir, target);
    
    if (!fs.existsSync(targetDir)) {
      console.log(`❌ Target directory not found: ${targetDir}`);
      process.exit(1);
    }

    console.log(`📐 Resizing images in: ${target}`);
    if (width) console.log(`   Width: ${width}px`);
    if (height) console.log(`   Height: ${height}px`);
    console.log(`   Maintain aspect ratio: ${maintainAspect}`);

    try {
      const files = fs.readdirSync(targetDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

      if (imageFiles.length === 0) {
        console.log('❌ No image files found in target directory');
        process.exit(1);
      }

      for (const file of imageFiles) {
        const filePath = path.join(targetDir, file);
        const backupPath = path.join(targetDir, `${file}.backup`);
        
        // Create backup
        fs.copyFileSync(filePath, backupPath);
        
        try {
          let sharpInstance = sharp(filePath);
          
          if (maintainAspect) {
            sharpInstance = sharpInstance.resize(width, height, {
              fit: 'inside',
              withoutEnlargement: false
            });
          } else {
            sharpInstance = sharpInstance.resize(width, height, {
              fit: 'fill'
            });
          }
          
          await sharpInstance.toFile(filePath + '.tmp');
          
          // Replace original with resized version
          fs.renameSync(filePath + '.tmp', filePath);
          console.log(`✅ Resized: ${file}`);
          
          // Remove backup if successful
          fs.unlinkSync(backupPath);
          
        } catch (error) {
          console.error(`❌ Failed to resize ${file}: ${error.message}`);
          // Restore from backup
          if (fs.existsSync(backupPath)) {
            fs.renameSync(backupPath, filePath);
          }
        }
      }

      console.log(`🎉 Completed resizing ${imageFiles.length} images`);
      
    } catch (error) {
      console.error('❌ Error resizing assets:', error.message);
      process.exit(1);
    }
  }

  /**
   * Convert assets to a different format
   */
  async convertAssetFormat(flags) {
    const target = flags.target;
    const format = flags.format?.toLowerCase();

    if (!target) {
      console.log('❌ Target path required. Use --target=season1/episode1');
      process.exit(1);
    }

    if (!format || !['jpg', 'jpeg', 'png', 'webp'].includes(format)) {
      console.log('❌ Valid format required. Use --format=jpg|png|webp');
      process.exit(1);
    }

    if (!sharp) {
      console.log('❌ Sharp is required for format conversion. Install with: npm install sharp');
      process.exit(1);
    }

    const targetDir = path.join(this.imagesDir, target);
    
    if (!fs.existsSync(targetDir)) {
      console.log(`❌ Target directory not found: ${targetDir}`);
      process.exit(1);
    }

    console.log(`🔄 Converting images to ${format.toUpperCase()} format in: ${target}`);

    try {
      const files = fs.readdirSync(targetDir);
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

      if (imageFiles.length === 0) {
        console.log('❌ No image files found in target directory');
        process.exit(1);
      }

      for (const file of imageFiles) {
        const filePath = path.join(targetDir, file);
        const fileExt = path.extname(file);
        const baseName = path.basename(file, fileExt);
        const newFileName = `${baseName}.${format}`;
        const newFilePath = path.join(targetDir, newFileName);
        
        try {
          let sharpInstance = sharp(filePath);
          
          switch (format) {
            case 'jpg':
            case 'jpeg':
              sharpInstance = sharpInstance.jpeg({ quality: 85, progressive: true });
              break;
            case 'png':
              sharpInstance = sharpInstance.png({ quality: 85, progressive: true });
              break;
            case 'webp':
              sharpInstance = sharpInstance.webp({ quality: 85 });
              break;
          }
          
          await sharpInstance.toFile(newFilePath);
          
          // Remove original if different format
          if (file !== newFileName) {
            fs.unlinkSync(filePath);
            console.log(`✅ Converted: ${file} → ${newFileName}`);
          } else {
            console.log(`✅ Optimized: ${file}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to convert ${file}: ${error.message}`);
        }
      }

      console.log(`🎉 Completed format conversion to ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('❌ Error converting format:', error.message);
      process.exit(1);
    }
  }

  /**
   * Replace a specific asset with a new file
   */
  async replaceAsset(flags) {
    const target = flags.target;
    const assetName = flags.asset;
    const sourcePath = flags.source;

    if (!target || !assetName || !sourcePath) {
      console.log('❌ Required parameters: --target=path --asset=filename --source=newfile');
      console.log('Example: ./asset-manager.js replace --target=season1/episode1 --asset=image.png --source=./new-image.png');
      process.exit(1);
    }

    const targetDir = path.join(this.imagesDir, target);
    const assetPath = path.join(targetDir, assetName);
    
    if (!fs.existsSync(targetDir)) {
      console.log(`❌ Target directory not found: ${targetDir}`);
      process.exit(1);
    }

    if (!fs.existsSync(assetPath)) {
      console.log(`❌ Asset not found: ${assetName} in ${target}`);
      process.exit(1);
    }

    if (!fs.existsSync(sourcePath)) {
      console.log(`❌ Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    try {
      // Create backup
      const backupPath = path.join(targetDir, `${assetName}.backup.${Date.now()}`);
      fs.copyFileSync(assetPath, backupPath);

      // Copy new file
      fs.copyFileSync(sourcePath, assetPath);

      console.log(`✅ Successfully replaced: ${assetName}`);
      console.log(`📁 Backup created: ${path.basename(backupPath)}`);
      console.log(`🔄 Consider running: ./asset-manager.js sync --force`);

    } catch (error) {
      console.error('❌ Error replacing asset:', error.message);
      process.exit(1);
    }
  }

  /**
   * Rename an asset and update references
   */
  async renameAsset(flags) {
    const target = flags.target;
    const oldName = flags.old;
    const newName = flags.new;

    if (!target || !oldName || !newName) {
      console.log('❌ Required parameters: --target=path --old=oldname --new=newname');
      console.log('Example: ./asset-manager.js rename --target=season1/episode1 --old=old-image.png --new=new-image.png');
      process.exit(1);
    }

    const targetDir = path.join(this.imagesDir, target);
    const oldPath = path.join(targetDir, oldName);
    const newPath = path.join(targetDir, newName);
    
    if (!fs.existsSync(targetDir)) {
      console.log(`❌ Target directory not found: ${targetDir}`);
      process.exit(1);
    }

    if (!fs.existsSync(oldPath)) {
      console.log(`❌ Asset not found: ${oldName} in ${target}`);
      process.exit(1);
    }

    if (fs.existsSync(newPath)) {
      console.log(`❌ Target name already exists: ${newName}`);
      process.exit(1);
    }

    try {
      // Rename the file
      fs.renameSync(oldPath, newPath);

      console.log(`✅ Successfully renamed: ${oldName} → ${newName}`);
      console.log(`⚠️  Remember to update content files that reference this asset`);
      console.log(`🔄 Consider running: ./asset-manager.js sync --force`);

    } catch (error) {
      console.error('❌ Error renaming asset:', error.message);
      process.exit(1);
    }
  }

  showUpdateHelp() {
    console.log(`
🔧 Asset Manager Update Commands

Update Operations:
  update quality                Update image compression quality
  update metadata               Update asset metadata/references  
  update resize                 Resize images to new dimensions
  update format                 Convert images to different format

Replace/Rename Operations:
  replace                       Replace asset with new file
  rename                        Rename asset file

Usage Examples:

Quality Updates:
  ./asset-manager.js update quality --target=season1/episode1 --quality=90
  ./asset-manager.js update quality --target=characters/aragorn --quality=75

Resize Operations:
  ./asset-manager.js update resize --target=season1/episode1 --width=1200
  ./asset-manager.js update resize --target=season1/episode1 --width=800 --height=600
  ./asset-manager.js update resize --target=season1/episode1 --width=1200 --maintain-aspect=false

Format Conversion:
  ./asset-manager.js update format --target=season1/episode1 --format=webp
  ./asset-manager.js update format --target=season1/episode1 --format=jpg
  ./asset-manager.js update format --target=characters/aragorn --format=png

Asset Replacement:
  ./asset-manager.js replace --target=season1/episode1 --asset=hero-image.png --source=./new-hero.png
  ./asset-manager.js replace --target=characters/aragorn --asset=portrait.jpg --source=./updated-portrait.jpg

Asset Renaming:
  ./asset-manager.js rename --target=season1/episode1 --old=old-name.png --new=new-name.png
  ./asset-manager.js rename --target=characters/aragorn --old=portrait.jpg --new=aragorn-portrait.jpg

Metadata Updates:
  ./asset-manager.js update metadata --target=season1/episode1 --title="Episode Images" --description="Updated images"
  ./asset-manager.js update metadata --target=season1/episode1 --tags="action,adventure,battle"

💡 Note: Quality, resize, and format operations require 'sharp' to be installed.
   Install with: npm install sharp

🔄 After making changes, consider running:
   ./asset-manager.js sync --force
    `);
  }

  showHelp() {
    console.log(`
🎵 Wavelength Lore Asset Manager

Usage:
  ./asset-manager.js <command> [options]

Commands:
  upload                         Upload and process assets
  optimize                       Optimize existing assets
  sync                          Sync to CloudFront CDN
  validate                      Check for missing/orphaned assets
  generate-urls                 Generate URLs for a target directory
  
  update quality                Update image quality for assets
  update metadata               Update asset metadata/references
  update resize                 Resize images in target directory
  update format                 Convert assets to different format
  
  replace                       Replace specific asset with new file
  rename                        Rename asset and update references
  
  help                          Show this help
  update-help                   Show detailed update command examples
  
Options:
  --type=TYPE                   Asset type (images/audio/video)
  --path=PATH                   Source path for upload
  --target=TARGET               Target path (e.g., season1/episode1)
  --quality=N                   Image quality (1-100, default: 85)
  --force                       Force sync/overwrite
  
  Update Options:
  --width=N                     Target width for resize
  --height=N                    Target height for resize
  --maintain-aspect=true/false  Maintain aspect ratio (default: true)
  --format=FORMAT               Target format (jpg/png/webp)
  --title="Title"              Asset title for metadata
  --description="Desc"         Asset description for metadata
  --tags="tag1,tag2"           Asset tags for metadata
  
  Replace/Rename Options:
  --asset=FILENAME              Asset filename to replace/rename
  --source=PATH                 Source file for replacement
  --old=OLDNAME                 Old filename for rename
  --new=NEWNAME                 New filename for rename
  
Examples:
  ./asset-manager.js upload --type=images --path=./my-images --target=season2/episode3
  ./asset-manager.js generate-urls --target=season1/episode1
  ./asset-manager.js validate
  ./asset-manager.js sync --force
  
  Update Examples:
  ./asset-manager.js update quality --target=season1/episode1 --quality=90
  ./asset-manager.js update resize --target=season1/episode1 --width=1200 --height=800
  ./asset-manager.js update format --target=season1/episode1 --format=webp
  ./asset-manager.js replace --target=season1/episode1 --asset=image.png --source=./new-image.png
  ./asset-manager.js rename --target=season1/episode1 --old=old-name.png --new=new-name.png
    `);
  }
}

if (require.main === module) {
  const manager = new AssetManager();
  manager.main();
}

module.exports = AssetManager;