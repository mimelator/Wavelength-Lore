/**
 * AI Image Generation API Routes
 * Handles AI-powered image generation using Google Gemini
 */

const express = require('express');
const router = express.Router();
const { requireGroup } = require('../middleware/groupAuth');
const { GoogleGenAI } = require('@google/genai');
const { writeDataAsAdmin } = require('../helpers/firebase-admin-utils');
const promptHelpers = require('../helpers/prompt-helpers');
const crypto = require('crypto');
const mime = require('mime');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

// Temporary storage for generated images (in production, use Redis or similar)
// Structure: { imageId: { data, mimeType, metadata, expiresAt } }
const imageCache = new Map();

// Clean up expired images every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, image] of imageCache.entries()) {
    if (image.expiresAt < now) {
      imageCache.delete(id);
      console.log(`🗑️ Cleaned up expired image: ${id}`);
    }
  }
}, 30 * 60 * 1000);

/**
 * POST /api/generate/image
 * Generate image from prompt using Google Gemini
 * Requires: content_manager role or higher
 * 
 * Body: {
 *   promptId: string,
 *   promptText: string,
 *   count: number (1-4, default 1),
 *   width: number (default 1024),
 *   height: number (default 1024),
 *   style: string (optional)
 * }
 */
router.post('/image', requireGroup(['content_manager', 'admin', 'moderator']), async (req, res) => {
  try {
    const {
      promptId,
      promptText,
      count = 1,
      width = 1024,
      height = 1024,
      style = 'photorealistic'
    } = req.body;

    console.log('🎨 AI Image Generation Request:', { promptId, count, width, height, style });

    // Validation
    if (!promptText) {
      return res.status(400).json({
        success: false,
        error: 'Prompt text is required'
      });
    }

    if (count < 1 || count > 4) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 4'
      });
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Missing GEMINI_API_KEY.'
      });
    }

    // Initialize Google GenAI
    const googleAI = new GoogleGenAI({ apiKey });
    const modelKey = process.env.AI_MODEL_KEY || 'gemini-2.5-flash-image';

    // Generate images
    const generatedImages = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`🔮 Generating image ${i + 1}/${count}...`);

      try {
        // Configure generation
        const config = {
          responseModalities: ['IMAGE', 'TEXT'],
        };

        // Enhanced prompt with style
        const enhancedPrompt = style && style !== 'photorealistic' 
          ? `${promptText}, ${style} style`
          : promptText;

        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
        ];

        // Generate with streaming response
        const response = await googleAI.models.generateContentStream({
          model: modelKey,
          config,
          contents,
        });

        let imageData = null;
        let mimeType = 'image/png';
        let textResponse = '';

        // Process streamed response
        for await (const chunk of response) {
          if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
          }

          // Extract image data
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            imageData = inlineData.data;
            mimeType = inlineData.mimeType || 'image/png';
            console.log(`🖼️ Image ${i + 1} received (${mimeType})`);
          }
          
          // Extract text response
          if (chunk.text) {
            textResponse += chunk.text;
          }
        }

        if (imageData) {
          // Generate unique ID for this image
          const imageId = crypto.randomBytes(16).toString('hex');
          
          // Cache the full image data on server (expires in 1 hour)
          imageCache.set(imageId, {
            data: imageData,
            mimeType,
            metadata: {
              promptId,
              prompt: enhancedPrompt,
              originalPrompt: promptText,
              style,
              width,
              height,
              model: modelKey,
              generatedAt: new Date().toISOString(),
              provider: 'google-genai',
              textResponse: textResponse || undefined,
              generatedBy: req.user?.uid || 'system'
            },
            expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
          });
          
          generatedImages.push({
            id: imageId,
            data: imageData,
            mimeType,
            metadata: {
              promptId,
              prompt: enhancedPrompt,
              originalPrompt: promptText,
              style,
              width,
              height,
              model: modelKey,
              generatedAt: new Date().toISOString(),
              provider: 'google-genai',
              textResponse: textResponse || undefined,
              generatedBy: req.user?.uid || 'system'
            }
          });
        } else {
          console.warn(`⚠️ No image data for generation ${i + 1}`);
        }

      } catch (genError) {
        console.error(`❌ Generation ${i + 1} failed:`, genError.message);
        // Continue with other generations
      }
    }

    if (generatedImages.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate any images. Response may have been filtered.'
      });
    }

    // Return base64 data URLs for immediate preview
    const imageResults = generatedImages.map(img => ({
      id: img.id,
      dataUrl: `data:${img.mimeType};base64,${img.data}`,
      mimeType: img.mimeType,
      metadata: img.metadata
    }));

    console.log(`✅ Generated ${generatedImages.length}/${count} images successfully`);

    res.json({
      success: true,
      images: imageResults,
      count: generatedImages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Generation API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Image generation failed',
      message: error.message
    });
  }
});

/**
 * Helper function to upload image to S3
 * @param {Buffer} imageBuffer - Image data as buffer
 * @param {string} contentType - Content type (character, episode, lore)
 * @param {string} contentId - Content ID
 * @param {string} mimeType - Image MIME type
 * @param {object} metadata - Image metadata
 * @returns {Promise<string>} CDN URL of uploaded image
 */
