// Prompt helper functions for managing AI generation prompts
const linkingUtils = require('./linking-utils');
const firebaseUtils = require('./firebase-utils');
const cacheUtils = require('./cache-utils');

// Create cache manager for prompts
const promptsCache = cacheUtils.createCacheManager('Prompts');

// Fallback prompt data (in case database is unavailable)
const fallbackPrompts = [
  {
    id: 'andrew-golden-hour',
    title: 'Andrew at Golden Hour',
    name: 'Andrew at Golden Hour',
    keywords: ['andrew', 'shire', 'golden hour', 'performance', 'half-elf'],
    url: '/prompt/andrew-golden-hour',
    content: 'A hyper-detailed, photorealistic spring forest at golden hour...',
    linkedCharacters: ['andrew'],
    linkedEpisodes: [],
    linkedLore: ['the-shire'],
    category: 'character',
    tags: ['performance', 'magical'],
    version: 1,
    isActive: true
  }
];

/**
 * Fetch prompts from Firebase database
 * @returns {Promise<Array>} Array of prompt objects
 */
async function fetchPromptsFromDatabase() {
  try {
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('prompt-helpers');
    }

    const promptsData = await firebaseUtils.fetchFromFirebase('prompts');

    if (promptsData) {
      // Transform database prompts to helper format
      let allPrompts = [];

      for (const promptId in promptsData) {
        const promptItem = promptsData[promptId];

        // Transform database prompt to helper format
        if (promptItem && promptItem.id && promptItem.title) {
          allPrompts.push({
            id: promptItem.id,
            title: promptItem.title,
            name: promptItem.title, // Use title as name for consistency
            keywords: promptItem.keywords || [],
            url: `/prompt/${promptItem.id}`,
            content: promptItem.content || '',
            linkedCharacters: promptItem.linkedCharacters || [],
            linkedEpisodes: promptItem.linkedEpisodes || [],
            linkedLore: promptItem.linkedLore || [],
            category: promptItem.category || 'general',
            tags: promptItem.tags || [],
            version: promptItem.version || 1,
            isActive: promptItem.isActive !== false, // Default to true
            createdAt: promptItem.createdAt,
            updatedAt: promptItem.updatedAt
          });
        }
      }

      console.log(`📝 Loaded ${allPrompts.length} prompts from Firebase`);
      return allPrompts;
    } else {
      console.warn('No prompts found in database, using fallback');
      return fallbackPrompts;
    }
  } catch (error) {
    console.error('Error fetching prompts from database:', error);
    return fallbackPrompts;
  }
}

/**
 * Get prompts with caching
 * @returns {Promise<Array>} Array of prompt objects
 */
async function getPrompts() {
  return await cacheUtils.getWithCache(
    promptsCache,
    fetchPromptsFromDatabase,
    fallbackPrompts
  );
}

/**
 * Get prompt by ID
 * @param {string} id - Prompt ID
 * @returns {Promise<object|null>} Prompt object or null if not found
 */
async function getPromptById(id) {
  const prompts = await getPrompts();
  return prompts.find(prompt => prompt.id === id && prompt.isActive) || null;
}

/**
 * Get prompts by character ID
 * @param {string} characterId - Character ID
 * @returns {Promise<Array>} Array of prompts linked to the character
 */
async function getPromptsByCharacter(characterId) {
  const prompts = await getPrompts();
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedCharacters &&
    prompt.linkedCharacters.includes(characterId)
  );
}

/**
 * Get prompts by episode ID
 * @param {string} episodeId - Episode ID
 * @returns {Promise<Array>} Array of prompts linked to the episode
 */
async function getPromptsByEpisode(episodeId) {
  const prompts = await getPrompts();
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedEpisodes &&
    prompt.linkedEpisodes.includes(episodeId)
  );
}

/**
 * Get prompts by lore ID
 * @param {string} loreId - Lore ID
 * @returns {Promise<Array>} Array of prompts linked to the lore item
 */
