/**
 * Debug script to check what's actually in S3 for a specific user
 */

const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
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
const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function debugUserGallery() {
  console.log('🔍 Debugging S3 Gallery for user:', userId);
  console.log('📦 Bucket:', bucketName);
  console.log('🔍 Prefix:', `images/gallery/${userId}/`);
  
  try {
    // List objects in the user's gallery folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `images/gallery/${userId}/`
    });
    
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('⚠️ No objects found in user gallery folder');
      return;
    }
    
    console.log(`📁 Found ${response.Contents.length} objects:`);
    
    for (const object of response.Contents) {
      console.log(`\n📄 Object: ${object.Key}`);
      console.log(`   Size: ${object.Size} bytes`);
      console.log(`   Last Modified: ${object.LastModified}`);
      
      // Try to get object metadata
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: object.Key
        });
        
        const metadata = await s3Client.send(headCommand);
        console.log(`   Content-Type: ${metadata.ContentType}`);
        console.log(`   ETag: ${metadata.ETag}`);
        
        if (metadata.Metadata) {
          console.log(`   Custom Metadata:`, metadata.Metadata);
        }
        
      } catch (headError) {
        console.log(`   ❌ Could not get metadata: ${headError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error listing objects:', error);
  }
}

debugUserGallery();