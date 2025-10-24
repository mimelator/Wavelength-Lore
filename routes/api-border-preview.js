/**
 * Border Preview API Routes
 * 
 * API endpoints for generating border previews that users can select from
 * before creating final product previews. Provides real-time border
 * generation and caching for optimal performance.
 */

const express = require('express');
const router = express.Router();
const BorderOverlayService = require('../services/border-overlay-service');
const BorderConfigValidator = require('../utils/border-config-validator');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Initialize services
const borderService = new BorderOverlayService();
const borderValidator = new BorderConfigValidator();

// S3 configuration for storing bordered images
const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'us-east-1'
});

const BORDERED_IMAGES_BUCKET = process.env.GALLERY_S3_BUCKET || 'wavelength-gallery-346923';
const BORDERED_IMAGES_PREFIX = 'bordered-images/';
const CDN_BASE_URL = process.env.GALLERY_CDN_URL || 'https://d3ohg9sf8htmwk.cloudfront.net';

/**
 * POST /api/merchandise/border-preview
 * Generate a bordered version of an image with the specified configuration
 */
router.post('/border-preview', async (req, res) => {
    const requestId = `border-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        console.log(`🎨 [${requestId}] Border preview request received`);
        
        const { sourceImageUrl, sourceImageHash, borderConfig, options = {} } = req.body;
        
        // Validate required parameters
        if (!sourceImageUrl && !sourceImageHash) {
            return res.status(400).json({
                success: false,
                error: 'Either sourceImageUrl or sourceImageHash is required',
                requestId
            });
        }
        
        if (!borderConfig) {
            return res.status(400).json({
                success: false,
                error: 'Border configuration is required',
                requestId
            });
        }
        
        // Validate border configuration
        const validation = borderValidator.validate(borderConfig);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid border configuration',
                details: validation.errors,
                requestId
            });
        }
        
        console.log(`✅ [${requestId}] Configuration validated: ${borderConfig.type} border`);
        
        // Generate cache key for bordered image
        const imageIdentifier = sourceImageHash || crypto.createHash('md5').update(sourceImageUrl).digest('hex');
        const borderHash = borderService.generateBorderHash(borderConfig, imageIdentifier);
        const cacheKey = `${imageIdentifier}-${borderHash}`;
        
        console.log(`🔑 [${requestId}] Cache key: ${cacheKey}`);
        
        // Check if bordered image already exists
        const existingBorderedImage = await checkBorderedImageCache(cacheKey);
        if (existingBorderedImage) {
            console.log(`🎯 [${requestId}] Cache hit! Returning existing bordered image`);
            return res.json({
                success: true,
                borderedImageUrl: existingBorderedImage.url,
                cached: true,
                metadata: {
                    borderType: borderConfig.type,
                    cacheKey,
                    requestId,
                    createdAt: existingBorderedImage.createdAt
                }
            });
        }
        
        // Download source image if URL provided
        let imageBuffer;
        if (sourceImageUrl) {
            console.log(`📥 [${requestId}] Downloading source image...`);
            imageBuffer = await downloadImage(sourceImageUrl);
        } else {
            // TODO: Retrieve from global cache using sourceImageHash
            throw new Error('Image hash lookup not yet implemented');
        }
        
        // Apply border overlay
        console.log(`🎨 [${requestId}] Applying border overlay...`);
        const startTime = Date.now();
        const borderedImageBuffer = await borderService.applyBorderOverlay(
            imageBuffer, 
            borderConfig, 
            options
        );
        const processingTime = Date.now() - startTime;
        
        // Upload bordered image to S3
        console.log(`☁️ [${requestId}] Uploading bordered image to S3...`);
        const s3Key = `${BORDERED_IMAGES_PREFIX}${cacheKey}.webp`;
        const uploadResult = await uploadBorderedImage(s3Key, borderedImageBuffer);
        
        // Generate CDN URL
        const borderedImageUrl = `${CDN_BASE_URL}/${s3Key}`;
        
        // Cache the result
        await cacheBorderedImageMetadata(cacheKey, {
            url: borderedImageUrl,
            s3Key,
            borderConfig,
            sourceImageIdentifier: imageIdentifier,
            processingTime,
            createdAt: new Date().toISOString()
        });
        
        console.log(`✅ [${requestId}] Border preview generated successfully in ${processingTime}ms`);
        
        res.json({
            success: true,
            borderedImageUrl,
            cached: false,
            metadata: {
                borderType: borderConfig.type,
                cacheKey,
                requestId,
                processingTime,
                imageSize: borderedImageBuffer.length,
                createdAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error(`❌ [${requestId}] Border preview generation failed:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate border preview',
            details: error.message,
            requestId
        });
    }
});

