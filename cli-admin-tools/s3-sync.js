#!/usr/bin/env node
/**
 * 🌊 WAVELENGTH CLI ADMIN - S3 SYNC (ACTUAL UPLOAD)
 * ==================================================
 * Real S3 sync tool that actually uploads to CloudFront
 * Wraps the working bash script for use in CLI admin mode
 */

require('dotenv').config();

// Map dev credentials to AWS CLI standard variables
if (process.env.aws_wavelength_dev_access_key_id) {
    process.env.AWS_ACCESS_KEY_ID = process.env.aws_wavelength_dev_access_key_id;
}
if (process.env.aws_wavelength_dev_secret_access_key) {
    process.env.AWS_SECRET_ACCESS_KEY = process.env.aws_wavelength_dev_secret_access_key;
}

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

class WavelengthS3Sync {
    constructor() {
        this.rootDir = process.cwd();
        this.syncScriptPath = path.join(this.rootDir, 'scripts', 'sync-assets.sh');
    }

    /**
     * 🚀 Execute S3 sync
     */
    async sync() {
        console.log(chalk.cyan('🌊 WAVELENGTH S3 SYNC'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        try {
            // Check if script exists
            if (!fs.existsSync(this.syncScriptPath)) {
                throw new Error(`Sync script not found: ${this.syncScriptPath}`);
            }

            // Check AWS CLI
            try {
                execSync('aws --version', { stdio: 'ignore' });
            } catch (error) {
                throw new Error('AWS CLI not installed. Install from: https://aws.amazon.com/cli/');
            }

            // Check AWS credentials
            try {
                execSync('aws sts get-caller-identity', { stdio: 'ignore' });
            } catch (error) {
                throw new Error('AWS credentials not configured. Run: aws configure');
            }

            console.log(chalk.green('✓ AWS CLI configured'));
            console.log(chalk.green('✓ Credentials validated'));
            console.log('');

            // Execute the sync script
            console.log(chalk.yellow('📤 Starting S3 upload...'));
            console.log('');

            const output = execSync(this.syncScriptPath, {
                cwd: this.rootDir,
                encoding: 'utf8',
                stdio: 'inherit' // Show output in real-time
            });

            console.log('');
            console.log(chalk.green('✅ S3 sync completed successfully!'));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ S3 sync failed:'), error.message);
            return false;
        }
    }

    /**
     * 📊 Get sync status
     */
    getStatus() {
        const syncInfoPath = path.join(this.rootDir, '.wavelength-sync-info.json');

        if (!fs.existsSync(syncInfoPath)) {
            return {
                lastSync: 'Never',
                status: 'Not synced',
                method: 'S3 Upload Script'
            };
        }

        try {
            const syncInfo = JSON.parse(fs.readFileSync(syncInfoPath, 'utf8'));
            return {
                lastSync: new Date(syncInfo.lastSync).toLocaleString(),
                status: 'Synced to S3',
                method: 'S3 Upload Script',
                version: syncInfo.version
            };
        } catch (error) {
            return {
                lastSync: 'Unknown',
                status: 'Error reading sync info',
                method: 'S3 Upload Script'
            };
        }
    }

    /**
     * 🔍 Check AWS configuration
     */
    async checkAWS() {
        console.log(chalk.cyan('🔍 AWS CONFIGURATION CHECK'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        try {
            // Check AWS CLI
            try {
                const awsVersion = execSync('aws --version', { encoding: 'utf8' }).trim();
                console.log(chalk.green('✓ AWS CLI installed:'), awsVersion);
            } catch (error) {
                console.log(chalk.red('✗ AWS CLI not installed'));
                return false;
            }

            // Check credentials
            try {
                const identity = execSync('aws sts get-caller-identity --output json', { encoding: 'utf8' });
                const identityData = JSON.parse(identity);
                console.log(chalk.green('✓ AWS credentials configured'));
                console.log(chalk.white('  Account:', identityData.Account));
                console.log(chalk.white('  User ARN:', identityData.Arn));
            } catch (error) {
                console.log(chalk.red('✗ AWS credentials not configured'));
                return false;
            }

            // Check environment variables
            console.log('');
            console.log(chalk.yellow('Environment Variables:'));
            const s3Bucket = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket (default)';
            const cfDistro = process.env.CLOUDFRONT_DISTRIBUTION_ID || 'Not set';
            console.log(chalk.white('  S3_BUCKET_NAME:', s3Bucket));
            console.log(chalk.white('  CLOUDFRONT_DISTRIBUTION_ID:', cfDistro));

            console.log('');
            console.log(chalk.green('✅ AWS configuration ready for sync'));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ AWS configuration check failed:'), error.message);
            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const syncTool = new WavelengthS3Sync();

    if (process.argv.includes('--status')) {
        const status = syncTool.getStatus();
        console.log(chalk.cyan('🌊 S3 SYNC STATUS:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white(`Status: ${status.status}`));
        console.log(chalk.white(`Last Sync: ${status.lastSync}`));
        console.log(chalk.white(`Method: ${status.method}`));
        if (status.version) {
            console.log(chalk.white(`Version: ${status.version}`));
        }
    } else if (process.argv.includes('--check') || process.argv.includes('--check-aws')) {
        syncTool.checkAWS();
    } else {
        syncTool.sync().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = WavelengthS3Sync;
