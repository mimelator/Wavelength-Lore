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

            // Extract assets in preview mode (for approval workflow)
            const result = await this.assetService.extractEpisodeAssets({
                episodeId: episode.id,
                season: episode.season,
                episodeNumber: episode.episodeNumber,
                sourceImages: sourceImages
            }, true); // skipUpload = true for approval workflow

            if (!result.success || !result.readyForApproval) {
                console.log(chalk.red('❌ Asset extraction failed'));
                return;
            }

            const pendingAssets = result.pendingAssets;
            const totalAssets = 
                (pendingAssets.assets.navigationIcons?.length || 0) +
                (pendingAssets.assets.badges?.length || 0) +
                (pendingAssets.assets.gameAssets?.length || 0);

            console.log(chalk.green(`\n✅ ${totalAssets} assets extracted and ready for review!`));

            // Create preview HTML
            const fs = require('fs').promises;
            const path = require('path');
            const os = require('os');
            const tempFile = path.join(os.tmpdir(), `asset-preview-${Date.now()}.html`);
            
            console.log(chalk.cyan('\n🖼️  Generating preview page...'));
            await this.assetService.createPreviewHTML(pendingAssets, tempFile);
            
            // Try to open in browser
            try {
                const open = require('open');
                await open(tempFile);
                console.log(chalk.green('✅ Preview opened in browser'));
            } catch (e) {
                console.log(chalk.yellow('💡 Preview file created (browser not auto-opened):'));
            }
            
            console.log(chalk.gray(`   Preview file: ${tempFile}`));

            // Interactive approval
            const approvedAssets = await this.approveAssetsInteractively(pendingAssets);

            if (approvedAssets && (approvedAssets.navigationIcons.length > 0 || approvedAssets.badges.length > 0 || approvedAssets.gameAssets.length > 0)) {
                // Save approved assets
                const approvedResult = await this.assetService.approveAndSaveAssets(approvedAssets, {
                    episodeId: episode.id,
                    season: episode.season,
                    episodeNumber: episode.episodeNumber
                });

                if (approvedResult.success) {
                    // Update episode state with asset manifest
                    await this.stateManager.updateEpisodeStep(episode.id, 6, {
                        completed: true,
                        completedAt: new Date().toISOString(),
                        assets: approvedResult.manifest.assets,
                        manifestPath: approvedResult.manifestPath
                    });

                    console.log(chalk.green('\n✅ Approved assets saved successfully!'));
                    console.log(chalk.gray(`   Manifest: ${approvedResult.manifestPath}`));
                }
            } else {
                console.log(chalk.yellow('\n⚠️  No assets approved. Step incomplete.'));
            }

        } catch (error) {
            console.error(chalk.red(`❌ Asset extraction failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Interactive asset approval (simplified version for pipeline step)
     */
    async approveAssetsInteractively(pendingAssets) {
        const allAssets = [];
        
        // Collect all assets
        for (const icon of pendingAssets.assets.navigationIcons || []) {
            allAssets.push({ ...icon, category: 'navigationIcon', displayName: `Icon ${icon.size} (${icon.usage})` });
        }
        for (const badge of pendingAssets.assets.badges || []) {
            allAssets.push({ ...badge, category: 'badge', displayName: `Badge ${badge.size} (${badge.usage})` });
        }
        for (const asset of pendingAssets.assets.gameAssets || []) {
            const label = `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}${asset.index ? ` ${asset.index}` : ''}`;
            allAssets.push({ ...asset, category: 'gameAsset', displayName: label });
        }

        if (allAssets.length === 0) {
            return null;
        }

        const approvedAssets = {
            navigationIcons: [],
            badges: [],
            gameAssets: []
        };

        console.log(chalk.cyan(`\n📋 Asset Approval (${allAssets.length} total)`));
        console.log(chalk.yellow('You can:'));
        console.log(chalk.gray('  - Approve all: type "all" or "a"'));
        console.log(chalk.gray('  - Reject all: type "reject all" or "r"'));
        console.log(chalk.gray('  - Approve: type "y" or Enter'));
        console.log(chalk.gray('  - Reject: type "n"\n'));

        for (let i = 0; i < allAssets.length; i++) {
            const asset = allAssets[i];
            
            const answer = await new Promise((resolve) => {
                this.rl.question(chalk.yellow(`[${i + 1}/${allAssets.length}] ${asset.displayName} - Approve? (y/n/all/r, default: y): `), resolve);
            });
            const normalizedAnswer = answer.toLowerCase().trim();

            if (normalizedAnswer === 'all' || normalizedAnswer === 'a') {
                // Approve all remaining
                console.log(chalk.green(`✅ Approving all remaining ${allAssets.length - i} assets...`));
                for (let j = i; j < allAssets.length; j++) {
                    const remainingAsset = allAssets[j];
                    if (remainingAsset.category === 'navigationIcon') {
                        approvedAssets.navigationIcons.push(remainingAsset);
                    } else if (remainingAsset.category === 'badge') {
                        approvedAssets.badges.push(remainingAsset);
                    } else if (remainingAsset.category === 'gameAsset') {
                        approvedAssets.gameAssets.push(remainingAsset);
                    }
                }
                break;
            } else if (normalizedAnswer === 'reject all' || normalizedAnswer === 'r') {
                console.log(chalk.red(`❌ Rejecting all remaining ${allAssets.length - i} assets...`));
                break;
            } else if (normalizedAnswer === 'n' || normalizedAnswer === 'no') {
                console.log(chalk.red(`❌ Rejected: ${asset.displayName}`));
                continue;
            } else {
                // Default: approve
                console.log(chalk.green(`✅ Approved: ${asset.displayName}`));
                if (asset.category === 'navigationIcon') {
                    approvedAssets.navigationIcons.push(asset);
                } else if (asset.category === 'badge') {
                    approvedAssets.badges.push(asset);
                } else if (asset.category === 'gameAsset') {
                    approvedAssets.gameAssets.push(asset);
                }
            }
        }

        return approvedAssets;
    }
}

module.exports = AssetExtractionStep;

