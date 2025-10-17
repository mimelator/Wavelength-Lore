/**
 * Simple Disambiguation System for Wavelength Lore
 * 
 * This provides a clean, simple approach to handling conflicts
 * where terms can refer to multiple things (like "Ice Fortress" 
 * being both a place and an episode).
 */

// Store helper instances
let characterHelpers, loreHelpers, episodeHelpers;

/**
 * Set helper instances for use in linking
 * @param {object} charHelpers - Character helpers instance
 * @param {object} loreHelpersInstance - Lore helpers instance  
 * @param {object} episodeHelpersInstance - Episode helpers instance
 */
function setHelperInstances(charHelpers, loreHelpersInstance, episodeHelpersInstance) {
  characterHelpers = charHelpers;
  loreHelpers = loreHelpersInstance;
  episodeHelpers = episodeHelpersInstance;
}

/**
 * Detect conflicts dynamically by checking all helper systems
 * @param {string} term - The term to check for conflicts
 * @returns {Array} Array of conflict objects with type, url, name, etc.
 */
function detectConflictsForTerm(term) {
  const conflicts = [];
  const seenUrls = new Set();
  
  // Check characters
  if (characterHelpers) {
    const characters = characterHelpers.getAllCharactersSync();
    characters.forEach(char => {
      const searchTerms = [char.name];
      if (char.keywords && Array.isArray(char.keywords)) {
        searchTerms.push(...char.keywords);
      }
      
      if (searchTerms.some(searchTerm => 
        searchTerm && searchTerm.toLowerCase() === term.toLowerCase()
      )) {
        // Only add if we haven't seen this URL before
        if (!seenUrls.has(char.url)) {
          seenUrls.add(char.url);
          conflicts.push({
            type: 'character',
            url: char.url,
            name: char.name,
            description: 'Character',
            image: char.image,
            subtitle: char.role || 'Character'
          });
        }
      }
    });
  }
  
  // Check lore
  if (loreHelpers) {
    const lore = loreHelpers.getAllLoreSync();
    lore.forEach(loreItem => {
      const searchTerms = [loreItem.name];
      if (loreItem.keywords && Array.isArray(loreItem.keywords)) {
        searchTerms.push(...loreItem.keywords);
      }
      
      if (searchTerms.some(searchTerm => 
        searchTerm && searchTerm.toLowerCase() === term.toLowerCase()
      )) {
        // Only add if we haven't seen this URL before
        if (!seenUrls.has(loreItem.url)) {
          seenUrls.add(loreItem.url);
          conflicts.push({
            type: 'lore',
            url: loreItem.url,
            name: loreItem.name,
            description: loreItem.type || 'Lore',
            image: loreItem.image,
            subtitle: loreItem.type || 'Lore'
          });
        }
      }
    });
  }
  
  // Check episodes
  if (episodeHelpers) {
    const episodes = episodeHelpers.getAllEpisodesSync();
    episodes.forEach(episode => {
      const searchTerms = [episode.name];
      if (episode.keywords && Array.isArray(episode.keywords)) {
        searchTerms.push(...episode.keywords);
      }
      
      if (searchTerms.some(searchTerm => 
        searchTerm && searchTerm.toLowerCase() === term.toLowerCase()
      )) {
        // Only add if we haven't seen this URL before
        if (!seenUrls.has(episode.url)) {
          seenUrls.add(episode.url);
          conflicts.push({
            type: 'episode',
            url: episode.url,
            name: episode.name,
            description: 'Episode',
            image: episode.image,
            subtitle: `Season ${episode.season}, Episode ${episode.episode_number}`
          });
        }
      }
    });
  }
  
  return conflicts;
}

/**
 * Apply smart linking with simple conflict resolution
 * @param {string} text - Original text
 * @param {string} currentUrl - Current page URL to avoid self-referential links (optional)
 * @returns {string} Text with smart linking applied
 */
