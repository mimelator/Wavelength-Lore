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
  
  // Create a map of terms to their matching character items
  const termConflicts = new Map();
  
  for (const character of characters) {
    // Build array of all searchable terms (title + keywords)
    const searchTerms = [character.name];
    if (character.keywords && Array.isArray(character.keywords)) {
      searchTerms.push(...character.keywords);
    }
    
    // Add each term to the conflicts map
    for (const term of searchTerms) {
      if (!term || term.trim() === '') continue;
      
      const lowerTerm = term.toLowerCase();
      if (!termConflicts.has(lowerTerm)) {
        termConflicts.set(lowerTerm, []);
      }
      termConflicts.get(lowerTerm).push({
        item: character,
        matchText: term
      });
    }
  }
  
  // Sort terms by length (longest first) to avoid partial replacements
  const sortedTerms = Array.from(termConflicts.keys()).sort((a, b) => b.length - a.length);
  
  // Process each term, being extra careful not to link inside existing HTML or already-linked text
  for (const term of sortedTerms) {
    const matches = termConflicts.get(term);
    if (!matches || matches.length === 0) continue;
    
    // Use the first match for linking (conflicts should be handled by disambiguation system)
    const match = matches[0];
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Track positions of existing links to avoid overlapping
    const existingLinks = [];
    let linkMatch;
    const linkRegex = /<a\s[^>]*>.*?<\/a>/gi;
    while ((linkMatch = linkRegex.exec(processedText)) !== null) {
      existingLinks.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length
      });
    }
    
    // Find all matches of our term
    let termMatches = [];
    let termMatch;
    const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
    while ((termMatch = termRegex.exec(processedText)) !== null) {
      // Check if this match overlaps with any existing link
      const matchStart = termMatch.index;
      const matchEnd = termMatch.index + termMatch[0].length;
      
      let isInsideLink = false;
      for (const link of existingLinks) {
        if (matchStart >= link.start && matchEnd <= link.end) {
          isInsideLink = true;
          break;
        }
      }
      
      if (!isInsideLink) {
        termMatches.push({
          match: termMatch[0],
          start: matchStart,
          end: matchEnd
        });
      }
    }
    
    // Replace from right to left to maintain correct positions
    termMatches.reverse().forEach(termMatchInfo => {
      const beforeMatch = processedText.substring(0, termMatchInfo.start);
      const afterMatch = processedText.substring(termMatchInfo.end);
      
      // Create the link
      const linkHtml = `<a href="${match.item.url}" class="character-link" title="View ${match.item.name}'s character page">${termMatchInfo.match}</a>`;
      
      processedText = beforeMatch + linkHtml + afterMatch;
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
  
  // Create a comprehensive list of all terms with their associated character items
  const termMap = new Map();
  
  characters.forEach(character => {
    // Build array of all searchable terms (title + keywords)
    const searchTerms = [character.name];
    if (character.keywords && Array.isArray(character.keywords)) {
      searchTerms.push(...character.keywords);
    }
    
    // Add each term to the map
    searchTerms.forEach(term => {
      if (!term || term.trim() === '') return;
      
      const lowerTerm = term.toLowerCase();
      if (!termMap.has(lowerTerm)) {
        termMap.set(lowerTerm, []);
      }
      termMap.get(lowerTerm).push({
        item: character,
        matchText: term
      });
    });
  });
  
  // Sort terms by length (longest first) to avoid partial replacements
  const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
  
  // Process each term, being extra careful not to link inside existing HTML or already-linked text
  for (const term of sortedTerms) {
    const matches = termMap.get(term);
    if (!matches || matches.length === 0) continue;
    
    // Use the first match for linking
    const match = matches[0];
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Track positions of existing links to avoid overlapping
    const existingLinks = [];
    let linkMatch;
    const linkRegex = /<a\s[^>]*>.*?<\/a>/gi;
    while ((linkMatch = linkRegex.exec(processedText)) !== null) {
      existingLinks.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length
      });
    }
    
    // Find all matches of our term
    let termMatches = [];
    let termMatch;
    const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
    while ((termMatch = termRegex.exec(processedText)) !== null) {
      // Check if this match overlaps with any existing link
      const matchStart = termMatch.index;
      const matchEnd = termMatch.index + termMatch[0].length;
      
      let isInsideLink = false;
      for (const link of existingLinks) {
        if (matchStart >= link.start && matchEnd <= link.end) {
          isInsideLink = true;
          break;
        }
      }
      
      if (!isInsideLink) {
        termMatches.push({
          match: termMatch[0],
          start: matchStart,
          end: matchEnd
        });
      }
    }
    
    // Replace from right to left to maintain correct positions
    termMatches.reverse().forEach(termMatchInfo => {
      const beforeMatch = processedText.substring(0, termMatchInfo.start);
      const afterMatch = processedText.substring(termMatchInfo.end);
      
      // Create the link
      const linkHtml = `<a href="${match.item.url}" class="character-link" title="View ${match.item.name}'s character page">${termMatchInfo.match}</a>`;
      
      processedText = beforeMatch + linkHtml + afterMatch;
    });
  }
  
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