/**
 * NPC Visual Boundaries Configuration
 *
 * Manages rotating NPCs used as visual separators between seasons and episodes.
 * These characters are randomly selected to create visual interest and showcase
 * the extracted NPC collection throughout the site.
 *
 * To add a new boundary NPC:
 * 1. Add an entry to the `boundaries` array
 * 2. Include: id, path, name, altText, and season/episode info
 * 3. The system will automatically include it in rotation
 *
 * Note: Paths are relative to CDN_URL (from .env) or root if CDN_URL not set
 */

// Get CDN URL from environment or use empty string for relative paths
const CDN_URL = process.env.CDN_URL || '';

module.exports = {
  // Available NPCs for visual boundaries
  boundaries: [
    {
      id: 'sneaky-goblin',
      path: `${CDN_URL}/images/npc-characters/sneaky-goblin.png`,
      name: 'Sneaky Goblin',
      altText: 'Sneaky Goblin - Wavelength Lore NPC',
      season: 'ice-blue-greed',
      description: 'A goblin peeking from behind a tree',
      weight: 2 // Higher weight = more frequent selection
    },
    {
      id: 'winter-elf-rabbit',
      path: `${CDN_URL}/images/npc-characters/fp_elf_1.png`,
      name: 'Arctic Hare',
      altText: 'Arctic Hare - Wavelength Lore Frozen Peace NPC',
      season: 'frozen-peace',
      description: 'A magical arctic rabbit adapted to snowy environments',
      weight: 1
    },
    {
      id: 'leprechaun',
      path: `${CDN_URL}/images/npc-characters/fp_elf_2.png`,
      name: 'Magical Leprechaun',
      altText: 'Magical Leprechaun - Wavelength Lore Frozen Peace NPC',
      season: 'frozen-peace',
      description: 'A mischievous leprechaun from the frozen realm',
      weight: 1
    },
    {
      id: 'ice-dragon-large',
      path: `${CDN_URL}/images/npc-characters/fp_ice_dragon_1.png`,
      name: 'Ice Dragon',
      altText: 'Ice Dragon - Wavelength Lore Frozen Peace NPC',
      season: 'frozen-peace',
      description: 'A magnificent ice dragon with crystalline wings',
      weight: 1
    }
  ],

  /**
   * Get a random boundary NPC
   * Respects weight distribution for varied selection
   *
   * @returns {Object} A boundary NPC configuration object
   */
  getRandomBoundary() {
    // Create weighted array
    const weighted = [];
    this.boundaries.forEach(boundary => {
      for (let i = 0; i < (boundary.weight || 1); i++) {
        weighted.push(boundary);
      }
    });

    // Select random from weighted array
    return weighted[Math.floor(Math.random() * weighted.length)];
  },

  /**
   * Get boundary NPCs by season
   *
   * @param {string} season - Season identifier
   * @returns {Array} Boundaries for the specified season
   */
  getBoundariesBySeason(season) {
    return this.boundaries.filter(b => b.season === season);
  },

  /**
   * Get all boundary NPCs
   *
   * @returns {Array} All configured boundaries
   */
  getAllBoundaries() {
    return this.boundaries;
  },

  /**
   * Get boundary by ID
   *
   * @param {string} id - Boundary ID
   * @returns {Object|null} Boundary configuration or null if not found
   */
  getBoundaryById(id) {
    return this.boundaries.find(b => b.id === id) || null;
  }
};
