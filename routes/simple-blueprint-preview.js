/**
 * Simple Blueprint Preview API
 * 
 * Provides static preview images for product categories
 * without requiring external API calls for initial implementation
 */

const express = require('express');
const router = express.Router();

// Static preview images mapping based on common blueprint categories
const PREVIEW_IMAGES = {
  // T-Shirts and Apparel
  't-shirt': '/images/previews/tshirt-preview.png',
  'heavy-cotton-tee': '/images/previews/heavy-tee-preview.png',
  'tank-top': '/images/previews/tank-preview.png',
  'hoodie': '/images/previews/hoodie-preview.png',
  'sweatshirt': '/images/previews/sweatshirt-preview.png',
  'zip-hoodie': '/images/previews/zip-hoodie-preview.png',
  
  // Accessories
  'coffee-mug': '/images/previews/mug-preview.png',
  'travel-mug': '/images/previews/travel-mug-preview.png',
  'tote-bag': '/images/previews/tote-bag-preview.png',
  'backpack': '/images/previews/backpack-preview.png',
  'phone-case': '/images/previews/phone-case-preview.png',
  'laptop-sleeve': '/images/previews/laptop-sleeve-preview.png',
  
  // Home & Living
  'pillow': '/images/previews/pillow-preview.png',
  'blanket': '/images/previews/blanket-preview.png',
  'canvas': '/images/previews/canvas-preview.png',
  'notebook': '/images/previews/notebook-preview.png',
  'sticker': '/images/previews/sticker-preview.png',
  
  // Specialty
  'premium-tshirt': '/images/previews/premium-tee-preview.png',
  'women-tee': '/images/previews/women-tee-preview.png',
  'infant-wear': '/images/previews/infant-wear-preview.png',
  'hat': '/images/previews/hat-preview.png',
  'fanny-pack': '/images/previews/fanny-pack-preview.png',
  'specialty-item': '/images/previews/specialty-preview.png'
};

// Blueprint ID to category mapping (from the product data we saw earlier)
const BLUEPRINT_CATEGORIES = {
  // Common blueprint IDs and their categories
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
  
  // Add more mappings as needed
};

/**
 * Get preview image for a specific blueprint
 * GET /api/merchandise/blueprint-preview/:blueprintId
 */
router.get('/blueprint-preview/:blueprintId', async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const id = parseInt(blueprintId);
    
    console.log(`🎯 Getting preview for blueprint ${id}`);
    
    // Look up category for this blueprint ID
    const category = BLUEPRINT_CATEGORIES[id];
    
    if (!category) {
      // Default fallback for unknown blueprint IDs
      return res.json({
        success: true,
        blueprintId: id,
        name: `Product ${id}`,
        category: 'unknown',
        previewImage: '/images/previews/generic-product-preview.png',
        fallbackImage: '/images/previews/generic-product-preview.png'
      });
    }
    
    // Get preview image for this category
    const previewImage = PREVIEW_IMAGES[category] || '/images/previews/generic-product-preview.png';
    
    const result = {
      success: true,
      blueprintId: id,
      name: getCategoryDisplayName(category),
      category: category,
      previewImage: previewImage,
      fallbackImage: previewImage
    };
    
    console.log(`✅ Returning preview for blueprint ${id}: ${category} -> ${previewImage}`);
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
    
    console.log(`🎯 Batch getting previews for ${blueprintIds.length} blueprints`);
    
    const results = blueprintIds.map(blueprintId => {
      const id = parseInt(blueprintId);
      const category = BLUEPRINT_CATEGORIES[id] || 'unknown';
      const previewImage = PREVIEW_IMAGES[category] || '/images/previews/generic-product-preview.png';
      
      return {
        success: true,
        blueprintId: id,
        name: getCategoryDisplayName(category),
        category: category,
        previewImage: previewImage,
        fallbackImage: previewImage
      };
    });
    
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
 * Get category display name
 */
function getCategoryDisplayName(category) {
  const displayNames = {
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
    'specialty-item': 'Specialty Item',
    'unknown': 'Product'
  };
  
  return displayNames[category] || 'Product';
}

module.exports = router;