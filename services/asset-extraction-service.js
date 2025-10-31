/**
 * Asset Extraction Service
 * 
 * Extracts navigation icons, badges, and game assets from episode images.
 * Generates multiple size variants and formats.
 * Creates asset manifest for tracking.
 * 
 * GitHub Issue: #132 - Milestone 3.1: Asset Extraction Pipeline
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const chalk = require('chalk');

class AssetExtractionService {
    constructor(options = {}) {
        // S3 Configuration
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY
            }
        });
        this.s3Bucket = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
        this.cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
        
        // Asset type specifications
        this.assetSpecs = {
            navigationIcons: [
                { size: "64x64", format: "png", usage: "menu" },
                { size: "128x128", format: "png", usage: "header" },
                { size: "256x256", format: "png", usage: "feature" }
            ],
            badges: [
                { size: "512x512", format: "png", usage: "achievement" },
                { size: "128x128", format: "webp", usage: "profile" }
            ],
            gameAssets: [
                { type: "sprite", size: "256x256", format: "png" },
                { type: "background", size: "1920x1080", format: "jpg" },
                { type: "ui-element", size: "variable", format: "png" }
            ]
        };
    }

    /**
     * Extract all assets for an episode
     * @param {Object} config - Extraction configuration
     * @returns {Promise<Object>} Extraction results with manifest
     */
    async extractEpisodeAssets(config) {
        const {
            episodeId,
            season,
            episodeNumber,
            sourceImages = [], // Array of image URLs or paths
            outputDir = null // Optional custom output directory
        } = config;

        console.log(chalk.cyan('\n🎨 ASSET EXTRACTION PIPELINE'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.gray(`Episode: S${season}E${episodeNumber} (${episodeId})`));
        console.log(chalk.gray(`Source images: ${sourceImages.length}`));
        console.log('');

        const manifest = {
            episodeId,
            season,
            episodeNumber,
            extractedAt: new Date().toISOString(),
            assets: {
                navigationIcons: [],
                badges: [],
                gameAssets: []
            },
            sourceImages: sourceImages.map(img => ({
                original: img,
                processed: false
            }))
        };

        try {
            // Use first approved image as primary source
            const primaryImage = sourceImages[0];
            if (!primaryImage) {
                throw new Error('No source images provided');
            }

            console.log(chalk.yellow('📸 Processing primary image:'), primaryImage);
            
            // 1. Extract navigation icons
            console.log(chalk.cyan('\n[1/3] Extracting navigation icons...'));
            manifest.assets.navigationIcons = await this.extractNavigationIcons({
                sourceImage: primaryImage,
                episodeId,
                season,
                episodeNumber,
                outputDir
            });

            // 2. Generate badges
            console.log(chalk.cyan('\n[2/3] Generating badges...'));
            manifest.assets.badges = await this.generateBadges({
                sourceImage: primaryImage,
                episodeId,
                season,
                episodeNumber,
                outputDir
            });

            // 3. Extract game assets
            console.log(chalk.cyan('\n[3/3] Extracting game assets...'));
            manifest.assets.gameAssets = await this.extractGameAssets({
                sourceImages,
                episodeId,
                season,
                episodeNumber,
                outputDir
            });

            // Mark source images as processed
            manifest.sourceImages.forEach(img => {
                img.processed = true;
            });

            // Save manifest
            const manifestPath = await this.saveManifest(manifest, episodeId, season, episodeNumber, outputDir);

            console.log(chalk.green('\n✅ Asset extraction complete!'));
            console.log(chalk.gray(`   Navigation icons: ${manifest.assets.navigationIcons.length}`));
            console.log(chalk.gray(`   Badges: ${manifest.assets.badges.length}`));
            console.log(chalk.gray(`   Game assets: ${manifest.assets.gameAssets.length}`));
            console.log(chalk.gray(`   Manifest: ${manifestPath}`));

            return {
                success: true,
                manifest,
                manifestPath
            };

        } catch (error) {
            console.error(chalk.red(`\n❌ Asset extraction failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Extract navigation icons in multiple sizes
     */
    async extractNavigationIcons(config) {
        const { sourceImage, episodeId, season, episodeNumber, outputDir } = config;
        const icons = [];

        for (const spec of this.assetSpecs.navigationIcons) {
            try {
                const [width, height] = spec.size.split('x').map(Number);
                const outputFilename = `icon-${spec.size}.${spec.format}`;
                
                // Generate S3 key
                const s3Key = `images/episodes/season-${season}/episode-${episodeNumber}/assets/icons/${outputFilename}`;
                
                console.log(chalk.gray(`   Generating ${spec.size} ${spec.format} icon (${spec.usage})...`));

                // Download and process image
                const imageBuffer = await this.loadImage(sourceImage);
                const processedBuffer = await sharp(imageBuffer)
                    .resize(width, height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(spec.format)
                    .toBuffer();

                // Upload to S3
                const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spec.format}`);
                
                icons.push({
                    size: spec.size,
                    format: spec.format,
                    usage: spec.usage,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key
                });

                console.log(chalk.green(`   ✓ Generated ${spec.size} icon`));

            } catch (error) {
                console.error(chalk.red(`   ✗ Failed to generate ${spec.size} icon: ${error.message}`));
            }
        }

        return icons;
    }

    /**
     * Generate badges from episode artwork
     */
    async generateBadges(config) {
        const { sourceImage, episodeId, season, episodeNumber, outputDir } = config;
        const badges = [];

        for (const spec of this.assetSpecs.badges) {
            try {
                const [width, height] = spec.size.split('x').map(Number);
                const outputFilename = `badge-${spec.size}.${spec.format}`;
                
                // Generate S3 key
                const s3Key = `images/episodes/season-${season}/episode-${episodeNumber}/assets/badges/${outputFilename}`;
                
                console.log(chalk.gray(`   Generating ${spec.size} ${spec.format} badge (${spec.usage})...`));

                // Download and process image
                const imageBuffer = await this.loadImage(sourceImage);
                
                // For badges, we want square aspect ratio and centered crop
                const processedBuffer = await sharp(imageBuffer)
                    .resize(width, height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(spec.format === 'webp' ? 'webp' : 'png', {
                        quality: spec.format === 'webp' ? 90 : 100,
                        compressionLevel: 9
                    })
                    .toBuffer();

                // Upload to S3
                const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spec.format}`);
                
                badges.push({
                    size: spec.size,
                    format: spec.format,
                    usage: spec.usage,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key
                });

                console.log(chalk.green(`   ✓ Generated ${spec.size} badge`));

            } catch (error) {
                console.error(chalk.red(`   ✗ Failed to generate ${spec.size} badge: ${error.message}`));
            }
        }

        return badges;
    }

    /**
     * Extract game assets (sprites, backgrounds, UI elements)
     */
    async extractGameAssets(config) {
        const { sourceImages, episodeId, season, episodeNumber, outputDir } = config;
        const gameAssets = [];

        // Use multiple source images for variety
        const imagesToProcess = sourceImages.slice(0, 3); // Process up to 3 images

        for (let i = 0; i < imagesToProcess.length; i++) {
            const sourceImage = imagesToProcess[i];
            
            // Extract sprite from image
            try {
                const spriteSpec = this.assetSpecs.gameAssets.find(a => a.type === 'sprite');
                const [width, height] = spriteSpec.size.split('x').map(Number);
                const outputFilename = `sprite-${i + 1}.${spriteSpec.format}`;
                
                const s3Key = `images/episodes/season-${season}/episode-${episodeNumber}/assets/game/sprites/${outputFilename}`;
                
                console.log(chalk.gray(`   Extracting sprite ${i + 1}/${imagesToProcess.length}...`));

                const imageBuffer = await this.loadImage(sourceImage);
                const processedBuffer = await sharp(imageBuffer)
                    .resize(width, height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toFormat(spriteSpec.format)
                    .toBuffer();

                const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spriteSpec.format}`);
                
                gameAssets.push({
                    type: 'sprite',
                    index: i + 1,
                    size: spriteSpec.size,
                    format: spriteSpec.format,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key,
                    sourceImage
                });

                console.log(chalk.green(`   ✓ Extracted sprite ${i + 1}`));

            } catch (error) {
                console.error(chalk.red(`   ✗ Failed to extract sprite ${i + 1}: ${error.message}`));
            }
        }

        // Extract background from primary image
        try {
            const bgSpec = this.assetSpecs.gameAssets.find(a => a.type === 'background');
            const [width, height] = bgSpec.size.split('x').map(Number);
            const outputFilename = `background.${bgSpec.format}`;
            
            const s3Key = `images/episodes/season-${season}/episode-${episodeNumber}/assets/game/backgrounds/${outputFilename}`;
            
            console.log(chalk.gray(`   Extracting background (${bgSpec.size})...`));

            const imageBuffer = await this.loadImage(sourceImages[0]);
            const processedBuffer = await sharp(imageBuffer)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${bgSpec.format}`);
            
            gameAssets.push({
                type: 'background',
                size: bgSpec.size,
                format: bgSpec.format,
                path: relativePath,
                url: `${this.cdnUrl}${relativePath}`,
                s3Key,
                sourceImage: sourceImages[0]
            });

            console.log(chalk.green(`   ✓ Extracted background`));

        } catch (error) {
            console.error(chalk.red(`   ✗ Failed to extract background: ${error.message}`));
        }

        return gameAssets;
    }

    /**
     * Load image from URL or local path
     */
    async loadImage(imagePath) {
        // Handle data URLs
        if (imagePath.startsWith('data:')) {
            const base64Data = imagePath.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }

        // Handle local file paths
        if (imagePath.startsWith('/') && !imagePath.startsWith('//') && !imagePath.startsWith('http')) {
            const fs = require('fs').promises;
            return await fs.readFile(imagePath);
        }

        // Handle URLs (HTTP/HTTPS)
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            const https = require('https');
            const http = require('http');
            const url = require('url');
            
            return new Promise((resolve, reject) => {
                const parsedUrl = new URL(imagePath);
                const protocol = parsedUrl.protocol === 'https:' ? https : http;
                
                protocol.get(imagePath, (response) => {
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        return this.loadImage(response.headers.location).then(resolve).catch(reject);
                    }
                    
                    if (response.statusCode !== 200) {
                        return reject(new Error(`HTTP ${response.statusCode}`));
                    }
                    
                    const chunks = [];
                    response.on('data', (chunk) => chunks.push(chunk));
                    response.on('end', () => resolve(Buffer.concat(chunks)));
                    response.on('error', reject);
                }).on('error', reject);
            });
        }

        // Try relative path from static directory
        const staticDir = path.join(__dirname, '../static');
        const fullPath = path.join(staticDir, imagePath);
        const fs = require('fs').promises;
        return await fs.readFile(fullPath);
    }

    /**
     * Upload buffer to S3
     */
    async uploadToS3(buffer, s3Key, contentType) {
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'max-age=31536000'
        }));

        return `/${s3Key}`;
    }

    /**
     * Save asset manifest
     */
    async saveManifest(manifest, episodeId, season, episodeNumber, outputDir) {
        const manifestData = JSON.stringify(manifest, null, 2);
        const manifestKey = `images/episodes/season-${season}/episode-${episodeNumber}/assets/manifest.json`;
        
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: manifestKey,
            Body: manifestData,
            ContentType: 'application/json',
            CacheControl: 'max-age=3600'
        }));

        return `/${manifestKey}`;
    }

    /**
     * Get manifest for an episode
     */
    async getManifest(season, episodeNumber) {
        const manifestKey = `images/episodes/season-${season}/episode-${episodeNumber}/assets/manifest.json`;
        
        try {
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const response = await this.s3Client.send(new GetObjectCommand({
                Bucket: this.s3Bucket,
                Key: manifestKey
            }));

            const manifestData = await response.Body.transformToString();
            return JSON.parse(manifestData);
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                return null;
            }
            throw error;
        }
    }
}

module.exports = AssetExtractionService;

