/**
 * Media Upload Routes
 * Handles direct image and video uploads to S3 for content editing
 */

const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Initialize S3 client with the same credentials as AI generation
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
const cdnUrl = process.env.CDN_URL || `https://${bucketName}.s3.amazonaws.com`;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 1 // 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed (jpeg, jpg, png, gif, webp, mp4, mov, avi, webm)'));
    }
  }
});

/**
 * POST /api/upload/media
 * Upload an image or video file to S3
 */
router.post('/api/upload/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const { contentType, contentId } = req.body;
    
    if (!contentType || !contentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'contentType and contentId are required' 
      });
    }

    // Validate content type
    if (!['character', 'lore', 'map', 'season'].includes(contentType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid contentType. Must be character, lore, map, or season' 
      });
    }

    console.log(`📤 Uploading ${req.file.mimetype} file for ${contentType}/${contentId}`);
    console.log(`   File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Original name: ${req.file.originalname}`);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(req.file.originalname).toLowerCase();
    const isVideo = req.file.mimetype.startsWith('video/');
    const prefix = isVideo ? 'video-uploaded' : 'image-uploaded';
    const filename = `${prefix}-${timestamp}-${randomId}${extension}`;
    
    // Construct S3 key (path) - match the same pattern as AI-generated images
    // CloudFront serves from /images/* (without /static/ prefix)
    // S3 bucket stores at: images/{contentType}s/{id}/...
    let s3Key;
    if (contentType === 'character') {
        s3Key = `images/characters/${contentId}/${filename}`;
    } else if (contentType === 'lore') {
        s3Key = `images/lore/${contentId}/${filename}`;
    } else if (contentType === 'season') {
        s3Key = `images/seasons/${contentId}/${filename}`;
    } else {
        // Fallback for other types
        s3Key = `images/${contentType}s/${contentId}/${filename}`;
    }
    
    console.log(`   S3 Key: ${s3Key}`);
    
    // Sanitize metadata values - remove newlines and control characters
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
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000', // 1 year cache
      Metadata: {
        'uploaded-by': 'user',
        'original-name': sanitizeMetadata(req.file.originalname),
        'uploaded-at': new Date().toISOString(),
        'content-type': contentType,
        'content-id': contentId
      }
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the relative path for database storage (match AI-generated content pattern)
    const relativePath = `/${s3Key}`;
    
    // Construct CDN URL
    const cdnPath = `${cdnUrl}${relativePath}`;

    console.log(`✅ File uploaded successfully`);
    console.log(`   Relative path: ${relativePath}`);
    console.log(`   CDN URL: ${cdnPath}`);

    res.json({
      success: true,
      url: cdnPath,
      relativePath: relativePath,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      isVideo: isVideo
    });

  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
});

/**
 * Error handling middleware for multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
});

module.exports = router;
