#!/usr/bin/env node

/**
 * Fix Forum Permissions - Quick Firebase Rules Update
 * Addresses permission_denied errors on individual forum post pages
 */

console.log('🔧 FORUM PERMISSIONS FIX');
console.log('========================\n');

console.log('🎯 ISSUE IDENTIFIED:');
console.log('   💥 permission_denied at /forum/posts/-OcTbtaEggzkTFS5FnSZ');
console.log('   💥 permission_denied at /forum/replies');
console.log('   👤 User has admin groups: [\'admin\', \'content_manager\']');
console.log('   🔒 Firebase security rules blocking client-side access\n');

console.log('🚀 IMMEDIATE SOLUTION:');
console.log('   Apply these Firebase Realtime Database rules:\n');

const quickFixRules = {
  "rules": {
    "lore": {
      ".read": true,
      ".write": "auth != null && auth.token.isScript == true"
    },
    "characters": {
      ".read": true,
      ".write": "auth != null && auth.token.isScript == true"
    },
    "episodes": {
      ".read": true,
      ".write": "auth != null && auth.token.isScript == true"
    },
    "forum": {
      "posts": {
        ".read": true,
        ".write": "auth != null"
      },
      "replies": {
        ".read": true,
        ".write": "auth != null"
      },
      "users": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
};

console.log(JSON.stringify(quickFixRules, null, 2));

console.log('\n📋 STEPS TO FIX:');
console.log('1. 🌐 Go to: https://console.firebase.google.com/');
console.log('2. 📂 Select: wavelength-lore project');
console.log('3. 🗄️  Navigate: Realtime Database > Rules');
console.log('4. 📝 Replace existing rules with the JSON above');
console.log('5. 🚀 Click "Publish"');

console.log('\n⚡ ALTERNATIVE - Development Rules (Less Secure):');
const devRules = {
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
};
console.log(JSON.stringify(devRules, null, 2));

console.log('\n✅ After applying rules, individual forum posts will work!');
console.log('🎯 This fixes the permission_denied errors blocking post display.');

process.exit(0);