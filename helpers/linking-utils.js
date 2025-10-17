/**
 * Shared utility functions for processing items with keywords and creating links
 * Used by character-helpers, lore-helpers, and potentially episode-helpers
 */

/**
 * Extract all searchable terms from an item (name + keywords)
 * @param {object} item - Item with name and optional keywords array
 * @returns {string[]} Array of searchable terms
 */
function extractSearchTerms(item) {
  const searchTerms = [item.name];
  if (item.keywords && Array.isArray(item.keywords)) {
    searchTerms.push(...item.keywords);
  }
  return searchTerms;
}

/**
 * Build a term map for conflict detection and linking
 * @param {Array} items - Array of items to process
 * @returns {Map} Map of lowercase terms to their matching items
 */
function buildTermMap(items) {
  const termMap = new Map();
  
  for (const item of items) {
    const searchTerms = extractSearchTerms(item);
    
    // Add each term to the map
    for (const term of searchTerms) {
      if (!term || term.trim() === '') continue;
      
      const lowerTerm = term.toLowerCase();
      if (!termMap.has(lowerTerm)) {
        termMap.set(lowerTerm, []);
      }
      termMap.get(lowerTerm).push({
        item: item,
        matchText: term
      });
    }
  }
  
  return termMap;
}

/**
 * Find existing links in text to avoid overlapping replacements
 * @param {string} text - Text to scan for existing links
 * @returns {Array} Array of {start, end} positions of existing links
 */
function findExistingLinks(text) {
  const existingLinks = [];
  let linkMatch;
  const linkRegex = /<a\s[^>]*>.*?<\/a>/gi;
  
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    existingLinks.push({
      start: linkMatch.index,
      end: linkMatch.index + linkMatch[0].length
    });
  }
  
  return existingLinks;
}

/**
 * Find all matches of a term in text, excluding those inside existing links
 * @param {string} text - Text to search in
 * @param {string} term - Term to search for
 * @param {Array} existingLinks - Array of existing link positions
 * @returns {Array} Array of {match, start, end} objects for valid matches
 */
function findTermMatches(text, term, existingLinks) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termMatches = [];
  let termMatch;
  const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
  
  while ((termMatch = termRegex.exec(text)) !== null) {
    const matchStart = termMatch.index;
    const matchEnd = termMatch.index + termMatch[0].length;
    
    // Check if this match overlaps with any existing link
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
  
  return termMatches;
}

/**
 * Create a link with the appropriate class and title based on item type
 * @param {object} itemMatch - Object with item and matchText
 * @param {string} matchText - The actual text that was matched
 * @param {string} linkType - Type of link ('character', 'lore', 'episode')
 * @returns {string} HTML link string
 */
function createItemLink(itemMatch, matchText, linkType) {
  const { item } = itemMatch;
  
  let linkClass, titlePrefix;
  switch (linkType) {
    case 'character':
      linkClass = 'character-link';
      titlePrefix = `View ${item.name}'s character page`;
      break;
    case 'lore':
      linkClass = 'lore-link';
      titlePrefix = `Learn about ${item.name}`;
      break;
    case 'episode':
      linkClass = 'episode-link';
      titlePrefix = `Watch ${item.name}`;
      break;
    default:
      linkClass = 'lore-link';
      titlePrefix = `Learn about ${item.name}`;
  }
  
  return `<a href="${item.url}" class="${linkClass}" title="${titlePrefix}">${matchText}</a>`;
}

/**
 * Process text to add links for items with keywords
 * This is the core linking logic that was duplicated across helpers
 * @param {string} text - Text to process
 * @param {Array} items - Array of items to link
 * @param {string} linkType - Type of links to create ('character', 'lore', 'episode')
 * @returns {string} Text with links added
 */
function linkifyItemMentions(text, items, linkType) {
  if (!text || !items || items.length === 0) {
    return text;
  }
  
  let processedText = text;
  
  // Build term map for all items
  const termMap = buildTermMap(items);
  
  // Sort terms by length (longest first) to avoid partial replacements
  const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
  
  // Process each term
  for (const term of sortedTerms) {
    const matches = termMap.get(term);
    if (!matches || matches.length === 0) continue;
    
    // Use the first match for linking (conflicts should be handled by disambiguation system)
    const match = matches[0];
    
    // Find existing links to avoid overlapping
    const existingLinks = findExistingLinks(processedText);
    
    // Find all valid matches of our term
    const termMatches = findTermMatches(processedText, term, existingLinks);
    
    // Replace from right to left to maintain correct positions
    termMatches.reverse().forEach(termMatchInfo => {
      const beforeMatch = processedText.substring(0, termMatchInfo.start);
      const afterMatch = processedText.substring(termMatchInfo.end);
      
      // Create the link
      const linkHtml = createItemLink(match, termMatchInfo.match, linkType);
      processedText = beforeMatch + linkHtml + afterMatch;
    });
  }
  
  return processedText;
}

module.exports = {
  extractSearchTerms,
  buildTermMap,
  findExistingLinks,
  findTermMatches,
  createItemLink,
  linkifyItemMentions
};