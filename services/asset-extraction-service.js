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
     * Extract all assets for an episode (without approval - for preview)
     * @param {Object} config - Extraction configuration
     * @param {boolean} skipUpload - If true, don't upload to S3 (for preview/approval workflow)
     * @returns {Promise<Object>} Extraction results with pending assets
     */
    async extractEpisodeAssets(config, skipUpload = false) {
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
        if (skipUpload) {
            console.log(chalk.yellow('⚠️  Preview mode: Assets will NOT be uploaded until approved'));
        }
        console.log('');

        const pendingAssets = {
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
            pendingAssets.assets.navigationIcons = await this.extractNavigationIcons({
                sourceImage: primaryImage,
                episodeId,
                season,
                episodeNumber,
                outputDir,
                skipUpload
            });

            // 2. Generate badges
            console.log(chalk.cyan('\n[2/3] Generating badges...'));
            pendingAssets.assets.badges = await this.generateBadges({
                sourceImage: primaryImage,
                episodeId,
                season,
                episodeNumber,
                outputDir,
                skipUpload
            });

            // 3. Extract game assets
            console.log(chalk.cyan('\n[3/3] Extracting game assets...'));
            pendingAssets.assets.gameAssets = await this.extractGameAssets({
                sourceImages,
                episodeId,
                season,
                episodeNumber,
                outputDir,
                skipUpload
            });

            // Mark source images as processed
            pendingAssets.sourceImages.forEach(img => {
                img.processed = true;
            });

            console.log(chalk.green('\n✅ Asset extraction complete!'));
            console.log(chalk.gray(`   Navigation icons: ${pendingAssets.assets.navigationIcons.length}`));
            console.log(chalk.gray(`   Badges: ${pendingAssets.assets.badges.length}`));
            console.log(chalk.gray(`   Game assets: ${pendingAssets.assets.gameAssets.length}`));

            return {
                success: true,
                pendingAssets,
                readyForApproval: true
            };

        } catch (error) {
            console.error(chalk.red(`\n❌ Asset extraction failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Approve and save assets to S3 and manifest
     * @param {Object} approvedAssets - Assets that were approved (filtered from pending)
     * @param {Object} config - Episode configuration
     * @returns {Promise<Object>} Final manifest with approved assets only
     */
    async approveAndSaveAssets(approvedAssets, config) {
        const { episodeId, season, episodeNumber } = config;
        
        console.log(chalk.cyan('\n💾 Saving approved assets...'));
        
        // Upload approved assets to S3
        const uploadedAssets = {
            navigationIcons: [],
            badges: [],
            gameAssets: []
        };

        // Upload navigation icons
        for (const icon of approvedAssets.navigationIcons || []) {
            if (icon.buffer && !icon.uploaded) {
                const s3Key = icon.s3Key || `images/episodes/season-${season}/episode-${episodeNumber}/assets/icons/${icon.filename}`;
                const relativePath = await this.uploadToS3(icon.buffer, s3Key, `image/${icon.format}`);
                uploadedAssets.navigationIcons.push({
                    ...icon,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key,
                    uploaded: true
                });
                delete icon.buffer; // Clean up buffer
            } else if (icon.uploaded) {
                uploadedAssets.navigationIcons.push(icon);
            }
        }

        // Upload badges
        for (const badge of approvedAssets.badges || []) {
            if (badge.buffer && !badge.uploaded) {
                const s3Key = badge.s3Key || `images/episodes/season-${season}/episode-${episodeNumber}/assets/badges/${badge.filename}`;
                const relativePath = await this.uploadToS3(badge.buffer, s3Key, `image/${badge.format}`);
                uploadedAssets.badges.push({
                    ...badge,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key,
                    uploaded: true
                });
                delete badge.buffer;
            } else if (badge.uploaded) {
                uploadedAssets.badges.push(badge);
            }
        }

        // Upload game assets
        for (const asset of approvedAssets.gameAssets || []) {
            if (asset.buffer && !asset.uploaded) {
                const s3Key = asset.s3Key || `images/episodes/season-${season}/episode-${episodeNumber}/assets/game/${asset.type}s/${asset.filename}`;
                const relativePath = await this.uploadToS3(asset.buffer, s3Key, `image/${asset.format}`);
                uploadedAssets.gameAssets.push({
                    ...asset,
                    path: relativePath,
                    url: `${this.cdnUrl}${relativePath}`,
                    s3Key,
                    uploaded: true
                });
                delete asset.buffer;
            } else if (asset.uploaded) {
                uploadedAssets.gameAssets.push(asset);
            }
        }

        // Create final manifest with approved assets only
        const manifest = {
            episodeId,
            season,
            episodeNumber,
            extractedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            assets: uploadedAssets
        };

        // Save manifest
        const manifestPath = await this.saveManifest(manifest, episodeId, season, episodeNumber);

        console.log(chalk.green('\n✅ Approved assets saved!'));
        console.log(chalk.gray(`   Navigation icons: ${uploadedAssets.navigationIcons.length}`));
        console.log(chalk.gray(`   Badges: ${uploadedAssets.badges.length}`));
        console.log(chalk.gray(`   Game assets: ${uploadedAssets.gameAssets.length}`));
        console.log(chalk.gray(`   Manifest: ${manifestPath}`));

        return {
            success: true,
            manifest,
            manifestPath
        };
    }

    /**
     * Extract navigation icons in multiple sizes
     */
    async extractNavigationIcons(config) {
        const { sourceImage, episodeId, season, episodeNumber, outputDir, skipUpload = false } = config;
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

                const iconData = {
                    id: `icon-${spec.size}-${Date.now()}`,
                    size: spec.size,
                    format: spec.format,
                    usage: spec.usage,
                    filename: outputFilename,
                    s3Key,
                    buffer: processedBuffer, // Keep buffer for approval workflow
                    width,
                    height
                };

                // Upload immediately if not in preview mode
                if (!skipUpload) {
                    const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spec.format}`);
                    iconData.path = relativePath;
                    iconData.url = `${this.cdnUrl}${relativePath}`;
                    iconData.uploaded = true;
                    delete iconData.buffer; // Clean up buffer if uploaded
                } else {
                    iconData.uploaded = false;
                }

                icons.push(iconData);

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
        const { sourceImage, episodeId, season, episodeNumber, outputDir, skipUpload = false } = config;
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

                const badgeData = {
                    id: `badge-${spec.size}-${Date.now()}`,
                    size: spec.size,
                    format: spec.format,
                    usage: spec.usage,
                    filename: outputFilename,
                    s3Key,
                    buffer: processedBuffer,
                    width,
                    height
                };

                // Upload immediately if not in preview mode
                if (!skipUpload) {
                    const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spec.format}`);
                    badgeData.path = relativePath;
                    badgeData.url = `${this.cdnUrl}${relativePath}`;
                    badgeData.uploaded = true;
                    delete badgeData.buffer;
                } else {
                    badgeData.uploaded = false;
                }

                badges.push(badgeData);

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
        const { sourceImages, episodeId, season, episodeNumber, outputDir, skipUpload = false } = config;
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

                const spriteData = {
                    id: `sprite-${i + 1}-${Date.now()}`,
                    type: 'sprite',
                    index: i + 1,
                    size: spriteSpec.size,
                    format: spriteSpec.format,
                    filename: outputFilename,
                    s3Key,
                    buffer: processedBuffer,
                    sourceImage,
                    width,
                    height
                };

                // Upload immediately if not in preview mode
                if (!skipUpload) {
                    const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${spriteSpec.format}`);
                    spriteData.path = relativePath;
                    spriteData.url = `${this.cdnUrl}${relativePath}`;
                    spriteData.uploaded = true;
                    delete spriteData.buffer;
                } else {
                    spriteData.uploaded = false;
                }

                gameAssets.push(spriteData);

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

            const bgData = {
                id: `background-${Date.now()}`,
                type: 'background',
                size: bgSpec.size,
                format: bgSpec.format,
                filename: outputFilename,
                s3Key,
                buffer: processedBuffer,
                sourceImage: sourceImages[0],
                width,
                height
            };

            // Upload immediately if not in preview mode
            if (!skipUpload) {
                const relativePath = await this.uploadToS3(processedBuffer, s3Key, `image/${bgSpec.format}`);
                bgData.path = relativePath;
                bgData.url = `${this.cdnUrl}${relativePath}`;
                bgData.uploaded = true;
                delete bgData.buffer;
            } else {
                bgData.uploaded = false;
            }

            gameAssets.push(bgData);

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

    /**
     * Convert buffer to data URL for preview
     */
    bufferToDataUrl(buffer, mimeType) {
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    /**
     * Create preview HTML for all pending assets
     */
    async createPreviewHTML(pendingAssets, outputPath = null) {
        const fs = require('fs').promises;
        const path = require('path');
        const os = require('os');

        if (!outputPath) {
            const tempDir = os.tmpdir();
            outputPath = path.join(tempDir, `asset-preview-${Date.now()}.html`);
        }

        // Collect all assets with data URLs
        const allAssets = [];
        
        // Navigation icons
        for (const icon of pendingAssets.assets.navigationIcons || []) {
            if (icon.buffer) {
                allAssets.push({
                    id: icon.id,
                    type: 'navigationIcon',
                    label: `Icon ${icon.size} (${icon.usage})`,
                    dataUrl: this.bufferToDataUrl(icon.buffer, `image/${icon.format}`),
                    size: icon.size,
                    format: icon.format,
                    usage: icon.usage
                });
            }
        }

        // Badges
        for (const badge of pendingAssets.assets.badges || []) {
            if (badge.buffer) {
                allAssets.push({
                    id: badge.id,
                    type: 'badge',
                    label: `Badge ${badge.size} (${badge.usage})`,
                    dataUrl: this.bufferToDataUrl(badge.buffer, `image/${badge.format}`),
                    size: badge.size,
                    format: badge.format,
                    usage: badge.usage
                });
            }
        }

        // Game assets
        for (const asset of pendingAssets.assets.gameAssets || []) {
            if (asset.buffer) {
                const mimeType = asset.format === 'jpg' ? 'image/jpeg' : `image/${asset.format}`;
                allAssets.push({
                    id: asset.id,
                    type: asset.type,
                    label: `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} ${asset.index || ''}`.trim(),
                    dataUrl: this.bufferToDataUrl(asset.buffer, mimeType),
                    size: asset.size,
                    format: asset.format
                });
            }
        }

        // Generate HTML
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Asset Extraction Preview - ${pendingAssets.episodeId}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .header h1 {
            margin: 0;
            color: #fff;
        }
        .header p {
            color: #888;
            margin: 10px 0 0 0;
        }
        .assets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .asset-card {
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 8px;
            padding: 15px;
            position: relative;
        }
        .asset-card.approved {
            border-color: #4caf50;
            background: #1a2a1a;
        }
        .asset-card.rejected {
            border-color: #f44336;
            background: #2a1a1a;
            opacity: 0.5;
        }
        .asset-label {
            font-weight: bold;
            margin-bottom: 10px;
            color: #fff;
        }
        .asset-image {
            width: 100%;
            height: auto;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .asset-image:hover {
            transform: scale(1.05);
        }
        .asset-info {
            margin-top: 10px;
            font-size: 12px;
            color: #888;
        }
        .status-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .status-badge.approved {
            background: #4caf50;
            color: white;
        }
        .status-badge.rejected {
            background: #f44336;
            color: white;
        }
        .status-badge.pending {
            background: #ff9800;
            color: white;
        }
        .instructions {
            background: #2a2a2a;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 4px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #2196f3;
        }
        .summary {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 4px;
            margin-top: 30px;
            text-align: center;
        }
        .summary-item {
            display: inline-block;
            margin: 0 20px;
        }
        .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #4caf50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Asset Extraction Preview</h1>
        <p>Episode: ${pendingAssets.episodeId} | Season ${pendingAssets.season}, Episode ${pendingAssets.episodeNumber}</p>
        <p>Extracted: ${new Date(pendingAssets.extractedAt).toLocaleString()}</p>
    </div>

    <div class="instructions">
        <h3>📋 Instructions</h3>
        <p><strong>Review each asset below:</strong></p>
        <ul>
            <li>Click on an asset image to toggle approval status</li>
            <li>✅ <strong>Green border</strong> = Approved (will be saved)</li>
            <li>❌ <strong>Red border</strong> = Rejected (will be discarded)</li>
            <li>🟠 <strong>Orange badge</strong> = Pending review</li>
        </ul>
        <p><strong>After reviewing:</strong> Return to CLI and approve/reject assets individually, or use "approve all" / "reject all" commands.</p>
    </div>

    <div class="assets-grid" id="assetsGrid">
${allAssets.map(asset => `
        <div class="asset-card pending" data-asset-id="${asset.id}" data-asset-type="${asset.type}" onclick="toggleAsset('${asset.id}')">
            <span class="status-badge pending">PENDING</span>
            <div class="asset-label">${asset.label}</div>
            <img src="${asset.dataUrl}" alt="${asset.label}" class="asset-image" />
            <div class="asset-info">
                Size: ${asset.size || 'N/A'} | Format: ${asset.format}
            </div>
        </div>
`).join('')}
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-number" id="totalCount">${allAssets.length}</div>
            <div>Total Assets</div>
        </div>
        <div class="summary-item">
            <div class="summary-number" id="approvedCount" style="color: #4caf50;">0</div>
            <div>Approved</div>
        </div>
        <div class="summary-item">
            <div class="summary-number" id="rejectedCount" style="color: #f44336;">0</div>
            <div>Rejected</div>
        </div>
    </div>

    <script>
        const assetStatuses = {};
        
        function toggleAsset(assetId) {
            const card = document.querySelector(\`[data-asset-id="\${assetId}"]\`);
            const badge = card.querySelector('.status-badge');
            const currentStatus = assetStatuses[assetId] || 'pending';
            
            let newStatus;
            if (currentStatus === 'pending' || currentStatus === 'rejected') {
                newStatus = 'approved';
                card.className = 'asset-card approved';
                badge.className = 'status-badge approved';
                badge.textContent = 'APPROVED';
            } else {
                newStatus = 'rejected';
                card.className = 'asset-card rejected';
                badge.className = 'status-badge rejected';
                badge.textContent = 'REJECTED';
            }
            
            assetStatuses[assetId] = newStatus;
            updateSummary();
        }
        
        function updateSummary() {
            const approved = Object.values(assetStatuses).filter(s => s === 'approved').length;
            const rejected = Object.values(assetStatuses).filter(s => s === 'rejected').length;
            
            document.getElementById('approvedCount').textContent = approved;
            document.getElementById('rejectedCount').textContent = rejected;
        }
        
        // Initialize all as pending
        ${allAssets.map(a => `assetStatuses['${a.id}'] = 'pending';`).join('\n        ')}
    </script>
</body>
</html>`;

        await fs.writeFile(outputPath, html);
        return outputPath;
    }
}

module.exports = AssetExtractionService;

