#!/usr/bin/env node

/**
 * Prompt Importer
 * Imports markdown prompt files from content/prompts/ into Firebase
 */

const fs = require('fs').promises;
const path = require('path');
const firebaseUtils = require('../helpers/firebase-utils');

class PromptImporter {
  constructor() {
    this.promptsDir = path.join(__dirname, '../content/prompts');
    this.stats = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Create a URL-friendly ID from filename
   */
  createPromptId(filename, subdirectory = '') {
    const basename = path.basename(filename, '.md');
    const prefix = subdirectory ? `${subdirectory}-` : '';

    return (prefix + basename)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Determine category from file path
   */
  getCategoryFromPath(filePath) {
    if (filePath.includes('/characters/') || filePath.includes('/wavelength/')) {
      return 'character';
    }
    if (filePath.includes('/locations/')) {
      return 'location';
    }
    if (filePath.includes('/lore/villains/')) {
      return 'villain';
    }
    if (filePath.includes('/scenes/')) {
      return 'scene';
    }
    return 'general';
  }

  /**
   * Extract character ID from file path
   */
  getCharacterFromPath(filePath) {
    const basename = path.basename(filePath, '.md');
    const characterNames = ['andrew', 'jewel', 'alex', 'alexandria', 'eloquence', 'daphne', 'lucky', 'maurice', 'yeti'];

    const lowerName = basename.toLowerCase();
    for (const name of characterNames) {
      if (lowerName.includes(name)) {
        // Map 'alex' and 'alexandria' to 'alex'
        return name === 'alexandria' ? 'alex' : name;
      }
    }

    return null;
  }

  /**
   * Extract lore ID from file path
   */
  getLoreFromPath(filePath) {
    if (filePath.includes('goblin-king')) {
      return ['goblin-king'];
    }
    if (filePath.includes('shire')) {
      return ['the-shire'];
    }
    if (filePath.includes('ice') || filePath.includes('fortress')) {
      return ['ice-castle'];
    }
    return [];
  }

  /**
   * Extract keywords from content
   */
  extractKeywordsFromContent(content, basename) {
    const keywords = new Set();

    // Add filename as keyword
    keywords.add(basename.toLowerCase().replace(/-/g, ' '));

    // Common terms that might be keywords
    const keywordPatterns = [
      /\b(golden hour|spring|forest|sunset|sunrise)\b/gi,
      /\b(photorealistic|hyper-detailed|surreal|cinematic)\b/gi,
      /\b(performance|singing|playing|drumming)\b/gi,
      /\b(magical|glowing|luminous|radiant)\b/gi,
      /\b(shire|ice castle|fortress|amphitheater)\b/gi,
      /\b(half-elf|quarter-elf|leprechaun|goblin|yeti)\b/gi,
      /\b(microphone|guitar|lute|harp|violin|bass|drums)\b/gi
    ];

    keywordPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Extract version from content
   */
  extractVersion(content) {
    const versionMatch = content.match(/VERSION\s+(\w+)/i);
    if (versionMatch) {
      const versionWord = versionMatch[1].toLowerCase();
      const versionMap = {
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
        'five': 5
      };
      return versionMap[versionWord] || 1;
    }
    return 1;
  }

  /**
   * Extract tags from content and path
   */
  extractTags(content, filePath) {
    const tags = new Set();

    // Check for common scene types
    if (content.match(/concert|performance|stage/i)) {
      tags.add('performance');
    }
    if (content.match(/battle|fight|war/i)) {
      tags.add('battle');
    }
    if (content.match(/magical|glowing|luminous|energy/i)) {
      tags.add('magical');
    }
    if (content.match(/photorealistic|hyper-detailed/i)) {
      tags.add('realistic');
    }
    if (content.match(/death|dying|deceased/i)) {
      tags.add('dramatic');
    }

    // Location-based tags
    if (filePath.includes('shire')) {
      tags.add('shire');
    }
    if (filePath.includes('ice') || filePath.includes('fortress')) {
      tags.add('ice-castle');
    }

    return Array.from(tags);
  }

  /**
   * Parse a single markdown file
   */
  async parseMarkdownFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.promptsDir, filePath);
      const basename = path.basename(filePath, '.md');
      const dirname = path.dirname(relativePath);

      // Skip workspace files
      if (basename.includes('.code-workspace')) {
        return null;
      }

      // Create prompt object
      const prompt = {
        id: this.createPromptId(basename, dirname.split('/')[0]),
        title: this.createTitle(basename),
        keywords: this.extractKeywordsFromContent(content, basename),
        content: content.trim(),
        linkedCharacters: [],
        linkedEpisodes: [],
        linkedLore: this.getLoreFromPath(filePath),
        category: this.getCategoryFromPath(filePath),
        tags: this.extractTags(content, filePath),
        version: this.extractVersion(content),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add character if applicable
      const characterId = this.getCharacterFromPath(filePath);
      if (characterId) {
        prompt.linkedCharacters.push(characterId);
      }

      return prompt;
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Create human-readable title from filename
   */
  createTitle(basename) {
    return basename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Recursively find all markdown files
   */
  async findMarkdownFiles(dir) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }

    return files;
  }

  /**
   * Import prompts to Firebase
   */
  async importToFirebase(prompts, options = {}) {
    const { dryRun = false, overwrite = false } = options;

    console.log(`\n${dryRun ? '🔍 DRY RUN - No data will be written' : '📤 Importing prompts to Firebase'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const prompt of prompts) {
      try {
        this.stats.total++;

        // Check if prompt already exists
        if (!overwrite && !dryRun) {
          const existing = await firebaseUtils.fetchFromFirebase(`prompts/${prompt.id}`);
          if (existing) {
            console.log(`⏭️  Skipping ${prompt.id} (already exists)`);
            this.stats.skipped++;
            continue;
          }
        }

        if (dryRun) {
          console.log(`✓ Would import: ${prompt.id}`);
          console.log(`  Title: ${prompt.title}`);
          console.log(`  Category: ${prompt.category}`);
          console.log(`  Characters: ${prompt.linkedCharacters.join(', ') || 'none'}`);
          console.log(`  Lore: ${prompt.linkedLore.join(', ') || 'none'}`);
          console.log(`  Tags: ${prompt.tags.join(', ') || 'none'}`);
          console.log('');
        } else {
          // Write to Firebase
          await firebaseUtils.writeToFirebase(`prompts/${prompt.id}`, prompt);
          console.log(`✅ Imported: ${prompt.id} - ${prompt.title}`);
        }

        this.stats.imported++;
      } catch (error) {
        console.error(`❌ Error importing ${prompt.id}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Display summary
   */
  displaySummary() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Import Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files processed: ${this.stats.total}`);
    console.log(`Successfully imported: ${this.stats.imported}`);
    console.log(`Skipped (existing):    ${this.stats.skipped}`);
    console.log(`Errors:                ${this.stats.errors}`);
    console.log('');
  }

  /**
   * Main execution method
   */
  async execute(options = {}) {
    try {
      console.log('📝 Prompt Importer');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Source: ${this.promptsDir}\n`);

      // Initialize Firebase
      if (!options.dryRun) {
        firebaseUtils.initializeFirebase('prompt-importer');
      }

      // Find all markdown files
      console.log('🔍 Scanning for markdown files...');
      const files = await this.findMarkdownFiles(this.promptsDir);
      console.log(`Found ${files.length} markdown files\n`);

      // Parse all files
      console.log('📖 Parsing markdown files...');
      const prompts = [];
      for (const file of files) {
        const prompt = await this.parseMarkdownFile(file);
        if (prompt) {
          prompts.push(prompt);
        }
      }
      console.log(`Parsed ${prompts.length} valid prompts\n`);

      // Import to Firebase
      await this.importToFirebase(prompts, options);

      // Display summary
      this.displaySummary();

      if (options.dryRun) {
        console.log('💡 Run without --dry-run to actually import the prompts');
      }

      return prompts;
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Prompt Importer - Import markdown prompts to Firebase

Usage: node prompt-importer.js [options]

Options:
  --dry-run         Preview import without writing to Firebase
  --overwrite       Overwrite existing prompts (default: skip)
  --help, -h        Show this help message

Examples:
  node prompt-importer.js --dry-run          # Preview import
  node prompt-importer.js                    # Import new prompts
  node prompt-importer.js --overwrite        # Import and overwrite existing

Description:
  This script scans content/prompts/ for markdown files and imports them
  to Firebase. It automatically:
  - Extracts metadata from filenames and content
  - Links prompts to characters, episodes, and lore
  - Categorizes prompts based on directory structure
  - Extracts keywords and tags from content
`);
    process.exit(0);
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    overwrite: args.includes('--overwrite')
  };

  const importer = new PromptImporter();

  try {
    await importer.execute(options);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = PromptImporter;
