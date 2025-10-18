/**
 * Disambiguation Helpers for Wavelength Lore
 * 
 * This module handles cases where text can match multiple link types
 * (e.g., "Ice Fortress" as both a lore item and an episode)
 * and provides user choice mechanisms.
 */

let characterHelpers, loreHelpers, episodeHelpers;

/**
 * Set references to other helper modules
 */
function setHelperModules(charHelpers, loreHelps, episodeHelps) {
  characterHelpers = charHelpers;
  loreHelpers = loreHelps;
  episodeHelpers = episodeHelps;
}

/**
 * Find all possible matches for a given text across all link types
 * @param {string} text - Text to search for matches
 * @returns {Object} Object containing matches by type
 */
function findAllMatches(text) {
  const matches = {
    characters: [],
    lore: [],
    episodes: []
  };

  // Get all available items
  const characters = characterHelpers ? characterHelpers.getAllCharactersSync() : [];
  const lore = loreHelpers ? loreHelpers.getAllLoreSync() : [];
  const episodes = episodeHelpers ? episodeHelpers.getAllEpisodesSync() : [];

  // Check for character matches
  characters.forEach(character => {
    if (text.toLowerCase().includes(character.name.toLowerCase())) {
      matches.characters.push({
        type: 'character',
        item: character,
        name: character.name,
        url: character.url,
        description: `Character: ${character.name}`
      });
    }
  });

  // Check for lore matches
  lore.forEach(loreItem => {
    if (text.toLowerCase().includes(loreItem.name.toLowerCase())) {
      matches.lore.push({
        type: 'lore',
        item: loreItem,
        name: loreItem.name,
        url: loreItem.url,
        description: `Place/Thing: ${loreItem.name}`
      });
    }
  });

  // Check for episode matches
  episodes.forEach(episode => {
    if (text.toLowerCase().includes(episode.title.toLowerCase())) {
      matches.episodes.push({
        type: 'episode',
        item: episode,
        name: episode.title,
        url: episode.url,
        description: `Episode: ${episode.title}`
      });
    }
  });

  return matches;
}

/**
 * Find conflicts where the same text matches multiple types
 * @param {string} text - Text to analyze
 * @returns {Array} Array of conflict objects
 */
function findConflicts(text) {
  const conflicts = [];
  const allItems = [];
  
  // Get all available items
  const characters = characterHelpers ? characterHelpers.getAllCharactersSync() : [];
  const lore = loreHelpers ? loreHelpers.getAllLoreSync() : [];
  const episodes = episodeHelpers ? episodeHelpers.getAllEpisodesSync() : [];
  
  // Create a combined list of all searchable items
  characters.forEach(character => {
    allItems.push({
      name: character.name,
      type: 'character',
      item: character,
      url: character.url,
      description: `Character: ${character.name}`,
      cleanName: character.name
    });
  });
  
  lore.forEach(loreItem => {
    allItems.push({
      name: loreItem.name,
      type: 'lore', 
      item: loreItem,
      url: loreItem.url,
      description: `Place/Thing: ${loreItem.name}`,
      cleanName: loreItem.name
    });
  });
  
  episodes.forEach(episode => {
    allItems.push({
      name: episode.title,
      type: 'episode',
      item: episode,
      url: episode.url,
      description: `Episode: ${episode.title}`,
      cleanName: episode.title
    });
  });
  
  // Check each item to see if it matches something in the text
  // and if there are multiple items with the same or overlapping names
  const foundMatches = [];
  
  allItems.forEach(item => {
    const regex = new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      foundMatches.push(item);
    }
  });
  
  // Group matches by name (case insensitive)
  const nameGroups = {};
  foundMatches.forEach(match => {
    const key = match.name.toLowerCase();
    if (!nameGroups[key]) {
      nameGroups[key] = [];
    }
    nameGroups[key].push(match);
  });
  
  // Only create conflicts for names that have multiple matches
  Object.keys(nameGroups).forEach(key => {
    const matches = nameGroups[key];
    if (matches.length > 1) {
      // Deduplicate matches by URL to avoid duplicate entries in the modal
      const uniqueMatches = [];
      const seenUrls = new Set();
      
      matches.forEach(match => {
        if (!seenUrls.has(match.url)) {
          seenUrls.add(match.url);
          uniqueMatches.push(match);
        }
      });
      
      // Only create conflict if we still have multiple unique matches after deduplication
      if (uniqueMatches.length > 1) {
        conflicts.push({
          phrase: uniqueMatches[0].name, // Use the original case from the first match
          matches: {
            characters: uniqueMatches.filter(m => m.type === 'character'),
            lore: uniqueMatches.filter(m => m.type === 'lore'),
            episodes: uniqueMatches.filter(m => m.type === 'episode')
          },
          allMatches: uniqueMatches
        });
      }
    }
  });
  
  // Sort conflicts by phrase length (longer phrases first)
  return conflicts.sort((a, b) => b.phrase.length - a.phrase.length);
}

