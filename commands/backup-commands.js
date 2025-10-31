/**
 * Backup Commands for Wavelength Content CLI
 * 
 * Provides comprehensive backup and restore functionality for all content types
 * Integrates with the existing SecureDatabaseBackup system
 * 
 * Commands:
 * - backup create --type=all|episodes|characters|songs|lore [--timestamp]
 * - backup list [--type=daily|weekly|manual] [--limit=50]
 * - backup restore <backup-key> [--target-path] [--dry-run]
 * - backup status
 * - backup validate <backup-key>
 * - backup cleanup --older-than=30d [--dry-run]
 */

const chalk = require('chalk');
const SecureDatabaseBackup = require('../utils/secureBackup');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Ensure environment variables are loaded
require('dotenv').config();

class BackupCommands {
    constructor(cli) {
        this.cli = cli;
        this.backupSystem = null;
        this.initializeBackupSystem();
    }

    /**
     * Initialize backup system if not already available
     */
    async initializeBackupSystem() {
        try {
            // Try to use existing backup system from app if available
            if (this.cli?.app?.locals?.backupSystem) {
                this.backupSystem = this.cli.app.locals.backupSystem;
                console.log(chalk.green('✅ Using existing backup system'));
                return;
            }

            // Debug: Check if environment variables are loaded
            console.log(chalk.gray('🔍 AWS Credentials Check:'));
            console.log(chalk.gray(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`));
            console.log(chalk.gray(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}`));
            console.log(chalk.gray(`   BACKUP_S3_BUCKET: ${process.env.BACKUP_S3_BUCKET || 'Using default'}`));

            // Create new backup system instance with proper AWS credentials
            const backupConfig = {
                // Use AWS backup credentials from .env
                bucketName: process.env.BACKUP_S3_BUCKET || 'wavelength-lore-backups',
                region: process.env.BACKUP_S3_REGION || 'us-east-1',
                retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
                compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
                encryptionEnabled: process.env.BACKUP_ENCRYPTION !== 'false',
                dailyBackupTime: process.env.BACKUP_DAILY_TIME || '0 2 * * *',
                weeklyBackupTime: process.env.BACKUP_WEEKLY_TIME || '0 3 * * 0',
                tempDir: process.env.BACKUP_TEMP_DIR || './temp/backups'
            };

            this.backupSystem = new SecureDatabaseBackup(backupConfig);
            
            // Check if system is initialized
            if (!this.backupSystem.isInitialized) {
                console.log(chalk.yellow('🔧 Initializing backup system...'));
                await this.backupSystem.initialize();
            }
            
            console.log(chalk.green('✅ Backup system ready'));
        } catch (error) {
            console.log(chalk.red('❌ Backup system initialization failed:'), error.message);
            console.log(chalk.yellow('💡 Some backup features may not be available'));
            
            // Show specific error guidance
            if (error.message.includes('AWS') || error.message.includes('S3')) {
                console.log(chalk.gray('   AWS Configuration Required:'));
                console.log(chalk.gray('   - Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'));
                console.log(chalk.gray('   - Or check .env file for backup credentials'));
            }
            if (error.message.includes('Firebase') || error.message.includes('service account')) {
                console.log(chalk.gray('   Firebase Configuration Required:'));
                console.log(chalk.gray('   - Set FIREBASE_SERVICE_ACCOUNT in .env'));
                console.log(chalk.gray('   - Or add individual Firebase environment variables'));
            }
        }
    }

    /**
     * Handle backup commands
     */
    async handleBackupCommands(args) {
        if (args.length === 0) {
            this.showBackupHelp();
            return;
        }

        const command = args[0];

        try {
            switch (command) {
                case 'create':
                    await this.createBackup(args.slice(1));
                    break;

                case 'list':
                    await this.listBackups(args.slice(1));
                    break;

                case 'restore':
                    await this.restoreBackup(args.slice(1));
                    break;

                case 'status':
                    await this.showBackupStatus(args.slice(1));
                    break;

                case 'validate':
                    await this.validateBackup(args.slice(1));
                    break;

                case 'cleanup':
                    await this.cleanupBackups(args.slice(1));
                    break;

                case 'help':
                default:
                    this.showBackupHelp();
                    break;
            }
        } catch (error) {
            console.log(chalk.red('❌ Backup command failed:'), error.message);
        }
    }

