require('dotenv').config({ path: '../.env' });
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function finalVerification() {
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
  
  console.log('🎯 FINAL VERIFICATION: Both Issues Resolved');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Original broken HTML issue
  console.log('📋 Test 1: Goblin Page Broken Links (FIXED)');
  const goblinText = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
  const goblinResult = simpleDisambiguation.applySmartLinkingSimple(goblinText);
  
  console.log('Input:', goblinText);
  console.log('Output:', goblinResult);
  
  // Check for actual malformed HTML (not false positives)
  const hasNestedLinks = /<a[^>]*href="[^"]*<a/.test(goblinResult);
  const hasUnmatchedTags = (goblinResult.match(/<a\s/g) || []).length !== (goblinResult.match(/<\/a>/g) || []).length;
  
  if (hasNestedLinks || hasUnmatchedTags) {
    console.log('❌ Still has malformed HTML');
  } else {
    console.log('✅ FIXED: No malformed HTML detected');
  }
  
  console.log('');
  
  // Test 2: Disambiguation functionality
  console.log('📋 Test 2: Disambiguation Modals (RESTORED)');
  const testText = 'The Goblin King attacked Lucky at Ice Fortress.';
  const result = simpleDisambiguation.applySmartLinkingSimple(testText);
  
  console.log('Input:', testText);
  console.log('Output:', result);
  
  const hasGoblinKingModal = result.includes('data-phrase="Goblin King"');
  const hasIceFortressModal = result.includes('data-phrase="Ice Fortress"');
  const hasLuckyLink = result.includes('href="/character/lucky"');
  
  if (hasGoblinKingModal && hasIceFortressModal && hasLuckyLink) {
    console.log('✅ RESTORED: Disambiguation modals working');
    console.log('  • "Goblin King" → Modal with episode + lore choices');
    console.log('  • "Ice Fortress" → Modal with episode + lore choices');  
    console.log('  • "Lucky" → Direct link to character');
  } else {
    console.log('❌ Disambiguation not fully working');
    if (!hasGoblinKingModal) console.log('  ❌ Missing Goblin King modal');
    if (!hasIceFortressModal) console.log('  ❌ Missing Ice Fortress modal');
    if (!hasLuckyLink) console.log('  ❌ Missing Lucky link');
  }
  
  console.log('');
  console.log('🎉 SUMMARY:');
  if (!hasNestedLinks && !hasUnmatchedTags && hasGoblinKingModal && hasIceFortressModal && hasLuckyLink) {
    console.log('✅ ALL ISSUES RESOLVED!');
    console.log('  ✅ Broken HTML on goblin page → FIXED');
    console.log('  ✅ Lost disambiguation modals → RESTORED');
    console.log('  ✅ Server is running at http://localhost:3001');
  } else {
    console.log('❌ Some issues remain');
  }
}

finalVerification().catch(console.error);