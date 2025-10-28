/**
 * Comprehensive Blueprint Metadata API
 * 
 * Consolidated API providing complete blueprint information including:
 * - Preview images from Printify API
 * - Category mappings and icons
 * - Product type information
 * - Display names and pricing patterns
 */

// Ensure environment variables are loaded before requiring PrintifyService
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const router = express.Router();
const PrintifyService = require('../services/printify-service');

// Initialize Printify service
const printifyService = new PrintifyService();

// Cache for blueprint metadata to avoid repeated API calls
const blueprintMetadataCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Comprehensive Blueprint Metadata Mappings
const BLUEPRINT_CATEGORIES = {
  // Common blueprint IDs and their categories (from Printify)
  5: 't-shirt',        // Unisex Cotton Crew Tee
  6: 'heavy-cotton-tee', // Unisex Heavy Cotton Tee
  9: 't-shirt',        // Women's Favorite Tee
  10: 'tank-top',      // Women's Flowy Racerback Tank
  12: 't-shirt',       // Unisex Jersey Short Sleeve Tee
  49: 'sweatshirt',    // Unisex Heavy Blend™ Crewneck Sweatshirt
  66: 'hoodie',        // Unisex Heavy Blend™ Full Zip Hooded Sweatshirt
  68: 'coffee-mug',    // Mug 11oz
  70: 'travel-mug',    // Stainless Steel Travel Mug
  77: 'hoodie',        // Unisex Heavy Blend™ Hooded Sweatshirt
  175: 'hoodie',       // Unisex Sponge Fleece Pullover Hoodie
  413: 'backpack',     // Backpack
  238: 'blanket',      // Sherpa Fleece Blanket
  220: 'pillow',       // Spun Polyester Square Pillow
  268: 'phone-case',   // Slim Phone Cases
  269: 'phone-case',   // Tough Phone Cases
  277: 'canvas',       // Wall Clock
  1313: 'tote-bag',    // Cotton Canvas Tote Bag
};

const CATEGORY_ICONS = {
  't-shirt': '👕',
  'heavy-cotton-tee': '👕',
  'premium-tshirt': '👔',
  'women-tee': '👚',
  'tank-top': '🎽',
  'hoodie': '🧥',
  'zip-hoodie': '🧥',
  'sweatshirt': '👔',
  'coffee-mug': '☕',
  'travel-mug': '🥤',
  'pillow': '🛏️',
  'blanket': '🛋️',
  'canvas': '🖼️',
  'tote-bag': '👜',
  'backpack': '🎒',
  'phone-case': '📱',
  'laptop-sleeve': '💻',
  'notebook': '📓',
  'sticker': '🏷️',
  'hat': '🧢',
  'fanny-pack': '👝',
  'infant-wear': '👶',
  'specialty-item': '✨'
};

const CATEGORY_DISPLAY_NAMES = {
  't-shirt': 'T-Shirt',
  'heavy-cotton-tee': 'Heavy Cotton T-Shirt', 
  'tank-top': 'Tank Top',
  'hoodie': 'Hoodie',
  'sweatshirt': 'Sweatshirt',
  'zip-hoodie': 'Zip Hoodie',
  'coffee-mug': 'Coffee Mug',
  'travel-mug': 'Travel Mug',
  'tote-bag': 'Tote Bag',
  'backpack': 'Backpack',
  'phone-case': 'Phone Case',
  'laptop-sleeve': 'Laptop Sleeve',
  'pillow': 'Pillow',
  'blanket': 'Blanket',
  'canvas': 'Canvas Print',
  'notebook': 'Notebook',
  'sticker': 'Sticker',
  'premium-tshirt': 'Premium T-Shirt',
  'women-tee': 'Women\'s T-Shirt',
  'infant-wear': 'Infant Wear',
  'hat': 'Hat',
  'fanny-pack': 'Fanny Pack',
  'specialty-item': 'Specialty Item'
};

/**
 * Get preview image for a specific blueprint
 * GET /api/merchandise/blueprint-preview/:blueprintId
 */
