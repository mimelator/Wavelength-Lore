/* Fix for Map Disambiguation Modal Scrolling */

/**
 * Detect conflicts for a location using available site data
 */
function detectLocationConflicts(locationId, searchTerm) {
  const conflicts = [];
  
  console.log('Available data:', {
    characters: window.allCharacters ? window.allCharacters.length : 'none',
    lore: window.allLore ? window.allLore.length : 'none', 
    episodes: window.allEpisodes ? window.allEpisodes.length : 'none'
  });
  
  // Helper function to check if a term matches
  function termMatches(item, searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Check exact name match
    if (item.name && item.name.toLowerCase() === lowerSearchTerm) {
      return true;
    }
    
    // Check exact title match (for lore)
    if (item.title && item.title.toLowerCase() === lowerSearchTerm) {
      return true;
    }
    
    // Check if searchTerm contains any of the keywords (flexible matching)
    if (item.keywords && Array.isArray(item.keywords)) {
      return item.keywords.some(keyword => {
        if (!keyword) return false;
        const lowerKeyword = keyword.toLowerCase();
        return lowerSearchTerm.includes(lowerKeyword) || lowerKeyword.includes(lowerSearchTerm.replace('the ', ''));
      });
    }
    
    // Also check if the core term (without "the") matches the name/title
    const coreSearchTerm = lowerSearchTerm.replace('the ', '').trim();
    if (item.name && item.name.toLowerCase().includes(coreSearchTerm)) {
      return true;
    }
    
    if (item.title && item.title.toLowerCase().includes(coreSearchTerm)) {
      return true;
    }
    
    return false;
  }
  
  // Check characters if available
  if (window.allCharacters && window.allCharacters.length > 0) {
    window.allCharacters.forEach(char => {
      if (termMatches(char, searchTerm)) {
        conflicts.push({
          type: 'character',
          url: char.url || `/character/${char.id}`,
          name: char.name || char.title,
          description: 'Character',
          image: char.image || '/images/default-character.jpg',
          subtitle: char.role || 'Character'
        });
      }
    });
  }
  
  // Check lore if available  
  if (window.allLore && window.allLore.length > 0) {
    window.allLore.forEach(loreItem => {
      if (termMatches(loreItem, searchTerm)) {
        conflicts.push({
          type: 'lore',
          url: loreItem.url || `/lore/${loreItem.id}`,
          name: loreItem.name || loreItem.title,
          description: 'Lore',
          image: loreItem.image || '/images/default-lore.jpg',
          subtitle: (loreItem.type || 'Location').charAt(0).toUpperCase() + (loreItem.type || 'location').slice(1)
        });
      }
    });
  }
  
  // Check episodes if available
  if (window.allEpisodes && window.allEpisodes.length > 0) {
    console.log('Checking episodes for matches...');
    window.allEpisodes.forEach(episode => {
      const isMatch = termMatches(episode, searchTerm);
      if (isMatch) {
        console.log('Episode match found:', episode.title, 'keywords:', episode.keywords);
        conflicts.push({
          type: 'episode',
          url: episode.url || `/season/${episode.season}/episode/${episode.episode}`,
          name: episode.name || episode.title,
          description: 'Episode',
          image: episode.image || '/images/default-episode.jpg',
          subtitle: `Season ${episode.season || 1}, Episode ${episode.episode || episode.episode_number || 1}`
        });
      }
    });
  }
  
  console.log(`Found ${conflicts.length} conflicts for "${searchTerm}":`, conflicts);
  return conflicts;
}

/**
 * Show "Coming Soon" tooltip for locations without registered content
 */
function showComingSoonTooltip(searchTerm) {
  console.log('Showing Coming Soon tooltip for:', searchTerm);
  
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #333 0%, #555 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    z-index: 10000;
    font-family: 'AnimeAce', serif;
  `;
  
  tooltip.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #4fc3f7;">${searchTerm}</h3>
    <p style="margin: 0; font-size: 14px; opacity: 0.9;">Coming Soon...</p>
    <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">This location will be available in a future update!</p>
  `;
  
  document.body.appendChild(tooltip);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (tooltip && tooltip.parentNode) {
      tooltip.remove();
    }
  }, 3000);
  
  // Remove on click
  tooltip.onclick = () => tooltip.remove();
}

/**
 * Override the modal creation to fix scrolling issues
 */
