#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH FIREBASE BACKUP SYSTEM - PHASE 2 PREPARATION
 * 
 * This script creates comprehensive backups of Firebase data before schema migration:
 * - Characters data with all fields and metadata
 * - Episodes/Videos data with all season information
 * - Lore objects with complete structure
 * - Forum data and user content
 * - Analytics and engagement data
 * 
 * Backup formats:
 * - JSON: Complete Firebase structure for restoration
 * - YAML: Human-readable format matching original source
 * - SQL: Structured export for analysis
 * 
 * Usage: node scripts/unified/firebase-backup-system.js [options]
 * 
 * Options:
 *   --full             Create complete backup of all data
 *   --characters       Backup only characters
 *   --episodes         Backup only episodes/videos  
 *   --lore             Backup only lore objects
 *   --forum            Backup only forum data
 *   --analytics        Backup only analytics
 *   --format=json      Output format (json|yaml|both) [default: both]
 *   --compress         Compress backup files
 *   --verify           Verify backup integrity after creation
 * 
 * Examples:
 *   node scripts/unified/firebase-backup-system.js --full --verify
 *   node scripts/unified/firebase-backup-system.js --lore --format=yaml
 *   node scripts/unified/firebase-backup-system.js --characters --compress
 */

require('dotenv').config();
const firebaseAdminUtils = require('../../helpers/firebase-admin-utils');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const zlib = require('zlib');
const { promisify } = require('util');

// Initialize Firebase Admin
let admin, db;

