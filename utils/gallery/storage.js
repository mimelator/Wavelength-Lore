/**
 * Gallery Storage Utility
 * 
 * Handles S3 storage operations for user gallery images with quota management
 * based on user group membership.
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Import gallery config with proper environment variables
const config = require('./config');

// Initialize S3 client - using app user credentials (ACCESS_KEY_ID)
const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.ACCESS_KEY_ID,
    secretAccessKey: config.SECRET_ACCESS_KEY
  }
});

// CRITICAL: Validate gallery bucket configuration
if (!config.GALLERY_S3_BUCKET) {
    throw new Error('CRITICAL ERROR: GALLERY_S3_BUCKET environment variable is not set. Gallery operations cannot use lore bucket.');
}

if (config.GALLERY_S3_BUCKET === 'wavelength-lore-bucket') {
    throw new Error('CRITICAL ERROR: GALLERY_S3_BUCKET is set to lore bucket. This would contaminate system content with user uploads.');
}

const bucketName = config.GALLERY_S3_BUCKET;
console.log('🪣 Gallery S3 Bucket configured as:', bucketName);
console.log('🔑 Using credentials with Access Key ID:', config.ACCESS_KEY_ID ? config.ACCESS_KEY_ID.substring(0, 5) + '...' : 'undefined');
const cdnUrl = config.CDN_URL || `https://${bucketName}.s3.amazonaws.com`;
console.log('🌐 Gallery CDN URL configured as:', cdnUrl);









/**
 * Upload an image to S3 for user gallery
 * 
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} userId - User ID
 * @param {Array<string>} userGroups - User's group memberships
 * @param {string} title - Optional title for the image
 * @param {Array<string>} tags - Optional tags for the image
 * @returns {Promise<{success: boolean, url?: string, relativePath?: string, error?: string}>}
 */
async function uploadGalleryImage(fileBuffer, fileName, mimeType, userId, userGroups, title = '', tags = []) {
  try {
    console.log(`⬆️ Starting upload to gallery for user: ${userId}`);
    console.log(`📄 File name: ${fileName}`);
    console.log(`📦 S3 bucket: ${bucketName}`);
    console.log(`🔗 CDN URL: ${cdnUrl}`);
    
    // Check if file buffer is valid
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      console.error(`❌ Invalid file buffer:`, fileBuffer);
      return {
        success: false,
        error: 'Invalid file buffer'
      };
    }
    
    // Check file size
    const fileSize = fileBuffer.length;
    console.log(`📊 File size: ${fileSize} bytes`);
    
    if (fileSize === 0) {
      console.error(`❌ Empty file buffer (zero bytes)`);
      return {
        success: false,
        error: 'Empty file buffer'
      };
    }
    
    // Check AWS credentials
    if (!process.env.ACCESS_KEY_ID || !process.env.SECRET_ACCESS_KEY) {
      console.error(`❌ Missing AWS credentials`);
      console.error(`ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID ? 'Set' : 'Missing'}`);
      console.error(`SECRET_ACCESS_KEY: ${process.env.SECRET_ACCESS_KEY ? 'Set' : 'Missing'}`);
      return {
        success: false,
        error: 'Missing AWS credentials'
      };
    }
    

    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(fileName).toLowerCase();
    const isVideo = mimeType.startsWith('video/');
    const prefix = isVideo ? 'video' : 'image';
    const newFileName = `${prefix}-${timestamp}-${randomId}${extension}`;
    
    // Construct S3 key (path)
    const s3Key = `images/gallery/${userId}/${newFileName}`;
    
    // Sanitize metadata values
    const sanitizeMetadata = (value) => {
      if (!value) return 'unknown';
      return value
        .replace(/[\r\n\t]/g, ' ')
        .replace(/[^\x20-\x7E]/g, '')
        .substring(0, 200)
        .trim();
    };
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'max-age=31536000', // 1 year cache
      Metadata: {
        'uploaded-by': userId,
        'original-name': sanitizeMetadata(fileName),
        'uploaded-at': new Date().toISOString(),
        'title': sanitizeMetadata(title || fileName),
        'tags': sanitizeMetadata(tags.join(','))
      }
    };
    
    console.log(`🚀 Uploading to S3 with parameters:`);
    console.log(`  Bucket: ${uploadParams.Bucket}`);
    console.log(`  Key: ${uploadParams.Key}`);
    console.log(`  ContentType: ${uploadParams.ContentType}`);
    console.log(`  Metadata:`, uploadParams.Metadata);

    const command = new PutObjectCommand(uploadParams);
    
    try {
      console.log(`� Sending PutObjectCommand to S3...`);
      const result = await s3Client.send(command);
      console.log(`✅ S3 upload successful:`, result);
      
      // Verify the upload by trying to get the object
      console.log(`🔍 Verifying upload by checking if object exists...`);
      try {
        const verifyCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: s3Key
        });
        
        const verifyResult = await s3Client.send(verifyCommand);
        console.log(`✅ S3 upload verified. Object exists with ETag: ${verifyResult.ETag}`);
      } catch (verifyError) {
        console.error(`⚠️ Upload verification failed:`, verifyError);
        console.log(`   Continuing anyway since the initial upload was successful.`);
      }
    } catch (s3Error) {
      console.error('❌ S3 upload error:', s3Error);
      
      // More detailed error diagnostics
      console.error(`S3 Error Details:`);
      console.error(`  Code: ${s3Error.Code || s3Error.name}`);
      console.error(`  Message: ${s3Error.message}`);
      console.error(`  Request ID: ${s3Error.$metadata?.requestId || 'Unknown'}`);
      
      // Common error handling
      if (s3Error.name === 'NoSuchBucket') {
        console.error(`  The bucket "${bucketName}" does not exist.`);
        return {
          success: false,
          error: `S3 bucket "${bucketName}" does not exist`
        };
      } else if (s3Error.name === 'AccessDenied') {
        console.error(`  Access denied. Check IAM permissions for the user.`);
        return {
          success: false,
          error: `Access denied to S3 bucket. Check IAM permissions`
        };
      }
      
      throw s3Error;
    }

    // Construct the relative path and CDN URL
    const relativePath = `images/gallery/${userId}/${newFileName}`;
    const cdnPath = `${cdnUrl}/${relativePath}`;
    console.log(`🔗 Image CDN URL: ${cdnPath}`);

    return {
      success: true,
      url: cdnPath,
      relativePath,
      fileName: newFileName,
      originalName: fileName,
      size: fileSize,
      mimeType,
      title: title || fileName,
      tags: tags
    };
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

