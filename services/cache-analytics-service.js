/**
 * Cache Analytics Service - PERFECT PRINTING
 *
 * Provides comprehensive visibility into image cache performance:
 * - Cache hit rates and trends
 * - Product-specific optimization metrics
 * - Cost analysis (API usage and storage)
 * - Usage patterns and popular images
 * - Performance recommendations
 */

const admin = require('firebase-admin');
const { getAdminDatabase, isFirebaseAdminReady, initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');

class CacheAnalyticsService {
  constructor() {
    this.db = null;
    this.cacheStatsRef = null;
    this.optimizationMetricsRef = null;
    this.initialized = false;
    console.log('📊 CacheAnalyticsService instantiated');
  }

  /**
   * Initialize Firebase database connections
   */
  initializeDatabase() {
    if (this.initialized) return this;

    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for cache analytics...');
        initializeFirebaseAdmin();
      }

      this.db = getAdminDatabase();

      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }

      this.cacheStatsRef = this.db.ref('globalImageCache/statistics');
      this.optimizationMetricsRef = this.db.ref('cacheAnalytics/optimizationMetrics');

      this.initialized = true;
      console.log('✅ Cache Analytics database initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Cache Analytics database:', error);
      throw error;
    }

    return this;
  }

  /**
   * Get overall cache statistics
   * @returns {Promise<Object>} Cache performance metrics
   */
  async getCacheStatistics() {
    try {
      this.initializeDatabase();

      const snapshot = await this.cacheStatsRef.once('value');
      const stats = snapshot.val() || {};

      const totalRequests = (stats.cache_hits || 0) + (stats.cache_misses || 0);
      const hitRate = totalRequests > 0 ? ((stats.cache_hits || 0) / totalRequests) : 0;
      const reusedRatio = stats.enhancements_created > 0
        ? (stats.enhancements_reused || 0) / stats.enhancements_created
        : 0;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        cacheHits: stats.cache_hits || 0,
        cacheMisses: stats.cache_misses || 0,
        totalRequests,
        hitRate: Math.round(hitRate * 10000) / 100, // 2 decimal places
        hitRatePercentage: `${Math.round(hitRate * 100)}%`,
        enhancementsCreated: stats.enhancements_created || 0,
        enhancementsReused: stats.enhancements_reused || 0,
        totalFingerprints: stats.total_fingerprints || 0,
        estimatedCostSavings: this.calculateCostSavings(stats),
        lastUpdated: stats.last_updated
      };

    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product-specific optimization metrics
   * @returns {Promise<Object>} Metrics by product type
   */
  async getProductMetrics() {
    try {
      this.initializeDatabase();

      const snapshot = await this.optimizationMetricsRef.once('value');
      const metrics = snapshot.val() || {};

      const productMetrics = {};

      // Process each product's metrics
      for (const [productKey, data] of Object.entries(metrics)) {
        if (data && typeof data === 'object') {
          productMetrics[productKey] = {
            timesOptimized: data.timesOptimized || 0,
            timesReused: data.timesReused || 0,
            totalRequests: (data.timesOptimized || 0) + (data.timesReused || 0),
            reuseRate: this.calculateReuseRate(data.timesOptimized, data.timesReused),
            avgOptimizationTime: data.avgOptimizationTime || 0,
            lastOptimized: data.lastOptimized,
            upscaleFactor: data.upscaleFactor || 1,
            estimatedCost: data.estimatedCost || 0,
            costPerUser: this.calculateCostPerUser(data.estimatedCost, data.timesReused)
          };
        }
      }

      // Sort by total requests
      const sortedMetrics = Object.entries(productMetrics)
        .sort((a, b) => (b[1].totalRequests || 0) - (a[1].totalRequests || 0))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

      return {
        success: true,
        timestamp: new Date().toISOString(),
        productMetrics: sortedMetrics,
        totalProducts: Object.keys(productMetrics).length
      };

    } catch (error) {
      console.error('Error getting product metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record product optimization
   * Called when an image is optimized for a specific product
   * @param {string} productKey - Product identifier
   * @param {Object} optimizationData - Optimization metadata
   * @returns {Promise<Object>} Recording result
   */
  async recordOptimization(productKey, optimizationData = {}) {
    console.log(`📊 recordOptimization called for ${productKey}`, optimizationData);
    try {
      this.initializeDatabase();
      console.log(`📊 Database initialized, writing to ref...`);

      const productRef = this.optimizationMetricsRef.child(productKey);

      const updates = {
        timesOptimized: admin.database.ServerValue.increment(1),
        avgOptimizationTime: this.calculateNewAverage(
          optimizationData.processingTime || 0,
          (optimizationData.previousAvg || 0),
          (optimizationData.previousCount || 0)
        ),
        upscaleFactor: optimizationData.scaleFactor || 1,
        estimatedCost: admin.database.ServerValue.increment(optimizationData.costEstimate || 0),
        lastOptimized: admin.database.ServerValue.TIMESTAMP
      };

      await productRef.update(updates);

      return {
        success: true,
        message: `Recorded optimization for ${productKey}`
      };

    } catch (error) {
      console.warn('Failed to record optimization:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record cache reuse
   * Called when a cached optimization is used
   * @param {string} productKey - Product identifier
   * @returns {Promise<Object>} Recording result
   */
  async recordCacheReuse(productKey) {
    console.log(`📊 recordCacheReuse called for ${productKey}`);
    try {
      this.initializeDatabase();
      console.log(`📊 Database initialized for reuse, writing to ref...`);

      const productRef = this.optimizationMetricsRef.child(productKey);

      await productRef.update({
        timesReused: admin.database.ServerValue.increment(1),
        lastReused: admin.database.ServerValue.TIMESTAMP
      });

      return { success: true };

    } catch (error) {
      console.warn('Failed to record cache reuse:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cache health recommendations
   * Analyzes cache performance and suggests optimizations
   * @returns {Promise<Object>} Recommendations and insights
   */
  async getCacheHealthRecommendations() {
    try {
      const stats = await this.getCacheStatistics();
      const productMetrics = await this.getProductMetrics();

      const recommendations = [];
      const insights = [];

      if (!stats.success) {
        return { success: false, error: stats.error };
      }

      // Recommendation 1: Cache effectiveness
      if (stats.hitRate < 0.70) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Cache Hit Rate',
          current: `${stats.hitRatePercentage}`,
          target: '85-95%',
          reason: 'Cache hit rate below optimal threshold',
          suggestion: 'Consider promoting popular products or offering pre-optimization'
        });
      } else {
        insights.push({
          type: 'positive',
          message: `✅ Excellent cache hit rate (${stats.hitRatePercentage})!`
        });
      }

      // Recommendation 2: Popular products
      if (productMetrics.success && Object.keys(productMetrics.productMetrics).length > 0) {
        const sortedProducts = Object.entries(productMetrics.productMetrics)
          .sort((a, b) => (b[1].totalRequests || 0) - (a[1].totalRequests || 0))
          .slice(0, 3);

        insights.push({
          type: 'info',
          title: 'Most Popular Products',
          data: sortedProducts.map(([key, data]) => ({
            product: key,
            requests: data.totalRequests,
            reuseRate: data.reuseRate
          }))
        });

        // Check for underutilized products
        const underutilized = Object.entries(productMetrics.productMetrics)
          .filter(([_, data]) => (data.totalRequests || 0) < 5 && (data.timesOptimized || 0) > 0)
          .map(([key]) => key);

        if (underutilized.length > 0) {
          recommendations.push({
            priority: 'medium',
            title: 'Promote Underutilized Products',
            products: underutilized,
            reason: 'Some products have few optimization requests relative to optimizations created',
            suggestion: 'Consider marketing or bundling these products'
          });
        }
      }

      // Recommendation 3: Cost efficiency
      if (stats.enhancementsCreated > 0) {
        const costEfficiency = stats.enhancementsReused / stats.enhancementsCreated;
        if (costEfficiency > 5) {
          insights.push({
            type: 'success',
            message: `💰 Excellent cost efficiency! Each optimization being reused ${costEfficiency.toFixed(1)}x on average`
          });
        }
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        recommendations,
        insights,
        overall_health: this.calculateOverallHealth(stats, recommendations)
      };

    } catch (error) {
      console.error('Error getting health recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get top performing cached optimizations
   * @param {number} limit - Number of top items to return
   * @returns {Promise<Object>} Top performing optimizations
   */
  async getTopOptimizations(limit = 10) {
    try {
      this.initializeDatabase();

      const snapshot = await this.optimizationMetricsRef.once('value');
      const metrics = snapshot.val() || {};

      const topItems = Object.entries(metrics)
        .map(([productKey, data]) => ({
          productKey,
          totalBenefit: (data.timesReused || 0) * (data.avgOptimizationTime || 0) / 1000, // Time saved in seconds
          timesReused: data.timesReused || 0,
          avgOptimizationTime: data.avgOptimizationTime || 0,
          costSaved: (data.timesReused || 0) * (data.estimatedCost || 0) / (data.timesOptimized || 1)
        }))
        .sort((a, b) => b.totalBenefit - a.totalBenefit)
        .slice(0, limit);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        topOptimizations: topItems,
        totalTimeSaved: topItems.reduce((sum, item) => sum + item.totalBenefit, 0),
        estimatedCostSaved: topItems.reduce((sum, item) => sum + item.costSaved, 0)
      };

    } catch (error) {
      console.error('Error getting top optimizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate cost per optimization
   * Estimates API costs based on upscaling method
   * @param {Object} optimizationData - Data about the optimization
   * @returns {number} Estimated cost in dollars
   */
  calculateOptimizationCost(optimizationData = {}) {
    const method = optimizationData.method || 'SHARP';

    // Estimated costs (adjust based on your actual pricing)
    const costs = {
      'ESRGAN': 0.08, // Replicate API
      'DALL-E': 0.12,
      'SHARP': 0.00, // Local, free
      'default': 0.05
    };

    return costs[method] || costs['default'];
  }

  /**
   * Calculate cost savings
   * @param {Object} stats - Cache statistics
   * @returns {number} Estimated savings in dollars
   */
  calculateCostSavings(stats = {}) {
    const costPerOptimization = 0.08; // Average cost per Replicate upscaling
    const avoided = (stats.cache_hits || 0) * costPerOptimization;
    return Math.round(avoided * 100) / 100;
  }

  /**
   * Calculate reuse rate percentage
   * @param {number} timesOptimized - Number of times optimized
   * @param {number} timesReused - Number of times reused
   * @returns {string} Reuse rate percentage
   */
  calculateReuseRate(timesOptimized, timesReused) {
    if (!timesOptimized || timesOptimized === 0) return '0%';
    const rate = (timesReused / timesOptimized) * 100;
    return `${Math.round(rate)}%`;
  }

  /**
   * Calculate cost per user
   * @param {number} totalCost - Total cost
   * @param {number} timesReused - Number of reuses
   * @returns {number} Cost per user
   */
  calculateCostPerUser(totalCost, timesReused) {
    if (!timesReused || timesReused === 0) return 0;
    return Math.round((totalCost / timesReused) * 10000) / 10000;
  }

  /**
   * Calculate new average
   * @param {number} newValue - New value to add
   * @param {number} previousAvg - Previous average
   * @param {number} previousCount - Previous count
   * @returns {number} New average
   */
  calculateNewAverage(newValue, previousAvg = 0, previousCount = 0) {
    if (previousCount === 0) return newValue;
    const total = (previousAvg * previousCount) + newValue;
    return Math.round(total / (previousCount + 1));
  }

  /**
   * Calculate overall health score
   * @param {Object} stats - Cache statistics
   * @param {Array} recommendations - Recommendations list
   * @returns {Object} Health score details
   */
  calculateOverallHealth(stats = {}, recommendations = []) {
    let healthScore = 100;

    // Deduct for low hit rate
    if (stats.hitRate < 0.70) healthScore -= 20;
    else if (stats.hitRate < 0.85) healthScore -= 10;

    // Deduct for active recommendations
    healthScore -= recommendations.filter(r => r.priority === 'high').length * 15;
    healthScore -= recommendations.filter(r => r.priority === 'medium').length * 8;

    return {
      score: Math.max(0, healthScore),
      status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs_attention',
      details: [
        `Hit rate: ${stats.hitRatePercentage}`,
        `Enhancements created: ${stats.enhancementsCreated}`,
        `Cost savings: $${stats.estimatedCostSavings}`
      ]
    };
  }
}

module.exports = CacheAnalyticsService;
