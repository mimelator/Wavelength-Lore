#!/usr/bin/env node

/**
 * Wavelength Episode Creator CLI
 * 
 * GitHub Issues: #128 (Milestone 1.1), #129 (Milestone 1.2), #130 (Milestone 2.1)
 * Phase 1 of Episode Creation Pipeline
 * 
 * Features:
 * - Episode creation with metadata collection
 * - Hidden/published status management
 * - Firebase integration for episode state
 * - Song upload and processing
 * - Episode deletion for testing
 */

const readline = require('readline');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Import utilities
const EpisodeStateManager = require('./utils/episode-state-manager');
const ProgressTracker = require('./utils/progress-tracker');

// Import commands
const CreateEpisodeCommand = require('./commands/create-episode');
const DeleteEpisodeCommand = require('./commands/delete-episode');
const BatchOperationsCommand = require('./commands/batch-operations');

// Import steps
const SongUploadStep = require('./steps/song-upload');

class EpisodeCreatorCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.stateManager = new EpisodeStateManager();
        this.progressTracker = new ProgressTracker();
        
        console.log(chalk.blue('🎵 Initializing Episode Creator CLI...'));
    }

    async start() {
        try {
            await this.showWelcome();
            await this.showMainMenu();
        } catch (error) {
            console.error(chalk.red('❌ CLI Error:'), error.message);
            process.exit(1);
        }
    }

    showWelcome() {
        console.clear();
        console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║   WAVELENGTH EPISODE CREATOR v1.0      ║
║   Episode Creation Pipeline            ║
╚════════════════════════════════════════╝
`));
        console.log(chalk.gray('Phase 1: Foundation & Content Management'));
        console.log(chalk.gray('Milestones 1.1 & 1.2: CLI Framework & Song Upload'));
        console.log();
    }

    async showMainMenu() {
        const choices = [
            '📝 Create New Episode',
            '🔄 Continue Existing Episode', 
            '📋 View Episode Status',
            '🗑️  Delete Episode (Testing)',
            '📦 Batch Operations',
            '❌ Exit'
        ];

        console.log(chalk.yellow('Main Menu'));
        console.log(chalk.yellow('─────────'));
        choices.forEach((choice, index) => {
            console.log(`${index + 1}. ${choice}`);
        });
        console.log();

        const answer = await this.question('📋 Choose an option (1-6): ');
        
        switch (answer.trim()) {
            case '1':
                await this.handleCreateEpisode();
                break;
            case '2':
                await this.handleContinueEpisode();
                break;
            case '3':
                await this.handleViewStatus();
                break;
            case '4':
                await this.handleDeleteEpisode();
                break;
            case '5':
                await this.handleBatchOperations();
                break;
            case '6':
                await this.exit();
                break;
            default:
                console.log(chalk.red('❌ Invalid choice'));
                await this.showMainMenu();
        }
    }

    async handleCreateEpisode() {
        console.log(chalk.green('\n📝 CREATE NEW EPISODE'));
        console.log(chalk.green('══════════════════════'));
        
        try {
            const createCommand = new CreateEpisodeCommand(this.stateManager, this.rl);
            const episode = await createCommand.execute();
            
            if (episode) {
                console.log(chalk.green(`✅ Episode created: ${episode.id}`));
                
                // Ask if user wants to continue with song upload
                const continueAnswer = await this.question('\n🎵 Continue with song upload? (Y/n): ');
                if (continueAnswer.toLowerCase() !== 'n') {
                    await this.handleSongUpload(episode);
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Episode creation failed:'), error.message);
        }
        
        await this.returnToMenu();
    }

    async handleSongUpload(episode) {
        console.log(chalk.blue('\n🎵 SONG UPLOAD'));
        console.log(chalk.blue('═══════════════'));
        
        try {
            const songUpload = new SongUploadStep(this.stateManager, this.rl);
            await songUpload.execute(episode);
            
            console.log(chalk.green('✅ Song upload completed'));
        } catch (error) {
            console.error(chalk.red('❌ Song upload failed:'), error.message);
        }
    }

    async handleContinueEpisode() {
        console.log(chalk.yellow('\n🔄 CONTINUE EXISTING EPISODE'));
        console.log(chalk.yellow('═══════════════════════════'));
        
        try {
            const inProgressEpisodes = await this.stateManager.getInProgressEpisodes();
            
            if (inProgressEpisodes.length === 0) {
                console.log(chalk.gray('No episodes in progress'));
                await this.returnToMenu();
                return;
            }
            
            console.log('\nIn-Progress Episodes:');
            console.log('────────────────────');
            inProgressEpisodes.forEach((episode, index) => {
                const progress = this.progressTracker.calculateProgress(episode);
                console.log(`${index + 1}. ${episode.id} - ${episode.title}`);
                console.log(`   Progress: Step ${progress.currentStep}/${progress.totalSteps}`);
                console.log(`   Last updated: ${new Date(episode.updatedAt).toLocaleString()}`);
                console.log();
            });
            
            const choice = await this.question('Select episode (number): ');
            const selectedIndex = parseInt(choice) - 1;
            
            if (selectedIndex >= 0 && selectedIndex < inProgressEpisodes.length) {
                const episode = inProgressEpisodes[selectedIndex];
                await this.resumeEpisode(episode);
            } else {
                console.log(chalk.red('❌ Invalid selection'));
            }
        } catch (error) {
            console.error(chalk.red('❌ Error loading episodes:'), error.message);
        }
        
        await this.returnToMenu();
    }

    async resumeEpisode(episode) {
        console.log(chalk.blue(`\n🔄 Resuming ${episode.id} - ${episode.title}`));
        console.log(chalk.blue('═'.repeat(50)));
        
        const progress = this.progressTracker.getProgress(episode);
        console.log(`Continuing from Step ${progress.currentStep}: ${progress.currentStepName}`);
        
        // For Phase 1, we only have song upload step
        if (progress.currentStep === 2) {
            await this.handleSongUpload(episode);
        } else {
            console.log(chalk.gray('Additional steps will be available in Phase 2'));
        }
    }

    async handleViewStatus() {
        console.log(chalk.cyan('\n📋 EPISODE STATUS'));
        console.log(chalk.cyan('══════════════════'));
        
        try {
            const allEpisodes = await this.stateManager.getAllEpisodes();
            
            if (allEpisodes.length === 0) {
                console.log(chalk.gray('No episodes found'));
                await this.returnToMenu();
                return;
            }
            
            console.log('\nAll Episodes:');
            console.log('─────────────');
            
            const hiddenEpisodes = allEpisodes.filter(ep => ep.status === 'hidden');
            const publishedEpisodes = allEpisodes.filter(ep => ep.status === 'published');
            
            if (hiddenEpisodes.length > 0) {
                console.log(chalk.yellow('\n🔒 Hidden Episodes:'));
                hiddenEpisodes.forEach(episode => {
                    const progress = this.progressTracker.calculateProgress(episode);
                    console.log(`  • ${episode.id} - ${episode.title}`);
                    console.log(`    Progress: ${progress.currentStep}/${progress.totalSteps} steps`);
                    console.log(`    Created: ${new Date(episode.createdAt).toLocaleDateString()}`);
                });
            }
            
            if (publishedEpisodes.length > 0) {
                console.log(chalk.green('\n🌟 Published Episodes:'));
                publishedEpisodes.forEach(episode => {
                    console.log(`  • ${episode.id} - ${episode.title}`);
                    console.log(`    Published: ${new Date(episode.publishedAt).toLocaleDateString()}`);
                });
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Error loading episode status:'), error.message);
        }
        
        await this.returnToMenu();
    }

    async handleDeleteEpisode() {
        console.log(chalk.red('\n🗑️  DELETE EPISODE (TESTING)'));
        console.log(chalk.red('═══════════════════════════'));
        console.log(chalk.yellow('⚠️  This is for testing only. Proper editing comes in Phase 5.'));
        
        try {
            const deleteCommand = new DeleteEpisodeCommand(this.stateManager, this.rl);
            await deleteCommand.execute();
        } catch (error) {
            console.error(chalk.red('❌ Episode deletion failed:'), error.message);
        }
        
        await this.returnToMenu();
    }

    async handleBatchOperations() {
        console.log(chalk.magenta('\n📦 BATCH OPERATIONS'));
        console.log(chalk.magenta('═══════════════════'));
        console.log(chalk.gray('Batch operations will be fully implemented in Phase 5'));
        
        try {
            const batchCommand = new BatchOperationsCommand(this.stateManager, this.rl);
            await batchCommand.execute();
        } catch (error) {
            console.error(chalk.red('❌ Batch operation failed:'), error.message);
        }
        
        await this.returnToMenu();
    }

    async returnToMenu() {
        console.log();
        await this.question('⏸️  Press Enter to continue...');
        await this.showMainMenu();
    }

    async exit() {
        console.log(chalk.cyan('\n👋 Goodbye!'));
        console.log(chalk.gray('Episode Creator CLI v1.0 - Phase 1 Implementation'));
        this.rl.close();
        process.exit(0);
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// CLI entry point
async function main() {
    const cli = new EpisodeCreatorCLI();
    await cli.start();
}

// Start CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = EpisodeCreatorCLI;