async function getPromptsByLore(loreId) {
  const prompts = await getPrompts();
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedLore &&
    prompt.linkedLore.includes(loreId)
  );
}

/**
 * Get prompts by category
 * @param {string} category - Category (character, location, scene, villain, general)
 * @returns {Promise<Array>} Array of prompts matching the category
 */
async function getPromptsByCategory(category) {
  const prompts = await getPrompts();
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.category === category
  );
}

/**
 * Search prompts by keywords or content
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching prompts
 */
async function searchPrompts(query) {
  const prompts = await getPrompts();
  const searchTerm = query.toLowerCase();

  return prompts.filter(prompt => {
    if (!prompt.isActive) return false;

    // Search in title
    if (prompt.title && prompt.title.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in keywords
    if (prompt.keywords && prompt.keywords.some(keyword =>
      keyword.toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    // Search in tags
    if (prompt.tags && prompt.tags.some(tag =>
      tag.toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    // Search in content
    if (prompt.content && prompt.content.toLowerCase().includes(searchTerm)) {
      return true;
    }

    return false;
  });
}

/**
 * Get prompts by tag
 * @param {string} tag - Tag to filter by
 * @returns {Promise<Array>} Array of prompts with the specified tag
 */
async function getPromptsByTag(tag) {
  const prompts = await getPrompts();
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.tags &&
    prompt.tags.includes(tag)
  );
}

/**
 * Get all active prompts
 * @returns {Promise<Array>} Array of all active prompts
 */
async function getAllPrompts() {
  const prompts = await getPrompts();
  return prompts.filter(prompt => prompt.isActive);
}

/**
 * Get all unique categories
 * @returns {Promise<Array>} Array of unique category names
 */
async function getPromptCategories() {
  const prompts = await getPrompts();
  const categories = new Set();

  prompts.forEach(prompt => {
    if (prompt.isActive && prompt.category) {
      categories.add(prompt.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 * @returns {Promise<Array>} Array of unique tag names
 */
async function getPromptTags() {
  const prompts = await getPrompts();
  const tags = new Set();

  prompts.forEach(prompt => {
    if (prompt.isActive && prompt.tags) {
      prompt.tags.forEach(tag => tags.add(tag));
    }
  });

  return Array.from(tags).sort();
}

/**
 * Generate prompt link HTML
 * @param {string} id - Prompt ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {Promise<string>} HTML link string
 */
async function generatePromptLink(id, customText = null) {
  const prompt = await getPromptById(id);
  if (!prompt) {
    return customText || id; // Return plain text if prompt not found
  }

  const linkText = customText || prompt.name;
  return `<a href="${prompt.url}" class="prompt-link" title="View ${prompt.name}">${linkText}</a>`;
}

/**
 * Synchronous versions for compatibility (uses cache or fallback)
 */

/**
 * Get prompt by ID (sync version using cache)
 * @param {string} id - Prompt ID
 * @returns {object|null} Prompt object or null if not found
 */
function getPromptByIdSync(id) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.find(prompt => prompt.id === id && prompt.isActive) || null;
}

/**
 * Get prompts by character (sync version)
 * @param {string} characterId - Character ID
 * @returns {Array} Array of prompts linked to the character
 */
function getPromptsByCharacterSync(characterId) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedCharacters &&
    prompt.linkedCharacters.includes(characterId)
  );
}

/**
 * Get prompts by episode (sync version)
 * @param {string} episodeId - Episode ID
 * @returns {Array} Array of prompts linked to the episode
 */
function getPromptsByEpisodeSync(episodeId) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedEpisodes &&
    prompt.linkedEpisodes.includes(episodeId)
  );
}

/**
 * Get prompts by lore (sync version)
 * @param {string} loreId - Lore ID
 * @returns {Array} Array of prompts linked to the lore item
 */
function getPromptsByLoreSync(loreId) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.linkedLore &&
    prompt.linkedLore.includes(loreId)
  );
}

/**
 * Get prompts by category (sync version)
 * @param {string} category - Category name
 * @returns {Array} Array of prompts matching the category
 */
function getPromptsByCategorySync(category) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.category === category
  );
}

