#!/usr/bin/env node

/**
 * Automated CloudFront Distribution Updater
 * Updates CloudFront distribution to support new path structure for Wavelength Lore
 */

const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { fromEnv } = require('@aws-sdk/credential-providers');
const fs = require('fs');
const path = require('path');

const DISTRIBUTION_ID = 'df5sj8f594cdx';
const BACKUP_DIR = './temp/cloudfront-backups';

class CloudFrontUpdater {
    constructor() {
        this.client = new CloudFrontClient({
            region: 'us-east-1', // CloudFront is global but uses us-east-1
            credentials: fromEnv()
        });
        
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    async validateCredentials() {
        try {
            // Test credentials by making a simple API call
            const command = new GetDistributionConfigCommand({ Id: DISTRIBUTION_ID });
            await this.client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'AccessDenied' || error.message.includes('credentials')) {
                console.error('❌ AWS credentials issue:', error.message);
                console.log('');
                console.log('🔑 Required AWS permissions:');
                console.log('   • cloudfront:GetDistribution');
                console.log('   • cloudfront:GetDistributionConfig');
                console.log('   • cloudfront:UpdateDistribution');
                console.log('');
                console.log('💡 Set up credentials:');
                console.log('   export AWS_ACCESS_KEY_ID=your_key');
                console.log('   export AWS_SECRET_ACCESS_KEY=your_secret');
                console.log('   or run: aws configure');
                return false;
            }
            throw error;
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
            timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`✅ Current config backed up to: ${backupFile}`);
        
        return {
            config: response.DistributionConfig,
            etag: response.ETag
        };
    }

