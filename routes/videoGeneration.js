/**
 * Video Generation API Route
 * Handles AI video generation from images using Google Veo 3.1
 */

const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const admin = require('firebase-admin');

// Initialize S3 client (use same credentials as AI image generation)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

// Store operation metadata (operationId -> metadata) for later use in download
const operationMetadata = new Map();

/**
 * Download image from URL to buffer
 */
async function downloadImageToBuffer(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImageToBuffer(response.headers.location)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Helper function to upload video to S3 and add to content gallery
 * @param {Buffer} videoBuffer - Video data as buffer
 * @param {string} contentType - Content type (character, lore)
 * @param {string} contentId - Content ID (e.g., 'jewel', 'daphne-flower')
 * @param {object} metadata - Video metadata (prompt, operationId, etc.)
 * @returns {Promise<string>} Relative path of uploaded video
 */
async function uploadVideoToS3AndAddToGallery(videoBuffer, contentType, contentId, metadata) {
  const timestamp = Date.now();
  const videoId = crypto.randomBytes(8).toString('hex');
  
  // Generate S3 key: images/characters/jewel/video-generated-abc123.mp4
  const s3Key = `images/${contentType}s/${contentId}/video-generated-${timestamp}-${videoId}.mp4`;
  
  console.log(`📤 Uploading generated video to S3: ${s3Key}`);
  
  // Sanitize metadata values - remove newlines and control characters that are invalid in HTTP headers
  const sanitizeMetadata = (value) => {
    if (!value) return 'unknown';
    return value
      .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .substring(0, 200)             // Truncate to 200 chars
      .trim();
  };
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
    Key: s3Key,
    Body: videoBuffer,
    ContentType: 'video/mp4',
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: {
      'generated-by': 'google-veo-3.1',
      'prompt': sanitizeMetadata(metadata.prompt),
      'operation-id': sanitizeMetadata(metadata.operationId),
      'generated-at': new Date().toISOString(),
      'source-image': sanitizeMetadata(metadata.sourceImage)
    }
  };
  
  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);
  
  // Return relative path
  const relativePath = `/${s3Key}`;
  
  console.log(`✅ Video uploaded to S3: ${s3Key}`);
  console.log(`📝 Adding video to ${contentType}/${contentId} gallery...`);
  
  // Add to Firebase gallery
  const db = admin.database();
  const contentRef = db.ref(`${contentType}/${contentId}/image_gallery`);
  
  // Get current gallery
  const snapshot = await contentRef.once('value');
  const currentGallery = snapshot.val() || [];
  
  // Add new video to gallery
  const updatedGallery = [...currentGallery, relativePath];
  
  // Update Firebase
  await contentRef.set(updatedGallery);
  
  console.log(`✅ Video added to ${contentType}/${contentId} gallery`);
  
  return relativePath;
}

/**
 * POST /api/generate/video
 * Generate a video from an image using Google Veo 3.1
 * Body: { imageUrl: string, prompt: string }
 */
router.post('/api/generate/video', async (req, res) => {
  try {
    const { imageUrl, prompt, contentType, contentId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'imageUrl is required' 
      });
    }

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'prompt is required for video generation' 
      });
    }

    if (!contentType || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'contentType and contentId are required' 
      });
    }

    console.log('🎬 Video generation request:', {
      imageUrl,
      prompt: prompt?.substring(0, 100) + '...',
      contentType,
      contentId
    });

    // Check for Google API key
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_API_KEY or GEMINI_API_KEY not configured'
      });
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey });

    console.log('📥 Downloading image from:', imageUrl);
    
    // Download the image
    const imageBuffer = await downloadImageToBuffer(imageUrl);
    console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

    // Convert buffer to base64 string (Google API expects string, not Buffer)
    const imageBase64 = imageBuffer.toString('base64');

    // Determine mime type from URL
    let mimeType = 'image/jpeg';
    if (imageUrl.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (imageUrl.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    console.log('🎬 Starting Veo 3.1 video generation...');

    // Generate video with Veo 3.1 using the image
    let operation = await ai.models.generateVideos({
      model: process.env.VIDEO_MODEL_KEY || 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType
      }
    });

    console.log('✅ Video generation started:', operation.name);

    // Store metadata for later use in download endpoint
    operationMetadata.set(operation.name, {
      contentType,
      contentId,
      prompt,
      sourceImage: imageUrl,
      createdAt: Date.now()
    });

    // Store operation info to return to client
    res.json({
      success: true,
      operationId: operation.name,
      status: operation.done ? 'completed' : 'processing'
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Video generation failed: ' + error.message 
    });
  }
});

