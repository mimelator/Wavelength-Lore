/**
 * AWS Resource Configuration Template
 * 
 * Copy this file to aws-resources.js and update with your actual values.
 * The aws-resources.js file should be added to .gitignore for security.
 */

module.exports = {
  // AWS Account Information
  aws: {
    accountId: process.env.AWS_ACCOUNT_ID || 'YOUR_AWS_ACCOUNT_ID',
    region: process.env.AWS_REGION || 'us-east-1'
  },

  // App Runner Service
  appRunner: {
    serviceArn: process.env.APPRUNNER_SERVICE_ARN || 
      'arn:aws:apprunner:REGION:ACCOUNT_ID:service/SERVICE_NAME/SERVICE_ID',
    serviceName: process.env.APPRUNNER_SERVICE_NAME || 'your-service-name',
    serviceId: process.env.APPRUNNER_SERVICE_ID || 'your-service-id'
  },

  // S3 Resources
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'your-bucket-name',
    backupBucketName: process.env.S3_BACKUP_BUCKET_NAME || 'your-backup-bucket'
  },

  // CloudFront
  cloudFront: {
    // Primary distribution (main site)
    primary: {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'your-distribution-id',
      distributionDomain: process.env.CLOUDFRONT_DOMAIN || 'your-distribution.cloudfront.net',
      etag: process.env.CLOUDFRONT_ETAG || 'your-etag'
    },
    // Gallery distribution (photo gallery)
    gallery: {
      distributionId: process.env.GALLERY_CLOUDFRONT_DISTRIBUTION_ID || 'your-gallery-distribution-id',
      distributionDomain: process.env.GALLERY_CLOUDFRONT_DOMAIN || 'your-gallery-distribution.cloudfront.net',
      etag: process.env.GALLERY_CLOUDFRONT_ETAG || 'your-gallery-etag'
    },
    // Legacy field for backward compatibility
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'your-distribution-id',
    distributionDomain: process.env.CLOUDFRONT_DOMAIN || 'your-distribution.cloudfront.net',
    etag: process.env.CLOUDFRONT_ETAG || 'your-etag'
  },

  // ECR Repository
  ecr: {
    repositoryUri: process.env.ECR_REPOSITORY_URI || 
      'ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/your-repo'
  }
};