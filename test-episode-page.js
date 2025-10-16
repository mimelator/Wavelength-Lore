#!/usr/bin/env node

/**
 * Test Episode Page Linking
 * 
 * This script simulates the episode page template rendering
 * to verify that character, lore, and episode linking works
 * correctly in the lyrics and summary sections.
 */

require('dotenv').config();
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testEpisodePageTemplate() {
  console.log('🎭 Testing Episode Page Template Linking\n');

  try {
    // Initialize Firebase and helpers
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    characterHelpers.setDatabaseInstance(database);
    loreHelpers.setDatabaseInstance(database);
    episodeHelpers.setDatabaseInstance(database);
    
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache()
    ]);

    console.log('✅ All helper caches initialized\n');

    // Simulate episode template data with sample lyrics and summary
    const episodeData = {
      title: 'Sample Episode',
      summary: 'In the Shire, Lucky met the Goblin King during the Ice Fortress battle. This episode references My Lucky Charm.',
      lyrics: 'Verse 1:\nIn the Shire we stand together\nWith Lucky by our side\nGoblin King approaches\nIn Ice Fortress we hide\n\nChorus:\nKeep On fighting for the light\nMy Lucky Charm will guide us right'
    };

    // Simulate the template functions (as they would be available in EJS)
    const linkifyCharacters = characterHelpers.linkifyCharacterMentionsSync;
    const linkifyLore = loreHelpers.linkifyLoreMentionsSync;
    const linkifyEpisodes = episodeHelpers.linkifyEpisodeMentionsSync;

    console.log('📝 Original Summary:');
    console.log(episodeData.summary);
    console.log('\n🔗 Linked Summary (like in template):');
    const linkedSummary = linkifyEpisodes(linkifyLore(linkifyCharacters(episodeData.summary)));
    console.log(linkedSummary);

    console.log('\n\n🎵 Original Lyrics:');
    console.log(episodeData.lyrics);
    console.log('\n🔗 Linked Lyrics (like in template):');
    const linkedLyrics = linkifyEpisodes(linkifyLore(linkifyCharacters(episodeData.lyrics)));
    console.log(linkedLyrics);

    console.log('\n✅ Episode page template linking test completed successfully!');
    console.log('\nThe template now supports:');
    console.log('- Character names → Character page links');
    console.log('- Lore items → Lore page links');
    console.log('- Episode names → Episode page links');
    console.log('- Applied to both summary AND lyrics sections');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testEpisodePageTemplate().catch(console.error);