/**
 * GET /api/merchandise/border-styles
 * Get available border styles and sample configurations
 */
router.get('/border-styles', async (req, res) => {
    try {
        console.log('📋 Fetching available border styles...');
        
        const borderTypes = borderService.getSupportedBorderTypes();
        const borderStyles = {};
        
        // Generate sample configurations for each border type
        for (const borderType of borderTypes) {
            const sampleConfig = borderService.getSampleConfiguration(borderType);
            const variations = await generateBorderVariations(borderType);
            
            borderStyles[borderType] = {
                name: formatBorderTypeName(borderType),
                description: getBorderTypeDescription(borderType),
                sampleConfig,
                variations,
                supported: true
            };
        }
        
        res.json({
            success: true,
            borderTypes: borderTypes,
            borderStyles,
            totalStyles: Object.keys(borderStyles).length
        });
        
    } catch (error) {
        console.error('❌ Failed to fetch border styles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch border styles',
            details: error.message
        });
    }
});

/**
 * GET /api/merchandise/border-preview/:cacheKey
 * Get metadata for a specific bordered image
 */
router.get('/border-preview/:cacheKey', async (req, res) => {
    try {
        const { cacheKey } = req.params;
        console.log(`🔍 Looking up bordered image metadata: ${cacheKey}`);
        
        const metadata = await getBorderedImageMetadata(cacheKey);
        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: 'Bordered image not found',
                cacheKey
            });
        }
        
        res.json({
            success: true,
            metadata,
            cacheKey
        });
        
    } catch (error) {
        console.error(`❌ Failed to get bordered image metadata:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get bordered image metadata',
            details: error.message
        });
    }
});

/**
 * DELETE /api/merchandise/border-preview/:cacheKey
 * Delete a bordered image from cache and S3
 */
router.delete('/border-preview/:cacheKey', async (req, res) => {
    try {
        const { cacheKey } = req.params;
        console.log(`🗑️ Deleting bordered image: ${cacheKey}`);
        
        // Get metadata to find S3 key
        const metadata = await getBorderedImageMetadata(cacheKey);
        if (metadata && metadata.s3Key) {
            // Delete from S3
            await s3.deleteObject({
                Bucket: BORDERED_IMAGES_BUCKET,
                Key: metadata.s3Key
            }).promise();
            console.log(`✅ Deleted from S3: ${metadata.s3Key}`);
        }
        
        // Delete from cache
        await deleteBorderedImageMetadata(cacheKey);
        
        res.json({
            success: true,
            message: 'Bordered image deleted successfully',
            cacheKey
        });
        
    } catch (error) {
        console.error(`❌ Failed to delete bordered image:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete bordered image',
            details: error.message
        });
    }
});

// Helper functions

async function checkBorderedImageCache(cacheKey) {
    // TODO: Implement cache lookup in Firebase/database
    // For now, return null (cache miss)
    return null;
}

