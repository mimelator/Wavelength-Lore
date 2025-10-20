#!/usr/bin/env node

/**
 * Check episode ordering from Firebase videos structure
 */

// Load environment variables
require('dotenv').config();

const firebaseUtils = require('../helpers/firebase-utils');

async function checkEpisodeOrder() {
  try {
    // Initialize Firebase
    firebaseUtils.initializeFirebase('check-episode-order');
    
    // Fetch videos data
    const videos = await firebaseUtils.fetchFromFirebase('videos');
    
    if (!videos) {
      console.error('❌ No videos data found');
      process.exit(1);
    }
    
    console.log('\n📊 Checking Episode Order\n');
    console.log('='.repeat(60));
    
    // Check season ordering
    const seasonKeys = Object.keys(videos);
    console.log('\n🎬 Season Keys (as returned by Object.keys):');
    console.log(seasonKeys);
    
    // Check each season's episodes
    seasonKeys.forEach(seasonKey => {
      const season = videos[seasonKey];
      if (season.episodes) {
        const episodeKeys = Object.keys(season.episodes);
        console.log(`\n📺 ${seasonKey} Episode Keys:`);
        console.log(episodeKeys);
        
        // Show first 3 episode titles in order
        console.log(`First 3 episodes in "${seasonKey}":`);
        episodeKeys.slice(0, 3).forEach(epKey => {
          const ep = season.episodes[epKey];
          console.log(`  - ${epKey}: ${ep.title}`);
        });
      }
    });
    
    // Check if keys are numeric-sorted vs insertion-sorted
    console.log('\n\n🔍 Order Analysis:');
    const season1Episodes = Object.keys(videos.season1?.episodes || {});
    console.log('Expected order: episode1, episode2, episode3...');
    console.log('Actual order:  ', season1Episodes.slice(0, 3).join(', ') + '...');
    
    if (season1Episodes[0] === 'episode1' && 
        season1Episodes[1] === 'episode2' && 
        season1Episodes[2] === 'episode3') {
      console.log('✅ Episodes appear to be in correct order');
    } else {
      console.log('⚠️  Episodes may not be in expected order');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEpisodeOrder();
