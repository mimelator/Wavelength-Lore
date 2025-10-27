#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH FIREBASE SCHEMA ENHANCER - PHASE 2 CTA FEATURES
 * 
 * This script enhances the Firebase schema to support advanced CTA features:
 * - Character: tagline, stakes, cta_text fields
 * - Episodes: cliffhanger, next_episode_tease, discussion_prompt fields  
 * - Lore: intrigue_hook, mystery_level, investigation_cta fields
 * - Analytics: cta_engagement, user_journeys collections
 * 
 * Usage: node scripts/unified/firebase-schema-enhancer.js [options]
 * 
 * Options:
 *   --dry-run          Show what would be updated without making changes
 *   --characters       Update only character schema
 *   --episodes         Update only episode schema  
 *   --lore             Update only lore schema
 *   --analytics        Update only analytics schema
 *   --backup           Create backup before changes
 *   --rollback         Rollback to previous backup
 * 
 * Examples:
 *   node scripts/unified/firebase-schema-enhancer.js --dry-run
 *   node scripts/unified/firebase-schema-enhancer.js --characters --backup
 *   node scripts/unified/firebase-schema-enhancer.js --rollback
 */

require('dotenv').config();
const firebaseAdminUtils = require('../../helpers/firebase-admin-utils');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin
firebaseAdminUtils.initializeFirebaseAdmin();
const admin = require('firebase-admin');
const db = admin.database();

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  charactersOnly: args.includes('--characters'),
  episodesOnly: args.includes('--episodes'),
  loreOnly: args.includes('--lore'),
  analyticsOnly: args.includes('--analytics'),
  backup: args.includes('--backup'),
  rollback: args.includes('--rollback')
};

// Determine what to update
const shouldUpdateCharacters = !flags.episodesOnly && !flags.loreOnly && !flags.analyticsOnly;
const shouldUpdateEpisodes = !flags.charactersOnly && !flags.loreOnly && !flags.analyticsOnly;
const shouldUpdateLore = !flags.charactersOnly && !flags.episodesOnly && !flags.analyticsOnly;
const shouldUpdateAnalytics = !flags.charactersOnly && !flags.episodesOnly && !flags.loreOnly;

console.log('🌊 WAVELENGTH FIREBASE SCHEMA ENHANCER - PHASE 2 CTA FEATURES');
console.log('━'.repeat(80));

/**
 * Create backup of current data
 */