    /**
     * Create a backup
     */
    async createBackup(args) {
        console.log(chalk.cyan('\n💾 CREATING BACKUP'));
        console.log(chalk.gray('=' .repeat(50)));

        // Parse arguments
        const options = this.parseBackupCreateArgs(args);
        
        if (!this.backupSystem) {
            console.log(chalk.red('❌ Backup system not available'));
            console.log(chalk.yellow('💡 Check AWS configuration and try again'));
            return;
        }

        try {
            // Show backup information
            console.log(chalk.blue('📋 Backup Configuration:'));
            console.log(`   Type: ${options.type}`);
            console.log(`   Timestamp: ${options.timestamp || 'auto-generated'}`);
            console.log(`   Compression: ${options.compression ? 'enabled' : 'disabled'}`);
            console.log(`   Encryption: ${options.encryption ? 'enabled' : 'disabled'}`);
            console.log('');

            // Perform backup based on type
            let backupResult;

            if (options.type === 'all') {
                // Full database backup (default behavior)
                console.log(chalk.blue('🔄 Creating full database backup...'));
                backupResult = await this.backupSystem.performBackup('manual');
            } else {
                // Selective content type backup
                console.log(chalk.blue(`🔄 Creating ${options.type} backup...`));
                backupResult = await this.createSelectiveBackup(options.type, options);
            }

            // Show results
            if (backupResult.success) {
                console.log(chalk.green('\n✅ BACKUP COMPLETED SUCCESSFULLY'));
                console.log(chalk.gray('=' .repeat(50)));
                console.log(chalk.white(`📦 Backup Key: ${chalk.cyan(backupResult.backupInfo.s3Key)}`));
                console.log(chalk.white(`📊 Data Size: ${this.formatBytes(backupResult.size)}`));
                console.log(chalk.white(`⏱️  Duration: ${backupResult.duration}ms`));
                console.log(chalk.white(`📅 Timestamp: ${backupResult.backupInfo.timestamp}`));
                
                if (options.export) {
                    console.log(chalk.white(`💾 Local Export: ${options.export}`));
                }
                
                console.log('');
                console.log(chalk.yellow('💡 Use "backup list" to see all available backups'));
                console.log(chalk.yellow('💡 Use "backup restore <key>" to restore this backup'));
            }

        } catch (error) {
            console.log(chalk.red('\n❌ BACKUP FAILED'));
            console.log(chalk.red('Error:'), error.message);
            
            if (error.message.includes('AWS') || error.message.includes('S3')) {
                console.log(chalk.yellow('\n💡 AWS/S3 Configuration Help:'));
                console.log('   1. Set AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
                console.log('   2. Set S3 bucket name (BACKUP_S3_BUCKET)');
                console.log('   3. Set AWS region (BACKUP_S3_REGION)');
            }
        }
    }

    /**
     * Create selective backup for specific content types
     */
    async createSelectiveBackup(contentType, options) {
        console.log(chalk.blue(`🎯 Creating selective backup for: ${contentType}`));
        
        try {
            // Initialize Firebase if not already initialized using the same pattern as the main app
            if (!admin.apps.length) {
                let credential;

                // Check if service account is provided via environment variables (production)
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    try {
                        const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                        credential = admin.credential.cert(serviceAccountJson);
                        console.log('🔥 Using Firebase service account from environment variable');
                    } catch (parseError) {
                        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable: ' + parseError.message);
                    }
                }
                // Fall back to individual environment variables
                else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
                    credential = admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    });
                    console.log('🔥 Using Firebase credentials from individual environment variables');
                }
                // Fall back to file-based authentication (local development)
                else {
                    const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');
                    const fs = require('fs');

                    if (!fs.existsSync(serviceAccountPath)) {
                        throw new Error(
                            'Firebase service account not found. Either:\n' +
                            '  1. Add FIREBASE_SERVICE_ACCOUNT environment variable (production), or\n' +
                            '  2. Add individual Firebase environment variables, or\n' +
                            '  3. Place firebaseServiceAccountKey.json in project root (local dev)'
                        );
                    }

                    credential = admin.credential.cert(serviceAccountPath);
                    console.log('🔥 Using Firebase service account from file');
                }

