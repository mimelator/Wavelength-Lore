/**
 * Product Image Resolution API
 * 
 * Provides endpoints for resolving product preview sourceImage IDs
 * to actual accessible URLs using S3 lookup and fallback mechanisms.
 */

const express = require('express');
const router = express.Router();
const ProductImageUrlResolver = require('../utils/product-image-url-resolver');

// Initialize resolver
const imageResolver = new ProductImageUrlResolver();

/**
 * Resolve a single sourceImage ID to URL
 * GET /api/product-image/resolve/:sourceImageId
 */
router.get('/resolve/:sourceImageId', async (req, res) => {
    try {
        const { sourceImageId } = req.params;
        const { userId } = req.query;
        
        console.log(`🔍 API: Resolving image URL for: ${sourceImageId}`);
        
        const result = await imageResolver.resolveImageUrl(sourceImageId, userId);
        
        console.log(`📤 API: Sending response for ${sourceImageId}:`, result);
        
        // Return the result directly, not nested under 'resolution'
        res.json(result);
        
    } catch (error) {
        console.error('❌ API Error resolving image URL:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            sourceId: sourceImageId
        });
    }
});

/**
 * Resolve multiple sourceImage IDs in batch
 * POST /api/product-image/resolve-batch
 * Body: { sourceImageIds: [...], userId?: string }
 */
router.post('/resolve-batch', async (req, res) => {
    try {
        const { sourceImageIds, userId } = req.body;
        
        if (!Array.isArray(sourceImageIds)) {
            return res.status(400).json({
                success: false,
                error: 'sourceImageIds must be an array'
            });
        }
        
        console.log(`🔍 Batch resolving ${sourceImageIds.length} image URLs`);
        
        const results = await imageResolver.resolveMultipleImageUrls(sourceImageIds, userId);
        
        res.json({
            success: true,
            count: results.length,
            resolutions: results
        });
        
    } catch (error) {
        console.error('Error batch resolving image URLs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get detailed image information including metadata
 * GET /api/product-image/info/:sourceImageId
 */
router.get('/info/:sourceImageId', async (req, res) => {
    try {
        const { sourceImageId } = req.params;
        const { userId } = req.query;
        
        console.log(`📋 Getting image info for: ${sourceImageId}`);
        
        const info = await imageResolver.getImageInfo(sourceImageId, userId);
        
        res.json({
            success: true,
            sourceImageId,
            info
        });
        
    } catch (error) {
        console.error('Error getting image info:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Test URL accessibility
 * POST /api/product-image/test-url
 * Body: { url: string }
 */
router.post('/test-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }
        
        console.log(`🌐 Testing URL accessibility: ${url}`);
        
        const result = await imageResolver.testUrlAccessibility(url);
        
        res.json({
            success: true,
            url,
            accessibility: result
        });
        
    } catch (error) {
        console.error('Error testing URL accessibility:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Resolve URLs for vendor catalog preview data
 * POST /api/product-image/resolve-catalog
 * Body: { previews: [...] }
 */
router.post('/resolve-catalog', async (req, res) => {
    try {
        const { previews } = req.body;
        
        if (!Array.isArray(previews)) {
            return res.status(400).json({
                success: false,
                error: 'previews must be an array'
            });
        }
        
        console.log(`📋 Resolving URLs for ${previews.length} catalog previews`);
        
        const resolvedPreviews = [];
        
        for (const preview of previews) {
            if (preview.sourceImage && preview.sourceImage !== 'Unknown') {
                // Extract user ID if available
                const userId = imageResolver.extractUserIdFromPreview(preview);
                
                // Resolve the URL
                const resolution = await imageResolver.resolveImageUrl(preview.sourceImage, userId);
                
                resolvedPreviews.push({
                    ...preview,
                    resolvedImageUrl: resolution.url,
                    imageUrlType: resolution.type,
                    imageUrlSuccess: resolution.success
                });
            } else {
                resolvedPreviews.push({
                    ...preview,
                    resolvedImageUrl: null,
                    imageUrlType: 'none',
                    imageUrlSuccess: false
                });
            }
            
            // Small delay to avoid overwhelming S3
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        res.json({
            success: true,
            count: resolvedPreviews.length,
            previews: resolvedPreviews
        });
        
    } catch (error) {
        console.error('Error resolving catalog URLs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;