#!/usr/bin/env node

/**
 * Wavelength CLI Backup Test Interface
 * 
 * Quick test interface for backup functionality
 * Usage: node test-backup-cli.js backup create --type=all
 */

const chalk = require('chalk');
const BackupCommands = require('./commands/backup-commands');

class TestCLI {
    constructor() {
        this.backupCommands = new BackupCommands(this);
    }

    async handleCommand(input) {
        const args = input.split(' ');
        const command = args[0];

        try {
            switch (command) {
                case 'backup':
                    await this.backupCommands.handleBackupCommands(args.slice(1));
                    break;
                
                case 'help':
                case '?':
                    this.showHelp();
                    break;

                default:
                    console.log(chalk.red(`❌ Unknown command: ${command}`));
                    console.log(chalk.yellow('💡 Try "help" for available commands'));
            }
        } catch (error) {
            console.log(chalk.red('❌ Command failed:'), error.message);
        }
    }

    showHelp() {
        console.log(chalk.blue.bold('\n🌊 WAVELENGTH BACKUP CLI TEST'));
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.green('\nAvailable Commands:'));
        console.log('  backup create --type=all          - Create full backup');
        console.log('  backup list                       - List backups');
        console.log('  backup status                     - System status');
        console.log('  backup help                       - Backup commands help');
        console.log('  help                              - This help');
        console.log('');
    }
}

// Handle command line arguments
async function main() {
    const cli = new TestCLI();
    
    console.log(chalk.magenta.bold('🌊 WAVELENGTH BACKUP CLI'));
    console.log(chalk.magenta('========================'));
    
    // Get command from command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        cli.showHelp();
        return;
    }
    
    const command = args.join(' ');
    console.log(chalk.cyan(`Executing: ${command}\n`));
    
    await cli.handleCommand(command);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('Fatal error:'), error.message);
        process.exit(1);
    });
}

module.exports = TestCLI;