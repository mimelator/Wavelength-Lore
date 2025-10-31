/**
 * Asset Extraction Step
 * 
 * Milestone 3.1: Asset Extraction Pipeline
 * Extracts navigation icons, badges, and game assets from episode images
 */

const chalk = require('chalk');
const AssetExtractionService = require('../../services/asset-extraction-service');

class AssetExtractionStep {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
        this.assetService = new AssetExtractionService();
    }

    async execute(episode) {
        console.log(chalk.yellow('\nStep 6 of 10: Asset Extraction'));
        console.log('─'.repeat(40));
        console.log(`Episode: ${chalk.cyan(episode.id)} - ${episode.title}`);
        console.log();

        try {
            // Get approved images from episode
            const sourceImages = episode.approvedImages || episode.images || [];
            
            if (sourceImages.length === 0) {
                console.log(chalk.yellow('⚠️  No approved images found for asset extraction'));
                console.log(chalk.gray('   Please complete image generation (Step 3) first'));
                return;
            }

            console.log(chalk.gray(`Found ${sourceImages.length} approved image(s) for extraction`));
            console.log();

            // Ask for confirmation
            const confirmed = await new Promise((resolve) => {
                this.rl.question(chalk.cyan('Extract assets from approved images? (y/n, default: y): '), (answer) => {
                    resolve(answer.toLowerCase().trim() !== 'n');
                });
            });

            if (!confirmed) {
                console.log(chalk.gray('Asset extraction skipped'));
                return;
            }

            // Extract assets
            const result = await this.assetService.extractEpisodeAssets({
                episodeId: episode.id,
                season: episode.season,
                episodeNumber: episode.episodeNumber,
                sourceImages: sourceImages
            });

            if (result.success) {
                // Update episode state with asset manifest
                await this.stateManager.updateEpisodeStep(episode.id, 6, {
                    completed: true,
                    completedAt: new Date().toISOString(),
                    assets: result.manifest.assets,
                    manifestPath: result.manifestPath
                });

                console.log(chalk.green('\n✅ Asset extraction completed!'));
                console.log(chalk.gray(`   Manifest: ${result.manifestPath}`));
            }

        } catch (error) {
            console.error(chalk.red(`❌ Asset extraction failed: ${error.message}`));
            throw error;
        }
    }
}

module.exports = AssetExtractionStep;

