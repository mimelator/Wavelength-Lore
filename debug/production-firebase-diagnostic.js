/**
 * Production Firebase Diagnostic Tool
 * 
 * Run this to diagnose Firebase issues in production
 * Usage: node debug/production-firebase-diagnostic.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔍 Firebase Production Diagnostic Tool\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? '✅ Set' : '❌ Missing');
console.log('  PROJECT_ID:', process.env.PROJECT_ID ? '✅ Set' : '❌ Missing');

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('  Service Account Parse:', '✅ Valid JSON');
    console.log('  Project ID in SA:', serviceAccount.project_id || '❌ Missing');
    console.log('  Client Email:', serviceAccount.client_email ? '✅ Present' : '❌ Missing');
  } catch (e) {
    console.log('  Service Account Parse:', '❌ Invalid JSON:', e.message);
  }
}

console.log('\n🔥 Firebase Admin SDK Test:');

try {
  // Test Firebase Admin initialization
  const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
  const database = firebaseAdminUtils.initializeFirebaseAdmin();
  
  if (database) {
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test database read
    console.log('\n📖 Database Read Test:');
    firebaseAdminUtils.fetchDataAsAdmin('videos')
      .then(data => {
        if (data) {
          const videoCount = Object.keys(data).length;
          console.log(`✅ Successfully read videos data (${videoCount} seasons)`);
        } else {
          console.log('⚠️ No videos data found');
        }
      })
      .catch(error => {
        console.log('❌ Database read failed:', error.message);
      });
      
    // Test characters read
    firebaseAdminUtils.fetchDataAsAdmin('characters')
      .then(data => {
        if (data) {
          const charCount = Object.keys(data).length;
          console.log(`✅ Successfully read characters data (${charCount} characters)`);
        } else {
          console.log('⚠️ No characters data found');
        }
      })
      .catch(error => {
        console.log('❌ Characters read failed:', error.message);
      });
      
  } else {
    console.log('❌ Firebase Admin SDK initialization failed');
  }
} catch (error) {
  console.log('❌ Firebase Admin initialization error:', error.message);
}

console.log('\n🌐 Client SDK Test:');
try {
  const firebaseUtils = require('../helpers/firebase-utils');
  
  if (firebaseUtils.isFirebaseReady()) {
    console.log('✅ Client SDK is ready');
  } else {
    console.log('⚠️ Client SDK not ready, initializing...');
    firebaseUtils.initializeFirebase('diagnostic');
    console.log('✅ Client SDK initialized');
  }
} catch (error) {
  console.log('❌ Client SDK error:', error.message);
}

console.log('\n📊 Summary:');
console.log('This diagnostic helps identify:');
console.log('  1. Missing environment variables');
console.log('  2. Firebase Admin SDK initialization issues');
console.log('  3. Database connectivity problems');
console.log('  4. Service account configuration errors');