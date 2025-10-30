/**
 * Batch Operations Command
 * 
 * Basic batch operations for Phase 1
 * Full implementation comes in Phase 5
 */

const chalk = require('chalk');

class BatchOperationsCommand {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
    }

    async execute() {
        console.log(chalk.gray('📦 Batch Operations - Phase 1 Preview'));
        console.log(chalk.gray('Full batch operations will be available in Phase 5'));
        console.log();
        
        const choices = [
            'View All Episodes Summary',
            'Export All Episodes to YAML',
            'Delete Multiple Episodes (Testing)',
            'Back to Main Menu'
        ];
        
        console.log('Available Operations:');
        console.log('─'.repeat(30));
        choices.forEach((choice, index) => {
            console.log(`${index + 1}. ${choice}`);
        });
        console.log();
        
        const answer = await this.question('Choose operation (1-4): ');
        
        switch (answer.trim()) {
            case '1':
                await this.viewAllEpisodesSummary();
                break;
            case '2':
                await this.exportAllEpisodesToYAML();
                break;
            case '3':
                await this.deleteMultipleEpisodes();
                break;
            case '4':
                console.log(chalk.gray('Returning to main menu...'));
                break;
            default:
                console.log(chalk.red('❌ Invalid choice'));
        }
    }

    async viewAllEpisodesSummary() {
        try {
            console.log(chalk.cyan('\n📊 ALL EPISODES SUMMARY'));
            console.log('═'.repeat(40));
            
            const allEpisodes = await this.stateManager.getAllEpisodes();
            
            if (allEpisodes.length === 0) {
                console.log(chalk.gray('No episodes found'));
                return;
            }
            
            const ProgressTracker = require('../utils/progress-tracker');
            const progressTracker = new ProgressTracker();
            
            // Group by status
            const hiddenEpisodes = allEpisodes.filter(ep => ep.status === 'hidden');
            const publishedEpisodes = allEpisodes.filter(ep => ep.status === 'published');
            
            console.log(`📈 Total Episodes: ${allEpisodes.length}`);
            console.log(`🔒 Hidden: ${hiddenEpisodes.length}`);
            console.log(`🌟 Published: ${publishedEpisodes.length}`);
            console.log();
            
            // Show detailed info
            allEpisodes.forEach(episode => {
                const progress = progressTracker.calculateProgress(episode);
                const statusColor = episode.status === 'published' ? chalk.green : chalk.yellow;
                
                console.log(`${chalk.cyan(episode.id)} - ${episode.title}`);
                console.log(`  Status: ${statusColor(episode.status.toUpperCase())}`);
                console.log(`  Progress: ${progressTracker.createProgressBar(episode)}`);
                console.log(`  Created: ${new Date(episode.createdAt).toLocaleDateString()}`);
                console.log();
            });
            
        } catch (error) {
            console.error(chalk.red('❌ Failed to load episodes summary:'), error.message);
        }
    }

    async exportAllEpisodesToYAML() {
        try {
            console.log(chalk.blue('\n📄 EXPORTING ALL EPISODES TO YAML'));
            console.log('═'.repeat(45));
            
            const allEpisodes = await this.stateManager.getAllEpisodes();
            
            if (allEpisodes.length === 0) {
                console.log(chalk.gray('No episodes found to export'));
                return;
            }
            
            const fs = require('fs');
            const path = require('path');
            const yaml = require('js-yaml');
            
            // Create exports directory
            const exportsDir = path.join(__dirname, '../../exports');
            if (!fs.existsSync(exportsDir)) {
                fs.mkdirSync(exportsDir, { recursive: true });
            }
            
            console.log(`\n🔄 Exporting ${allEpisodes.length} episodes...`);
            
            for (const episode of allEpisodes) {
                const yamlData = await this.stateManager.exportEpisodeToYAML(episode.id);
                const filename = `episode-${episode.id}-export.yaml`;
                const filepath = path.join(exportsDir, filename);
                
                fs.writeFileSync(filepath, yamlData);
                console.log(`  ✅ ${episode.id} → ${filename}`);
            }
            
            // Create combined export
            const allEpisodesData = {
                exportedAt: new Date().toISOString(),
                totalEpisodes: allEpisodes.length,
                episodes: allEpisodes.reduce((acc, episode) => {
                    acc[episode.id] = {
                        id: episode.id,
                        title: episode.title,
                        season: episode.season,
                        episodeNumber: episode.episodeNumber,
                        status: episode.status,
                        createdAt: episode.createdAt,
                        publishedAt: episode.publishedAt
                    };
                    return acc;
                }, {})
            };
            
            const combinedYaml = yaml.dump(allEpisodesData, { indent: 2 });
            const combinedPath = path.join(exportsDir, 'all-episodes-summary.yaml');
            fs.writeFileSync(combinedPath, combinedYaml);
            
            console.log(chalk.green(`\n✅ Export completed!`));
            console.log(`📁 Individual files: ${exportsDir}`);
            console.log(`📋 Summary file: all-episodes-summary.yaml`);
            
        } catch (error) {
            console.error(chalk.red('❌ Export failed:'), error.message);
        }
    }

    async deleteMultipleEpisodes() {
        try {
            console.log(chalk.red('\n🗑️  DELETE MULTIPLE EPISODES'));
            console.log(chalk.red('═'.repeat(35)));
            console.log(chalk.yellow('⚠️  This is for testing only!'));
            
            const allEpisodes = await this.stateManager.getAllEpisodes();
            
            if (allEpisodes.length === 0) {
                console.log(chalk.gray('No episodes found to delete'));
                return;
            }
            
            console.log('\nSelect episodes to delete (space-separated numbers):');
            console.log('─'.repeat(50));
            
            allEpisodes.forEach((episode, index) => {
                const statusColor = episode.status === 'published' ? chalk.green : chalk.yellow;
                console.log(`${index + 1}. ${chalk.cyan(episode.id)} - ${episode.title} (${statusColor(episode.status)})`);
            });
            
            console.log('\nExample: "1 3 5" to delete episodes 1, 3, and 5');
            const selection = await this.question('Episodes to delete (or 0 to cancel): ');
            
            if (selection.trim() === '0') {
                console.log(chalk.gray('Batch deletion cancelled'));
                return;
            }
            
            // Parse selection
            const indices = selection.split(' ')
                .map(s => parseInt(s.trim()) - 1)
                .filter(i => i >= 0 && i < allEpisodes.length);
            
            if (indices.length === 0) {
                console.log(chalk.red('❌ No valid episodes selected'));
                return;
            }
            
            const selectedEpisodes = indices.map(i => allEpisodes[i]);
            
            // Confirm deletion
            console.log(chalk.red(`\n⚠️  About to delete ${selectedEpisodes.length} episodes:`));
            selectedEpisodes.forEach(episode => {
                console.log(chalk.red(`  • ${episode.id} - ${episode.title}`));
            });
            
            const confirm = await this.question('\nType "DELETE ALL" to confirm: ');
            
            if (confirm !== 'DELETE ALL') {
                console.log(chalk.gray('Batch deletion cancelled - confirmation text did not match'));
                return;
            }
            
            // Perform deletions
            console.log(chalk.blue('\n🔄 Deleting episodes...'));
            let deletedCount = 0;
            
            for (const episode of selectedEpisodes) {
                try {
                    await this.stateManager.deleteEpisode(episode.id);
                    console.log(chalk.green(`  ✅ ${episode.id} deleted`));
                    deletedCount++;
                } catch (error) {
                    console.log(chalk.red(`  ❌ Failed to delete ${episode.id}: ${error.message}`));
                }
            }
            
            console.log(chalk.green(`\n✅ Batch deletion completed: ${deletedCount}/${selectedEpisodes.length} episodes deleted`));
            
        } catch (error) {
            console.error(chalk.red('❌ Batch deletion failed:'), error.message);
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

module.exports = BatchOperationsCommand;