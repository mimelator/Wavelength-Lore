#!/usr/bin/env node

/**
 * Firebase Auth Domain Checker
 * Displays current Firebase project configuration for troubleshooting
 */

const envHelper = require('./env-helper');

function checkFirebaseConfig() {
  console.log('🔍 Firebase Authentication Configuration Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  try {
    const config = envHelper.getFirebaseConfig();
    
    console.log('📋 Current Firebase Configuration:');
    console.log(`   Project ID: ${config.projectId}`);
    console.log(`   Auth Domain: ${config.authDomain}`);
    console.log(`   Database URL: ${config.databaseURL ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    console.log('🌐 Expected Production Domains:');
    console.log('   ✅ localhost (development)');
    console.log('   ✅ wavelengthlore.com (production)');
    console.log('   ✅ www.wavelengthlore.com (www variant)');
    console.log('');
    
    console.log('🔧 To Fix auth/unauthorized-domain Error:');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log(`2. Select project: ${config.projectId}`);
    console.log('3. Navigate: Authentication → Settings → Authorized domains');
    console.log('4. Click "Add domain" and add: wavelengthlore.com');
    console.log('5. If using www, also add: www.wavelengthlore.com');
    console.log('');
    
    console.log('💡 Current Issue:');
    console.log('   Firebase is blocking auth requests from unauthorized domain');
    console.log('   This affects: signInWithPopup, signInWithRedirect, linkWithPopup');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error reading Firebase configuration:', error.message);
  }
}

// Run the checker
checkFirebaseConfig();