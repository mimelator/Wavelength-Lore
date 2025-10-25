// Episode helper functions for generating episode links and references
const firebaseUtils = require('./firebase-utils');
const firebaseAdminUtils = require('./firebase-admin-utils');
const cacheUtils = require('./cache-utils');
const linkingUtils = require('./linking-utils');

// Create cache manager for episodes
const episodeCache = cacheUtils.createCacheManager('Episodes');

// Fallback episode data (in case database is unavailable)
const fallbackEpisodes = [
  {
    id: 'my-lucky-charm',
    title: 'My Lucky Charm',
    name: 'My Lucky Charm',
    url: '/season/1/episode/1',
    season: 'season1',
    episode: 'episode1'
  },
  {
    id: 'the-battle-of-the-shire',
    title: 'The Battle of the Shire',
    name: 'The Battle of the Shire',
    url: '/season/1/episode/6',
    season: 'season1',
    episode: 'episode6'
  },
  {
    id: 'prepare-for-battle',
    title: 'Prepare for Battle',
    name: 'Prepare for Battle',
    url: '/season/1/episode/5',
    season: 'season1',
    episode: 'episode5'
  },
  {
    id: 'frozen-peace',
    title: 'Frozen Peace',
    name: 'Frozen Peace',
    url: '/season/3/episode/4',
    season: 'season3',
    episode: 'episode4'
  }
];

/**
 * Fetch episodes from Firebase database
 * @returns {Promise<Array>} Array of episode objects
 */
async function fetchEpisodesFromDatabase() {
  try {
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('episode-helpers');
    }

    const videosData = await firebaseAdminUtils.fetchDataAsAdmin('videos');
    
    if (videosData) {
      // Extract all episodes from all seasons
      let allEpisodes = [];
      let seasonCount = 0;
      
      for (const seasonId in videosData) {
        const seasonData = videosData[seasonId];
        seasonCount++;
        
        if (seasonData.episodes) {
          for (const episodeId in seasonData.episodes) {
            const episodeData = seasonData.episodes[episodeId];
            
            if (episodeData.title) {
              // Extract season number from seasonId (e.g., "season1" -> "1")
              const seasonNumber = seasonId.replace('season', '');
              // Extract episode number from episodeId (e.g., "episode1" -> "1")
              const episodeNumber = episodeId.replace('episode', '');
              
              allEpisodes.push({
                id: createEpisodeId(episodeData.title),
                title: episodeData.title,
                name: episodeData.title, // Use title as name for matching
                url: `/season/${seasonNumber}/episode/${episodeNumber}`,
                season: seasonId,
                episode: episodeId,
                description: episodeData.description,
                youtubeLink: episodeData.youtubeLink,
                image: episodeData.image,
                keywords: episodeData.keywords || [], // Include keywords field
                visible: episodeData.visible, // Legacy field (keep for backwards compatibility)
                hidden: episodeData.hidden // New visibility field
              });
            }
          }
        }
      }
      
      const episodesWithKeywords = allEpisodes.filter(ep => ep.keywords && ep.keywords.length > 0).length;
      console.log(`📺 Loaded ${allEpisodes.length} episodes from ${seasonCount} seasons (${episodesWithKeywords} with keywords)`);
      
      // Sort episodes by season and episode number
      allEpisodes.sort((a, b) => {
        // Extract numeric values from season and episode IDs
        const seasonA = parseInt(a.season.replace('season', ''));
        const seasonB = parseInt(b.season.replace('season', ''));
        
        if (seasonA !== seasonB) {
          return seasonA - seasonB;
        }
        
        const episodeA = parseInt(a.episode.replace('episode', ''));
        const episodeB = parseInt(b.episode.replace('episode', ''));
        return episodeA - episodeB;
      });
      
      return allEpisodes;
    } else {
      console.warn('No episode data found in database, using fallback');
      return fallbackEpisodes;
    }
  } catch (error) {
    console.error('Error fetching episodes from database:', error);
    return fallbackEpisodes;
  }
}

/**
 * Create a URL-friendly ID from episode title
 * @param {string} title - Episode title
 * @returns {string} URL-friendly ID
 */
function createEpisodeId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get episodes with caching
 * @returns {Promise<Array>} Array of episode objects
 */
async function getEpisodes() {
  return await cacheUtils.getWithCache(
    episodeCache,
    fetchEpisodesFromDatabase,
    fallbackEpisodes
  );
}

/**
 * Get episode by ID
 * @param {string} id - Episode ID
 * @returns {Promise<object|null>} Episode object or null if not found
 */
async function getEpisodeById(id) {
  const episodes = await getEpisodes();
  return episodes.find(episode => episode.id === id) || null;
}

