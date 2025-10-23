/**
 * Gallery S3 Proxy Middleware
 * 
 * Proxy requests for gallery images to S3 when running in local development mode
 * This allows the gallery to work correctly with localhost CDN URLs
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const galleryConfig = require('../utils/gallery/config');
const path = require('path');
const stream = require('stream');

// Initialize S3 client
const s3Client = new S3Client({
  region: galleryConfig.AWS_REGION,
  credentials: {
    accessKeyId: galleryConfig.ACCESS_KEY_ID,
    secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
  }
});

const bucketName = galleryConfig.GALLERY_S3_BUCKET;

/**
 * Middleware to proxy gallery image requests to S3
 */
function galleryS3Proxy(req, res, next) {
  // Only handle paths that start with /images/gallery/
  if (!req.path.startsWith('/images/gallery/')) {
    return next();
  }

  console.log(`🖼️ Gallery S3 proxy handling request: ${req.path}`);
  
  // Extract the relative path (remove leading slash)
  const relativePath = req.path.substring(1); // Remove leading slash
  
  console.log(`📂 Looking for S3 object: ${relativePath} in bucket: ${bucketName}`);
  
  // Create S3 get object command
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: relativePath
  });
  
  // Stream the S3 object to the response
  s3Client.send(command)
    .then(data => {
      // Set appropriate headers from S3 response
      res.set('Content-Type', data.ContentType || 'application/octet-stream');
      
      if (data.ContentLength) {
        res.set('Content-Length', data.ContentLength);
      }
      
      if (data.LastModified) {
        res.set('Last-Modified', data.LastModified.toUTCString());
      }
      
      if (data.ETag) {
        res.set('ETag', data.ETag);
      }
      
      // Add CORS headers for development
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Add cache headers (shorter for development)
      res.set('Cache-Control', 'public, max-age=60'); // 1 minute cache
      
      console.log(`✅ Found gallery image in S3, streaming to response`);
      console.log(`   Content-Type: ${data.ContentType}`);
      
      // Stream the S3 data to the response
      const readStream = data.Body;
      readStream.pipe(res);
      
    })
    .catch(error => {
      console.log(`❌ Error fetching gallery image from S3: ${error.message}`);
      
      if (error.name === 'NoSuchKey') {
        console.log(`   Image not found in S3: ${relativePath}`);
        // Pass to next middleware or 404 handler
        next();
      } else {
        console.error('S3 error details:', error);
        // Return a 500 error
        res.status(500).send('Error fetching image from gallery storage');
      }
    });
}

module.exports = galleryS3Proxy;