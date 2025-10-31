/**
 * Episode Management Commands for Wavelength CLI
 * 
 * Provides full CRUD operations for episodes through the CLI
 * Integrates with Firebase Episode Service for data persistence
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 */

const chalk = require('chalk');
const FirebaseEpisodeService = require('../services/firebase-episode-service');
const AssetExtractionService = require('../services/asset-extraction-service');

class EpisodeCommands {
    constructor(cli) {
        this.cli = cli;
        this.episodeService = null;
        this.initializeService();
    }

    async initializeService() {
        try {
            this.episodeService = new FirebaseEpisodeService();
        } catch (error) {
            console.log(chalk.yellow('⚠️ Episode service initialization failed:', error.message));
            console.log(chalk.gray('Episode management commands will show status only'));
        }
    }

    /**
     * Handle episode-related commands
     * @param {Array} args - Command arguments
     */
    async handleEpisodeCommands(args) {
        if (!args.length) {
            this.showEpisodeHelp();
            return;
        }

        const subCommand = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        try {
            switch (subCommand) {
                case 'create':
                    await this.createEpisode(commandArgs);
                    break;
                    
                case 'edit':
                case 'update':
                    await this.editEpisode(commandArgs);
                    break;
                    
                case 'delete':
                case 'remove':
                    await this.deleteEpisode(commandArgs);
                    break;
                    
                case 'view':
                case 'show':
                    await this.viewEpisode(commandArgs);
                    break;
                    
                case 'list':
                case 'ls':
                    await this.listEpisodes(commandArgs);
                    break;
                    
                case 'clone':
                case 'duplicate':
                    await this.cloneEpisode(commandArgs);
                    break;
                    
                case 'publish':
                    await this.publishEpisode(commandArgs);
                    break;
                    
                case 'validate':
                    await this.validateEpisode(commandArgs);
                    break;
                    
                case 'extract':
                case 'extract-assets':
                case 'assets':
                    await this.extractAssets(commandArgs);
                    break;
                    
                case 'search':
                    await this.searchEpisodes(commandArgs);
                    break;
                    
                case 'help':
                default:
                    this.showEpisodeHelp();
                    break;
            }
        } catch (error) {
            console.log(chalk.red('❌ Episode command failed:'), error.message);
        }
    }

