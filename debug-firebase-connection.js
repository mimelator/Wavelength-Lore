#!/usr/bin/env node

/**
 * Firebase Connection Diagnostic
 * 
 * Specifically tests Firebase Admin SDK connection to identify permission issues
 */

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = require('dotenv');
    const fs = require('fs');
    const path = require('path');

    // Check if .env file exists in the project root
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath, override: false });
      if (result.error) {
        console.log('⚠️  Error loading .env file:', result.error.message);
      } else {
        console.log('✅ Loaded environment variables from .env file');
      }
    } else {
      console.log('ℹ️  No .env file found - using system environment variables');
    }
  } catch (error) {
    console.log('ℹ️  dotenv not available - using system environment variables');
  }
}

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔥 Firebase Admin SDK Diagnostic');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`PROJECT_ID: ${process.env.PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`STORAGE_BUCKET: ${process.env.STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}`);
console.log(`FIREBASE_SERVICE_ACCOUNT: ${process.env.FIREBASE_SERVICE_ACCOUNT ? '✅ Set (env var)' : '❌ Not set (will use file)'}`);

// Check service account file
console.log('\n🔑 Service Account Check:');
const serviceAccountPath = path.join(__dirname, 'firebaseServiceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ firebaseServiceAccountKey.json exists');
  try {
    const serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log(`   Project ID: ${serviceAccountData.project_id}`);
    console.log(`   Client Email: ${serviceAccountData.client_email}`);
    console.log(`   Private Key: ${serviceAccountData.private_key ? '✅ Present' : '❌ Missing'}`);
  } catch (error) {
    console.log('❌ Error parsing service account file:', error.message);
  }
} else {
  console.log('❌ firebaseServiceAccountKey.json missing');
}

// Test Firebase Admin initialization
async function runDiagnostic() {
console.log('\n🚀 Firebase Admin Initialization Test:');
try {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('🔑 Using service account from environment variable...');
    const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccountJson);
  } else {
    console.log('🔑 Using service account from file...');
    credential = admin.credential.cert(serviceAccountPath);
  }

  const app = admin.initializeApp({
    credential: credential,
    databaseURL: process.env.DATABASE_URL,
    storageBucket: process.env.STORAGE_BUCKET
  }, 'diagnostic-test');

  console.log('✅ Firebase Admin app initialized');

  const database = app.database();
  console.log('✅ Database reference obtained');

  // Test different database paths
  console.log('\n📖 Database Read Tests:');
  
  const testPaths = [
    'videos',
    'videos/season1',
    'videos/season1/episodes',
    'videos/season1/episodes/episode1',
    'characters',
    'lore',
    'forum'
  ];

  async function testDatabasePaths() {
    for (const testPath of testPaths) {
      try {
        console.log(`🔍 Testing ${testPath}...`);
        const ref = database.ref(testPath);
        const snapshot = await ref.once('value');
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            console.log(`   ✅ ${testPath}: ${keys.length} items found`);
          } else {
            console.log(`   ✅ ${testPath}: data found (${typeof data})`);
          }
        } else {
          console.log(`   ⚠️  ${testPath}: no data found`);
        }
      } catch (error) {
        console.log(`   ❌ ${testPath}: ${error.message}`);
        
        // Check for specific permission errors
        if (error.message.includes('Permission denied')) {
          console.log(`      🔒 This is a Firebase security rules issue`);
        } else if (error.message.includes('PERMISSION_DENIED')) {
          console.log(`      🔒 Firebase security rules are blocking access`);
        } else if (error.message.includes('Unauthenticated')) {
          console.log(`      🔑 Authentication issue - service account may be invalid`);
        }
      }
    }
  }

  await testDatabasePaths();

} catch (error) {
  console.log('❌ Firebase Admin initialization failed:', error.message);
  
  if (error.message.includes('credential')) {
    console.log('   🔑 This appears to be a credential issue');
    console.log('   💡 Check that your service account key is valid and has the right permissions');
  } else if (error.message.includes('project')) {
    console.log('   🏗️ This appears to be a project configuration issue');
    console.log('   💡 Verify PROJECT_ID matches your Firebase project');
  }
}

console.log('\n🔍 Firebase Security Rules Check:');
console.log('If you see "Permission denied" errors above, your Firebase security rules');
console.log('may be blocking Admin SDK access. Admin SDK should bypass all rules.');
console.log('');
console.log('Common issues:');
console.log('1. Service account lacks proper IAM roles');
console.log('2. Project ID mismatch');
console.log('3. Invalid or expired service account key');
console.log('4. Database URL pointing to wrong project/region');

console.log('\n✅ Diagnostic completed');
}

// Run the diagnostic
runDiagnostic().catch(error => {
  console.error('❌ Diagnostic failed:', error.message);
  process.exit(1);
});