/**
 * Get episodes by season
 * @param {string} season - Season ID (e.g., 'season1')
 * @returns {Promise<Array>} Array of episodes in the season
 */
async function getEpisodesBySeason(season) {
  const episodes = await getEpisodes();
  return episodes.filter(episode => episode.season === season);
}

/**
 * Generate a link to an episode
 * @param {string} episodeId - Episode ID
 * @returns {Promise<string>} HTML link or original text if episode not found
 */
async function generateEpisodeLink(episodeId) {
  const episode = await getEpisodeById(episodeId);
  if (episode) {
    return `<a href="${episode.url}" class="episode-link" title="Watch ${episode.title}">${episode.title}</a>`;
  }
  return episodeId;
}

/**
 * Replace episode mentions in text with links
 * @param {string} text - Text to process
 * @returns {Promise<string>} Text with episode names replaced by links
 */
async function linkifyEpisodeMentions(text) {
  const episodes = await getEpisodes();
  return linkingUtils.linkifyItemMentions(text, episodes, 'episode');
}

/**
 * Get all episodes with optional visibility filtering
 * @param {boolean} showHidden - Whether to include hidden episodes (for content creators)
 * @returns {Promise<Array>} Array of all episodes
 */
async function getAllEpisodes(showHidden = false) {
  const allEpisodes = await getEpisodes();
  
  // Filter out hidden episodes for public users
  if (!showHidden) {
    return allEpisodes.filter(episode => !episode.hidden);
  }
  
  return allEpisodes;
}

/**
 * Synchronous versions for compatibility (uses cache or fallback)
 */

/**
 * Get episode by ID (sync version using cache)
 * @param {string} id - Episode ID
 * @returns {object|null} Episode object or null if not found
 */
function getEpisodeByIdSync(id) {
  const episodes = cacheUtils.getSync(episodeCache, fallbackEpisodes);
  return episodes.find(episode => episode.id === id) || null;
}

/**
 * Get episodes by season (sync version using cache)
 * @param {string} season - Season ID
 * @returns {Array} Array of episodes in the season
 */
function getEpisodesBySeasonSync(season) {
  const episodes = cacheUtils.getSync(episodeCache, fallbackEpisodes);
  return episodes.filter(episode => episode.season === season);
}

/**
 * Generate episode link (sync version using cache)
 * @param {string} episodeId - Episode ID
 * @returns {string} HTML link or original text if episode not found
 */
function generateEpisodeLinkSync(episodeId) {
  const episode = getEpisodeByIdSync(episodeId);
  if (episode) {
    return `<a href="${episode.url}" class="episode-link" title="Watch ${episode.title}">${episode.title}</a>`;
  }
  return episodeId;
}

/**
 * Replace episode mentions in text with links (sync version)
 * @param {string} text - Text to process
 * @returns {string} Text with episode names replaced by links
 */
function linkifyEpisodeMentionsSync(text) {
  const episodes = cacheUtils.getSync(episodeCache, fallbackEpisodes);
  return linkingUtils.linkifyItemMentions(text, episodes, 'episode');
}

/**
 * Get all episodes (sync version using cache)
 * @param {boolean} showHidden - Whether to include hidden episodes (for content creators)
 * @returns {Array} Array of all episodes
 */
function getAllEpisodesSync(showHidden = false) {
  const allEpisodes = cacheUtils.getSync(episodeCache, fallbackEpisodes);
  
  // Filter out hidden episodes for public users
  if (!showHidden) {
    return allEpisodes.filter(episode => !episode.hidden);
  }
  
  return allEpisodes;
}

/**
 * Initialize episode cache
 * @returns {Promise<void>}
 */
async function initializeEpisodeCache() {
  try {
    // Only initialize Firebase if not already ready
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('episode-cache-init');
    }
    
    // Then populate the cache
    await getEpisodes(); // This will populate the cache
    console.log('Episode cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize episode cache:', error);
  }
}

/**
 * Clear episode cache
 */
function clearEpisodeCache() {
  episodeCache.clear();
}

// Export functions
module.exports = {
  setDatabaseInstance: firebaseUtils.setDatabaseInstance,
  getEpisodes,
  getEpisodeById,
  getEpisodesBySeason,
  getAllEpisodes,
  generateEpisodeLink,
  linkifyEpisodeMentions,
  initializeEpisodeCache,
  clearEpisodeCache,
  clearCache: clearEpisodeCache, // Alias for API compatibility
  
  // Sync versions
  getEpisodeByIdSync,
  getEpisodesBySeasonSync,
  getAllEpisodesSync,
  generateEpisodeLinkSync,
  linkifyEpisodeMentionsSync,
  
  // Template helpers (alias for sync versions for EJS compatibility)
  episodeLink: generateEpisodeLinkSync,
  linkifyEpisodes: linkifyEpisodeMentionsSync
};