function applySmartLinkingSimple(text, currentUrl = null) {
  let result = text;
  
  // Collect all potential terms from all helpers with their conflict info
  const termMap = new Map();
  
  // Collect from characters
  if (characterHelpers) {
    const characters = characterHelpers.getAllCharactersSync();
    characters.forEach(char => {
      const searchTerms = [char.name];
      if (char.keywords && Array.isArray(char.keywords)) {
        searchTerms.push(...char.keywords);
      }
      
      searchTerms.forEach(term => {
        if (!term || term.trim() === '') return;
        const lowerTerm = term.toLowerCase();
        if (!termMap.has(lowerTerm)) {
          termMap.set(lowerTerm, []);
        }
        termMap.get(lowerTerm).push({
          type: 'character',
          url: char.url,
          name: char.name,
          description: 'Character',
          image: char.image,
          subtitle: char.role || 'Character',
          matchText: term
        });
      });
    });
  }
  
  // Collect from lore
  if (loreHelpers) {
    const lore = loreHelpers.getAllLoreSync();
    lore.forEach(loreItem => {
      const searchTerms = [loreItem.name];
      if (loreItem.keywords && Array.isArray(loreItem.keywords)) {
        searchTerms.push(...loreItem.keywords);
      }
      
      searchTerms.forEach(term => {
        if (!term || term.trim() === '') return;
        const lowerTerm = term.toLowerCase();
        if (!termMap.has(lowerTerm)) {
          termMap.set(lowerTerm, []);
        }
        termMap.get(lowerTerm).push({
          type: 'lore',
          url: loreItem.url,
          name: loreItem.name,
          description: loreItem.type || 'Lore',
          image: loreItem.image,
          subtitle: loreItem.type || 'Lore',
          matchText: term
        });
      });
    });
  }
  
  // Collect from episodes
  if (episodeHelpers) {
    const episodes = episodeHelpers.getAllEpisodesSync();
    episodes.forEach(episode => {
      const searchTerms = [episode.name];
      if (episode.keywords && Array.isArray(episode.keywords)) {
        searchTerms.push(...episode.keywords);
      }
      
      searchTerms.forEach(term => {
        if (!term || term.trim() === '') return;
        const lowerTerm = term.toLowerCase();
        if (!termMap.has(lowerTerm)) {
          termMap.set(lowerTerm, []);
        }
        termMap.get(lowerTerm).push({
          type: 'episode',
          url: episode.url,
          name: episode.name,
          description: 'Episode',
          image: episode.image,
          subtitle: `${episode.season.replace('season', 'Season ')}, ${episode.episode.replace('episode', 'Episode ')}`,
          matchText: term
        });
      });
    });
  }
  
  // Sort terms by length (longest first) to avoid partial replacements
  const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);
  
  // Track all replacements to avoid overlapping
  const replacements = [];
  
  // Find all potential replacements first
  sortedTerms.forEach(term => {
    if (!term || term.trim() === '') return;
    
    const conflicts = termMap.get(term);
    if (!conflicts || conflicts.length === 0) return;
    
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
    
    let match;
    while ((match = regex.exec(result)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      
      // Check if this overlaps with any existing replacement
      const overlaps = replacements.some(r => 
        (start >= r.start && start < r.end) || 
        (end > r.start && end <= r.end) ||
        (start <= r.start && end >= r.end)
      );
      
      if (!overlaps) {
        replacements.push({
          start,
          end,
          originalText: match[0],
          conflicts,
          term
        });
      }
    }
  });
  
  // Sort replacements by start position (right to left for safe replacement)
  replacements.sort((a, b) => b.start - a.start);
  
  // Apply replacements
  replacements.forEach(replacement => {
    const { start, end, originalText, conflicts } = replacement;
    
    // Deduplicate conflicts by URL to avoid duplicate entries in the modal
    const uniqueConflicts = [];
    const seenUrls = new Set();
    
    conflicts.forEach(conflict => {
      if (!seenUrls.has(conflict.url)) {
        seenUrls.add(conflict.url);
        uniqueConflicts.push(conflict);
      }
    });
    
    let replacementHtml;
    if (uniqueConflicts.length > 1) {
      // Check if there's an exact character match that should be prioritized
      const exactCharacterMatch = uniqueConflicts.find(c => 
        c.type === 'character' && 
        c.name.toLowerCase() === originalText.toLowerCase()
      );
      
      if (exactCharacterMatch) {
        // Prioritize exact character match over episode/lore keyword matches
        const conflict = exactCharacterMatch;
        
        // Don't create self-referential links - leave as plain text
        if (currentUrl && conflict.url === currentUrl) {
          replacementHtml = originalText;
        } else {
          const linkClass = 'character-link';
          const title = `View ${conflict.name}'s character page`;
          
          replacementHtml = `<a href="${conflict.url}" class="${linkClass}" title="${title}">${originalText}</a>`;
        }
      } else {
        // Multiple matches with no exact character match - use disambiguation modal
        const conflictsJson = JSON.stringify(uniqueConflicts).replace(/"/g, '&quot;');
        replacementHtml = `<span class="disambiguation-link" onclick="openDisambiguationModal(this)" data-phrase="${originalText}" data-conflicts="${conflictsJson}">${originalText}</span>`;
      }
    } else {
      // Single match - create direct link with appropriate class
      const conflict = uniqueConflicts[0];
      
      // Don't create self-referential links - leave as plain text
      if (currentUrl && conflict.url === currentUrl) {
        replacementHtml = originalText;
      } else {
        let linkClass = 'lore-link'; // default
        if (conflict.type === 'character') {
          linkClass = 'character-link';
        } else if (conflict.type === 'episode') {
          linkClass = 'episode-link';
        }
        
        let title = `Learn about ${conflict.name}`;
        if (conflict.type === 'character') {
          title = `View ${conflict.name}'s character page`;
        } else if (conflict.type === 'episode') {
          title = `Watch ${conflict.name}`;
        }
        
        replacementHtml = `<a href="${conflict.url}" class="${linkClass}" title="${title}">${originalText}</a>`;
      }
    }
    
    result = result.substring(0, start) + replacementHtml + result.substring(end);
  });

  return result;
}

/**
 * Get the simple disambiguation script
 * @returns {string} JavaScript for handling disambiguation
 */
function getSimpleDisambiguationScript() {
  return `
    <script>
      function openDisambiguationModal(element) {
        const phrase = element.dataset.phrase;
        const conflicts = JSON.parse(element.dataset.conflicts.replace(/&quot;/g, '"'));
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('disambiguation-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'disambiguation-modal';
          modal.className = 'disambiguation-modal';
          document.body.appendChild(modal);
        }
        
        // Create modal content
        const modalContent = \`
          <div class="disambiguation-modal-content">
            <div class="disambiguation-modal-header">
              <h3>Choose "\${phrase}"</h3>
              <button class="disambiguation-modal-close" onclick="closeDisambiguationModal()">&times;</button>
            </div>
            <div class="disambiguation-modal-body">
              \${conflicts.map(conflict => \`
                <div class="disambiguation-option" onclick="selectDisambiguationOption('\${conflict.url}')">
                  <img src="\${conflict.image}" alt="\${conflict.name}" class="disambiguation-option-image">
                  <div class="disambiguation-option-content">
                    <div class="disambiguation-option-title">\${conflict.description}</div>
                    <div class="disambiguation-option-name">\${conflict.name}</div>
                    <div class="disambiguation-option-subtitle">\${conflict.subtitle}</div>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
        
        modal.innerHTML = modalContent;
        modal.style.display = 'flex';
        
        // Close modal when clicking outside
        modal.onclick = function(e) {
          if (e.target === modal) {
            closeDisambiguationModal();
          }
        };
      }
      
      function closeDisambiguationModal() {
        const modal = document.getElementById('disambiguation-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
      
      function selectDisambiguationOption(url) {
        closeDisambiguationModal();
        window.location.href = url;
      }
      
      // Close modal on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeDisambiguationModal();
        }
      });
    </script>
  `;
}

/**
 * Get CSS for simple disambiguation
 * @returns {string} CSS styles
 */
function getSimpleDisambiguationStyles() {
  return `
    <style>
      .disambiguation-link {
        color: #007bff;
        text-decoration: underline;
        cursor: pointer;
        position: relative;
        background: linear-gradient(to bottom, rgba(0, 123, 255, 0.1) 0%, rgba(0, 123, 255, 0.05) 100%);
        padding: 2px 4px;
        border-radius: 3px;
        border: 1px solid rgba(0, 123, 255, 0.3);
        transition: all 0.2s ease;
      }
      
      .disambiguation-link:hover {
        background: linear-gradient(to bottom, rgba(0, 123, 255, 0.2) 0%, rgba(0, 123, 255, 0.1) 100%);
        border-color: rgba(0, 123, 255, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
      }
      
      .disambiguation-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .disambiguation-modal-content {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 500px;
        animation: slideIn 0.3s ease;
        border: 1px solid #dee2e6;
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .disambiguation-modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px 12px 0 0;
      }
      
      .disambiguation-modal-header h3 {
        margin: 0;
        color: #343a40;
        font-size: 1.3em;
        font-weight: 600;
      }
      
      .disambiguation-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #6c757d;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .disambiguation-modal-close:hover {
        background-color: #dc3545;
        color: white;
        transform: scale(1.1);
      }
      
      .disambiguation-modal-body {
        padding: 0;
      }
      
      .disambiguation-option {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .disambiguation-option:last-child {
        border-bottom: none;
        border-radius: 0 0 12px 12px;
      }
      
      .disambiguation-option:hover {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        transform: translateX(4px);
      }
      
      .disambiguation-option-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        margin-right: 16px;
        border: 2px solid #dee2e6;
        transition: all 0.2s ease;
      }
      
      .disambiguation-option:hover .disambiguation-option-image {
        border-color: white;
        transform: scale(1.05);
      }
      
      .disambiguation-option-content {
        flex: 1;
      }
      
      .disambiguation-option-title {
        font-size: 0.85em;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      
      .disambiguation-option:hover .disambiguation-option-title {
        color: rgba(255, 255, 255, 0.8);
      }
      
      .disambiguation-option-name {
        font-size: 1.1em;
        font-weight: 600;
        color: #343a40;
        margin-bottom: 4px;
      }
      
      .disambiguation-option:hover .disambiguation-option-name {
        color: white;
      }
      
      .disambiguation-option-subtitle {
        font-size: 0.9em;
        color: #6c757d;
        font-style: italic;
      }
      
      .disambiguation-option:hover .disambiguation-option-subtitle {
        color: rgba(255, 255, 255, 0.9);
      }
      
      @media (max-width: 768px) {
        .disambiguation-modal-content {
          width: 95%;
          margin: 20px;
        }
        
        .disambiguation-option {
          padding: 12px 16px;
        }
        
        .disambiguation-option-image {
          width: 50px;
          height: 50px;
          margin-right: 12px;
        }
        
        .disambiguation-modal-header {
          padding: 16px 20px 12px;
        }
      }
    </style>
  `;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setHelperInstances,
    applySmartLinkingSimple,
    detectConflictsForTerm,
    getSimpleDisambiguationScript,
    getSimpleDisambiguationStyles
  };
}