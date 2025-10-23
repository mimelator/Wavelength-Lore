/**
 * CDN Test Utilities
 * 
 * Provides utilities for testing CDN integration without requiring direct public access
 */

const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.GALLERY_S3_BUCKET || process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
const cdnUrl = process.env.CDN_URL || `https://${bucketName}.s3.amazonaws.com`;

/**
 * Convert a CDN URL to an S3 object key
 * 
 * @param {string} cdnUrl - The full CDN URL
 * @returns {string} S3 object key
 */
function cdnUrlToS3Key(url) {
  // Extract path from CDN URL
  let key;
  
  try {
    const urlObj = new URL(url);
    key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
  } catch (err) {
    // If URL parsing fails, assume it's a relative path
    key = url.startsWith('/') ? url.substring(1) : url;
  }
  
  // Remove any query parameters
  return key.split('?')[0];
}

/**
 * Check if an image is available in S3 (bypassing CDN restrictions)
 * 
 * @param {string} cdnUrl - The CDN URL of the image
 * @returns {Promise<Object>} Object details from S3
 */
async function validateImageInS3(cdnUrl) {
  try {
    const s3Key = cdnUrlToS3Key(cdnUrl);
    
    console.log(`Validating S3 object: s3://${bucketName}/${s3Key}`);
    
    // Get object metadata
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    
    const response = await s3Client.send(command);
    
    return {
      success: true,
      exists: true,
      contentType: response.ContentType,
      size: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata || {},
      s3Path: `s3://${bucketName}/${s3Key}`,
      cdnUrl: cdnUrl
    };
  } catch (error) {
    if (error.name === 'NotFound') {
      return {
        success: false,
        exists: false,
        error: 'Object not found in S3'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Get a pre-signed S3 URL for temporary access to an object
 * 
 * @param {string} cdnUrl - The CDN URL of the image
 * @param {number} expiresInSeconds - URL expiration in seconds (default: 1 hour)
 * @returns {Promise<string>} Pre-signed S3 URL
 */
async function getPreSignedS3Url(cdnUrl, expiresInSeconds = 3600) {
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  
  try {
    const s3Key = cdnUrlToS3Key(cdnUrl);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    
    return {
      success: true,
      signedUrl,
      expiresIn: expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  validateImageInS3,
  getPreSignedS3Url,
  cdnUrlToS3Key
};