/**
 * Search prompts (sync version)
 * @param {string} query - Search query
 * @returns {Array} Array of matching prompts
 */
function searchPromptsSync(query) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  const searchTerm = query.toLowerCase();

  return prompts.filter(prompt => {
    if (!prompt.isActive) return false;

    // Search in title
    if (prompt.title && prompt.title.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in keywords
    if (prompt.keywords && prompt.keywords.some(keyword =>
      keyword.toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    // Search in tags
    if (prompt.tags && prompt.tags.some(tag =>
      tag.toLowerCase().includes(searchTerm)
    )) {
      return true;
    }

    // Search in content
    if (prompt.content && prompt.content.toLowerCase().includes(searchTerm)) {
      return true;
    }

    return false;
  });
}

/**
 * Get prompts by tag (sync version)
 * @param {string} tag - Tag to filter by
 * @returns {Array} Array of prompts with the specified tag
 */
function getPromptsByTagSync(tag) {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt =>
    prompt.isActive &&
    prompt.tags &&
    prompt.tags.includes(tag)
  );
}

/**
 * Get all prompts (sync version)
 * @returns {Array} Array of all active prompts
 */
function getAllPromptsSync() {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  return prompts.filter(prompt => prompt.isActive);
}

/**
 * Get prompt categories (sync version)
 * @returns {Array} Array of unique category names
 */
function getPromptCategoriesSync() {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  const categories = new Set();

  prompts.forEach(prompt => {
    if (prompt.isActive && prompt.category) {
      categories.add(prompt.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get prompt tags (sync version)
 * @returns {Array} Array of unique tag names
 */
function getPromptTagsSync() {
  const prompts = cacheUtils.getSync(promptsCache, fallbackPrompts);
  const tags = new Set();

  prompts.forEach(prompt => {
    if (prompt.isActive && prompt.tags) {
      prompt.tags.forEach(tag => tags.add(tag));
    }
  });

  return Array.from(tags).sort();
}

/**
 * Generate prompt link HTML (sync version)
 * @param {string} id - Prompt ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {string} HTML link string
 */
function generatePromptLinkSync(id, customText = null) {
  const prompt = getPromptByIdSync(id);
  if (!prompt) {
    return customText || id; // Return plain text if prompt not found
  }

  const linkText = customText || prompt.name;
  return `<a href="${prompt.url}" class="prompt-link" title="View ${prompt.name}">${linkText}</a>`;
}

/**
 * Initialize prompt cache
 * @returns {Promise<void>}
 */
async function initializePromptCache() {
  return await cacheUtils.initializeCache(
    promptsCache,
    async () => await getPrompts(),
    'Prompt'
  );
}

/**
 * Clear prompt cache (useful for testing or forced refresh)
 */
function clearPromptCache() {
  promptsCache.clear();
}

module.exports = {
  // Async versions (recommended for new code)
  getPromptById,
  getPromptsByCharacter,
  getPromptsByEpisode,
  getPromptsByLore,
  getPromptsByCategory,
  getPromptsByTag,
  searchPrompts,
  getAllPrompts,
  getPromptCategories,
  getPromptTags,
  generatePromptLink,

  // Sync versions (for backward compatibility and EJS templates)
  getPromptByIdSync,
  getPromptsByCharacterSync,
  getPromptsByEpisodeSync,
  getPromptsByLoreSync,
  getPromptsByCategorySync,
  getPromptsByTagSync,
  searchPromptsSync,
  getAllPromptsSync,
  getPromptCategoriesSync,
  getPromptTagsSync,
  generatePromptLinkSync,

  // Cache management
  initializePromptCache,
  clearPromptCache,
  setDatabaseInstance: firebaseUtils.setDatabaseInstance,

  // Template helper aliases
  promptLink: generatePromptLinkSync
};
