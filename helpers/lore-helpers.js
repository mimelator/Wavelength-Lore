// Lore helper functions for generating lore links and references (places, things, concepts, ideas)
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
      firebaseApp = initializeApp(firebaseConfig, 'lore-helpers');
    }
    database = getDatabase(firebaseApp);
  } catch (error) {
    console.warn('Firebase initialization in lore-helpers failed:', error.message);
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

// Cache for lore data
let loreCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Fallback lore data (in case database is unavailable)
const fallbackLore = [
  {
    id: 'the-shire',
    title: 'The Shire',
    name: 'The Shire',
    url: '/lore/the-shire',
    type: 'place',
    description: 'A peaceful realm where music flourishes and the natural world sings in harmony.',
    image: 'https://df5sj8f594cdx.cloudfront.net/images/seasons/season3/episodes/episode5/images/RebuildTheShire-08.png',
    image_gallery: [
      'https://df5sj8f594cdx.cloudfront.net/images/seasons/season3/episodes/episode5/images/RebuildTheShire-12.png',
      'https://df5sj8f594cdx.cloudfront.net/images/seasons/season4/episodes/episode2/images/TheKingHasFled-15.png'
    ]
  },
  {
    id: 'ice-castle',
    title: 'Ice Castle',
    name: 'Ice Castle',
    url: '/lore/ice-castle',
    type: 'place',
    description: 'A majestic fortress of eternal ice located in the far northern reaches.',
    image: 'https://df5sj8f594cdx.cloudfront.net/images/episodes/IceBlueGreed-08.png',
    image_gallery: [
      'https://df5sj8f594cdx.cloudfront.net/images/episodes/FrozenPeace-16.png'
    ]
  },
  {
    id: 'wavelength-band',
    title: 'Wavelength (The Band)',
    name: 'Wavelength',
    url: '/lore/wavelength-band',
    type: 'concept',
    description: 'More than just a musical group, Wavelength represents the perfect harmony between family bonds and artistic expression.',
    image: 'https://df5sj8f594cdx.cloudfront.net/images/characters/wavelength/wavelength.png',
    image_gallery: [
      'https://df5sj8f594cdx.cloudfront.net/images/characters/wavelength/wavelength.png'
    ]
  },
  {
    id: 'music-magic',
    title: 'Music Magic',
    name: 'Music Magic',
    url: '/lore/music-magic',
    type: 'concept',
    description: 'The fundamental force that flows through the Wavelength universe.',
    image: 'https://df5sj8f594cdx.cloudfront.net/images/episodes/TheSongOfMourning-19.png',
    image_gallery: [
      'https://df5sj8f594cdx.cloudfront.net/images/episodes/TheSongOfMourning-19.png'
    ]
  }
];

/**
 * Fetch lore from Firebase database
 * @returns {Promise<Array>} Array of lore objects
 */
async function fetchLoreFromDatabase() {
  try {
    if (!database) {
      console.warn('Database not available, using fallback lore');
      return fallbackLore;
    }

    const loreRef = ref(database, 'lore');
    const snapshot = await get(loreRef);

    if (snapshot.exists()) {
      const loreData = snapshot.val();
      
      // Handle new structure where each lore item is stored by ID
      let allLore = [];
      
      for (const loreId in loreData) {
        const loreItem = loreData[loreId];
        
        // Transform database lore to helper format
        if (loreItem && loreItem.id && loreItem.title) {
          allLore.push({
            id: loreItem.id,
            title: loreItem.title,
            name: loreItem.title, // Use title as name for consistency
            url: `/lore/${loreItem.id}`,
            description: loreItem.description,
            image: loreItem.image,
            image_gallery: loreItem.image_gallery,
            type: loreItem.type
          });
        }
      }
      
      console.log(`Loaded ${allLore.length} lore items from Firebase`);
      return allLore;
    } else {
      console.warn('No lore found in database, using fallback');
      return fallbackLore;
    }
  } catch (error) {
    console.error('Error fetching lore from database:', error);
    return fallbackLore;
  }
}

/**
 * Get lore with caching
 * @returns {Promise<Array>} Array of lore objects
 */
async function getLore() {
  const now = Date.now();
  
  // Check if cache is valid
  if (loreCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return loreCache;
  }
  
  // Fetch fresh data
  loreCache = await fetchLoreFromDatabase();
  cacheTimestamp = now;
  
  return loreCache;
}

/**
 * Get lore by ID
 * @param {string} id - Lore ID
 * @returns {Promise<object|null>} Lore object or null if not found
 */
async function getLoreById(id) {
  const lore = await getLore();
  return lore.find(loreItem => loreItem.id === id) || null;
}

/**
 * Generate lore link HTML
 * @param {string} id - Lore ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {Promise<string>} HTML link string
 */
async function generateLoreLink(id, customText = null) {
  const loreItem = await getLoreById(id);
  if (!loreItem) {
    return customText || id; // Return plain text if lore not found
  }
  
  const linkText = customText || loreItem.name;
  return `<a href="${loreItem.url}" class="lore-link" title="Learn about ${loreItem.name}">${linkText}</a>`;
}

/**
 * Replace lore mentions in text with links
 * @param {string} text - Text to process
 * @returns {Promise<string>} Text with lore names replaced by links
 */
async function linkifyLoreMentions(text) {
  const lore = await getLore();
  let processedText = text;
  
  for (const loreItem of lore) {
    // Create regex to match lore name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${loreItem.name}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${loreItem.url}" class="lore-link" title="Learn about ${loreItem.name}">${match}</a>`;
    });
  }
  
  return processedText;
}

