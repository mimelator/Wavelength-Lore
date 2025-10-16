#!/usr/bin/env node

/**
 * Test script for Episode Linking System
 * 
 * This script tests the episode helpers to ensure:
 * - Episode data loads from Firebase
 * - Episode linking works correctly
 * - Cache functions properly
 */

require('dotenv').config();
const episodeHelpers = require('./helpers/episode-helpers');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

// Firebase configuration (same as main app)
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testEpisodeLinking() {
  console.log('🧪 Testing Episode Linking System\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Set database instance and initialize cache
    episodeHelpers.setDatabaseInstance(database);
    console.log('📡 Database instance set');

    // Initialize episode cache
    console.log('🔄 Initializing episode cache...');
    await episodeHelpers.initializeEpisodeCache();
    
    // Test getting all episodes
    console.log('📺 Testing getAllEpisodes...');
    const episodes = await episodeHelpers.getAllEpisodes();
    console.log(`✅ Found ${episodes.length} episodes`);
    
    if (episodes.length > 0) {
      console.log('Sample episodes:', episodes.slice(0, 3).map(e => ({ id: e.id, title: e.title })));
    }

    // Test sync version
    console.log('\n📺 Testing getAllEpisodesSync...');
    const episodesSync = episodeHelpers.getAllEpisodesSync();
    console.log(`✅ Sync version returned ${episodesSync.length} episodes`);

    // Test episode linking
    console.log('\n🔗 Testing episode linking...');
    const testTexts = [
      "In The Last Light we saw amazing character development.",
      "The events of Departure are crucial to understanding the story.",
      "Both The Last Light and Departure set up important plot points.",
      "This is just regular text with no episode names.",
      "The episode called The Last Light was fantastic."
    ];

    for (const text of testTexts) {
      console.log(`\nOriginal: "${text}"`);
      const linked = await episodeHelpers.linkifyEpisodeMentions(text);
      console.log(`Linked: "${linked}"`);
      
      // Test sync version
      const linkedSync = episodeHelpers.linkifyEpisodeMentionsSync(text);
      console.log(`Sync: "${linkedSync}"`);
    }

    // Test individual episode link generation
    if (episodes.length > 0) {
      console.log('\n🔗 Testing individual episode link generation...');
      const firstEpisode = episodes[0];
      const link = await episodeHelpers.generateEpisodeLink(firstEpisode.id);
      console.log(`Episode "${firstEpisode.title}" link: ${link}`);
      
      const linkSync = episodeHelpers.generateEpisodeLinkSync(firstEpisode.id);
      console.log(`Sync version: ${linkSync}`);
    }

    // Test cache functions
    console.log('\n🗄️ Testing cache functions...');
    console.log('Cache status before clear:', episodeHelpers.getAllEpisodesSync().length > 0 ? 'populated' : 'empty');
    
    episodeHelpers.clearEpisodeCache();
    console.log('Cache status after clear:', episodeHelpers.getAllEpisodesSync().length > 0 ? 'populated' : 'empty');
    
    await episodeHelpers.initializeEpisodeCache();
    console.log('Cache status after reinitialize:', episodeHelpers.getAllEpisodesSync().length > 0 ? 'populated' : 'empty');

    console.log('\n🎉 All episode linking tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEpisodeLinking().catch(console.error);