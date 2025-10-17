// Lore helper functions for generating lore links and references (places, things, concepts, ideas)
const linkingUtils = require('./linking-utils');
const firebaseUtils = require('./firebase-utils');
const cacheUtils = require('./cache-utils');

// Create cache manager for lore
const loreCache = cacheUtils.createCacheManager('Lore');

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
  },
  {
    id: 'goblin-king',
    title: 'Goblin King',
    name: 'Goblin King',
    url: '/lore/goblin-king',
    type: 'villain',
    keywords: ['king', 'goblin ruler', 'psychopath', 'villain'],
    description: "The Goblin King is a Psychopath that leads a Misery of Goblins to invade the Shire and begin the Battle of the Shire. He lives by one Rule: Goblin's Rule, which means that the only rule you ever need to know about when dealing with the Goblin King, is that he will Rule all over you. He is tricked by Lucky and the fact that Goblin's Greed is insatiable, into leaving his lair to pursue an Ice Blue Diamond, which Lucky uses to lure him out of hiding during the Battle for the Shire.",
    image: 'https://df5sj8f594cdx.cloudfront.net/images/seasons/season4/episodes/episode4/images/IceBlueGreed-18.png',
    image_gallery: [
      'https://df5sj8f594cdx.cloudfront.net/images/seasons/season4/episodes/episode4/images/IceBlueGreed-18.png',
      'https://df5sj8f594cdx.cloudfront.net/images/seasons/season4/episodes/episode2/images/TheKingHasFled-23.png',
      'https://df5sj8f594cdx.cloudfront.net/images/seasons/season4/episodes/episode3/images/GoblinsRule-25.png'
    ]
  }
];

/**
 * Fetch lore from Firebase database
 * @returns {Promise<Array>} Array of lore objects
 */
async function fetchLoreFromDatabase() {
  try {
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('lore-helpers');
    }

    const loreData = await firebaseUtils.fetchFromFirebase('lore');
    
    if (loreData) {
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
            keywords: loreItem.keywords || [], // Include keywords for enhanced linking
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
  return await cacheUtils.getWithCache(
    loreCache,
    fetchLoreFromDatabase,
    fallbackLore
  );
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
  return linkingUtils.linkifyItemMentions(text, lore, 'lore');
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
  const lore = cacheUtils.getSync(loreCache, fallbackLore);
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
  const lore = cacheUtils.getSync(loreCache, fallbackLore);
  return linkingUtils.linkifyItemMentions(text, lore, 'lore');
}

/**
 * Get all lore list (sync version)
 * @returns {array} Array of all lore
 */
function getAllLoreSync() {
  return cacheUtils.getSync(loreCache, fallbackLore);
}

/**
 * Get lore by type (sync version)
 * @param {string} type - Type of lore
 * @returns {array} Array of lore matching the type
 */
function getLoreByTypeSync(type) {
  const lore = cacheUtils.getSync(loreCache, fallbackLore);
  return lore.filter(loreItem => loreItem.type === type);
}

/**
 * Initialize lore cache
 * @returns {Promise<void>}
 */
async function initializeLoreCache() {
  return await cacheUtils.initializeCache(
    loreCache,
    async () => await getLore(),
    'Lore'
  );
}

/**
 * Clear lore cache (useful for testing or forced refresh)
 */
function clearLoreCache() {
  loreCache.clear();
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
  setDatabaseInstance: firebaseUtils.setDatabaseInstance,
  
  // Backward compatibility aliases
  lore: getAllLoreSync(), // This will be empty initially
  generateLoreLink: generateLoreLinkSync,
  linkifyLoreMentions: linkifyLoreMentionsSync
};