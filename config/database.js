/**
 * Database Configuration Module
 * Handles Firebase initialization and cache management
 */

const firebaseUtils = require('../helpers/firebase-utils');
const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const promptHelpers = require('../helpers/prompt-helpers');
const disambiguationHelpers = require('../helpers/disambiguation-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

/**
 * Initialize Firebase and database connection
 */
async function initializeDatabase() {
  try {
    // Initialize Firebase Admin SDK first (for server-side operations)
    console.log('🔥 Initializing Firebase Admin SDK...');
    const adminDb = firebaseAdminUtils.initializeFirebaseAdmin();
    
    if (!adminDb) {
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test Firebase Admin connection
    try {
      const testData = await firebaseAdminUtils.fetchDataAsAdmin('videos');
      if (testData) {
        console.log('🔥 Firebase Admin connection verified - videos data accessible');
      } else {
        console.log('⚠️ No data available at videos path - check database content');
      }
    } catch (error) {
      console.error('❌ Firebase Admin connection test failed:', error.message);
      // Don't throw here - app can still function with fallback data
    }

    // Initialize Firebase Client SDK (for browser-side operations)
    const database = firebaseUtils.initializeFirebase('wavelength-lore-main');
    console.log('✅ Firebase Client SDK initialized');

    return { adminDb, database };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

/**
 * Initialize all helper caches with shared database instance
 */
async function initializeAllCaches(database) {
  try {
    // Set database instance for all helpers
    characterHelpers.setDatabaseInstance(database);
    loreHelpers.setDatabaseInstance(database);
    episodeHelpers.setDatabaseInstance(database);
    promptHelpers.setDatabaseInstance(database);

    // Initialize caches
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache(),
      promptHelpers.initializePromptCache()
    ]);

    // Get counts for summary
    const characters = characterHelpers.getAllCharactersSync();
    const lore = loreHelpers.getAllLoreSync();
    const episodes = episodeHelpers.getAllEpisodesSync();
    const prompts = promptHelpers.getAllPromptsSync();

    console.log(`🗃️  Content loaded: ${characters.length} characters, ${lore.length} lore items, ${episodes.length} episodes, ${prompts.length} prompts`);

    // Initialize disambiguation helpers with references to other helpers
    disambiguationHelpers.setHelperModules(characterHelpers, loreHelpers, episodeHelpers);

    // Initialize simple disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
  } catch (error) {
    console.error('⚠️  Error initializing caches:', error);
  }
}

module.exports = {
  initializeDatabase,
  initializeAllCaches
};