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
function initializeDatabase() {
  // Initialize Firebase and database connection
  const database = firebaseUtils.initializeFirebase('wavelength-lore-main');

  // Initialize Firebase Admin SDK
  firebaseAdminUtils.initializeFirebaseAdmin();

  // Test Firebase connection using admin SDK
  (async () => {
    try {
      const testData = await firebaseAdminUtils.fetchDataAsAdmin('videos');
      if (testData) {
        console.log('🔥 Firebase connection verified');
      } else {
        console.log('⚠️ No data available at videos path');
      }
    } catch (error) {
      console.error('❌ Firebase connection error:', error);
    }
  })();

  return database;
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