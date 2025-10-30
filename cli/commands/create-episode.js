/**
 * Create Episode Command
 * 
 * Handles the interactive episode creation process
 * Milestone 1.1: CLI Framework & Episode State Management
 */

const chalk = require('chalk');
const SongUploadStep = require('../steps/song-upload');

class CreateEpisodeCommand {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
    }

    async execute() {
        console.log('\n📝 Creating New Episode');
        console.log('━'.repeat(50));
        
        try {
            // Collect episode metadata
            const metadata = await this.collectMetadata();
            
            // Validate metadata
            const validationErrors = this.stateManager.validateEpisodeMetadata(metadata);
            if (validationErrors.length > 0) {
                console.log(chalk.red('\n❌ Validation Errors:'));
                validationErrors.forEach(error => console.log(chalk.red(`  • ${error}`)));
                return null;
            }
            
            // Check if episode already exists
            const episodeId = this.stateManager.generateEpisodeId(metadata.season, metadata.episodeNumber);
            const exists = await this.stateManager.episodeExists(episodeId);
            
            if (exists) {
                console.log(chalk.red(`\n❌ Episode ${episodeId} already exists!`));
                const overwrite = await this.question('Overwrite existing episode? (y/N): ');
                
                if (overwrite.toLowerCase() !== 'y') {
                    console.log(chalk.gray('Episode creation cancelled'));
                    return null;
                }
                
                // Delete existing episode first
                await this.stateManager.deleteEpisode(episodeId);
                console.log(chalk.yellow(`🗑️ Existing episode ${episodeId} deleted`));
            }
            
            // Create episode
            console.log(chalk.blue('\n🔄 Creating episode...'));
            const episode = await this.stateManager.createEpisode(metadata);
            
            // Display success
            this.displayCreationSuccess(episode);
            
            // Ask if user wants to upload song immediately
            const uploadSong = await this.question('\nWould you like to upload the song now? (Y/n): ');
            
            if (uploadSong.toLowerCase() !== 'n') {
                console.log('\n' + '═'.repeat(50));
                
                try {
                    const songUpload = new SongUploadStep(this.stateManager, this.rl);
                    await songUpload.execute(episode);
                } catch (error) {
                    console.warn(chalk.yellow('⚠️ Song upload failed, but episode was created successfully'));
                    console.warn(chalk.gray('You can upload the song later using "Continue Existing Episode"'));
                }
            }
            
            // Export YAML for validation
            await this.exportValidationYAML(episode);
            
            return episode;
            
        } catch (error) {
            console.error(chalk.red('\n❌ Episode creation failed:'), error.message);
            throw error;
        }
    }

    async collectMetadata() {
        console.log(chalk.yellow('\nStep 1 of 10: Episode Metadata'));
        console.log('─'.repeat(30));
        
        const metadata = {};
        
        // Season Number
        while (true) {
            const seasonInput = await this.question('Season Number (1-10): ');
            const season = parseInt(seasonInput);
            
            if (season >= 1 && season <= 10) {
                metadata.season = season;
                break;
            } else {
                console.log(chalk.red('❌ Please enter a valid season number (1-10)'));
            }
        }
        
        // Episode Number
        while (true) {
            const episodeInput = await this.question('Episode Number (1-20): ');
            const episodeNumber = parseInt(episodeInput);
            
            if (episodeNumber >= 1 && episodeNumber <= 20) {
                metadata.episodeNumber = episodeNumber;
                break;
            } else {
                console.log(chalk.red('❌ Please enter a valid episode number (1-20)'));
            }
        }
        
        // Episode Title
        while (true) {
            const title = await this.question('Episode Title: ');
            if (title.trim().length > 0) {
                metadata.title = title.trim();
                break;
            } else {
                console.log(chalk.red('❌ Episode title is required'));
            }
        }
        
        // Description (optional)
        const description = await this.question('Description (optional): ');
        if (description.trim().length > 0) {
            metadata.description = description.trim();
        }
        
        // Theme/Mood (optional)
        const theme = await this.question('Theme/Mood (optional): ');
        if (theme.trim().length > 0) {
            metadata.theme = theme.trim();
        }
        
        return metadata;
    }

    displayCreationSuccess(episode) {
        console.log(chalk.green('\n✅ Episode Created Successfully!'));
        console.log('━'.repeat(40));
        console.log(`📺 Episode ID: ${chalk.cyan(episode.id)}`);
        console.log(`🎬 Title: ${chalk.cyan(episode.title)}`);
        console.log(`📅 Season ${episode.season}, Episode ${episode.episodeNumber}`);
        console.log(`🔒 Status: ${chalk.yellow('Hidden')} (default)`);
        console.log(`⏰ Created: ${new Date(episode.createdAt).toLocaleString()}`);
        
        if (episode.description) {
            console.log(`📝 Description: ${episode.description}`);
        }
        
        if (episode.theme) {
            console.log(`🎨 Theme: ${episode.theme}`);
        }
        
        console.log('\n📊 Progress: Step 1/10 completed');
        console.log('Next Step: Song Upload');
    }

    async exportValidationYAML(episode) {
        try {
            const yamlData = await this.stateManager.exportEpisodeToYAML(episode.id);
            
            // Save to temp file for review
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, '../../temp');
            
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const yamlFile = path.join(tempDir, `episode-${episode.id}-validation.yaml`);
            fs.writeFileSync(yamlFile, yamlData);
            
            console.log(chalk.gray(`\n📄 YAML validation file saved: ${yamlFile}`));
            
        } catch (error) {
            console.warn(chalk.yellow('⚠️ Could not export YAML validation file:', error.message));
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

module.exports = CreateEpisodeCommand;