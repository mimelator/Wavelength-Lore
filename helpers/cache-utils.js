/**
 * Cache Management Utilities for Wavelength Lore
 * 
 * Shared caching logic used by all helper modules to eliminate code duplication
 * Provides standardized cache creation, validation, and management
 */

// Default cache duration (5 minutes)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Create a new cache manager instance
 * @param {string} cacheName - Name for debugging/logging
 * @param {number} duration - Cache duration in milliseconds (optional)
 * @returns {object} Cache manager with methods
 */
function createCacheManager(cacheName, duration = DEFAULT_CACHE_DURATION) {
  let cache = null;
  let cacheTimestamp = null;
  
  return {
    /**
     * Check if cache is valid and return data if available
     * @returns {any|null} Cached data or null if expired/empty
     */
    get() {
      const now = Date.now();
      
      if (cache && cacheTimestamp && (now - cacheTimestamp) < duration) {
        return cache;
      }
      
      return null;
    },
    
    /**
     * Store data in cache with current timestamp
     * @param {any} data - Data to cache
     */
    set(data) {
      cache = data;
      cacheTimestamp = Date.now();
    },
    
    /**
     * Clear the cache
     */
    clear() {
      cache = null;
      cacheTimestamp = null;
      console.log(`${cacheName} cache cleared`);
    },
    
    /**
     * Check if cache has valid data
     * @returns {boolean} True if cache is valid
     */
    isValid() {
      const now = Date.now();
      return cache && cacheTimestamp && (now - cacheTimestamp) < duration;
    },
    
    /**
     * Get cache metadata
     * @returns {object} Cache info
     */
    getInfo() {
      return {
        name: cacheName,
        hasData: !!cache,
        timestamp: cacheTimestamp,
        age: cacheTimestamp ? Date.now() - cacheTimestamp : null,
        duration: duration,
        isValid: this.isValid()
      };
    },
    
    /**
     * Get cached data directly (without validation)
     * @returns {any|null} Cached data or null
     */
    getRaw() {
      return cache;
    }
  };
}

/**
 * Generic async fetch with caching wrapper
 * @param {object} cacheManager - Cache manager instance
 * @param {function} fetchFunction - Async function to fetch fresh data
 * @param {any} fallbackData - Fallback data if fetch fails
 * @returns {Promise<any>} Cached or fresh data
 */
async function getWithCache(cacheManager, fetchFunction, fallbackData = null) {
  // Try to get from cache first
  const cachedData = cacheManager.get();
  if (cachedData) {
    return cachedData;
  }
  
  // Fetch fresh data
  try {
    const freshData = await fetchFunction();
    if (freshData) {
      cacheManager.set(freshData);
      return freshData;
    } else {
      return fallbackData;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return fallbackData;
  }
}

/**
 * Sync version that only returns cached data or fallback
 * @param {object} cacheManager - Cache manager instance
 * @param {any} fallbackData - Fallback data if no cache
 * @returns {any} Cached data or fallback
 */
function getSync(cacheManager, fallbackData = null) {
  return cacheManager.getRaw() || fallbackData;
}

/**
 * Initialize cache by fetching data
 * @param {object} cacheManager - Cache manager instance
 * @param {function} fetchFunction - Async function to fetch data
 * @param {string} cacheName - Name for logging
 * @returns {Promise<void>}
 */
async function initializeCache(cacheManager, fetchFunction, cacheName) {
  try {
    const data = await fetchFunction();
    cacheManager.set(data);
    console.log(`${cacheName} cache initialized successfully`);
  } catch (error) {
    console.error(`Failed to initialize ${cacheName} cache:`, error);
  }
}

module.exports = {
  createCacheManager,
  getWithCache,
  getSync,
  initializeCache,
  DEFAULT_CACHE_DURATION
};