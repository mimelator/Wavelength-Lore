const https = require('https');

console.log('🌊 WAVELENGTH CTA SCHEMA VALIDATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test Firebase Realtime Database directly
const testFirebaseAPI = (path) => {
  return new Promise((resolve, reject) => {
    const url = `https://wavelength-lore-default-rtdb.firebaseio.com/${path}.json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
};

async function validateCTASchema() {
  try {
    console.log('🔍 Testing Firebase Realtime Database API access...');
    
    // Test Alex character
    const alex = await testFirebaseAPI('characters/alex');
    console.log('\n🎭 ALEX CHARACTER VALIDATION:');
    console.log('  Basic Data:', alex ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE');
    
    if (alex) {
      console.log('  Name:', alex.name || 'N/A');
      console.log('  Tagline:', alex.tagline ? '✅ PRESENT' : '❌ MISSING');
      console.log('  Stakes:', alex.stakes ? '✅ PRESENT' : '❌ MISSING');
      console.log('  CTA Text:', alex.cta_text ? '✅ PRESENT' : '❌ MISSING');
      
      if (alex.tagline) console.log('  📝 Tagline Sample:', alex.tagline.substring(0, 60) + '...');
      if (alex.cta_text) console.log('  🎯 CTA Text:', alex.cta_text);
    }
    
    // Test Andrew character
    const andrew = await testFirebaseAPI('characters/andrew');
    console.log('\n🎭 ANDREW CHARACTER VALIDATION:');
    if (andrew?.tagline) {
      console.log('  ✅ Tagline Present:', andrew.tagline);
    } else {
      console.log('  ❌ Tagline Missing');
    }
    
    console.log('\n🎉 CTA SCHEMA VALIDATION COMPLETE!');
    
  } catch (error) {
    console.error('❌ Validation Error:', error.message);
  }
}

validateCTASchema();
