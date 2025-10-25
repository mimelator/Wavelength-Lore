#!/usr/bin/env node

/**
 * Interactive CloudFront Distribution Updater
 * Safely updates CloudFront with user confirmation at each step
 */

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { fromEnv } = require('@aws-sdk/credential-providers');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DISTRIBUTION_ID = 'E2QFR8E7I4A6ZT';
const BACKUP_DIR = './temp/cloudfront-backups';

class InteractiveCloudFrontUpdater {
    constructor() {
        this.client = new CloudFrontClient({
            region: 'us-east-1',
            credentials: fromEnv()
        });
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async confirmAction(message, defaultYes = false) {
        const defaultStr = defaultYes ? '[Y/n]' : '[y/N]';
        const answer = await this.question(`${message} ${defaultStr}: `);
        const normalizedAnswer = answer.toLowerCase().trim();
        
        if (defaultYes) {
            return normalizedAnswer !== 'n' && normalizedAnswer !== 'no';
        } else {
            return normalizedAnswer === 'y' || normalizedAnswer === 'yes';
        }
    }

    async validateCredentials() {
        console.log('🔑 Validating AWS credentials...');
        try {
            const command = new GetDistributionConfigCommand({ Id: DISTRIBUTION_ID });
            await this.client.send(command);
            console.log('✅ AWS credentials are valid and have CloudFront permissions');
            return true;
        } catch (error) {
            console.error('❌ AWS credentials issue:', error.message);
            console.log('');
            console.log('🔧 To fix this:');
            console.log('1. Ensure AWS credentials are set:');
            console.log('   export AWS_ACCESS_KEY_ID=your_access_key');
            console.log('   export AWS_SECRET_ACCESS_KEY=your_secret_key');
            console.log('2. Or use AWS CLI: aws configure');
            console.log('3. Ensure your credentials have CloudFront permissions');
            return false;
        }
    }

    async getCurrentConfig() {
        console.log('📥 Retrieving current CloudFront configuration...');
        
        const command = new GetDistributionConfigCommand({ Id: DISTRIBUTION_ID });
        const response = await this.client.send(command);
        
        // Save backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `config-backup-${timestamp}.json`);
        
        fs.writeFileSync(backupFile, JSON.stringify({
            distributionConfig: response.DistributionConfig,
            etag: response.ETag,
            timestamp: new Date().toISOString(),
            distributionId: DISTRIBUTION_ID
        }, null, 2));
        
        console.log(`✅ Configuration backed up to: ${backupFile}`);
        
        return {
            config: response.DistributionConfig,
            etag: response.ETag,
            backupFile: backupFile
        };
    }

    analyzeCurrentBehaviors(config) {
        console.log('');
        console.log('🔍 Current Cache Behaviors Analysis:');
        console.log('');
        
        const existingBehaviors = config.CacheBehaviors?.Items || [];
        
        console.log(`📊 Found ${existingBehaviors.length} existing cache behaviors:`);
        if (existingBehaviors.length === 0) {
            console.log('   (Only default behavior exists)');
        } else {
            existingBehaviors.forEach((behavior, index) => {
                console.log(`   ${index + 1}. ${behavior.PathPattern} → ${behavior.TargetOriginId}`);
            });
        }
        
        console.log('');
        console.log('🎯 Required behaviors for new path structure:');
        console.log('   • /images/* - For image assets (no compression)');
        console.log('   • /css/*    - For CSS files (with compression)');
        console.log('   • /js/*     - For JavaScript files (with compression)');
        
        // Check what's missing
        const existingPatterns = existingBehaviors.map(b => b.PathPattern);
        const requiredPatterns = ['/images/*', '/css/*', '/js/*'];
        const missingPatterns = requiredPatterns.filter(pattern => !existingPatterns.includes(pattern));
        
        console.log('');
        if (missingPatterns.length === 0) {
            console.log('✅ All required behaviors already exist!');
            return { needsUpdate: false, missingPatterns: [] };
        } else {
            console.log('📋 Missing behaviors that will be added:');
            missingPatterns.forEach(pattern => {
                console.log(`   ➕ ${pattern}`);
            });
            return { needsUpdate: true, missingPatterns };
        }
    }

    createNewCacheBehaviors(originId, missingPatterns) {
        const allBehaviors = {
            '/images/*': {
                PathPattern: '/images/*',
                TargetOriginId: originId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000,
                Compress: false
            },
            '/css/*': {
                PathPattern: '/css/*',
                TargetOriginId: originId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000,
                Compress: true
            },
            '/js/*': {
                PathPattern: '/js/*',
                TargetOriginId: originId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000,
                Compress: true
            }
        };
        
        return missingPatterns.map(pattern => allBehaviors[pattern]);
    }

    async updateDistribution(config, etag) {
        console.log('🚀 Applying changes to CloudFront distribution...');
        
        const command = new UpdateDistributionCommand({
            Id: DISTRIBUTION_ID,
            DistributionConfig: config,
            IfMatch: etag
        });
        
        const response = await this.client.send(command);
        
        console.log('✅ Distribution update submitted successfully!');
        console.log(`📡 Distribution ID: ${DISTRIBUTION_ID}`);
        console.log(`🔄 Status: ${response.Distribution.Status}`);
        
        return response;
    }

    async run() {
        try {
            console.log('🌐 INTERACTIVE CLOUDFRONT UPDATER');
            console.log('=================================');
            console.log(`📡 Distribution: ${DISTRIBUTION_ID}`);
            console.log(`🏷️  Domain: ${DISTRIBUTION_ID}.cloudfront.net`);
            console.log('');

            // Step 1: Validate credentials
            const hasValidCreds = await this.validateCredentials();
            if (!hasValidCreds) {
                this.rl.close();
                process.exit(1);
            }

            console.log('');
            const shouldContinue = await this.confirmAction('Continue with CloudFront analysis?', true);
            if (!shouldContinue) {
                console.log('👋 Operation cancelled');
                this.rl.close();
                return;
            }

            // Step 2: Get current configuration
            const { config, etag, backupFile } = await this.getCurrentConfig();

            // Step 3: Analyze current behaviors
            const analysis = this.analyzeCurrentBehaviors(config);
            
            if (!analysis.needsUpdate) {
                console.log('🎉 Your CloudFront distribution is already configured correctly!');
                this.rl.close();
                return;
            }

            console.log('');
            const shouldUpdate = await this.confirmAction('Add the missing cache behaviors?', true);
            if (!shouldUpdate) {
                console.log('👋 Update cancelled');
                this.rl.close();
                return;
            }

            // Step 4: Create updated configuration
            const originId = config.DefaultCacheBehavior.TargetOriginId;
            const newBehaviors = this.createNewCacheBehaviors(originId, analysis.missingPatterns);
            
            const existingBehaviors = config.CacheBehaviors?.Items || [];
            const updatedBehaviors = [...existingBehaviors, ...newBehaviors];
            
            const updatedConfig = {
                ...config,
                CacheBehaviors: {
                    Quantity: updatedBehaviors.length,
                    Items: updatedBehaviors
                }
            };

            // Step 5: Final confirmation
            console.log('');
            console.log('📋 Final Review:');
            console.log(`   • Current behaviors: ${existingBehaviors.length}`);
            console.log(`   • New behaviors to add: ${newBehaviors.length}`);
            console.log(`   • Total after update: ${updatedBehaviors.length}`);
            console.log(`   • Backup saved to: ${path.basename(backupFile)}`);
            console.log('');
            console.log('⏰ Expected deployment time: 15-20 minutes');
            console.log('');
            
            const finalConfirm = await this.confirmAction('🚀 Apply these changes to your CloudFront distribution?');
            if (!finalConfirm) {
                console.log('👋 Update cancelled');
                this.rl.close();
                return;
            }

            // Step 6: Apply the update
            console.log('');
            const updateResponse = await this.updateDistribution(updatedConfig, etag);
            
            // Save updated configuration
            const updateFile = path.join(BACKUP_DIR, `config-updated-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.writeFileSync(updateFile, JSON.stringify({
                distributionConfig: updatedConfig,
                updateResponse: updateResponse,
                timestamp: new Date().toISOString(),
                distributionId: DISTRIBUTION_ID
            }, null, 2));
            
            console.log(`📁 Updated configuration saved to: ${updateFile}`);
            console.log('');
            console.log('🎉 CloudFront update completed successfully!');
            console.log('');
            console.log('⏰ Deployment is now in progress...');
            console.log('📊 Monitor progress at:');
            console.log(`   https://console.aws.amazon.com/cloudfront/home#distribution-settings:${DISTRIBUTION_ID}`);
            console.log('');
            console.log('🧪 After deployment completes (~15-20 minutes), test with:');
            console.log('   node scripts/test-cdn-paths.js');
            console.log('');
            console.log('🔗 Your CDN will support these new paths:');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/images/...');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/css/...');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/js/...');

        } catch (error) {
            console.error('❌ CloudFront update failed:', error.message);
            
            if (error.name === 'InvalidIfMatchVersion') {
                console.log('');
                console.log('🔄 The distribution was modified during this update.');
                console.log('   Please run the script again to retry.');
            }
        } finally {
            this.rl.close();
        }
    }
}

// Run the interactive updater
const updater = new InteractiveCloudFrontUpdater();
updater.run();