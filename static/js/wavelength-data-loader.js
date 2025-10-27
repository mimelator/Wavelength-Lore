/**
 * WAVELENGTH SAFE DATA LOADER
 * Replaces dangerous template JSON embedding with secure API calls
 * 
 * Benefits:
 * ✅ No more JSON parsing errors from complex nested data
 * ✅ XSS protection through proper API boundaries  
 * ✅ Better error handling and fallbacks
 * ✅ Cacheable and performance optimized
 * ✅ Easy to extend and maintain
 */

class WavelengthDataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Generic data loader for any API endpoint
     */
    async loadData(endpoint, fallbackData = {}) {
        const cacheKey = endpoint;
        
        // Return cached data if available
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Create new loading promise
        const loadingPromise = this._fetchData(endpoint, fallbackData);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const data = await loadingPromise;
            this.cache.set(cacheKey, data);
            return data;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Load seasons data safely via API
     */
    async loadSeasonsData() {
        return this.loadData('seasons', {
            season1: { title: 'Loading...', episodes: {} },
            season2: { title: 'Loading...', episodes: {} },
            season3: { title: 'Loading...', episodes: {} },
            season4: { title: 'Loading...', episodes: {} }
        });
    }

    /**
     * Load characters data safely via API
     */
    async loadCharactersData() {
        return this.loadData('characters', {});
    }

    /**
     * Load lore data safely via API
     */
    async loadLoreData() {
        return this.loadData('lore', {});
    }

    /**
     * Load episodes data safely via API
     */
    async loadEpisodesData() {
        return this.loadData('episodes', {});
    }

    /**
     * Load specific character data
     */
    async loadCharacter(characterId) {
        return this.loadData(`characters/${characterId}`, null);
    }

    /**
     * Load specific lore object data
     */
    async loadLoreObject(loreId) {
        return this.loadData(`lore/${loreId}`, null);
    }

    /**
     * Load specific episode data
     */
    async loadEpisode(episodeId) {
        return this.loadData(`episodes/${episodeId}`, null);
    }

    /**
     * Internal method to fetch data from any API endpoint
     */
    async _fetchData(endpoint, fallbackData = {}) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'API returned error');
            }

            console.log(`✅ Loaded ${endpoint} data:`, result.data ? Object.keys(result.data).length : 0, 'items');
            return result.data;
        } catch (error) {
            console.error(`❌ Failed to load ${endpoint} data:`, error);
            
            // Return fallback data
            return fallbackData;
        }
    }

    /**
     * Initialize carousels once data is loaded
     */
    async initializeCarousels() {
        try {
            const videos = await this.loadSeasonsData();
            
            // Initialize each season's carousel
            Object.keys(videos).forEach(season => {
                const carouselElement = $(`#carousel-${season}`);
                
                if (carouselElement.length) {
                    carouselElement.slick({
                        infinite: true,
                        slidesToShow: window.innerWidth <= 768 ? 2 : 3,
                        slidesToScroll: 1,
                        autoplay: true,
                        autoplaySpeed: 3000,
                        arrows: true,
                        dots: false,
                        responsive: [
                            {
                                breakpoint: 768,
                                settings: {
                                    slidesToShow: 2,
                                    slidesToScroll: 1
                                }
                            },
                            {
                                breakpoint: 480,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1
                                }
                            }
                        ]
                    });
                }
            });

            console.log('✅ Wavelength carousels initialized successfully');
            return videos;
        } catch (error) {
            console.error('❌ Failed to initialize carousels:', error);
            throw error;
        }
    }

    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Wavelength data cache cleared');
    }
}

// Global instance
window.WavelengthLoader = new WavelengthDataLoader();

// Backward compatibility - expose data globally when needed
window.getVideosData = async function() {
    return await window.WavelengthLoader.loadSeasonsData();
};

window.getCharactersData = async function() {
    return await window.WavelengthLoader.loadCharactersData();
};

window.getLoreData = async function() {
    return await window.WavelengthLoader.loadLoreData();
};

window.getEpisodesData = async function() {
    return await window.WavelengthLoader.loadEpisodesData();
};

// Helper functions for specific data needs
window.getCharacter = async function(characterId) {
    return await window.WavelengthLoader.loadCharacter(characterId);
};

window.getLoreObject = async function(loreId) {
    return await window.WavelengthLoader.loadLoreObject(loreId);
};

window.getEpisode = async function(episodeId) {
    return await window.WavelengthLoader.loadEpisode(episodeId);
};