require('dotenv').config({ path: '../.env' });
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const loreHelpers = require('../helpers/lore-helpers');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testFixedLinking() {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  
  loreHelpers.setDatabaseInstance(database);
  await loreHelpers.initializeLoreCache();
  
  const problemText = 'Since Misery loves Company, Goblins often travel in groups called a Misery of Goblins, spreading fear and terror wherever they go.';
  
  console.log('🧪 Testing Fixed Linking Logic');
  console.log('');
  console.log('Original text:');
  console.log(problemText);
  console.log('');
  
  const result = await loreHelpers.linkifyLoreMentions(problemText);
  console.log('After linking:');
  console.log(result);
  console.log('');
  
  // Check for broken HTML
  const brokenHtmlCheck = result.includes('misery" class="lore-link"');
  if (brokenHtmlCheck) {
    console.log('❌ Still contains broken HTML!');
  } else {
    console.log('✅ No broken HTML detected!');
  }
  
  // Count links
  const linkCount = (result.match(/<a\s[^>]*>/g) || []).length;
  console.log(`📊 Generated ${linkCount} links`);
  
  // Validate all links are properly closed
  const openLinks = (result.match(/<a\s[^>]*>/g) || []).length;
  const closeLinks = (result.match(/<\/a>/g) || []).length;
  
  if (openLinks === closeLinks) {
    console.log('✅ All links properly opened and closed');
  } else {
    console.log('❌ Mismatched link tags!');
  }
}

testFixedLinking().catch(console.error);