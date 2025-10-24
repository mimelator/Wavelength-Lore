const utils = require('./helpers/firebase-admin-utils');

console.log('Testing Firebase Admin SDK initialization...');
const db = utils.initializeFirebaseAdmin();
console.log('Admin DB initialized:', !!db);

if (db) {
  console.log('✅ Firebase Admin SDK is working!');
} else {
  console.log('❌ Firebase Admin SDK failed to initialize');
}
