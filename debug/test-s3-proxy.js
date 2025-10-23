/**
 * Test the S3 proxy middleware directly
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const galleryConfig = require('../utils/gallery/config');

// Initialize S3 client
const s3Client = new S3Client({
  region: galleryConfig.AWS_REGION,
  credentials: {
    accessKeyId: galleryConfig.ACCESS_KEY_ID,
    secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
  }
});

const bucketName = galleryConfig.GALLERY_S3_BUCKET;

async function testS3Proxy() {
  const imagePath = 'images/gallery/4fdbYxJHjEP4xksk9sgFE3lgYUs2/image-1761180068955-c4853770ee903496.webp';
  
  console.log('🧪 Testing S3 proxy logic...');
  console.log('📦 Bucket:', bucketName);
  console.log('🔍 Key:', imagePath);
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: imagePath
    });
    
    console.log('📡 Sending S3 GetObject command...');
    const data = await s3Client.send(command);
    
    console.log('✅ S3 GetObject successful!');
    console.log('📊 Response details:');
    console.log(`   ContentType: ${data.ContentType}`);
    console.log(`   ContentLength: ${data.ContentLength}`);
    console.log(`   LastModified: ${data.LastModified}`);
    console.log(`   ETag: ${data.ETag}`);
    
    // Try to read a small amount of the body to confirm it's readable
    const chunks = [];
    let totalBytes = 0;
    
    for await (const chunk of data.Body) {
      chunks.push(chunk);
      totalBytes += chunk.length;
      if (totalBytes > 1000) break; // Just read first 1KB for testing
    }
    
    console.log(`✅ Successfully read ${totalBytes} bytes from S3 stream`);
    
  } catch (error) {
    console.error('❌ S3 proxy test failed:', error);
  }
}

testS3Proxy();