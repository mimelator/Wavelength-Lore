/**
 * Cache Lifecycle Management Service - PERFECT PRINTING
 *
 * Implements intelligent cache cleanup and maintenance:
 * - Automatic removal of unused cache entries
 * - Storage optimization based on usage patterns
 * - Product lifecycle management
 * - Cost-aware cache retention policies
 */

const admin = require('firebase-admin');
const { getAdminDatabase, isFirebaseAdminReady, initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');

class CacheLifecycleService {
  constructor() {
    this.db = null;
    this.globalCacheRef = null;
    this.cacheStatsRef = null;
    this.initialized = false;

    // Configuration
    this.retentionConfig = {
      minAgeForCleanup: 90, // days - don't delete anything younger
      minUsageForKeep: 10, // keep if used at least 10 times
      recentProductGracePeriod: 30, // days - keep new products even if unused
      highValueThreshold: 100, // usageCount - very valuable items
      costThreshold: 0.10 // $ - expensive items kept longer
    };
  }

  /**
   * Initialize Firebase database connections
   */
  initializeDatabase() {
    if (this.initialized) return this;

    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for cache lifecycle...');
        initializeFirebaseAdmin();
      }

      this.db = getAdminDatabase();

      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }

      this.globalCacheRef = this.db.ref('globalImageCache/enhancedImages');
      this.cacheStatsRef = this.db.ref('globalImageCache/statistics');

      this.initialized = true;
      console.log('✅ Cache Lifecycle database initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Cache Lifecycle database:', error);
      throw error;
    }

    return this;
  }

  /**
   * Run comprehensive cache maintenance
   * Analyzes and removes unused cache entries
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup results
   */
  async runCacheMaintenance(options = {}) {
    try {
      this.initializeDatabase();

      console.log('🧹 Starting cache maintenance...');
      const startTime = Date.now();

      const opts = {
        dryRun: options.dryRun || false,
        aggressive: options.aggressive || false,
        maxAge: options.maxAge || this.retentionConfig.minAgeForCleanup,
        ...options
      };

      console.log(`📋 Maintenance Configuration:
        Dry Run: ${opts.dryRun}
        Aggressive Mode: ${opts.aggressive}
        Max Age: ${opts.maxAge} days`);

      // Get all cache entries
      const snapshot = await this.globalCacheRef.once('value');
      const cacheData = snapshot.val() || {};

      const analysis = this.analyzeCacheHealth(cacheData, opts);

      if (opts.dryRun) {
        console.log(`🔍 DRY RUN: Would remove ${analysis.candidates.length} items`);
        console.log(`   Estimated space saved: ${(analysis.estimatedSpaceSaved / 1024 / 1024).toFixed(2)} MB`);
        return {
          success: true,
          dryRun: true,
          analysis: analysis,
          message: 'Dry run completed. No changes made.'
        };
      }

      // Perform cleanup
      const removalResults = await this.removeUnusedEntries(analysis.candidates);

      // Update statistics
      await this.updateMaintenanceStats(removalResults);

      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Cache maintenance complete in ${duration.toFixed(2)}s
        Removed: ${removalResults.removed.length} items
        Space freed: ${(removalResults.spaceSaved / 1024 / 1024).toFixed(2)} MB
        Preserved: ${removalResults.preserved.length} items`);

      return {
        success: true,
        dryRun: false,
        removed: removalResults.removed.length,
        preserved: removalResults.preserved.length,
        spaceSaved: {
          bytes: removalResults.spaceSaved,
          megabytes: (removalResults.spaceSaved / 1024 / 1024).toFixed(2)
        },
        duration: `${duration.toFixed(2)}s`
      };

    } catch (error) {
      console.error('❌ Cache maintenance failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze cache health and identify candidates for removal
   * @param {Object} cacheData - All cache entries
   * @param {Object} options - Analysis options
   * @returns {Object} Analysis results with removal candidates
   */
  analyzeCacheHealth(cacheData, options = {}) {
    const candidates = [];
    const keepers = [];
    let estimatedSpaceSaved = 0;

    const now = Date.now();
    const minAgeMs = options.maxAge * 24 * 60 * 60 * 1000;
    const recentThresholdMs = this.retentionConfig.recentProductGracePeriod * 24 * 60 * 60 * 1000;

    for (const [cacheKey, data] of Object.entries(cacheData)) {
      if (!data || typeof data !== 'object') continue;

      const age = now - (data.createdAt || 0);
      const usageCount = data.usageCount || 0;
      const lastUsed = now - (data.lastUsedAt || data.createdAt || 0);
      const fileSize = data.fileSize || 0;
      const cost = data.processingTime || 0; // Proxy for cost

      // Decision criteria
      const isTooYoung = age < minAgeMs;
      const isHighValue = usageCount >= this.retentionConfig.highValueThreshold;
      const hasGoodUsage = usageCount >= this.retentionConfig.minUsageForKeep;
      const isRecent = age < recentThresholdMs;
      const isExpensive = cost >= this.retentionConfig.costThreshold * 1000; // Convert to ms threshold
      const isUnused = lastUsed > 180 * 24 * 60 * 60 * 1000; // Unused for 6 months

      // Keep if:
      let shouldKeep = false;
      let keepReason = null;

      if (isTooYoung) {
        shouldKeep = true;
        keepReason = 'Too young (grace period)';
      } else if (isHighValue) {
        shouldKeep = true;
        keepReason = 'High value (many reuses)';
      } else if (hasGoodUsage && isRecent) {
        shouldKeep = true;
        keepReason = 'Good usage + recent';
      } else if (isExpensive && usageCount > 0) {
        shouldKeep = true;
        keepReason = 'Expensive optimization with usage';
      } else if (options.aggressive) {
        // In aggressive mode, only keep high-value items
        shouldKeep = isHighValue || hasGoodUsage;
        if (shouldKeep) keepReason = 'Aggressive mode: acceptable usage';
      } else if (hasGoodUsage) {
        shouldKeep = true;
        keepReason = 'Meets minimum usage threshold';
      }

      if (shouldKeep) {
        keepers.push({
          cacheKey,
          usageCount,
          age: Math.round(age / 1000 / 60 / 60 / 24), // days
          reason: keepReason
        });
      } else {
        candidates.push({
          cacheKey,
          usageCount,
          age: Math.round(age / 1000 / 60 / 60 / 24), // days
          fileSize,
          lastUsed: Math.round(lastUsed / 1000 / 60 / 60 / 24) // days
        });
        estimatedSpaceSaved += fileSize;
      }
    }

    return {
      totalEntries: Object.keys(cacheData).length,
      candidates,
      keepers,
      estimatedSpaceSaved,
      removalPercentage: Math.round((candidates.length / Object.keys(cacheData).length) * 100)
    };
  }

  /**
   * Remove unused cache entries
   * @param {Array} candidates - Candidates for removal
   * @returns {Promise<Object>} Removal results
   */
  async removeUnusedEntries(candidates) {
    const removed = [];
    const failed = [];
    let spaceSaved = 0;

    console.log(`🗑️  Removing ${candidates.length} unused cache entries...`);

    for (const candidate of candidates) {
      try {
        const entry = await this.globalCacheRef.child(candidate.cacheKey).once('value');

        if (entry.exists()) {
          const data = entry.val();
          spaceSaved += candidate.fileSize || 0;

          await this.globalCacheRef.child(candidate.cacheKey).remove();

          removed.push({
            cacheKey: candidate.cacheKey,
            fileSize: candidate.fileSize,
            usageCount: candidate.usageCount
          });

          console.log(`  ✓ Removed: ${candidate.cacheKey} (${candidate.age} days old, used ${candidate.usageCount}x)`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to remove ${candidate.cacheKey}:`, error.message);
        failed.push({
          cacheKey: candidate.cacheKey,
          error: error.message
        });
      }
    }

    return {
      removed,
      failed,
      spaceSaved,
      preserved: [] // Placeholder for tracking preserved items
    };
  }

  /**
   * Update maintenance statistics
   * @param {Object} results - Cleanup results
   * @returns {Promise<void>}
   */
  async updateMaintenanceStats(results) {
    try {
      await this.cacheStatsRef.update({
        last_maintenance: admin.database.ServerValue.TIMESTAMP,
        items_cleaned: admin.database.ServerValue.increment(results.removed.length),
        space_freed_bytes: admin.database.ServerValue.increment(results.spaceSaved)
      });
    } catch (error) {
      console.warn('Failed to update maintenance stats:', error.message);
    }
  }

  /**
   * Get cache storage statistics
   * @returns {Promise<Object>} Storage breakdown
   */
  async getCacheStorageStats() {
    try {
      this.initializeDatabase();

      const snapshot = await this.globalCacheRef.once('value');
      const cacheData = snapshot.val() || {};

      let totalSize = 0;
      let itemCount = 0;
      const sizeByAge = {
        'last_7_days': 0,
        'last_30_days': 0,
        'last_90_days': 0,
        'older': 0
      };

      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

      for (const [_, data] of Object.entries(cacheData)) {
        if (!data || typeof data !== 'object') continue;

        const fileSize = data.fileSize || 0;
        totalSize += fileSize;
        itemCount++;

        const age = now - (data.createdAt || 0);

        if (age < sevenDaysMs) {
          sizeByAge['last_7_days'] += fileSize;
        } else if (age < thirtyDaysMs) {
          sizeByAge['last_30_days'] += fileSize;
        } else if (age < ninetyDaysMs) {
          sizeByAge['last_90_days'] += fileSize;
        } else {
          sizeByAge['older'] += fileSize;
        }
      }

      return {
        success: true,
        totalSize: {
          bytes: totalSize,
          megabytes: (totalSize / 1024 / 1024).toFixed(2),
          gigabytes: (totalSize / 1024 / 1024 / 1024).toFixed(2)
        },
        itemCount,
        avgItemSize: itemCount > 0 ? Math.round(totalSize / itemCount) : 0,
        sizeByAge: {
          last_7_days: `${(sizeByAge['last_7_days'] / 1024 / 1024).toFixed(2)} MB`,
          last_30_days: `${(sizeByAge['last_30_days'] / 1024 / 1024).toFixed(2)} MB`,
          last_90_days: `${(sizeByAge['last_90_days'] / 1024 / 1024).toFixed(2)} MB`,
          older: `${(sizeByAge['older'] / 1024 / 1024).toFixed(2)} MB`
        }
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Configure cache retention policy
   * @param {Object} newConfig - New configuration options
   * @returns {Object} Updated configuration
   */
  configureRetentionPolicy(newConfig = {}) {
    this.retentionConfig = {
      ...this.retentionConfig,
      ...newConfig
    };

    console.log('📋 Cache Retention Policy Updated:');
    console.log(JSON.stringify(this.retentionConfig, null, 2));

    return this.retentionConfig;
  }

  /**
   * Get current retention policy
   * @returns {Object} Current configuration
   */
  getRetentionPolicy() {
    return this.retentionConfig;
  }
}

module.exports = CacheLifecycleService;
