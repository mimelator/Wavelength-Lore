/**
 * Product Catalog API Routes
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Load categorized catalog
let catalogCache = null;
let catalogLastModified = null;

function loadCatalog() {
  const catalogPath = path.join(__dirname, '../config/product-catalog-categorized.json');
  
  try {
    const stats = fs.statSync(catalogPath);
    
    // Check if we need to reload the catalog
    if (!catalogCache || !catalogLastModified || stats.mtime > catalogLastModified) {
      console.log('Loading product catalog...');
      const catalogData = fs.readFileSync(catalogPath, 'utf8');
      catalogCache = JSON.parse(catalogData);
      catalogLastModified = stats.mtime;
      console.log(`Loaded ${catalogCache.totalProducts} products in ${Object.keys(catalogCache.categories).length} categories`);
    }
    
    return catalogCache;
  } catch (error) {
    console.error('Error loading product catalog:', error);
    return null;
  }
}

/**
 * Get full product catalog
 */
router.get('/product-catalog', (req, res) => {
  try {
    const catalog = loadCatalog();
    
    if (!catalog) {
      return res.status(500).json({ 
        error: 'Product catalog not available',
        message: 'The product catalog could not be loaded. Please try again later.'
      });
    }
    
    res.json(catalog);
  } catch (error) {
    console.error('Error serving product catalog:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred while loading the product catalog.'
    });
  }
});

/**
 * Get products by category
 */
router.get('/product-catalog/category/:categoryId', (req, res) => {
  try {
    const catalog = loadCatalog();
    const { categoryId } = req.params;
    
    if (!catalog) {
      return res.status(500).json({ error: 'Product catalog not available' });
    }
    
    const category = catalog.categories[categoryId];
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      category: categoryId,
      ...category
    });
  } catch (error) {
    console.error('Error serving category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get products by subcategory
 */
router.get('/product-catalog/category/:categoryId/subcategory/:subcategoryId', (req, res) => {
  try {
    const catalog = loadCatalog();
    const { categoryId, subcategoryId } = req.params;
    
    if (!catalog) {
      return res.status(500).json({ error: 'Product catalog not available' });
    }
    
    const category = catalog.categories[categoryId];
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const subcategory = category.subcategories[subcategoryId];
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json({
      category: categoryId,
      subcategory: subcategoryId,
      ...subcategory
    });
  } catch (error) {
    console.error('Error serving subcategory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Search products
 */
router.get('/product-catalog/search', (req, res) => {
  try {
    const catalog = loadCatalog();
    const { q: query, category, limit = 50 } = req.query;
    
    if (!catalog) {
      return res.status(500).json({ error: 'Product catalog not available' });
    }
    
    if (!query || query.length < 2) {
      return res.json({ results: [], query: query || '', total: 0 });
    }
    
    const searchTerm = query.toLowerCase();
    let results = catalog.searchIndex.filter(product => 
      product.searchTerms.includes(searchTerm) ||
      product.blueprint_title.toLowerCase().includes(searchTerm) ||
      product.blueprint_brand?.toLowerCase().includes(searchTerm) ||
      product.provider_title.toLowerCase().includes(searchTerm)
    );
    
    // Filter by category if specified
    if (category && catalog.categories[category]) {
      results = results.filter(product => product.category === category);
    }
    
    // Limit results
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      results = results.slice(0, limitNum);
    }
    
    res.json({
      results,
      query,
      total: results.length,
      category: category || null
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get catalog statistics
 */
router.get('/product-catalog/stats', (req, res) => {
  try {
    const catalog = loadCatalog();
    
    if (!catalog) {
      return res.status(500).json({ error: 'Product catalog not available' });
    }
    
    const stats = {
      totalProducts: catalog.totalProducts,
      totalCategories: Object.keys(catalog.categories).length,
      generatedAt: catalog.generatedAt,
      categories: {}
    };
    
    // Calculate category stats
    for (const [key, category] of Object.entries(catalog.categories)) {
      stats.categories[key] = {
        name: category.name,
        productCount: category.productCount,
        subcategories: Object.keys(category.subcategories).length
      };
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error serving catalog stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;