/**
 * Get all lore list
 * @returns {Promise<Array>} Array of all lore
 */
async function getAllLore() {
  return await getLore();
}

/**
 * Get lore by type/category
 * @param {string} type - Type of lore (places, things, concepts, ideas)
 * @returns {Promise<Array>} Array of lore matching the type
 */
async function getLoreByType(type) {
  const lore = await getLore();
  return lore.filter(loreItem => loreItem.type === type);
}

/**
 * Synchronous versions for compatibility (uses cache or fallback)
 */

/**
 * Get lore by ID (sync version using cache)
 * @param {string} id - Lore ID
 * @returns {object|null} Lore object or null if not found
 */
function getLoreByIdSync(id) {
  const lore = loreCache || fallbackLore;
  return lore.find(loreItem => loreItem.id === id) || null;
}

/**
 * Generate lore link HTML (sync version)
 * @param {string} id - Lore ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {string} HTML link string
 */
function generateLoreLinkSync(id, customText = null) {
  const loreItem = getLoreByIdSync(id);
  if (!loreItem) {
    return customText || id; // Return plain text if lore not found
  }
  
  const linkText = customText || loreItem.name;
  return `<a href="${loreItem.url}" class="lore-link" title="Learn about ${loreItem.name}">${linkText}</a>`;
}

/**
 * Replace lore mentions in text with links (sync version)
 * @param {string} text - Text to process
 * @returns {string} Text with lore names replaced by links
 */
function linkifyLoreMentionsSync(text) {
  const lore = loreCache || fallbackLore;
  let processedText = text;
  
  lore.forEach(loreItem => {
    // Create regex to match lore name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${loreItem.name}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return `<a href="${loreItem.url}" class="lore-link" title="Learn about ${loreItem.name}">${match}</a>`;
    });
  });
  
  return processedText;
}

/**
 * Get all lore list (sync version)
 * @returns {array} Array of all lore
 */
function getAllLoreSync() {
  return loreCache || fallbackLore;
}

/**
 * Get lore by type (sync version)
 * @param {string} type - Type of lore
 * @returns {array} Array of lore matching the type
 */
function getLoreByTypeSync(type) {
  const lore = loreCache || fallbackLore;
  return lore.filter(loreItem => loreItem.type === type);
}

/**
 * Initialize lore cache
 * @returns {Promise<void>}
 */
async function initializeLoreCache() {
  try {
    // Only initialize Firebase if no database instance was provided
    if (!database) {
      initializeFirebase();
    }
    
    // Then populate the cache
    await getLore(); // This will populate the cache
    console.log('Lore cache initialized successfully');
  } catch (error) {
    console.error('Failed to initialize lore cache:', error);
  }
}

/**
 * Clear lore cache (useful for testing or forced refresh)
 */
function clearLoreCache() {
  loreCache = null;
  cacheTimestamp = null;
}

module.exports = {
  // Async versions (recommended for new code)
  getLoreById,
  generateLoreLink,
  linkifyLoreMentions,
  getAllLore,
  getLoreByType,
  
  // Sync versions (for backward compatibility)
  getLoreByIdSync,
  generateLoreLinkSync,
  linkifyLoreMentionsSync,
  getAllLoreSync,
  getLoreByTypeSync,
  
  // Cache management
  initializeLoreCache,
  clearLoreCache,
  setDatabaseInstance,
  
  // Backward compatibility aliases
  lore: getAllLoreSync(), // This will be empty initially
  generateLoreLink: generateLoreLinkSync,
  linkifyLoreMentions: linkifyLoreMentionsSync
};