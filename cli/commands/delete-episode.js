/**
 * Delete Episode Command
 * 
 * Handles episode deletion for testing purposes
 * Note: Proper editing comes in Phase 5
 */

const chalk = require('chalk');

class DeleteEpisodeCommand {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
    }

    async execute() {
        try {
            // Get all episodes
            const allEpisodes = await this.stateManager.getAllEpisodes();
            
            if (allEpisodes.length === 0) {
                console.log(chalk.gray('\nNo episodes found to delete'));
                return;
            }
            
            // Display episodes
            console.log('\nAvailable Episodes:');
            console.log('─'.repeat(50));
            
            allEpisodes.forEach((episode, index) => {
                const statusColor = episode.status === 'published' ? chalk.green : chalk.yellow;
                console.log(`${index + 1}. ${chalk.cyan(episode.id)} - ${episode.title}`);
                console.log(`   Status: ${statusColor(episode.status.toUpperCase())}`);
                console.log(`   Created: ${new Date(episode.createdAt).toLocaleDateString()}`);
                console.log();
            });
            
            // Get user selection
            const choice = await this.question('Select episode to delete (number, or 0 to cancel): ');
            const selectedIndex = parseInt(choice) - 1;
            
            if (choice === '0') {
                console.log(chalk.gray('Deletion cancelled'));
                return;
            }
            
            if (selectedIndex < 0 || selectedIndex >= allEpisodes.length) {
                console.log(chalk.red('❌ Invalid selection'));
                return;
            }
            
            const selectedEpisode = allEpisodes[selectedIndex];
            
            // Confirm deletion
            console.log(chalk.red(`\n⚠️  About to delete episode: ${selectedEpisode.id} - ${selectedEpisode.title}`));
            console.log(chalk.red('This action cannot be undone!'));
            
            const confirm = await this.question('\nType "DELETE" to confirm: ');
            
            if (confirm !== 'DELETE') {
                console.log(chalk.gray('Deletion cancelled - confirmation text did not match'));
                return;
            }
            
            // Perform deletion
            console.log(chalk.blue('\n🔄 Deleting episode...'));
            await this.stateManager.deleteEpisode(selectedEpisode.id);
            
            // Display success
            console.log(chalk.green(`\n✅ Episode ${selectedEpisode.id} deleted successfully`));
            console.log(chalk.gray('Note: Associated S3 assets (if any) must be cleaned up manually'));
            
        } catch (error) {
            console.error(chalk.red('❌ Deletion failed:'), error.message);
            throw error;
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

module.exports = DeleteEpisodeCommand;