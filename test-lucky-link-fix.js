const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const simpleDisambiguation = require('./helpers/simple-disambiguation');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testLuckyLinkFix() {
  console.log('🔍 Testing Lucky Link Fix...\n');
  
  try {
    // Initialize Firebase and helpers
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Set up helpers
    characterHelpers.setDatabaseInstance(database);
    loreHelpers.setDatabaseInstance(database);
    episodeHelpers.setDatabaseInstance(database);
    
    // Initialize caches
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache()
    ]);
    
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Test text that mentions Lucky (like episode 1 story)
    const testText = `Wavelength is performing a Shire favorite about their mascot, Lucky the Leprechaun, who brings them good luck and helps them overcome challenges.`;
    
    console.log('📝 Test text:');
    console.log(testText);
    console.log('\n🔗 Processing with simpleSmartLinking...\n');
    
    const result = simpleDisambiguation.applySmartLinkingSimple(testText);
    
    console.log('✨ Result:');
    console.log(result);
    console.log('\n🎯 Checking Lucky link...');
    
    if (result.includes('class="character-link"') && result.includes('Lucky')) {
      console.log('✅ SUCCESS: Lucky is linked as a character (👤 hero icon)');
    } else if (result.includes('class="lore-link"') && result.includes('Lucky')) {
      console.log('❌ ISSUE: Lucky is linked as lore (📜 lore icon)');
    } else {
      console.log('⚠️  Lucky is not linked at all');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLuckyLinkFix();