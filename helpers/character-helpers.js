// Character helper functions for generating character links and references
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
      firebaseApp = initializeApp(firebaseConfig, 'character-helpers');
    }
    database = getDatabase(firebaseApp);
  } catch (error) {
    console.warn('Firebase initialization in character-helpers failed:', error.message);
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

// Cache for characters data
let charactersCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback character data (in case database is unavailable)
const fallbackCharacters = [
  {
    id: 'andrew',
    title: 'Prince Andrew',
    name: 'Prince Andrew',
    url: '/character/andrew'
  },
  {
    id: 'jewel',
    title: 'Jewel',
    name: 'Jewel',
    url: '/character/jewel'
  },
  {
    id: 'alex',
    title: 'Alexandria',
    name: 'Alexandria',
    url: '/character/alex'
  },
  {
    id: 'eloquence',
    title: 'Eloquence',
    name: 'Eloquence',
    url: '/character/eloquence'
  },
  {
    id: 'daphne',
    title: 'Daphne',
    name: 'Daphne',
    url: '/character/daphne'
  },
  {
    id: 'lucky',
    title: 'Lucky',
    name: 'Lucky',
    url: '/character/lucky'
  },
  {
    id: 'yeti',
    title: 'Yeti',
    name: 'Yeti',
    url: '/character/yeti'
  },
  {
    id: 'maurice',
    title: 'Maurice',
    name: 'Maurice',
    url: '/character/maurice'
  }
];

/**
 * Fetch characters from Firebase database
 * @returns {Promise<Array>} Array of character objects
 */
async function fetchCharactersFromDatabase() {
  try {
    if (!database) {
      console.warn('Database not available, using fallback characters');
      return fallbackCharacters;
    }

    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);

    if (snapshot.exists()) {
      const charactersData = snapshot.val();
      
      // Extract all characters from all categories
      let allCharacters = [];
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          // Transform database characters to helper format
          const categoryCharacters = charactersData[category].map(char => ({
            id: char.id,
            title: char.title,
            name: char.title, // Use title as name for consistency
            url: `/character/${char.id}`,
            description: char.description,
            image: char.image
          }));
          allCharacters = allCharacters.concat(categoryCharacters);
        }
      }
      
      return allCharacters;
    } else {
      console.warn('No characters found in database, using fallback');
      return fallbackCharacters;
    }
  } catch (error) {
    console.error('Error fetching characters from database:', error);
    return fallbackCharacters;
  }
}

/**
 * Get characters with caching
 * @returns {Promise<Array>} Array of character objects
 */
async function getCharacters() {
  const now = Date.now();
  
  // Check if cache is valid
  if (charactersCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return charactersCache;
  }
  
  // Fetch fresh data
  charactersCache = await fetchCharactersFromDatabase();
  cacheTimestamp = now;
  
  return charactersCache;
}

/**
 * Get character by ID
 * @param {string} id - Character ID
 * @returns {Promise<object|null>} Character object or null if not found
 */
async function getCharacterById(id) {
  const characters = await getCharacters();
  return characters.find(character => character.id === id) || null;
}

/**
 * Generate character link HTML
 * @param {string} id - Character ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {Promise<string>} HTML link string
 */
async function generateCharacterLink(id, customText = null) {
  const character = await getCharacterById(id);
  if (!character) {
    return customText || id; // Return plain text if character not found
  }
  
  const linkText = customText || character.name;
  return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${linkText}</a>`;
}

/**
 * Replace character mentions in text with links
 * @param {string} text - Text to process
 * @returns {Promise<string>} Text with character names replaced by links
 */
async function linkifyCharacterMentions(text) {
  const characters = await getCharacters();
  let processedText = text;
  
  for (const character of characters) {
    // Create regex to match character name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${match}</a>`;
    });
  }
  
  return processedText;
}

/**
 * Get all characters list
 * @returns {Promise<Array>} Array of all characters
 */
async function getAllCharacters() {
  return await getCharacters();
}

/**
 * Synchronous versions for compatibility (uses cache or fallback)
 */

/**
 * Get character by ID (sync version using cache)
 * @param {string} id - Character ID
 * @returns {object|null} Character object or null if not found
 */
function getCharacterByIdSync(id) {
  const characters = charactersCache || fallbackCharacters;
  return characters.find(character => character.id === id) || null;
}

/**
 * Generate character link HTML (sync version)
 * @param {string} id - Character ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {string} HTML link string
 */
function generateCharacterLinkSync(id, customText = null) {
  const character = getCharacterByIdSync(id);
  if (!character) {
    return customText || id; // Return plain text if character not found
  }
  
  const linkText = customText || character.name;
  return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${linkText}</a>`;
}

/**
 * Replace character mentions in text with links (sync version)
 * @param {string} text - Text to process
 * @returns {string} Text with character names replaced by links
 */
function linkifyCharacterMentionsSync(text) {
  const characters = charactersCache || fallbackCharacters;
  let processedText = text;
  
  characters.forEach(character => {
    // Create regex to match character name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${match}</a>`;
    });
  });
  
  return processedText;
}

/**
 * Get all characters list (sync version)
 * @returns {array} Array of all characters
 */
function getAllCharactersSync() {
  return charactersCache || fallbackCharacters;
}

/**
 * Initialize character cache
 * @returns {Promise<void>}
 */
async function initializeCharacterCache() {
  try {
    // Only initialize Firebase if no database instance was provided
    if (!database) {
      initializeFirebase();
    }
    
    // Then populate the cache
    await getCharacters(); // This will populate the cache
    console.log('Character cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize character cache:', error);
  }
}

/**
 * Clear character cache (useful for testing or forced refresh)
 */
function clearCharacterCache() {
  charactersCache = null;
  cacheTimestamp = null;
}

module.exports = {
  // Async versions (recommended for new code)
  getCharacterById,
  generateCharacterLink,
  linkifyCharacterMentions,
  getAllCharacters,
  
  // Sync versions (for backward compatibility)
  getCharacterByIdSync,
  generateCharacterLinkSync,
  linkifyCharacterMentionsSync,
  getAllCharactersSync,
  
  // Cache management
  initializeCharacterCache,
  clearCharacterCache,
  setDatabaseInstance,
  
  // Backward compatibility aliases
  characters: getAllCharactersSync(), // This will be empty initially
  generateCharacterLink: generateCharacterLinkSync,
  linkifyCharacterMentions: linkifyCharacterMentionsSync
};