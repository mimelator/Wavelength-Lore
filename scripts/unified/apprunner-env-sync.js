#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH App Runner Environment Sync
 * 
 * Clean npm CLI admin tool for synchronizing environment variables 
 * from .env files to AWS App Runner production service.
 * 
 * Features:
 * ✅ Safe Preview Mode - Shows exactly what will change without applying
 * ✅ Production Variable Filtering - Only syncs whitelisted production variables
 * ✅ Sensitive Value Masking - Hides secrets/keys in output for security
 * ✅ Change Detection - Shows added, modified, removed, and unchanged variables
 * ✅ Port Synchronization - Automatically syncs PORT env var with ImageConfiguration.Port
 * ✅ Error Handling - Clear error messages and validation
 */

const { AppRunnerClient, DescribeServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-apprunner');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables immediately - don't rely on Node.js auto-loading
dotenv.config();

class WavelengthAppRunnerSync {
    constructor() {
        // Use wavelength-dev credentials for AppRunner operations
        const credentials = {
            accessKeyId: process.env.aws_wavelength_dev_access_key_id || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.aws_wavelength_dev_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY
        };
        
        this.client = new AppRunnerClient({ 
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: credentials
        });
        
        // Production variables whitelist - only these get synced
        this.productionVars = [
            // Core Application
            'NODE_ENV', 'PORT', 'SITE_URL', 'CDN_URL', 'VERSION', 'DEPLOYMENT_TIMESTAMP',
            
            // Firebase Configuration 
            'API_KEY', 'AUTH_DOMAIN', 'DATABASE_URL', 'PROJECT_ID', 'STORAGE_BUCKET',
            'MESSAGING_SENDER_ID', 'APP_ID', 'MEASUREMENT_ID', 'FIREBASE_SERVICE_ACCOUNT',
            
            // AWS Configuration
            'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 
            'AWS_ACCOUNT_ID', 'AWS_REGION', 'APPRUNNER_SERVICE_ARN',
            
            // Gallery & Storage
            'GALLERY_S3_BUCKET', 'GALLERY_CDN_URL',
            'CLOUDFRONT_DISTRIBUTION_ID', 'GALLERY_CLOUDFRONT_DISTRIBUTION_ID',
            
            // External APIs
            'YOUTUBE_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY',
            'AI_MODEL_KEY', 'AI_PROVIDER', 'VIDEO_MODEL_KEY',
            
            // VIP Features
            'CHATBOT_JWT_SECRET', 'CHATBOT_API_URL',
            
            // Merchandise (Printify & Stripe)
            'PRINTIFY_API_TOKEN', 'PRINTIFY_SHOP_ID', 'PRINTIFY_API_URL',
            'PRINTIFY_ENVIRONMENT', 'PRINTIFY_MOCK_MODE',
            'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_ENVIRONMENT',
            
            // Security & Admin
            'ADMIN_SECRET_KEY', 'ADMIN_ALLOWED_IPS',
            'RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX_REQUESTS',
            'SANITIZATION_ENABLED', 'PROFANITY_FILTER_ENABLED',
            
            // File Uploads
            'FORUM_ATTACHMENTS_BUCKET', 'MAX_FILE_SIZE', 'MAX_FILES_PER_POST',
            'ALLOWED_FILE_TYPES',
            
            // Backup Configuration
            'ENABLE_BACKUPS', 'BACKUP_S3_BUCKET', 'BACKUP_S3_REGION',
            'BACKUP_RETENTION_DAYS', 'BACKUP_COMPRESSION', 'BACKUP_ENCRYPTION',
            'BACKUP_DAILY_TIME', 'BACKUP_WEEKLY_TIME', 'BACKUP_TEMP_DIR', 'BACKUP_ENCRYPTION_KEY',
            
            // Contact & Infrastructure
            'CONTACT_EMAIL', 'NGINX_PORT', 'NODE_PORT'
        ];
    }

    /**
     * 📖 Load environment variables from .env files
     */
    loadEnvironmentVariables() {
        const envFiles = ['.env', '.env.production'];
        let allVars = {};
        let filesLoaded = 0;

        for (const file of envFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const envContent = dotenv.parse(fs.readFileSync(filePath));
                allVars = { ...allVars, ...envContent };
                filesLoaded++;
                console.log(chalk.green(`✅ Loaded ${Object.keys(envContent).length} variables from ${file}`));
            }
        }

        if (filesLoaded === 0) {
            throw new Error('No .env files found. Please create .env with your environment variables.');
        }

        // Filter to production-only variables
        const productionVars = {};
        for (const [key, value] of Object.entries(allVars)) {
            if (this.productionVars.includes(key)) {
                productionVars[key] = value;
            }
        }

        console.log(chalk.green(`✅ Selected ${Object.keys(productionVars).length} production variables`));
        
        // Apply production-safe defaults for critical variables
        this.applyProductionDefaults(productionVars);
        
        // Check size limit (AWS AppRunner has 51,200 character limit)
        const totalSize = JSON.stringify(productionVars).length;
        console.log(chalk.gray(`📊 Total environment variables size: ${totalSize} characters (limit: 51,200)`));
        
        if (totalSize > 51200) {
            console.log(chalk.yellow('⚠️  Environment variables exceed AWS AppRunner limit'));
            console.log(chalk.yellow('   Consider using shorter values or fewer variables'));
            
            // Show largest variables
            const sortedVars = Object.entries(productionVars)
                .map(([key, value]) => ({ key, size: String(value).length }))
                .sort((a, b) => b.size - a.size)
                .slice(0, 5);
                
            console.log(chalk.yellow('   Largest variables:'));
            sortedVars.forEach(({ key, size }) => {
                console.log(chalk.yellow(`   - ${key}: ${size} characters`));
            });
        }
        
        return productionVars;
    }

    /**
     * 🎯 Apply production-safe defaults to environment variables
     */
    applyProductionDefaults(productionVars) {
        let appliedDefaults = 0;
        
        // Ensure NODE_ENV is production
        if (!productionVars.NODE_ENV || productionVars.NODE_ENV !== 'production') {
            productionVars.NODE_ENV = 'production';
            appliedDefaults++;
            console.log(chalk.yellow('📝 Applied default: NODE_ENV = production'));
        }
        
        // Ensure PORT is set for App Runner
        if (!productionVars.PORT) {
            productionVars.PORT = '8080';
            appliedDefaults++;
            console.log(chalk.yellow('📝 Applied default: PORT = 8080'));
        }
        
        // Ensure CDN_URL is set (fixes mixed content warnings)
        if (!productionVars.CDN_URL) {
            productionVars.CDN_URL = 'https://df5sj8f594cdx.cloudfront.net';
            appliedDefaults++;
            console.log(chalk.yellow('📝 Applied default: CDN_URL = CloudFront distribution'));
        }
        
        // Ensure SITE_URL is production domain (not localhost)
        if (!productionVars.SITE_URL || productionVars.SITE_URL.includes('localhost')) {
            productionVars.SITE_URL = 'https://wavelengthlore.com';
            appliedDefaults++;
            console.log(chalk.yellow('📝 Applied default: SITE_URL = production domain'));
        }
        
        if (appliedDefaults > 0) {
            console.log(chalk.green(`✅ Applied ${appliedDefaults} production defaults`));
        } else {
            console.log(chalk.green('✅ All production defaults already set'));
        }
    }

    /**
     * 🔍 Get current App Runner service configuration
     */
    async getCurrentServiceConfig(envVars = {}) {
        const serviceArn = envVars.APPRUNNER_SERVICE_ARN || process.env.APPRUNNER_SERVICE_ARN;
        if (!serviceArn) {
            throw new Error('APPRUNNER_SERVICE_ARN environment variable is required');
        }

        try {
            const command = new DescribeServiceCommand({ ServiceArn: serviceArn });
            const response = await this.client.send(command);
            return response.Service;
        } catch (error) {
            throw new Error(`Failed to get service configuration: ${error.message}`);
        }
    }

    /**
     * 🔍 Compare environment variables and detect changes
     */
    compareEnvironmentVariables(localVars, currentVars) {
        const changes = {
            added: {},
            modified: {},
            removed: {},
            unchanged: {}
        };

        // Check for added and modified variables
        for (const [key, value] of Object.entries(localVars)) {
            if (!(key in currentVars)) {
                changes.added[key] = value;
            } else if (currentVars[key] !== value) {
                changes.modified[key] = { old: currentVars[key], new: value };
            } else {
                changes.unchanged[key] = value;
            }
        }

        // Check for removed variables (that were in current but not in local)
        for (const [key, value] of Object.entries(currentVars)) {
            if (!(key in localVars)) {
                changes.removed[key] = value;
            }
        }

        return changes;
    }

    /**
     * 🎭 Mask sensitive values for display
     */
    maskSensitiveValue(key, value) {
        const sensitivePatterns = [
            'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE'
        ];

        if (sensitivePatterns.some(pattern => key.includes(pattern))) {
            if (value.length <= 8) {
                return '***';
            }
            return value.substring(0, 6) + '...' + value.substring(value.length - 4);
        }
        return value;
    }

    /**
     * 📊 Display changes summary
     */
    displayChanges(changes) {
        console.log(chalk.yellow('🔍 Environment Variables Changes:'));
        console.log(chalk.gray('━'.repeat(50)));
        console.log('');

        // Added variables
        const addedCount = Object.keys(changes.added).length;
        if (addedCount > 0) {
            console.log(chalk.green(`✅ Added (${addedCount}):`));
            for (const [key, value] of Object.entries(changes.added)) {
                const maskedValue = this.maskSensitiveValue(key, value);
                console.log(chalk.green(`   + ${key} = ${maskedValue}`));
            }
            console.log('');
        }

        // Modified variables
        const modifiedCount = Object.keys(changes.modified).length;
        if (modifiedCount > 0) {
            console.log(chalk.yellow(`🔄 Modified (${modifiedCount}):`));
            for (const [key, change] of Object.entries(changes.modified)) {
                const maskedOld = this.maskSensitiveValue(key, change.old);
                const maskedNew = this.maskSensitiveValue(key, change.new);
                console.log(chalk.yellow(`   ~ ${key}: ${maskedOld} → ${maskedNew}`));
            }
            console.log('');
        }

        // Removed variables
        const removedCount = Object.keys(changes.removed).length;
        if (removedCount > 0) {
            console.log(chalk.red(`❌ Removed (${removedCount}):`));
            for (const [key, value] of Object.entries(changes.removed)) {
                const maskedValue = this.maskSensitiveValue(key, value);
                console.log(chalk.red(`   - ${key} = ${maskedValue}`));
            }
            console.log('');
        }

        // Summary
        const totalChanges = addedCount + modifiedCount + removedCount;
        const unchangedCount = Object.keys(changes.unchanged).length;

        console.log(chalk.cyan(`📊 Total Changes: ${totalChanges}`));
        console.log(chalk.gray(`📊 Unchanged: ${unchangedCount}`));
        console.log('');

        return totalChanges;
    }

    /**
     * 🚀 Apply changes to App Runner service
     */
    async applyChanges(serviceConfig, newEnvironmentVariables) {
        const serviceArn = newEnvironmentVariables.APPRUNNER_SERVICE_ARN || process.env.APPRUNNER_SERVICE_ARN;
        const port = newEnvironmentVariables.PORT || '8080';

        console.log(chalk.yellow('🚀 Updating App Runner service...'));
        console.log(chalk.gray(`📋 Service: ${serviceArn}`));
        console.log(chalk.gray(`🔧 Variables: ${Object.keys(newEnvironmentVariables).length}`));
        console.log(chalk.gray(`🔌 Port: ${port}`));
        console.log('');

        try {
            const updateCommand = new UpdateServiceCommand({
                ServiceArn: serviceArn,
                SourceConfiguration: {
                    ...serviceConfig.SourceConfiguration,
                    ImageRepository: {
                        ...serviceConfig.SourceConfiguration.ImageRepository,
                        ImageConfiguration: {
                            ...serviceConfig.SourceConfiguration.ImageRepository.ImageConfiguration,
                            Port: port,
                            RuntimeEnvironmentVariables: newEnvironmentVariables
                        }
                    }
                }
            });

            const response = await this.client.send(updateCommand);
            
            console.log(chalk.green('✅ Service update initiated successfully!'));
            console.log(chalk.gray(`📋 Operation ID: ${response.OperationId}`));
            console.log(chalk.gray(`🔄 Status: ${response.Service.Status}`));
            console.log('');
            
            console.log(chalk.cyan('📝 Next Steps:'));
            console.log(chalk.white('   • Monitor deployment in AWS App Runner console'));
            console.log(chalk.white('   • Verify application starts correctly'));
            console.log(chalk.white('   • Test critical functionality'));
            
            return true;

        } catch (error) {
            console.error(chalk.red('❌ Failed to update App Runner service:'), error.message);
            return false;
        }
    }

    /**
     * 🎯 Main execution function
     */
    async run() {
        const args = process.argv.slice(2);
        const applyChanges = args.includes('--apply');
        const showHelp = args.includes('--help') || args.includes('-h');

        if (showHelp) {
            this.showHelp();
            return;
        }

        try {
            console.log(chalk.blue('🌊 WAVELENGTH App Runner Environment Sync'));
            console.log(chalk.gray('━'.repeat(50)));
            console.log('');

            // Load local environment variables
            const localVars = this.loadEnvironmentVariables();

            // Get current service configuration
            console.log(chalk.yellow('🔍 Fetching current App Runner configuration...'));
            const serviceConfig = await this.getCurrentServiceConfig(localVars);
            const currentVars = serviceConfig.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables || {};

            // Compare variables
            const changes = this.compareEnvironmentVariables(localVars, currentVars);
            const totalChanges = this.displayChanges(changes);

            if (totalChanges === 0) {
                console.log(chalk.green('✅ No changes detected. Environment variables are in sync!'));
                return;
            }

            if (!applyChanges) {
                console.log(chalk.cyan('💡 To apply these changes, run:'));
                console.log(chalk.white('   npm run admin:env-sync -- --apply'));
                return;
            }

            // Apply changes
            const success = await this.applyChanges(serviceConfig, localVars);
            if (success) {
                console.log(chalk.green('🌊 Environment sync completed successfully!'));
            } else {
                process.exit(1);
            }

        } catch (error) {
            console.error(chalk.red('❌ Environment sync failed:'), error.message);
            process.exit(1);
        }
    }

    /**
     * 📖 Show help information
     */
    showHelp() {
        console.log(chalk.blue('🌊 WAVELENGTH App Runner Environment Sync'));
        console.log('');
        console.log(chalk.white('USAGE:'));
        console.log(chalk.gray('  npm run admin:env-sync [options]'));
        console.log('');
        console.log(chalk.white('OPTIONS:'));
        console.log(chalk.gray('  --apply    Apply changes to App Runner service'));
        console.log(chalk.gray('  --help     Show this help message'));
        console.log('');
        console.log(chalk.white('EXAMPLES:'));
        console.log(chalk.gray('  npm run admin:env-sync              # Preview changes'));
        console.log(chalk.gray('  npm run admin:env-sync -- --apply   # Apply changes'));
        console.log('');
        console.log(chalk.white('REQUIRED ENVIRONMENT VARIABLES:'));
        console.log(chalk.gray('  APPRUNNER_SERVICE_ARN   - Your App Runner service ARN'));
        console.log(chalk.gray('  ACCESS_KEY_ID           - AWS access key'));
        console.log(chalk.gray('  SECRET_ACCESS_KEY       - AWS secret key'));
        console.log(chalk.gray('  AWS_REGION              - AWS region (default: us-east-1)'));
    }
}

// Run the sync tool
if (require.main === module) {
    const sync = new WavelengthAppRunnerSync();
    sync.run().catch(error => {
        console.error(chalk.red('❌ Fatal error:'), error.message);
        process.exit(1);
    });
}

module.exports = WavelengthAppRunnerSync;