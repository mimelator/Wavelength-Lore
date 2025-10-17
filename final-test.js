require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const loreHelpers = require('./helpers/lore-helpers');
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

async function finalTest() {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  
  loreHelpers.setDatabaseInstance(database);
  await loreHelpers.initializeLoreCache();
  
  simpleDisambiguation.setHelperInstances(null, loreHelpers, null);
  
  const problemText = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
  
  console.log('🚀 FINAL TEST: Checking if the fix works');
  console.log('');
  console.log('Input text:');
  console.log(problemText);
  console.log('');
  
  const result = simpleDisambiguation.applySmartLinkingSimple(problemText);
  console.log('Output:');
  console.log(result);
  console.log('');
  
  // Test for broken patterns
  const brokenPatterns = [
    /href="\/lore\/<a/,                    // Nested link in href
    />[^<]*<a href/,                       // Link inside text content
    /misery" class="lore-link" title="[^>]*>[^<]*$/ // Broken at end
  ];
  
  let isBroken = false;
  brokenPatterns.forEach((pattern, index) => {
    if (pattern.test(result)) {
      console.log(`❌ Found broken pattern ${index + 1}`);
      isBroken = true;
    }
  });
  
  if (!isBroken) {
    console.log('✅ No broken HTML patterns detected!');
  }
  
  // Count links
  const openLinks = (result.match(/<a\s/g) || []).length;
  const closeLinks = (result.match(/<\/a>/g) || []).length;
  
  console.log(`📊 Generated ${openLinks} links (${closeLinks} closing tags)`);
  
  if (openLinks === closeLinks) {
    console.log('✅ All links properly balanced');
  } else {
    console.log('❌ Unbalanced link tags!');
  }
  
  // Final check: Does it match expected pattern?
  const expectedPattern = /called a <a href="\/lore\/misery"[^>]*>Misery of Goblins<\/a>/;
  if (expectedPattern.test(result)) {
    console.log('✅ "Misery of Goblins" is correctly linked as a single phrase');
  } else {
    console.log('❌ "Misery of Goblins" linking is not working as expected');
  }
  
  console.log('');
  console.log('🎯 VERDICT:');
  if (!isBroken && openLinks === closeLinks && expectedPattern.test(result)) {
    console.log('✅ FIXED! The linking system is working correctly.');
  } else {
    console.log('❌ Still has issues that need to be addressed.');
  }
}

finalTest().catch(console.error);