const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const serviceAccount = require('./firebaseServiceAccountKey.json');
require('dotenv').config();

async function testDirectFirebaseAccess() {
  console.log('🔍 Testing direct Firebase database access...');
  
  try {
    // Initialize Firebase Admin (like populate script does)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.DATABASE_URL
      });
    }
    
    // Generate custom token and initialize client
    const customToken = await admin.auth().createCustomToken('test_script');
    
    const firebaseApp = initializeApp({
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      databaseURL: process.env.DATABASE_URL,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID
    });

    const { getAuth, signInWithCustomToken } = require('firebase/auth');
    const firebaseAuth = getAuth(firebaseApp);
    await signInWithCustomToken(firebaseAuth, customToken);
    
    const database = getDatabase(firebaseApp);
    
    // Test lore retrieval
    console.log('📡 Querying lore from Firebase...');
    const loreRef = ref(database, 'lore');
    const snapshot = await get(loreRef);
    
    if (snapshot.exists()) {
      const loreData = snapshot.val();
      console.log('✅ Lore data found in Firebase!');
      console.log('📊 Lore items in database:');
      
      for (const key in loreData) {
        const item = loreData[key];
        console.log(`  - ${key}: ${item.title || 'No title'} (${item.type || 'no type'})`);
        if (item.description) {
          console.log(`    Description: ${item.description.substring(0, 60)}...`);
        }
        console.log(`    Image: ${item.image ? 'Present' : 'Missing'}`);
      }
      
      console.log('\n🎯 Testing individual item retrieval:');
      const shireRef = ref(database, 'lore/the-shire');
      const shireSnapshot = await get(shireRef);
      
      if (shireSnapshot.exists()) {
        const shireData = shireSnapshot.val();
        console.log('✅ Successfully retrieved "the-shire" directly:');
        console.log(`   Title: ${shireData.title}`);
        console.log(`   Type: ${shireData.type}`);
        console.log(`   Has description: ${!!shireData.description}`);
        console.log(`   Has image: ${!!shireData.image}`);
      } else {
        console.log('❌ Could not retrieve "the-shire" directly');
      }
      
    } else {
      console.log('❌ No lore data found in Firebase');
    }
    
    console.log('\n🎉 Firebase test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testDirectFirebaseAccess();