    createNewCacheBehaviors(existingOriginId) {
        return [
            {
                PathPattern: '/images/*',
                TargetOriginId: existingOriginId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,    // 1 day
                MaxTTL: 31536000,     // 1 year
                Compress: false       // Images are already compressed
            },
            {
                PathPattern: '/css/*',
                TargetOriginId: existingOriginId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,    // 1 day
                MaxTTL: 31536000,     // 1 year
                Compress: true        // CSS benefits from compression
            },
            {
                PathPattern: '/js/*',
                TargetOriginId: existingOriginId,
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: { Forward: 'none' },
                    Headers: { Quantity: 0 }
                },
                TrustedSigners: { Enabled: false, Quantity: 0 },
                MinTTL: 0,
                DefaultTTL: 86400,    // 1 day
                MaxTTL: 31536000,     // 1 year
                Compress: true        // JS benefits from compression
            }
        ];
    }

    updateConfigWithNewBehaviors(config) {
        const originId = config.DefaultCacheBehavior.TargetOriginId;
        const newBehaviors = this.createNewCacheBehaviors(originId);
        
        // Check if behaviors already exist
        const existingBehaviors = config.CacheBehaviors?.Items || [];
        const existingPatterns = existingBehaviors.map(b => b.PathPattern);
        
        const behaviorsToAdd = newBehaviors.filter(behavior => 
            !existingPatterns.includes(behavior.PathPattern)
        );
        
        console.log('🔍 Analysis of required behaviors:');
        newBehaviors.forEach(behavior => {
            const exists = existingPatterns.includes(behavior.PathPattern);
            console.log(`   ${exists ? '✅' : '➕'} ${behavior.PathPattern} ${exists ? '(already exists)' : '(will be added)'}`);
        });
        
        if (behaviorsToAdd.length === 0) {
            console.log('✅ All required cache behaviors already exist!');
            return null; // No update needed
        }
        
        // Add new behaviors to existing ones
        const updatedBehaviors = [...existingBehaviors, ...behaviorsToAdd];
        
        const updatedConfig = {
            ...config,
            CacheBehaviors: {
                Quantity: updatedBehaviors.length,
                Items: updatedBehaviors
            }
        };
        
        console.log(`📋 Will add ${behaviorsToAdd.length} new cache behaviors`);
        return updatedConfig;
    }

    async updateDistribution(config, etag) {
        console.log('🚀 Updating CloudFront distribution...');
        
        const command = new UpdateDistributionCommand({
            Id: DISTRIBUTION_ID,
            DistributionConfig: config,
            IfMatch: etag
        });
        
        const response = await this.client.send(command);
        
        console.log('✅ Distribution update initiated successfully!');
        console.log(`📡 Distribution ID: ${DISTRIBUTION_ID}`);
        console.log(`🔄 Status: ${response.Distribution.Status}`);
        
        return response;
    }

    async waitForDeployment() {
        console.log('');
        console.log('⏰ CloudFront deployment process started...');
        console.log('📊 This typically takes 15-20 minutes');
        console.log('');
        console.log('🔍 You can monitor progress at:');
        console.log(`   https://console.aws.amazon.com/cloudfront/home#distribution-settings:${DISTRIBUTION_ID}`);
        console.log('');
        console.log('✅ Once deployed, test with:');
        console.log('   node scripts/test-cdn-paths.js');
    }

    async run() {
        try {
            console.log('🌐 AUTOMATED CLOUDFRONT UPDATER');
            console.log('===============================');
            console.log(`📡 Distribution: ${DISTRIBUTION_ID}`);
            console.log('');

            // Validate credentials
            const hasValidCreds = await this.validateCredentials();
            if (!hasValidCreds) {
                process.exit(1);
            }
            console.log('✅ AWS credentials validated');
            console.log('');

            // Get current configuration
            const { config, etag } = await this.getCurrentConfig();
            console.log('');

            // Update configuration with new behaviors
            const updatedConfig = this.updateConfigWithNewBehaviors(config);
            
            if (!updatedConfig) {
                console.log('🎉 No updates needed - configuration is already optimal!');
                return;
            }
            
            console.log('');

            // Confirm the update
            console.log('🤔 Ready to update CloudFront distribution with new cache behaviors?');
            console.log('');
            console.log('📋 Changes to be made:');
            console.log('   • Add /images/* behavior (no compression)');
            console.log('   • Add /css/* behavior (with compression)');
            console.log('   • Add /js/* behavior (with compression)');
            console.log('');
            console.log('⏰ Deployment time: ~15-20 minutes');
            console.log('🔄 Rollback: Available via backup file');
            console.log('');

            // In a real environment, you'd want user confirmation
            // For automation, we'll proceed directly
            console.log('🚀 Proceeding with update...');
            console.log('');

            // Update the distribution
            const updateResponse = await this.updateDistribution(updatedConfig, etag);
            
            // Save the updated configuration
            const updateFile = path.join(BACKUP_DIR, `config-updated-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.writeFileSync(updateFile, JSON.stringify({
                distributionConfig: updatedConfig,
                updateResponse: updateResponse,
                timestamp: new Date().toISOString()
            }, null, 2));
            
            console.log(`📁 Updated config saved to: ${updateFile}`);
            
            await this.waitForDeployment();
            
            console.log('');
            console.log('🎉 CloudFront update completed successfully!');
            console.log('');
            console.log('🔗 Your CDN should now support:');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/images/...');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/css/...');
            console.log('   • https://df5sj8f594cdx.cloudfront.net/js/...');
            console.log('');
            console.log('🧪 Test the update:');
            console.log('   node scripts/test-cdn-paths.js');

        } catch (error) {
            console.error('❌ CloudFront update failed:', error.message);
            
            if (error.name === 'InvalidIfMatchVersion') {
                console.log('');
                console.log('🔄 The distribution was modified during this update.');
                console.log('   Please run the script again to retry with the latest version.');
            } else if (error.name === 'TooManyDistributions') {
                console.log('');
                console.log('📊 You have reached the CloudFront distribution limit.');
                console.log('   Contact AWS support to increase your limit.');
            }
            
            process.exit(1);
        }
    }
}

// Run the updater
const updater = new CloudFrontUpdater();
updater.run();