/**
 * GET /api/generate/video/status/*
 * Check the status of a video generation operation
 * Uses regex to capture operation ID with slashes
 */
router.get(/^\/api\/generate\/video\/status\/(.+)$/, async (req, res) => {
  try {
    // req.params[0] contains the captured group (everything after /status/)
    const operationId = decodeURIComponent(req.params[0]);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_API_KEY or GEMINI_API_KEY not configured'
      });
    }

    console.log('📊 Checking video generation status:', operationId);

    // Use REST API directly since SDK method has issues
    const fetch = (await import('node-fetch')).default;
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`;
    
    const response = await fetch(statusUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const operation = await response.json();

    if (operation.done) {
      console.log('✅ Video generation completed');
      
      // Check if there's an error
      if (operation.error) {
        return res.json({
          success: false,
          status: 'failed',
          error: operation.error.message
        });
      }

      // Get the video file info - check both possible response structures
      let videoFile = operation.response?.generatedVideos?.[0]?.video;
      
      if (!videoFile) {
        // Try the alternate structure from actual API response
        videoFile = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
      }
      
      if (!videoFile) {
        console.error('❌ No video file found in response:', JSON.stringify(operation.response, null, 2));
        return res.json({
          success: false,
          status: 'failed',
          error: 'No video generated'
        });
      }

      // Return file info - client will need to download it
      res.json({
        success: true,
        status: 'succeeded',
        videoFile: {
          uri: videoFile.uri
        }
      });

    } else {
      // Still processing
      res.json({
        success: true,
        status: 'processing'
      });
    }

  } catch (error) {
    console.error('❌ Error checking video generation status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check status: ' + error.message 
    });
  }
});

/**
 * POST /api/generate/video/download/:operationPath
 * Download the generated video file
 * operationPath can contain slashes (matched as a single parameter)
 */
/**
 * POST /api/generate/video/download/*
 * Download a completed video
 * Uses regex to capture operation ID with slashes
 */
router.post(/^\/api\/generate\/video\/download\/(.+)$/, async (req, res) => {
  try {
    // req.params[0] contains the captured group (everything after /download/)
    const operationId = decodeURIComponent(req.params[0]);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_API_KEY or GEMINI_API_KEY not configured'
      });
    }

    console.log('📥 Downloading video for operation:', operationId);

    // Use REST API directly since SDK method has issues
    const fetch = (await import('node-fetch')).default;
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`;
    
    const statusResponse = await fetch(statusUrl);
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`API request failed: ${statusResponse.status} - ${errorText}`);
    }
    
    const operation = await statusResponse.json();

    if (!operation.done) {
      return res.status(400).json({
        success: false,
        message: 'Video generation not yet complete'
      });
    }

    // Get the video file info - check both possible response structures
    let videoFile = operation.response?.generatedVideos?.[0]?.video;
    
    if (!videoFile) {
      // Try the alternate structure from actual API response
      videoFile = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
    }
    
    if (!videoFile) {
      console.error('❌ No video file found in response:', JSON.stringify(operation.response, null, 2));
      return res.status(404).json({
        success: false,
        message: 'No video file found'
      });
    }

    console.log('💾 Downloading video from URI:', videoFile.uri);

    // Download the video directly from the URI with API key
    const videoUrl = `${videoFile.uri}&key=${apiKey}`;
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }

    // Get video as buffer
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBufferNode = Buffer.from(videoBuffer);

    console.log(`✅ Video downloaded (${videoBufferNode.length} bytes)`);

    // Get metadata for this operation
    const metadata = operationMetadata.get(operationId);
    
    if (metadata) {
      console.log('📤 Uploading video to S3 and adding to gallery...');
      
      try {
        // Upload to S3 and add to gallery
        const relativePath = await uploadVideoToS3AndAddToGallery(
          videoBufferNode,
          metadata.contentType,
          metadata.contentId,
          {
            prompt: metadata.prompt,
            operationId: operationId,
            sourceImage: metadata.sourceImage
          }
        );
        
        console.log('✅ Video saved to gallery:', relativePath);
        
        // Clean up metadata after successful upload
        operationMetadata.delete(operationId);
      } catch (uploadError) {
        console.error('❌ Error uploading to S3/gallery:', uploadError);
        // Continue to send to client even if upload fails
      }
    } else {
      console.warn('⚠️ No metadata found for operation, skipping S3 upload');
    }

    console.log('📥 Sending video to client...');

    // Send the file to client
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="veo-generated-${Date.now()}.mp4"`);

    // Send the buffer to client
    res.send(videoBufferNode);

  } catch (error) {
    console.error('❌ Error downloading video:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download video: ' + error.message 
    });
  }
});

module.exports = router;