function createScrollableDisambiguationModal(phrase, conflicts) {
  console.log('Creating scrollable modal for:', phrase, 'with', conflicts.length, 'conflicts');
  
  // Remove existing modal if any
  const existingModal = document.getElementById('disambiguation-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal backdrop
  const modal = document.createElement('div');
  modal.id = 'disambiguation-modal';
  modal.style.cssText = `
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  // Create modal container with proper height constraints
  const container = document.createElement('div');
  container.style.cssText = `
    background-color: #fefefe;
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;
  
  // Create fixed header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #ddd;
    background-color: #fefefe;
    border-radius: 8px 8px 0 0;
    flex-shrink: 0;
  `;
  
  const title = document.createElement('h3');
  title.textContent = `Choose "${phrase}"`;
  title.style.cssText = `
    margin: 0;
    color: #333;
    font-size: 1.2em;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #aaa;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#f0f0f0';
  closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
  closeBtn.onclick = () => {
    modal.remove();
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create scrollable body
  const body = document.createElement('div');
  body.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 0;
  `;
  
  // Add custom scrollbar styles for webkit browsers
  const style = document.createElement('style');
  style.textContent = `
    .disambiguation-modal-body::-webkit-scrollbar {
      width: 8px;
    }
    .disambiguation-modal-body::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .disambiguation-modal-body::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    .disambiguation-modal-body::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
  `;
  document.head.appendChild(style);
  body.className = 'disambiguation-modal-body';
  
  // Add conflicts
  conflicts.forEach((conflict, index) => {
    const option = document.createElement('div');
    option.style.cssText = `
      display: flex;
      align-items: center;
      padding: 15px;
      margin-bottom: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background-color: white;
    `;
    
    option.onmouseover = () => {
      option.style.backgroundColor = '#f8f9fa';
      option.style.borderColor = '#007bff';
    };
    option.onmouseout = () => {
      option.style.backgroundColor = 'white';
      option.style.borderColor = '#ddd';
    };
    
    option.onclick = () => {
      console.log('Selected:', conflict.name, 'URL:', conflict.url);
      modal.remove();
      window.location.href = conflict.url;
    };
    
    // Add image if available
    if (conflict.image) {
      const img = document.createElement('img');
      img.src = conflict.image;
      img.alt = conflict.name;
      img.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 15px;
        flex-shrink: 0;
      `;
      img.onerror = () => img.style.display = 'none';
      option.appendChild(img);
    }
    
    // Add content
    const content = document.createElement('div');
    content.style.cssText = 'flex-grow: 1;';
    
    const typeLabel = document.createElement('div');
    typeLabel.textContent = conflict.description || conflict.type;
    typeLabel.style.cssText = `
      font-weight: bold;
      margin-bottom: 4px;
      color: #007bff;
      font-size: 0.9em;
      text-transform: uppercase;
    `;
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = conflict.name;
    nameDiv.style.cssText = `
      font-size: 1.1em;
      margin-bottom: 4px;
      color: #333;
      font-weight: 500;
    `;
    
    const subtitleDiv = document.createElement('div');
    subtitleDiv.textContent = conflict.subtitle || '';
    subtitleDiv.style.cssText = `
      color: #666;
      font-size: 0.9em;
    `;
    
    content.appendChild(typeLabel);
    content.appendChild(nameDiv);
    if (conflict.subtitle) {
      content.appendChild(subtitleDiv);
    }
    
    option.appendChild(content);
    body.appendChild(option);
  });
  
  // Assemble modal
  container.appendChild(header);
  container.appendChild(body);
  modal.appendChild(container);
  
  // Add to DOM
  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  return modal;
}

// Override the existing functions
if (typeof window !== 'undefined') {
  window.openMapDisambiguationModal = function(element) {
    const phrase = element.dataset.phrase;
    const conflicts = JSON.parse(element.dataset.conflicts.replace(/&quot;/g, '"'));
    createScrollableDisambiguationModal(phrase, conflicts);
  };
  
  // Also provide the main function that gets called from the map
  window.showMapDisambiguationModal = function(locationId) {
    console.log('🎯 showMapDisambiguationModal called with locationId:', locationId);
    
    // Location name mapping
    const locationNameMap = {
      'ice-fortress': 'Ice Fortress',
      'the-shire': 'The Shire', 
      'goblin-king-lair': 'Goblin King',
      'shire-sanctuary': 'Shire Sanctuary',
      'port-gamble': 'Port Gamble',
      'northern-crossroads': 'Northern Crossroads',
      'mystic-druids': 'Mystic Druids'
    };
    
    // Get the search term for this location
    const searchTerm = locationNameMap[locationId] || locationId.replace(/-/g, ' ');
    console.log('🔍 Searching for conflicts for term:', searchTerm);
    
    // Detect conflicts using available site data
    const conflicts = detectLocationConflicts(locationId, searchTerm);
    
    if (!conflicts || conflicts.length === 0) {
      console.log('No conflicts found for location:', locationId);
      showComingSoonTooltip(searchTerm);
      return;
    }

    if (conflicts.length === 1) {
      console.log('Single match found, navigating directly to:', conflicts[0].url);
      window.location.href = conflicts[0].url;
      return;
    }

    // Multiple conflicts - show disambiguation modal
    console.log('Multiple conflicts found:', conflicts.length);
    createScrollableDisambiguationModal(searchTerm, conflicts);
  };
  
  // Provide closeDisambiguationModal for compatibility
  window.closeDisambiguationModal = function() {
    const modal = document.getElementById('disambiguation-modal');
    if (modal) {
      modal.remove();
    }
  };
  
  // Provide selectDisambiguationOption for compatibility
  window.selectDisambiguationOption = function(url) {
    console.log('Navigating to:', url);
    const modal = document.getElementById('disambiguation-modal');
    if (modal) {
      modal.remove();
    }
    window.location.href = url;
  };
  
  console.log('Map modal scrolling fix loaded - complete disambiguation system active');
}