async function uploadImageToS3(imageBuffer, contentType, contentId, mimeType, metadata) {
  const timestamp = Date.now();
  const imageId = crypto.randomBytes(8).toString('hex');
  const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  
  // Generate S3 key: images/characters/andrew/ai-generated-abc123.png
  const s3Key = `images/${contentType}s/${contentId}/ai-generated-${timestamp}-${imageId}.${extension}`;
  
  console.log(`📤 Uploading AI-generated image to S3: ${s3Key}`);
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
    Key: s3Key,
    Body: imageBuffer,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: {
      'generated-by': 'google-gemini',
      'prompt-id': metadata.promptId || 'unknown',
      'generated-at': metadata.generatedAt || new Date().toISOString(),
      'model': metadata.model || 'unknown'
    }
  };
  
  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);
  
  // Construct the CloudFront/CDN URL
  const cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
  const imageUrl = `${cdnUrl}/${s3Key}`;
  
  console.log(`✅ Image uploaded to S3: ${imageUrl}`);
  
  return imageUrl;
}

/**
 * POST /api/generate/add-to-gallery
 * Add generated images to content gallery
 * Requires: content_manager role or higher
 * 
 * Body: {
 *   contentType: 'character' | 'episode' | 'lore',
 *   contentId: string,
 *   firebasePath: string,
 *   imageIds: Array<string> // Just the image IDs, not the full data
 * }
 */
router.post('/add-to-gallery', requireGroup(['content_manager', 'admin', 'moderator']), async (req, res) => {
  try {
    const {
      contentType,
      contentId,
      firebasePath,
      imageIds
    } = req.body;

    console.log('🖼️ Adding generated images to gallery:', { contentType, contentId, count: imageIds?.length });

    if (!contentType || !contentId || !firebasePath || !imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Retrieve images from cache
    const images = [];
    for (const imageId of imageIds) {
      const cachedImage = imageCache.get(imageId);
      if (!cachedImage) {
        console.warn(`⚠️ Image ${imageId} not found in cache (may have expired)`);
        continue;
      }
      images.push({
        id: imageId,
        data: cachedImage.data,
        mimeType: cachedImage.mimeType,
        metadata: cachedImage.metadata
      });
    }

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid images found. Images may have expired. Please regenerate.'
      });
    }

    // Upload images to S3 and get CDN URLs
    console.log(`🚀 Uploading ${images.length} image(s) to S3...`);
    const uploadPromises = images.map(img => {
      const imageBuffer = Buffer.from(img.data, 'base64');
      return uploadImageToS3(imageBuffer, contentType, contentId, img.mimeType, img.metadata);
    });
    
    const imageUrls = await Promise.all(uploadPromises);
    console.log(`✅ All images uploaded to S3`);

    // Fetch current content data
    const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
    const firebaseUtils = require('../helpers/firebase-utils');
    
    let currentData;
    let updatePath;
    
    // Handle different content types with different Firebase structures
    if (contentType === 'character') {
      // Characters are stored in categories as arrays, need to find and update the right one
      const charactersData = await firebaseUtils.fetchFromFirebase('characters');
      if (!charactersData) {
        return res.status(404).json({
          success: false,
          error: 'Characters data not found'
        });
      }
      
      // Find the character in all categories
      let foundCategory = null;
      let characterIndex = -1;
      
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          characterIndex = charactersData[category].findIndex(c => c.id === contentId);
          if (characterIndex !== -1) {
            foundCategory = category;
            currentData = charactersData[category][characterIndex];
            break;
          }
        }
      }
      
      if (!currentData) {
        return res.status(404).json({
          success: false,
          error: `Character ${contentId} not found`
        });
      }
      
      updatePath = `characters/${foundCategory}/${characterIndex}`;
      
    } else {
      // Episodes and lore use direct paths
      currentData = await fetchDataAsAdmin(firebasePath);
      
      if (!currentData) {
        return res.status(404).json({
          success: false,
          error: 'Content not found'
        });
      }
      
      updatePath = firebasePath;
    }

    // Add to appropriate gallery field
    let updatedData;
    if (contentType === 'episode') {
      updatedData = {
        ...currentData,
        carouselImages: [
          ...(currentData.carouselImages || []),
          ...imageUrls
        ]
      };
    } else {
      updatedData = {
        ...currentData,
        image_gallery: [
          ...(currentData.image_gallery || []),
          ...imageUrls
        ]
      };
    }

    // Update in Firebase using the correct path
    await writeDataAsAdmin(updatePath, updatedData);

    // Clean up used images from cache
    for (const imageId of imageIds) {
      imageCache.delete(imageId);
    }

    console.log(`✅ Added ${imageUrls.length} images to ${contentType} gallery`);

    res.json({
      success: true,
      message: `Added ${imageUrls.length} images to gallery`,
      imagesAdded: imageUrls.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add to Gallery Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add images to gallery',
      message: error.message
    });
  }
});

module.exports = router;
