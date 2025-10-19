#!/usr/bin/env node

/**
 * CloudFront Configuration Analyzer
 * Retrieves current CloudFront distribution configuration to understand needed changes
 */

const { CloudFrontClient, GetDistributionConfigCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { fromEnv } = require('@aws-sdk/credential-providers');

async function analyzeCloudFrontConfig() {
    console.log('🔍 CLOUDFRONT DISTRIBUTION ANALYSIS');
    console.log('===================================');
    
    const DISTRIBUTION_ID = 'df5sj8f594cdx.cloudfront.net'.replace('.cloudfront.net', '');
    console.log(`📡 Distribution ID: ${DISTRIBUTION_ID}`);
    console.log('');

    try {
        // Initialize CloudFront client
        const cloudFrontClient = new CloudFrontClient({
            region: 'us-east-1', // CloudFront is global but uses us-east-1
            credentials: fromEnv()
        });

        console.log('📋 Retrieving current distribution configuration...');
        
        // Get distribution configuration
        const getConfigCommand = new GetDistributionConfigCommand({
            Id: DISTRIBUTION_ID
        });
        
        const configResponse = await cloudFrontClient.send(getConfigCommand);
        const config = configResponse.DistributionConfig;
        const etag = configResponse.ETag;

        console.log('✅ Configuration retrieved successfully');
        console.log('');

        console.log('🎯 CURRENT CONFIGURATION ANALYSIS:');
        console.log('');

        // Analyze origins
        console.log('📍 ORIGINS:');
        config.Origins.Items.forEach((origin, index) => {
            console.log(`   Origin ${index + 1}:`);
            console.log(`     ID: ${origin.Id}`);
            console.log(`     Domain: ${origin.DomainName}`);
            if (origin.OriginPath) {
                console.log(`     Path: ${origin.OriginPath}`);
            }
            console.log('');
        });

        // Analyze cache behaviors
        console.log('🔄 CACHE BEHAVIORS:');
        console.log('   Default Behavior:');
        console.log(`     Target Origin: ${config.DefaultCacheBehavior.TargetOriginId}`);
        console.log(`     Viewer Protocol: ${config.DefaultCacheBehavior.ViewerProtocolPolicy}`);
        console.log(`     Allowed Methods: ${config.DefaultCacheBehavior.AllowedMethods.Items.join(', ')}`);
        console.log('');

        if (config.CacheBehaviors && config.CacheBehaviors.Items.length > 0) {
            console.log('   Additional Behaviors:');
            config.CacheBehaviors.Items.forEach((behavior, index) => {
                console.log(`     Behavior ${index + 1}:`);
                console.log(`       Path Pattern: ${behavior.PathPattern}`);
                console.log(`       Target Origin: ${behavior.TargetOriginId}`);
                console.log('');
            });
        } else {
            console.log('   ⚠️  No additional cache behaviors configured');
            console.log('');
        }

        // Generate configuration recommendations
        console.log('💡 REQUIRED CONFIGURATION CHANGES:');
        console.log('');

        console.log('1️⃣  ADD CACHE BEHAVIOR FOR IMAGES:');
        console.log('   Path Pattern: /images/*');
        console.log('   Origin: Same as default (likely S3)');
        console.log('   Headers: None or minimal');
        console.log('   Query Strings: Ignore');
        console.log('   Cookies: Ignore');
        console.log('');

        console.log('2️⃣  ENSURE CSS/JS BEHAVIORS EXIST:');
        console.log('   Path Pattern: /css/*');
        console.log('   Path Pattern: /js/*');
        console.log('   Origin: Same as default');
        console.log('   Compression: Enabled');
        console.log('');

        console.log('3️⃣  MAINTAIN LEGACY SUPPORT (Optional):');
        console.log('   Keep existing /static/* behaviors for backward compatibility');
        console.log('');

        // Generate AWS CLI commands
        console.log('🛠️  AWS CLI CONFIGURATION COMMANDS:');
        console.log('');

        const newConfig = {
            ...config,
            CacheBehaviors: {
                Quantity: (config.CacheBehaviors?.Quantity || 0) + 3,
                Items: [
                    ...(config.CacheBehaviors?.Items || []),
                    {
                        PathPattern: '/images/*',
                        TargetOriginId: config.DefaultCacheBehavior.TargetOriginId,
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
                        DefaultTTL: 86400,
                        MaxTTL: 31536000,
                        Compress: false
                    },
                    {
                        PathPattern: '/css/*',
                        TargetOriginId: config.DefaultCacheBehavior.TargetOriginId,
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
                        DefaultTTL: 86400,
                        MaxTTL: 31536000,
                        Compress: true
                    },
                    {
                        PathPattern: '/js/*',
                        TargetOriginId: config.DefaultCacheBehavior.TargetOriginId,
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
                        DefaultTTL: 86400,
                        MaxTTL: 31536000,
                        Compress: true
                    }
                ]
            }
        };

        // Save configuration for update
        const configData = {
            distributionId: DISTRIBUTION_ID,
            etag: etag,
            config: newConfig
        };

        require('fs').writeFileSync('./temp/cloudfront-config-update.json', JSON.stringify(configData, null, 2));
        
        console.log('📁 Configuration saved to: ./temp/cloudfront-config-update.json');
        console.log('');

        console.log('✅ NEXT STEPS:');
        console.log('1. Review the generated configuration');
        console.log('2. Apply the configuration using AWS CLI or SDK');
        console.log('3. Wait for distribution deployment (15-20 minutes)');
        console.log('4. Test the new paths');

        return configData;

    } catch (error) {
        console.error('❌ Error analyzing CloudFront configuration:', error.message);
        
        if (error.name === 'AccessDenied' || error.message.includes('credentials')) {
            console.log('');
            console.log('🔑 CREDENTIALS ISSUE:');
            console.log('Make sure your AWS credentials have CloudFront permissions:');
            console.log('- cloudfront:GetDistribution');
            console.log('- cloudfront:GetDistributionConfig');
            console.log('- cloudfront:UpdateDistribution');
        }
        
        throw error;
    }
}

// Run the analysis
analyzeCloudFrontConfig().catch(console.error);