/**
 * Delete a user's gallery image from S3
 * 
 * @param {string} userId - User ID
 * @param {string} relativePath - Relative path of the image in S3
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteGalleryImage(userId, relativePath) {
  try {
    // Validate that the image belongs to this user
    // Extract userId from the path to ensure user can only delete their own images
    const pathParts = relativePath.split('/');
    if (pathParts.length < 3 || pathParts[0] !== 'images' || pathParts[1] !== 'gallery' || pathParts[2] !== userId) {
      return {
        success: false,
        error: 'Permission denied: You can only delete your own gallery images'
      };
    }
    
    // Delete from S3
    const params = {
      Bucket: bucketName,
      Key: relativePath
    };
    
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image'
    };
  }
}



/**
 * List a user's gallery images
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array<{url: string, relativePath: string, fileName: string, size: number, lastModified: Date}>>}
 */
async function listUserGalleryImages(userId) {
  try {
    console.log(`📋 Listing gallery images for user: ${userId}`);
    console.log(`📦 Using S3 bucket: ${bucketName}`);
    console.log(`🔍 Searching path: images/gallery/${userId}/`);

    const params = {
      Bucket: bucketName,
      Prefix: `images/gallery/${userId}/`
    };
    
    const command = new ListObjectsV2Command(params);
    let response;
    
    try {
      response = await s3Client.send(command);
      console.log(`📦 S3 response received: ${response.Contents ? response.Contents.length : 0} objects found`);
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log('⚠️ No images found in S3 for this user');
        return [];
      }
    } catch (s3Error) {
      console.error('❌ S3 error when listing objects:', s3Error);
      throw s3Error;
    }
    
    // Map S3 objects to gallery images
    const images = await Promise.all(response.Contents.map(async (object) => {
      // Get object metadata (to retrieve original name)
      const headParams = {
        Bucket: bucketName,
        Key: object.Key
      };
      
      const headCommand = new HeadObjectCommand(headParams);
      let metadata = {};
      
      try {
        const headResponse = await s3Client.send(headCommand);
        metadata = headResponse.Metadata || {};
      } catch (error) {
        console.error(`Error getting metadata for ${object.Key}:`, error);
      }
      
      // Extract file name from key
      const fileName = object.Key.split('/').pop();
      
      return {
        url: `${cdnUrl}/${object.Key}`,
        relativePath: object.Key,
        fileName,
        originalName: metadata['original-name'] || fileName,
        title: metadata['title'] || metadata['original-name'] || fileName,
        tags: metadata['tags'] ? metadata['tags'].split(',') : [],
        size: object.Size,
        lastModified: object.LastModified,
        uploadedAt: metadata['uploaded-at'] ? new Date(metadata['uploaded-at']) : object.LastModified
      };
    }));
    
    // Sort by uploadedAt/lastModified (newest first)
    return images.sort((a, b) => {
      const dateA = a.uploadedAt || a.lastModified;
      const dateB = b.uploadedAt || b.lastModified;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error listing user gallery images:', error);
    throw error;
  }
}

/**
 * Download image buffer from S3
 * 
 * @param {string} relativePath - Relative path of the image in S3
 * @returns {Promise<Buffer|null>} Image buffer or null if not found
 */
async function downloadImageBuffer(relativePath) {
  try {
    console.log(`📥 Downloading image buffer from S3: ${relativePath}`);
    
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const params = {
      Bucket: bucketName,
      Key: relativePath
    };
    
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.error(`❌ No body in S3 response for ${relativePath}`);
      return null;
    }
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`✅ Downloaded ${buffer.length} bytes from S3`);
    return buffer;
  } catch (error) {
    console.error(`❌ Error downloading image buffer from ${relativePath}:`, error);
    return null;
  }
}

module.exports = {
  uploadGalleryImage,
  deleteGalleryImage,
  listUserGalleryImages,
  downloadImageBuffer
};