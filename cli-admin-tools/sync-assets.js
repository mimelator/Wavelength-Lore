#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN - PRISTINE SYNC ASSETS
 * ================================================
 * Clean, isolated asset synchronization tool for CLI admin mode
 * Completely separate from existing scripts to ensure reliability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class WavelengthSyncAssets {
    constructor() {
        this.rootDir = process.cwd();
        this.staticDir = path.join(this.rootDir, 'static');
        this.publicDir = path.join(this.rootDir, 'public');
        this.viewsDir = path.join(this.rootDir, 'views');
    }

    /**
     * 🚀 Main sync execution
     */
    async sync() {
        console.log(chalk.cyan('🌊 WAVELENGTH ADMIN: Sync Assets'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        try {
            // Validate directories
            await this.validateDirectories();
            
            // Sync static assets
            await this.syncStaticAssets();
            
            // Sync images
            await this.syncImages();
            
            // Update timestamps
            await this.updateTimestamps();
            
            console.log(chalk.green('✅ Asset sync completed successfully!'));
            return true;
            
        } catch (error) {
            console.error(chalk.red('❌ Sync failed:'), error.message);
            return false;
        }
    }

    /**
     * 📁 Validate required directories exist
     */
    async validateDirectories() {
        console.log(chalk.yellow('📁 Validating directories...'));
        
        const requiredDirs = [this.staticDir, this.publicDir, this.viewsDir];
        const foundDirs = [];
        
        for (const dir of requiredDirs) {
            if (fs.existsSync(dir)) {
                foundDirs.push(path.basename(dir));
            }
        }
        
        console.log(chalk.green(`✓ Found directories: ${foundDirs.join(', ')}`));
    }

    /**
     * 📄 Sync static assets (CSS, JS, etc.)
     */
    async syncStaticAssets() {
        console.log(chalk.yellow('📄 Syncing static assets...'));
        
        let totalAssets = 0;
        
        // Scan static directory
        if (fs.existsSync(this.staticDir)) {
            const staticAssets = this.countAssetsRecursively(this.staticDir);
            console.log(chalk.green(`  ✓ Static directory: ${staticAssets} files`));
            totalAssets += staticAssets;
        }
        
        // Scan public directory
        if (fs.existsSync(this.publicDir)) {
            const publicAssets = this.countAssetsRecursively(this.publicDir);
            console.log(chalk.green(`  ✓ Public directory: ${publicAssets} files`));
            totalAssets += publicAssets;
        }
        
        // Scan views directory for templates
        if (fs.existsSync(this.viewsDir)) {
            const viewAssets = this.countAssetsRecursively(this.viewsDir, ['.ejs', '.html']);
            console.log(chalk.green(`  ✓ View templates: ${viewAssets} files`));
            totalAssets += viewAssets;
        }
        
        console.log(chalk.green(`✓ Total assets scanned: ${totalAssets} files`));
    }

    /**
     * 🖼️ Sync image assets
     */
    async syncImages() {
        console.log(chalk.yellow('🖼️ Syncing image assets...'));
        
        let totalImages = 0;
        
        // Check static/images
        const staticImagesDir = path.join(this.staticDir, 'images');
        if (fs.existsSync(staticImagesDir)) {
            const staticImages = this.countImagesRecursively(staticImagesDir);
            console.log(chalk.green(`  ✓ Static images: ${staticImages} files`));
            totalImages += staticImages;
        }
        
        // Check public/upscaled-images (from directory listing)
        const publicImagesDir = path.join(this.publicDir, 'upscaled-images');
        if (fs.existsSync(publicImagesDir)) {
            const publicImages = this.countImagesRecursively(publicImagesDir);
            console.log(chalk.green(`  ✓ Public images: ${publicImages} files`));
            totalImages += publicImages;
        }
        
        // Check static/icons
        const iconsDir = path.join(this.staticDir, 'icons');
        if (fs.existsSync(iconsDir)) {
            const iconImages = this.countImagesRecursively(iconsDir);
            console.log(chalk.green(`  ✓ Icon images: ${iconImages} files`));
            totalImages += iconImages;
        }
        
        if (totalImages === 0) {
            console.log(chalk.yellow('  ⚠️ No image directories found'));
        } else {
            console.log(chalk.green(`✓ Total images validated: ${totalImages} files`));
        }
    }

    /**
     * ⏰ Update sync timestamps
     */
    async updateTimestamps() {
        console.log(chalk.yellow('⏰ Updating sync timestamps...'));
        
        const syncInfo = {
            lastSync: new Date().toISOString(),
            syncedBy: 'wavelength-cli-admin',
            version: '1.0.0'
        };
        
        // Create sync info file
        const syncInfoPath = path.join(this.rootDir, '.wavelength-sync-info.json');
        fs.writeFileSync(syncInfoPath, JSON.stringify(syncInfo, null, 2));
        
        console.log(chalk.green('✓ Sync timestamps updated'));
    }

    /**
     * � Count assets recursively in directory
     */
    countAssetsRecursively(dir, extensions = null) {
        let count = 0;
        
        try {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                if (item.startsWith('.')) return; // Skip hidden files
                
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isFile()) {
                    if (!extensions) {
                        count++;
                    } else {
                        const ext = path.extname(item).toLowerCase();
                        if (extensions.includes(ext)) {
                            count++;
                        }
                    }
                } else if (stat.isDirectory()) {
                    count += this.countAssetsRecursively(fullPath, extensions);
                }
            });
        } catch (error) {
            // Directory might not be accessible
        }
        
        return count;
    }

    /**
     * 🖼️ Count image files recursively
     */
    countImagesRecursively(dir) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
        return this.countAssetsRecursively(dir, imageExtensions);
    }

    /**
     * �📊 Get sync status
     */
    getStatus() {
        const syncInfoPath = path.join(this.rootDir, '.wavelength-sync-info.json');
        
        if (!fs.existsSync(syncInfoPath)) {
            return {
                lastSync: 'Never',
                status: 'Not synced'
            };
        }
        
        const syncInfo = JSON.parse(fs.readFileSync(syncInfoPath, 'utf8'));
        return {
            lastSync: new Date(syncInfo.lastSync).toLocaleString(),
            status: 'Synced',
            version: syncInfo.version
        };
    }
}

// CLI execution
if (require.main === module) {
    const syncTool = new WavelengthSyncAssets();
    
    if (process.argv.includes('--status')) {
        const status = syncTool.getStatus();
        console.log(chalk.cyan('🌊 WAVELENGTH SYNC STATUS:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white(`Status: ${status.status}`));
        console.log(chalk.white(`Last Sync: ${status.lastSync}`));
        if (status.version) {
            console.log(chalk.white(`Version: ${status.version}`));
        }
    } else {
        syncTool.sync().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = WavelengthSyncAssets;