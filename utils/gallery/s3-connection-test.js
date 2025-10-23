/**
 * S3 Connection Test Utility
 * 
 * Tests S3 connection on server startup to ensure proper configuration
 */

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

/**
 * Test the S3 connection
 */
async function testS3Connection() {
  console.log('🧪 Testing S3 connection...');

  try {
    // Make sure we use the correct ACCESS_KEY_ID format (no AWS_ prefix)
    const accessKeyId = process.env.ACCESS_KEY_ID;
    const secretAccessKey = process.env.SECRET_ACCESS_KEY;
    
    if (!accessKeyId || !secretAccessKey) {
      console.error('❌ Missing AWS credentials in environment variables');
      console.error('   Check that ACCESS_KEY_ID and SECRET_ACCESS_KEY are set');
    }
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    console.log('🔑 Using AWS credentials:');
    console.log(`   - Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`   - Access Key ID: ${accessKeyId ? accessKeyId.substring(0, 5) + '...' : 'undefined'}`);
    console.log(`   - Secret Access Key: ${secretAccessKey ? '********' : 'undefined'}`);

    const bucketName = process.env.GALLERY_S3_BUCKET || process.env.S3_BUCKET_NAME || process.env.BACKUP_S3_BUCKET || 'wavelength-lore-bucket';
    console.log(`🪣 Gallery bucket configured as: ${bucketName}`);

    // First, list all buckets to check general connection
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log(`✅ S3 connection successful! Found ${response.Buckets.length} buckets:`);
    response.Buckets.forEach(bucket => {
      console.log(`   - ${bucket.Name}${bucket.Name === bucketName ? ' (Gallery Bucket)' : ''}`);
    });
    
    const galleryBucketExists = response.Buckets.some(bucket => bucket.Name === bucketName);
    
    if (!galleryBucketExists) {
      console.warn(`⚠️  WARNING: Gallery bucket "${bucketName}" not found among available buckets!`);
      console.warn('    Make sure the bucket exists and the IAM user has access to it.');
    } else {
      console.log(`✅ Gallery bucket "${bucketName}" verified and accessible.`);
    }
    
    return {
      success: true,
      message: 'S3 connection successful',
      bucketExists: galleryBucketExists,
      availableBuckets: response.Buckets.map(b => b.Name)
    };
  } catch (error) {
    console.error('❌ S3 connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

module.exports = {
  testS3Connection
};