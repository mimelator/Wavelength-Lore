#!/usr/bin/env node

/**
 * Setup S3 Bucket for Forum File Attachments
 * Creates a dedicated S3 bucket with proper permissions for forum file uploads
 */

const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, PutPublicAccessBlockCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class ForumS3BucketSetup {
  constructor() {
    // Use S3 admin credentials for bucket creation
    const credentials = process.env.AWS_ACCESS_KEY_ADMIN && process.env.AWS_SECRET_ACCESS_KEY_ADMIN ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ADMIN,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ADMIN
    } : undefined;
    
    this.s3Client = new S3Client({
      region: 'us-east-1',
      credentials: credentials
    });
    
    this.bucketName = 'wavelength-forum-attachments';
    this.region = 'us-east-1';
    
    // Log which credentials we're using
    if (credentials) {
      console.log('🔑 Using S3 admin credentials for bucket setup');
    } else {
      console.log('🔑 Using default AWS credentials');
    }
  }

  /**
   * Check if bucket already exists
   */
  async checkBucketExists() {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucketName
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Create the S3 bucket
   */
  async createBucket() {
    try {
      console.log(`🪣 Creating S3 bucket: ${this.bucketName}`);
      
      const createCommand = new CreateBucketCommand({
        Bucket: this.bucketName,
        CreateBucketConfiguration: this.region !== 'us-east-1' ? {
          LocationConstraint: this.region
        } : undefined
      });

      await this.s3Client.send(createCommand);
      console.log('✅ S3 bucket created successfully');
      
      // Wait a moment for bucket to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      if (error.name === 'BucketAlreadyOwnedByYou') {
        console.log('ℹ️  Bucket already exists and is owned by you');
      } else {
        throw error;
      }
    }
  }

  /**
   * Configure CORS for the bucket
   */
  async configureCORS() {
    console.log('🌐 Configuring CORS policy...');
    
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'http://localhost:3001',
            'https://wavelengthlore.com',
            'https://*.wavelengthlore.com'
          ],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000
        }
      ]
    };

    const corsCommand = new PutBucketCorsCommand({
      Bucket: this.bucketName,
      CORSConfiguration: corsConfiguration
    });

    await this.s3Client.send(corsCommand);
    console.log('✅ CORS configuration applied');
  }

  /**
   * Configure public access settings
   */
  async configurePublicAccess() {
    console.log('🔓 Configuring public access settings...');
    
    // Allow public read access for uploaded files
    const publicAccessCommand = new PutPublicAccessBlockCommand({
      Bucket: this.bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });

    await this.s3Client.send(publicAccessCommand);
    console.log('✅ Public access settings configured');
  }

  /**
   * Configure bucket policy for public read access
   */
  async configureBucketPolicy() {
    console.log('📋 Configuring bucket policy...');
    
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${this.bucketName}/forum/attachments/*`
        }
      ]
    };

    const policyCommand = new PutBucketPolicyCommand({
      Bucket: this.bucketName,
      Policy: JSON.stringify(bucketPolicy)
    });

    await this.s3Client.send(policyCommand);
    console.log('✅ Bucket policy applied');
  }

  /**
   * Display configuration summary
   */
  displaySummary() {
    console.log('\n🎉 Forum S3 Bucket Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Bucket Name: ${this.bucketName}`);
    console.log(`🌍 Region: ${this.region}`);
    console.log(`🔗 S3 URL: https://${this.bucketName}.s3.${this.region}.amazonaws.com`);
    console.log('');
    console.log('📁 File Structure:');
    console.log('   └── forum/');
    console.log('       └── attachments/');
    console.log('           ├── {userId}/');
    console.log('           │   └── {postId}/');
    console.log('           │       └── {timestamp}-{random}.{ext}');
    console.log('');
    console.log('🔧 Configuration Applied:');
    console.log('   ✅ CORS policy for web uploads');
    console.log('   ✅ Public read access for attachments');
    console.log('   ✅ Secure bucket policy');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Update .env file with new bucket name');
    console.log('   2. Deploy environment variables to production');
    console.log('   3. Test file upload functionality');
    console.log('');
    console.log('💡 Environment Variable:');
    console.log(`   FORUM_ATTACHMENTS_BUCKET=${this.bucketName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Main setup process
   */
  async setup() {
    try {
      console.log('🚀 Setting up S3 bucket for forum file attachments...');
      console.log('');
      
      // Check if bucket exists
      const bucketExists = await this.checkBucketExists();
      
      if (bucketExists) {
        console.log(`ℹ️  Bucket ${this.bucketName} already exists`);
      } else {
        await this.createBucket();
      }
      
      // Configure bucket settings
      await this.configurePublicAccess();
      await this.configureCORS();
      await this.configureBucketPolicy();
      
      // Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Error setting up forum S3 bucket:', error);
      console.error('');
      console.error('💡 Troubleshooting:');
      console.error('   1. Check AWS credentials are valid');
      console.error('   2. Ensure user has S3 permissions');
      console.error('   3. Verify region settings');
      console.error('   4. Check if bucket name is available');
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛠️  Forum S3 Bucket Setup');
    console.log('');
    console.log('Usage: node setup-forum-s3-bucket.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help      Show this help message');
    console.log('');
    console.log('This script creates and configures an S3 bucket for forum file attachments.');
    console.log('The bucket will be configured with:');
    console.log('  • CORS policy for web uploads');
    console.log('  • Public read access for attachments');
    console.log('  • Secure bucket policy');
    console.log('');
    return;
  }
  
  const setup = new ForumS3BucketSetup();
  await setup.setup();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = ForumS3BucketSetup;