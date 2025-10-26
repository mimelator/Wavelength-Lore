#!/usr/bin/env node

/**
 * AWS Configuration Helper
 * Provides robust AWS resource configuration with fallbacks
 * Enterprise-grade error handling and environment variable support
 */

const path = require('path');

class AWSConfigHelper {
    static getConfig() {
        // Try to load from the actual config file first
        try {
            const configPath = path.join(__dirname, '../../config/aws-resources.js');
            return require(configPath);
        } catch (error) {
            // If config file doesn't exist, create from environment variables
            console.log('⚠️  aws-resources.js not found, using environment variables');
            
            return {
                appRunner: {
                    serviceArn: process.env.APPRUNNER_SERVICE_ARN || 
                               'arn:aws:apprunner:us-east-1:170023515523:service/wavelength-lore/wavelength-lore-service',
                    serviceName: process.env.APPRUNNER_SERVICE_NAME || 'wavelength-lore',
                    region: process.env.AWS_REGION || 'us-east-1'
                },
                cloudfront: {
                    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'E2QFR8E7I4A6ZT',
                    domainName: process.env.CLOUDFRONT_DOMAIN || 'df5sj8f594cdx.cloudfront.net',
                    galleryDistributionId: process.env.CLOUDFRONT_GALLERY_DISTRIBUTION_ID || 'E27178HG3YCIMO',
                    galleryDomainName: process.env.CLOUDFRONT_GALLERY_DOMAIN || 'd3ohg9sf8htmwk.cloudfront.net'
                },
                s3: {
                    bucketName: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
                    galleryBucketName: process.env.S3_GALLERY_BUCKET_NAME || 'wavelength-lore-gallery-bucket',
                    region: process.env.AWS_REGION || 'us-east-1'
                },
                ecr: {
                    repositoryUri: process.env.ECR_REPOSITORY_URI || 
                                  '170023515523.dkr.ecr.us-east-1.amazonaws.com/wavelength-lore',
                    region: process.env.AWS_REGION || 'us-east-1'
                },
                region: process.env.AWS_REGION || 'us-east-1',
                accountId: process.env.AWS_ACCOUNT_ID || '170023515523'
            };
        }
    }

    static validateConfig(config) {
        const required = [
            'appRunner.serviceArn',
            'cloudfront.distributionId',
            's3.bucketName',
            'region'
        ];

        const missing = [];
        
        for (const path of required) {
            const keys = path.split('.');
            let current = config;
            
            for (const key of keys) {
                if (!current || !current[key]) {
                    missing.push(path);
                    break;
                }
                current = current[key];
            }
        }

        if (missing.length > 0) {
            console.warn('⚠️  Missing AWS configuration values:', missing.join(', '));
            console.warn('   Consider creating config/aws-resources.js or setting environment variables');
        }

        return missing.length === 0;
    }

    static getConfigWithValidation() {
        const config = this.getConfig();
        this.validateConfig(config);
        return config;
    }
}

// Export both the class and a convenient function
module.exports = AWSConfigHelper;
module.exports.getAWSConfig = () => AWSConfigHelper.getConfigWithValidation();