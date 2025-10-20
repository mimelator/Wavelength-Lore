/**
 * Audio Upload API Route
 * Handles uploading MP3 files to S3 for episodes
 * Requires content_manager role or higher
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Import authentication middleware
const { requireGroup } = require('../middleware/groupAuth');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept MP3 files
    if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || path.extname(file.originalname).toLowerCase() === '.mp3') {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'));
    }
  }
});

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

/**
 * Upload MP3 file to S3
 * POST /api/upload/audio
 */
router.post('/api/upload/audio', requireGroup('content_manager'), upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { seasonNumber, episodeNumber } = req.body;

    if (!seasonNumber || !episodeNumber) {
      return res.status(400).json({
        success: false,
        error: 'Season number and episode number are required'
      });
    }

    // Generate S3 key path: audio/season1/episode1.mp3
    const s3Key = `audio/season${seasonNumber}/episode${episodeNumber}.mp3`;

    console.log(`📤 Uploading audio file to S3: ${s3Key}`);
    console.log(`📊 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'max-age=31536000', // 1 year cache
      Metadata: {
        'original-filename': req.file.originalname,
        'uploaded-by': req.user.email || 'unknown',
        'uploaded-at': new Date().toISOString()
      }
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the CloudFront/CDN URL
    const cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
    const audioUrl = `${cdnUrl}/${s3Key}`;

    console.log(`✅ Audio uploaded successfully: ${audioUrl}`);

    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      audioUrl: audioUrl,
      s3Key: s3Key,
      fileSize: req.file.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload audio file',
      message: error.message
    });
  }
});

module.exports = router;
