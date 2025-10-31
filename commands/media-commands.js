/**
 * Media Generation CLI Commands
 * 
 * CLI interface for AI-powered image and video generation including:
 * - Image generation with prompts
 * - Video generation from images
 * - Asset preview and review system
 * - Approval/rejection workflow
 * - Iterative generation (generate → review → regenerate)
 * - Episode-specific media generation workflows
 * 
 * GitHub Issue: #131 - Milestone 2.2: Media Generation Tools (CLI-exposed)
 * 
 * Usage Examples:
 * - media images generate "epic battle scene" --count=4
 * - media images preview episode s4e9
 * - media images approve image-id-123
 * - media images reject image-id-456 --reason="Wrong style"
 * - media videos generate --image=image-url --prompt="Cinematic camera movement"
 * - media episode s4e9 generate --images=12
 */

const chalk = require('chalk');
const MediaGenerationService = require('../services/media-generation-service');
const { program } = require('commander');

// Optional browser opening (if package is available)
let openBrowser;
try {
    openBrowser = require('open');
} catch (e) {
    openBrowser = null;
    console.log(chalk.yellow('💡 Install "open" package for browser preview: npm install open'));
}

// In-memory storage for generated assets (pending approval)
// In production, this would be stored in Firebase/database
const pendingAssets = {
    images: new Map(), // assetId -> { data, metadata, status, approved }
    videos: new Map()  // assetId -> { data, metadata, status, approved }
};

class MediaCommands {
    constructor(cli) {
        this.cli = cli;
        this.mediaService = new MediaGenerationService({
            baseUrl: process.env.CLI_API_URL || `http://localhost:${process.env.PORT || 3001}`
        });
        
        console.log(chalk.cyan('🎨 Media Generation CLI Commands initialized'));
    }

