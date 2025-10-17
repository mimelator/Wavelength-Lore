#!/usr/bin/env node

/**
 * Test Disambiguation System
 * 
 * This script tests the disambiguation helpers to ensure:
 * - Conflicts are detected correctly
 * - Disambiguation options are provided
 * - Smart linking works as expected
 */

require('dotenv').config({ path: '../.env' });
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const disambiguationHelpers = require('../helpers/disambiguation-helpers');
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

async function testDisambiguation() {
  console.log('🔍 Testing Disambiguation System\n');

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

    // Initialize disambiguation helpers
    disambiguationHelpers.setHelperModules(characterHelpers, loreHelpers, episodeHelpers);

    console.log('✅ All helpers initialized\n');

    // Test texts with known conflicts
    const testTexts = [
      'Ice Fortress is both a place and an episode.',
      'In the Shire, Lucky found the Ice Fortress during the Goblin King episode.',
      'My Lucky Charm is a song that features Lucky in the Shire.',
      'Regular text with no conflicts should work normally.'
    ];

    for (const text of testTexts) {
      console.log('📝 Original text:');
      console.log(text);
      
      console.log('\n🔍 Finding conflicts:');
      const conflicts = disambiguationHelpers.findConflicts(text);
      if (conflicts.length > 0) {
        conflicts.forEach(conflict => {
          console.log(`- "${conflict.phrase}": ${conflict.allMatches.length} matches`);
          conflict.allMatches.forEach(match => {
            console.log(`  • ${match.description} → ${match.url}`);
          });
        });
      } else {
        console.log('No conflicts detected');
      }

      console.log('\n🔗 Smart linking result:');
      const smartLinked = disambiguationHelpers.applySmartLinking(text);
      console.log(smartLinked);
      
      console.log('\n🎛️ Disambiguation modal result:');
      const disambiguated = disambiguationHelpers.applySmartDisambiguation(text, 'modal');
      console.log(disambiguated.substring(0, 200) + (disambiguated.length > 200 ? '...' : ''));
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

    console.log('✅ Disambiguation system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDisambiguation().catch(console.error);