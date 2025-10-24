#!/usr/bin/env node

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../firebaseServiceAccountKey.json')),
  databaseURL: 'https://wavelength-lore-default-rtdb.firebaseio.com'
});

const db = admin.database();

console.log('\n🧪 Checking preview cache images...\n');

db.ref('merchandise/previewCache').once('value')
  .then(snapshot => {
    const data = snapshot.val() || {};
    const keys = Object.keys(data);
    
    console.log(`Total: ${keys.length}`);
    
    let withImages = 0;
    let withoutImages = 0;
    
    keys.forEach(key => {
      const product = data[key];
      if (product.images && product.images.length > 0) {
        withImages++;
      } else {
        withoutImages++;
        console.log(`❌ ${product.productId || key}: NO images`);
      }
    });
    
    console.log(`\n✅ With images: ${withImages}`);
    console.log(`❌ Without images: ${withoutImages}\n`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
