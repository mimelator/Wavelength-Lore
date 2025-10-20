#!/usr/bin/env node

require('dotenv').config();

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://wavelength-lore-default-rtdb.firebaseio.com'
  });
}

(async () => {
  try {
    console.log('\n🔍 Checking Daphne Lore Status in Firebase\n');
    console.log('='.repeat(60));
    
    const snapshot = await admin.database().ref('lore').once('value');
    const allLore = snapshot.val();
    
    if (!allLore) {
      console.log('❌ No lore found in database');
      process.exit(1);
    }
    
    let found = false;
    Object.entries(allLore).forEach(([id, data]) => {
      if (data.title && data.title.toLowerCase().includes('daphne')) {
        found = true;
        console.log('\n✅ FOUND DAPHNE LORE:\n');
        console.log('   Lore ID:', id);
        console.log('   Title:', data.title);
        console.log('   Type:', data.type);
        console.log('');
        console.log('   📊 Visibility Status:');
        console.log('   -------------------');
        console.log('   Has "visible" field:', data.visible !== undefined ? 'YES' : 'NO');
        console.log('   Current value:', data.visible);
        console.log('');
        console.log('   🔍 What this means:');
        if (data.visible === false) {
          console.log('   ✅ Content is HIDDEN from public');
          console.log('   ✅ Only content creators can see it');
        } else if (data.visible === true) {
          console.log('   👁️  Content is VISIBLE to everyone');
        } else {
          console.log('   👁️  Content is VISIBLE (no field = visible by default)');
        }
        console.log('\n' + '='.repeat(60));
      }
    });
    
    if (!found) {
      console.log('\n❌ No lore object with "Daphne" in title found\n');
      console.log('   Available lore titles:');
      Object.entries(allLore).forEach(([id, data]) => {
        console.log('   -', data.title);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
