/**
 * User Product Optimizer
 * 
 * Prevents users from hitting the same slow code paths as admin catalog
 * Provides fast, cached access to user products with minimal API calls
 */

class UserProductOptimizer {
  constructor() {
    this.merchandiseDB = require('../services/merchandise-database');
    this.userProductCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get user products with caching and optimization
   * @param {string} userId - User ID
   * @param {Object} options - Options for pagination and filtering
   * @returns {Promise<Object>} Optimized user products
   */
  async getUserProductsOptimized(userId, options = {}) {
    const { page = 1, limit = 10, includeImages = false } = options;
    
    console.log(`⚡ USER OPTIMIZER: Getting products for user ${userId} (page ${page}, limit ${limit})`);
    
    try {
      // Check cache first
      const cacheKey = `${userId}_${page}_${limit}`;
      const cached = this.userProductCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`✅ USER OPTIMIZER: Cache hit for ${cacheKey}`);
        return cached.data;
      }
      
      // Get user products directly (fast path)
      const allUserProducts = await this.merchandiseDB.getUserProducts(userId);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedProducts = allUserProducts.slice(startIndex, startIndex + limit);
      
      // Optimize product data (minimal fields only)
      const optimizedProducts = paginatedProducts.map(product => ({
        productId: product.productId,
        title: product.title || 'Untitled Product',
        sourceImage: product.sourceImage || 'Unknown',
        createdAt: product.createdAt,
        blueprintId: product.blueprintId,
        providerId: product.providerId,
        // Only include images if specifically requested
        images: includeImages ? (product.images || []) : [],
        hasImages: !!(product.images && product.images.length > 0),
        viewUrl: `/merchandise/product/${product.productId}`
      }));
      
      const result = {
        success: true,
        products: optimizedProducts,
        pagination: {
          currentPage: page,
          totalProducts: allUserProducts.length,
          totalPages: Math.ceil(allUserProducts.length / limit),
          hasMore: startIndex + limit < allUserProducts.length
        },
        performance: {
          source: 'optimized',
          cached: false,
          loadTime: Date.now()
        }
      };
      
      // Cache the result
      this.userProductCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`✅ USER OPTIMIZER: Loaded ${optimizedProducts.length}/${allUserProducts.length} products for user ${userId}`);
      return result;
      
    } catch (error) {
      console.error('USER OPTIMIZER ERROR:', error);
      return {
        success: false,
        error: error.message,
        products: [],
        pagination: { currentPage: page, totalProducts: 0, totalPages: 0, hasMore: false }
      };
    }
  }

  /**
   * Get single user product with minimal data
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Single product data
   */
  async getUserProductOptimized(userId, productId) {
    console.log(`⚡ USER OPTIMIZER: Getting single product ${productId} for user ${userId}`);
    
    try {
      const product = await this.merchandiseDB.getUserProduct(userId, productId);
      
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      
      return {
        success: true,
        product: {
          productId: product.productId,
          title: product.title,
          sourceImage: product.sourceImage,
          createdAt: product.createdAt,
          blueprintId: product.blueprintId,
          providerId: product.providerId,
          images: product.images || [],
          viewUrl: `/merchandise/product/${product.productId}`
        },
        performance: {
          source: 'direct',
          loadTime: Date.now()
        }
      };
      
    } catch (error) {
      console.error('USER OPTIMIZER ERROR:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache for a specific user
   * @param {string} userId - User ID
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    for (const key of this.userProductCache.keys()) {
      if (key.startsWith(userId + '_')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.userProductCache.delete(key));
    console.log(`🧹 USER OPTIMIZER: Cleared cache for user ${userId} (${keysToDelete.length} entries)`);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.userProductCache.clear();
    console.log('🧹 USER OPTIMIZER: Cleared all cache');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      totalEntries: this.userProductCache.size,
      cacheTimeout: this.cacheTimeout,
      memoryUsage: process.memoryUsage()
    };
  }
}

// Export singleton instance
module.exports = new UserProductOptimizer();