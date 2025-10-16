// Character helper functions for generating character links and references

/**
 * Character list with their IDs, names, and URLs
 */
const characters = [
  {
    id: 'andrew',
    name: 'Prince Andrew',
    url: '/character/andrew'
  },
  {
    id: 'jewel',
    name: 'Jewel',
    url: '/character/jewel'
  },
  {
    id: 'alex',
    name: 'Alexandria',
    url: '/character/alex'
  },
  {
    id: 'eloquence',
    name: 'Eloquence',
    url: '/character/eloquence'
  },
  {
    id: 'daphne',
    name: 'Daphne',
    url: '/character/daphne'
  },
  {
    id: 'lucky',
    name: 'Lucky',
    url: '/character/lucky'
  },
  {
    id: 'yeti',
    name: 'Yeti',
    url: '/character/yeti'
  },
  {
    id: 'maurice',
    name: 'Maurice',
    url: '/character/maurice'
  }
];

/**
 * Get character by ID
 * @param {string} id - Character ID
 * @returns {object|null} Character object or null if not found
 */
function getCharacterById(id) {
  return characters.find(character => character.id === id) || null;
}

/**
 * Generate character link HTML
 * @param {string} id - Character ID
 * @param {string} customText - Custom text for the link (optional)
 * @returns {string} HTML link string
 */
function generateCharacterLink(id, customText = null) {
  const character = getCharacterById(id);
  if (!character) {
    return customText || id; // Return plain text if character not found
  }
  
  const linkText = customText || character.name;
  return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${linkText}</a>`;
}

/**
 * Replace character mentions in text with links
 * @param {string} text - Text to process
 * @returns {string} Text with character names replaced by links
 */
function linkifyCharacterMentions(text) {
  let processedText = text;
  
  characters.forEach(character => {
    // Create regex to match character name (case insensitive, word boundaries)
    const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      return generateCharacterLink(character.id, match);
    });
  });
  
  return processedText;
}

/**
 * Get all characters list
 * @returns {array} Array of all characters
 */
function getAllCharacters() {
  return characters;
}

module.exports = {
  characters,
  getCharacterById,
  generateCharacterLink,
  linkifyCharacterMentions,
  getAllCharacters
};