                admin.initializeApp({
                    credential: credential,
                    databaseURL: process.env.DATABASE_URL,
                    storageBucket: process.env.STORAGE_BUCKET
                }, 'backup');
                console.log('🔥 Firebase Admin initialized for selective backup');
            }

            // Use the named app instance for database operations
            const backupApp = admin.app('backup');
            const database = backupApp.database();
            let data = {};

            // Get data based on content type
            switch (contentType) {
                case 'episodes':
                    console.log('📺 Exporting episodes data...');
                    const episodesSnapshot = await database.ref('/videos').once('value');
                    data.videos = episodesSnapshot.val() || {};
                    break;

                case 'characters':
                    console.log('👥 Exporting characters data...');
                    const charactersSnapshot = await database.ref('/characters').once('value');
                    data.characters = charactersSnapshot.val() || {};
                    break;

                case 'songs':
                    console.log('🎵 Exporting songs data...');
                    const songsSnapshot = await database.ref('/songs').once('value');
                    data.songs = songsSnapshot.val() || {};
                    break;

                case 'lore':
                    console.log('📚 Exporting lore data...');
                    const loreSnapshot = await database.ref('/lore').once('value');
                    data.lore = loreSnapshot.val() || {};
                    break;

                default:
                    throw new Error(`Unknown content type: ${contentType}`);
            }

            // Create backup data structure
            const backupData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    exportedBy: 'cli-selective-backup',
                    contentType: contentType,
                    version: '1.0'
                },
                data: data
            };

            const dataString = JSON.stringify(backupData, null, 2);

            // Generate backup info
            const timestamp = new Date().toISOString();
            const dateFormatted = timestamp.split('T')[0].replace(/-/g, '');
            const timeFormatted = timestamp.split('T')[1].split('.')[0].replace(/:/g, '');
            
            const backupInfo = {
                timestamp,
                type: `manual-${contentType}`,
                version: '1.0',
                project: 'wavelength-lore',
                contentType: contentType,
                filename: `backup_${contentType}_${dateFormatted}_${timeFormatted}.json`,
                s3Key: `backups/selective/${contentType}/${dateFormatted}/backup_${contentType}_${dateFormatted}_${timeFormatted}.json`,
                metadata: {
                    backupType: `manual-${contentType}`,
                    timestamp,
                    contentType,
                    application: 'wavelength-lore',
                    version: require('../package.json').version || '1.0.0'
                }
            };

            // Use backup system's upload functionality
            const tempDir = './temp/backups';
            await fs.mkdir(tempDir, { recursive: true });
            const localFilePath = path.join(tempDir, backupInfo.filename);
            
            await fs.writeFile(localFilePath, dataString);
            
            // Upload to S3 using the backup system
            await this.backupSystem.uploadToS3(localFilePath, backupInfo);
            
            // Cleanup local file
            await fs.unlink(localFilePath);

            // Export locally if requested
            if (options.export) {
                await fs.writeFile(options.export, dataString);
                console.log(chalk.green(`💾 Local export saved: ${options.export}`));
            }

            return {
                success: true,
                duration: 0, // Not measured for selective backups
                backupInfo,
                size: dataString.length
            };

        } catch (error) {
            throw new Error(`Selective backup failed: ${error.message}`);
        }
    }

    /**
     * List available backups
     */
    async listBackups(args) {
        console.log(chalk.cyan('\n📋 AVAILABLE BACKUPS'));
        console.log(chalk.gray('=' .repeat(60)));

        if (!this.backupSystem) {
            console.log(chalk.red('❌ Backup system not available'));
            return;
        }

        // Parse arguments
        const options = this.parseListArgs(args);

        try {
            const backups = await this.backupSystem.listBackups(options.type, options.limit);

            if (backups.length === 0) {
                console.log(chalk.yellow('📭 No backups found'));
                console.log(chalk.gray('💡 Use "backup create --type=all" to create your first backup'));
                return;
            }

            // Group backups by type
            const groupedBackups = this.groupBackupsByType(backups);

            // Display backups by type
            for (const [type, typeBackups] of Object.entries(groupedBackups)) {
                console.log(chalk.blue(`\n📂 ${type.toUpperCase()} BACKUPS:`));
                
                typeBackups.forEach((backup, index) => {
                    const age = this.getBackupAge(backup.lastModified);
                    const size = this.formatBytes(backup.size);
                    
                    console.log(chalk.white(`   ${index + 1}. ${backup.key}`));
                    console.log(chalk.gray(`      Size: ${size} | Age: ${age} | Storage: ${backup.storageClass || 'STANDARD'}`));
                });
            }

            console.log(chalk.yellow(`\n📊 Total backups: ${backups.length}`));
            
            if (options.limit && backups.length >= options.limit) {
                console.log(chalk.gray(`💡 Showing first ${options.limit} results. Use --limit=<number> to see more.`));
            }

            console.log(chalk.yellow('\n💡 Use "backup restore <key>" to restore a backup'));
            console.log(chalk.yellow('💡 Use "backup validate <key>" to validate a backup'));

        } catch (error) {
            console.log(chalk.red('❌ Failed to list backups:'), error.message);
        }
    }

    /**
     * Restore from backup
     */
    async restoreBackup(args) {
        if (args.length === 0) {
            console.log(chalk.red('❌ Please specify a backup key to restore'));
            console.log(chalk.yellow('💡 Use "backup list" to see available backups'));
            return;
        }

        const backupKey = args[0];
        const options = this.parseRestoreArgs(args.slice(1));

        console.log(chalk.cyan('\n🔄 RESTORING BACKUP'));
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.white(`📦 Backup Key: ${chalk.cyan(backupKey)}`));
        
        if (options.dryRun) {
            console.log(chalk.yellow('🧪 DRY RUN MODE - No changes will be made'));
        }
        
        console.log('');

        if (!this.backupSystem) {
            console.log(chalk.red('❌ Backup system not available'));
            return;
        }

        try {
            // Show warning for non-dry-run restores
            if (!options.dryRun) {
                console.log(chalk.red('⚠️  WARNING: This will overwrite current data!'));
                
                if (!options.force) {
                    const confirm = await this.promptUser('Are you sure you want to continue? (type "yes" to confirm): ');
                    if (confirm.toLowerCase() !== 'yes') {
                        console.log(chalk.yellow('❌ Restore cancelled'));
                        return;
                    }
                }
            }

            // Perform restore
            const restoreData = await this.backupSystem.restoreFromBackup(backupKey, options.targetPath);

            if (options.dryRun) {
                console.log(chalk.green('✅ DRY RUN COMPLETED'));
                console.log(chalk.white('📊 Backup contents:'));
                
                if (restoreData.data) {
                    const contentTypes = Object.keys(restoreData.data);
                    contentTypes.forEach(type => {
                        const count = this.countItems(restoreData.data[type]);
                        console.log(chalk.gray(`   ${type}: ${count} items`));
                    });
                }
                
                console.log(chalk.yellow('💡 Use without --dry-run to perform actual restore'));
            } else {
                console.log(chalk.green('\n✅ RESTORE COMPLETED SUCCESSFULLY'));
                console.log(chalk.white(`📅 Backup Date: ${restoreData.metadata?.exportTime || 'Unknown'}`));
                
                if (options.targetPath) {
                    console.log(chalk.white(`💾 Restored to: ${options.targetPath}`));
                } else {
                    console.log(chalk.white('🔥 Data restored to Firebase database'));
                }
            }

        } catch (error) {
            console.log(chalk.red('\n❌ RESTORE FAILED'));
            console.log(chalk.red('Error:'), error.message);
            
            if (error.message.includes('encryption key')) {
                console.log(chalk.yellow('\n💡 Encryption Key Help:'));
                console.log('   Set BACKUP_ENCRYPTION_KEY environment variable with the correct key');
            }
        }
    }

    /**
     * Show backup system status
     */
    async showBackupStatus(args) {
        console.log(chalk.cyan('\n🏥 BACKUP SYSTEM STATUS'));
        console.log(chalk.gray('=' .repeat(50)));

        if (!this.backupSystem) {
            console.log(chalk.red('❌ Backup system: Not Available'));
            console.log(chalk.yellow('💡 Check AWS configuration and restart the CLI'));
            return;
        }

        try {
            const status = this.backupSystem.getStatus();

            // System Status
            console.log(chalk.blue('🔧 System Status:'));
            console.log(`   Initialized: ${status.initialized ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
            console.log(`   Backup Running: ${status.backupRunning ? chalk.yellow('🔄 Yes') : chalk.green('✅ No')}`);
            console.log('');

            // Configuration
            console.log(chalk.blue('⚙️  Configuration:'));
            console.log(`   S3 Bucket: ${chalk.cyan(status.config.bucketName)}`);
            console.log(`   AWS Region: ${status.config.region}`);
            console.log(`   Retention: ${status.config.retentionDays} days`);
            console.log(`   Encryption: ${status.config.encryptionEnabled ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
            console.log(`   Compression: ${status.config.compressionEnabled ? chalk.green('Enabled') : chalk.yellow('Disabled')}`);
            console.log('');

            // Scheduled Backups
            console.log(chalk.blue('⏰ Scheduled Backups:'));
            console.log(`   Daily: ${chalk.gray(status.schedules.daily)} (${this.parseSchedule(status.schedules.daily)})`);
            console.log(`   Weekly: ${chalk.gray(status.schedules.weekly)} (${this.parseSchedule(status.schedules.weekly)})`);
            console.log('');

            // Recent Activity
            console.log(chalk.blue('📊 Recent Activity:'));
            try {
                const recentBackups = await this.backupSystem.listBackups(null, 5);
                if (recentBackups.length > 0) {
                    recentBackups.forEach((backup, index) => {
                        const age = this.getBackupAge(backup.lastModified);
                        const size = this.formatBytes(backup.size);
                        console.log(`   ${index + 1}. ${backup.key.split('/').pop()} (${size}, ${age})`);
                    });
                } else {
                    console.log(chalk.gray('   No recent backups found'));
                }
            } catch (error) {
                console.log(chalk.red('   Failed to retrieve recent backups'));
            }

            console.log('');
            console.log(chalk.yellow('💡 Use "backup create --type=all" to create a manual backup'));

        } catch (error) {
            console.log(chalk.red('❌ Failed to get backup status:'), error.message);
        }
    }

    /**
     * Validate backup integrity
     */
    async validateBackup(args) {
        if (args.length === 0) {
            console.log(chalk.red('❌ Please specify a backup key to validate'));
            console.log(chalk.yellow('💡 Use "backup list" to see available backups'));
            return;
        }

        const backupKey = args[0];

        console.log(chalk.cyan('\n🔍 VALIDATING BACKUP'));
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.white(`📦 Backup Key: ${chalk.cyan(backupKey)}`));
        console.log('');

        if (!this.backupSystem) {
            console.log(chalk.red('❌ Backup system not available'));
            return;
        }

        try {
            // Attempt to restore backup to validate it
            console.log(chalk.blue('🔄 Downloading and validating backup...'));
            const backupData = await this.backupSystem.restoreFromBackup(backupKey);

            // Validate structure
            const validation = this.validateBackupStructure(backupData);

            console.log(chalk.green('✅ BACKUP VALIDATION COMPLETED'));
            console.log(chalk.gray('=' .repeat(50)));
            
            // Show validation results
            if (validation.valid) {
                console.log(chalk.green('✅ Backup structure: Valid'));
                console.log(chalk.white(`📅 Backup date: ${validation.exportTime || 'Unknown'}`));
                console.log(chalk.white(`📊 Content types: ${validation.contentTypes.join(', ')}`));
                console.log(chalk.white(`📈 Total items: ${validation.totalItems}`));
                
                if (validation.contentCounts) {
                    console.log(chalk.blue('\n📋 Content breakdown:'));
                    Object.entries(validation.contentCounts).forEach(([type, count]) => {
                        console.log(`   ${type}: ${count} items`);
                    });
                }
            } else {
                console.log(chalk.red('❌ Backup structure: Invalid'));
                validation.errors.forEach(error => {
                    console.log(chalk.red(`   • ${error}`));
                });
            }

            console.log('');
            
            if (validation.valid) {
                console.log(chalk.yellow('💡 This backup can be safely restored'));
            } else {
                console.log(chalk.red('⚠️  This backup may be corrupted or incomplete'));
            }

        } catch (error) {
            console.log(chalk.red('\n❌ VALIDATION FAILED'));
            console.log(chalk.red('Error:'), error.message);
        }
    }

    /**
     * Cleanup old backups
     */
    async cleanupBackups(args) {
        console.log(chalk.cyan('\n🧹 BACKUP CLEANUP'));
        console.log(chalk.gray('=' .repeat(50)));

        const options = this.parseCleanupArgs(args);
        
        console.log(chalk.white(`🗓️  Cleaning backups older than: ${chalk.cyan(options.olderThan)}`));
        
        if (options.dryRun) {
            console.log(chalk.yellow('🧪 DRY RUN MODE - No backups will be deleted'));
        }
        
        console.log('');

        // This is a placeholder - in a full implementation, you would:
        // 1. List all backups
        // 2. Filter by age based on options.olderThan
        // 3. Delete old backups (if not dry run)
        // 4. Report results
        
        console.log(chalk.yellow('🚧 Cleanup functionality coming soon!'));
        console.log(chalk.gray('💡 Currently handled automatically by S3 lifecycle policies'));
        console.log(chalk.gray(`   Retention: ${this.backupSystem?.config?.retentionDays || 30} days`));
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Parse backup create arguments
     */
    parseBackupCreateArgs(args) {
        const options = {
            type: 'all',
            timestamp: null,
            compression: true,
            encryption: true,
            export: null
        };

        args.forEach(arg => {
            if (arg.startsWith('--type=')) {
                options.type = arg.split('=')[1];
            } else if (arg.startsWith('--timestamp=')) {
                options.timestamp = arg.split('=')[1];
            } else if (arg.startsWith('--export=')) {
                options.export = arg.split('=')[1];
            } else if (arg === '--no-compression') {
                options.compression = false;
            } else if (arg === '--no-encryption') {
                options.encryption = false;
            }
        });

        return options;
    }

    /**
     * Parse list arguments
     */
    parseListArgs(args) {
        const options = {
            type: null,
            limit: 50
        };

        args.forEach(arg => {
            if (arg.startsWith('--type=')) {
                options.type = arg.split('=')[1];
            } else if (arg.startsWith('--limit=')) {
                options.limit = parseInt(arg.split('=')[1]);
            }
        });

        return options;
    }

    /**
     * Parse restore arguments
     */
    parseRestoreArgs(args) {
        const options = {
            targetPath: null,
            dryRun: false,
            force: false
        };

        args.forEach(arg => {
            if (arg.startsWith('--target-path=')) {
                options.targetPath = arg.split('=')[1];
            } else if (arg === '--dry-run') {
                options.dryRun = true;
            } else if (arg === '--force') {
                options.force = true;
            }
        });

        return options;
    }

    /**
     * Parse cleanup arguments
     */
    parseCleanupArgs(args) {
        const options = {
            olderThan: '30d',
            dryRun: false
        };

        args.forEach(arg => {
            if (arg.startsWith('--older-than=')) {
                options.olderThan = arg.split('=')[1];
            } else if (arg === '--dry-run') {
                options.dryRun = true;
            }
        });

        return options;
    }

    /**
     * Group backups by type
     */
    groupBackupsByType(backups) {
        const grouped = {};
        
        backups.forEach(backup => {
            // Extract type from key (e.g., backups/daily/... -> daily)
            const pathParts = backup.key.split('/');
            const type = pathParts[1] || 'unknown';
            
            if (!grouped[type]) {
                grouped[type] = [];
            }
            
            grouped[type].push(backup);
        });

        return grouped;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get backup age in human readable format
     */
    getBackupAge(lastModified) {
        const now = new Date();
        const backupDate = new Date(lastModified);
        const diffMs = now - backupDate;
        
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return 'Less than 1 hour ago';
        }
    }

    /**
     * Parse cron schedule to human readable
     */
    parseSchedule(cronExpression) {
        // Basic cron parsing for display
        const parts = cronExpression.split(' ');
        if (parts.length >= 5) {
            const hour = parts[1];
            const minute = parts[0];
            return `${hour}:${minute.padStart(2, '0')}`;
        }
        return cronExpression;
    }

    /**
     * Count items in data structure
     */
    countItems(data) {
        if (!data || typeof data !== 'object') return 0;
        
        let count = 0;
        function countRecursive(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    countRecursive(obj[key]);
                } else {
                    count++;
                }
            }
        }
        
        countRecursive(data);
        return count;
    }

    /**
     * Validate backup structure
     */
    validateBackupStructure(backupData) {
        const errors = [];
        const validation = {
            valid: true,
            errors: [],
            exportTime: null,
            contentTypes: [],
            totalItems: 0,
            contentCounts: {}
        };

        try {
            // Check if data has required metadata
            if (!backupData.metadata) {
                errors.push('Missing metadata section');
            } else {
                validation.exportTime = backupData.metadata.exportTime;
            }

            // Check if data section exists
            if (!backupData.data) {
                errors.push('Missing data section');
            } else {
                // Analyze content types
                validation.contentTypes = Object.keys(backupData.data);
                
                // Count items in each content type
                validation.contentTypes.forEach(type => {
                    const count = this.countItems(backupData.data[type]);
                    validation.contentCounts[type] = count;
                    validation.totalItems += count;
                });
            }

            validation.valid = errors.length === 0;
            validation.errors = errors;

        } catch (error) {
            validation.valid = false;
            validation.errors = ['Failed to parse backup data: ' + error.message];
        }

        return validation;
    }

    /**
     * Prompt user for input
     */
    async promptUser(question) {
        // In a real implementation, this would use readline or inquirer
        // For demo purposes, return a placeholder
        console.log(chalk.yellow(`[PROMPT] ${question}`));
        return 'demo-response';
    }

    /**
     * Show backup help
     */
    showBackupHelp() {
        console.log(chalk.blue.bold('\n💾 BACKUP COMMANDS'));
        console.log(chalk.gray('=' .repeat(60)));

        console.log(chalk.green('\n🔧 Backup Management:'));
        console.log('  backup create --type=all          - Create full database backup');
        console.log('  backup create --type=episodes     - Backup episodes only');
        console.log('  backup create --type=characters   - Backup characters only');
        console.log('  backup create --type=songs        - Backup songs only');
        console.log('  backup create --type=lore         - Backup lore only');
        console.log('  backup create --export=local.json - Create backup + local export');

        console.log(chalk.green('\n📋 Backup Discovery:'));
        console.log('  backup list                       - List all backups');
        console.log('  backup list --type=daily          - List daily backups');
        console.log('  backup list --type=weekly         - List weekly backups');
        console.log('  backup list --limit=100           - List up to 100 backups');

        console.log(chalk.green('\n🔄 Backup Restoration:'));
        console.log('  backup restore <key>              - Restore from backup');
        console.log('  backup restore <key> --dry-run    - Test restore (no changes)');
        console.log('  backup restore <key> --target-path=file.json - Export to file');
        console.log('  backup restore <key> --force      - Skip confirmation prompts');

        console.log(chalk.green('\n🏥 System Management:'));
        console.log('  backup status                     - Show backup system status');
        console.log('  backup validate <key>             - Validate backup integrity');
        console.log('  backup cleanup --older-than=30d   - Clean up old backups');
        console.log('  backup help                       - Show this help');

        console.log(chalk.yellow('\n💡 Quick Examples:'));
        console.log(chalk.gray('  backup create --type=all'));
        console.log(chalk.gray('  backup create --type=episodes --export=episodes-backup.json'));
        console.log(chalk.gray('  backup restore backups/manual/20251031/backup_manual_20251031_143022.json'));
        console.log(chalk.gray('  backup list --type=daily --limit=10'));

        console.log(chalk.cyan('\n🔐 Security Features:'));
        console.log('  • Automatic encryption with AES-256-GCM');
        console.log('  • Compression to reduce storage costs');
        console.log('  • Automatic retention management');
        console.log('  • Secure S3 storage with versioning');

        console.log(chalk.red('\n⚠️  Important Notes:'));
        console.log('  • Backups are stored in AWS S3 (requires configuration)');
        console.log('  • Restore operations will overwrite existing data');
        console.log('  • Use --dry-run to test operations safely');
        console.log('  • Keep your BACKUP_ENCRYPTION_KEY secure');

        console.log('');
    }
}

module.exports = BackupCommands;