// Lore helper functions for generating lore links and references (places, things, concepts, ideas)
const linkingUtils = require('./linking-utils');
const firebaseUtils = require('./firebase-utils');
const firebaseAdminUtils = require('./firebase-admin-utils');
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
    image: '/images/seasons/season3/episodes/episode5/images/RebuildTheShire-08.webp',
    image_gallery: [
      '/images/seasons/season3/episodes/episode5/images/RebuildTheShire-12.webp',
      '/images/seasons/season4/episodes/episode2/images/TheKingHasFled-15.webp'
    ]
  },
  {
    id: 'ice-castle',
    title: 'Ice Castle',
    name: 'Ice Castle',
    url: '/lore/ice-castle',
    type: 'place',
    description: 'A majestic fortress of eternal ice located in the far northern reaches.',
    image: '/images/episodes/IceBlueGreed-08.webp',
    image_gallery: [
      '/images/episodes/FrozenPeace-16.webp'
    ]
  },
  {
    id: 'wavelength-band',
    title: 'Wavelength (The Band)',
    name: 'Wavelength',
    url: '/lore/wavelength-band',
    type: 'concept',
    description: 'More than just a musical group, Wavelength represents the perfect harmony between family bonds and artistic expression.',
    image: '/images/characters/wavelength/wavelength.webp',
    image_gallery: [
      '/images/characters/wavelength/wavelength.webp'
    ]
  },
  {
    id: 'music-magic',
    title: 'Music Magic',
    name: 'Music Magic',
    url: '/lore/music-magic',
    type: 'concept',
    description: 'The fundamental force that flows through the Wavelength universe.',
    image: '/images/episodes/TheSongOfMourning-19.webp',
    image_gallery: [
      '/images/episodes/TheSongOfMourning-19.webp'
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
    image: '/images/seasons/season4/episodes/episode4/images/IceBlueGreed-18.webp',
    image_gallery: [
      '/images/seasons/season4/episodes/episode4/images/IceBlueGreed-18.webp',
      '/images/seasons/season4/episodes/episode2/images/TheKingHasFled-23.webp',
      '/images/seasons/season4/episodes/episode3/images/GoblinsRule-25.webp'
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

    const loreData = await firebaseAdminUtils.fetchDataAsAdmin('lore');
    
    if (loreData) {
      // Handle new structure where each lore item is stored by ID
      let allLore = [];
      
      for (const loreId in loreData) {
        const loreItem = loreData[loreId];
        
        // Transform database lore to helper format
        if (loreItem && loreItem.id && loreItem.title) {
          const transformedLore = {
            id: loreItem.id,
            title: loreItem.title,
            name: loreItem.title, // Use title as name for consistency
            keywords: loreItem.keywords || [], // Include keywords for enhanced linking
            url: `/lore/${loreItem.id}`,
            description: loreItem.description,
            image: loreItem.image,
            image_gallery: loreItem.image_gallery,
            type: loreItem.type,
            visible: loreItem.visible, // Legacy field (keep for backwards compatibility)
            hidden: loreItem.hidden // New visibility field
          };

          // Add enhanced fields for GitHub Issue #55 CTA support
          if (loreItem.enhanced_title) {
            transformedLore.enhanced_title = loreItem.enhanced_title;
            
            // Parse combined enhanced_title into separate fields for template compatibility
            const enhancedText = loreItem.enhanced_title;
            
            if (enhancedText.includes('TAGLINE:')) {
              const taglinePart = enhancedText.split('TAGLINE:')[1];
              if (taglinePart) {
                transformedLore.tagline = taglinePart.split('DESCRIPTION:')[0].trim();
              }
            }
            
            if (enhancedText.includes('DESCRIPTION:')) {
              const descPart = enhancedText.split('DESCRIPTION:')[1];
              if (descPart) {
                transformedLore.enhanced_description = descPart.split('CTA_HOOK:')[0].trim();
              }
            }
            
            if (enhancedText.includes('CTA_HOOK:')) {
              const ctaPart = enhancedText.split('CTA_HOOK:')[1];
              if (ctaPart) {
                transformedLore.cta_hook = ctaPart.split('POWER_STATEMENT:')[0].trim();
              }
            }
            
            if (enhancedText.includes('POWER_STATEMENT:')) {
              const powerPart = enhancedText.split('POWER_STATEMENT:')[1];
              if (powerPart) {
                transformedLore.power_statement = powerPart.trim();
              }
            }
          }

          // Also support individual enhanced fields if they exist
          if (loreItem.tagline) transformedLore.tagline = loreItem.tagline;
          if (loreItem.enhanced_description) transformedLore.enhanced_description = loreItem.enhanced_description;
          if (loreItem.cta_hook) transformedLore.cta_hook = loreItem.cta_hook;
          if (loreItem.power_statement) transformedLore.power_statement = loreItem.power_statement;

          allLore.push(transformedLore);
        }
      }
      
      console.log(`📚 Loaded ${allLore.length} lore items from Firebase`);
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
 * Get all lore with optional visibility filtering
 * @param {boolean} showHidden - Whether to include hidden lore (for content creators)
 * @returns {Promise<Array>} Array of lore objects
 */
async function getAllLore(showHidden = false) {
  const allLore = await getLore();
  
  // Filter out hidden lore for public users
  if (!showHidden) {
    return allLore.filter(loreItem => !loreItem.hidden);
  }
  
  return allLore;
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
 * @param {boolean} showHidden - Whether to include hidden lore (for content creators)
 * @returns {array} Array of all lore
 */
function getAllLoreSync(showHidden = false) {
  const allLore = cacheUtils.getSync(loreCache, fallbackLore);
  
  // Filter out hidden lore for public users
  if (!showHidden) {
    return allLore.filter(loreItem => !loreItem.hidden);
  }
  
  return allLore;
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