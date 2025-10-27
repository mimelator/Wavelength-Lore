/**
 * Blueprint Preview Image API
 * 
 * Provides endpoints for getting generic product preview images
 * based on blueprintId and provider data from Printify catalog
 */

const express = require('express');
const router = express.Router();
const PrintifyService = require('../services/printify-service');

// Initialize Printify service
const printifyService = new PrintifyService();

// Cache for blueprint images to avoid repeated API calls
const blueprintImageCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get preview image for a specific blueprint
 * GET /api/merchandise/blueprint-preview/:blueprintId
 */
router.get('/blueprint-preview/:blueprintId', async (req, res) => {
    try {
        const { blueprintId } = req.params;
        const cacheKey = `blueprint_${blueprintId}`;
        
        // Check cache first
        const cached = blueprintImageCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log(`🎯 Returning cached preview for blueprint ${blueprintId}`);
            return res.json(cached.data);
        }
        
        console.log(`🔍 Fetching blueprint preview for: ${blueprintId}`);
        
        // Get blueprint details from Printify
        const blueprints = await printifyService.getBlueprints();
        if (!blueprints.success) {
            throw new Error('Failed to fetch blueprints from Printify');
        }
        
        // Find the specific blueprint
        const blueprint = blueprints.blueprints.find(bp => bp.id == blueprintId);
        if (!blueprint) {
            return res.status(404).json({
                success: false,
                error: `Blueprint ${blueprintId} not found`
            });
        }
        
        // Extract preview image information
        const result = {
            success: true,
            blueprintId: parseInt(blueprintId),
            name: blueprint.title,
            description: blueprint.description,
            brand: blueprint.brand,
            previewImage: null,
            fallbackImage: null
        };
        
        // Look for preview images in blueprint data
        if (blueprint.images && blueprint.images.length > 0) {
            // Use the first image as preview
            result.previewImage = blueprint.images[0];
            console.log(`✅ Found preview image for blueprint ${blueprintId}: ${result.previewImage}`);
        } else if (blueprint.image) {
            // Some blueprints might have a single image field
            result.previewImage = blueprint.image;
            console.log(`✅ Found single image for blueprint ${blueprintId}: ${result.previewImage}`);
        }
        
        // Create a fallback image URL based on category/type
        const category = blueprint.title.toLowerCase();
        if (category.includes('tee') || category.includes('t-shirt')) {
            result.fallbackImage = '/images/placeholders/tshirt-preview.png';
        } else if (category.includes('hoodie')) {
            result.fallbackImage = '/images/placeholders/hoodie-preview.png';
        } else if (category.includes('mug')) {
            result.fallbackImage = '/images/placeholders/mug-preview.png';
        } else {
            result.fallbackImage = '/images/placeholders/generic-product.png';
        }
        
        // Cache the result
        blueprintImageCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error getting blueprint preview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get preview images for multiple blueprints (batch)
 * POST /api/merchandise/blueprint-previews
 * Body: { blueprintIds: [413, 238, ...] }
 */
router.post('/blueprint-previews', async (req, res) => {
    try {
        const { blueprintIds } = req.body;
        
        if (!Array.isArray(blueprintIds)) {
            return res.status(400).json({
                success: false,
                error: 'blueprintIds must be an array'
            });
        }
        
        console.log(`🔍 Batch fetching previews for ${blueprintIds.length} blueprints`);
        
        const results = [];
        
        // Get all blueprints once
        const blueprints = await printifyService.getBlueprints();
        if (!blueprints.success) {
            throw new Error('Failed to fetch blueprints from Printify');
        }
        
        // Process each requested blueprint
        for (const blueprintId of blueprintIds) {
            const cacheKey = `blueprint_${blueprintId}`;
            
            // Check cache first
            let result;
            const cached = blueprintImageCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                result = cached.data;
            } else {
                // Find blueprint and create result
                const blueprint = blueprints.blueprints.find(bp => bp.id == blueprintId);
                
                if (blueprint) {
                    result = {
                        success: true,
                        blueprintId: parseInt(blueprintId),
                        name: blueprint.title,
                        description: blueprint.description,
                        brand: blueprint.brand,
                        previewImage: null,
                        fallbackImage: null
                    };
                    
                    // Extract preview image
                    if (blueprint.images && blueprint.images.length > 0) {
                        result.previewImage = blueprint.images[0];
                    } else if (blueprint.image) {
                        result.previewImage = blueprint.image;
                    }
                    
                    // Create fallback
                    const category = blueprint.title.toLowerCase();
                    if (category.includes('tee') || category.includes('t-shirt')) {
                        result.fallbackImage = '/images/placeholders/tshirt-preview.png';
                    } else if (category.includes('hoodie')) {
                        result.fallbackImage = '/images/placeholders/hoodie-preview.png';
                    } else if (category.includes('mug')) {
                        result.fallbackImage = '/images/placeholders/mug-preview.png';
                    } else {
                        result.fallbackImage = '/images/placeholders/generic-product.png';
                    }
                    
                    // Cache it
                    blueprintImageCache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                } else {
                    result = {
                        success: false,
                        blueprintId: parseInt(blueprintId),
                        error: 'Blueprint not found'
                    };
                }
            }
            
            results.push(result);
        }
        
        res.json({
            success: true,
            count: results.length,
            previews: results
        });
        
    } catch (error) {
        console.error('❌ Error getting blueprint previews:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Clear blueprint preview cache
 * POST /api/merchandise/clear-blueprint-cache
 */
router.post('/clear-blueprint-cache', (req, res) => {
    blueprintImageCache.clear();
    console.log('🧹 Blueprint preview cache cleared');
    
    res.json({
        success: true,
        message: 'Blueprint preview cache cleared'
    });
});

module.exports = router;