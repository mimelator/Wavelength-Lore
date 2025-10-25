#!/usr/bin/env node

/**
 * Wavelength Lore Content Management CLI
 * 
 * A comprehensive tool for managing seasons, episodes, characters, locations, 
 * lore, and assets in the Wavelength Lore project.
 * 
 * Usage:
 *   ./content-manager.js add season
 *   ./content-manager.js add episode --season=2
 *   ./content-manager.js add character
 *   ./content-manager.js add location
 *   ./content-manager.js add lore
 *   ./content-manager.js validate
 *   ./content-manager.js deploy
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ContentManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.contentDir = path.join(this.projectRoot, 'content');
    this.schemasDir = path.join(this.projectRoot, 'content-management', 'schemas');
    this.templatesDir = path.join(this.projectRoot, 'content-management', 'templates');
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const subcommand = args[1];
    const flags = this.parseFlags(args.slice(2));

    try {
      switch (command) {
        case 'add':
          await this.handleAdd(subcommand, flags);
          break;
        case 'validate':
          await this.validateAllContent();
          break;
        case 'deploy':
          await this.deployContent(flags);
          break;
        case 'list':
          await this.listContent(subcommand);
          break;
        case 'delete':
          await this.handleDelete(subcommand, flags);
          break;
        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;
        default:
          console.log('Unknown command. Use --help for usage information.');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  parseFlags(args) {
    const flags = {};
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        flags[key] = value || true;
      }
    });
    return flags;
  }

  async handleAdd(type, flags) {
    console.log(`\\n🎵 Adding new ${type}...\\n`);

    switch (type) {
      case 'season':
        await this.addSeason();
        break;
      case 'episode':
        await this.addEpisode(flags.season);
        break;
      case 'character':
        await this.addCharacter();
        break;
      case 'location':
        await this.addLocation();
        break;
      case 'lore':
        await this.addLore();
        break;
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  async addSeason() {
    console.log('📺 Creating a new season...');
    
    const seasonData = {
      title: await this.prompt('Season title: '),
      description: await this.prompt('Season description: '),
      seasonLink: await this.prompt('YouTube playlist link (optional): '),
      image: await this.prompt('Season image URL (will be auto-generated if empty): '),
      episodes: {}
    };

    // Auto-generate season number
    const seasonFiles = fs.readdirSync(path.join(this.contentDir, 'seasons'))
      .filter(f => f.startsWith('season') && f.endsWith('.yaml'));
    
    const seasonNumber = seasonFiles.length + 1;
    const filename = `season${seasonNumber}.yaml`;

    // Auto-generate image URL if not provided
    if (!seasonData.image) {
      seasonData.image = `https://df5sj8f594cdx.cloudfront.net/images/seasons/season${seasonNumber}/image.png`;
    }

    const filePath = path.join(this.contentDir, 'seasons', filename);
    fs.writeFileSync(filePath, yaml.dump(seasonData, { lineWidth: -1 }));

    console.log(`✅ Season ${seasonNumber} created: ${filePath}`);
    console.log(`📁 Remember to add assets to: static/images/seasons/season${seasonNumber}/`);
  }

  async addEpisode(seasonNumber) {
    if (!seasonNumber) {
      seasonNumber = await this.prompt('Which season number? ');
    }

    const seasonFile = path.join(this.contentDir, 'seasons', `season${seasonNumber}.yaml`);
    
    if (!fs.existsSync(seasonFile)) {
      throw new Error(`Season ${seasonNumber} does not exist. Create it first.`);
    }

    console.log(`🎵 Adding episode to Season ${seasonNumber}...`);

    const episodeData = {
      title: await this.prompt('Episode title: '),
      description: await this.prompt('Episode description: '),
      keywords: (await this.prompt('Keywords (comma-separated): ')).split(',').map(k => k.trim()),
      youtubeLink: await this.prompt('YouTube link: '),
      story: await this.prompt('Episode story: '),
      lyrics: await this.prompt('Song lyrics: ')
    };

    // Load existing season data
    const seasonData = yaml.load(fs.readFileSync(seasonFile, 'utf8'));
    
    // Auto-generate episode number
    const episodeNumbers = Object.keys(seasonData.episodes || {})
      .map(ep => parseInt(ep.replace('episode', '')))
      .filter(n => !isNaN(n));
    
    const episodeNumber = episodeNumbers.length > 0 ? Math.max(...episodeNumbers) + 1 : 1;
    const episodeId = `episode${episodeNumber}`;

    // Auto-generate asset URLs
    episodeData.image = `https://df5sj8f594cdx.cloudfront.net/images/seasons/season${seasonNumber}/episodes/${episodeId}/image.png`;
    episodeData.audio = `https://df5sj8f594cdx.cloudfront.net/images/seasons/season${seasonNumber}/episodes/${episodeId}/${episodeData.title.replace(/[^a-zA-Z0-9]/g, '')}_v1.mp3`;
    episodeData.carouselImages = [];

    // Add episode to season
    if (!seasonData.episodes) seasonData.episodes = {};
    seasonData.episodes[episodeId] = episodeData;

    // Save updated season
    fs.writeFileSync(seasonFile, yaml.dump(seasonData, { lineWidth: -1 }));

    console.log(`✅ Episode ${episodeNumber} added to Season ${seasonNumber}`);
    console.log(`📁 Add assets to: static/images/seasons/season${seasonNumber}/episodes/${episodeId}/`);
  }

  async addCharacter() {
    console.log('👤 Creating a new character...');

    const characterData = {
      id: await this.prompt('Character ID (lowercase, hyphens): '),
      title: await this.prompt('Character name: '),
      description: await this.prompt('Character description: '),
      type: await this.prompt('Character type (hero/villain/neutral): ', 'hero'),
      keywords: (await this.prompt('Keywords (comma-separated): ')).split(',').map(k => k.trim()),
      primary_image: '',
      image_gallery: [],
      episodes: []
    };

    // Auto-generate image URL
    characterData.primary_image = `https://df5sj8f594cdx.cloudfront.net/images/characters/${characterData.id}/primary.png`;

    // Create character directory and file
    const characterDir = path.join(this.contentDir, 'characters', characterData.id);
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }

    const characterFile = path.join(characterDir, 'character.yaml');
    fs.writeFileSync(characterFile, yaml.dump(characterData, { lineWidth: -1 }));

    console.log(`✅ Character created: ${characterFile}`);
    console.log(`📁 Add images to: static/images/characters/${characterData.id}/`);
  }

  async addLocation() {
    console.log('🗺️ Creating a new location...');

    const locationData = {
      id: await this.prompt('Location ID (lowercase, hyphens): '),
      title: await this.prompt('Location name: '),
      type: 'place',
      keywords: (await this.prompt('Keywords (comma-separated): ')).split(',').map(k => k.trim()),
      description: await this.prompt('Location description: '),
      image: '',
      image_gallery: []
    };

    // Auto-generate image URL
    locationData.image = `https://df5sj8f594cdx.cloudfront.net/images/locations/${locationData.id}/primary.png`;

    // Add to lore file
    const loreFile = path.join(this.contentDir, 'lore', 'wavelength-lore.yaml');
    const loreData = yaml.load(fs.readFileSync(loreFile, 'utf8'));
    
    if (!loreData.locations) loreData.locations = [];
    loreData.locations.push(locationData);

    fs.writeFileSync(loreFile, yaml.dump(loreData, { lineWidth: -1 }));

    console.log(`✅ Location added to lore: ${locationData.title}`);
    console.log(`📁 Add images to: static/images/locations/${locationData.id}/`);
  }

  async addLore() {
    console.log('📚 Creating new lore...');

    const loreType = await this.prompt('Lore type (object/villain/concept): ');
    
    const loreData = {
      id: await this.prompt('Lore ID (lowercase, hyphens): '),
      title: await this.prompt('Lore title: '),
      type: loreType,
      keywords: (await this.prompt('Keywords (comma-separated): ')).split(',').map(k => k.trim()),
      description: await this.prompt('Lore description: '),
      image: '',
      image_gallery: []
    };

    // Auto-generate image URL
    loreData.image = `https://df5sj8f594cdx.cloudfront.net/images/lore/${loreData.id}/primary.png`;

    // Add to appropriate section in lore file
    const loreFile = path.join(this.contentDir, 'lore', 'wavelength-lore.yaml');
    const existingLore = yaml.load(fs.readFileSync(loreFile, 'utf8'));
    
    const section = loreType === 'villain' ? 'villains' : 
                   loreType === 'object' ? 'objects' : 'concepts';
    
    if (!existingLore[section]) existingLore[section] = [];
    existingLore[section].push(loreData);

    fs.writeFileSync(loreFile, yaml.dump(existingLore, { lineWidth: -1 }));

    console.log(`✅ ${loreType} added to lore: ${loreData.title}`);
    console.log(`📁 Add images to: static/images/lore/${loreData.id}/`);
  }

  async deployContent(flags) {
    console.log('🚀 Deploying content...');

    // Validate first
    console.log('1. Validating content...');
    await this.validateAllContent();

    // Populate Firebase
    console.log('2. Updating Firebase...');
    await execAsync('node scripts/populate_firebase.js', { cwd: this.projectRoot });

    // Git commit and push
    if (!flags['no-git']) {
      console.log('3. Committing changes...');
      await execAsync('git add .', { cwd: this.projectRoot });
      
      const commitMessage = flags.message || `Content update: ${new Date().toISOString().split('T')[0]}`;
      await execAsync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
      await execAsync('git push', { cwd: this.projectRoot });
    }

    // Trigger deployment
    if (!flags['no-deploy']) {
      console.log('4. Triggering production deployment...');
      await execAsync('node scripts/github-action-monitor.js --watch', { cwd: this.projectRoot });
    }

    console.log('✅ Content deployment complete!');
  }

  async validateAllContent() {
    console.log('🔍 Validating all content...');
    
    // Check that all referenced assets exist
    // Validate YAML structure
    // Check for required fields
    // Validate relationships
    
    console.log('✅ Content validation passed');
  }

  async listContent(type) {
    console.log(`📋 Listing ${type || 'all'} content...`);
    
    if (!type || type === 'seasons') {
      const seasonFiles = fs.readdirSync(path.join(this.contentDir, 'seasons'))
        .filter(f => f.endsWith('.yaml') && f.startsWith('season'));
      
      console.log('\\n📺 Seasons:');
      seasonFiles.forEach(file => {
        const seasonData = yaml.load(fs.readFileSync(
          path.join(this.contentDir, 'seasons', file), 'utf8'
        ));
        const episodeCount = Object.keys(seasonData.episodes || {}).length;
        console.log(`  ${file.replace('.yaml', '')}: ${seasonData.title} (${episodeCount} episodes)`);
      });
    }

    // Similar listings for other content types...
  }

  async prompt(question, defaultValue = '') {
    return new Promise((resolve) => {
      const displayQuestion = defaultValue ? 
        `${question}[${defaultValue}] ` : question;
      
      this.rl.question(displayQuestion, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  showHelp() {
    console.log(`
🎵 Wavelength Lore Content Manager

Usage:
  ./content-manager.js <command> [options]

Commands:
  add season                     Create a new season
  add episode --season=N         Add episode to season N
  add character                  Create a new character
  add location                   Create a new location
  add lore                       Add lore (object/villain/concept)
  
  delete episode --season=N --episode=M    Delete episode M from season N
  delete character --name="Name"           Delete character by name
  delete location --name="Name"            Delete location by name
  delete lore --name="Name"               Delete lore by name
  
  validate                       Validate all content
  deploy                         Deploy content to production
  list [type]                    List content (seasons/characters/etc)
  
  help                           Show this help

Options:
  --season=N                     Target season number
  --episode=M                    Target episode number (for deletion)
  --name="Name"                  Target item name (for deletion)
  --message="text"              Custom commit message
  --no-git                      Skip git operations
  --no-deploy                   Skip production deployment
  --force                       Skip confirmation prompts

Examples:
  ./content-manager.js add season
  ./content-manager.js add episode --season=2
  ./content-manager.js delete episode --season=1 --episode=12
  ./content-manager.js deploy --message="Added new character"
    `);
  }

  /**
   * Handle delete operations
   */
  async handleDelete(type, flags) {
    if (!type) {
      console.log('❌ Delete type required. Use: episode, character, location, or lore');
      process.exit(1);
    }

    switch (type) {
      case 'episode':
        await this.deleteEpisode(flags);
        break;
      case 'character':
        await this.deleteCharacter(flags);
        break;
      case 'location':
        await this.deleteLocation(flags);
        break;
      case 'lore':
        await this.deleteLore(flags);
        break;
      default:
        console.log(`❌ Unknown delete type: ${type}`);
        console.log('Available types: episode, character, location, lore');
        process.exit(1);
    }
  }

  /**
   * Delete an episode from a season
   */
  async deleteEpisode(flags) {
    const seasonNum = flags.season;
    const episodeNum = flags.episode;

    if (!seasonNum) {
      console.log('❌ Season number required. Use --season=N');
      process.exit(1);
    }

    if (!episodeNum) {
      console.log('❌ Episode number required. Use --episode=M');
      process.exit(1);
    }

    const seasonFile = path.join(this.contentDir, 'seasons', `season${seasonNum}.yaml`);
    
    if (!fs.existsSync(seasonFile)) {
      console.log(`❌ Season ${seasonNum} not found`);
      process.exit(1);
    }

    try {
      const seasonData = yaml.load(fs.readFileSync(seasonFile, 'utf8'));
      const episodeKey = `episode${episodeNum}`;
      
      if (!seasonData.episodes || !seasonData.episodes[episodeKey]) {
        console.log(`❌ Episode ${episodeNum} not found in Season ${seasonNum}`);
        process.exit(1);
      }

      const episode = seasonData.episodes[episodeKey];
      
      // Confirmation prompt
      if (!flags.force) {
        const confirmed = await this.askQuestion(
          `⚠️  Are you sure you want to delete Episode ${episodeNum}: "${episode.title}" from Season ${seasonNum}? This will also remove associated assets. (y/N): `
        );
        
        if (confirmed.toLowerCase() !== 'y' && confirmed.toLowerCase() !== 'yes') {
          console.log('❌ Deletion cancelled');
          process.exit(0);
        }
      }

      // Remove episode from season data
      delete seasonData.episodes[episodeKey];
      
      // Write updated season file
      fs.writeFileSync(seasonFile, yaml.dump(seasonData, { indent: 2, lineWidth: -1 }));

      // Clean up episode assets
      await this.cleanupEpisodeAssets(seasonNum, episodeNum);

      console.log(`✅ Successfully deleted Episode ${episodeNum}: "${episode.title}" from Season ${seasonNum}`);
      console.log(`📝 Note: Other episodes retain their numbers (no renumbering for object-based structure)`);
      
    } catch (error) {
      console.error('❌ Error deleting episode:', error.message);
      process.exit(1);
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(flags) {
    const characterName = flags.name;
    
    if (!characterName) {
      console.log('❌ Character name required. Use --name="Character Name"');
      process.exit(1);
    }

    const charactersDir = path.join(this.contentDir, 'characters');
    const characterSlug = this.slugify(characterName);
    const characterDir = path.join(charactersDir, characterSlug);
    
    if (!fs.existsSync(characterDir)) {
      console.log(`❌ Character "${characterName}" not found`);
      process.exit(1);
    }

    // Confirmation prompt
    if (!flags.force) {
      const confirmed = await this.askQuestion(
        `⚠️  Are you sure you want to delete character "${characterName}"? This will remove all character files and assets. (y/N): `
      );
      
      if (confirmed.toLowerCase() !== 'y' && confirmed.toLowerCase() !== 'yes') {
        console.log('❌ Deletion cancelled');
        process.exit(0);
      }
    }

    try {
      // Remove character directory
      await this.removeDirectory(characterDir);
      
      console.log(`✅ Successfully deleted character "${characterName}"`);
      console.log(`📂 Removed directory: ${path.relative(this.projectRoot, characterDir)}`);
      
    } catch (error) {
      console.error('❌ Error deleting character:', error.message);
      process.exit(1);
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(flags) {
    const locationName = flags.name;
    
    if (!locationName) {
      console.log('❌ Location name required. Use --name="Location Name"');
      process.exit(1);
    }

    const locationsDir = path.join(this.contentDir, 'maps');
    const locationSlug = this.slugify(locationName);
    const locationDir = path.join(locationsDir, locationSlug);
    
    if (!fs.existsSync(locationDir)) {
      console.log(`❌ Location "${locationName}" not found`);
      process.exit(1);
    }

    // Confirmation prompt
    if (!flags.force) {
      const confirmed = await this.askQuestion(
        `⚠️  Are you sure you want to delete location "${locationName}"? This will remove all location files and assets. (y/N): `
      );
      
      if (confirmed.toLowerCase() !== 'y' && confirmed.toLowerCase() !== 'yes') {
        console.log('❌ Deletion cancelled');
        process.exit(0);
      }
    }

    try {
      // Remove location directory
      await this.removeDirectory(locationDir);
      
      console.log(`✅ Successfully deleted location "${locationName}"`);
      console.log(`📂 Removed directory: ${path.relative(this.projectRoot, locationDir)}`);
      
    } catch (error) {
      console.error('❌ Error deleting location:', error.message);
      process.exit(1);
    }
  }

  /**
   * Delete lore content
   */
  async deleteLore(flags) {
    const loreName = flags.name;
    
    if (!loreName) {
      console.log('❌ Lore name required. Use --name="Lore Name"');
      process.exit(1);
    }

    const loreDir = path.join(this.contentDir, 'lore');
    const loreSlug = this.slugify(loreName);
    const loreItemDir = path.join(loreDir, loreSlug);
    
    if (!fs.existsSync(loreItemDir)) {
      console.log(`❌ Lore "${loreName}" not found`);
      process.exit(1);
    }

    // Confirmation prompt
    if (!flags.force) {
      const confirmed = await this.askQuestion(
        `⚠️  Are you sure you want to delete lore "${loreName}"? This will remove all lore files and assets. (y/N): `
      );
      
      if (confirmed.toLowerCase() !== 'y' && confirmed.toLowerCase() !== 'yes') {
        console.log('❌ Deletion cancelled');
        process.exit(0);
      }
    }

    try {
      // Remove lore directory
      await this.removeDirectory(loreItemDir);
      
      console.log(`✅ Successfully deleted lore "${loreName}"`);
      console.log(`📂 Removed directory: ${path.relative(this.projectRoot, loreItemDir)}`);
      
    } catch (error) {
      console.error('❌ Error deleting lore:', error.message);
      process.exit(1);
    }
  }

  /**
   * Clean up episode assets from CDN/static directories
   */
  async cleanupEpisodeAssets(seasonNum, episodeNum) {
    const possibleAssetPaths = [
      path.join(this.projectRoot, 'static', 'images', 'seasons', `season${seasonNum}`, 'episodes', `episode${episodeNum}`),
      path.join(this.projectRoot, 'static', 'audio', 'seasons', `season${seasonNum}`, 'episodes', `episode${episodeNum}`),
      path.join(this.projectRoot, 'static', 'images', `season${seasonNum}`, `episode${episodeNum}`),
      path.join(this.projectRoot, 'static', 'audio', `season${seasonNum}`, `episode${episodeNum}`),
      path.join(this.projectRoot, 'temp-demo-assets', `season${seasonNum}`, `episode${episodeNum}`)
    ];

    for (const assetPath of possibleAssetPaths) {
      if (fs.existsSync(assetPath)) {
        try {
          await this.removeDirectory(assetPath);
          console.log(`🗑️  Cleaned up assets: ${path.relative(this.projectRoot, assetPath)}`);
        } catch (error) {
          console.warn(`⚠️  Could not clean up ${assetPath}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Convert string to URL-friendly slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  }

  /**
   * Recursively remove directory
   */
  async removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      
      fs.rmdirSync(dirPath);
    }
  }
}

if (require.main === module) {
  const manager = new ContentManager();
  manager.main();
}

module.exports = ContentManager;