/**
 * Create a disambiguation dropdown for conflicting terms
 * @param {string} phrase - The conflicting phrase
 * @param {Array} matches - Array of all possible matches
 * @param {string} uniqueId - Unique identifier for this disambiguation
 * @returns {string} HTML for disambiguation dropdown
 */
function createDisambiguationDropdown(phrase, matches, uniqueId) {
  const options = matches.map(match => 
    `<option value="${match.url}" data-type="${match.type}">${match.description}</option>`
  ).join('');

  return `
    <span class="disambiguation-container" data-phrase="${phrase}">
      <select class="disambiguation-select" id="disambig_${uniqueId}" onchange="handleDisambiguation('${uniqueId}')">
        <option value="" disabled selected>${phrase} ↓</option>
        ${options}
      </select>
      <span class="disambiguation-result" id="result_${uniqueId}" style="display: none;"></span>
    </span>
  `;
}

/**
 * Create a modal dialog for disambiguation
 * @param {string} phrase - The conflicting phrase
 * @param {Array} matches - Array of all possible matches
 * @param {string} uniqueId - Unique identifier for this disambiguation
 * @returns {string} HTML for disambiguation modal trigger
 */
function createDisambiguationModal(phrase, matches, uniqueId) {
  const matchButtons = matches.map(match => 
    `<button class="disambig-option" onclick="selectDisambiguation('${uniqueId}', '${match.url}', '${match.type}', '${match.name}')">${match.description}</button>`
  ).join('');

  return `
    <span class="disambiguation-trigger" onclick="showDisambiguationModal('${uniqueId}')">
      ${phrase} <span class="disambig-indicator">🔗</span>
    </span>
    <div id="modal_${uniqueId}" class="disambiguation-modal" style="display: none;">
      <div class="disambiguation-modal-content">
        <h3>Where would you like to go?</h3>
        <p>Multiple pages found for "<strong>${phrase}</strong>":</p>
        <div class="disambiguation-options">
          ${matchButtons}
        </div>
        <button class="disambig-cancel" onclick="closeDisambiguationModal('${uniqueId}')">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Apply smart disambiguation to text
 * @param {string} text - Original text
 * @param {string} mode - 'dropdown' or 'modal'
 * @returns {string} Text with disambiguation applied
 */
function applySmartDisambiguation(text, mode = 'modal') {
  if (!characterHelpers || !loreHelpers || !episodeHelpers) {
    console.warn('Helper modules not set for disambiguation');
    return text;
  }

  const conflicts = findConflicts(text);
  let result = text;
  let uniqueCounter = 0;

  // Process conflicts from longest to shortest to avoid overlaps
  conflicts.forEach(conflict => {
    const uniqueId = `${Date.now()}_${uniqueCounter++}`;
    
    let replacement;
    if (mode === 'dropdown') {
      replacement = createDisambiguationDropdown(conflict.phrase, conflict.allMatches, uniqueId);
    } else {
      replacement = createDisambiguationModal(conflict.phrase, conflict.allMatches, uniqueId);
    }

    // Replace only the first occurrence to avoid duplicates
    const regex = new RegExp(`\\b${conflict.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    result = result.replace(regex, replacement);
  });

  return result;
}

/**
 * Fallback: Apply regular linking but with conflict detection
 * @param {string} text - Original text
 * @returns {string} Text with smart linking applied
 */