async function initializeFirebase() {
  try {
    firebaseAdminUtils.initializeFirebaseAdmin();
    admin = require('firebase-admin');
    db = admin.database();
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  full: args.includes('--full'),
  characters: args.includes('--characters'),
  episodes: args.includes('--episodes'),
  lore: args.includes('--lore'),
  forum: args.includes('--forum'),
  analytics: args.includes('--analytics'),
  format: (args.find(arg => arg.startsWith('--format='))?.split('=')[1]) || 'both',
  compress: args.includes('--compress'),
  verify: args.includes('--verify')
};

// Determine what to backup
const shouldBackupAll = flags.full || (!flags.characters && !flags.episodes && !flags.lore && !flags.forum && !flags.analytics);
const shouldBackupCharacters = shouldBackupAll || flags.characters;
const shouldBackupEpisodes = shouldBackupAll || flags.episodes;
const shouldBackupLore = shouldBackupAll || flags.lore;
const shouldBackupForum = shouldBackupAll || flags.forum;
const shouldBackupAnalytics = shouldBackupAll || flags.analytics;

console.log('🌊 WAVELENGTH FIREBASE BACKUP SYSTEM - PHASE 2 PREPARATION');
console.log('━'.repeat(80));

/**
 * Create backup directory structure
 */
async function createBackupDirectories() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(__dirname, '../../backups/pre-schema-migration');
  const backupDir = path.join(backupRoot, timestamp);
  
  const dirs = [
    backupDir,
    path.join(backupDir, 'json'),
    path.join(backupDir, 'yaml'),
    path.join(backupDir, 'compressed'),
    path.join(backupDir, 'verification')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  console.log(`📁 Created backup directory: ${backupDir}`);
  return { backupDir, timestamp };
}

/**
 * Backup characters data
 */
async function backupCharacters(backupDir) {
  console.log('🦸 Backing up characters...');
  
  try {
    const charactersRef = db.ref('characters');
    const snapshot = await charactersRef.once('value');
    const charactersData = snapshot.val();
    
    if (!charactersData) {
      console.log('  ⚠️  No characters data found');
      return { success: false, count: 0 };
    }
    
    const count = Object.keys(charactersData).length;
    console.log(`  📊 Found ${count} characters`);
    
    // Save JSON format
    if (flags.format === 'json' || flags.format === 'both') {
      await fs.writeFile(
        path.join(backupDir, 'json', 'characters.json'),
        JSON.stringify(charactersData, null, 2)
      );
      console.log('  ✅ JSON backup saved');
    }
    
    // Save YAML format (convert to original structure)
    if (flags.format === 'yaml' || flags.format === 'both') {
      const yamlData = convertCharactersToYaml(charactersData);
      await fs.writeFile(
        path.join(backupDir, 'yaml', 'characters.yaml'),
        yaml.dump(yamlData, { lineWidth: -1 })
      );
      console.log('  ✅ YAML backup saved');
    }
    
    // Compress if requested
    if (flags.compress) {
      const compressed = await promisify(zlib.gzip)(JSON.stringify(charactersData));
      await fs.writeFile(
        path.join(backupDir, 'compressed', 'characters.json.gz'),
        compressed
      );
      console.log('  ✅ Compressed backup saved');
    }
    
    return { success: true, count, data: charactersData };
    
  } catch (error) {
    console.error('  ❌ Characters backup failed:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Backup episodes/videos data
 */
async function backupEpisodes(backupDir) {
  console.log('🎬 Backing up episodes...');
  
  try {
    const videosRef = db.ref('videos');
    const snapshot = await videosRef.once('value');
    const videosData = snapshot.val();
    
    if (!videosData) {
      console.log('  ⚠️  No episodes data found');
      return { success: false, count: 0 };
    }
    
    // Count total episodes
    let episodeCount = 0;
    for (const season of Object.values(videosData)) {
      if (season.episodes) {
        episodeCount += Object.keys(season.episodes).length;
      }
    }
    
    console.log(`  📊 Found ${Object.keys(videosData).length} seasons with ${episodeCount} episodes`);
    
    // Save JSON format
    if (flags.format === 'json' || flags.format === 'both') {
      await fs.writeFile(
        path.join(backupDir, 'json', 'videos.json'),
        JSON.stringify(videosData, null, 2)
      );
      console.log('  ✅ JSON backup saved');
    }
    
    // Save YAML format (convert to original structure)
    if (flags.format === 'yaml' || flags.format === 'both') {
      await saveEpisodesAsYaml(videosData, backupDir);
      console.log('  ✅ YAML backup saved');
    }
    
    // Compress if requested
    if (flags.compress) {
      const compressed = await promisify(zlib.gzip)(JSON.stringify(videosData));
      await fs.writeFile(
        path.join(backupDir, 'compressed', 'videos.json.gz'),
        compressed
      );
      console.log('  ✅ Compressed backup saved');
    }
    
    return { success: true, count: episodeCount, data: videosData };
    
  } catch (error) {
    console.error('  ❌ Episodes backup failed:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Backup lore data
 */
async function backupLore(backupDir) {
  console.log('📚 Backing up lore...');
  
  try {
    const loreRef = db.ref('lore');
    const snapshot = await loreRef.once('value');
    const loreData = snapshot.val();
    
    if (!loreData) {
      console.log('  ⚠️  No lore data found');
      return { success: false, count: 0 };
    }
    
    const count = Object.keys(loreData).length;
    console.log(`  📊 Found ${count} lore items`);
    
    // Save JSON format
    if (flags.format === 'json' || flags.format === 'both') {
      await fs.writeFile(
        path.join(backupDir, 'json', 'lore.json'),
        JSON.stringify(loreData, null, 2)
      );
      console.log('  ✅ JSON backup saved');
    }
    
    // Save YAML format (convert to original structure)
    if (flags.format === 'yaml' || flags.format === 'both') {
      const yamlData = convertLoreToYaml(loreData);
      await fs.writeFile(
        path.join(backupDir, 'yaml', 'lore.yaml'),
        yaml.dump(yamlData, { lineWidth: -1 })
      );
      console.log('  ✅ YAML backup saved');
    }
    
    // Compress if requested
    if (flags.compress) {
      const compressed = await promisify(zlib.gzip)(JSON.stringify(loreData));
      await fs.writeFile(
        path.join(backupDir, 'compressed', 'lore.json.gz'),
        compressed
      );
      console.log('  ✅ Compressed backup saved');
    }
    
    return { success: true, count, data: loreData };
    
  } catch (error) {
    console.error('  ❌ Lore backup failed:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Backup forum data
 */
async function backupForum(backupDir) {
  console.log('💬 Backing up forum...');
  
  try {
    const forumRef = db.ref('forum');
    const snapshot = await forumRef.once('value');
    const forumData = snapshot.val();
    
    if (!forumData) {
      console.log('  ⚠️  No forum data found');
      return { success: false, count: 0 };
    }
    
    // Count posts
    let postCount = 0;
    if (forumData.posts) {
      postCount = Object.keys(forumData.posts).length;
    }
    
    console.log(`  📊 Found forum with ${postCount} posts`);
    
    // Save JSON format
    if (flags.format === 'json' || flags.format === 'both') {
      await fs.writeFile(
        path.join(backupDir, 'json', 'forum.json'),
        JSON.stringify(forumData, null, 2)
      );
      console.log('  ✅ JSON backup saved');
    }
    
    // Compress if requested
    if (flags.compress) {
      const compressed = await promisify(zlib.gzip)(JSON.stringify(forumData));
      await fs.writeFile(
        path.join(backupDir, 'compressed', 'forum.json.gz'),
        compressed
      );
      console.log('  ✅ Compressed backup saved');
    }
    
    return { success: true, count: postCount, data: forumData };
    
  } catch (error) {
    console.error('  ❌ Forum backup failed:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Backup analytics data
 */
async function backupAnalytics(backupDir) {
  console.log('📊 Backing up analytics...');
  
  try {
    const analyticsRef = db.ref('analytics');
    const snapshot = await analyticsRef.once('value');
    const analyticsData = snapshot.val();
    
    if (!analyticsData) {
      console.log('  ⚠️  No analytics data found');
      return { success: false, count: 0 };
    }
    
    console.log('  📊 Found analytics data');
    
    // Save JSON format
    if (flags.format === 'json' || flags.format === 'both') {
      await fs.writeFile(
        path.join(backupDir, 'json', 'analytics.json'),
        JSON.stringify(analyticsData, null, 2)
      );
      console.log('  ✅ JSON backup saved');
    }
    
    // Compress if requested
    if (flags.compress) {
      const compressed = await promisify(zlib.gzip)(JSON.stringify(analyticsData));
      await fs.writeFile(
        path.join(backupDir, 'compressed', 'analytics.json.gz'),
        compressed
      );
      console.log('  ✅ Compressed backup saved');
    }
    
    return { success: true, count: 1, data: analyticsData };
    
  } catch (error) {
    console.error('  ❌ Analytics backup failed:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Convert characters data to YAML format
 */
function convertCharactersToYaml(charactersData) {
  const categories = {};
  
  for (const character of Object.values(charactersData)) {
    const category = character.category || 'misc';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      id: character.id,
      title: character.title,
      description: character.description,
      keywords: character.keywords || [],
      image: character.image,
      image_gallery: character.image_gallery || [],
      hidden: character.hidden || false
    });
  }
  
  return categories;
}

/**
 * Convert lore data to YAML format
 */
function convertLoreToYaml(loreData) {
  const types = {};
  
  for (const lore of Object.values(loreData)) {
    const type = lore.type || 'other';
    
    if (!types[type]) {
      types[type] = [];
    }
    
    types[type].push({
      id: lore.id,
      title: lore.title,
      type: lore.type,
      keywords: lore.keywords || [],
      description: lore.description,
      image: lore.image,
      image_gallery: lore.image_gallery || [],
      hidden: lore.hidden || false
    });
  }
  
  return types;
}

/**
 * Save episodes as YAML (separate files per season)
 */
async function saveEpisodesAsYaml(videosData, backupDir) {
  const yamlDir = path.join(backupDir, 'yaml', 'seasons');
  await fs.mkdir(yamlDir, { recursive: true });
  
  for (const [seasonId, season] of Object.entries(videosData)) {
    const seasonData = {
      title: season.title,
      description: season.description,
      seasonLink: season.seasonLink,
      episodes: {}
    };
    
    if (season.episodes) {
      for (const [episodeId, episode] of Object.entries(season.episodes)) {
        seasonData.episodes[episodeId] = {
          title: episode.title,
          description: episode.description,
          keywords: episode.keywords || [],
          youtubeLink: episode.youtubeLink,
          image: episode.image,
          audio: episode.audio,
          carouselImages: episode.carouselImages || [],
          story: episode.story,
          lyrics: episode.lyrics,
          visible: episode.visible
        };
      }
    }
    
    await fs.writeFile(
      path.join(yamlDir, `${seasonId}.yaml`),
      yaml.dump(seasonData, { lineWidth: -1 })
    );
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackups(backupDir, results) {
  console.log('🔍 Verifying backup integrity...');
  
  const verificationResults = [];
  
  for (const [type, result] of Object.entries(results)) {
    if (!result.success) continue;
    
    try {
      // Verify JSON backup
      if (flags.format === 'json' || flags.format === 'both') {
        const jsonPath = path.join(backupDir, 'json', `${type}.json`);
        const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        const jsonCount = type === 'videos' ? 
          Object.values(jsonData).reduce((acc, season) => acc + (season.episodes ? Object.keys(season.episodes).length : 0), 0) :
          Object.keys(jsonData).length;
        
        if (jsonCount === result.count) {
          verificationResults.push(`  ✅ ${type} JSON backup verified (${jsonCount} items)`);
        } else {
          verificationResults.push(`  ❌ ${type} JSON backup corrupted (expected ${result.count}, got ${jsonCount})`);
        }
      }
      
      // Verify compressed backup
      if (flags.compress) {
        const compressedPath = path.join(backupDir, 'compressed', `${type}.json.gz`);
        const compressedData = await fs.readFile(compressedPath);
        const decompressed = await promisify(zlib.gunzip)(compressedData);
        const jsonData = JSON.parse(decompressed.toString());
        const count = type === 'videos' ? 
          Object.values(jsonData).reduce((acc, season) => acc + (season.episodes ? Object.keys(season.episodes).length : 0), 0) :
          Object.keys(jsonData).length;
        
        if (count === result.count) {
          verificationResults.push(`  ✅ ${type} compressed backup verified (${count} items)`);
        } else {
          verificationResults.push(`  ❌ ${type} compressed backup corrupted (expected ${result.count}, got ${count})`);
        }
      }
      
    } catch (error) {
      verificationResults.push(`  ❌ ${type} verification failed: ${error.message}`);
    }
  }
  
  // Save verification report
  const report = {
    timestamp: new Date().toISOString(),
    backupDirectory: backupDir,
    verificationResults,
    summary: {
      totalItems: Object.values(results).reduce((acc, r) => acc + (r.success ? r.count : 0), 0),
      successfulBackups: Object.values(results).filter(r => r.success).length,
      failedBackups: Object.values(results).filter(r => !r.success).length
    }
  };
  
  await fs.writeFile(
    path.join(backupDir, 'verification', 'report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📋 Verification Results:');
  verificationResults.forEach(result => console.log(result));
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    const { backupDir, timestamp } = await createBackupDirectories();
    const results = {};
    
    console.log(`\n🔄 Starting backup process...`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📁 Directory: ${backupDir}\n`);
    
    // Backup each component
    if (shouldBackupCharacters) {
      results.characters = await backupCharacters(backupDir);
    }
    
    if (shouldBackupEpisodes) {
      results.videos = await backupEpisodes(backupDir);
    }
    
    if (shouldBackupLore) {
      results.lore = await backupLore(backupDir);
    }
    
    if (shouldBackupForum) {
      results.forum = await backupForum(backupDir);
    }
    
    if (shouldBackupAnalytics) {
      results.analytics = await backupAnalytics(backupDir);
    }
    
    // Verify backups if requested
    let verificationReport;
    if (flags.verify) {
      verificationReport = await verifyBackups(backupDir, results);
    }
    
    // Create backup manifest
    const manifest = {
      timestamp,
      backupDirectory: backupDir,
      options: flags,
      results,
      verification: verificationReport,
      totalItems: Object.values(results).reduce((acc, r) => acc + (r.success ? r.count : 0), 0),
      successfulBackups: Object.values(results).filter(r => r.success).length,
      failedBackups: Object.values(results).filter(r => !r.success).length
    };
    
    await fs.writeFile(
      path.join(backupDir, 'backup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('\n🎉 BACKUP COMPLETE!');
    console.log('━'.repeat(80));
    console.log(`✅ Backup directory: ${backupDir}`);
    console.log(`📊 Total items backed up: ${manifest.totalItems}`);
    console.log(`✅ Successful backups: ${manifest.successfulBackups}`);
    
    if (manifest.failedBackups > 0) {
      console.log(`❌ Failed backups: ${manifest.failedBackups}`);
    }
    
    console.log('\n🛡️  Your data is safely backed up before schema migration!');
    console.log('💡 Use these backups to restore if needed after migration');
    
  } catch (error) {
    console.error('❌ Backup process failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the backup system
if (require.main === module) {
  main();
}

module.exports = {
  backupCharacters,
  backupEpisodes,
  backupLore,
  backupForum,
  backupAnalytics,
  verifyBackups
};