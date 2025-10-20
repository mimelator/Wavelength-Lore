#!/usr/bin/env node

/**
 * Verify episode sorting is working correctly
 */

// Load environment variables
require('dotenv').config();

const firebaseUtils = require('../helpers/firebase-utils');
const episodeHelpers = require('../helpers/episode-helpers');

async function verifyEpisodeSorting() {
  try {
    console.log('\n🔍 Verifying Episode Sorting\n');
    console.log('='.repeat(60));
    
    // Test 1: Check helper function sorting
    console.log('\n📊 Test 1: Episode Helper Sorting');
    await episodeHelpers.initializeEpisodeCache();
    const allEpisodes = episodeHelpers.getAllEpisodesSync();
    
    console.log(`Total episodes: ${allEpisodes.length}`);
    console.log('\nFirst 15 episodes:');
    allEpisodes.slice(0, 15).forEach((ep, index) => {
      console.log(`${index + 1}. [${ep.season}/${ep.episode}] ${ep.title}`);
    });
    
    // Test 2: Check if sorted correctly
    console.log('\n\n✅ Validation:');
    let isCorrectOrder = true;
    for (let i = 1; i < allEpisodes.length; i++) {
      const prev = allEpisodes[i - 1];
      const curr = allEpisodes[i];
      
      const prevSeason = parseInt(prev.season.replace('season', ''));
      const currSeason = parseInt(curr.season.replace('season', ''));
      const prevEpisode = parseInt(prev.episode.replace('episode', ''));
      const currEpisode = parseInt(curr.episode.replace('episode', ''));
      
      if (prevSeason > currSeason || 
          (prevSeason === currSeason && prevEpisode > currEpisode)) {
        console.log(`❌ Out of order: ${prev.season}/${prev.episode} comes before ${curr.season}/${curr.episode}`);
        isCorrectOrder = false;
      }
    }
    
    if (isCorrectOrder) {
      console.log('✅ All episodes are in correct chronological order!');
    }
    
    // Test 3: Check season boundaries
    console.log('\n\n📺 Season Boundaries:');
    const seasons = {};
    allEpisodes.forEach(ep => {
      if (!seasons[ep.season]) {
        seasons[ep.season] = [];
      }
      seasons[ep.season].push(ep);
    });
    
    Object.keys(seasons).sort().forEach(seasonKey => {
      const episodes = seasons[seasonKey];
      console.log(`${seasonKey}: ${episodes.length} episodes (${episodes[0].episode} to ${episodes[episodes.length - 1].episode})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyEpisodeSorting();
