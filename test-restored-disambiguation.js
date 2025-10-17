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

async function testRestoredDisambiguation() {
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
  
  console.log('🎭 Testing Restored Disambiguation Functionality');
  console.log('');

  const testText = 'The Goblin King attacked Lucky at Ice Fortress.';
  console.log('Input:', testText);
  console.log('');
  
  const result = simpleDisambiguation.applySmartLinkingSimple(testText);
  console.log('Output:', result);
  console.log('');
  
  // Check for disambiguation spans
  const hasDisambiguation = result.includes('disambiguation-link');
  if (hasDisambiguation) {
    console.log('✅ Disambiguation functionality restored!');
    console.log('✅ "Goblin King" and "Ice Fortress" should show modal choices');
  } else {
    console.log('❌ No disambiguation found - checking for regular links...');
    const hasRegularLinks = result.includes('<a href');
    if (hasRegularLinks) {
      console.log('✅ Regular links are working');
    } else {
      console.log('❌ No links at all');
    }
  }
  
  // Test the problematic goblin description too
  console.log('');
  console.log('🧪 Testing Goblin Description (should not break):');
  const goblinText = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
  const goblinResult = simpleDisambiguation.applySmartLinkingSimple(goblinText);
  console.log('Goblin Result:', goblinResult);
  
  // Check for broken HTML
  const brokenHTML = goblinResult.includes('misery" class="lore-link"');
  if (brokenHTML) {
    console.log('❌ Still has broken HTML');
  } else {
    console.log('✅ No broken HTML detected');
  }
}

testRestoredDisambiguation().catch(console.error);