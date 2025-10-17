// Character helper functions for generating character links and references
const linkingUtils = require('./linking-utils');
const firebaseUtils = require('./firebase-utils');
const cacheUtils = require('./cache-utils');

// Create cache manager for characters
const charactersCache = cacheUtils.createCacheManager('Characters');

// Fallback character data (in case database is unavailable)
const fallbackCharacters = [
  {
    id: 'andrew',
    title: 'Prince Andrew',
    name: 'Prince Andrew',
    keywords: ['The Prince', 'The Leader', 'Andrew', 'Band Leader', 'Father', 'Husband'],
    url: '/character/andrew'
  },
  {
    id: 'jewel',
    title: 'Jewel',
    name: 'Jewel',
    keywords: ['Princess Jewel', 'Half Elf', 'Musical Talent', 'Mother', 'Wife', 'The Princess'],
    url: '/character/jewel'
  },
  {
    id: 'alex',
    title: 'Alexandria',
    name: 'Alexandria',
    keywords: ['Alex', 'The Daughter', 'Quarter Elf', 'Music Teacher', 'Young Teacher'],
    url: '/character/alex'
  },
  {
    id: 'eloquence',
    title: 'Eloquence',
    name: 'Eloquence',
    keywords: ['The Son', 'Bass Player', 'Quarter Elf', 'Rhythm Expert', 'Best Friend'],
    url: '/character/eloquence'
  },
  {
    id: 'daphne',
    title: 'Daphne',
    name: 'Daphne',
    keywords: ['The Prodigy', 'Drummer Girl', 'Orphan', 'New Drummer', 'Choir Master\'s Daughter'],
    url: '/character/daphne'
  },
  {
    id: 'lucky',
    title: 'Lucky',
    name: 'Lucky',
    keywords: ['The Leprechaun', 'Wise Elder', 'Golden Advice', 'Fisher', 'Token of Luck', 'Singing Fisherman'],
    url: '/character/lucky'
  },
  {
    id: 'yeti',
    title: 'Yeti',
    name: 'Yeti',
    keywords: ['Ice Beast', 'The Nurse', 'Clumsy Giant', 'Ice Castle Guardian', 'Ferocious Healer'],
    url: '/character/yeti'
  },
  {
    id: 'maurice',
    title: 'Maurice',
    name: 'Maurice',
    keywords: ['The Merchant', 'Percussion Wizard', 'Magical Maurice', 'The Dwarf', 'Big Brother', 'Fallen Hero'],
    url: '/character/maurice'
  }
];

/**
 * Fetch characters from Firebase database
 * @returns {Promise<Array>} Array of character objects
 */
async function fetchCharactersFromDatabase() {
  try {
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('character-helpers');
    }

    const charactersData = await firebaseUtils.fetchFromFirebase('characters');
    
    if (charactersData) {
      // Extract all characters from all categories
      let allCharacters = [];
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          // Transform database characters to helper format
          const categoryCharacters = charactersData[category].map(char => ({
            id: char.id,
            title: char.title,
            name: char.title, // Use title as name for consistency
            keywords: char.keywords || [], // Include keywords for enhanced linking
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
  return await cacheUtils.getWithCache(
    charactersCache,
    fetchCharactersFromDatabase,
    fallbackCharacters
  );
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
  return linkingUtils.linkifyItemMentions(text, characters, 'character');
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
  const characters = cacheUtils.getSync(charactersCache, fallbackCharacters);
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
  const characters = cacheUtils.getSync(charactersCache, fallbackCharacters);
  return linkingUtils.linkifyItemMentions(text, characters, 'character');
}

/**
 * Get all characters list (sync version)
 * @returns {array} Array of all characters
 */
function getAllCharactersSync() {
  return cacheUtils.getSync(charactersCache, fallbackCharacters);
}

/**
 * Initialize character cache
 * @returns {Promise<void>}
 */
async function initializeCharacterCache() {
  return await cacheUtils.initializeCache(
    charactersCache,
    async () => await getCharacters(),
    'Character'
  );
}

/**
 * Clear character cache (useful for testing or forced refresh)
 */
function clearCharacterCache() {
  charactersCache.clear();
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
  setDatabaseInstance: firebaseUtils.setDatabaseInstance,
  
  // Backward compatibility aliases
  characters: getAllCharactersSync(), // This will be empty initially
  generateCharacterLink: generateCharacterLinkSync,
  linkifyCharacterMentions: linkifyCharacterMentionsSync
};