    /**
     * Main media command handler
     * Routes subcommands to appropriate methods
     */
    async handleMediaCommands(args) {
        if (!args || args.length === 0) {
            return this.showMediaHelp();
        }

        const subCommand = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'images':
                case 'image':
                case 'img':
                    return await this.handleImageCommands(commandArgs);
                    
                case 'videos':
                case 'video':
                case 'vid':
                    return await this.handleVideoCommands(commandArgs);
                    
                case 'episode':
                case 'ep':
                    return await this.handleEpisodeCommands(commandArgs);
                    
                case 'preview':
                case 'view':
                    return await this.handlePreviewCommand(commandArgs);
                    
                case 'approve':
                case 'accept':
                    return await this.handleApproveCommand(commandArgs);
                    
                case 'reject':
                case 'deny':
                    return await this.handleRejectCommand(commandArgs);
                    
                case 'list':
                case 'ls':
                    return await this.listPendingAssets(commandArgs);
                    
                case 'status':
                    return await this.showStatus(commandArgs);
                    
                case 'test':
                case 'test-config':
                case 'validate':
                    return await this.testConfiguration(commandArgs);
                    
                case 'help':
                case '--help':
                case '-h':
                    return this.showMediaHelp();
                    
                default:
                    console.log(chalk.red(`❌ Unknown media command: ${subCommand}`));
                    console.log(chalk.yellow('Type "media help" for available commands'));
                    return;
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
        }
    }

    /**
     * Handle image generation commands
     */
    async handleImageCommands(args) {
        if (!args || args.length === 0) {
            return this.showImageHelp();
        }

        const action = args[0].toLowerCase();
        const actionArgs = args.slice(1);

        switch (action) {
            case 'generate':
            case 'gen':
            case 'create':
                return await this.generateImages(actionArgs);
                
            case 'preview':
            case 'view':
            case 'show':
                return await this.previewImages(actionArgs);
                
            case 'approve':
                return await this.approveImage(actionArgs);
                
            case 'reject':
                return await this.rejectImage(actionArgs);
                
            case 'regenerate':
            case 'regenerate':
                return await this.regenerateImage(actionArgs);
                
            case 'list':
            case 'ls':
                return await this.listImages(actionArgs);
                
            default:
                console.log(chalk.red(`❌ Unknown image command: ${action}`));
                return this.showImageHelp();
        }
    }

    /**
     * Generate images
     * Usage: media images generate "prompt" [options]
     */
    async generateImages(args) {
        // Parse arguments
        const promptText = args.find(arg => !arg.startsWith('--'));
        const options = this.parseOptions(args);
        
        const {
            count = 1,
            width = 1024,
            height = 1024,
            style = 'photorealistic',
            contentType = null,
            contentId = null
        } = options;

        if (!promptText) {
            console.log(chalk.red('❌ Prompt text is required'));
            console.log(chalk.yellow('Usage: media images generate "your prompt here" [options]'));
            return;
        }

        console.log(chalk.cyan('\n🎨 Generating Images...'));
        console.log(chalk.gray(`Prompt: ${promptText}`));
        console.log(chalk.gray(`Count: ${count}, Size: ${width}x${height}, Style: ${style}\n`));

        try {
            // Show progress
            const progressBar = this.createProgressBar(count);
            
            const result = await this.mediaService.generateImages({
                promptText,
                count: parseInt(count),
                width: parseInt(width),
                height: parseInt(height),
                style,
                contentType,
                contentId,
                metadata: {
                    generatedBy: 'cli',
                    timestamp: Date.now()
                }
            });

            if (result.success && result.images && result.images.length > 0) {
                console.log(chalk.green(`\n✅ Successfully generated ${result.images.length} image(s)\n`));
                
                // Store pending assets
                result.images.forEach((image, index) => {
                    const assetId = `img-${Date.now()}-${index}`;
                    pendingAssets.images.set(assetId, {
                        ...image,
                        metadata: {
                            ...result.metadata,
                            assetId,
                            index
                        },
                        status: 'pending',
                        approved: false
                    });
                    
                    console.log(chalk.cyan(`  📸 Image ${index + 1}:`));
                    console.log(chalk.gray(`     ID: ${assetId}`));
                    if (image.url) {
                        console.log(chalk.gray(`     URL: ${image.url}`));
                    }
                    if (image.previewUrl) {
                        console.log(chalk.gray(`     Preview: ${image.previewUrl}`));
                    }
                });

                console.log(chalk.yellow('\n💡 Next steps:'));
                console.log(chalk.gray(`   Preview: media images preview`));
                console.log(chalk.gray(`   Approve: media images approve <asset-id>`));
                console.log(chalk.gray(`   Reject:  media images reject <asset-id>`));
            } else {
                console.log(chalk.red('❌ No images were generated'));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Generation failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Preview generated images
     */
    async previewImages(args) {
        const options = this.parseOptions(args);
        const assetId = args.find(arg => !arg.startsWith('--'));

        if (assetId) {
            // Preview specific asset
            const asset = pendingAssets.images.get(assetId);
            if (!asset) {
                console.log(chalk.red(`❌ Asset not found: ${assetId}`));
                return;
            }
            await this.previewSingleImage(asset);
        } else {
            // Preview all pending images
            if (pendingAssets.images.size === 0) {
                console.log(chalk.yellow('ℹ️  No pending images to preview'));
                return;
            }

            console.log(chalk.cyan(`\n📸 Previewing ${pendingAssets.images.size} pending image(s)...\n`));
            
            for (const [id, asset] of pendingAssets.images.entries()) {
                console.log(chalk.cyan(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
                console.log(chalk.cyan(`Image ID: ${id}`));
                console.log(chalk.gray(`Status: ${asset.status}`));
                console.log(chalk.gray(`Prompt: ${asset.metadata?.prompt || 'N/A'}`));
                if (options.browser && asset.url) {
                    if (openBrowser) {
                        console.log(chalk.yellow(`Opening in browser...`));
                        await openBrowser(asset.url);
                    } else {
                        console.log(chalk.yellow(`\nBrowser preview not available. Install "open" package.`));
                        console.log(chalk.cyan(`URL: ${asset.url}`));
                    }
                } else if (asset.url) {
                    console.log(chalk.cyan(`URL: ${asset.url}`));
                }
            }
        }
    }

    /**
     * Preview single image
     */
    async previewSingleImage(asset) {
        console.log(chalk.cyan('\n📸 Image Preview'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.gray(`ID: ${asset.metadata?.assetId}`));
        console.log(chalk.gray(`Status: ${asset.status}`));
        console.log(chalk.gray(`Prompt: ${asset.metadata?.prompt || 'N/A'}`));
        
        if (asset.url) {
            console.log(chalk.cyan(`\nURL: ${asset.url}`));
            if (openBrowser) {
                console.log(chalk.yellow('\n💡 Opening in browser...'));
                await openBrowser(asset.url);
            } else {
                console.log(chalk.yellow('\n💡 Copy the URL above to view in your browser'));
            }
        }
    }

    /**
     * Approve an image
     */
    async approveImage(args) {
        const assetId = args[0];
        
        if (!assetId) {
            console.log(chalk.red('❌ Asset ID is required'));
            console.log(chalk.yellow('Usage: media images approve <asset-id>'));
            return;
        }

        const asset = pendingAssets.images.get(assetId);
        if (!asset) {
            console.log(chalk.red(`❌ Asset not found: ${assetId}`));
            return;
        }

        asset.status = 'approved';
        asset.approved = true;
        asset.approvedAt = new Date().toISOString();

        console.log(chalk.green(`\n✅ Image approved: ${assetId}`));
        console.log(chalk.gray(`This image is now ready for use.\n`));
    }

    /**
     * Reject an image
     */
    async rejectImage(args) {
        const assetId = args.find(arg => !arg.startsWith('--'));
        const options = this.parseOptions(args);
        const reason = options.reason || 'No reason provided';

        if (!assetId) {
            console.log(chalk.red('❌ Asset ID is required'));
            console.log(chalk.yellow('Usage: media images reject <asset-id> [--reason="reason"]'));
            return;
        }

        const asset = pendingAssets.images.get(assetId);
        if (!asset) {
            console.log(chalk.red(`❌ Asset not found: ${assetId}`));
            return;
        }

        asset.status = 'rejected';
        asset.approved = false;
        asset.rejectedAt = new Date().toISOString();
        asset.rejectionReason = reason;

        console.log(chalk.yellow(`\n⚠️  Image rejected: ${assetId}`));
        console.log(chalk.gray(`Reason: ${reason}`));
        console.log(chalk.yellow(`\n💡 To regenerate: media images regenerate ${assetId}\n`));
    }

    /**
     * Regenerate a rejected image
     */
    async regenerateImage(args) {
        const assetId = args[0];
        
        if (!assetId) {
            console.log(chalk.red('❌ Asset ID is required'));
            return;
        }

        const asset = pendingAssets.images.get(assetId);
        if (!asset) {
            console.log(chalk.red(`❌ Asset not found: ${assetId}`));
            return;
        }

        // Get original prompt and options
        const originalPrompt = asset.metadata?.prompt || '';
        const style = asset.metadata?.style || 'photorealistic';

        console.log(chalk.cyan(`\n🔄 Regenerating image: ${assetId}`));
        console.log(chalk.gray(`Original prompt: ${originalPrompt}\n`));

        // Remove old asset
        pendingAssets.images.delete(assetId);

        // Generate new image with same parameters
        await this.generateImages([
            originalPrompt,
            `--style=${style}`,
            '--count=1'
        ]);
    }

    /**
     * List all images
     */
    async listImages(args) {
        const options = this.parseOptions(args);
        const status = options.status || 'all';

        const images = Array.from(pendingAssets.images.entries());
        
        if (images.length === 0) {
            console.log(chalk.yellow('ℹ️  No images found'));
            return;
        }

        let filtered = images;
        if (status !== 'all') {
            filtered = images.filter(([id, asset]) => asset.status === status);
        }

        console.log(chalk.cyan(`\n📸 Images (${filtered.length} total)\n`));
        
        filtered.forEach(([id, asset]) => {
            const statusColor = asset.approved ? chalk.green : 
                              asset.status === 'rejected' ? chalk.red : 
                              chalk.yellow;
            console.log(`${statusColor(asset.status.toUpperCase().padEnd(10))} ${id}`);
            if (asset.metadata?.prompt) {
                console.log(chalk.gray(`           ${asset.metadata.prompt.substring(0, 60)}...`));
            }
        });
        console.log('');
    }

    /**
     * Handle video commands
     */
    async handleVideoCommands(args) {
        if (!args || args.length === 0) {
            return this.showVideoHelp();
        }

        const action = args[0].toLowerCase();
        const actionArgs = args.slice(1);

        switch (action) {
            case 'generate':
            case 'gen':
            case 'create':
                return await this.generateVideo(actionArgs);
                
            case 'status':
                return await this.checkVideoStatus(actionArgs);
                
            case 'preview':
            case 'view':
                return await this.previewVideo(actionArgs);
                
            default:
                console.log(chalk.red(`❌ Unknown video command: ${action}`));
                return this.showVideoHelp();
        }
    }

    /**
     * Generate video from image
     */
    async generateVideo(args) {
        const options = this.parseOptions(args);
        
        const {
            image,
            prompt,
            contentType = 'episode',
            contentId = null
        } = options;

        if (!image) {
            console.log(chalk.red('❌ Image URL is required'));
            console.log(chalk.yellow('Usage: media videos generate --image=<url> --prompt="description"'));
            return;
        }

        if (!prompt) {
            console.log(chalk.red('❌ Prompt is required for video generation'));
            return;
        }

        console.log(chalk.cyan('\n🎬 Generating Video...'));
        console.log(chalk.gray(`Image: ${image}`));
        console.log(chalk.gray(`Prompt: ${prompt}\n`));

        try {
            const result = await this.mediaService.generateVideo({
                imageUrl: image,
                promptText: prompt,
                contentType,
                contentId,
                metadata: {
                    generatedBy: 'cli',
                    timestamp: Date.now()
                }
            });

            if (result.success) {
                const assetId = `vid-${Date.now()}`;
                pendingAssets.videos.set(assetId, {
                    ...result.video,
                    metadata: result.metadata,
                    status: result.video.status,
                    approved: false
                });

                console.log(chalk.green(`\n✅ Video generation started: ${assetId}`));
                console.log(chalk.gray(`Status: ${result.video.status}`));
                
                if (result.video.operationId) {
                    console.log(chalk.gray(`Operation ID: ${result.video.operationId}`));
                    console.log(chalk.yellow(`\n💡 Check status: media videos status ${result.video.operationId}\n`));
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Video generation failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Check video generation status
     */
    async checkVideoStatus(args) {
        const operationId = args[0];
        
        if (!operationId) {
            console.log(chalk.red('❌ Operation ID is required'));
            return;
        }

        try {
            const status = await this.mediaService.checkVideoStatus(operationId);
            console.log(chalk.cyan('\n🎬 Video Status'));
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.gray(`Operation ID: ${operationId}`));
            console.log(chalk.gray(`Status: ${status.status || 'unknown'}`));
            
            if (status.videoUrl) {
                console.log(chalk.green(`Video URL: ${status.videoUrl}`));
            }
            console.log('');
        } catch (error) {
            console.error(chalk.red(`❌ Status check failed: ${error.message}`));
        }
    }

    /**
     * Preview video
     */
    async previewVideo(args) {
        const assetId = args[0];
        
        if (!assetId) {
            console.log(chalk.red('❌ Asset ID is required'));
            return;
        }

        const asset = pendingAssets.videos.get(assetId);
        if (!asset) {
            console.log(chalk.red(`❌ Video not found: ${assetId}`));
            return;
        }

        console.log(chalk.cyan('\n🎬 Video Preview'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.gray(`ID: ${assetId}`));
        console.log(chalk.gray(`Status: ${asset.status}`));
        
        if (asset.url) {
            console.log(chalk.cyan(`\nURL: ${asset.url}`));
            if (openBrowser) {
                console.log(chalk.yellow('\n💡 Opening in browser...'));
                await openBrowser(asset.url);
            } else {
                console.log(chalk.yellow('\n💡 Copy the URL above to view in your browser'));
            }
        }
    }

    /**
     * Test AI configuration and connection
     */
    async testConfiguration(args) {
        const { spawn } = require('child_process');
        const path = require('path');
        
        console.log(chalk.cyan('\n🔍 Testing AI Image Generation Configuration\n'));
        
        const scriptPath = path.join(__dirname, '../scripts/test-ai-config.js');
        const skipTest = args.includes('--skip-test') || args.includes('--no-test');
        const testArgs = skipTest ? ['--skip-test'] : [];
        
        return new Promise((resolve, reject) => {
            const testProcess = spawn('node', [scriptPath, ...testArgs], {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });

            testProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Test failed with exit code ${code}`));
                }
            });

            testProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Handle episode-specific commands
     */
    async handleEpisodeCommands(args) {
        if (args.length === 0) {
            console.log(chalk.red('❌ Episode ID is required'));
            console.log(chalk.yellow('Usage: media episode <episode-id> <command>'));
            return;
        }

        const episodeId = args[0];
        const command = args[1];
        const commandArgs = args.slice(2);

        switch (command) {
            case 'generate':
            case 'gen':
                return await this.generateEpisodeMedia(episodeId, commandArgs);
                
            default:
                console.log(chalk.red(`❌ Unknown episode command: ${command}`));
                return;
        }
    }

    /**
     * Generate media for an episode
     */
    async generateEpisodeMedia(episodeId, args) {
        const options = this.parseOptions(args);
        const images = parseInt(options.images || 0);

        console.log(chalk.cyan(`\n📺 Generating Media for Episode: ${episodeId}\n`));

        // This would integrate with episode service to get episode details
        // For now, use a generic prompt
        const episodePrompt = `Fantasy scene from episode ${episodeId}, detailed illustration, atmospheric lighting`;

        if (images > 0) {
            await this.generateImages([
                episodePrompt,
                `--count=${images}`,
                '--contentType=episode',
                `--contentId=${episodeId}`
            ]);
        }
    }

    /**
     * List pending assets
     */
    async listPendingAssets(args) {
        const options = this.parseOptions(args);
        const type = options.type || 'all';

        console.log(chalk.cyan('\n📦 Pending Assets\n'));

        if (type === 'all' || type === 'images') {
            console.log(chalk.yellow(`Images (${pendingAssets.images.size}):`));
            this.listImages(['--status=all']);
        }

        if (type === 'all' || type === 'videos') {
            console.log(chalk.yellow(`Videos (${pendingAssets.videos.size}):`));
            Array.from(pendingAssets.videos.entries()).forEach(([id, asset]) => {
                console.log(`  ${asset.status.toUpperCase().padEnd(10)} ${id}`);
            });
        }
    }

    /**
     * Show status
     */
    async showStatus(args) {
        const totalImages = pendingAssets.images.size;
        const totalVideos = pendingAssets.videos.size;
        const approvedImages = Array.from(pendingAssets.images.values()).filter(a => a.approved).length;
        const approvedVideos = Array.from(pendingAssets.videos.values()).filter(a => a.approved).length;

        console.log(chalk.cyan('\n📊 Media Generation Status\n'));
        console.log(chalk.gray(`Images: ${totalImages} total, ${approvedImages} approved`));
        console.log(chalk.gray(`Videos: ${totalVideos} total, ${approvedVideos} approved`));
        console.log('');
    }

    /**
     * Parse command line options
     */
    parseOptions(args) {
        const options = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, value] = arg.substring(2).split('=');
                options[key] = value !== undefined ? value : true;
            }
        });
        
        return options;
    }

    /**
     * Create progress bar
     */
    createProgressBar(total) {
        let current = 0;
        return {
            update: (increment = 1) => {
                current = Math.min(current + increment, total);
                const percentage = Math.floor((current / total) * 100);
                const filled = Math.floor((current / total) * 20);
                const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
                process.stdout.write(`\r${bar} ${percentage}% (${current}/${total})`);
                if (current >= total) {
                    process.stdout.write('\n');
                }
            }
        };
    }

    /**
     * Show media help
     */
    showMediaHelp() {
        console.log(chalk.cyan('\n🎨 Media Generation Commands\n'));
        console.log(chalk.yellow('Images:'));
        console.log(chalk.gray('  media images generate "prompt" [options]'));
        console.log(chalk.gray('  media images preview [asset-id]'));
        console.log(chalk.gray('  media images approve <asset-id>'));
        console.log(chalk.gray('  media images reject <asset-id> [--reason="reason"]'));
        console.log(chalk.gray('  media images regenerate <asset-id>'));
        console.log(chalk.gray('  media images list [--status=all|pending|approved|rejected]'));
        console.log('');
        console.log(chalk.yellow('Videos:'));
        console.log(chalk.gray('  media videos generate --image=<url> --prompt="description"'));
        console.log(chalk.gray('  media videos status <operation-id>'));
        console.log(chalk.gray('  media videos preview <asset-id>'));
        console.log('');
        console.log(chalk.yellow('Testing:'));
        console.log(chalk.gray('  media test                Test AI configuration and connection'));
        console.log(chalk.gray('  media test --skip-test    Test configuration only (no API call)'));
        console.log('');
        console.log(chalk.yellow('Episodes:'));
        console.log(chalk.gray('  media episode <episode-id> generate [options]'));
        console.log('');
        console.log(chalk.yellow('General:'));
        console.log(chalk.gray('  media list [--type=all|images|videos]'));
        console.log(chalk.gray('  media status'));
        console.log('');
    }

    /**
     * Show image help
     */
    showImageHelp() {
        console.log(chalk.cyan('\n📸 Image Generation Commands\n'));
        console.log(chalk.gray('Usage: media images <command> [options]'));
        console.log('');
        console.log(chalk.yellow('Commands:'));
        console.log(chalk.gray('  generate "prompt"           Generate images from prompt'));
        console.log(chalk.gray('  preview [asset-id]          Preview generated images'));
        console.log(chalk.gray('  approve <asset-id>          Approve an image'));
        console.log(chalk.gray('  reject <asset-id>           Reject an image'));
        console.log(chalk.gray('  regenerate <asset-id>       Regenerate a rejected image'));
        console.log(chalk.gray('  list                        List all images'));
        console.log('');
        console.log(chalk.yellow('Options:'));
        console.log(chalk.gray('  --count=<n>                 Number of images (1-4)'));
        console.log(chalk.gray('  --width=<n>                 Image width (default: 1024)'));
        console.log(chalk.gray('  --height=<n>                Image height (default: 1024)'));
        console.log(chalk.gray('  --style=<style>             Style (photorealistic, fantasy-art, etc.)'));
        console.log('');
    }

    /**
     * Show video help
     */
    showVideoHelp() {
        console.log(chalk.cyan('\n🎬 Video Generation Commands\n'));
        console.log(chalk.gray('Usage: media videos <command> [options]'));
        console.log('');
        console.log(chalk.yellow('Commands:'));
        console.log(chalk.gray('  generate --image=<url> --prompt="desc"   Generate video from image'));
        console.log(chalk.gray('  status <operation-id>                    Check generation status'));
        console.log(chalk.gray('  preview <asset-id>                       Preview generated video'));
        console.log('');
    }
}

module.exports = MediaCommands;

