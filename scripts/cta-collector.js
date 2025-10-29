#!/usr/bin/env node

/**
 * CTA Collector Script
 * Iterates through all lore, characters, and episodes to extract CTA content
 * for later validation against the Wavelength lore
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_FILE = path.join(__dirname, '../reports/cta-audit.json');

// Ensure reports directory exists
const REPORTS_DIR = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * CTA Collector Class
 */
class CTACollector {
  constructor() {
    this.ctas = [];
    this.stats = {
      total: 0,
      characters: 0,
      episodes: 0,
      lore: 0,
      empty: 0
    };
  }

  /**
   * Load YAML file safely
   */
  loadYAML(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      console.error(`Error loading YAML file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Extract CTAs from characters file
   */
  collectCharacterCTAs() {
    const characterFiles = [
      'characters/wavelength/wavelength.yaml',
    ];

    characterFiles.forEach((file) => {
      const filePath = path.join(CONTENT_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Character file not found: ${filePath}`);
        return;
      }

      const data = this.loadYAML(filePath);
      if (!data) return;

      // Characters can be at root or nested
      const characters = data.characters || (Array.isArray(data) ? data : []);

      characters.forEach((character) => {
        const ctaData = {
          type: 'character',
          id: character.id || 'unknown',
          title: character.title || 'Unknown Character',
          source: file,
          cta_text: character.cta_text || null,
          tagline: character.tagline || null,
          stakes: character.stakes || null,
          description: character.description ? character.description.substring(0, 200) : null
        };

        // Only add if there's actual CTA content
        if (ctaData.cta_text || ctaData.tagline || ctaData.stakes) {
          this.ctas.push(ctaData);
          this.stats.characters++;
          this.stats.total++;
        } else {
          this.stats.empty++;
        }
      });
    });
  }

  /**
   * Extract CTAs from episode files
   */
  collectEpisodeCTAs() {
    const seasonDir = path.join(CONTENT_DIR, 'seasons');
    if (!fs.existsSync(seasonDir)) {
      console.warn(`Seasons directory not found: ${seasonDir}`);
      return;
    }

    const seasonFiles = fs.readdirSync(seasonDir).filter(f => f.endsWith('.yaml'));

    seasonFiles.forEach((file) => {
      const filePath = path.join(seasonDir, file);
      const data = this.loadYAML(filePath);
      if (!data || !data.episodes) return;

      Object.entries(data.episodes).forEach(([episodeId, episode]) => {
        const ctaData = {
          type: 'episode',
          id: episodeId,
          title: episode.title || 'Unknown Episode',
          season: file.replace('season', '').replace('.yaml', ''),
          source: `seasons/${file}`,
          cta_tagline: episode.cta_tagline || null,
          cliffhanger_hook: episode.cliffhanger_hook || null,
          next_episode_tease: episode.next_episode_tease || null,
          description: episode.description ? episode.description.substring(0, 200) : null
        };

        if (ctaData.cta_tagline || ctaData.cliffhanger_hook || ctaData.next_episode_tease) {
          this.ctas.push(ctaData);
          this.stats.episodes++;
          this.stats.total++;
        } else {
          this.stats.empty++;
        }
      });
    });
  }

  /**
   * Extract CTAs from lore file
   */
  collectLoreCTAs() {
    const loreFile = path.join(CONTENT_DIR, 'lore/wavelength-lore.yaml');
    if (!fs.existsSync(loreFile)) {
      console.warn(`Lore file not found: ${loreFile}`);
      return;
    }

    const data = this.loadYAML(loreFile);
    if (!data) return;

    // Traverse all lore entries (locations, creatures, factions, nature, villain, etc.)
    Object.entries(data).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const ctaData = {
          type: 'lore',
          category: category,
          id: item.id || 'unknown',
          title: item.title || 'Unknown Lore',
          source: 'lore/wavelength-lore.yaml',
          intrigue_hook: item.intrigue_hook || item.CTA_HOOK || null,
          enhanced_title: item.enhanced_title ? item.enhanced_title.substring(0, 300) : null,
          description: item.description ? item.description.substring(0, 200) : null
        };

        if (ctaData.intrigue_hook || ctaData.enhanced_title) {
          this.ctas.push(ctaData);
          this.stats.lore++;
          this.stats.total++;
        } else {
          this.stats.empty++;
        }
      });
    });
  }

  /**
   * Collect all CTAs
   */
  collectAll() {
    console.log('🔍 Collecting CTAs from characters...');
    this.collectCharacterCTAs();

    console.log('🔍 Collecting CTAs from episodes...');
    this.collectEpisodeCTAs();

    console.log('🔍 Collecting CTAs from lore...');
    this.collectLoreCTAs();
  }

  /**
   * Save collected CTAs to file
   */
  save() {
    const output = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      ctas: this.ctas
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${this.stats.total} CTAs to ${OUTPUT_FILE}`);
  }

  /**
   * Display summary
   */
  displaySummary() {
    console.log('\n📊 CTA Collection Summary:');
    console.log(`  Total CTAs found: ${this.stats.total}`);
    console.log(`  - Characters: ${this.stats.characters}`);
    console.log(`  - Episodes: ${this.stats.episodes}`);
    console.log(`  - Lore: ${this.stats.lore}`);
    console.log(`  - Items without CTAs: ${this.stats.empty}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🎵 Wavelength Lore CTA Collector\n');

    const collector = new CTACollector();
    collector.collectAll();
    collector.save();
    collector.displaySummary();

    console.log(`\n💾 Audit file ready for validation at: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error during CTA collection:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CTACollector;