function applySmartLinking(text) {
  if (!characterHelpers || !loreHelpers || !episodeHelpers) {
    console.warn('Helper modules not set for smart linking');
    return text;
  }

  const conflicts = findConflicts(text);
  
  if (conflicts.length === 0) {
    // No conflicts, apply normal linking
    return episodeHelpers.linkifyEpisodeMentionsSync(
      loreHelpers.linkifyLoreMentionsSync(
        characterHelpers.linkifyCharacterMentionsSync(text)
      )
    );
  }

  // Apply disambiguation for conflicts
  let result = text;
  
  conflicts.forEach(conflict => {
    // Create clean dropdown options without any nested links
    const options = conflict.allMatches.map(match => {
      const cleanName = match.cleanName || match.name;
      return `<option value="${match.url}" data-type="${match.type}" data-name="${cleanName}">${match.description}</option>`;
    }).join('');

    const replacement = `<select class="disambiguation-select" onchange="handleInlineDisambiguation(this)" data-original="${conflict.phrase}">
      <option value="" disabled selected>${conflict.phrase} ↓</option>
      ${options}
    </select>`;

    // Replace only exact matches to avoid partial replacements
    const regex = new RegExp(`\\b${conflict.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    result = result.replace(regex, replacement);
  });
  
  // Apply normal linking to non-conflicted terms while preserving disambiguation selects
  const placeholders = [];
  
  // Replace disambiguation selects with placeholders
  result = result.replace(/<select class="disambiguation-select"[^>]*>.*?<\/select>/g, (match) => {
    const placeholder = `__DISAMBIG_${placeholders.length}__`;
    placeholders.push(match);
    return placeholder;
  });
  
  // Apply normal linking
  result = characterHelpers.linkifyCharacterMentionsSync(result);
  result = loreHelpers.linkifyLoreMentionsSync(result);
  result = episodeHelpers.linkifyEpisodeMentionsSync(result);
  
  // Restore disambiguation selects
  placeholders.forEach((replacement, index) => {
    result = result.replace(`__DISAMBIG_${index}__`, replacement);
  });

  return result;
}

/**
 * Apply linking while avoiding conflicted phrases
 * @param {string} text - Text to process
 * @param {Array} excludePhrases - Phrases to avoid linking
 * @returns {string} Processed text
 */
function applySelectiveLinking(text, excludePhrases) {
  // Get all items for manual processing
  const characters = characterHelpers.getAllCharactersSync();
  const lore = loreHelpers.getAllLoreSync();
  const episodes = episodeHelpers.getAllEpisodesSync();
  
  let result = text;
  
  // Process characters
  characters.forEach(character => {
    if (!excludePhrases.includes(character.name)) {
      const regex = new RegExp(`\\b${character.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Don't link if it's inside a select element
        if (result.includes(`<select`) && result.includes(`${match}</option>`)) {
          return match;
        }
        return `<a href="${character.url}" class="character-link" title="View ${character.name}'s character page">${match}</a>`;
      });
    }
  });
  
  // Process lore
  lore.forEach(loreItem => {
    if (!excludePhrases.includes(loreItem.name)) {
      const regex = new RegExp(`\\b${loreItem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Don't link if it's inside a select element or already linked
        if (result.includes(`<select`) && result.includes(`${match}</option>`) || 
            result.includes(`>${match}</a>`)) {
          return match;
        }
        return `<a href="${loreItem.url}" class="lore-link" title="Learn about ${loreItem.name}">${match}</a>`;
      });
    }
  });
  
  // Process episodes
  episodes.forEach(episode => {
    if (!excludePhrases.includes(episode.title)) {
      const regex = new RegExp(`\\b${episode.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Don't link if it's inside a select element or already linked
        if (result.includes(`<select`) && result.includes(`${match}</option>`) || 
            result.includes(`>${match}</a>`)) {
          return match;
        }
        return `<a href="${episode.url}" class="episode-link" title="Watch ${episode.title}">${match}</a>`;
      });
    }
  });
  
  return result;
}

/**
 * Get JavaScript functions needed for disambiguation
 * @returns {string} JavaScript code for disambiguation functionality
 */
