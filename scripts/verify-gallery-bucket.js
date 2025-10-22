/**
 * Gallery S3 Bucket Access Verification
 * 
 * This utility tests the access to the gallery S3 bucket by:
 * 1. Listing the bucket contents
 * 2. Uploading a small test file
 * 3. Getting the test file
 * 4. Deleting the test file
 * 
 * Run with: node verify-gallery-bucket.js
 */

const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Get bucket name from environment or use default
const bucketName = process.env.GALLERY_S3_BUCKET || 'wavelength-gallery-346923';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

// Test key for verification (using a UUID-like name to avoid conflicts)
const testKey = `_test/gallery-verify-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.txt`;

/**
 * Main verification function
 */
async function verifyGalleryBucket() {
  console.log('🧪 Verifying gallery S3 bucket access');
  console.log(`🪣 Bucket: ${bucketName}`);
  console.log(`🔑 Using credentials:`);
  console.log(`   - Access Key: ${(process.env.ACCESS_KEY_ID || '').substring(0, 5)}...`);
  console.log(`   - Secret Key: ***********`);
  console.log(`   - Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  
  try {
    // Step 1: List bucket contents
    console.log('\n📋 Step 1: Listing bucket contents...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
      Prefix: 'images/gallery/'
    });
    
    const listResponse = await s3Client.send(listCommand);
    console.log(`✅ Successfully listed bucket. Found ${listResponse.Contents?.length || 0} objects.`);
    
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log('   Sample items:');
      listResponse.Contents.slice(0, 3).forEach(item => {
        console.log(`   - ${item.Key} (${item.Size} bytes)`);
      });
    }
    
    // Step 2: Upload a test file
    console.log('\n📤 Step 2: Uploading test file...');
    const testContent = 'This is a test file to verify S3 bucket permissions for the gallery feature.';
    
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        'test-purpose': 'gallery-verification',
        'timestamp': new Date().toISOString()
      }
    });
    
    await s3Client.send(uploadCommand);
    console.log(`✅ Test file uploaded successfully: ${testKey}`);
    
    // Step 3: Get the test file
    console.log('\n📥 Step 3: Retrieving test file...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey
    });
    
    const getResponse = await s3Client.send(getCommand);
    const retrievedContent = await streamToString(getResponse.Body);
    
    if (retrievedContent === testContent) {
      console.log('✅ Test file retrieved successfully and content matches');
    } else {
      console.warn('⚠️ Test file retrieved but content does not match');
      console.log(`   Expected: ${testContent}`);
      console.log(`   Received: ${retrievedContent}`);
    }
    
    // Step 4: Delete the test file
    console.log('\n🗑️ Step 4: Deleting test file...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey
    });
    
    await s3Client.send(deleteCommand);
    console.log('✅ Test file deleted successfully');
    
    // Final verdict
    console.log('\n🎉 Gallery S3 bucket verification complete!');
    console.log('✅ All access tests passed successfully');
    console.log('📝 The gallery feature should work correctly with the current configuration.');
    
  } catch (error) {
    console.error('\n❌ Error during gallery bucket verification:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide more detailed diagnostics
    console.log('\n🔍 Diagnostic Information:');
    
    if (error.name === 'NoSuchBucket') {
      console.log('❌ The specified bucket does not exist. Please check the bucket name.');
    } else if (error.name === 'AccessDenied') {
      console.log('❌ Access denied. The current credentials do not have permission to access this bucket.');
      console.log('   Verify that:');
      console.log('   1. The correct AWS credentials are being used');
      console.log('   2. The bucket policy allows access for the current IAM user');
      console.log('   3. The bucket\'s public access settings are correctly configured');
    } else if (error.name === 'CredentialsProviderError') {
      console.log('❌ Credential provider error. AWS credentials are missing or invalid.');
      console.log('   Verify that AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly.');
    } else {
      console.log(`❌ Error type: ${error.name}`);
      console.log(`   Code: ${error.Code || error.code || 'Unknown'}`);
      console.log(`   Message: ${error.message}`);
    }
    
    console.log('\n🛠️ Recommended Actions:');
    console.log('1. Run the configure-gallery-bucket.sh script to set up proper bucket permissions');
    console.log('2. Check that the correct AWS credentials are in .env');
    console.log('3. Ensure the IAM user has appropriate permissions in AWS');
    
    process.exit(1);
  }
}

/**
 * Helper to convert stream to string
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Run the verification
verifyGalleryBucket();