router.get('/blueprint-preview/:blueprintId', async (req, res) => {
    try {
        const { blueprintId } = req.params;
        const cacheKey = `blueprint_${blueprintId}`;
        
        // Check cache first
        const cached = blueprintMetadataCache.get(cacheKey);
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
        
        // Get category and metadata for this blueprint
        const category = BLUEPRINT_CATEGORIES[parseInt(blueprintId)] || 'unknown';
        const icon = CATEGORY_ICONS[category] || '📦';
        const displayName = CATEGORY_DISPLAY_NAMES[category] || blueprint.title;
        
        // Extract comprehensive metadata
        const result = {
            success: true,
            blueprintId: parseInt(blueprintId),
            name: blueprint.title,
            displayName: displayName,
            category: category,
            icon: icon,
            description: blueprint.description || '',
            brand: blueprint.brand,
            model: blueprint.model,
            previewImage: null,
            fallbackImage: '/images/previews/generic-product-preview.svg'
        };
        
        // Use official Printify preview images
        if (blueprint.images && blueprint.images.length > 0) {
            // Use the first official image as primary preview
            result.previewImage = blueprint.images[0];
            console.log(`✅ Using official Printify image for blueprint ${blueprintId}: ${result.previewImage}`);
        }
        
        // If no official image available, use local fallback
        if (!result.previewImage) {
            result.previewImage = result.fallbackImage;
            console.log(`⚠️ No official image for blueprint ${blueprintId}, using fallback`);
        }
        
        console.log(`📊 Blueprint ${blueprintId} metadata: ${category} → ${icon} → ${displayName}`);
        
        // Cache the result
        blueprintMetadataCache.set(cacheKey, {
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
            const cached = blueprintMetadataCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                result = cached.data;
            } else {
                // Find blueprint and create result
                const blueprint = blueprints.blueprints.find(bp => bp.id == blueprintId);
                
                if (blueprint) {
                    // Get category and metadata for this blueprint
                    const category = BLUEPRINT_CATEGORIES[parseInt(blueprintId)] || 'unknown';
                    const icon = CATEGORY_ICONS[category] || '📦';
                    const displayName = CATEGORY_DISPLAY_NAMES[category] || blueprint.title;
                    
                    result = {
                        success: true,
                        blueprintId: parseInt(blueprintId),
                        name: blueprint.title,
                        displayName: displayName,
                        category: category,
                        icon: icon,
                        description: blueprint.description || '',
                        brand: blueprint.brand,
                        model: blueprint.model,
                        previewImage: null,
                        fallbackImage: '/images/previews/generic-product-preview.svg'
                    };
                    
                    // Use official Printify preview images
                    if (blueprint.images && blueprint.images.length > 0) {
                        result.previewImage = blueprint.images[0];
                    }
                    
                    // If no official image available, use local fallback
                    if (!result.previewImage) {
                        result.previewImage = result.fallbackImage;
                    }
                    
                    // Cache it
                    blueprintMetadataCache.set(cacheKey, {
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
 * Get blueprint metadata by category
 * GET /api/merchandise/blueprint-category/:category
 */
router.get('/blueprint-category/:category', (req, res) => {
    try {
        const { category } = req.params;
        
        // Find all blueprints for this category
        const blueprintsForCategory = Object.entries(BLUEPRINT_CATEGORIES)
            .filter(([blueprintId, cat]) => cat === category)
            .map(([blueprintId, cat]) => ({
                blueprintId: parseInt(blueprintId),
                category: cat,
                icon: CATEGORY_ICONS[cat] || '📦',
                displayName: CATEGORY_DISPLAY_NAMES[cat] || 'Product'
            }));
        
        res.json({
            success: true,
            category: category,
            icon: CATEGORY_ICONS[category] || '📦',
            displayName: CATEGORY_DISPLAY_NAMES[category] || 'Product',
            blueprints: blueprintsForCategory
        });
        
    } catch (error) {
        console.error('❌ Error getting blueprint category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all blueprint categories and metadata
 * GET /api/merchandise/blueprint-categories
 */
router.get('/blueprint-categories', (req, res) => {
    try {
        const categories = {};
        
        // Build comprehensive category mapping
        Object.entries(BLUEPRINT_CATEGORIES).forEach(([blueprintId, category]) => {
            if (!categories[category]) {
                categories[category] = {
                    category: category,
                    icon: CATEGORY_ICONS[category] || '📦',
                    displayName: CATEGORY_DISPLAY_NAMES[category] || 'Product',
                    blueprints: []
                };
            }
            
            categories[category].blueprints.push(parseInt(blueprintId));
        });
        
        res.json({
            success: true,
            categories: categories,
            totalCategories: Object.keys(categories).length,
            totalBlueprints: Object.keys(BLUEPRINT_CATEGORIES).length
        });
        
    } catch (error) {
        console.error('❌ Error getting blueprint categories:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Clear blueprint metadata cache
 * POST /api/merchandise/clear-blueprint-cache
 */
router.post('/clear-blueprint-cache', (req, res) => {
    blueprintMetadataCache.clear();
    console.log('🧹 Blueprint metadata cache cleared');
    
    res.json({
        success: true,
        message: 'Blueprint metadata cache cleared'
    });
});

module.exports = router;