function getDisambiguationScript() {
  return `
    <script>
      function handleInlineDisambiguation(select) {
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
          const type = selectedOption.dataset.type;
          const url = selectedOption.value;
          const name = selectedOption.dataset.name || selectedOption.text.split(': ')[1] || selectedOption.text;
          const linkClass = type + '-link';
          const title = type === 'character' ? 'View ' + name + '\\'s character page' :
                       type === 'lore' ? 'Learn about ' + name :
                       'Watch ' + name;
          
          const link = document.createElement('a');
          link.href = url;
          link.className = linkClass;
          link.title = title;
          link.textContent = name;
          
          select.parentNode.replaceChild(link, select);
        }
      }
      
      function showDisambiguationModal(uniqueId) {
        document.getElementById('modal_' + uniqueId).style.display = 'block';
      }
      
      function closeDisambiguationModal(uniqueId) {
        document.getElementById('modal_' + uniqueId).style.display = 'none';
      }
      
      function selectDisambiguation(uniqueId, url, type, name) {
        const linkClass = type + '-link';
        const title = type === 'character' ? 'View ' + name + '\\'s character page' :
                     type === 'lore' ? 'Learn about ' + name :
                     'Watch ' + name;
        
        const link = '<a href="' + url + '" class="' + linkClass + '" title="' + title + '">' + name + '</a>';
        
        // Replace the disambiguation trigger with the selected link
        const trigger = document.querySelector('[onclick="showDisambiguationModal(\\''+uniqueId+'\\')"]');
        if (trigger) {
          trigger.outerHTML = link;
        }
        
        closeDisambiguationModal(uniqueId);
      }
      
      function handleDisambiguation(uniqueId) {
        const select = document.getElementById('disambig_' + uniqueId);
        const result = document.getElementById('result_' + uniqueId);
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
          const type = selectedOption.dataset.type;
          const url = selectedOption.value;
          const name = select.dataset.phrase || selectedOption.text.split(': ')[1];
          const linkClass = type + '-link';
          const title = type === 'character' ? 'View ' + name + '\\'s character page' :
                       type === 'lore' ? 'Learn about ' + name :
                       'Watch ' + name;
          
          result.innerHTML = '<a href="' + url + '" class="' + linkClass + '" title="' + title + '">' + name + '</a>';
          result.style.display = 'inline';
          select.style.display = 'none';
        }
      }
    </script>
  `;
}

/**
 * Get CSS styles needed for disambiguation
 * @returns {string} CSS code for disambiguation styling
 */
function getDisambiguationStyles() {
  return `
    <style>
      /* Increased line-height for content areas with dynamic links */
      p:has(.disambiguation-link),
      em:has(.disambiguation-link),
      div:has(.disambiguation-link) {
        line-height: 1.8 !important;
      }
      
      .disambiguation-container {
        display: inline-block;
        position: relative;
        line-height: 1.8;
      }
      
      .disambiguation-select {
        background: #f8f9fa;
        border: 1px solid #6c757d;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 0.9em;
        cursor: pointer;
      }
      
      .disambiguation-select:hover {
        background: #e9ecef;
      }
      
      .disambiguation-trigger {
        cursor: pointer;
        color: #007bff;
        text-decoration: underline;
        text-decoration-style: dotted;
      }
      
      .disambiguation-trigger:hover {
        color: #0056b3;
      }
      
      .disambig-indicator {
        font-size: 0.8em;
        margin-left: 2px;
      }
      
      .disambiguation-modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
      }
      
      .disambiguation-modal-content {
        background-color: #fefefe;
        margin: 15% auto;
        padding: 20px;
        border: 1px solid #888;
        border-radius: 8px;
        width: 80%;
        max-width: 500px;
        text-align: center;
      }
      
      .disambiguation-options {
        margin: 15px 0;
      }
      
      .disambig-option {
        display: block;
        width: 100%;
        margin: 5px 0;
        padding: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
      }
      
      .disambig-option:hover {
        background: #0056b3;
      }
      
      .disambig-cancel {
        margin-top: 10px;
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .disambig-cancel:hover {
        background: #545b62;
      }
    </style>
  `;
}

module.exports = {
  setHelperModules,
  findAllMatches,
  findConflicts,
  applySmartDisambiguation,
  applySmartLinking,
  getDisambiguationScript,
  getDisambiguationStyles
};