require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const simpleDisambiguation = require('./helpers/simple-disambiguation');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testSimpleSmartLinking() {
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
  
  simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
  
  const goblinDescription = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
  
  console.log('🧪 Testing simpleSmartLinking function (what lore.ejs actually uses)');
  console.log('');
  console.log('Input:');
  console.log(goblinDescription);
  console.log('');
  
  const result = simpleDisambiguation.applySmartLinkingSimple(goblinDescription);
  console.log('Output from simpleSmartLinking:');
  console.log(result);
  console.log('');
  
  // Check for the broken pattern the user reported
  const hasBrokenPattern = result.includes('misery" class="lore-link"');
  if (hasBrokenPattern) {
    console.log('❌ FOUND BROKEN PATTERN: misery" class="lore-link"');
  } else {
    console.log('✅ No broken pattern detected');
  }
  
  // Also test individual linkifyLoreMentions
  console.log('🔧 Testing loreHelpers.linkifyLoreMentions directly:');
  const directResult = await loreHelpers.linkifyLoreMentions(goblinDescription);
  console.log(directResult);
  
  const directHasBrokenPattern = directResult.includes('misery" class="lore-link"');
  if (directHasBrokenPattern) {
    console.log('❌ Direct loreHelpers also has broken pattern');
  } else {
    console.log('✅ Direct loreHelpers is clean');
  }
}

testSimpleSmartLinking().catch(console.error);