async function downloadImage(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

async function uploadBorderedImage(s3Key, imageBuffer) {
    const uploadParams = {
        Bucket: BORDERED_IMAGES_BUCKET,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
            'generated-by': 'border-overlay-service',
            'generated-at': new Date().toISOString()
        }
    };
    
    const result = await s3.upload(uploadParams).promise();
    console.log(`✅ Uploaded to S3: ${result.Location}`);
    return result;
}

async function cacheBorderedImageMetadata(cacheKey, metadata) {
    // TODO: Implement metadata caching in Firebase/database
    console.log(`💾 Caching metadata for ${cacheKey}:`, metadata);
    // For now, just log - will implement Firebase integration
}

async function getBorderedImageMetadata(cacheKey) {
    // TODO: Implement metadata retrieval from Firebase/database
    console.log(`🔍 Getting metadata for ${cacheKey}`);
    return null; // For now
}

async function deleteBorderedImageMetadata(cacheKey) {
    // TODO: Implement metadata deletion from Firebase/database
    console.log(`🗑️ Deleting metadata for ${cacheKey}`);
}

async function generateBorderVariations(borderType) {
    const variations = [];
    
    switch (borderType) {
        case 'solid':
            variations.push(
                { name: 'Thin Black', config: { type: 'solid', color: '#000000', width: 5 } },
                { name: 'Medium White', config: { type: 'solid', color: '#ffffff', width: 10 } },
                { name: 'Thick Red', config: { type: 'solid', color: '#ff0000', width: 20 } }
            );
            break;
            
        case 'gradient':
            variations.push(
                { name: 'Fire Gradient', config: { type: 'gradient', gradientType: 'linear', colors: ['#ff0000', '#ffff00'], direction: '45deg', width: 15 } },
                { name: 'Ocean Gradient', config: { type: 'gradient', gradientType: 'linear', colors: ['#0066cc', '#66ccff'], direction: '90deg', width: 15 } },
                { name: 'Rainbow Radial', config: { type: 'gradient', gradientType: 'radial', colors: ['#ff0000', '#ffff00', '#00ff00', '#0000ff'], width: 20 } }
            );
            break;
            
        case 'pattern':
            variations.push(
                { name: 'Small Dots', config: { type: 'pattern', pattern: 'polka-dots', patternSize: 'small', spacing: 10 } },
                { name: 'Large Stars', config: { type: 'pattern', pattern: 'stars', patternSize: 'large', spacing: 25 } }
            );
            break;
            
        case 'wavelength-theme':
            variations.push(
                { name: 'Goblin King Theme', config: { type: 'wavelength-theme', theme: 'goblin-king', density: 'medium' } },
                { name: 'Ice Fortress Theme', config: { type: 'wavelength-theme', theme: 'ice-fortress', density: 'high' } }
            );
            break;
            
        case 'blend':
            variations.push(
                { name: 'Soft Fade', config: { type: 'blend', blendMode: 'soft-light', featherRadius: 15, fadeDistance: 30 } },
                { name: 'Strong Blend', config: { type: 'blend', blendMode: 'multiply', featherRadius: 25, fadeDistance: 50 } }
            );
            break;
    }
    
    return variations;
}

function formatBorderTypeName(borderType) {
    const names = {
        'solid': 'Solid Color',
        'gradient': 'Gradient',
        'pattern': 'Pattern Overlay',
        'wavelength-theme': 'Wavelength Theme',
        'blend': 'Blend Effect'
    };
    return names[borderType] || borderType;
}

function getBorderTypeDescription(borderType) {
    const descriptions = {
        'solid': 'Simple colored borders with customizable width and opacity',
        'gradient': 'Linear, radial, or conic gradients with multiple colors',
        'pattern': 'Repeating patterns like polka dots, stars, or custom designs',
        'wavelength-theme': 'Game-themed borders featuring Wavelength Lore elements',
        'blend': 'Seamless blending effects for smooth fabric transitions'
    };
    return descriptions[borderType] || 'Custom border effect';
}

module.exports = router;