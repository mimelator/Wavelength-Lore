// Episode helper functions for generating episode links and references
const { initializeApp, getApps } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Firebase configuration (same as main app)
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

// Initialize Firebase (reuse existing app if available)
let firebaseApp;
let database;

function initializeFirebase() {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Use the first existing app
      firebaseApp = existingApps[0];
    } else {
      // Create new app
      firebaseApp = initializeApp(firebaseConfig, 'episode-helpers');
    }
    database = getDatabase(firebaseApp);
  } catch (error) {
    console.warn('Firebase initialization in episode-helpers failed:', error.message);
    // Firebase will be null, and we'll use fallback data
  }
}

/**
 * Set database instance (useful when called from main app)
 * @param {object} dbInstance - Firebase database instance
 */
function setDatabaseInstance(dbInstance) {
  database = dbInstance;
}

// Cache for episode data
let episodeCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback episode data (in case database is unavailable)
const fallbackEpisodes = [
  {
    id: 'my-lucky-charm',
    title: 'My Lucky Charm',
    name: 'My Lucky Charm',
    url: '/episode/season1/episode1',
    season: 'season1',
    episode: 'episode1'
  },
  {
    id: 'the-battle-of-the-shire',
    title: 'The Battle of the Shire',
    name: 'The Battle of the Shire',
    url: '/episode/season1/episode6',
    season: 'season1',
    episode: 'episode6'
  },
  {
    id: 'prepare-for-battle',
    title: 'Prepare for Battle',
    name: 'Prepare for Battle',
    url: '/episode/season1/episode5',
    season: 'season1',
    episode: 'episode5'
  },
  {
    id: 'frozen-peace',
    title: 'Frozen Peace',
    name: 'Frozen Peace',
    url: '/episode/season3/episode4',
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
    if (!database) {
      console.warn('Database not available, using fallback episodes');
      return fallbackEpisodes;
    }

    const videosRef = ref(database, 'videos');
    const snapshot = await get(videosRef);

    if (snapshot.exists()) {
      const videosData = snapshot.val();
      
      // Extract all episodes from all seasons
      let allEpisodes = [];
      
      for (const seasonId in videosData) {
        const seasonData = videosData[seasonId];
        
        if (seasonData.episodes) {
          for (const episodeId in seasonData.episodes) {
            const episodeData = seasonData.episodes[episodeId];
            
            if (episodeData.title) {
              allEpisodes.push({
                id: createEpisodeId(episodeData.title),
                title: episodeData.title,
                name: episodeData.title, // Use title as name for matching
                url: `/episode/${seasonId}/${episodeId}`,
                season: seasonId,
                episode: episodeId,
                description: episodeData.description,
                youtubeLink: episodeData.youtubeLink,
                image: episodeData.image
              });
            }
          }
        }
      }
      
      console.log(`Loaded ${allEpisodes.length} episodes from Firebase`);
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
  const now = Date.now();
  
  // Check if cache is still valid
  if (episodeCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return episodeCache;
  }
  
  // Fetch fresh data and update cache
  episodeCache = await fetchEpisodesFromDatabase();
  cacheTimestamp = now;
  
  return episodeCache;
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
  let processedText = text;
  
  for (const episode of episodes) {
    // Create regex to match episode name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${escapeRegex(episode.name)}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${episode.url}" class="episode-link" title="Watch ${episode.name}">${match}</a>`;
    });
  }
  
  return processedText;
}

/**
 * Escape special characters for regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all episodes list
 * @returns {Promise<Array>} Array of all episodes
 */
async function getAllEpisodes() {
  return await getEpisodes();
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
  const episodes = episodeCache || fallbackEpisodes;
  return episodes.find(episode => episode.id === id) || null;
}

/**
 * Get episodes by season (sync version using cache)
 * @param {string} season - Season ID
 * @returns {Array} Array of episodes in the season
 */
function getEpisodesBySeasonSync(season) {
  const episodes = episodeCache || fallbackEpisodes;
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
 * Replace episode mentions in text with links (sync version using cache)
 * @param {string} text - Text to process
 * @returns {string} Text with episode names replaced by links
 */
function linkifyEpisodeMentionsSync(text) {
  const episodes = episodeCache || fallbackEpisodes;
  let processedText = text;
  
  for (const episode of episodes) {
    // Create regex to match episode name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${escapeRegex(episode.name)}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${episode.url}" class="episode-link" title="Watch ${episode.name}">${match}</a>`;
    });
  }
  
  return processedText;
}

/**
 * Get all episodes (sync version using cache)
 * @returns {Array} Array of all episodes
 */
function getAllEpisodesSync() {
  return episodeCache || fallbackEpisodes;
}

/**
 * Initialize episode cache
 * @returns {Promise<void>}
 */
async function initializeEpisodeCache() {
  try {
    // Only initialize Firebase if no database instance was provided
    if (!database) {
      initializeFirebase();
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
  episodeCache = null;
  cacheTimestamp = null;
  console.log('Episode cache cleared');
}

// Export functions
module.exports = {
  setDatabaseInstance,
  getEpisodes,
  getEpisodeById,
  getEpisodesBySeason,
  getAllEpisodes,
  generateEpisodeLink,
  linkifyEpisodeMentions,
  initializeEpisodeCache,
  clearEpisodeCache,
  
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