    /**
     * Create new episode
     * @param {Array} args - Command arguments
     */
    async createEpisode(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        console.log(chalk.cyan.bold('\n🎬 CREATE NEW EPISODE'));
        console.log(chalk.gray('=' .repeat(50)));

        // Parse title from args or prompt
        let title = args.join(' ');
        if (!title) {
            title = await this.cli.promptUser('Episode title: ');
        }

        if (!title) {
            console.log(chalk.red('❌ Episode title is required'));
            return;
        }

        // Gather episode details
        const episodeData = {
            title: title.trim(),
            season: parseInt(await this.cli.promptUser('Season number: ')) || 1,
            episodeNumber: parseInt(await this.cli.promptUser('Episode number: ')) || 1,
            description: await this.cli.promptUser('Description (optional): ') || '',
            youtubeLink: await this.cli.promptUser('YouTube link (optional): ') || '',
            published: (await this.cli.promptUser('Publish immediately? (y/n): ')).toLowerCase() === 'y'
        };

        try {
            console.log(chalk.blue('\n🔄 Creating episode...'));
            const episodeId = await this.episodeService.createEpisode(episodeData);
            
            console.log(chalk.green(`\n✅ Episode created successfully!`));
            console.log(chalk.white(`📺 Episode ID: ${episodeId}`));
            console.log(chalk.white(`🎬 Title: ${episodeData.title}`));
            console.log(chalk.white(`📅 Season ${episodeData.season}, Episode ${episodeData.episodeNumber}`));
            console.log(chalk.white(`🔍 Status: ${episodeData.published ? 'Published' : 'Draft'}`));
            
            console.log(chalk.yellow('\n💡 Next steps:'));
            console.log(chalk.gray(`  • episodes edit ${episodeId} --interactive`));
            console.log(chalk.gray(`  • episodes validate ${episodeId} --check-images`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to create episode:'), error.message);
        }
    }

    /**
     * Edit existing episode
     * @param {Array} args - Command arguments
     */
    async editEpisode(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        const episodeId = args[0];
        if (!episodeId) {
            console.log(chalk.red('❌ Please specify episode ID'));
            console.log(chalk.gray('Usage: episodes edit <episode-id> [--field=value]'));
            return;
        }

        // Check if episode exists
        const episode = await this.episodeService.getEpisodeById(episodeId);
        if (!episode) {
            console.log(chalk.red(`❌ Episode "${episodeId}" not found`));
            return;
        }

        console.log(chalk.cyan.bold(`\n📝 EDITING EPISODE: ${episode.title}`));
        console.log(chalk.gray('=' .repeat(50)));

        // Check for inline field updates
        const fieldUpdates = this.parseFieldUpdates(args.slice(1));
        if (Object.keys(fieldUpdates).length > 0) {
            try {
                await this.episodeService.updateEpisode(episodeId, fieldUpdates);
                console.log(chalk.green(`✅ Updated ${Object.keys(fieldUpdates).join(', ')}`));
            } catch (error) {
                console.log(chalk.red('❌ Update failed:'), error.message);
            }
            return;
        }

        // Interactive editing
        if (args.includes('--interactive')) {
            await this.interactiveEpisodeEdit(episodeId, episode);
        } else {
            // Show current values and editing options
            this.displayEpisodeForEdit(episode);
            console.log(chalk.yellow('\n💡 Use --interactive for guided editing'));
            console.log(chalk.gray('Or specify field directly: episodes edit s1e1 --field=value'));
        }
    }

    /**
     * Interactive episode editing session
     * @param {string} episodeId - Episode identifier
     * @param {Object} episode - Current episode data
     */
    async interactiveEpisodeEdit(episodeId, episode) {
        const editableFields = [
            { key: 'title', name: 'Title', current: episode.title },
            { key: 'description', name: 'Description', current: episode.description || 'Not set' },
            { key: 'youtubeLink', name: 'YouTube Link', current: episode.youtubeLink || 'Not set' },
            { key: 'keywords', name: 'Keywords', current: episode.keywords?.join(', ') || 'None' },
            { key: 'characters', name: 'Characters', current: episode.characters?.join(', ') || 'None' },
            { key: 'published', name: 'Published', current: episode.published ? 'Yes' : 'No' }
        ];

        console.log(chalk.yellow('\nEditable fields:'));
        editableFields.forEach((field, index) => {
            const truncated = field.current.length > 50 
                ? field.current.substring(0, 50) + '...' 
                : field.current;
            console.log(chalk.white(`  ${index + 1}. ${field.name}`) + chalk.gray(` - ${truncated}`));
        });

        console.log(chalk.cyan('\nSpecial actions:'));
        console.log(chalk.white('  8. 📋 Manage Gallery Images'));
        console.log(chalk.white('  9. 🤖 AI Content Enhancement'));
        console.log(chalk.white('  10. 💾 Save & Exit'));
        console.log(chalk.white('  0. Cancel'));

        while (true) {
            const choice = await this.cli.promptUser('\nSelect field to edit (1-10, 0 to cancel): ');
            const choiceNum = parseInt(choice);

            if (choiceNum === 0) {
                console.log(chalk.gray('Edit cancelled'));
                break;
            } else if (choiceNum === 10) {
                console.log(chalk.green('✅ Changes saved'));
                break;
            } else if (choiceNum === 9) {
                await this.aiEnhanceEpisode(episodeId, episode);
            } else if (choiceNum === 8) {
                await this.manageEpisodeGallery(episodeId, episode);
            } else if (choiceNum >= 1 && choiceNum <= editableFields.length) {
                const field = editableFields[choiceNum - 1];
                await this.editEpisodeField(episodeId, field);
            } else {
                console.log(chalk.red('❌ Invalid choice'));
            }
        }
    }

    /**
     * Delete episode
     * @param {Array} args - Command arguments
     */
    async deleteEpisode(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        const episodeId = args[0];
        if (!episodeId) {
            console.log(chalk.red('❌ Please specify episode ID'));
            return;
        }

        const hardDelete = args.includes('--hard');
        const confirm = args.includes('--confirm');

        // Get episode for confirmation
        const episode = await this.episodeService.getEpisodeById(episodeId);
        if (!episode) {
            console.log(chalk.red(`❌ Episode "${episodeId}" not found`));
            return;
        }

        console.log(chalk.red.bold(`\n🗑️ DELETE EPISODE: ${episode.title}`));
        console.log(chalk.gray('=' .repeat(50)));

        if (hardDelete) {
            console.log(chalk.red('⚠️ PERMANENT DELETION - This cannot be undone!'));
        } else {
            console.log(chalk.yellow('🔒 Soft delete - Episode will be hidden but recoverable'));
        }

        if (!confirm) {
            const confirmation = await this.cli.promptUser(`Delete "${episode.title}"? Type "yes" to confirm: `);
            if (confirmation.toLowerCase() !== 'yes') {
                console.log(chalk.gray('Delete cancelled'));
                return;
            }
        }

        try {
            await this.episodeService.deleteEpisode(episodeId, hardDelete);
            
            if (hardDelete) {
                console.log(chalk.red(`🗑️ Episode "${episodeId}" permanently deleted`));
            } else {
                console.log(chalk.yellow(`🔒 Episode "${episodeId}" hidden (soft deleted)`));
            }

        } catch (error) {
            console.log(chalk.red('❌ Delete failed:'), error.message);
        }
    }

    /**
     * View episode details
     * @param {Array} args - Command arguments
     */
    async viewEpisode(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        const episodeId = args[0];
        if (!episodeId) {
            console.log(chalk.red('❌ Please specify episode ID'));
            return;
        }

        const episode = await this.episodeService.getEpisodeById(episodeId);
        if (!episode) {
            console.log(chalk.red(`❌ Episode "${episodeId}" not found`));
            return;
        }

        console.log(chalk.blue.bold(`\n📺 EPISODE: ${episode.title}`));
        console.log(chalk.gray('=' .repeat(50)));

        console.log(chalk.cyan('ID:'), episode.id);
        console.log(chalk.cyan('Season:'), episode.season);
        console.log(chalk.cyan('Episode:'), episode.episodeNumber);
        console.log(chalk.cyan('Status:'), episode.published ? chalk.green('Published') : chalk.yellow('Draft'));
        
        if (episode.description) {
            console.log(chalk.cyan('\nDescription:'));
            console.log(chalk.white(episode.description));
        }

        if (episode.youtubeLink) {
            console.log(chalk.cyan('\nYouTube:'), chalk.blue(episode.youtubeLink));
        }

        if (episode.keywords && episode.keywords.length > 0) {
            console.log(chalk.cyan('\nKeywords:'));
            console.log(chalk.gray(episode.keywords.join(', ')));
        }

        if (episode.characters && episode.characters.length > 0) {
            console.log(chalk.cyan('\nCharacters:'));
            console.log(chalk.gray(episode.characters.join(', ')));
        }

        if (episode.carouselImages && episode.carouselImages.length > 0) {
            console.log(chalk.cyan('\nGallery Images:'), chalk.white(episode.carouselImages.length));
        }

        if (episode.createdAt) {
            console.log(chalk.cyan('\nCreated:'), new Date(episode.createdAt).toLocaleDateString());
        }

        console.log('');
    }

    /**
     * List episodes with filtering
     * @param {Array} args - Command arguments
     */
    async listEpisodes(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        // Parse filters from args
        const filters = this.parseListFilters(args);
        
        console.log(chalk.blue.bold('\n📺 EPISODES'));
        if (Object.keys(filters).length > 0) {
            console.log(chalk.gray(`Filters: ${JSON.stringify(filters)}`));
        }
        console.log(chalk.gray('=' .repeat(50)));

        try {
            const episodes = await this.episodeService.getAllEpisodes(filters);
            
            if (episodes.length === 0) {
                console.log(chalk.yellow('No episodes found matching criteria'));
                return;
            }

            episodes.forEach((episode, index) => {
                const statusIcon = episode.published ? '✅' : '📝';
                const hiddenIcon = episode.hidden ? '🔒' : '';
                console.log(chalk.white(`${index + 1}. ${statusIcon}${hiddenIcon} ${episode.id}`));
                console.log(chalk.cyan(`   ${episode.title}`));
                console.log(chalk.gray(`   S${episode.season}E${episode.episodeNumber} • ${episode.keywords?.length || 0} keywords • ${episode.carouselImages?.length || 0} images`));
            });

            console.log(chalk.blue(`\nTotal: ${episodes.length} episodes`));

        } catch (error) {
            console.log(chalk.red('❌ Failed to list episodes:'), error.message);
        }
    }

    /**
     * Clone episode
     * @param {Array} args - Command arguments
     */
    async cloneEpisode(args) {
        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not available'));
            return;
        }

        const sourceId = args[0];
        const newTitle = args.slice(1).join(' ');

        if (!sourceId) {
            console.log(chalk.red('❌ Please specify source episode ID'));
            console.log(chalk.gray('Usage: episodes clone <source-id> "New Episode Title"'));
            return;
        }

        if (!newTitle) {
            console.log(chalk.red('❌ Please specify new episode title'));
            return;
        }

        console.log(chalk.blue.bold('\n📄 CLONE EPISODE'));
        console.log(chalk.gray('=' .repeat(50)));

        // Get new season and episode number
        const newSeason = parseInt(await this.cli.promptUser('New season number: ')) || 1;
        const newEpisodeNumber = parseInt(await this.cli.promptUser('New episode number: ')) || 1;

        const newData = {
            title: newTitle,
            season: newSeason,
            episodeNumber: newEpisodeNumber,
            published: false // Clone as draft by default
        };

        try {
            const newEpisodeId = await this.episodeService.cloneEpisode(sourceId, newData);
            
            console.log(chalk.green(`\n✅ Episode cloned successfully!`));
            console.log(chalk.white(`📺 Original: ${sourceId}`));
            console.log(chalk.white(`📺 Clone: ${newEpisodeId}`));
            console.log(chalk.white(`🎬 Title: ${newTitle}`));

        } catch (error) {
            console.log(chalk.red('❌ Clone failed:'), error.message);
        }
    }

    /**
     * Show episode help
     */
    showEpisodeHelp() {
        console.log(chalk.blue.bold('\n📺 EPISODE MANAGEMENT COMMANDS'));
        console.log(chalk.gray('=' .repeat(50)));
        
        console.log(chalk.green('\nCreation & Modification:'));
        console.log('  episodes create "Title" - Create new episode interactively');
        console.log('  episodes edit <id> --interactive - Interactive episode editor');
        console.log('  episodes edit <id> --field=value - Quick field update');
        console.log('  episodes delete <id> [--soft|--hard] - Delete episode');
        console.log('  episodes clone <id> "New Title" - Clone episode with new data');
        
        console.log(chalk.green('\nViewing & Discovery:'));
        console.log('  episodes view <id> - View episode details');
        console.log('  episodes list [--season=N] [--published] - List episodes');
        console.log('  episodes search "text" - Search episode titles/descriptions');
        console.log('  episodes validate <id> [--check-images] - Validate episode');
        
        console.log(chalk.green('\nAsset Extraction:'));
        console.log('  episodes extract [episode-id] - Extract assets from episode images or any gallery');
        console.log('  episodes extract                - Interactive gallery browser (lore/characters/episodes)');
        console.log('  episodes assets <id> - Alias for extract');
        
        console.log(chalk.green('\nPublishing:'));
        console.log('  episodes publish <id> --status=published - Publish episode');
        console.log('  episodes publish <id> --status=draft - Unpublish episode');
        
        console.log(chalk.yellow('\n💡 Examples:'));
        console.log(chalk.gray('  episodes create "The Final Battle"'));
        console.log(chalk.gray('  episodes edit s4e9 --title="Battle of the Shire"'));
        console.log(chalk.gray('  episodes list --season=1 --published=false'));
        console.log(chalk.gray('  episodes clone s1e1 "Lucky Charm Remake"'));
        console.log(chalk.gray('  episodes extract s5e1 - Extract assets from episode images'));
        console.log(chalk.gray('  episodes extract      - Browse any gallery and extract assets'));
        
        console.log('');
    }

    // Helper Methods

    /**
     * Parse field updates from command arguments
     * @param {Array} args - Command arguments
     * @returns {Object} - Field updates object
     */
    parseFieldUpdates(args) {
        const updates = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--') && arg.includes('=')) {
                const [key, ...valueParts] = arg.substring(2).split('=');
                const value = valueParts.join('=');
                
                // Parse different value types
                if (value === 'true' || value === 'false') {
                    updates[key] = value === 'true';
                } else if (!isNaN(value) && value.trim() !== '') {
                    updates[key] = parseFloat(value);
                } else {
                    updates[key] = value;
                }
            }
        });
        
        return updates;
    }

    /**
     * Parse list filters from command arguments
     * @param {Array} args - Command arguments
     * @returns {Object} - Filters object
     */
    parseListFilters(args) {
        const filters = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--') && arg.includes('=')) {
                const [key, value] = arg.substring(2).split('=');
                
                switch (key) {
                    case 'season':
                        filters.season = parseInt(value);
                        break;
                    case 'published':
                        filters.published = value === 'true';
                        break;
                    case 'hidden':
                        filters.hidden = value === 'true';
                        break;
                    case 'search':
                        filters.search = value;
                        break;
                }
            }
        });
        
        return filters;
    }

    /**
     * Display episode data for editing
     * @param {Object} episode - Episode object
     */
    displayEpisodeForEdit(episode) {
        console.log(chalk.cyan('Current Values:'));
        console.log(chalk.white(`  Title: ${episode.title}`));
        console.log(chalk.white(`  Season: ${episode.season}, Episode: ${episode.episodeNumber}`));
        console.log(chalk.white(`  Description: ${episode.description || 'Not set'}`));
        console.log(chalk.white(`  YouTube: ${episode.youtubeLink || 'Not set'}`));
        console.log(chalk.white(`  Keywords: ${episode.keywords?.join(', ') || 'None'}`));
        console.log(chalk.white(`  Published: ${episode.published ? 'Yes' : 'No'}`));
        console.log(chalk.white(`  Gallery Images: ${episode.carouselImages?.length || 0}`));
    }

    /**
     * Edit individual episode field
     * @param {string} episodeId - Episode ID
     * @param {Object} field - Field configuration
     */
    async editEpisodeField(episodeId, field) {
        console.log(chalk.cyan(`\n📝 Editing: ${field.name}`));
        console.log(chalk.gray(`Current: ${field.current}`));
        
        const newValue = await this.cli.promptUser(`Enter new ${field.name.toLowerCase()}: `);
        
        if (newValue.trim()) {
            const updates = {};
            
            // Handle special field types
            if (field.key === 'published') {
                updates[field.key] = newValue.toLowerCase() === 'true' || newValue.toLowerCase() === 'yes';
            } else if (field.key === 'keywords' || field.key === 'characters') {
                updates[field.key] = newValue.split(',').map(item => item.trim()).filter(item => item);
            } else {
                updates[field.key] = newValue.trim();
            }
            
            try {
                await this.episodeService.updateEpisode(episodeId, updates);
                console.log(chalk.green(`✅ ${field.name} updated`));
            } catch (error) {
                console.log(chalk.red(`❌ Failed to update ${field.name}:`, error.message));
            }
        }
    }

    /**
     * AI enhance episode content
     * @param {string} episodeId - Episode ID
     * @param {Object} episode - Episode object
     */
    async aiEnhanceEpisode(episodeId, episode) {
        console.log(chalk.cyan('\n🤖 AI EPISODE ENHANCEMENT'));
        console.log(chalk.yellow('This feature will integrate with AI services for content enhancement'));
        console.log(chalk.gray(`Enhancing episode: ${episode.title}`));
        console.log(chalk.blue('🔮 Feature framework ready - AI service integration needed'));
    }

    /**
     * Manage episode gallery images
     * @param {string} episodeId - Episode ID
     * @param {Object} episode - Episode object
     */
    async manageEpisodeGallery(episodeId, episode) {
        console.log(chalk.cyan('\n📋 EPISODE GALLERY MANAGEMENT'));
        
        const currentImages = episode.carouselImages || [];
        console.log(chalk.gray(`Current images: ${currentImages.length}`));
        
        if (currentImages.length > 0) {
            currentImages.forEach((img, i) => {
                console.log(chalk.white(`  ${i + 1}. ${img}`));
            });
        }
        
        console.log('\nOptions:');
        console.log('  1. Add image URL');
        console.log('  2. Remove image');
        console.log('  3. Sync with file system');
        console.log('  0. Back');
        
        const choice = await this.cli.promptUser('Choose action: ');
        
        if (choice === '1') {
            const imageUrl = await this.cli.promptUser('Image URL: ');
            if (imageUrl.trim()) {
                currentImages.push(imageUrl.trim());
                await this.episodeService.updateEpisode(episodeId, { carouselImages: currentImages });
                console.log(chalk.green('✅ Image added'));
            }
        } else if (choice === '2' && currentImages.length > 0) {
            const index = parseInt(await this.cli.promptUser('Image number to remove: ')) - 1;
            if (index >= 0 && index < currentImages.length) {
                currentImages.splice(index, 1);
                await this.episodeService.updateEpisode(episodeId, { carouselImages: currentImages });
                console.log(chalk.green('✅ Image removed'));
            }
        } else if (choice === '3') {
            console.log(chalk.blue('🔄 Syncing with file system...'));
            console.log(chalk.gray('This would scan the episode directory for new images'));
        }
    }

    /**
     * Extract assets from any gallery (with approval workflow)
     * @param {Array} args - Command arguments
     */
    async extractAssets(args) {
        const skipApproval = args.includes('--skip-approval') || args.includes('--auto-approve');
        const episodeIdArg = args.find(arg => !arg.startsWith('--'));

        if (!this.episodeService) {
            console.log(chalk.red('❌ Episode service not initialized'));
            return;
        }

        try {
            let sourceImages = [];
            let sourceInfo = {};

            // If episode ID provided, use legacy workflow (episode images)
            if (episodeIdArg && !episodeIdArg.includes(':')) {
                const episode = await this.episodeService.getEpisodeById(episodeIdArg);
                
                if (!episode) {
                    console.log(chalk.red(`❌ Episode not found: ${episodeIdArg}`));
                    return;
                }

                sourceImages = episode.approvedImages || episode.images || episode.carouselImages || [];
                sourceInfo = {
                    type: 'episode',
                    id: episodeIdArg,
                    title: episode.title || episodeIdArg,
                    season: episode.season,
                    episodeNumber: episode.episodeNumber || episode.episode
                };

                if (sourceImages.length === 0) {
                    console.log(chalk.yellow('⚠️  No images found in episode'));
                    console.log(chalk.gray('   Please add images to the episode first (via image generation or upload)'));
                    return;
                }
            } else {
                // New workflow: select content type and gallery
                const workflowResult = await this.selectSourceImageAndEpisode();
                if (!workflowResult) {
                    return; // User cancelled
                }
                sourceImages = workflowResult.sourceImages;
                sourceInfo = workflowResult.sourceInfo;
            }

            // Get target episode (for asset manifest)
            let targetEpisode;
            if (sourceInfo.type === 'episode') {
                targetEpisode = {
                    id: sourceInfo.id,
                    season: sourceInfo.season,
                    episodeNumber: sourceInfo.episodeNumber
                };
            } else {
                // Prompt for target episode
                const episodeId = await this.cli.promptUser(chalk.cyan('\n📺 Target Episode for Assets:\n') + 
                    chalk.yellow('Enter episode ID (e.g., s5e1) to associate these assets: '));
                
                if (!episodeId) {
                    console.log(chalk.red('❌ Episode ID required to save assets'));
                    return;
                }

                targetEpisode = await this.episodeService.getEpisodeById(episodeId);
                if (!targetEpisode) {
                    console.log(chalk.red(`❌ Episode not found: ${episodeId}`));
                    return;
                }

                console.log(chalk.green(`✅ Assets will be saved for: ${targetEpisode.title || episodeId}`));
            }

            console.log(chalk.cyan(`\n🎨 Extracting assets from: ${sourceInfo.title || sourceInfo.id}`));
            console.log(chalk.gray(`   Source: ${sourceInfo.type} | Images: ${sourceImages.length}`));
            console.log(chalk.gray(`   Target episode: ${targetEpisode.title || targetEpisode.id || targetEpisode}`));

            // Initialize asset extraction service (validates AI setup)
            console.log(chalk.cyan('🔍 Validating AI extraction setup...'));
            const assetService = new AssetExtractionService();
            
            // Wait a moment for async rembg check to complete
            if (assetService.useAIEnhancement) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Extract assets in preview mode (don't upload yet)
            const result = await assetService.extractEpisodeAssets({
                episodeId: targetEpisode.id || targetEpisode,
                season: targetEpisode.season,
                episodeNumber: targetEpisode.episodeNumber || targetEpisode.episode,
                sourceImages
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

            // Skip approval if requested
            if (skipApproval) {
                console.log(chalk.yellow('\n⚠️  Auto-approving all assets (--skip-approval flag)...'));
                
                const approvedResult = await assetService.approveAndSaveAssets(pendingAssets.assets, {
                    episodeId: targetEpisode.id || targetEpisode,
                    season: targetEpisode.season,
                    episodeNumber: targetEpisode.episodeNumber || targetEpisode.episode
                });

                if (approvedResult.success) {
                    console.log(chalk.green('\n✅ All assets approved and saved!'));
                    console.log(chalk.gray(`   Manifest: ${approvedResult.manifestPath}`));
                }
                return;
            }

            // Show preview and collect approvals
            console.log(chalk.cyan('\n📋 Review & Approval Workflow'));
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

            // Create preview HTML
            const fs = require('fs').promises;
            const path = require('path');
            const os = require('os');
            const tempFile = path.join(os.tmpdir(), `asset-preview-${Date.now()}.html`);
            
            console.log(chalk.cyan('\n🖼️  Generating preview page...'));
            await assetService.createPreviewHTML(pendingAssets, tempFile);
            
            // Try to open in browser
            try {
                const open = require('open');
                await open(tempFile);
                console.log(chalk.green('✅ Preview opened in browser'));
            } catch (e) {
                console.log(chalk.yellow('💡 Preview file created (browser not auto-opened):'));
            }
            
            console.log(chalk.gray(`   Preview file: ${tempFile}`));
            console.log(chalk.yellow('\n💡 Review assets in the browser, then return here to approve/reject.'));

            // Interactive approval workflow
            await this.approveAssetsInteractively(assetService, pendingAssets, {
                episodeId: targetEpisode.id || targetEpisode,
                season: targetEpisode.season,
                episodeNumber: targetEpisode.episodeNumber || targetEpisode.episode
            });

        } catch (error) {
            console.log(chalk.red(`❌ Asset extraction failed: ${error.message}`));
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
        }
    }

    /**
     * Interactive workflow to select source image from any gallery
     */
    async selectSourceImageAndEpisode() {
        const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
        const loreHelpers = require('../helpers/lore-helpers');

        console.log(chalk.cyan('\n🎨 Asset Extraction from Gallery'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.yellow('Select a content type to browse galleries:\n'));

        // Content type selection
        const contentTypeChoice = await this.cli.promptUser(
            chalk.cyan('Content Type:\n') +
            chalk.gray('  1. Lore (places, things, concepts)\n') +
            chalk.gray('  2. Characters\n') +
            chalk.gray('  3. Episodes\n') +
            chalk.yellow('\nSelect (1-3): ')
        );

        let contentType, contentId, item;
        const contentTypes = { '1': 'lore', '2': 'characters', '3': 'episodes' };
        contentType = contentTypes[contentTypeChoice?.trim()];

        if (!contentType) {
            console.log(chalk.red('❌ Invalid selection'));
            return null;
        }

        // Get content ID
        contentId = await this.cli.promptUser(
            chalk.cyan(`\n📝 Enter ${contentType.slice(0, -1)} ID: `) + 
            chalk.gray(`(e.g., daphne-flower, andrew, s5e1)\n`)
        );

        if (!contentId) {
            console.log(chalk.red('❌ Content ID required'));
            return null;
        }

        // Fetch the item
        try {
            if (contentType === 'lore') {
                item = loreHelpers.getLoreByIdSync(contentId);
                if (!item) {
                    const loreData = await fetchDataAsAdmin('lore');
                    item = loreData?.[contentId];
                }
            } else if (contentType === 'characters') {
                const charData = await fetchDataAsAdmin('characters');
                item = charData?.[contentId];
            } else if (contentType === 'episodes') {
                item = await this.episodeService.getEpisodeById(contentId);
            }

            if (!item) {
                console.log(chalk.red(`❌ ${contentType.slice(0, -1)} not found: ${contentId}`));
                return null;
            }

            console.log(chalk.green(`✅ Found: ${item.title || item.name || contentId}`));

        } catch (error) {
            console.log(chalk.red(`❌ Error loading ${contentType.slice(0, -1)}: ${error.message}`));
            return null;
        }

        // Get images from the item
        let images = [];
        if (contentType === 'lore') {
            if (item.image) images.push(item.image);
            if (item.image_gallery && Array.isArray(item.image_gallery)) {
                images.push(...item.image_gallery);
            }
        } else if (contentType === 'characters') {
            if (item.image) images.push(item.image);
            if (item.image_gallery && Array.isArray(item.image_gallery)) {
                images.push(...item.image_gallery);
            }
            if (item.avatarGallery && Array.isArray(item.avatarGallery)) {
                images.push(...item.avatarGallery);
            }
        } else if (contentType === 'episodes') {
            images = item.approvedImages || item.images || item.carouselImages || [];
        }

        if (images.length === 0) {
            console.log(chalk.yellow(`⚠️  No images found in ${contentType.slice(0, -1)} gallery`));
            return null;
        }

        // Filter out empty/null images
        images = images.filter(img => img && img.trim());

        if (images.length === 0) {
            console.log(chalk.yellow(`⚠️  No valid images found`));
            return null;
        }

        console.log(chalk.green(`\n🖼️  Found ${images.length} image(s) in gallery:\n`));
        images.forEach((img, i) => {
            console.log(chalk.gray(`  ${i + 1}. ${img}`));
        });

        // Select image(s)
        const imageChoice = await this.cli.promptUser(
            chalk.cyan('\n📸 Select image(s):\n') +
            chalk.gray(`  1-${images.length}: Single image\n`) +
            chalk.gray('  all: All images\n') +
            chalk.yellow(`\nChoice (1-${images.length}, all, or Enter for first): `)
        );

        let selectedImages = [];
        if (!imageChoice || imageChoice.trim() === '' || imageChoice.trim() === 'first') {
            selectedImages = [images[0]];
        } else if (imageChoice.toLowerCase().trim() === 'all') {
            selectedImages = images;
        } else {
            const index = parseInt(imageChoice.trim()) - 1;
            if (index >= 0 && index < images.length) {
                selectedImages = [images[index]];
            } else {
                console.log(chalk.red('❌ Invalid selection'));
                return null;
            }
        }

        console.log(chalk.green(`✅ Selected ${selectedImages.length} image(s) for extraction`));

        return {
            sourceImages: selectedImages,
            sourceInfo: {
                type: contentType,
                id: contentId,
                title: item.title || item.name || contentId
            }
        };
    }

    /**
     * Interactive asset approval workflow
     */
    async approveAssetsInteractively(assetService, pendingAssets, config) {
        const allAssets = [];
        
        // Collect all assets with their metadata
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
            console.log(chalk.yellow('⚠️  No assets to approve'));
            return;
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
        console.log(chalk.gray('  - Approve individually: type asset number or "y"'));
        console.log(chalk.gray('  - Reject: type "n"'));
        console.log(chalk.gray('  - Skip to save: type "save" or "done"\n'));

        for (let i = 0; i < allAssets.length; i++) {
            const asset = allAssets[i];
            
            console.log(chalk.cyan(`\n[${i + 1}/${allAssets.length}] ${asset.displayName}`));
            console.log(chalk.gray(`   Type: ${asset.category} | Size: ${asset.size || 'N/A'} | Format: ${asset.format}`));
            
            // Show preview URL if available
            if (asset.buffer) {
                const dataUrl = assetService.bufferToDataUrl(
                    asset.buffer, 
                    asset.format === 'jpg' ? 'image/jpeg' : `image/${asset.format}`
                );
                console.log(chalk.gray(`   Preview: Available (in browser)`));
            }

            const response = await this.cli.promptUser(chalk.yellow('Approve this asset? (y/n/all/reject all/save, default: y): '));
            const answer = response.toLowerCase().trim();

            if (answer === 'all' || answer === 'a') {
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
            } else if (answer === 'reject all' || answer === 'r') {
                console.log(chalk.red(`❌ Rejecting all remaining ${allAssets.length - i} assets...`));
                break;
            } else if (answer === 'save' || answer === 'done') {
                console.log(chalk.yellow('⏭️  Skipping remaining assets'));
                break;
            } else if (answer === 'n' || answer === 'no') {
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

        // Summary
        const totalApproved = 
            approvedAssets.navigationIcons.length +
            approvedAssets.badges.length +
            approvedAssets.gameAssets.length;
        const totalRejected = allAssets.length - totalApproved;

        console.log(chalk.cyan('\n📊 Approval Summary:'));
        console.log(chalk.green(`   ✅ Approved: ${totalApproved}`));
        console.log(chalk.red(`   ❌ Rejected: ${totalRejected}`));

        if (totalApproved === 0) {
            console.log(chalk.yellow('\n⚠️  No assets approved. Nothing will be saved.'));
            return;
        }

        // Save approved assets
        const saveResponse = await this.cli.promptUser(chalk.yellow(`\n💾 Save ${totalApproved} approved asset(s)? (y/n, default: y): `));
        if (saveResponse.toLowerCase().trim() === 'n') {
            console.log(chalk.yellow('⚠️  Approval cancelled'));
            return;
        }

        const approvedResult = await assetService.approveAndSaveAssets(approvedAssets, config);

        if (approvedResult.success) {
            console.log(chalk.green('\n✅ Approved assets saved successfully!'));
            console.log(chalk.gray(`   Manifest: ${approvedResult.manifestPath}`));
            console.log(chalk.yellow('\n💡 You can run extraction again to regenerate rejected assets.'));
        }
    }
}

module.exports = EpisodeCommands;