async function createBackup() {
  console.log('💾 Creating backup...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups/schema-enhancement');
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    
    // Backup characters
    if (shouldUpdateCharacters) {
      const charactersSnapshot = await db.ref('characters').once('value');
      const charactersData = charactersSnapshot.val();
      if (charactersData) {
        await fs.writeFile(
          path.join(backupDir, `characters-${timestamp}.json`),
          JSON.stringify(charactersData, null, 2)
        );
        console.log('  ✅ Characters backup created');
      }
    }
    
    // Backup episodes  
    if (shouldUpdateEpisodes) {
      const videosSnapshot = await db.ref('videos').once('value');
      const videosData = videosSnapshot.val();
      if (videosData) {
        await fs.writeFile(
          path.join(backupDir, `videos-${timestamp}.json`),
          JSON.stringify(videosData, null, 2)
        );
        console.log('  ✅ Episodes backup created');
      }
    }
    
    // Backup lore
    if (shouldUpdateLore) {
      const loreSnapshot = await db.ref('lore').once('value');
      const loreData = loreSnapshot.val();
      if (loreData) {
        await fs.writeFile(
          path.join(backupDir, `lore-${timestamp}.json`),
          JSON.stringify(loreData, null, 2)
        );
        console.log('  ✅ Lore backup created');
      }
    }
    
    console.log(`💾 Backup completed: ${backupDir}`);
    return timestamp;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Enhance character schema with CTA fields
 */
async function enhanceCharacterSchema() {
  console.log('🦸 Enhancing character schema...');
  
  const charactersRef = db.ref('characters');
  const snapshot = await charactersRef.once('value');
  const charactersData = snapshot.val();
  
  if (!charactersData) {
    console.log('  ⚠️  No characters found');
    return;
  }
  
  let updateCount = 0;
  const updates = {};
  
  for (const [characterId, character] of Object.entries(charactersData)) {
    const characterUpdates = {};
    let hasUpdates = false;
    
    // Add tagline field
    if (!character.tagline) {
      characterUpdates.tagline = generateCharacterTagline(character);
      hasUpdates = true;
    }
    
    // Add stakes field
    if (!character.stakes) {
      characterUpdates.stakes = generateCharacterStakes(character);
      hasUpdates = true;
    }
    
    // Add cta_text field
    if (!character.cta_text) {
      characterUpdates.cta_text = generateCharacterCTA(character);
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      updates[`characters/${characterId}`] = { ...character, ...characterUpdates };
      updateCount++;
      
      if (flags.dryRun) {
        console.log(`  📝 Would update ${character.title}:`, characterUpdates);
      }
    }
  }
  
  if (!flags.dryRun && Object.keys(updates).length > 0) {
    await db.ref().update(updates);
    console.log(`  ✅ Updated ${updateCount} characters with CTA fields`);
  } else if (flags.dryRun) {
    console.log(`  📋 Would update ${updateCount} characters`);
  } else {
    console.log('  ℹ️  All characters already have CTA fields');
  }
}

/**
 * Enhance episode schema with CTA fields
 */
async function enhanceEpisodeSchema() {
  console.log('🎬 Enhancing episode schema...');
  
  const videosRef = db.ref('videos');
  const snapshot = await videosRef.once('value');
  const videosData = snapshot.val();
  
  if (!videosData) {
    console.log('  ⚠️  No episodes found');
    return;
  }
  
  let updateCount = 0;
  const updates = {};
  
  for (const [seasonId, season] of Object.entries(videosData)) {
    if (season.episodes) {
      for (const [episodeId, episode] of Object.entries(season.episodes)) {
        const episodeUpdates = {};
        let hasUpdates = false;
        
        // Add cliffhanger field
        if (!episode.cliffhanger) {
          episodeUpdates.cliffhanger = generateEpisodeCliffhanger(episode);
          hasUpdates = true;
        }
        
        // Add next_episode_tease field
        if (!episode.next_episode_tease) {
          episodeUpdates.next_episode_tease = generateNextEpisodeTease(episode, seasonId, episodeId);
          hasUpdates = true;
        }
        
        // Add discussion_prompt field
        if (!episode.discussion_prompt) {
          episodeUpdates.discussion_prompt = generateDiscussionPrompt(episode);
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          updates[`videos/${seasonId}/episodes/${episodeId}`] = { ...episode, ...episodeUpdates };
          updateCount++;
          
          if (flags.dryRun) {
            console.log(`  📝 Would update ${episode.title}:`, episodeUpdates);
          }
        }
      }
    }
  }
  
  if (!flags.dryRun && Object.keys(updates).length > 0) {
    await db.ref().update(updates);
    console.log(`  ✅ Updated ${updateCount} episodes with CTA fields`);
  } else if (flags.dryRun) {
    console.log(`  📋 Would update ${updateCount} episodes`);
  } else {
    console.log('  ℹ️  All episodes already have CTA fields');
  }
}

/**
 * Enhance lore schema with CTA fields
 */
async function enhanceLoreSchema() {
  console.log('📚 Enhancing lore schema...');
  
  const loreRef = db.ref('lore');
  const snapshot = await loreRef.once('value');
  const loreData = snapshot.val();
  
  if (!loreData) {
    console.log('  ⚠️  No lore found');
    return;
  }
  
  let updateCount = 0;
  const updates = {};
  
  for (const [loreId, lore] of Object.entries(loreData)) {
    const loreUpdates = {};
    let hasUpdates = false;
    
    // Add intrigue_hook field
    if (!lore.intrigue_hook) {
      loreUpdates.intrigue_hook = generateIntrigueHook(lore);
      hasUpdates = true;
    }
    
    // Add mystery_level field
    if (!lore.mystery_level) {
      loreUpdates.mystery_level = assignMysteryLevel(lore);
      hasUpdates = true;
    }
    
    // Add investigation_cta field
    if (!lore.investigation_cta) {
      loreUpdates.investigation_cta = generateInvestigationCTA(lore);
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      updates[`lore/${loreId}`] = { ...lore, ...loreUpdates };
      updateCount++;
      
      if (flags.dryRun) {
        console.log(`  📝 Would update ${lore.title}:`, loreUpdates);
      }
    }
  }
  
  if (!flags.dryRun && Object.keys(updates).length > 0) {
    await db.ref().update(updates);
    console.log(`  ✅ Updated ${updateCount} lore items with CTA fields`);
  } else if (flags.dryRun) {
    console.log(`  📋 Would update ${updateCount} lore items`);
  } else {
    console.log('  ℹ️  All lore already has CTA fields');
  }
}

/**
 * Create analytics schema
 */
async function createAnalyticsSchema() {
  console.log('📊 Creating analytics schema...');
  
  const analyticsRef = db.ref('analytics');
  const snapshot = await analyticsRef.once('value');
  const existingData = snapshot.val();
  
  if (existingData) {
    console.log('  ℹ️  Analytics schema already exists');
    return;
  }
  
  const analyticsSchema = {
    cta_engagement: {
      '.info': 'Tracks CTA click events and engagement metrics',
      homepage: { clicks: 0, views: 0, conversion_rate: 0 },
      episodes: { clicks: 0, views: 0, conversion_rate: 0 },
      characters: { clicks: 0, views: 0, conversion_rate: 0 },
      navigation: { clicks: 0, views: 0, conversion_rate: 0 },
      footer: { clicks: 0, views: 0, conversion_rate: 0 }
    },
    user_journeys: {
      '.info': 'Tracks user navigation patterns and conversion funnels',
      homepage_to_episode: 0,
      episode_to_character: 0,
      character_to_lore: 0,
      navigation_usage: 0,
      footer_engagement: 0
    },
    ab_tests: {
      '.info': 'A/B testing results for CTA variations',
      active_tests: {},
      completed_tests: {}
    }
  };
  
  if (!flags.dryRun) {
    await analyticsRef.set(analyticsSchema);
    console.log('  ✅ Analytics schema created');
  } else {
    console.log('  📋 Would create analytics schema:', Object.keys(analyticsSchema));
  }
}

/**
 * Generate character tagline based on description
 */
function generateCharacterTagline(character) {
  const taglines = [
    `${character.title}: Where mystery meets music`,
    `Discover the secrets of ${character.title}`,
    `${character.title}'s story awaits your exploration`,
    `Uncover ${character.title}'s role in the Wavelength universe`,
    `${character.title}: A key player in the unfolding mystery`
  ];
  
  // Choose based on character title hash for consistency
  const hash = character.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return taglines[hash % taglines.length];
}

/**
 * Generate character stakes
 */
function generateCharacterStakes(character) {
  const stakes = [
    `Every choice ${character.title} makes ripples through the Wavelength universe`,
    `${character.title}'s actions determine the fate of those around them`,
    `The mysteries surrounding ${character.title} hold the key to everything`,
    `${character.title}'s journey could change the course of destiny`,
    `What ${character.title} discovers next will shock you`
  ];
  
  const hash = character.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return stakes[hash % stakes.length];
}

/**
 * Generate character CTA text
 */
function generateCharacterCTA(character) {
  const ctas = [
    `Dive into ${character.title}'s world`,
    `Uncover ${character.title}'s secrets`,
    `Follow ${character.title}'s journey`,
    `Explore ${character.title}'s story`,
    `Discover ${character.title}'s mysteries`
  ];
  
  const hash = character.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return ctas[hash % ctas.length];
}

/**
 * Generate episode cliffhanger
 */
function generateEpisodeCliffhanger(episode) {
  const cliffhangers = [
    `But what happens next will leave you breathless...`,
    `The truth behind this episode changes everything`,
    `You won't believe what's revealed in the next episode`,
    `This mystery is just the beginning`,
    `The shocking conclusion awaits in the next chapter`
  ];
  
  const hash = episode.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return cliffhangers[hash % cliffhangers.length];
}

/**
 * Generate next episode tease
 */
function generateNextEpisodeTease(episode, seasonId, episodeId) {
  const teases = [
    `Next episode: The mystery deepens and secrets are revealed`,
    `Coming up: Discoveries that will change everything`,
    `Next time: The story takes an unexpected turn`,
    `In the next episode: Answers lead to bigger questions`,
    `Stay tuned: The adventure continues with stunning revelations`
  ];
  
  const hash = episode.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return teases[hash % teases.length];
}

/**
 * Generate discussion prompt
 */
function generateDiscussionPrompt(episode) {
  const prompts = [
    `What did you think of the revelations in "${episode.title}"?`,
    `Which moment in "${episode.title}" surprised you the most?`,
    `How do you think "${episode.title}" connects to the larger story?`,
    `What theories do you have after watching "${episode.title}"?`,
    `What was your favorite part of "${episode.title}"?`
  ];
  
  const hash = episode.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return prompts[hash % prompts.length];
}

/**
 * Generate intrigue hook for lore
 */
function generateIntrigueHook(lore) {
  const hooks = [
    `The secrets of ${lore.title} run deeper than anyone imagines`,
    `${lore.title} holds mysteries that could change everything`,
    `What you don't know about ${lore.title} will astound you`,
    `The true nature of ${lore.title} is more complex than it appears`,
    `${lore.title} conceals secrets that span across episodes`
  ];
  
  const hash = lore.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return hooks[hash % hooks.length];
}

/**
 * Assign mystery level
 */
function assignMysteryLevel(lore) {
  const levels = ['surface', 'hidden', 'deep', 'profound', 'cosmic'];
  const hash = lore.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return levels[hash % levels.length];
}

/**
 * Generate investigation CTA
 */
function generateInvestigationCTA(lore) {
  const ctas = [
    `Investigate ${lore.title} further`,
    `Uncover the truth about ${lore.title}`,
    `Dive deeper into ${lore.title}`,
    `Explore the mysteries of ${lore.title}`,
    `Discover what ${lore.title} really means`
  ];
  
  const hash = lore.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return ctas[hash % ctas.length];
}

/**
 * Update Firebase security rules
 */
async function updateSecurityRules() {
  console.log('🔒 Updating Firebase security rules...');
  
  const newRules = {
    "rules": {
      "characters": {
        ".read": true,
        "$characterId": {
          "tagline": { ".validate": "newData.isString() && newData.val().length <= 100" },
          "stakes": { ".validate": "newData.isString() && newData.val().length <= 200" },
          "cta_text": { ".validate": "newData.isString() && newData.val().length <= 150" },
          ".write": "auth != null && (auth.token.isScript == true || auth.token.content_manager == true)"
        }
      },
      "videos": {
        ".read": true,
        "$seasonId": {
          "episodes": {
            "$episodeId": {
              "cliffhanger": { ".validate": "newData.isString()" },
              "next_episode_tease": { ".validate": "newData.isString()" },
              "discussion_prompt": { ".validate": "newData.isString()" },
              ".write": "auth != null && (auth.token.isScript == true || auth.token.content_manager == true)"
            }
          }
        }
      },
      "lore": {
        ".read": true,
        "$loreId": {
          "intrigue_hook": { ".validate": "newData.isString() && newData.val().length <= 200" },
          "mystery_level": { ".validate": "newData.isString()" },
          "investigation_cta": { ".validate": "newData.isString()" },
          ".write": "auth != null && (auth.token.isScript == true || auth.token.content_manager == true)"
        }
      },
      "analytics": {
        ".read": "auth != null && (auth.token.admin == true || auth.token.content_manager == true)",
        ".write": "auth != null && (auth.token.admin == true || auth.token.content_manager == true)"
      }
    }
  };
  
  if (!flags.dryRun) {
    // Note: This would require additional Firebase Admin SDK setup for rules management
    console.log('  ⚠️  Security rules update requires manual deployment');
    console.log('  💡 Run: firebase deploy --only database');
  } else {
    console.log('  📋 Would update security rules for new fields');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    if (flags.rollback) {
      console.log('🔄 Rollback functionality not yet implemented');
      console.log('💡 Please restore from backup files manually if needed');
      process.exit(0);
    }
    
    let backupTimestamp;
    if (flags.backup && !flags.dryRun) {
      backupTimestamp = await createBackup();
    }
    
    if (flags.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }
    
    // Update schemas
    if (shouldUpdateCharacters) {
      await enhanceCharacterSchema();
    }
    
    if (shouldUpdateEpisodes) {
      await enhanceEpisodeSchema();
    }
    
    if (shouldUpdateLore) {
      await enhanceLoreSchema();
    }
    
    if (shouldUpdateAnalytics) {
      await createAnalyticsSchema();
    }
    
    // Update security rules
    if (!flags.dryRun) {
      await updateSecurityRules();
    }
    
    console.log('\n🎉 SCHEMA ENHANCEMENT COMPLETE!');
    console.log('━'.repeat(80));
    
    if (flags.dryRun) {
      console.log('📋 This was a dry run - no changes were made');
      console.log('💡 Remove --dry-run flag to apply changes');
    } else {
      console.log('✅ Firebase schema enhanced with Phase 2 CTA features');
      if (backupTimestamp) {
        console.log(`💾 Backup created with timestamp: ${backupTimestamp}`);
      }
      console.log('🔄 Your Wavelength app now supports advanced CTAs!');
    }
    
  } catch (error) {
    console.error('❌ Schema enhancement failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the enhancer
if (require.main === module) {
  main();
}

module.exports = {
  enhanceCharacterSchema,
  enhanceEpisodeSchema,
  enhanceLoreSchema,
  createAnalyticsSchema
};